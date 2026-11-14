import test, { beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { Readable } from 'node:stream';
import { createHmac, randomBytes } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { rankedSim, RunRecorder, runSeconds, replay } from '../src/ranked.js';
import { step, choose, TICK } from '../src/sim.js';
import { ADVENTURERS } from '../src/content.js';
import { RankedDB } from './helpers/ranked-db.mjs';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

Object.assign(process.env, { SUPABASE_URL: 'https://db.test', SUPABASE_KEY: 'dummy', SQS_TICKET_SECRET: 'ticket-secret', SQS_SERVER_KEY: 'server-key', SQS_RANKED: 'on' });
// The server replays with the rules of the code under test (a fresh bundle in a temp folder), not the last deployed version
// in tools/vercel-api/sims: a rule change since the last deploy would otherwise make honest runs fail.
const BUILD_TEST = 'test-client', CLIENT = {build: BUILD_TEST, sim: 'abcdefabcdef'};
const SIM_TEST_ID = 'abcdefabcdef', simsDir = mkdtempSync(path.join(tmpdir(), 'sqs-sims-'));
mkdirSync(path.join(simsDir, SIM_TEST_ID));
execFileSync(fileURLToPath(new URL('../node_modules/esbuild/bin/esbuild', import.meta.url)), [fileURLToPath(new URL('../tools/vercel-api/ranked-entry.mjs', import.meta.url)), '--bundle', '--platform=node', '--format=cjs', '--target=node22', '--log-level=error', `--outfile=${path.join(simsDir, SIM_TEST_ID, 'ranked-bundle.cjs')}`]);
copyFileSync(new URL('../tools/vercel-api/ground.bin', import.meta.url), path.join(simsDir, SIM_TEST_ID, 'ground.bin'));
writeFileSync(path.join(simsDir, 'current.txt'), SIM_TEST_ID);
process.env.SQS_SIMS_DIR = simsDir;
after(() => rmSync(simsDir, { recursive: true, force: true }));
const require = createRequire(import.meta.url);
const handler = require('../tools/vercel-api/index.js');
const ranked = require('../tools/vercel-api/ranked.js');
const { secp256k1, keccak_256 } = require('../tools/vercel-api/noble-crypto.cjs');
const cur = ranked.currentSim(), sim = ranked.load(cur), originalGround = sim.ground;
// Exercise the real archived replay, with the requested ground:null fixture.
sim.ground = null;
const originalNow = Date.now, originalFetch = globalThis.fetch;
let now, db, chain, blocks, serial, submits;
Date.now = () => now;
const epoch = Date.UTC(2026, 10, 2), weekMs = 7 * 86400000;
const DMT = '0x8b0e6f19ee57089f7649a455d89d7bc6314d04e8';
const TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const pad = a => '0x' + a.slice(2).padStart(64, '0');
const signed = obj => { const body = Buffer.from(JSON.stringify(obj)).toString('base64url'); return body + '.' + createHmac('sha256', 'ticket-secret').update(body).digest('base64url'); };
const decode = s => JSON.parse(Buffer.from(s.split('.')[0], 'base64url'));
function wallet() {
  const key = randomBytes(32), pub = secp256k1.getPublicKey(key, false);
  return { address: '0x' + Buffer.from(keccak_256(pub.subarray(1))).subarray(-20).toString('hex'), sign(message) {
    const msg = Buffer.from(message), hash = keccak_256(Buffer.concat([Buffer.from(`\x19Ethereum Signed Message:\n${msg.length}`), msg]));
    const sig = secp256k1.sign(hash, key, { prehash: false, format: 'recovered' });
    return '0x' + Buffer.concat([sig.subarray(1), Buffer.from([sig[0] + 27])]).toString('hex');
  } };
}
globalThis.fetch = async (url, opts) => {
  const u = new URL(url), p = JSON.parse(opts.body);
  let result;
  if (u.origin === 'https://db.test' && u.pathname.startsWith('/rest/v1/rpc/')) result = await db.rpc(u.pathname.split('/').at(-1), p);
  else if (['arb1.arbitrum.io', 'arbitrum-one-rpc.publicnode.com'].includes(u.hostname)) {
    if (p.method === 'eth_getTransactionReceipt') result = chain.get(p.params[0]) ?? null;
    else if (p.method === 'eth_getBlockByNumber') result = blocks.get(p.params[0]) ?? null;
    else throw new Error('unexpected chain method ' + p.method);
    result = { jsonrpc: '2.0', id: p.id, result };
  } else throw new Error('offline test blocked URL ' + url);
  return new Response(JSON.stringify(result), { status: 200 });
};
beforeEach(() => { writeFileSync(path.join(simsDir, 'client.json'), JSON.stringify(CLIENT)); now = epoch + 12 * 3600000; db = new RankedDB({enforceClock:true}); chain = new Map(); blocks = new Map(); serial = 0; submits = []; });
after(() => { Date.now = originalNow; globalThis.fetch = originalFetch; sim.ground = originalGround; });
let slowRefusalOk = false; // a refusal from the database after a full replay is allowed to take the replay's time
async function call(route, body, { ip = '192.0.2.1', method = body === undefined ? 'GET' : 'POST', headers = {}, responseHeaders = {} } = {}) {
  const req = Readable.from(body === undefined ? [] : [Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))]);
  Object.assign(req, { method, url: '/api/' + route, headers: { 'content-type': 'application/json', 'x-forwarded-for': ip, ...headers } });
  const cpu = process.cpuUsage();
  const out = await new Promise((resolve, reject) => {
    const res = { statusCode: 200, setHeader(k,v) { responseHeaders[k.toLowerCase()]=v; }, end(s) { resolve({ code: this.statusCode, json: JSON.parse(s) }); } };
    handler(req, res).catch(reject);
  });
  // refused submits must stay cheap; an accepted endless run replays as long as it lasted (up to 2:00:00, minutes)
  if (route === 'ranked-submit') { const used = process.cpuUsage(cpu); submits.push((used.user + used.system) / 1000); if (out.code !== 200 && !slowRefusalOk) assert.ok(submits.at(-1) < 2000, `refused submit CPU ${submits.at(-1)}ms exceeds 2s`); }
  return out;
}
const expectError = (r, code, error) => assert.deepEqual(r, { code, json: { error } });
const nonceRoute=(w,mode='normal')=>'ranked-nonce?'+new URLSearchParams({wallet:w.address,mode,...CLIENT,deadline:epoch+(Math.floor((now-epoch)/weekMs)+1)*weekMs});
async function nonce(w, opts = {}) { const r = await call(nonceRoute(w,opts.mode), undefined, opts); assert.equal(r.code, 200, JSON.stringify(r)); return { nonce: r.json.nonce, signature: w.sign(r.json.message), message: r.json.message, amountWei: r.json.amountWei }; }
// A signed nonce from before the race closed; never requests a new Hard authorization.
function legacyHardNonce(w) {
 const nonce=signed({k:'rnonce',w:Math.floor((now-epoch)/weekMs),s:now,n:'pre-closure-fixture',m:'hard'}),message=ranked.enterMessage(nonce,Math.floor((now-epoch)/weekMs),'hard');
 return{nonce,message,signature:w.sign(message),amountWei:'2000000000000000000'};
}
function payment(w, { amount = now >= epoch + weekMs ? 1000000000000000000n : 500000000000000000n, token = DMT, recipient = ranked.COLLECT, status = '0x1', at = now, amounts } = {}) {
  const tx = '0x' + (++serial).toString(16).padStart(64, '0'), blockNumber = '0x' + serial.toString(16);
  const blockHash = '0x' + (1000 + serial).toString(16).padStart(64, '0');
  chain.set(tx, { transactionHash: tx, status, blockNumber, blockHash, logs: (status === '0x0' ? [] : amounts ?? [amount]).map((n, i) => ({ address: token, topics: [TRANSFER, pad(w.address), pad(recipient)], data: '0x' + n.toString(16).padStart(64, '0'), removed: false, transactionHash: tx, blockNumber, blockHash, transactionIndex: '0x0', logIndex: '0x' + i.toString(16) })) });
  blocks.set(blockNumber, { number: blockNumber, hash: blockHash, timestamp: '0x' + Math.floor(at / 1000).toString(16) });
  return tx;
}
async function enter(w = wallet(), opts = {}) {
  const { message, amountWei, ...auth } = await nonce(w, opts), tx = payment(w, { amount: BigInt(amountWei), ...opts }), r = await call('ranked-enter', { ...auth, tx }, opts);
  assert.equal(r.code, 200, JSON.stringify(r)); return { ...r.json, auth, tx, w };
}
async function start(e, extra = {}) {
  const r = await call('ranked-start', { entry: e.entry, adv: 'adventurer', sim: cur, build:BUILD_TEST, deadline:epoch+(Math.floor((now-epoch)/weekMs)+1)*weekMs, ...extra }); assert.equal(r.code, 200, JSON.stringify(r)); return r.json;
}
async function legacyStart(e) { const row=db.rows.find(x=>x.id===e.id);Object.assign(row,{started_at:now,adv:'adventurer'});return start(e); }
function play(run) {
  const s = rankedSim({ seed: run.seed, mapId: run.map, adv: run.adv, ground: null, week: run.week, mode: run.mode }), rec = new RunRecorder(), p = s.players[0];
  while (!s.over) {
    if (s.pending.p1) { rec.pick(0); choose(s, 'p1', 0); continue; }
    // Honest, modest movement; no forced death or edited simulation state.
    const before = s.tick;
    step(s, { p1: rec.input(Math.cos(s.t * .4) * .3, Math.sin(s.t * .4) * .3, s.tick % 900 === 450 ? 0 : null) }, TICK);
    rec.after(s.tick !== before); s.fx.length = 0;
    assert.ok(s.tick <= runSeconds(run.week) * 30);
  }
  return { log: rec.log(), result: { t: Math.floor(s.t), kills: s.kills, level: s.level, won: s.over === 'win' } };
}
async function ready(w, opts) { const e = await enter(w, opts), run = await start(e), played = play(run); now += (played.result.t + 10) * 1000; return { e, run, ...played }; }
const submit = (r, log = r.log) => call('ranked-submit', { run: r.run.run, name: 'Tester', log });

