import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sqlDB} from './helpers/payout-sql-db.mjs';
import {createSim} from '../src/sim.js';
import {startRunStats,captureRunStats} from '../src/run-stats.js';
const who='0x'+'1'.repeat(40),sha='1'.repeat(64),key='c:'+'a'.repeat(64);
function data(){const s=createSim(),p=s.players[0];startRunStats(p);return{kind:'casual',map:'greentown',adv:'adventurer',hard:false,endless:false,t:900,kills:100,level:10,won:true,build:'test-stats',sim:'a'.repeat(12),week:null,stats:captureRunStats(s,p)};}
async function setup(){const f=await sqlDB({current:true});for(const n of [19,20,21,22])await f.db.exec(await readFile(new URL(`../tools/supabase/update${n}.sql`,import.meta.url),'utf8'));return f;}
test('SQL22 retains private idempotent builds independently of score pruning and normal-to-endless retries',{skip:!process.env.SQS_PGLITE},async()=>{
 const {db,rpc}=await setup();try{
  assert((await db.query("select to_regclass('public.sqs_run_stats') t")).rows[0].t,'Retained statistics table exists');
  const first=data(),save=d=>rpc('sqs_record_run_stats',{p_server_key:'server-key',p_run_key:key,p_source:'client',p_data:d,p_ip:'b'.repeat(64)});
  assert.equal((await save(first)).ok,true);assert.equal((await save(first)).ok,true);assert.equal((await db.query('select count(*) n from sqs_run_stats')).rows[0].n,1);
  const endless={...first,endless:true,won:false,t:1200,kills:200};assert.equal((await save(endless)).ok,true);assert.equal((await save(first)).ok,true);assert.equal((await db.query('select data from sqs_run_stats')).rows[0].data.t,1200);
  await db.exec('delete from sqs_scores');assert.equal((await db.query('select count(*) n from sqs_run_stats')).rows[0].n,1);
  const before=(await db.query('select * from sqs_run_stats')).rows;await db.exec(await readFile(new URL('../tools/supabase/update22.sql',import.meta.url),'utf8'));assert.deepEqual((await db.query('select * from sqs_run_stats')).rows,before);
  const grants=(await db.query("select has_table_privilege('anon','sqs_run_stats','select') a,has_table_privilege('authenticated','sqs_run_stats','select') u,(select relrowsecurity from pg_class where oid='sqs_run_stats'::regclass) r")).rows[0];assert.deepEqual(grants,{a:false,u:false,r:true});
  await db.exec('set role anon');await assert.rejects(db.query('select * from sqs_run_stats'),/permission denied/);
 }finally{await db.close();}
});
test('SQL22 rejects bad keys, identity fields, invalid counters and forged ranked provenance',{skip:!process.env.SQS_PGLITE},async()=>{
 const {db,rpc}=await setup();try{
  assert((await db.query("select to_regclass('public.sqs_run_stats') t")).rows[0].t);
  const save=(d,changes={})=>rpc('sqs_record_run_stats',{p_server_key:'server-key',p_run_key:key,p_source:'client',p_data:d,p_ip:'b'.repeat(64),...changes});
  assert.equal((await save(data(),{p_server_key:'bad'})).error,'forbidden');
  for(const mutate of [d=>d.wallet=who,d=>d.t=-1,d=>d.stats.chosen.weapon.bow=-1,d=>d.stats.weapons.katana='1',d=>d.stats.offered=null,d=>d.stats.gear.head={},d=>d.stats.quality.weapons.katana=10001]){const d=data();mutate(d);assert.equal((await save(d)).error,'bad run statistics');}
  assert.equal((await save({...data(),kind:'ranked',week:1},{p_run_key:'r:999',p_source:'ranked'})).error,'unverified ranked statistics');
  assert.equal((await db.query('select count(*) n from sqs_run_stats')).rows[0].n,0);
 }finally{await db.close();}
});
test('SQL22 accepts max-level weapons and keeps Slimer/Wise Old Man scenarios separate',{skip:!process.env.SQS_PGLITE},async()=>{
 const {db,rpc}=await setup();try{
  const first=data();first.stats.weapons.katana=6;first.kind='fun';first.won=false;
  assert.equal((await rpc('sqs_record_run_stats',{p_server_key:'server-key',p_run_key:key,p_source:'client',p_data:first,p_ip:'b'.repeat(64)})).ok,true);
  const wise={...first,kind:'wizard',adv:'wise-old-man'};assert.equal((await rpc('sqs_record_run_stats',{p_server_key:'server-key',p_run_key:'c:'+'c'.repeat(64),p_source:'client',p_data:wise,p_ip:'d'.repeat(64)})).ok,true);
 }finally{await db.close();}
});
test('SQL22 versioned finish saves verified builds atomically and cannot reject a valid paid result on analytics failure',{skip:!process.env.SQS_PGLITE},async()=>{
 const {db,rpc}=await setup();try{
  assert((await db.query("select to_regprocedure('public.sqs_ranked_finish_v3(text,bigint,text,bigint,text,uuid,text,integer,integer,integer,boolean,text,text,jsonb)') t")).rows[0].t,'Versioned finish exists');
  await db.exec("create or replace function pg_catalog.now() returns timestamptz language sql stable as $$select '2026-11-15T12:00:00Z'::timestamptz$$;");
  async function finish(id,stats){
   const at=Date.UTC(2026,10,15,11,45),attempt='00000000-0000-4000-8000-'+String(id).padStart(12,'0');
   await db.query("insert into sqs_ranked_entries(id,week,mode,wallet,tx,paid,ip_hash,seed,adv,started_at,claimed_at,submit_sha,submit_attempt) values($1,1,'normal',$2,$3,1000000000000000000,'fixture',1,'adventurer',to_timestamp($4::numeric/1000),now(),$5,$6)",[id,who,'0x'+String(id).padStart(64,'0'),at,sha,attempt]);
   const params={p_server_key:'server-key',p_id:id,p_wallet:who,p_started:at,p_log_sha:sha,p_attempt:attempt,p_name:'fixture',p_t:900,p_kills:100,p_level:10,p_won:false,p_verdict:'ok',p_log:'fixture',p_stats:stats};
   const result=await rpc('sqs_ranked_finish_v3',params);assert.equal(result.ok,true,JSON.stringify(result));assert.equal(result.verdict,'ok');assert.deepEqual(await rpc('sqs_ranked_finish_v3',params),result);return result;
  }
  const verified={...data(),kind:'ranked',map:'apache',week:1,won:false};await finish(101,verified);const row=(await db.query("select source,entry_id,data from sqs_run_stats where run_key='r:101'")).rows[0];assert.equal(row.source,'ranked');assert.equal(row.entry_id,101);assert.deepEqual(row.data,verified);
  await finish(102,{...verified,wallet:who});assert.equal((await db.query("select count(*) n from sqs_run_stats where run_key='r:102'")).rows[0].n,0);assert.equal((await db.query('select verdict from sqs_ranked_entries where id=102')).rows[0].verdict,'ok');
  await finish(103,null);assert.equal((await db.query('select verdict from sqs_ranked_entries where id=103')).rows[0].verdict,'ok');
 }finally{await db.close();}
});
