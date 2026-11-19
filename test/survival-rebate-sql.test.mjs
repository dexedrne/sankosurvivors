import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sqlDB} from './helpers/payout-sql-db.mjs';
import {makePlan,HOUSE} from '../tools/payout/core.mjs';
import {prizeEstimate} from '../src/prize-display.js';

test('SQL verifies survival rebates per run and settles the same plan as the browser and runner',{skip:!process.env.SQS_PGLITE},async()=>{
 const {db,rpc}=await sqlDB({current:true});
 try{
  const load=async n=>db.exec(await readFile(new URL(`../tools/supabase/update${n}.sql`,import.meta.url),'utf8'));
  for(const n of [19,20,21,23,24,24])await load(n);
  const unit=10n**18n,a='0x'+'1'.repeat(40),b='0x'+'2'.repeat(40),c='0x'+'3'.repeat(40);
  await db.exec(`insert into sqs_ranked_payout_weeks(week,mode,paid,house,pool,incoming,rollover,top,pay_at,reward_version)
    values(2,'normal',0,0,0,0,${7n*unit},'[]',now(),2);
    create or replace function pg_catalog.now() returns timestamptz language sql stable as $$select '2026-11-30T01:00:00Z'::timestamptz$$;`);
  let serial=0;
  for(const [wallet,stake,t,verdict='ok',refund=null,log='fixture-log'] of [
   [a,1n,29],[a,1n,179],[a,1n,180],[a,1n,599],[a,1n,600],[a,1n,1199],[a,1n,1200],
   [b,100n,600],[b,100n,1200],[b,100n,1200,'rejected'],[b,100n,1200,'ok','refund'],
   [c,25n,180,'ok',null,null],[HOUSE,10n,1200],
  ]){
   const tx='0x'+String(++serial).padStart(64,'0');
   await db.query(`insert into sqs_ranked_entries(week,mode,wallet,tx,paid,ip_hash,seed,verdict,t,kills,started_at,finished_at,refund_reason,log)
      values(3,'normal',$1,$2,$3,'fixture',1,$4,$5,10,now()-interval '2 days',now()-interval '1 day',$6,$7)`,
   [wallet,tx,String(stake*unit),verdict,t,refund,log]);
  }
  const legacy=await rpc('sqs_ranked_board_v2',{p_week:2,p_mode:'normal'});
  assert.equal(legacy.reward_version,2);
  const board=await rpc('sqs_ranked_board_v2',{p_week:3,p_mode:'normal'});
  const report=await rpc('sqs_ranked_settle_v2',{p_key:'reports-key',p_week:3,p_mode:'normal'});
  assert.equal(board.reward_version,3);
  assert.equal(report.reward_version,3);
  assert.deepEqual(board.activity,report.activity);
  assert.deepEqual(board.activity.map(({wallet,rebate})=>[wallet,rebate]),
   [[a,'270000000000000000'],[b,String(15n*unit)],[c,'750000000000000000']]);
  assert.equal(board.activity[0].runs,'6');
  const plan=makePlan(report,board.incoming,3);
  const estimate=prizeEstimate({week:3,poolWei:plan.pool,entryPoolWei:String(BigInt(board.paid)*9n/10n),
   incomingWei:board.incoming,rolloverReady:true,rewardActivity:board.activity,rewards:{version:3}},[0,1,2],[.4,.25,.15,.12,.08]);
  assert.deepEqual(plan.participation,estimate.participation);
  const args={p_key:'payout-key',p_week:3,p_mode:'normal',p_plan:plan};
  const bad=await rpc('sqs_payout_plan_v2',{...args,p_plan:{...plan,participation:[]}});
  assert.equal(bad.error,'plan differs from settlement');
  assert.deepEqual(await rpc('sqs_payout_plan_v2',args),{ok:true});
  const state=await rpc('sqs_payout_read',{p_key:'payout-key',p_week:3});
  assert.equal(state.weeks[0].reward_version,3);
  assert.equal(state.rows.find(row=>row.kind==='participation'&&row.wallet===c).status,'held');
  assert.equal(state.rows.reduce((sum,row)=>sum+BigInt(row.amount),0n),BigInt(report.paid)+BigInt(board.incoming));
  await load(24);
  assert.deepEqual(await rpc('sqs_payout_read',{p_key:'payout-key',p_week:3}),state);
 }finally{await db.close();}
});
