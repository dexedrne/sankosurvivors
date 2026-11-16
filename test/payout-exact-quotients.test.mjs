import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {sqlDB} from './helpers/payout-sql-db.mjs';import {makePlan} from '../tools/payout/core.mjs';
test('large base-unit rewards use exact quotient floors and preserve existing plans and grants',{skip:!process.env.SQS_PGLITE},async()=>{
 const {db,rpc}=await sqlDB({current:true});
 try{
  await db.exec(await readFile(new URL('../tools/supabase/update19.sql',import.meta.url),'utf8'));
  await db.exec("insert into sqs_ranked_payout_weeks(week,mode,paid,house,pool,incoming,rollover,top,pay_at) values(0,'normal',0,0,0,0,0,'[]',now());");
  let id=0;const metrics=[[6,4513],[1,760],[3,332],[3,562],[4,4448],[1,2137],[3,2320],[9,2700]];
  for(const [i,[runs,seconds]] of metrics.entries())for(let j=0;j<runs;j++){
   const wallet=i===7?'0x9d506ba29843a232409d85e289edece8d6a7b452':'0x'+(i+1).toString(16).padStart(40,'0'),t=Math.floor(seconds/runs)+(j<seconds%runs?1:0);id++;
   await db.query("insert into sqs_ranked_entries(week,mode,wallet,tx,paid,ip_hash,seed,verdict,t,kills,won,finished_at,started_at) values(1,'normal',$1,$2,1000000000000000000,'fixture',1,'ok',$3,$4,false,now()-interval '1 day',now()-interval '2 days')",[wallet,'0x'+id.toString(16).padStart(64,'0'),t,10000-i*100]);
  }
  const report=await rpc('sqs_ranked_settle_v2',{p_key:'reports-key',p_week:1,p_mode:'normal'});assert.equal(report.paid,'30000000000000000000');const plan=makePlan(report,'0',1),args={p_key:'payout-key',p_week:1,p_mode:'normal',p_plan:plan};
  assert.equal((await rpc('sqs_payout_plan_v2',args)).error,'plan differs from settlement','causal regression uses large real-world token units');
  const legacyBefore=(await db.query("select md5(prosrc) h from pg_proc where proname='sqs_payout_plan'")).rows;
  await db.exec(await readFile(new URL('../tools/supabase/update23.sql',import.meta.url),'utf8'));
  assert.equal((await rpc('sqs_payout_plan_v2',args)).ok,true);assert.equal((await rpc('sqs_payout_plan_v2',args)).again,true);
  const state=await rpc('sqs_payout_read',{p_key:'payout-key'}),week=state.weeks.find(w=>w.week===1);assert.equal(week.pool,plan.pool);assert.equal(week.rollover,'0');
  const rows=state.rows.filter(r=>r.week===1);assert.equal(rows.reduce((n,r)=>n+BigInt(r.amount),0n),30000000000000000000n);
  assert(rows.filter(r=>r.kind==='participation').every(r=>r.status==='held'),'missing-log review holds remain in place');
  assert.equal((await rpc('sqs_payout_plan_v2',{...args,p_plan:{...plan,pool:'1'}})).again,true);
  const unchanged=await rpc('sqs_payout_read',{p_key:'payout-key'});assert.deepEqual(unchanged.weeks,state.weeks);assert.deepEqual(unchanged.rows,state.rows,'existing immutable snapshot cannot be replaced');
  for(const p of plan.participation)assert.equal(rows.find(r=>r.kind==='participation'&&r.wallet===p.wallet).amount,p.amount);
  assert.deepEqual((await db.query("select md5(prosrc) h from pg_proc where proname='sqs_payout_plan'")).rows,legacyBefore);
  for(const key of [null,'wrong'])assert.equal((await rpc('sqs_payout_plan_v2',{...args,p_key:key})).error,'forbidden');
  const acl=(await db.query("select has_function_privilege('anon','sqs_payout_plan_v2(text,integer,jsonb,text)','EXECUTE') anon,has_function_privilege('authenticated','sqs_payout_plan_v2(text,integer,jsonb,text)','EXECUTE') authenticated")).rows[0];assert.deepEqual(acl,{anon:true,authenticated:false});
 }finally{await db.close();}
});
