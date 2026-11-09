import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {scoreKey,compareRuns} from '../src/ranked.js';
import {makePlan} from './helpers/legacy-reward-plan.mjs';
const enabled=!!process.env.SQS_PGLITE;
test('SQL16 upgrades combined board, settle and prize order while preserving week0 and private score helper',{skip:!enabled},async()=>{
 const {PGlite}=await import(pathToFileURL(process.env.SQS_PGLITE)),db=new PGlite(),sql=n=>readFile(new URL('../tools/supabase/'+n+'.sql',import.meta.url),'utf8');
 try{
  await db.exec('create role anon;create role authenticated;');
  for(const n of ['schema','update2','update3','ranked','payouts','update4','update5','update6','update7','update8','update9','update10','update14','update15'])await db.exec(await sql(n));
  const rpc=async(fn,p)=>(await db.query(`select ${fn}(${Object.keys(p).map((k,i)=>`${k}=>$${i+1}`).join(',')}) r`,Object.values(p))).rows[0].r;
  await db.exec("update sqs_admin set v=encode(sha256(convert_to(case when k='payout_key_sha256' then 'payout-key' when k='reports_key_sha256' then 'reports-key' else 'server-key' end,'UTF8')),'hex');");
  // A real pre16 KPM definition proves migration16 itself upgrades an existing database.
  await db.exec(`create or replace function sqs_ranked_score(p_week int,p_won boolean,p_t int,p_kills int) returns bigint[] language sql immutable set search_path=pg_catalog as $$select case when p_week>=1 then array[case when coalesce(p_t,0)>=180 then 1 else 0 end::bigint,case when coalesce(p_t,0)>0 then greatest(coalesce(p_kills,0),0)::bigint*60000000/p_t else 0 end,coalesce(p_kills,0)::bigint] else array[0::bigint,coalesce(p_t,0)::bigint,coalesce(p_kills,0)::bigint] end$$;`);
  const callScore=(week,t,kills)=>rpc('sqs_ranked_score',{p_week:week,p_won:false,p_t:t,p_kills:kills});
  const old0=await callScore(0,1200,12000);assert.deepEqual(old0,[0,1200,12000]);
  await db.exec(await sql('update16'));await db.exec(await sql('update16'));
  assert.deepEqual(await callScore(1,1200,12000),[1,13200,600000000,12000]);
  for(const [t,kills] of [[179,100000],[180,60],[601,100],[0,0],[7200,2147483647],[null,null],[-3,-4]]){
   for(const week of [0,1,2])assert.deepEqual(await callScore(week,t,kills),scoreKey(week,{t,kills}));
  }
  assert.deepEqual(await callScore(0,1200,12000),old0);
  const rows=[{id:1,t:179,kills:100000},{id:2,t:1200,kills:6000},{id:3,t:3600,kills:9000},{id:4,t:600,kills:2000},{id:5,t:1200,kills:1400},{id:6,t:600,kills:2000},{id:7,t:600,kills:2000}];
  for(const r of rows){r.wallet='0x'+String(r.id).padStart(40,'0');r.at=Date.UTC(2026,10,10)+Math.min(r.id,6);
   await db.query("insert into sqs_ranked_entries(id,week,mode,wallet,tx,paid,ip_hash,seed,adv,name,t,kills,level,verdict,started_at,claimed_at,finished_at) values($1,1,'hard',$2,$3,2000000000000000000,'fixture',1,'adventurer',$4,$5,$6,5,'ok',to_timestamp($7/1000.0),to_timestamp($7/1000.0),to_timestamp($7/1000.0))",[r.id,r.wallet,'0x'+String(r.id).padStart(64,'0'),'P'+r.id,r.t,r.kills,r.at]);
  }
  const expected=[...rows].sort(compareRuns(1)).map(r=>'P'+r.id);
  const board=await rpc('sqs_ranked_board',{p_week:1,p_mode:'hard'});assert.deepEqual(board.rows.map(r=>r.name),expected);
  const report=await rpc('sqs_ranked_settle',{p_key:'reports-key',p_week:1,p_mode:'hard'});assert.equal(report.rules,'combined');assert.deepEqual(report.top.map(r=>r.name),expected);
  // The clock is substituted only in disposable definitions; no production clock or records are touched.
  await db.exec("create function sqs_fixture_now() returns timestamptz language sql stable as $$select '2026-11-16T03:01:00Z'::timestamptz$$;");
  await db.exec((await sql('update16')).replace(/\b(?:now|clock_timestamp)\(\)/g,'sqs_fixture_now()'));
  const plan=makePlan(report,'0',1);assert.deepEqual(plan.prizes.map(p=>p.wallet),[...rows].sort(compareRuns(1)).filter(r=>r.t>=180).slice(0,5).map(r=>r.wallet));
  assert.equal((await rpc('sqs_payout_plan',{p_key:'payout-key',p_week:1,p_mode:'hard',p_plan:plan})).ok,true);
  const snapshot=(await db.query('select * from sqs_ranked_payout_weeks')).rows;await db.exec(await sql('update16'));assert.deepEqual((await db.query('select * from sqs_ranked_payout_weeks')).rows,snapshot);
  const acl=(await db.query("select has_function_privilege('anon','sqs_ranked_score(int,boolean,int,int)','execute') a,has_function_privilege('authenticated','sqs_ranked_score(int,boolean,int,int)','execute') b")).rows[0];assert.deepEqual(acl,{a:false,b:false});
 }finally{await db.close();}
});
