import test from 'node:test';
import assert from 'node:assert/strict';
import { FakePayoutDB, FakeChain, fixture, wallet } from './helpers/payout.mjs';
import { run } from '../tools/payout/runner.mjs';
import { decimal, units } from '../tools/payout/core.mjs';

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
  f.chain.request=async(method,args)=>{const r=await original(method,args);return method==='eth_getTransactionReceipt'&&r&&f.chain.transactions.some(t=>t.hash===r.transactionHash)&&!mature?{...r,blockNumber:'0x3e3'}:r;};
  await run(f.config,f.ports);assert.equal(f.chain.broadcasts.length,1);assert.equal(f.db.rows.filter(r=>r.status==='sent').length,1);
  mature=true;await run(f.config,f.ports);assert.equal(f.chain.broadcasts.length,5);
});
test('a noncanonical receipt is not confirmed or sent a second time',async()=>{
  const f=fixture(3),original=f.chain.request.bind(f.chain);
  f.chain.request=async(method,args)=>{const r=await original(method,args);return method==='eth_getTransactionReceipt'&&r&&f.chain.transactions.some(t=>t.hash===r.transactionHash)?{...r,blockHash:'0x'+'d'.repeat(64)}:r;};
  await run(f.config,f.ports);await run(f.config,f.ports);
  assert.equal(f.chain.broadcasts.length,1);assert.equal(f.db.rows.find(r=>r.nonce==='0').status,'sent');
});
test('Telegram timeout is claimed once and cannot repeat the weekly announcement',async()=>{
  const f=fixture(3);let attempts=0;f.ports.notify=async()=>{attempts++;throw Error('ambiguous timeout');};
  await run(f.config,f.ports);await run(f.config,f.ports);
  assert.equal(attempts,1);assert.equal(f.chain.broadcasts.length,5);
});

