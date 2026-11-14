import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sqlDB} from './helpers/payout-sql-db.mjs';
import {makePlan} from '../tools/payout/core.mjs';

const a='0x'+'1'.repeat(40),b='0x'+'2'.repeat(40),c='0x'+'3'.repeat(40),unit=10n**18n;
test('SQL19 preserves old boards, admits both wagers into normal, and independently settles contribution/time',{skip:!process.env.SQS_PGLITE},async()=>{
 const {db,rpc}=await sqlDB({current:true});
 try{
  const board=()=>rpc('sqs_ranked_board',{p_week:1,p_mode:'normal'}),before=await board();
  const migration=await readFile(new URL('../tools/supabase/update19.sql',import.meta.url),'utf8');
  await db.exec(migration);await db.exec(migration);
  assert.deepEqual(await board(),before,'legacy public contract stays compatible before activation');
  const ready=await rpc('sqs_ranked_can_enter_v2',{p_server_key:'server-key',p_wallet:a,p_week:1,p_ip_hash:a,p_max:1000000,p_mode:'normal'});assert.equal(ready.reward_version,2);assert.equal(ready.ok,true);
  await db.exec("create or replace function pg_catalog.now() returns timestamptz language sql stable as $$ select '2026-11-13T12:00:00Z'::timestamptz $$; create or replace function pg_catalog.clock_timestamp() returns timestamptz language sql volatile as $$select now()$$;");
  let serial=0;
  const enter=(wallet,paid,tx='0x'+String(++serial).padStart(64,'0'))=>rpc('sqs_ranked_enter_v2',{p_server_key:'server-key',p_tx:tx,p_wallet:wallet,p_week:1,p_ip_hash:wallet,p_paid:paid,p_seed:1,p_max:1000000,p_mode:'normal'});
  const first=await enter(a,String(10n*unit)),second=await enter(b,String(unit)),short=await enter(c,String(unit));
  const denied=await rpc('sqs_ranked_can_enter_v2',{p_server_key:'server-key',p_wallet:b,p_week:1,p_ip_hash:a,p_max:1000000,p_mode:'normal'});assert(denied.error);assert.equal(Object.hasOwn(denied,'reward_version'),false,'errors retain the old response shape');
  assert(first.ok&&second.ok&&short.ok);
  assert.equal((await enter(a,String(10n*unit),'0x'+'1'.padStart(64,'0'))).id,first.id,'same paid transaction stays one entry');
  for(const paid of ['0','1','1000000000000000001',String(2n*unit),String(11n*unit)])assert.equal((await enter(a,paid)).error,'bad entry amount');
  await db.query("update sqs_ranked_entries set started_at=now(),claimed_at=now(),finished_at=now(),verdict='ok',t=30,kills=10,level=1,name='fixture' where id in ($1,$2)",[first.id,second.id]);
  await db.query("update sqs_ranked_entries set started_at=now(),claimed_at=now(),finished_at=now(),verdict='ok',t=29,kills=10,level=1,name='fixture' where id=$1",[short.id]);
  const publicNew=await rpc('sqs_ranked_board_v2',{p_week:1,p_mode:'normal'});
  assert.equal(publicNew.reward_version,2);assert.equal(publicNew.entries,3);
  assert.deepEqual(publicNew.activity,[{wallet:a,runs:'1',seconds:'30',paid:String(10n*unit)},{wallet:b,runs:'1',seconds:'30',paid:String(unit)}]);
  assert.deepEqual((await board()).activity,[],'legacy180s eligibility stays unchanged');
  await db.exec("create or replace function pg_catalog.now() returns timestamptz language sql stable as $$select '2026-11-17T01:00:00Z'::timestamptz$$; insert into sqs_ranked_payout_weeks(week,mode,paid,house,pool,incoming,rollover,top,pay_at) values(0,'normal',0,0,0,0,0,'[]',now());");
  const report=await rpc('sqs_ranked_settle_v2',{p_key:'reports-key',p_week:1,p_mode:'normal'}),plan=makePlan(report,'0',1);
  assert.deepEqual(report.activity,publicNew.activity);assert.equal(report.reward_version,2);
  assert.deepEqual(await rpc('sqs_ranked_settle',{p_key:'reports-key',p_week:1,p_mode:'normal'}),report,'existing read-only review/reserve RPC exposes the current policy too');
  assert.equal((await rpc('sqs_payout_plan',{p_key:'payout-key',p_week:1,p_mode:'normal',p_plan:plan})).error,'reward policy requires updated payout worker');
  assert.equal((await rpc('sqs_payout_plan_v2',{p_key:'bad',p_week:1,p_mode:'normal',p_plan:plan})).error,'forbidden');
  assert.deepEqual(await rpc('sqs_payout_plan_v2',{p_key:'payout-key',p_week:1,p_mode:'normal',p_plan:plan}),{ok:true});
  const state=await rpc('sqs_payout_read',{p_key:'payout-key',p_week:1});assert.equal(state.weeks[0].reward_version,2);
  const reviewRows=state.rows.filter(r=>r.kind==='participation');assert.equal(reviewRows.length,2);assert(reviewRows.every(r=>r.status==='held'),'previously accepted runs with pruned logs keep reserved shares for owner review');
  assert.equal(BigInt(plan.house)+BigInt(plan.rollover)+[...plan.prizes,...plan.participation].reduce((n,r)=>n+BigInt(r.amount),0n),12n*unit);
  assert.equal(plan.prizes.length,0,'short runs participate without winning placement');
 }finally{await db.close();}
});