test('a pre-restart token cannot claim the replacement run', async () => {
  const r = await ready(), token = decode(r.run.run);
  await db.rpc('sqs_ranked_restart', { p_server_key:'server-key', p_id:token.id, p_wallet:token.a, p_started:token.s, p_seed:1234 });
  now += 1000; await start(r.e);
  expectError(await submit(r), 400, 'that run was already sent');
  assert.equal(db.rows[0].claimed_at, undefined);
});

for (const stage of ['claim', 'finish']) test(`lost ${stage} response retries the same run without losing its score`, async t => {
  const r = await ready(), original = db.rpc.bind(db);
  let failed = false;
  db.rpc = async (fn, p) => {
    const out = await original(fn, p);
    if (!failed && fn === 'sqs_ranked_' + stage + '_v2') { failed = true; throw new Error('fixture: response lost'); }
    return out;
  };
  t.mock.method(console, 'error', () => {});
  slowRefusalOk = true;
  try { assert.equal((await submit(r)).code, 500); } finally { slowRefusalOk = false; }
  assert.equal((await submit(r)).code, 200);
  assert.equal(db.rows.filter(e => e.verdict === 'ok').length, 1);
});

test('a transient finish failure releases only the lease and keeps the original log binding', async () => {
  const r = await ready(); db.finishError = 'temporary storage failure'; slowRefusalOk = true;
  try { assert.equal((await submit(r)).code, 503); } finally { slowRefusalOk = false; }
  db.finishError = null;
  const changed = structuredClone(r.log); changed.runs[0][1] = changed.runs[0][1] === 0 ? 1 : 0;
  expectError(await submit(r, changed), 400, 'that run was already sent');
  assert.equal((await submit(r)).code, 200);
});

test('a crashed worker recovers after lease expiry using the original receipt time', async t => {
  const r = await ready(), original = db.rpc.bind(db);
  let crash = true;
  db.rpc = async (fn,p) => {
    if (crash && (fn === 'sqs_ranked_finish_v2' || fn === 'sqs_ranked_release_v2')) throw new Error('fixture: worker unavailable');
    return original(fn,p);
  };
  t.mock.method(console,'error',()=>{});
  slowRefusalOk = true;
  try { assert.equal((await submit(r)).code,500); } finally { slowRefusalOk = false; }
  assert.equal((await submit(r)).code,409);
  now += 900001; crash = false;
  assert.equal((await submit(r)).code,200,'waiting for recovery must not trigger the slower-than-real-time rejection');
});

test('waiting after a failed finish cannot cure a too-fast first submission', async () => {
  const r = await ready(); now = decode(r.run.run).s; db.finishError='temporary failure';
  assert.equal((await submit(r)).code,503);
  now += 900001; db.finishError=null;
  expectError(await submit(r),400,'this run did not check out (faster than real time)');
  const finished = db.rows[0].finished_at;
  expectError(await submit(r),400,'this run did not check out (faster than real time)');
  assert.equal(db.rows[0].finished_at,finished,'rejected receipts are idempotent too');
});

test('missing submission migration fails closed without falling back to an unbound claim', async t => {
  const r = await ready(), original = db.rpc.bind(db), calls=[];
  db.rpc = async (fn,p) => { calls.push(fn); if(fn.endsWith('_v2')) throw new Error('fixture: migration missing'); return original(fn,p); };
  t.mock.method(console,'error',()=>{});
  assert.equal((await submit(r)).code,500);
  assert.ok(!calls.includes('sqs_ranked_claim'));
  assert.equal(db.rows[0].claimed_at,undefined);
});

test('receipt admission throttles before chain RPC and preserves the payment for retry', async t => {
  const w=wallet(), auth=await nonce(w), tx=payment(w), original=globalThis.fetch;
  let chainReads=0;
  t.mock.method(globalThis,'fetch',async(url,opts)=>{ if(!String(url).startsWith('https://db.test/')) chainReads++; return original(url,opts); });
  db.receiptBlocked=true;
  const busy=await call('ranked-enter',{nonce:auth.nonce,signature:auth.signature,tx});
  assert.equal(busy.code,429); assert.equal(busy.json.retry,true);
  assert.equal(chainReads,0); assert.equal(db.rows.length,0);
  db.receiptBlocked=false; now+=3000;
  assert.equal((await call('ranked-enter',{nonce:auth.nonce,signature:auth.signature,tx})).code,200);
});

test('honest signed paid run is replayed, retained and listed once', async t => {
  const r = await ready();
  assert.deepEqual(await submit(r), { code: 200, json: { ok: true, ...r.result, mode: 'normal', rank: 1 } });
  const board = await call('ranked-week');
  assert.equal(board.json.entries, 1); assert.equal(board.json.poolDmt, .45);
  assert.equal(board.json.rows.length, 1); assert.equal(board.json.rows[0].wallet, r.e.w.address);
  assert.equal(board.json.rows[0].t, r.result.t);
  assert.deepEqual(JSON.parse(gunzipSync(Buffer.from(db.rows[0].log, 'base64'))), JSON.parse(JSON.stringify(r.log)));
  const firstFinish = db.rows[0].finished_at;
  now += 86400000;
  assert.deepEqual(await submit(r), { code: 200, json: { ok: true, ...r.result, mode: 'normal', rank: 1 } });
  assert.equal(db.rows[0].finished_at, firstFinish, 'cached receipt never rewrites finish time, even after the send window');
  t.diagnostic(`submit CPU (ms): ${submits.map(n => n.toFixed(1)).join(', ')}`);
});

test('payment attacks have exact refusals; split transfers from one wallet count', async () => {
  const w = wallet(), auth = await nonce(w);
  for (const options of [{ token: wallet().address }, { recipient: wallet().address }, { amount: 499900000000000000n }]) {
    expectError(await call('ranked-enter', { ...auth, tx: payment(w, options) }), 400, 'that transaction did not send 0.5 DMT from your wallet to the entry address');
  }
  expectError(await call('ranked-enter', { ...auth, tx: payment(w, { status: '0x0' }) }), 400, 'that payment failed on-chain');
  assert.deepEqual(await call('ranked-enter', { ...auth, tx: '0x' + 'f'.repeat(64) }), { code: 503, json: { error: 'that payment is not on Arbitrum yet. Wait a few seconds and try again', retry: true } });
  const tx = payment(w, { amounts: [200000000000000000n, 300000000000000000n] });
  const first = await call('ranked-enter', { ...auth, tx }); assert.equal(first.code, 200);
  const again = await call('ranked-enter', { ...auth, tx }); assert.equal(again.json.id, first.json.id); assert.equal(again.json.again, true); assert.equal(db.rows.length, 1);
  const b = wallet(), bAuth = await nonce(b, { ip: '192.0.2.2' });
  expectError(await call('ranked-enter', { ...bAuth, tx }, { ip: '192.0.2.2' }), 400, 'that transaction did not send 0.5 DMT from your wallet to the entry address');
});