// ---- two pots from week 1: Normal and Hard, each with its own house fee, prizes and rollover ----
test('week 1 settles the Normal and Hard pots separately (KPM rules, 3:00 minimum, dev wallet excluded) and pays both',async()=>{
  const { HOUSE, COLLECT, dmt } = await import('../tools/payout/core.mjs');
  const f=fixture(3); f.db.now=f.ports.now=Date.UTC(2026,10,16,3,5), f.ports.now=()=>f.db.now;
  const e18=n=>(BigInt(Math.round(n*1000))*10n**15n).toString();
  // Normal week 1: 4 entries (2 DMT); one run is too short and the best rate, it must not win
  f.db.reports.set(1,{week:1,mode:'normal',paid:e18(2),top:[
    {id:'11',wallet:wallet(21),name:'Speedy',t:120,kills:400},
    {id:'12',wallet:wallet(22),name:'Steady',t:600,kills:300},
    {id:'13',wallet:wallet(23),name:'Slow',t:900,kills:200}],refunds:[]});
  // Hard week 1: 3 entries (4.5 DMT); the developer's wallet is first and plays for no prize
  f.db.reports.set('1:hard',{week:1,mode:'hard',paid:e18(4.5),top:[
    {id:'21',wallet:HOUSE,name:'Dev',t:800,kills:900},
    {id:'22',wallet:wallet(31),name:'Brave',t:400,kills:200}],refunds:[]});
  f.db.refunds.push({id:'101',week:1,mode:'hard',wallet:wallet(32),paid:e18(1.5)});
  await run(f.config,f.ports); // plans both pots 2 hours after the reset; the refund goes out at once
  assert.ok(f.db.rows.some(r=>r.week===1&&r.kind==='prize1'&&r.status==='planned'),'prizes wait 24 hours after the week');
  f.db.now=Date.UTC(2026,10,17,1); await run(f.config,f.ports); // prizes and house fees are due
  const plan=(w,m)=>f.db.weeks.find(x=>x.week===w&&x.mode===m);
  assert.deepEqual(f.db.weeks.map(x=>x.week+':'+x.mode),['0:normal','1:normal','1:hard']);
  // Normal: 2 DMT paid → 0.2 house, 1.8 pool + week 0's rollover; two winners (Steady 30/min, Slow 13.3/min)
  const n1=plan(1,'normal'), n0=plan(0,'normal');
  assert.equal(n1.house,e18(0.2)); assert.equal(n1.incoming,n0.rollover); assert.equal(BigInt(n1.pool),BigInt(e18(1.8))+BigInt(n0.rollover));
  assert.deepEqual(f.db.rows.filter(r=>r.week===1&&r.mode==='normal'&&r.kind.startsWith('prize')).map(r=>r.wallet),[wallet(22),wallet(23)]);
  // Hard: 4.5 DMT → 0.45 house to the same house wallet, 4.05 pool, only Brave can win (1st place, 40%); the four
  // unclaimed places (60%) roll into week 2's Hard pot
  const h1=plan(1,'hard');
  assert.deepEqual([h1.house,h1.pool,h1.incoming],[e18(0.45),e18(4.05),'0']);
  const hp=f.db.rows.filter(r=>r.week===1&&r.mode==='hard');
  assert.deepEqual(hp.filter(r=>r.kind.startsWith('prize')).map(r=>[r.kind,r.wallet,r.amount]),[['prize1',wallet(31),e18(1.62)]]);
  assert.equal(h1.rollover,e18(2.43));
  assert.deepEqual(hp.filter(r=>r.kind==='house').map(r=>[r.wallet,r.amount]),[[HOUSE,e18(0.45)]]);
  assert.equal(hp.find(r=>r.kind==='rollover-note').wallet,COLLECT);
  assert.ok(!f.db.rows.some(r=>r.wallet===HOUSE&&r.kind.startsWith('prize')));
  assert.equal(hp.find(r=>r.kind==='refund').amount,e18(1.5));
  assert.ok(f.db.rows.filter(r=>r.kind!=='rollover-note').every(r=>r.status==='confirmed'),'both pots paid');
  // one announcement per pot, with kills per minute from week 1
  const hard=f.messages.find(s=>s.includes('Week 1 Hard ranked results')), normal=f.messages.find(s=>s.includes('Week 1 Normal ranked results'));
  assert.ok(hard&&normal&&f.messages.some(s=>s.includes('Week 0 Normal ranked results')));
  assert.match(normal,/Steady \S+ 30\.00 KPM \(300 kills in 10m 0s\): /);
  assert.match(hard,new RegExp('House: '+dmt(e18(0.45)).replace('.','\\.')+' DMT'));
  const sent=f.chain.broadcasts.length; await run(f.config,f.ports); assert.equal(f.chain.broadcasts.length,sent,'repeat-safe');
  assert.equal(f.messages.filter(s=>s.includes('Week 1 Hard ranked results')).length,1);
});
test('the Hard rollover chain is its own: an empty Hard week rolls its whole pool into the next Hard week only',async()=>{
  const f=fixture(0); f.db.now=Date.UTC(2026,10,23,3,5); f.ports.now=()=>f.db.now; f.config.live=false;
  const e18=n=>(BigInt(Math.round(n*1000))*10n**15n).toString();
  f.db.reports.set('1:hard',{week:1,mode:'hard',paid:e18(3),top:[{id:'1',wallet:wallet(41),t:100,kills:500}],refunds:[]}); // too short: no winner
  f.db.reports.set('2:hard',{week:2,mode:'hard',paid:e18(1.5),top:[{id:'2',wallet:wallet(42),t:200,kills:20}],refunds:[]});
  await run(f.config,f.ports);
  const plan=(w,m)=>f.db.weeks.find(x=>x.week===w&&x.mode===m);
  assert.deepEqual([plan(1,'hard').rollover,plan(2,'hard').incoming],[e18(2.7),e18(2.7)]);
  assert.equal(plan(2,'hard').pool,(BigInt(e18(1.35))+BigInt(e18(2.7))).toString());
  assert.equal(plan(2,'normal').incoming,plan(1,'normal').rollover);
  // week 2 Hard: 1.35 new + 2.7 rolled = 4.05; its one winner takes 1st place (40%), the rest rolls on into week 3's Hard pot
  assert.equal(f.db.rows.find(r=>r.week===2&&r.mode==='hard'&&r.kind==='prize1').amount,e18(1.62));
  assert.equal(plan(2,'hard').rollover,e18(2.43));
  assert.equal(f.db.weeks.some(x=>x.week===0&&x.mode==='hard'),false,'no Hard race in week 0');
});
// security pass, 3 Nov: a refund row in the ledger is not money. Only a real payment on chain is refunded, and only once.
test('a forged refund (a ledger row with no payment on chain) pauses the bot and sends nothing', async () => {
  const f = fixture(3);
  f.db.refunds.push({ id: '666', week: 0, wallet: wallet(7), paid: '500000000000000000000', forged: true }); // 500 DMT that was never paid in
  await run(f.config, f.ports);
  assert.equal(f.chain.broadcasts.length, 0, 'not a single transfer');
  assert.ok(f.logs.some((s) => s.includes('PAUSED: unverified refund row')));
  assert.ok(f.messages.some((s) => s.includes('ALERT')));
});
test('a refund whose payment was for less, or from another wallet, is not sent', async () => {
  for (const tamper of [(r) => { r.logs[0].data = '0x' + 1n.toString(16).padStart(64, '0'); }, (r) => { r.logs[0].topics[1] = '0x' + wallet(8).slice(2).padStart(64, '0'); }, (r) => { r.status = '0x0'; }]) {
    const f = fixture(3);
    await f.ports.rpc('sqs_payout_refunds', { p_key: 'payout-key' });
    const row = f.db.rows.find((x) => x.kind === 'refund'); const rec = f.chain.receipts.get(row.source_tx);
    for (const l of rec.logs) tamper({ ...rec, logs: [l] }); tamper(rec);
    await run(f.config, f.ports);
    assert.equal(f.chain.broadcasts.length, 0); assert.ok(f.logs.some((s) => s.includes('PAUSED: unverified refund row')));
  }
});
test('two refund rows for one payment pause the bot', async () => {
  const f = fixture(3);
  f.db.refunds.push({ id: '101', week: 0, wallet: wallet(9), paid: '500000000000000000', tx: '0x' + '100'.padStart(64, 'e') }); // the same payment as entry 100
  await run(f.config, f.ports);
  assert.equal(f.chain.broadcasts.length, 0); assert.ok(f.logs.some((s) => s.includes('PAUSED: refund paid twice')));
});

