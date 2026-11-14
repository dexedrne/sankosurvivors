import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fixture,wallet} from './helpers/payout.mjs';
import {sqlDB} from './helpers/payout-sql-db.mjs';
import {run} from '../tools/payout/runner.mjs';
import {decimal} from '../tools/payout/core.mjs';
import {FIRST_BONUS} from '../src/first-bonus.js';
async function setup(){
 const pg=await sqlDB({current:true});for(const n of [19,20])await pg.db.exec(await readFile(new URL('../tools/supabase/update'+n+'.sql',import.meta.url),'utf8'));
 await pg.db.exec("insert into sqs_ranked_payout_weeks(week,mode,paid,house,pool,incoming,rollover,top,pay_at) values(0,'normal',0,0,0,0,0,'[]',now());");
 for(const [i,t,paid] of [[1,600,'10'],[2,300,'1']])await pg.db.query("insert into sqs_ranked_entries(week,wallet,tx,paid,ip_hash,seed,verdict,t,kills,level,finished_at,name,log,log_sha) values(1,$1,$2,$3,'fixture',1,'ok',$4,$4,1,now(),'fixture','log','sha')",[wallet(i),'0x'+String(i).repeat(64),decimal(paid).toString(),t]);
 const f=fixture(0);f.db.now=Date.UTC(2026,10,17,1);f.config.live=true;f.chain.dmt=decimal('31');f.ports.rpc=pg.rpc;return{f,pg,state:()=>pg.rpc('sqs_payout_read',{p_key:'payout-key',p_week:1})};
}
test('realSQL and the actual worker pay normal awards plus the separate20bonus exactly once',{skip:!process.env.SQS_PGLITE},async()=>{
 const {f,pg,state}=await setup();try{
  await Promise.all([run(f.config,f.ports),run(f.config,f.ports)]);await run(f.config,f.ports);
  const s=await state(),bonus=s.rows.filter(r=>r.kind==='prize-bonus');assert.equal(bonus.length,1);assert.equal(bonus[0].wallet,wallet(1));assert.equal(bonus[0].amount,FIRST_BONUS.amountWei);assert.equal(bonus[0].status,'confirmed');
  assert.equal(f.chain.broadcasts.length,6);assert.equal(f.chain.dmt,decimal('2.772'));assert.equal(s.weeks.find(w=>w.mode==='normal').rollover,decimal('2.772').toString());assert(s.rows.filter(r=>r.kind!=='rollover-note').every(r=>r.status==='confirmed'));
 }finally{await pg.db.close();}
});
test('realSQL winner holds cover ordinary and bonus awards while other rewards can proceed',{skip:!process.env.SQS_PGLITE},async()=>{
 const {f,pg,state}=await setup();try{
  await pg.rpc('sqs_payout_hold',{p_key:'payout-key',p_week:1,p_wallet:wallet(1),p_reason:'fixture review'});await run(f.config,f.ports);let s=await state();assert(s.rows.filter(r=>r.wallet===wallet(1)).every(r=>r.status==='held'));assert.equal(s.rows.find(r=>r.kind==='prize-bonus').amount,FIRST_BONUS.amountWei);assert(f.chain.broadcasts.length>0&&f.chain.broadcasts.length<6);
  await pg.rpc('sqs_payout_hold',{p_key:'payout-key',p_week:1,p_wallet:wallet(1),p_reason:null});await run(f.config,f.ports);s=await state();assert.equal(s.rows.find(r=>r.kind==='prize-bonus').status,'confirmed');assert.equal(f.chain.broadcasts.length,6);
 }finally{await pg.db.close();}
});
test('bonus source recheck blocks saved-byte broadcast and recovery reuses the exact signed transaction',{skip:!process.env.SQS_PGLITE},async()=>{
 const {f,pg,state}=await setup();try{
  const original=pg.rpc;let corrupted=false;f.ports.rpc=async(fn,p)=>{const result=await original(fn,p);if(fn==='sqs_payout_claim'&&result.row?.kind==='prize-bonus'&&!corrupted){corrupted=true;f.chain.receipts.get(FIRST_BONUS.tx).logs[0].removed=true;}return result;};
  await run(f.config,f.ports);let s=await state(),bonus=s.rows.find(r=>r.kind==='prize-bonus');assert.equal(bonus.status,'sending');assert(bonus.raw_tx);const raw=bonus.raw_tx,hash=bonus.tx_hash,nonce=bonus.nonce;assert(!f.chain.broadcasts.some(t=>t.hash===hash));
  f.chain.receipts.get(FIRST_BONUS.tx).logs[0].removed=false;await run(f.config,f.ports);s=await state();bonus=s.rows.find(r=>r.kind==='prize-bonus');assert.equal(bonus.status,'confirmed');assert.equal(bonus.raw_tx,raw);assert.equal(bonus.tx_hash,hash);assert.equal(bonus.nonce,nonce);assert.equal(f.chain.broadcasts.filter(t=>t.hash===hash).length,1);
 }finally{await pg.db.close();}
});