test('receipt proof inconsistencies cannot create an entry or refund', async t => {
  for (const [label, mutate] of [
    ['another transaction', r => r.transactionHash = '0x' + 'a'.repeat(64)],
    ['missing transaction identity', r => delete r.transactionHash],
    ['unmined receipt', r => { r.blockNumber = null; r.blockHash = null; }],
    ['invalid block selector', r => r.blockNumber = 'latest'],
    ['noncanonical block', (r, b) => b.hash = '0x' + 'b'.repeat(64)],
    ['wrong block number', (r, b) => b.number = '0x987'],
    ['missing canonical hash', (r, b) => delete b.hash],
    ['unsafe timestamp', (r, b) => b.timestamp = '0x' + 'f'.repeat(64)],
    ['invalid receipt status', r => r.status = '0x2'],
    ['wrong reverted receipt', r => { r.status = '0x0'; r.transactionHash = '0x' + 'a'.repeat(64); }],
    ['reverted receipt containing a Transfer', r => r.status = '0x0'],
    ['removed log in a reverted receipt', r => { r.status = '0x0'; r.logs[0].removed = true; }],
  ]) await t.test(label, async () => {
    const w = wallet(), auth = await nonce(w), tx = payment(w), receipt = chain.get(tx);
    mutate(receipt, blocks.get(receipt.blockNumber));
    const out = await call('ranked-enter', { ...auth, tx });
    assert.equal(out.code, 503, JSON.stringify(out));
    assert.equal(out.json.retry, true);
    assert.equal(db.rows.length, 0, 'inconsistent proof cannot create an entry or an owed refund');
  });
});

test('receipt proof rejects removed or malformed matching Transfer events', async t => {
  for (const [label, mutate] of [
    ['removed event', l => l.removed = true],
    ['event belongs to another transaction', l => l.transactionHash = '0x' + 'c'.repeat(64)],
    ['event belongs to another block', l => l.blockHash = '0x' + 'd'.repeat(64)],
    ['event block number differs', l => l.blockNumber = '0x888'],
    ['short amount', l => l.data = '0x6f05b59d3b20000'],
    ['decimal amount', l => l.data = '500000000000000000'],
    ['extra indexed topic', l => l.topics.push('0x' + 'e'.repeat(64))],
    ['missing event block identity', l => delete l.blockHash],
    ['missing event index', l => delete l.logIndex],
    ['invalid event index', l => l.logIndex = '0x'],
  ]) await t.test(label, async () => {
    const w = wallet(), auth = await nonce(w), tx = payment(w);
    mutate(chain.get(tx).logs[0]);
    const out = await call('ranked-enter', { ...auth, tx });
    assert.equal(out.code, 503, JSON.stringify(out));
    assert.equal(out.json.retry, true);
    assert.equal(db.rows.length, 0);
  });
});

for (const amount of [250000000000000000n, 500000000000000000n]) test(`receipt proof never counts duplicate ${amount} wei Transfer logs as separate payments`, async () => {
  const w = wallet(), auth = await nonce(w), tx = payment(w, { amount }), logs = chain.get(tx).logs;
  logs.push(structuredClone(logs[0]));
  const out = await call('ranked-enter', { ...auth, tx });
  assert.equal(out.code, 503, JSON.stringify(out)); assert.equal(out.json.retry, true);
  assert.equal(db.rows.length, 0, 'duplicates cannot create an entry or an inflated refund');
});

test('receipt proof can be retried on the same saved payment after RPC consistency recovers', async () => {
  const w = wallet(), auth = await nonce(w), tx = payment(w), receipt = structuredClone(chain.get(tx));
  chain.get(tx).blockHash = '0x' + 'f'.repeat(64);
  const pending = await call('ranked-enter', { ...auth, tx });
  assert.equal(pending.code, 503); assert.equal(pending.json.retry, true); assert.equal(db.rows.length, 0);
  chain.set(tx, receipt);
  const ready = await call('ranked-enter', { ...auth, tx });
  assert.equal(ready.code, 200);
  const again = await call('ranked-enter', { ...auth, tx });
  assert.equal(again.code, 200); assert.equal(again.json.id, ready.json.id); assert.equal(db.rows.length, 1);
});

test('malformed log headers keep payment recovery retryable until the same receipt is repaired', async t => {
  for (const [label, mutate] of [
    ['missing topics', l => delete l.topics],
    ['null topics', l => l.topics = null],
    ['object topics', l => l.topics = {}],
    ['string topics', l => l.topics = TRANSFER],
    ['missing event signature', l => l.topics[0] = null],
    ['short event signature', l => l.topics[0] = '0x1234'],
    ['non-string event signature', l => l.topics[0] = 123],
    ['missing address', l => delete l.address],
    ['invalid address', l => l.address = '0x1234'],
    ['unrelated event with five topics', l => l.topics = Array(5).fill('0x' + 'a'.repeat(64))],
    ['unrelated event with invalid data', l => { l.topics = []; l.data = '0x1'; }],
    ['other token with malformed topics', l => { l.address = '0x' + '1'.repeat(40); l.topics = null; }],
  ]) await t.test(label, async () => {
    const w = wallet(), auth = await nonce(w), tx = payment(w), receipt = structuredClone(chain.get(tx));
    mutate(chain.get(tx).logs[0]);
    const out = await call('ranked-enter', { ...auth, tx });
    assert.equal(out.code, 503, JSON.stringify(out)); assert.equal(out.json.retry, true);
    assert.equal(db.rows.length, 0, 'ambiguous proof must not create an entry or refund');
    chain.set(tx, receipt);
    const ready = await call('ranked-enter', { ...auth, tx });
    assert.equal(ready.code, 200);
    const again = await call('ranked-enter', { ...auth, tx });
    assert.equal(again.json.id, ready.json.id); assert.equal(db.rows.length, 1);
  });
});

test('unrelated valid logs cannot turn a real underpayment into a retry or an entry', async t => {
  for (const [label, mutate] of [
    ['LOG0', l => { l.topics = []; l.data = '0x'; }],
    ['DMT Approval', l => l.topics[0] = '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925'],
    ['other token Transfer', l => l.address = '0x' + '1'.repeat(40)],
  ]) await t.test(label, async () => {
    const w = wallet(), auth = await nonce(w), tx = payment(w, { amount: 250000000000000000n }), receipt = chain.get(tx);
    const unrelated = structuredClone(receipt.logs[0]); unrelated.logIndex = '0x1'; mutate(unrelated); receipt.logs.push(unrelated);
    const out = await call('ranked-enter', { ...auth, tx });
    assert.equal(out.code, 400); assert.match(out.json.error, /did not send 0.5 DMT/);
    assert.equal(out.json.retry, undefined); assert.equal(db.rows.length, 0);
  });
});

test('a reverted receipt with a non-Transfer DMT event cannot discard payment recovery', async () => {
  const w = wallet(), auth = await nonce(w), tx = payment(w), receipt = structuredClone(chain.get(tx));
  chain.get(tx).status = '0x0';
  chain.get(tx).logs[0].topics[0] = '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925';
  const out = await call('ranked-enter', { ...auth, tx });
  assert.equal(out.code, 503, JSON.stringify(out)); assert.equal(out.json.retry, true);
  assert.equal(db.rows.length, 0);
  chain.set(tx, receipt);
  assert.equal((await call('ranked-enter', { ...auth, tx })).code, 200);
  assert.equal(db.rows.length, 1);
});

test('receipt proof preserves mixed-case hashes and records a closed Hard split payment as owed', async () => {
  now += weekMs;
  const w = wallet(), auth = legacyHardNonce(w);
  const tx = payment(w, { amounts: [1000000000000000000n, 1000000000000000000n] }), receipt = chain.get(tx), block = blocks.get(receipt.blockNumber);
  const upper = value => '0x' + value.slice(2).toUpperCase();
  receipt.transactionHash = upper(receipt.transactionHash); receipt.blockHash = upper(receipt.blockHash); block.hash = upper(block.hash);
  for (const l of receipt.logs) { l.transactionHash = upper(l.transactionHash); l.blockHash = upper(l.blockHash); l.data = upper(l.data); l.topics = l.topics.map(upper); }
  const out=await call('ranked-enter', { ...auth, tx });assert.equal(out.code,400);assert.equal(out.json.refund,true);
  assert.equal(db.rows.length, 1); assert.equal(db.rows[0].mode, 'hard'); assert.equal(db.rows[0].paid, '2000000000000000000');assert.equal(db.rows[0].refund_reason,'that race is not open this week');
});

test('pre-reset payments are owed; very old payments are refused without a refund', async () => {
  const w = wallet(), auth = await nonce(w);
  const old = await call('ranked-enter', { ...auth, tx: payment(w, { at: epoch - 1000 }) });
  assert.deepEqual(old, { code: 400, json: { error: 'Your payment landed just before the weekly reset, so it could not count. Your 0.5 DMT will be sent back.', refund: true } });
  assert.equal(db.rows[0].refund_reason, 'paid just before the weekly reset');
  expectError(await call('ranked-enter', { ...auth, tx: payment(w, { at: epoch - weekMs - 1000 }) }), 400, 'that payment is too old to be an entry');
  assert.equal(db.rows.length, 1);
});

