import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sqlDB} from './helpers/payout-sql-db.mjs';
import {makePlan} from '../tools/payout/core.mjs';
import {prizeEstimate} from '../src/prize-display.js';
const unit=10n**18n,a='0x'+'1'.repeat(40),b='0x'+'2'.repeat(40),c='0x'+'3'.repeat(40);
for (const [update, wager] of [[21,25n],[24,100n]]) test(`SQL${update} admits exact ${wager} DMT once, preserves prior entries and independently settles contributions`,{skip:!process.env.SQS_PGLITE},async()=>{
 const {db,rpc}=await sqlDB({current:true});
 try{
  for(const n of (update===24?[19,20,21,23]:[19,20]))await db.exec(await readFile(new URL(`../tools/supabase/update${n}.sql`,import.meta.url),'utf8'));
  const week=update===24?3:1;
  const now=update===24?'2026-11-20':'2026-11-14';
  await db.exec(`create or replace function pg_catalog.now() returns timestamptz language sql stable as $$select '${now}T12:00:00Z'::timestamptz$$; create or replace function pg_catalog.clock_timestamp() returns timestamptz language sql volatile as $$select now()$$;`);
  let serial=0;
  const enter=(wallet,paid,tx='0x'+String(++serial).padStart(64,'0'),entryWeek=week,mode='normal',key='server-key')=>rpc('sqs_ranked_enter_v2',{p_server_key:key,p_tx:tx,p_wallet:wallet,p_week:entryWeek,p_ip_hash:wallet,p_paid:paid,p_seed:1,p_max:1000000,p_mode:mode});
  const first=await enter(a,String(unit),undefined,update===24?2:week);assert(first.ok);
  if(update===24){
    assert((await enter(a,String(25n*unit),undefined,2)).ok);
    assert.equal((await enter(a,String(wager*unit))).error,'bad entry amount');
  }
  const before=(await db.query('select * from sqs_ranked_entries')).rows;
  const sql=await readFile(new URL(`../tools/supabase/update${update}.sql`,import.meta.url),'utf8');
  if(update===24){
    await db.query("insert into sqs_ranked_entries(week,wallet,tx,paid,ip_hash,seed) values(3,$1,'late-fixture',1000000000000000000,'fixture',1)",[a]);
    await assert.rejects(db.exec(sql),/already accepted entries under a different reward policy/);
    await db.exec("rollback; delete from sqs_ranked_entries where tx='late-fixture';");
    const marker=await db.query("select to_regprocedure('public.sqs_ranked_reward_version(integer,text)') is null as absent");
    assert.equal(marker.rows[0].absent,true);
  }
  await db.exec(sql);
  await db.exec(sql);
  assert.deepEqual((await db.query('select * from sqs_ranked_entries')).rows,before);
  if(update===24){
    await db.exec("create or replace function pg_catalog.now() returns timestamptz language sql stable as $$select '2026-11-25T12:00:00Z'::timestamptz$$;");
    assert.equal((await enter(a,String(wager*unit),undefined,2)).error,'bad entry amount');
    assert((await enter(a,String(unit))).ok);
    assert((await enter(a,String(25n*unit))).ok);
  }
  const ready=await rpc('sqs_ranked_can_enter_v2',{p_server_key:'server-key',p_wallet:a,p_week:week,p_ip_hash:a,p_max:1000000,p_mode:'normal'});
  assert.equal(ready.entry_version,3);assert.equal(ready.reward_version,update===24?3:2);assert(ready.ok);assert.equal(ready.entry_100,update===24?true:undefined);
  const tx='0x'+'f'.repeat(64),max=await enter(b,String(wager*unit),tx);assert(max.ok,JSON.stringify(max));
  assert.equal((await enter(b,String(wager*unit),tx)).id,max.id);
  const high=await enter(c,String(10n*unit));assert(high.ok);
  for(const paid of [null,'0','1',String((wager-1n)*unit),String((wager+1n)*unit),String(wager*unit+1n),'NaN','Infinity'])assert.equal((await enter(a,paid)).error,'bad entry amount');
  assert.equal((await enter(a,String(wager*unit),undefined,0)).error,'bad entry amount');
  assert.equal((await enter(a,String(wager*unit),undefined,week,'hard')).error,'bad entry amount');
  assert.equal((await enter(a,String(wager*unit),undefined,week,'normal','bad')).error,'forbidden');
  const denied=await rpc('sqs_ranked_can_enter_v2',{p_server_key:'server-key',p_wallet:b,p_week:week,p_ip_hash:a,p_max:1000000,p_mode:'normal'});assert(denied.error);assert.equal(denied.entry_version,undefined);
  await db.query("update sqs_ranked_entries set started_at=now(),claimed_at=now(),finished_at=now(),verdict='ok',t=180,kills=10,level=1,name='fixture',log='fixture-log',log_sha='sha'");
  const after=update===24?'2026-12-01':'2026-11-17';
  await db.exec(`insert into sqs_ranked_payout_weeks(week,mode,paid,house,pool,incoming,rollover,top,pay_at) values(${week-1},'normal',0,0,0,0,0,'[]',now()); create or replace function pg_catalog.now() returns timestamptz language sql stable as $$select '${after}T01:00:00Z'::timestamptz$$;`);
  const report=await rpc('sqs_ranked_settle_v2',{p_key:'reports-key',p_week:week,p_mode:'normal'}),plan=makePlan(report,'0',week);
  const totalPaid=((update===24?26n:1n)+wager+10n)*unit;
  assert.equal(report.paid,String(totalPaid));assert.deepEqual(report.activity.map(r=>r.paid),[String((update===24?26n:1n)*unit),String(wager*unit),String(10n*unit)]);
  assert.deepEqual(await rpc('sqs_payout_plan_v2',{p_key:'payout-key',p_week:week,p_mode:'normal',p_plan:plan}),{ok:true});
  const estimate=prizeEstimate({week,poolWei:plan.pool,entryPoolWei:String(BigInt(plan.pool)),rolloverReady:true,rewards:{version:ready.reward_version},rewardActivity:report.activity,rows:report.top},[0,1,2],[.4,.25,.15,.12,.08]);
  assert.deepEqual(estimate.participation,plan.participation);
  assert(BigInt(plan.participation.find(r=>r.wallet===b).amount)>BigInt(plan.participation.find(r=>r.wallet===c).amount));
  assert.equal(BigInt(plan.house)+BigInt(plan.rollover)+[...plan.prizes,...plan.participation].reduce((n,r)=>n+BigInt(r.amount),0n),totalPaid);
  const state=await rpc('sqs_payout_read',{p_key:'payout-key',p_week:week});await db.exec(sql);assert.deepEqual(await rpc('sqs_payout_read',{p_key:'payout-key',p_week:week}),state);
  const grants=(await db.query("select has_function_privilege('anon','sqs_ranked_enter_v2(text,text,text,integer,text,numeric,bigint,integer,text)','execute') enter,has_function_privilege('authenticated','sqs_ranked_enter_v2(text,text,text,integer,text,numeric,bigint,integer,text)','execute') auth,has_function_privilege('anon','sqs_ranked_can_enter_v2(text,text,integer,text,integer,text)','execute') ready")).rows[0];assert.deepEqual(grants,{enter:true,auth:false,ready:true});
 }finally{await db.close();}
});
