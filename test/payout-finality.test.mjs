import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/payout.mjs';
import {run} from '../tools/payout/runner.mjs';

async function refundOnly() {
  const f=fixture(0);f.db.now=Date.UTC(2026,10,9,0,55);
  await f.ports.rpc('sqs_payout_refunds',{p_key:'payout-key'});
  f.row=f.db.rows.find(r=>r.kind==='refund');f.source=f.chain.receipts.get(f.row.source_tx);
  return f;
}
function sourceHeight(f,height) {
  f.source.blockNumber='0x'+height.toString(16);
  for(const event of f.source.logs)event.blockNumber=f.source.blockNumber;
}
function noSigning(f) {
  const key=f.ports.key;let keys=0;f.ports.key=async()=>{keys++;return key();};
  return ()=>{assert.equal(keys,0);assert.equal(f.chain.broadcasts.length,0);assert.ok(f.db.rows.every(r=>r.nonce==null));};
}

test('a refund waits for finalized source, then the exact boundary permits one transfer',async()=>{
  const f=await refundOnly();f.chain.finalized=969n;
  await run(f.config,f.ports);
  assert.equal(f.chain.broadcasts.length,0);assert.equal(f.row.nonce,null);assert.equal(f.row.raw_tx,null);
  f.chain.finalized=970n;await run(f.config,f.ports);await run(f.config,f.ports);
  assert.equal(f.chain.broadcasts.length,1);assert.equal(f.row.status,'confirmed');
});

for(const condition of ['missing','malformed height','missing hash','ahead of head','forked checkpoint','bad timestamp'])test(`unusable finalized checkpoint ${condition} stops before signing`,async()=>{
  const f=await refundOnly(),original=f.chain.request.bind(f.chain),check=noSigning(f);
  f.chain.request=async(method,args)=>{
    const r=await original(method,args);
    if(method!=='eth_getBlockByNumber')return r;
    if(args[0]==='finalized'){
      if(condition==='missing')return null;
      if(condition==='malformed height')return {...r,number:'not a quantity'};
      if(condition==='missing hash')return {...r,hash:null};
      if(condition==='ahead of head')return {...r,number:'0x9999'};
      if(condition==='forked checkpoint')return {...r,hash:'0x'+'d'.repeat(64)};
      if(condition==='bad timestamp')return {...r,timestamp:'0x'+'f'.repeat(64)};
    }
    return r;
  };
  await run(f.config,f.ports);check();assert.ok(f.logs.some(s=>s.startsWith('PAUSED:')));
});

for(const condition of ['unfinalized','shallow'])test(`${condition} planned refund does not block mature awards`,async()=>{
  const f=fixture(3);f.chain.finalized=condition==='unfinalized'?969n:1000n;
  if(condition==='shallow'){
    await f.ports.rpc('sqs_payout_refunds',{p_key:'payout-key'});
    const source=f.chain.receipts.get(f.db.rows[0].source_tx);source.blockNumber='0x3d5';for(const l of source.logs)l.blockNumber=source.blockNumber;
  }
  await run(f.config,f.ports);
  assert.equal(f.chain.broadcasts.length,4);assert.equal(f.db.rows.find(r=>r.kind==='refund').nonce,null);
  assert.ok(f.db.rows.filter(r=>r.kind!=='refund'&&r.kind!=='rollover-note').every(r=>r.status===(condition==='unfinalized'?'sent':'confirmed')));
});

test('verified mined transfers batch without premature confirmation or double DMT/gas reservation',async()=>{
  const f=fixture(3);await f.ports.rpc('sqs_payout_refunds',{p_key:'payout-key'});
  const source=f.chain.receipts.get(f.db.rows[0].source_tx);source.blockNumber='0x320';for(const l of source.logs)l.blockNumber=source.blockNumber;
  f.chain.finalized=900n;f.chain.dmt=10000000000000000000n+500000000000000000n;
  await run(f.config,f.ports);
  assert.equal(f.chain.broadcasts.length,5);assert.ok(f.db.rows.filter(r=>r.kind!=='rollover-note').every(r=>r.status==='sent'));
  f.db.refunds.push({id:'101',week:0,wallet:f.db.rows[0].wallet,paid:'500000000000000000'});
  await f.ports.rpc('sqs_payout_refunds',{p_key:'payout-key'});
  const next=f.db.rows.find(r=>r.source_entry_id==='101'),nextSource=f.chain.receipts.get(next.source_tx);
  nextSource.blockNumber='0x320';for(const l of nextSource.logs)l.blockNumber=nextSource.blockNumber;
  f.chain.dmt+=500000000000000000n;f.chain.eth=2400000000000n;
  await run(f.config,f.ports);assert.equal(f.chain.broadcasts.length,6);assert.ok(!f.logs.some(s=>s.includes('DMT balance')||s.includes('ETH balance')));
  f.chain.finalized=1000n;await run(f.config,f.ports);
  assert.equal(f.chain.broadcasts.length,6);assert.ok(f.db.rows.filter(r=>r.kind!=='rollover-note').every(r=>r.status==='confirmed'));
});