test('nonce expiry, week, tampering, and personal_sign message are checked', async () => {
  const w = wallet(), tx = payment(w), auth = await nonce(w);
  for (const n of [signed({ k: 'rnonce', w: 0, s: now - 8 * 86400000 - 1 }), signed({ k: 'rnonce', w: -2, s: now }), auth.nonce + 'x']) {
    expectError(await call('ranked-enter', { nonce: n, signature: w.sign(ranked.enterMessage(n, 0)), tx }), 400, 'that sign-in expired, start again');
  }
  expectError(await call('ranked-enter', { ...auth, signature: w.sign('different message'), tx }), 400, 'that transaction did not send 0.5 DMT from your wallet to the entry address');
  // Recovering an ECDSA signature over another message generally yields another
  // valid address. Payment ownership, rather than recovery alone, rejects it.
  assert.equal(db.rows.length, 0);
  const n = signed({ k: 'rnonce', w: -1, s: now - 86400000 });
  assert.equal((await call('ranked-enter', { nonce: n, signature: w.sign(ranked.enterMessage(n, -1)), tx })).code, 200, 'last week remains valid for payment retries');
});

test('no entry cap (owner 3 Nov: play as much as you like); IP eligibility is checked before payment; paid refusals are refunds', async () => {
  const w = wallet(), auth = await nonce(w);
  for (let i = 0; i < 25; i++) assert.equal((await call('ranked-enter', { ...auth, tx: payment(w) })).code, 200);
  assert.equal((await call(nonceRoute(w))).code, 200, 'still open after 25 entries');
  const b = wallet();
  expectError(await call(nonceRoute(b)), 400, 'one wallet per player each week: this connection already entered with another wallet');
  const otherAuth = await nonce(b, { ip: '192.0.2.2' });
  assert.deepEqual(await call('ranked-enter', { ...otherAuth, tx: payment(b) }), { code: 400, json: { error: 'one wallet per player each week. Your 0.5 DMT will be sent back.', refund: true } });
  assert.deepEqual(db.rows.slice(-1).map(e => e.refund_reason), ['one wallet per player each week']);
});

test('start rejects forged, wrong-wallet, old-week, stale-version and special adventurer entries', async () => {
  const e = await enter(), tk = decode(e.entry);
  expectError(await call('ranked-start', { entry: e.entry + 'x', adv: 'adventurer', sim: cur, build:BUILD_TEST }), 400, 'no entry');
  expectError(await call('ranked-start', { entry: signed({ ...tk, a: wallet().address }), adv: 'adventurer', sim: cur, build:BUILD_TEST }), 400, 'that entry was already used');
  expectError(await call('ranked-start', { entry: signed({ ...tk, w: -1 }), adv: 'adventurer', sim: cur, build:BUILD_TEST }), 400, 'that entry was for last week');
  assert.deepEqual(await call('ranked-start', { entry: e.entry, adv: 'adventurer', sim: 'old', build:BUILD_TEST }), { code: 409, json: { error: 'Update the game before entering or starting ranked. Your saved payments and runs are kept.', update:true, build:BUILD_TEST, sim:cur } });
  for (const adv of ['constructor', 'unknown', ADVENTURERS.find(a => a.special).id]) expectError(await call('ranked-start', { entry: e.entry, adv, sim: cur, build:BUILD_TEST }), 400, 'pick an adventurer');
  assert.equal(db.rows[0].started_at, undefined);
  const first = await start(e);
  // the answer got lost: asking again returns the same run (seed, adventurer and clock), whatever adventurer is sent now
  await new Promise((r) => setTimeout(r, 20));
  const again = await call('ranked-start', { entry: e.entry, adv: 'knight', sim: cur, build:BUILD_TEST, deadline:epoch+(Math.floor((now-epoch)/weekMs)+1)*weekMs });
  assert.equal(again.code, 200); assert.equal(again.json.again, true);
  assert.equal(again.json.seed, first.seed); assert.equal(again.json.adv, first.adv);
  assert.equal(decode(again.json.run).s, decode(first.run).s, 'the clock is not restarted');
});

test('parallel submissions count and replay only once', async t => {
  // the CPU clock is the process's: the refused one is charged for the other's replay, so no budget here
  const r = await ready(); slowRefusalOk = true; let results; try { results = await Promise.all([submit(r), submit(r)]); } finally { slowRefusalOk = false; }
  assert.deepEqual(results.map(x => x.code).sort(), [200, 409]);
  assert.equal(results.find(x => x.code === 409).json.retry, true);
  assert.equal((await call('ranked-week')).json.rows.length, 1);
  t.diagnostic(`parallel submit CPU (ms): ${submits.map(n => n.toFixed(1)).join(', ')}`);
});

test('tampered movement, choices, item uses and seed cannot produce the honest score', async () => {
  const r = await ready();
  const altered = structuredClone(r.log); altered.runs[0][1] = 101;
  expectError(await submit(r, altered), 400, 'bad input');
  assert.equal(db.rows[0].claimed_at, undefined, 'malformed movement is rejected before consuming the entry');
  const pick = structuredClone(r.log); pick.picks.push({ junk: true });
  expectError(await submit(r, pick), 400, 'bad choice');
  const use = structuredClone(r.log); use.uses.push([0, 9]);
  expectError(await submit(r, use), 400, 'bad item use');
  const [body, sig] = r.run.run.split('.'), tk = decode(r.run.run);
  const forged = Buffer.from(JSON.stringify({ ...tk, seed: tk.seed + 1 })).toString('base64url') + '.' + sig;
  expectError(await call('ranked-submit', { run: forged, log: r.log }), 400, 'no run');
  assert.ok(body);
  const missing = structuredClone(r.log); missing.picks = [];
  expectError(await submit(r, missing), 400, 'this run did not check out (missing a level-up choice)');
  assert.equal(db.rows[0].verdict, 'rejected: missing a level-up choice');
});

test('real-time and late limits are enforced with the server clock', async () => {
  const e = await enter(), run = await legacyStart(e), played = play(run);
  assert.ok(played.result.t > 10);
  expectError(await submit({ run, ...played }), 400, 'this run did not check out (faster than real time)');
  const e2 = await enter(e.w), run2 = await legacyStart(e2);
  now += (runSeconds(0) + 40 * 60 + 1) * 1000; // past the longest run (2:01:00) plus 40 minutes for pauses and reloads
  expectError(await call('ranked-submit', { run: run2.run, log: played.log }), 400, 'that run was sent too late');
  assert.equal(db.rows[1].claimed_at, undefined);
});

test('missing simulation never consumes the entry', async () => {
  const e = await enter(), run = await start(e);
  expectError(await call('ranked-submit', { run: signed({ ...decode(run.run), v: '000000000000' }), log: { v: 1, runs: [[1, 0, 0]], uses: [], picks: [] } }), 500, 'server error: that game version is missing. Your run was not used up; tell the dev');
  assert.equal(db.rows[0].claimed_at, undefined);
  const { v, ...withoutVersion } = decode(run.run);
  expectError(await call('ranked-submit', { run: signed(withoutVersion), log: { v: 1, runs: [[1, 0, 0]], uses: [], picks: [] } }), 500, 'server error: that game version is missing. Your run was not used up; tell the dev');
  assert.equal(db.rows[0].claimed_at, undefined);
});

test('oversized, over-tick, null and nested junk bodies are refused cheaply', async () => {
  const e = await enter(), run = await start(e), base = { v: 1, runs: [[1, 0, 0]], uses: [], picks: [] };
  expectError(await call('ranked-submit', 'x'.repeat(4400001)), 413, 'that run log is too big');
  expectError(await call('ranked-submit', { run: run.run, log: { ...base, runs: [[runSeconds(0) * 30 + 1, 0, 0]] } }), 400, 'run too long');
  const deep = '{"run":' + JSON.stringify(run.run) + ',"log":{"v":1,"runs":[[1,0,0]],"uses":[],"picks":[' + '['.repeat(12000) + '0' + ']'.repeat(12000) + ']}}';
  expectError(await call('ranked-submit', deep), 400, 'bad choice');
  for (const [route, error] of [['ranked-enter', 'that sign-in expired, start again'], ['ranked-start', 'no entry'], ['ranked-submit', 'no run'], ['ranked-void', 'no run']]) expectError(await call(route, 'null'), 400, error);
  assert.equal(db.rows[0].claimed_at, undefined);
});

