import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fixture, wallet, key } from './helpers/payout.mjs';
import { sqlDB } from './helpers/payout-sql-db.mjs';
import { run } from '../tools/payout/runner.mjs';
import { decimal } from '../tools/payout/core.mjs';

for (const count of [1, 2]) test(`real SQL pays ${count} finalized refund(s) on the first invocation`, {skip:!process.env.SQS_PGLITE}, async () => {
  const f=fixture(0),pg=await sqlDB();f.db.now=Date.UTC(2026,10,9,0,55);f.chain.dmt=BigInt(count)*decimal('0.5');
  try {
    for(const name of ['update2','update3','update5','update6','update7','update8','update9','update10'])await pg.db.exec(await readFile(new URL(`../tools/supabase/${name}.sql`,import.meta.url),'utf8'));
    await pg.db.exec("create or replace function pg_catalog.now() returns timestamptz language sql stable as $$ select '2026-11-09T00:55:00Z'::timestamptz $$;");
    for(let n=1;n<=count;n++) {
      const source_tx='0x'+String(n).repeat(64);
      await pg.db.exec(`insert into sqs_ranked_entries(week,wallet,tx,paid,ip_hash,seed,refund_reason) values(0,'${wallet(n)}','${source_tx}',500000000000000000,'fixture',1,'fixture reset');`);
      f.db.onRefund({source_tx,wallet:wallet(n),amount:'500000000000000000'});
    }
    f.ports.rpc=pg.rpc;
    await run(f.config,f.ports);
    assert.equal(f.chain.broadcasts.length,count,'a successful claim must preserve source proof for the final recheck');
    assert.equal(f.chain.dmt,0n);
    const state=await pg.rpc('sqs_payout_read',{p_key:'payout-key'});
    assert.equal(state.weeks.length,0);assert.equal(state.rows.filter(r=>r.status==='confirmed').length,count);
    await run(f.config,f.ports);assert.equal(f.chain.broadcasts.length,count,'follow-up never pays twice');
  } finally {await pg.db.close();}
});

for(const [label,mutate] of [
  ['recipient', r=>r.row.wallet=wallet(50)],
  ['amount', r=>r.row.amount=decimal('5').toString()],
  ['kind', r=>r.row.kind='house'],
  ['race', r=>r.row.mode='hard'],
  ['week', r=>r.row.week=1],
  ['identity', r=>r.row.id='999'],
  ['refund source on a prize', r=>r.row.source_entry_id=99],
  ['missing row', r=>delete r.row],
  ['missing acknowledgment', r=>delete r.ok],
  ['wrong status', r=>r.row.status='planned'],
  ['numeric nonce', r=>r.row.nonce=0],
  ['noncanonical nonce', r=>r.row.nonce='00'],
  ['stale nonce', r=>r.row.nonce='0'],
  ['wrong scan block', r=>r.row.scan_block='0'],
  ['unexpected raw transaction', r=>r.row.raw_tx='0x02aa'],
  ['unexpected transaction hash', r=>r.row.tx_hash='0x'+'a'.repeat(64)],
])test(`claim ${label} cannot replace preflight approval`,async()=>{
  const f=fixture(3),original=f.ports.rpc;let keys=0,caught;
  f.db.refunds=[];
  if(label==='stale nonce')f.chain.pending=5n;
  f.ports.key=async()=>{keys++;return key;};
  f.ports.rpc=async(fn,p)=>{const r=await original(fn,p);if(fn==='sqs_payout_claim'&&r.ok)mutate(r);return r;};
  try{await run(f.config,f.ports);}catch(e){caught=e;}
  assert.equal(f.chain.broadcasts.length,0,'inconsistent claim must not broadcast');
  assert.ok(f.db.rows.every(r=>r.raw_tx==null),'inconsistent claim must not persist a signature');
  assert.equal(keys,0,'inconsistent claim must not request a key');
  assert.equal(caught,undefined,'claim ambiguity pauses with a durable unsigned nonce');
  assert.ok(f.logs.some(s=>s.startsWith('PAUSED:')));
});