for(const condition of ['missing source','unfinalized source','removed event'])test(`saved refund bytes recheck ${condition} before rebroadcast`,async()=>{
  const f=await refundOnly();f.db.crashPrepared=true;
  await assert.rejects(run(f.config,f.ports));f.db.crashPrepared=false;
  const bytes=f.row.raw_tx,nonce=f.row.nonce;assert.ok(bytes);
  if(condition==='missing source')f.chain.receipts.delete(f.row.source_tx);
  if(condition==='unfinalized source')f.chain.finalized=969n;
  if(condition==='removed event')f.source.logs[0].removed=true;
  let keys=0;f.ports.key=async()=>{keys++;throw Error('must reuse saved bytes');};
  await run(f.config,f.ports);
  assert.equal(f.chain.broadcasts.length,0);assert.equal(keys,0);assert.equal(f.row.raw_tx,bytes);assert.equal(f.row.nonce,nonce);
  f.chain.receipts.set(f.row.source_tx,f.source);f.source.logs[0].removed=false;f.chain.finalized=1000n;
  await run(f.config,f.ports);await run(f.config,f.ports);
  assert.equal(f.chain.broadcasts.length,1);assert.equal(keys,0);assert.equal(f.row.raw_tx,bytes);assert.equal(f.row.status,'confirmed');
});

test('source disappearing after durable preparation stops broadcast and preserves signed bytes',async()=>{
  const f=await refundOnly(),original=f.ports.rpc;
  f.ports.rpc=async(fn,p)=>{const r=await original(fn,p);if(fn==='sqs_payout_mark'&&p.p_raw)f.chain.receipts.delete(f.row.source_tx);return r;};
  await run(f.config,f.ports);
  assert.ok(f.row.raw_tx);assert.equal(f.chain.broadcasts.length,0);assert.equal(f.row.status,'sending');
});

test('soft reverted receipt remains in flight until finalized',async()=>{
  const f=await refundOnly();sourceHeight(f,800n);f.chain.finalized=900n;f.chain.reverted=true;
  await run(f.config,f.ports);assert.equal(f.chain.broadcasts.length,1);assert.equal(f.row.status,'sent');
  f.chain.finalized=1000n;await run(f.config,f.ports);assert.equal(f.row.status,'failed');assert.equal(f.chain.broadcasts.length,1);
});

test('an occupied refund nonce waiting for finality cannot be skipped by later awards',async()=>{
  const f=fixture(3);f.db.crashClaim=true;await assert.rejects(run(f.config,f.ports));f.db.crashClaim=false;
  f.chain.finalized=969n;await run(f.config,f.ports);
  assert.equal(f.chain.broadcasts.length,0);assert.equal(f.db.rows.filter(r=>r.nonce!=null).length,1);
});

test('award funding week must lie behind finalized checkpoint time',async()=>{
  const f=fixture(3);f.db.refunds=[];
  const original=f.chain.request.bind(f.chain);
  f.chain.request=async(method,args)=>{const r=await original(method,args);return method==='eth_getBlockByNumber'?{...r,timestamp:'0x'+Math.floor(Date.UTC(2026,10,8)/1000).toString(16)}:r;};
  const check=noSigning(f);await run(f.config,f.ports);check();
});

test('a self-consistent future finalized checkpoint cannot authorize an award',async()=>{
  const f=fixture(3);f.db.refunds=[];f.chain.finalized=2000n;
  const check=noSigning(f);await run(f.config,f.ports);check();
});

for(const condition of ['removed','wrong transaction','wrong block','wrong number','invalid status','contradictory revert','malformed topics','malformed data','missing address','missing context'])test(`outgoing ${condition} proof never irreversibly settles a transfer`,async()=>{
  const f=await refundOnly(),original=f.chain.request.bind(f.chain);
  f.chain.request=async(method,args)=>{
    const r=await original(method,args);
    if(method!=='eth_getTransactionReceipt'||!r||args[0]===f.row.source_tx)return r;
    const copy=structuredClone(r),event=copy.logs[0];
    if(condition==='removed')event.removed=true;
    if(condition==='wrong transaction')event.transactionHash='0x'+'d'.repeat(64);
    if(condition==='wrong block')event.blockHash='0x'+'d'.repeat(64);
    if(condition==='wrong number')event.blockNumber='0x999';
    if(condition==='invalid status')copy.status='0x2';
    if(condition==='contradictory revert')copy.status='0x0';
    if(condition==='malformed topics')event.topics=null;
    if(condition==='malformed data')event.data='not ABI data';
    if(condition==='missing address')delete event.address;
    if(condition==='missing context')delete event.blockHash;
    return copy;
  };
  await run(f.config,f.ports);await run(f.config,f.ports);
  assert.equal(f.chain.broadcasts.length,1);assert.equal(f.row.status,'sent');
});