// an older copy of the same game, as if it had been live before this one
const OLD_ID = 'a1b2c3d4e5f6'; mkdirSync(path.join(simsDir, OLD_ID));
copyFileSync(path.join(simsDir, SIM_TEST_ID, 'ranked-bundle.cjs'), path.join(simsDir, OLD_ID, 'ranked-bundle.cjs'));
copyFileSync(path.join(simsDir, SIM_TEST_ID, 'ground.bin'), path.join(simsDir, OLD_ID, 'ground.bin'));
const alive = (ticks = 90) => ({ v: 1, runs: [[ticks, 0, 0]], uses: [], picks: [] }); // what the game still sends with a void
// counts every replay of the versions a void could reach (the live one and the older one)
function countReplays() {
  let n = 0; const undo = [];
  for (const id of [cur, OLD_ID]) {
    const s = ranked.load(id), game = s.game;
    s.game = { ...game, replay: (...a) => { n++; return game.replay(...a); } };
    undo.push(() => { s.game = game; });
  }
  return { count: () => n, restore: () => undo.forEach((f) => f()) };
}
test('security pass 3: a restart needs a run that could still be sent and the entry\'s current start; it never replays or refunds', async () => {
  const replays = countReplays();
  try {
    const e = await enter(), run = await start(e), r0 = decode(run.run), old = (r) => signed({ ...decode(r.run), v: OLD_ID });
    expectError(await call('ranked-void', { run: run.run, log: alive() }), 400, 'the game has not changed since this run started: resume it instead');
    // an unsent run kept back past the time it could still have been sent is not a free retry
    const t0 = now; now = r0.s + (runSeconds(r0.w) + 40 * 60 + 5) * 1000;
    expectError(await call('ranked-void', { run: old(run), log: alive() }), 400, 'that run can no longer be restarted: it started too long ago');
    assert.equal(db.rows[0].restarts, undefined, 'the entry is untouched'); assert.equal(db.rows[0].started_at, r0.s);
    now = t0 + 60000;
    const out = await call('ranked-void', { run: old(run), log: alive() });
    assert.equal(out.code, 200, JSON.stringify(out)); assert.equal(out.json.restart, true); assert.equal(out.json.refund, undefined);
    now += 60000; const run2 = await start({ entry: out.json.entry }), s2 = decode(run2.run).s;
    assert.notEqual(s2, r0.s);
    // the first run's token cannot restart the entry's newer run (it would re-roll a run going badly, up to 3 times)
    expectError(await call('ranked-void', { run: old(run), log: alive() }), 400, 'that run was already sent');
    assert.deepEqual([db.rows[0].restarts, db.rows[0].started_at], [1, s2], 'the newer run is still on');
    // the newer run's own token still restarts it
    const out2 = await call('ranked-void', { run: old(run2), log: alive() });
    assert.equal(out2.code, 200, JSON.stringify(out2)); assert.equal(db.rows[0].restarts, 2);
    assert.equal(replays.count(), 0, 'a void never replays a log');
    assert.equal((await db.rpc('sqs_ranked_settle', { p_key: 'reports-key', p_week: 0 })).refunds.length, 0, 'nothing refunded');
    // a run that was sent cannot be restarted (and the counter does see replays: the submit's)
    now += 60000; const run3 = await start({ entry: out2.json.entry });
    await call('ranked-submit', { run: run3.run, log: { v: 1, runs: [], uses: [], picks: [] } });
    const seen = replays.count(); assert.ok(seen >= 1, 'the replay counter works');
    expectError(await call('ranked-void', { run: old(run3), log: alive() }), 400, 'that run was already sent');
    assert.equal(replays.count(), seen);
  } finally { replays.restore(); }
});
test('update 7: a run cut short by a game update starts again on the same entry, with a new seed, nothing paid back', async () => {
  const e = await enter(), run = await start(e), r0 = decode(run.run);
  const oldRun = (r) => signed({ ...decode(r.run), v: OLD_ID });
  const out = await call('ranked-void', { run: oldRun(run) });
  assert.equal(out.code, 200); assert.equal(out.json.restart, true); assert.equal(out.json.id, r0.id);
  assert.equal((await db.rpc('sqs_ranked_settle', { p_key: 'reports-key', p_week: 0 })).refunds.length, 0, 'no refund');
  const again = await call('ranked-start', { entry: out.json.entry, adv: r0.adv, sim: cur, build:BUILD_TEST, deadline:epoch+(Math.floor((now-epoch)/weekMs)+1)*weekMs });
  assert.equal(again.code, 200); assert.notEqual(again.json.again, true, 'a fresh start, not the old run');
  // three restarts at most
  let r = again.json;
  for (let i = 0; i < 2; i++) { const o = await call('ranked-void', { run: oldRun(r) }); assert.equal(o.code, 200); r = (await call('ranked-start', { entry: o.json.entry, adv: r0.adv, sim: cur, build:BUILD_TEST, deadline:epoch+(Math.floor((now-epoch)/weekMs)+1)*weekMs })).json; }
  expectError(await call('ranked-void', { run: oldRun(r) }), 400, 'this entry was restarted 3 times already: tell the dev');
  // not once the week is over
  const e2 = await enter(e.w), run2 = await start(e2);
  expectError(await call('ranked-void', { run: signed({ ...decode(run2.run), v: OLD_ID, w: decode(run2.run).w + 1 }) }), 400, 'that run can no longer be restarted: its week is over');
});
test('a ranked run played in slow motion does not count (security pass)', async () => {
  const r = await ready(), d = decode(r.run.run);
  const t = r.log.runs.reduce((n, x) => n + x[0], 0) / 30;
  now = d.s + (t + 1800 + 30) * 1000; // its game time plus the pause allowance, and then some
  slowRefusalOk = true; // refused only after the full replay, so it may take the replay's time
  let out; try { out = await call('ranked-submit', { run: r.run.run, name: 'Slow', log: r.log }); } finally { slowRefusalOk = false; }
  assert.equal(out.code, 400); assert.match(out.json.error, /pause allowance exceeded/);
});

test('database finish refusal must not be reported as an accepted score', async () => {
  const r = await ready(); db.finishError = 'that run was already sent'; slowRefusalOk = true;
  try { assert.deepEqual(await submit(r), {code:503,json:{error:'that run was already sent',retry:true}}); } finally { slowRefusalOk = false; }
  assert.equal((await call('ranked-week')).json.rows.length, 0);
});

test('null bodies and nested unknown log fields never consume an entry', async () => {
  const e = await enter(), run = await start(e);
  for (const [route, error] of [['ranked-enter', 'that sign-in expired, start again'], ['ranked-start', 'no entry'], ['ranked-submit', 'no run'], ['ranked-void', 'no run']]) expectError(await call(route, 'null'), 400, error);
  const junk = '{"run":' + JSON.stringify(run.run) + ',"log":{"v":1,"runs":[],"uses":[],"picks":[],"junk":' + '['.repeat(12000) + '0' + ']'.repeat(12000) + '}}';
  expectError(await call('ranked-submit', junk), 400, 'bad log');
  assert.equal(db.rows[0].claimed_at, undefined);
});

test('reset retry cannot promise to refund a payment already used last week', async () => {
  const e = await enter();
  now += weekMs;
  const recovered=await call('ranked-enter', { ...e.auth, tx: e.tx });assert.equal(recovered.code,200);assert.equal(recovered.json.id,e.id);assert.equal(recovered.json.week,0);assert.equal(decode(recovered.json.entry).w,0);
  assert.equal(db.rows.length, 1); assert.equal(db.rows[0].refund_reason, null);
});

test('parallel eligibility races admit one wallet per IP and refund the other payment', async () => {
  const a = wallet(), b = wallet(), aAuth = await nonce(a), bAuth = await nonce(b);
  const results = await Promise.all([call('ranked-enter', { ...aAuth, tx: payment(a) }), call('ranked-enter', { ...bAuth, tx: payment(b) })]);
  assert.deepEqual(results.map(r => r.code).sort(), [200, 400]);
  assert.deepEqual(results.find(r => r.code === 400).json, { error: 'one wallet per player each week. Your 0.5 DMT will be sent back.', refund: true });
  assert.equal((await call('ranked-week')).json.entries, 1);
});

test('maximum tick count and log array limits keep submits bounded', async t => {
  const e = await enter(), run = await start(e), base = { v: 1, runs: [[28800, 0, 0]], uses: [], picks: [] };
  now += 960000;
  expectError(await call('ranked-submit', { run: run.run, log: base }), 400, 'this run did not check out (missing a level-up choice)');
  for (const log of [{ ...base, runs: Array(runSeconds(0) * 30 + 1).fill([1, 0, 0]) }, { ...base, uses: Array(20001).fill([0, 0]) }, { ...base, picks: Array(4001).fill(0) }]) {
    expectError(await call('ranked-submit', { run: run.run, log }), 400, 'log too long');
  }
  t.diagnostic(`limit submit CPU (ms): ${submits.map(n => n.toFixed(1)).join(', ')}`);
});

test('non-string signature is rejected without coercing an attacker object', async () => {
  const w = wallet(), auth = await nonce(w);
  expectError(await call('ranked-enter', { ...auth, signature: { toString: null }, tx: payment(w) }), 400, 'the signature did not check out');
});

test('non-string transaction is rejected without coercing an attacker object', async () => {
  const w = wallet(), auth = await nonce(w);
  expectError(await call('ranked-enter', { ...auth, tx: { toString: null } }), 400, 'bad transaction id');
});