// security pass 3: a cap holds back only the rows that break it. Before, any row over a cap paused every payout, so ~1000 DMT
// of over-payments (refunded later anyway) could stall the honest refunds and the week's prizes.
const e18=n=>(BigInt(Math.round(n*1000))*10n**15n).toString();
test('a flood of over-payment refunds is held back past its week budget; the honest refund and the house fee still go', async () => {
  const f=fixture(0); // week 0 has no winners: its house fee (1 DMT) and an honest 0.5 DMT pre-reset refund are due
  f.db.refunds.push({id:'300',week:1,wallet:wallet(80),paid:e18(0.6)}); // an honest over-payment, first in week 1
  for(let i=0;i<11;i++)f.db.refunds.push({id:String(301+i),week:1,wallet:wallet(81+i),paid:e18(100)});
  await run(f.config,f.ports);
  const refund=id=>f.db.rows.find(r=>r.source_entry_id===id);
  assert.equal(refund('100').status,'confirmed','the honest pre-reset refund');
  assert.equal(f.db.rows.find(r=>r.week===0&&r.kind==='house').status,'confirmed','the house fee');
  // week 1's refunds: oldest first within WEEK_DMT_CAP (1000 DMT): 0.6 + 9 x 100; the last two wait
  const week1=f.db.rows.filter(r=>r.week===1&&r.kind==='refund');
  assert.deepEqual(week1.map(r=>r.status),[...Array(10).fill('confirmed'),'planned','planned']);
  assert.ok(week1.filter(r=>r.status==='confirmed').reduce((s,r)=>s+BigInt(r.amount),0n)<=f.config.weekCap);
  assert.equal(f.chain.broadcasts.length,12);
  await run(f.config,f.ports);
  assert.equal(f.chain.broadcasts.length,12,'the held-back rows stay held back');
  const notices=[...f.db.notices].filter(n=>n.includes('alert:DMT cap: '));
  assert.equal(notices.length,1); assert.ok(notices[0].length<200,notices[0]);
  assert.equal(notices[0],`live:alert:DMT cap: 2 row(s) held back, first row ${week1[10].id}`);
  assert.equal(f.messages.filter(s=>s.includes('DMT cap')).length,1,'one notice');
  assert.ok(!f.logs.some(s=>s.startsWith('PAUSED')),'nothing paused');
});
test('a planned row above TRANSFER_DMT_CAP is held back while the others send', async () => {
  const f=fixture(3); f.config.transferCap=decimal('3'); // prize1 is 3.6 DMT
  await run(f.config,f.ports);
  const prize1=f.db.rows.find(r=>r.kind==='prize1');
  assert.equal(prize1.status,'planned');
  assert.ok(f.db.rows.filter(r=>r.kind!=='rollover-note'&&r!==prize1).every(r=>r.status==='confirmed'));
  assert.equal(f.chain.broadcasts.length,4); // the refund, prizes 2 and 3, the house fee
  assert.ok(f.messages.some(s=>s.includes(`DMT cap: 1 row(s) held back, first row ${prize1.id}`)));
});
test('an already signed row over a cap still stops the run', async () => {
  const f=fixture(3); f.db.crashPrepared=true; await assert.rejects(run(f.config,f.ports)); f.db.crashPrepared=false;
  const signed=f.db.rows.find(r=>r.status==='sending'); assert.ok(signed.raw_tx);
  f.config.transferCap=units(signed.amount)-1n;
  await run(f.config,f.ports);
  assert.equal(f.chain.broadcasts.length,0);
  assert.ok(f.logs.includes(`PAUSED: weeks ${signed.week}: DMT cap`),f.logs.join('\n'));
  assert.equal(signed.status,'sending');
});
test('a flood of over-cap refunds is held back without a chain call each, and the honest payouts still go out (security pass 3 review)', async () => {
  const f = fixture(3);
  for (let i = 0; i < 40; i++) f.db.refunds.push({ id: String(700 + i), week: 0, wallet: wallet(7), paid: '600000000000000000000', forged: true }); // over TRANSFER_DMT_CAP
  f.chain.dmt += 40n * 600n * 10n ** 18n; // real over-payments are DMT that arrived in the wallet
  const before = f.chain.calls.filter((c) => c === 'eth_getTransactionReceipt').length;
  await run(f.config, f.ports);
  const receipts = f.chain.calls.filter((c) => c === 'eth_getTransactionReceipt').length - before;
  assert.ok(f.chain.broadcasts.length >= 3, 'prizes, house and the honest refund were sent');
  assert.ok(!f.logs.some((s) => s.includes('unverified refund')), 'the capped rows were never checked, so never paused the run');
  assert.ok(receipts < 20, `receipt lookups stay small: ${receipts}`);
  assert.ok(f.logs.some((s) => s.includes('HELD BACK')));
});