for(const source of [101,9007199254740992])test(`claim refund source ${source} cannot replace its checked source identity`,async()=>{
  const f=fixture(0),original=f.ports.rpc;f.db.now=Date.UTC(2026,10,9,0,55);let keys=0;
  if(!Number.isSafeInteger(source))f.db.refunds[0].id=String(source);
  f.ports.key=async()=>{keys++;return key;};
  f.ports.rpc=async(fn,p)=>{const r=await original(fn,p);if(fn==='sqs_payout_claim'&&r.ok)r.row.source_entry_id=source;return r;};
  await run(f.config,f.ports);
  assert.equal(f.chain.broadcasts.length,0);assert.equal(keys,0);assert.ok(f.db.rows.every(r=>r.raw_tx==null));
  assert.ok(f.logs.some(s=>s.startsWith('PAUSED:')));
});

test('claim cannot reuse a nonce already reserved elsewhere in the checked ledger',async()=>{
  const f=fixture(3),original=f.ports.rpc;let keys=0;
  f.db.refunds=[];
  f.ports.key=async()=>{keys++;return key;};
  f.ports.rpc=async(fn,p)=>{
    const r=await original(fn,p);
    if(fn==='sqs_payout_read'&&r.weeks.length){const other=r.rows.find(r=>r.kind==='house');other.status='held';other.nonce='5';}
    if(fn==='sqs_payout_claim'&&r.ok)r.row.nonce='5';
    return r;
  };
  await run(f.config,f.ports);
  assert.equal(f.chain.broadcasts.length,0);assert.equal(keys,0);assert.ok(f.db.rows.every(r=>r.raw_tx==null));
  assert.ok(f.logs.some(s=>s.startsWith('PAUSED:')));
});

test('claim-only metadata cannot replace the checked refund source transaction',async()=>{
  const f=fixture(0),original=f.ports.rpc;f.db.now=Date.UTC(2026,10,9,0,55);
  f.ports.rpc=async(fn,p)=>{const r=await original(fn,p);if(fn==='sqs_payout_claim'&&r.ok)r.row.source_tx='0x'+'a'.repeat(64);return r;};
  await run(f.config,f.ports);
  assert.equal(f.chain.broadcasts.length,1);assert.equal(f.db.rows[0].status,'confirmed');
});

test('a repeated acknowledgment nonce cannot sign the next row when the provider pending count is stale',async()=>{
  const f=fixture(3),rpc=f.ports.rpc,request=f.chain.request.bind(f.chain);f.db.refunds=[];
  f.chain.request=async(method,args)=>method==='eth_getTransactionCount'&&f.chain.broadcasts.length?'0x0':request(method,args);
  f.ports.rpc=async(fn,p)=>{const r=await rpc(fn,p);if(fn==='sqs_payout_claim'&&r.ok)r.row.nonce='0';return r;};
  await run(f.config,f.ports);
  assert.equal(f.chain.broadcasts.length,1);
  assert.equal(f.db.rows.filter(r=>r.raw_tx!=null).length,1,'the second acknowledgment must be rejected before signing');
  const next=f.db.rows.find(r=>r.nonce==='1');assert.ok(next);assert.equal(next.raw_tx,null);
  assert.ok(f.logs.some(s=>s.includes('invalid payout claim')));
});

test('key loading failure after a valid claim recovers the same unsigned nonce',async()=>{
  const f=fixture(3),load=f.ports.key;f.ports.key=async()=>{throw Error('fixture key unavailable');};
  await assert.rejects(run(f.config,f.ports),/fixture key unavailable/);
  const row=f.db.rows.find(r=>r.status==='sending');assert.ok(row);assert.equal(row.nonce,'0');assert.equal(row.raw_tx,null);
  assert.equal(f.chain.broadcasts.length,0);
  f.ports.key=load;await run(f.config,f.ports);
  assert.equal(f.chain.broadcasts.length,5);assert.equal(f.chain.broadcasts[0].nonce,0n);
  assert.ok(f.db.rows.filter(r=>r.kind!=='rollover-note').every(r=>r.status==='confirmed'));
});