test('non-string adventurer cannot crash start or consume the entry', async () => {
  const e = await enter();
  expectError(await call('ranked-start', { entry: e.entry, sim: cur, build:BUILD_TEST, adv: { toString: null } }), 400, 'pick an adventurer');
  assert.equal(db.rows[0].started_at, undefined);
});

test('non-string display name cannot crash an otherwise valid paid submit', async () => {
  const r = await ready();
  assert.equal((await call('ranked-submit', { run: r.run.run, name: { toString: null }, log: r.log })).code, 200);
  assert.equal((await call('ranked-week')).json.rows[0].name, 'Adventurer');
});

// ---- week 1: endless runs scored by kills plus survival; the Hard race with its own price, pot and board ----
const week1 = () => { now = epoch + weekMs + 12 * 3600000; };

test('week 0 offers only the Normal race; a Hard nonce is refused before any payment', async () => {
  const w = wallet();
  expectError(await call(nonceRoute(w,'hard')), 400, 'that race is not open this week');
  expectError(await call(nonceRoute(w,'constructor')), 400, 'that race is not open this week');
  const board = (await call('ranked-week')).json;
  assert.deepEqual(Object.keys(board.races), ['normal']); assert.equal(board.rules, 'time'); assert.equal(board.timeLimit, 7200); // endless, ranked by time
  // the Normal sign-in text is byte-for-byte the one signed before the Hard race (saved payments keep checking out)
  assert.equal(ranked.enterMessage('N', 0), "SankoQuest Survivors ranked\n\nSign to enter this week's ranked runs (week 0). Signing is free. Your wallet asks separately before sending the 0.5 DMT entry.\n\nNonce: N");
});

test('week 1: Standard costs 1 DMT and Hard authorization/start are refused', async () => {
 week1();const w=wallet(),n=await nonce(w);assert.equal(n.amountWei,'1000000000000000000');
 expectError(await call(nonceRoute(w,'hard')),400,'that race is not open this week');
 const token=signed({k:'rentry',id:123,a:w.address,w:1,m:'hard'});
 expectError(await call('ranked-start',{entry:token,adv:'adventurer',...CLIENT,deadline:epoch+(Math.floor((now-epoch)/weekMs)+1)*weekMs}),400,'that race is not open this week');
 const h=legacyHardNonce(w),{message,amountWei,...auth}=h;
 for(const amount of[500000000000000000n,1999999999999999999n])expectError(await call('ranked-enter',{...auth,tx:payment(w,{amount})}),400,'that transaction did not send 2 DMT from your wallet to the entry address');
 assert.equal(db.rows.length,0);
 const tx=payment(w,{amount:2000000000000000000n}),out=await call('ranked-enter',{...auth,tx});
 assert.equal(out.code,400);assert.equal(out.json.refund,true);assert.match(out.json.error,/2 DMT/);
 assert.deepEqual(await call('ranked-enter',{...auth,tx}),out);assert.equal(db.rows.length,1);assert.ok(db.rows[0].refund_reason);
 const normal=await enter(w);assert.equal(normal.mode,'normal');assert.equal(decode(normal.entry).m,undefined);
});

test('an entry costs exactly its race price: a Hard-sized payment on a Normal sign-in (or any overpayment) is owed back in full', async () => {
  for (const [week, mode, amount, dmt, name] of [[0, undefined, 1500000000000000000n, '0.5', 'Normal'], [1, undefined, 1500000000000000000n, '1', 'Normal'], [1, 'hard', 2500000000000000000n, '2', 'Hard']]) {
    db = new RankedDB({enforceClock:true}); now = epoch + week * weekMs + 12 * 3600000;
    const w = wallet(), { message, amountWei, ...auth } = mode==='hard'?legacyHardNonce(w):await nonce(w, { mode });
    const tx = payment(w, { amount }), want = { code: 400, json: { error: `That payment sent more than the ${dmt} DMT ${name} entry, so it could not count. All of it will be sent back.`, refund: true } };
    assert.deepEqual(await call('ranked-enter', { ...auth, tx }), want);
    assert.deepEqual(await call('ranked-enter', { ...auth, tx }), want, 'a retry answers the same and records nothing new');
    assert.equal(db.rows.length, 1);
    assert.deepEqual([db.rows[0].refund_reason, db.rows[0].paid, db.rows[0].mode, db.rows[0].week], [`sent more than the ${dmt} DMT entry`, amount.toString(), mode ?? 'normal', week]);
    assert.equal((await call('ranked-week')).json.entries, 0, 'never counted in a pot');
  }
});

test('security pass 3: a payment over 100 DMT is recorded (not dropped) and its refund waits for the dev to check it', async () => {
  const w = wallet(), { message, amountWei, ...auth } = await nonce(w);
  const big = payment(w, { amount: 150n * 10n ** 18n });
  const want = { code: 400, json: { error: 'That payment sent more than the 0.5 DMT Normal entry, so it could not count. It will be sent back after the dev checks it.', refund: true } };
  assert.deepEqual(await call('ranked-enter', { ...auth, tx: big }), want);
  assert.deepEqual(await call('ranked-enter', { ...auth, tx: big }), want, 'a retry answers the same');
  assert.deepEqual([db.rows.length, db.rows[0].paid, db.rows[0].refund_reason], [1, '150000000000000000000', 'sent more than the 0.5 DMT entry']);
  // 100 DMT exactly is still refunded without a review
  const hundred = payment(w, { amount: 100n * 10n ** 18n });
  assert.deepEqual(await call('ranked-enter', { ...auth, tx: hundred }), { code: 400, json: { error: 'That payment sent more than the 0.5 DMT Normal entry, so it could not count. All of it will be sent back.', refund: true } });
  assert.equal(db.rows.length, 2); assert.equal((await call('ranked-week')).json.entries, 0, 'never counted in a pot');
});

test('an already-started historical Hard run still replays while the public board offers Standard only', async () => {
 week1();const a=wallet(),b=wallet();
 // Reconstruct an entry/start acknowledged before closure; do not use the now-closed admission routes.
 const e=await db.rpc('sqs_ranked_enter',{p_server_key:'server-key',p_wallet:a.address,p_tx:payment(a,{amount:2000000000000000000n}),p_week:1,p_mode:'hard',p_ip_hash:'legacy',p_paid:'2000000000000000000',p_seed:42,p_max:1000000});
 const started=await db.rpc('sqs_ranked_start',{p_server_key:'server-key',p_id:e.id,p_wallet:a.address,p_adv:'adventurer'});
 const run={seed:started.seed,map:'apache',adv:'adventurer',week:1,mode:'hard',run:signed({k:'rrun',id:e.id,a:a.address,w:1,seed:started.seed,adv:'adventurer',v:cur,s:Number(started.started),m:'hard'})};
 const hard={run,...play(run)};now+=(hard.result.t+10)*1000;
 const res=await submit(hard);assert.equal(res.code,200,JSON.stringify(res));assert.equal(res.json.mode,'hard');assert.equal(res.json.rank,1);
 assert.deepEqual([res.json.t,res.json.kills],[hard.result.t,hard.result.kills]);
 const normal=await ready(b,{ip:'192.0.2.9'});assert.equal((await submit(normal)).code,200);
 const board=(await call('ranked-week')).json;assert.equal(board.rules,'combined');assert.equal(board.minSeconds,180);
 assert.deepEqual(Object.keys(board.races),['normal']);assert.deepEqual([board.races.normal.entries,board.races.normal.poolDmt,board.races.normal.entryDmt],[1,0.9,'1']);
 assert.deepEqual(board.races.normal.rows.map(r=>r.wallet),[b.address]);
 const asNormal=replay(hard.log,{seed:run.seed,mapId:run.map,adv:run.adv,ground:null,week:1,mode:'normal'});
 assert.ok(asNormal.error||asNormal.kills!==hard.result.kills||asNormal.t!==hard.result.t);assert.equal(db.rows.find(r=>r.mode==='hard').kills,hard.result.kills);
});

test('week 1: Standard keeps unlimited entries and one wallet per connection', async () => {
 week1();const w=wallet(),{message,amountWei,...auth}=await nonce(w);
 for(let i=0;i<25;i++)assert.equal((await call('ranked-enter',{...auth,tx:payment(w)})).code,200);
 assert.equal((await call(nonceRoute(w))).code,200);const other=wallet();
 expectError(await call(nonceRoute(other)),400,'one wallet per player each week: this connection already entered with another wallet');
 expectError(await call(nonceRoute(other,'hard')),400,'that race is not open this week');
});

test('week 1: a Hard payment that lands before the reset is owed back at 2 DMT', async () => {
  week1();
  const w = wallet(), { message, amountWei, ...auth } = legacyHardNonce(w);
  const late = await call('ranked-enter', { ...auth, tx: payment(w, { amount: 2000000000000000000n, at: epoch + weekMs - 1000 }) });
  assert.deepEqual(late, { code: 400, json: { error: 'Your payment landed just before the weekly reset, so it could not count. Your 2 DMT will be sent back.', refund: true } });
  assert.equal(db.rows[0].mode, 'hard'); assert.equal(db.rows[0].week, 0);
});

