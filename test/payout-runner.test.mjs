import test from 'node:test';
import assert from 'node:assert/strict';
import { FakePayoutDB, FakeChain, fixture, wallet } from './helpers/payout.mjs';
import { run } from '../tools/payout/runner.mjs';

for(const count of [0,1,3,5,10]) test(`runner pays a full week with ${count} wallets, refunds and rollover`,async()=>{
  const f=fixture(count); await run(f.config,f.ports);
  assert.equal(f.db.weeks.length,1);
  assert.equal(f.chain.broadcasts.length,Math.min(count,5)+2); // house and refund
  assert.ok(f.db.rows.filter(r=>r.kind!=='rollover-note').every(r=>r.status==='confirmed'));
  await run(f.config,f.ports); assert.equal(f.chain.broadcasts.length,Math.min(count,5)+2);
  assert.equal(f.messages.filter(s=>s.includes('Winners')).length,1);
});
test('dry run plans and announces without claiming, signing or broadcasting',async()=>{
  const f=fixture(3); f.config.live=false; f.ports.key=async()=>{throw Error('must not read key');};
  await run(f.config,f.ports); assert.equal(f.chain.broadcasts.length,0);
  assert.ok(f.db.rows.filter(r=>r.kind!=='rollover-note').every(r=>r.status==='planned'));
  assert.ok(f.logs.some(s=>s.includes('WOULD SEND')));
});
test('holds defer prizes, not refunds; refund is paid before the 24-hour delay',async()=>{
  const f=fixture(3); f.db.holds.push({week:0,wallet:wallet(1),reason:'review'});
  await run(f.config,f.ports);
  assert.equal(f.db.rows.find(r=>r.kind==='prize1').status,'held');
  const early=fixture(3);early.ports.now=()=>Date.UTC(2026,10,9,2);
  await run(early.config,early.ports);assert.deepEqual(early.chain.broadcasts.map(t=>t.data.slice(10,74)),[wallet(9).slice(2).padStart(64,'0')]);
});
for(const condition of ['low DMT','low ETH','week cap','transfer cap','bad address','wrong chain','gas cap']) test(`preflight: ${condition} sends nothing and alerts once`,async()=>{
  const f=fixture(3);
  if(condition==='low DMT') f.chain.dmt=1n;
  if(condition==='low ETH') f.chain.eth=1n;
  if(condition==='week cap') f.config.weekCap=1n;
  if(condition==='transfer cap') f.config.transferCap=1n;
  if(condition==='bad address') f.db.badAddress=true;
  if(condition==='wrong chain') f.chain.chainId='0x1';
  if(condition==='gas cap') f.config.ethCap=1n;
  await run(f.config,f.ports); await run(f.config,f.ports);
  assert.equal(f.chain.broadcasts.length,0);
  assert.equal(f.messages.filter(s=>s.includes('ALERT')).length,1);
});
test('parallel invocations share an exclusive database lease and cannot double pay',async()=>{
  const f=fixture(3); await Promise.all([run(f.config,f.ports),run(f.config,f.ports)]);
  assert.equal(f.chain.broadcasts.length,5);assert.equal(new Set(f.chain.broadcasts.map(x=>x.nonce)).size,5);
});
test('broadcast accepted then timed out is recovered by stored hash without a second transfer',async()=>{
  const f=fixture(3);f.chain.timeout=true;
  await run(f.config,f.ports); assert.equal(f.chain.broadcasts.length,1);
  f.chain.timeout=false;await run(f.config,f.ports);
  assert.equal(f.chain.broadcasts.length,5); assert.ok(f.db.rows.filter(r=>r.kind!=='rollover-note').every(r=>r.status==='confirmed'));
});
test('crash after nonce claim without signed bytes checks the chain and resumes the unused nonce',async()=>{
  const f=fixture(3);f.db.crashClaim=true;
  await assert.rejects(run(f.config,f.ports));
  f.db.crashClaim=false;await run(f.config,f.ports);
  assert.equal(f.chain.broadcasts.length,5);assert.ok(f.chain.calls.includes('eth_getTransactionCount'));
});
test('crash after durable signed hash recovers identical bytes once',async()=>{
  const f=fixture(3); f.db.crashPrepared=true;
  await assert.rejects(run(f.config,f.ports));
  f.db.crashPrepared=false;await run(f.config,f.ports);
  assert.equal(f.chain.broadcasts.length,5);
});
test('crash after sent hash follows receipt without rebroadcast',async()=>{
  const f=fixture(3);f.db.crashSent=true;
  await assert.rejects(run(f.config,f.ports));
  f.db.crashSent=false;await run(f.config,f.ports);
  assert.equal(f.chain.broadcasts.length,5);
});
test('rollover from an empty week is added exactly once to next week prizes',async()=>{
  const f=fixture(0);f.db.now=Date.UTC(2026,10,17,1);
  f.db.reports.set(1,{week:1,paid:'10000000000000000000',top:[{wallet:wallet(1),name:'Next',t:900},{wallet:wallet(2),t:899},{wallet:wallet(3),t:898}],refunds:[]});
  await run(f.config,f.ports);await run(f.config,f.ports);
  const week=f.db.weeks.find(w=>w.week===1);assert.equal(week.incoming,'9000000000000000000');
  assert.deepEqual(f.db.rows.filter(r=>r.week===1&&r.kind.startsWith('prize')).map(r=>r.amount),['7200000000000000000','4500000000000000000','2700000000000000000']);
  assert.equal(f.chain.broadcasts.length,6);
});
test('repeated and late refunds to a paid wallet are paid separately once, including the active week',async()=>{
  const f=fixture(3);await run(f.config,f.ports);
  f.db.refunds.push({id:'101',week:0,wallet:wallet(9),paid:'500000000000000000'},{id:'102',week:1,wallet:wallet(9),paid:'500000000000000000'});
  await run(f.config,f.ports);await run(f.config,f.ports);
  assert.equal(f.chain.broadcasts.length,7);assert.equal(f.db.rows.filter(r=>r.kind==='refund').length,3);
});
test('no prize plan exists during the final submission grace; refunds still go immediately',async()=>{
  const f=fixture(3);f.db.now=Date.UTC(2026,10,9,0,55);
  await run(f.config,f.ports);assert.equal(f.db.weeks.length,0);assert.equal(f.chain.broadcasts.length,1);
});
test('rejected broadcast retries only the same durable transaction on the next run',async()=>{
  const f=fixture(3);f.chain.fail=true;await run(f.config,f.ports);
  const saved=f.db.rows.find(r=>r.status==='sending');assert.ok(saved.tx_hash);const raw=saved.raw_tx;
  assert.equal(f.chain.broadcasts.length,0);f.chain.fail=false;await run(f.config,f.ports);
  assert.equal(f.chain.broadcasts.length,5);assert.equal(f.chain.broadcasts[0].hash,saved.tx_hash);assert.equal(saved.raw_tx,raw);
});
test('pending transaction stops further sends, and finality is required before confirmation',async()=>{
  const f=fixture(3);f.chain.unmined=true;await run(f.config,f.ports);await run(f.config,f.ports);
  assert.equal(f.chain.broadcasts.length,1);assert.equal(f.db.rows.filter(r=>r.status==='sent').length,1);
});
for(const condition of ['reverted','missingLog'])test(`receipt ${condition} marks failed and is never paid a second time`,async()=>{
  const f=fixture(3);f.chain[condition]=true;await run(f.config,f.ports);await run(f.config,f.ports);
  assert.equal(f.chain.broadcasts.length,1);assert.equal(f.db.rows.filter(r=>r.status==='failed').length,1);
});
test('conflicting external transaction at an unsigned claim nonce stops the bot',async()=>{
  const f=fixture(3);f.db.crashClaim=true;await assert.rejects(run(f.config,f.ports));f.db.crashClaim=false;
  f.chain.transactions.push({from:f.config.wallet,to:wallet(20),nonce:'0x0',value:'0x0',input:'0x',hash:'0x'+'e'.repeat(64)});f.chain.pending=1n;
  await run(f.config,f.ports);assert.equal(f.chain.broadcasts.length,0);assert.ok(f.messages.some(s=>s.includes('unresolved nonce')));
});
test('matching chain transaction at an unsigned claim nonce is adopted, never resent',async()=>{
  const f=fixture(3);f.db.crashClaim=true;await assert.rejects(run(f.config,f.ports));f.db.crashClaim=false;
  const {sign1559,transferData}=await import('../tools/payout/crypto.mjs');
  const {key}=await import('./helpers/payout.mjs');
  const row=f.db.rows.find(r=>r.status==='sending');
  await f.chain.request('eth_sendRawTransaction',[sign1559({chainId:42161,nonce:0,priority:0,maxFee:20000000,gas:120000,to:'0x8b0e6f19ee57089f7649a455d89d7bc6314d04e8',data:transferData(row.wallet,row.amount)},key).raw]);
  await run(f.config,f.ports);assert.equal(f.chain.broadcasts.length,5);assert.equal(row.status,'confirmed');
});
test('recovery rejects saved bytes that do not match the database destination',async()=>{
  const f=fixture(3);f.db.crashPrepared=true;await assert.rejects(run(f.config,f.ports));f.db.crashPrepared=false;
  const row=f.db.rows.find(r=>r.status==='sending');row.raw_tx=row.raw_tx.slice(0,-2)+'ff';
  await run(f.config,f.ports);assert.equal(f.chain.broadcasts.length,0);
});
test('held money and rollover remain reserved while another week is paid',async()=>{
  const f=fixture(1);f.db.holds.push({week:0,wallet:wallet(1),reason:'review'});await run(f.config,f.ports);
  f.db.now=Date.UTC(2026,10,17,1);f.db.reports.set(1,{week:1,paid:'10000000000000000000',top:[{wallet:wallet(2),t:900}],refunds:[]});
  f.chain.dmt=10000000000000000000n;
  const before=f.chain.broadcasts.length;await run(f.config,f.ports);assert.equal(f.chain.broadcasts.length,before);
});
test('too few confirmations defer payment completion and further transfers',async()=>{
  const f=fixture(3),original=f.chain.request.bind(f.chain);let mature=false;
  f.chain.request=async(method,args)=>{const r=await original(method,args);return method==='eth_getTransactionReceipt'&&r&&!mature?{...r,blockNumber:'0x3e3'}:r;};
  await run(f.config,f.ports);assert.equal(f.chain.broadcasts.length,1);assert.equal(f.db.rows.filter(r=>r.status==='sent').length,1);
  mature=true;await run(f.config,f.ports);assert.equal(f.chain.broadcasts.length,5);
});
test('a noncanonical receipt is not confirmed or sent a second time',async()=>{
  const f=fixture(3),original=f.chain.request.bind(f.chain);
  f.chain.request=async(method,args)=>{const r=await original(method,args);return method==='eth_getTransactionReceipt'&&r?{...r,blockHash:'0x'+'d'.repeat(64)}:r;};
  await run(f.config,f.ports);await run(f.config,f.ports);
  assert.equal(f.chain.broadcasts.length,1);assert.equal(f.db.rows.find(r=>r.nonce==='0').status,'sent');
});
test('Telegram timeout is claimed once and cannot repeat the weekly announcement',async()=>{
  const f=fixture(3);let attempts=0;f.ports.notify=async()=>{attempts++;throw Error('ambiguous timeout');};
  await run(f.config,f.ports);await run(f.config,f.ports);
  assert.equal(attempts,1);assert.equal(f.chain.broadcasts.length,5);
});