test('SQL19 refuses rewriting a finalized policy1 week and leaves its prior state intact',{skip:!process.env.SQS_PGLITE},async()=>{
 const {db,rpc}=await sqlDB({current:true});
 try{
  await db.exec("insert into sqs_ranked_payout_weeks(week,mode,paid,house,pool,incoming,rollover,top,pay_at) values(1,'normal',0,0,0,0,0,'[]',now());");
  const before=await rpc('sqs_payout_read',{p_key:'payout-key'});
  await assert.rejects(db.exec(await readFile(new URL('../tools/supabase/update19.sql',import.meta.url),'utf8')),/already settled/);
  await db.exec('rollback');
  assert.deepEqual(await rpc('sqs_payout_read',{p_key:'payout-key'}),before);
 }finally{await db.close();}
});

test('SQL19 eligibility, holds, exact dust, replay retention and grants preserve every reward boundary',{skip:!process.env.SQS_PGLITE},async()=>{
 const {db,rpc}=await sqlDB({current:true});
 try{
  const sql=await readFile(new URL('../tools/supabase/update19.sql',import.meta.url),'utf8');await db.exec(sql);
  await db.exec("insert into sqs_ranked_payout_weeks(week,mode,paid,house,pool,incoming,rollover,top,pay_at) values(0,'normal',0,0,0,0,0,'[]',now());");
  let id=0;
  const row=async({wallet=a,paid='1',seconds=180,verdict='ok',refund=null,finished=true}={})=>{
   id++;
   await db.query("insert into sqs_ranked_entries(id,week,mode,wallet,tx,paid,ip_hash,seed,started_at,claimed_at,finished_at,verdict,t,kills,level,name,refund_reason,log) values($1,1,'normal',$2,$3,$4,$2,1,now(),now(),case when $5 then now() else null end,$6,$7,1,1,'fixture',$8,'fixture-log')",[id,wallet,'0x'+String(id).padStart(64,'0'),paid,finished,verdict,seconds,refund]);return id;
  };
  await row({paid:'10'});await row({wallet:b,seconds:30});
  for(let n=0;n<25;n++)await row({wallet:b,seconds:30});
  await row({wallet:c,seconds:29});await row({wallet:c,verdict:'rejected:fixture'});await row({wallet:c,refund:'fixture'});const pending=await row({wallet:c,finished:false});
  const house='0x9d506ba29843a232409d85e289edece8d6a7b452';await row({wallet:house,paid:'100'});
  const report=await rpc('sqs_ranked_settle_v2',{p_key:'reports-key',p_week:1,p_mode:'normal'});
  assert.deepEqual(report.activity,[{wallet:a,runs:'1',seconds:'180',paid:'10'},{wallet:b,runs:'26',seconds:'780',paid:'26'}]);
  assert.equal(report.activity_runs.length,27,'all eligible repeated runs are reviewed, without a20run cap');
  await rpc('sqs_payout_hold',{p_key:'payout-key',p_week:1,p_wallet:b,p_reason:'fixture review'});
  // Pending runs remain recoverable and must prevent settlement.
  const plan=makePlan(report,'0',1);
  assert.equal((await rpc('sqs_payout_plan_v2',{p_key:'payout-key',p_week:1,p_mode:'normal',p_plan:plan})).error,'replay in progress');
  await rpc('sqs_ranked_finish',{p_server_key:'server-key',p_id:pending,p_name:'fixture',p_t:29,p_kills:1,p_level:1,p_won:false,p_verdict:'ok',p_log_sha:'fixture-sha',p_log:'fixture-log'});
  assert.equal((await db.query("select count(*)::int n from sqs_ranked_entries where wallet=$1 and log is not null",[b])).rows[0].n,26,'short eligible repeated runs retain review logs after pruning');
  const clean=await rpc('sqs_ranked_settle_v2',{p_key:'reports-key',p_week:1,p_mode:'normal'}),expected=makePlan(clean,'0',1);
  const forged=structuredClone(expected);forged.participation[0].amount=String(BigInt(forged.participation[0].amount)+1n);
  assert.equal((await rpc('sqs_payout_plan_v2',{p_key:'payout-key',p_week:1,p_mode:'normal',p_plan:forged})).error,'plan differs from settlement');
  assert.deepEqual(await rpc('sqs_payout_plan_v2',{p_key:'payout-key',p_week:1,p_mode:'normal',p_plan:expected}),{ok:true});
  const state=await rpc('sqs_payout_read',{p_key:'payout-key',p_week:1});assert(state.rows.filter(r=>r.wallet===b).every(r=>r.status==='held'));
  await db.exec(sql);assert.deepEqual(await rpc('sqs_payout_read',{p_key:'payout-key',p_week:1}),state,'re-pasting never changes a version2 snapshot');
  const permissions=(await db.query("select has_function_privilege('anon','sqs_reward_activity_v2(integer,text)','execute') helper,has_function_privilege('authenticated','sqs_ranked_board_v2(integer,text)','execute') auth,has_function_privilege('anon','sqs_ranked_board_v2(integer,text)','execute') public_board")).rows[0];assert.deepEqual(permissions,{helper:false,auth:false,public_board:true});
  assert.equal((await rpc('sqs_ranked_settle_v2',{p_key:'bad',p_week:1,p_mode:'normal'})).error,'forbidden');
  assert.equal((await rpc('sqs_ranked_can_enter_v2',{p_server_key:'bad',p_wallet:a,p_week:1,p_ip_hash:a,p_max:1000000,p_mode:'normal'})).error,'forbidden');
 }finally{await db.close();}
});