test('week 1: the late limit follows the longer endless runs', async () => {
  week1();
  const e = await enter(), run = await legacyStart(e), log = { v: 1, runs: [[1, 0, 0]], uses: [], picks: [] };
  now += (runSeconds(1) + 40 * 60 + 1) * 1000;
  expectError(await call('ranked-submit', { run: run.run, log }), 400, 'that run was sent too late');
  assert.equal(db.rows[0].claimed_at, undefined);
  const e2 = await enter(e.w), run2 = await legacyStart(e2);
  now += (runSeconds(1) + 40 * 60 - 60) * 1000; // still in time: replayed (and refused for being unfinished, not late)
  expectError(await call('ranked-submit', { run: run2.run, log }), 400, 'this run did not check out (the run had not ended)');
});

test('week-one confirmed prices and Apache map agree in board, nonce and receipt admission', async()=>{
 week1();const w=wallet();const board=(await call('ranked-week')).json;assert.equal(board.map,'apache');
 for(const[mode,dmt,amount]of[['normal','1','1000000000000000000']]){
  assert.equal(board.races[mode].entryDmt,dmt);const n=await nonce(w,{mode});assert.equal(n.amountWei,amount);assert.ok(n.message.includes('the '+dmt+' DMT entry'));
  const tx=payment(w,{amount:BigInt(amount)});assert.equal((await call('ranked-enter',{nonce:n.nonce,signature:n.signature,tx})).code,200);
 }
 assert.deepEqual(db.rows.map(r=>r.paid),['1000000000000000000']);
 const after=(await call('ranked-week')).json;assert.deepEqual([after.races.normal.paidWei,after.races.normal.houseWei,after.races.normal.entryPoolWei],['1000000000000000000','100000000000000000','900000000000000000']);assert.equal(after.races.hard,undefined);
});
test('week-one reset records an unentered old-price payment as owed, preserving its actual receipt week',async()=>{
 const w=wallet(),n=await nonce(w);week1();const tx=payment(w,{amount:500000000000000000n});const out=await call('ranked-enter',{nonce:n.nonce,signature:n.signature,tx});
 assert.equal(out.code,400);assert.equal(out.json.refund,true);assert.match(out.json.error,/0\.5 DMT/);assert.equal(db.rows.length,1);assert.equal(db.rows[0].paid,'500000000000000000');assert.equal(db.rows[0].week,1);assert.ok(db.rows[0].refund_reason);
 assert.deepEqual(await call('ranked-enter',{nonce:n.nonce,signature:n.signature,tx}),out);assert.equal(db.rows.length,1);
});

test('legacy SQL refund wording still shows the actual new Standard payment amount',async()=>{
 week1();const a=wallet(),b=wallet(),n=await nonce(b);await enter(a);
 const original=db.rpc.bind(db);db.rpc=async(fn,p)=>{const out=await original(fn,p);if(fn==='sqs_ranked_enter'&&out.refund)out.error=out.error.replace(/Your [0-9.]+ DMT/,'Your 1.5 DMT');return out;};
 const tx=payment(b,{amount:1000000000000000000n}),out=await call('ranked-enter',{nonce:n.nonce,signature:n.signature,tx});
 assert.equal(out.code,400);assert.equal(out.json.refund,true);assert.match(out.json.error,/Your 1 DMT will be sent back/);assert.equal(db.rows.find(r=>r.tx===tx).paid,'1000000000000000000');
});

// New admission never gates an already-paid registration or archived submission.
test('current-build admission is uncached and rejects old UI before eligibility or start RPC', async t => {
  const w=wallet(), token=signed({k:'rentry',id:1,a:w.address,w:0});
  const calls=[]; t.mock.method(db,'rpc',async(fn)=>{calls.push(fn);return {ok:true,reward_version:2,left:100,seed:1,adv:'adventurer',started:now,clockVersion:0,deadline:null,clock:null};});
  const responseHeaders={};const version=await call('ranked-version',undefined,{responseHeaders}); assert.equal(version.code,200);assert.equal(responseHeaders['cache-control'],'no-store'); assert.deepEqual(version.json,CLIENT);
  for(const claim of [{},{build:'old',sim:cur},{build:BUILD_TEST,sim:'123456123456'},{build:{},sim:cur},{build:'dev',sim:cur},{build:'x'.repeat(81),sim:cur}]) {
    const q=new URLSearchParams({wallet:w.address,...claim});
    assert.equal((await call('ranked-nonce?'+q)).code,409);
    assert.equal((await call('ranked-start',{entry:token,adv:'adventurer',...claim})).code,409);
  }
  assert.deepEqual(calls,[]);
  assert.equal((await call('ranked-nonce?'+new URLSearchParams({wallet:w.address,...CLIENT,deadline:epoch+(Math.floor((now-epoch)/weekMs)+1)*weekMs}))).code,200);
  assert.equal((await call('ranked-start',{entry:token,adv:'adventurer',...CLIENT,deadline:epoch+(Math.floor((now-epoch)/weekMs)+1)*weekMs})).code,200);
  assert.deepEqual(calls,['sqs_ranked_can_enter_v2','sqs_ranked_clock_start']);
});
test('missing or inconsistent admission metadata fails closed before RPC, without changing paid recovery',async t=>{
  const w=wallet(),e=await enter(w),{auth,tx}=e;
  const calls=[],original=db.rpc.bind(db);t.mock.method(db,'rpc',async(fn,p)=>{calls.push(fn);return original(fn,p);});
  for(const value of [null,'{',JSON.stringify({build:BUILD_TEST,sim:'123456123456'}),JSON.stringify({build:'dev',sim:cur})]) {
    if(value===null)rmSync(path.join(simsDir,'client.json'));else writeFileSync(path.join(simsDir,'client.json'),value);
    assert.equal((await call('ranked-version')).code,503);
    assert.equal((await call('ranked-nonce?'+new URLSearchParams({wallet:w.address,...CLIENT,deadline:epoch+(Math.floor((now-epoch)/weekMs)+1)*weekMs}))).code,503);
    assert.equal((await call('ranked-start',{entry:e.entry,adv:'adventurer',...CLIENT})).code,503);
  }
  assert.deepEqual(calls,[]);
  const recovered=await call('ranked-enter',{tx,nonce:auth.nonce,signature:auth.signature});
  assert.equal(recovered.code,200);assert.equal(recovered.json.id,e.id);
});

for(const extra of [1201,1799,30*60,30*60+.001])test(`ranked total pause boundary ${extra}s is enforced after replay`,async()=>{
 const r=await ready(),d=decode(r.run.run);now=d.s+(r.result.t+extra)*1000;slowRefusalOk=true;
 let out;try{out=await submit(r);}finally{slowRefusalOk=false;}
 assert.equal(out.code,extra<=1800?200:400,JSON.stringify(out));
 if(extra>1800)assert.match(out.json.error,/pause allowance exceeded/);
});


test('deadline consent is required and admission closes at exact boundary',async()=>{
 const w=wallet(),deadline=epoch+weekMs;
 const route=nonceRoute(w).replace(/&deadline=\d+/,'');
 assert.match((await call(route)).json.error,/acknowledge/);
 now=deadline-1800001; const e=await enter(w);const run=await start(e);
 assert.equal(run.deadline,deadline);assert.equal(decode(run.run).c,1);
 assert.match((await nonce(w)).message,/2026-11-09T00:00:00.000Z/);
 now=deadline-1800000; assert.equal((await call(nonceRoute(w))).json.closed,true);
 assert.equal((await start(e)).started,run.started);
});
test('new starts fail closed without SQL and legacy started retries stay legacy',async()=>{
 const e=await enter();const row=db.rows[0];row.started_at=now;row.adv='adventurer';
 const old=await start(e,{deadline:undefined});assert.equal(old.clockVersion,0);assert.equal(decode(old.run).c,undefined);
 const original=db.rpc.bind(db);db.rpc=(fn,p)=>fn==='sqs_ranked_clock_start'?null:original(fn,p);
 const r=await call('ranked-start',{entry:e.entry,adv:'adventurer',...CLIENT,deadline:epoch+weekMs});assert.notEqual(r.code,200);
});
test('clock pause credit is bounded, idempotent and frozen at the first claim',async()=>{
 const e=await enter(),run=await start(e),send=p=>call('ranked-clock',{run:run.run,action:'state',seq:0,frame:0,...p});
 assert.equal((await send({action:'pause',seq:1})).json.seq,1);now+=3000;
 assert.equal((await send({action:'resume',seq:2})).json.creditMs,3000);
 assert.equal((await send({action:'resume',seq:2})).json.creditMs,3000);
 assert.equal((await send({action:'pause',seq:3})).code,400);
 assert.equal((await send({action:'pause',seq:3,frame:1})).code,200);now+=90000;
 assert.equal((await send({action:'resume',seq:4,frame:2})).code,400);
 assert.equal((await send({action:'resume',seq:4,frame:1})).json.creditMs,33000);
 for(const bad of [{action:'credit'},{seq:-1},{frame:219601},{frame:1.5}])assert.equal((await send(bad)).code,400);
 const state=(await send({})).json;assert.equal(state.seq,4);assert.equal(state.frame,1);
});
test('server deadline alone allows partial replay, bounds wall ticks and accepts five minute transport retry',async()=>{
 now=epoch+weekMs-1800001;const e=await enter(),run=await start(e);
 const log={v:1,runs:[[60,0,0]],uses:[],picks:[]};
 // Fresh separate fixture for the early rejection because its claim consumes the log.
 const early=await call('ranked-submit',{run:run.run,name:'cutoff',log});assert.match(early.json.error,/not ended|faster/);
 now=epoch+weekMs-1800001;const e2=await enter(e.w),r2=await start(e2);
 now=epoch+weekMs+1000;
 const huge={...log,runs:[[54001,0,0]]};assert.match((await call('ranked-submit',{run:r2.run,log:huge})).json.error,/too long/);
 assert.equal((await call('ranked-submit',{run:r2.run,log})).code,200);
 now+=600000;assert.equal((await call('ranked-submit',{run:r2.run,log})).code,200);
});