// Refund sources use the same 20-block canonicality policy as outgoing transfers.
for(const condition of ['orphan','wrong hash','missing block','missing block hash','malformed amount','extra topic','head unavailable','canonical unavailable'])test(`refund source ${condition} stops before signing`,async()=>{
  const f=fixture(3);
  await f.ports.rpc('sqs_payout_refunds',{p_key:'payout-key'});
  const row=f.db.rows.find(r=>r.kind==='refund'),r=f.chain.receipts.get(row.source_tx);
  if(condition==='orphan'){r.blockHash='0x'+'d'.repeat(64);for(const l of r.logs)l.blockHash=r.blockHash;}
  if(condition==='wrong hash')r.transactionHash='0x'+'d'.repeat(64);
  if(condition==='missing block')delete r.blockNumber;
  if(condition==='missing block hash')delete r.blockHash;
  if(condition==='malformed amount')r.logs[0].data='not a quantity';
  if(condition==='extra topic')r.logs[0].topics.push('0x'+'0'.repeat(64));
  const original=f.chain.request.bind(f.chain);
  f.chain.request=async(method,args)=>{
    if(condition==='head unavailable'&&method==='eth_blockNumber'||condition==='canonical unavailable'&&method==='eth_getBlockByNumber')throw Error('fixture RPC unavailable');
    return original(method,args);
  };
  let keys=0;f.ports.key=async()=>{keys++;throw Error('must not sign');};
  await run(f.config,f.ports);
  assert.equal(keys,0);
  assert.equal(f.chain.broadcasts.length,0);
  assert.ok(f.db.rows.every(r=>r.nonce==null),'no nonce claimed');
  assert.ok(f.logs.some(s=>s.startsWith('PAUSED:')),'unsafe source pauses the run');
});
test('a mature canonical refund source at exactly 20 blocks authorizes payment once',async()=>{
  const f=fixture(3);
  await f.ports.rpc('sqs_payout_refunds',{p_key:'payout-key'});
  const row=f.db.rows.find(r=>r.kind==='refund');
  const source=f.chain.receipts.get(row.source_tx);source.blockNumber='0x3d4';for(const l of source.logs)l.blockNumber=source.blockNumber; // 980
  const original=f.chain.request.bind(f.chain),canonical=[];
  f.chain.request=async(method,args)=>{if(method==='eth_getBlockByNumber')canonical.push(args);return original(method,args);};
  await run(f.config,f.ports);await run(f.config,f.ports);
  assert.equal(row.status,'confirmed');
  assert.equal(f.chain.broadcasts.length,5);
  assert.ok(canonical.some(args=>args[0]==='0x3d4'&&args[1]===false),'source block is checked');
});

