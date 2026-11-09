import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlan,HOUSE} from '../tools/payout/core.mjs';
import {prizeEstimate} from '../src/prize-display.js';
const w=n=>'0x'+n.toString(16).padStart(40,'0');
const top=Array.from({length:6},(_,i)=>({wallet:w(i+1),t:180,kills:10-i}));
const activity=[{wallet:w(1),runs:'1',seconds:'180'},{wallet:w(6),runs:'3',seconds:'540'}];
test('week1 splits 80/10/10, pays outside top5, and conserves integer dust',()=>{
 const plan=makePlan({week:1,paid:'1000',top,activity});
 assert.deepEqual(plan.prizes.map(p=>p.amount),['288','180','108','86','58']);
 assert.deepEqual(plan.participation,[{wallet:w(1),amount:'46'},{wallet:w(6),amount:'134'}]);
 assert.equal(plan.rollover,'0');assert.equal(plan.house,'100');
 const estimate=prizeEstimate({week:1,poolWei:plan.pool,rolloverReady:true,activity,rows:top},[0,1,2,3,4,-1],[.4,.25,.15,.12,.08]);
 assert.deepEqual(estimate.prizes,plan.prizes.map(p=>p.amount));assert.deepEqual(estimate.participation,plan.participation);
});
test('empty buckets roll over, owner never receives rewards and activity is uncapped',()=>{
 const plan=makePlan({week:1,paid:'1000',top:[top[0]],activity:[]});assert.equal(plan.prizes[0].amount,'289');assert.equal(plan.rollover,'611');
 const large=makePlan({week:1,paid:'1000',top:[],activity:[{wallet:HOUSE,runs:'999',seconds:'999999'},{wallet:w(6),runs:'100',seconds:'360000'}]});
 assert.deepEqual(large.participation,[{wallet:w(6),amount:'180'}]);assert.equal(large.rollover,'720');
 assert.throws(()=>makePlan({week:1,paid:'1000',top}),/activity/);
 for(const bad of [[activity[0],activity[0]],[{wallet:w(1),runs:'0',seconds:'180'}],[{wallet:w(1),runs:'1',seconds:'179'}]])assert.throws(()=>makePlan({week:1,paid:'1000',top,activity:bad}));
});
test('week0 exact old prizes and integer conservation for tiny/odd pools with ties',()=>{
 assert.deepEqual(makePlan({week:0,paid:'1001',top:top.slice(0,3)}),{house:'100',pool:'901',prizes:[{wallet:w(1),amount:'360'},{wallet:w(2),amount:'225'},{wallet:w(3),amount:'136'}],rollover:'180'});
 for(const paid of ['0','1','2','10','10001','11001'])for(let count=0;count<=6;count++){
  const p=makePlan({week:1,paid,top:top.slice(0,count),activity});
  assert.equal(BigInt(p.house)+BigInt(p.rollover)+[...p.prizes,...p.participation].reduce((s,r)=>s+BigInt(r.amount),0n),BigInt(paid));
 }
});
test('participation follows the existing real-transaction recovery, caps, finality and approval scope',async()=>{
 const {fixture}=await import('./helpers/payout.mjs');
 const {run}=await import('../tools/payout/runner.mjs');
 const setup=()=>{const f=fixture(0);f.db.now=Date.UTC(2026,10,17,1);f.db.reports.set(1,{week:1,paid:'10000000000000000000',top,activity});return f;};
 const held=setup();held.db.holds.push({week:1,wallet:w(6),reason:'review'});await run(held.config,held.ports);
 assert.equal(held.db.rows.find(r=>r.week===1&&r.kind==='participation'&&r.wallet===w(6)).status,'held');
 const f=setup();f.chain.timeout=true;await run(f.config,f.ports);f.chain.timeout=false;await run(f.config,f.ports);await run(f.config,f.ports);
 const paid=f.db.rows.filter(r=>r.week===1&&r.kind==='participation');assert.equal(paid.length,2);assert(paid.every(r=>r.status==='confirmed'));assert.equal(new Set(f.chain.broadcasts.map(r=>r.nonce.toString())).size,f.chain.broadcasts.length);
 const cap=setup();cap.config.transferCap=1n;await run(cap.config,cap.ports);assert.equal(cap.chain.broadcasts.length,0);
 const scoped=setup();await run(scoped.config,{...scoped.ports,approvedWeek:0});assert(!scoped.db.rows.some(r=>r.week===1));
 const future=setup();future.chain.finalized=900n;future.chain.now=()=>Date.UTC(2026,10,15);await run(future.config,future.ports);assert(!future.chain.broadcasts.some(r=>paid.some(p=>r.data.includes(p.wallet.slice(2)))));
});