test('held signing and late payments are owed while already registered payments recover',async()=>{
 now=epoch+weekMs-1800001;const e=await enter(),w=e.w,auth=await nonce(w);
 now+=1;const tx=payment(w);
 const late=await call('ranked-enter',{...auth,tx});assert.equal(late.json.refund,true);assert.equal(db.rows[1].refund_reason,'ranked admission is closed');
 assert.equal((await call('ranked-enter',{...e.auth,tx:e.tx})).json.id,e.id);
 const start=await call('ranked-start',{entry:e.entry,adv:'adventurer',...CLIENT,deadline:epoch+weekMs});assert.match(start.json.error,/closed/);assert.equal(start.json.refund,true);assert.equal(db.rows[0].refund_reason,'ranked admission closed before this entry started');assert.equal(db.rows[0].started_at,undefined);
});

test('new first submissions close after five minutes but cached claims survive',async()=>{
 now=epoch+weekMs-1800001;const e=await enter(),run=await start(e);
 now=epoch+weekMs+300001;
 const out=await call('ranked-submit',{run:run.run,log:{v:1,runs:[[1,0,0]],uses:[],picks:[]}});
 assert.equal(out.json.error,'that run was sent too late');assert.equal(db.rows[0].claimed_at,undefined);
});
test('public clock metadata is uncached and signed consent uses the exact deadline',async()=>{
 const headers={},w=wallet(),r=await call('ranked-week',undefined,{responseHeaders:headers});
 assert.equal(headers['cache-control'],'no-store');assert.equal(r.json.serverNow,now);assert.equal(r.json.closesAt,epoch+weekMs-1800000);
 const n=(await call(nonceRoute(w))).json;assert.equal(n.clockVersion,1);assert.equal(n.serverNow,now);assert.equal(n.deadline,epoch+weekMs);assert.equal(n.closesAt,r.json.closesAt);
 const parsed=decode(n.nonce);assert.equal(parsed.d,n.deadline);assert.equal(parsed.c,1);
});

test('registered historical Hard payments recover even after Hard admission closed',async()=>{
 week1();const w=wallet(),auth=legacyHardNonce(w),tx=payment(w,{amount:2000000000000000000n});
 const entry=await db.rpc('sqs_ranked_enter',{p_server_key:'server-key',p_tx:tx,p_wallet:w.address,p_week:1,p_ip_hash:'fixture',p_paid:'2000000000000000000',p_seed:1,p_max:100,p_mode:'hard'});
 const recovered=await call('ranked-enter',{...auth,tx});assert.equal(recovered.code,200);assert.equal(recovered.json.id,entry.id);assert.equal(recovered.json.mode,'hard');assert.equal(db.rows[0].refund_reason,null);
});

test('new signed clock run fits the verifier cap with the largest safe entry id',async()=>{
 const e=await enter(),row=db.rows[0];row.id=Number.MAX_SAFE_INTEGER;row.seed=2147483646;
 e.entry=signed({...decode(e.entry),id:row.id});
 const adv=[...sim.game.RANKED.advs].sort((a,b)=>b.length-a.length)[0];
 const run=await start(e,{adv});assert.ok(run.run.length<=400,run.run.length);
 const withHistoricalMode=signed({...decode(run.run),m:'hard'});assert.ok(withHistoricalMode.length<=400,withHistoricalMode.length);
 assert.equal((await call('ranked-clock',{run:withHistoricalMode,action:'state',seq:0,frame:0})).code,200);
});

test('a prepaid entry blocked at cutoff and retried next week returns its owed refund',async()=>{
 now=epoch+weekMs-1800001;const e=await enter();now++;
 const body={entry:e.entry,adv:'adventurer',...CLIENT,deadline:epoch+weekMs};
 const out=await call('ranked-start',body);assert.equal(out.json.refund,true);
 now=epoch+weekMs+1;assert.equal((await call('ranked-start',body)).json.refund,true);
 assert.equal((await call('ranked-enter',{...e.auth,tx:e.tx})).json.refund,true);
 assert.equal(db.rows[0].started_at,undefined);
});
test('credited new-policy interruption older than9660seconds reaches guarded restart',async()=>{
 const e=await enter(),run=await start(e);now+=9900000;db.rows[0].clock_credit_ms=1800000;
 const old=signed({...decode(run.run),v:OLD_ID});
 const out=await call('ranked-void',{run:old});assert.equal(out.code,200,JSON.stringify(out));
 const fresh=await start({...e,entry:out.json.entry});assert.notEqual(fresh.started,run.started);assert.equal(fresh.clock.creditMs,0);
});


test('high wager binds10DMT in the signed nonce and shares the normal race without duplicate payments',async()=>{
 now=epoch+weekMs+12*3600000;const w=wallet();
 const high=await call(nonceRoute(w)+'&tier=high');assert.equal(high.code,200);
 assert.equal(high.json.amountWei,'10000000000000000000');assert.equal(high.json.tier,'high');assert.equal(decode(high.json.nonce).h,1);assert.match(high.json.message,/sending the 10 DMT entry/);
 const auth={nonce:high.json.nonce,signature:w.sign(high.json.message)},tx=payment(w,{amount:10000000000000000000n});
 const entered=await call('ranked-enter',{...auth,tx});assert.equal(entered.code,200,JSON.stringify(entered));assert.equal(entered.json.mode,'normal');
 const begun=await start(entered.json);assert.equal(begun.mode,'normal');const highSim=rankedSim({seed:begun.seed,mapId:begun.map,adv:begun.adv,ground:null,week:begun.week,mode:begun.mode});assert.equal(highSim.hard,false);assert.deepEqual(highSim.players[0].gear,{});
 const again=await call('ranked-enter',{...auth,tx});assert.equal(again.code,200);assert.equal(again.json.id,entered.json.id);assert.equal(db.rows.filter(r=>r.refund_reason==null).length,1);
 const low=await enter(w);assert.notEqual(low.id,entered.json.id);assert(db.rows.every(r=>r.mode==='normal'));
 const under=await call('ranked-enter',{...auth,tx:payment(w,{amount:1000000000000000000n})});assert.equal(under.code,400);assert.match(under.json.error,/did not send 10 DMT/);
 const standard=await nonce(w),over=await call('ranked-enter',{nonce:standard.nonce,signature:standard.signature,tx:payment(w,{amount:10000000000000000000n})});assert.equal(over.code,400);assert.equal(over.json.refund,true,'a standard authorization never silently becomes a high wager');
 const decoded=decode(auth.nonce);delete decoded.h;const tampered=Buffer.from(JSON.stringify(decoded)).toString('base64url')+'.'+auth.nonce.split('.')[1];assert.equal((await call('ranked-enter',{...auth,nonce:tampered,tx})).code,400);
 for(const tier of ['10','HIGH','constructor'])assert.equal((await call(nonceRoute(w)+'&tier='+tier)).code,400);
});


test('eligibility readiness must include an affirmative admission and positive integral entries left',async t=>{
 const w=wallet();let result;
 t.mock.method(db,'rpc',async()=>result);
 for(const value of [null,{ok:true,left:1},{reward_version:2,left:1},{ok:false,reward_version:2,left:1},{ok:true,reward_version:2,left:0},{ok:true,reward_version:2,left:'1'},{ok:true,reward_version:2,left:1.2}]){
  result=value;const response=await call(nonceRoute(w));assert.equal(response.code,400);assert.match(response.json.error,/reward policy/);assert.equal(response.json.nonce,undefined);
 }
});