test('an unsigned refund nonce claim rechecks its source before recovery signs',async()=>{
  const f=fixture(3);f.db.crashClaim=true;
  await assert.rejects(run(f.config,f.ports));f.db.crashClaim=false;
  const row=f.db.rows.find(r=>r.kind==='refund');
  assert.equal(row.status,'sending');assert.equal(row.raw_tx,null);
  f.chain.receipts.get(row.source_tx).blockHash='0x'+'d'.repeat(64);
  let keys=0;f.ports.key=async()=>{keys++;throw Error('must not sign');};
  await run(f.config,f.ports);
  assert.equal(keys,0);assert.equal(f.chain.broadcasts.length,0);
  assert.equal(row.nonce,'0');assert.equal(row.raw_tx,null);
});

for(const condition of ['duplicate','removed','wrong transaction','wrong block hash','wrong block number','missing index'])test(`refund source event ${condition} stops before any transfer is proposed`,async()=>{
  const f=fixture(3);f.config.live=false;
  await f.ports.rpc('sqs_payout_refunds',{p_key:'payout-key'});
  const row=f.db.rows.find(r=>r.kind==='refund'),r=f.chain.receipts.get(row.source_tx),event=r.logs[0];
  if(condition==='duplicate'){row.amount='1000000000000000000';r.logs.push(structuredClone(event));}
  if(condition==='removed')event.removed=true;
  if(condition==='wrong transaction')event.transactionHash='0x'+'d'.repeat(64);
  if(condition==='wrong block hash')event.blockHash='0x'+'d'.repeat(64);
  if(condition==='wrong block number')event.blockNumber='0x999';
  if(condition==='missing index')delete event.logIndex;
  let keys=0;f.ports.key=async()=>{keys++;throw Error('must not request a key');};
  await run(f.config,f.ports);
  assert.ok(f.logs.some(s=>s.includes('PAUSED: unverified refund row')));
  assert.ok(!f.logs.some(s=>s.startsWith('WOULD SEND')));
  assert.equal(keys,0);assert.equal(f.chain.broadcasts.length,0);assert.ok(f.db.rows.every(r=>r.nonce==null));
});

test('distinct source event indices preserve genuine split refund payments',async()=>{
  const f=fixture(3);f.config.live=false;
  await f.ports.rpc('sqs_payout_refunds',{p_key:'payout-key'});
  const row=f.db.rows.find(r=>r.kind==='refund'),r=f.chain.receipts.get(row.source_tx),event=r.logs[0];
  event.data='0x'+250000000000000000n.toString(16).padStart(64,'0');
  r.logs.push({...event,logIndex:'0x2'});
  await run(f.config,f.ports);
  assert.ok(f.logs.some(s=>s.startsWith(`WOULD SEND row ${row.id} refund`)));
  assert.ok(!f.logs.some(s=>s.startsWith('PAUSED:')));assert.equal(f.chain.broadcasts.length,0);
});
