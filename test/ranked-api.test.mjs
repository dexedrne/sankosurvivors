import test, { beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { Readable } from 'node:stream';
import { createHmac, randomBytes } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { rankedSim, RunRecorder } from '../src/ranked.js';
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
    const sig = secp256k1.sign(hash, key);
    return '0x' + Buffer.concat([sig.toCompactRawBytes(), Buffer.from([sig.recovery + 27])]).toString('hex');
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
beforeEach(() => { now = epoch + 12 * 3600000; db = new RankedDB(); chain = new Map(); blocks = new Map(); serial = 0; submits = []; });
after(() => { Date.now = originalNow; globalThis.fetch = originalFetch; sim.ground = originalGround; });
async function call(route, body, { ip = '192.0.2.1', method = body === undefined ? 'GET' : 'POST', headers = {} } = {}) {
  const req = Readable.from(body === undefined ? [] : [Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))]);
  Object.assign(req, { method, url: '/api/' + route, headers: { 'content-type': 'application/json', 'x-forwarded-for': ip, ...headers } });
  const cpu = process.cpuUsage();
  const out = await new Promise((resolve, reject) => {
    const res = { statusCode: 200, setHeader() {}, end(s) { resolve({ code: this.statusCode, json: JSON.parse(s) }); } };
    handler(req, res).catch(reject);
  });
  if (route === 'ranked-submit') { const used = process.cpuUsage(cpu); submits.push((used.user + used.system) / 1000); assert.ok(submits.at(-1) < 2000, `submit CPU ${submits.at(-1)}ms exceeds 2s`); }
  return out;
}
const expectError = (r, code, error) => assert.deepEqual(r, { code, json: { error } });
async function nonce(w, opts) { const r = await call('ranked-nonce?wallet=' + w.address, undefined, opts); assert.equal(r.code, 200); return { nonce: r.json.nonce, signature: w.sign(r.json.message) }; }
function payment(w, { amount = 500000000000000000n, token = DMT, recipient = ranked.COLLECT, status = '0x1', at = now, amounts } = {}) {
  const tx = '0x' + (++serial).toString(16).padStart(64, '0'), blockNumber = '0x' + serial.toString(16);
  chain.set(tx, { status, blockNumber, logs: (amounts ?? [amount]).map(n => ({ address: token, topics: [TRANSFER, pad(w.address), pad(recipient)], data: '0x' + n.toString(16) })) });
  blocks.set(blockNumber, { timestamp: '0x' + Math.floor(at / 1000).toString(16) });
  return tx;
}
async function enter(w = wallet(), opts = {}) {
  const auth = await nonce(w, opts), tx = payment(w, opts), r = await call('ranked-enter', { ...auth, tx }, opts);
  assert.equal(r.code, 200, JSON.stringify(r)); return { ...r.json, auth, tx, w };
}
async function start(e, extra = {}) {
  const r = await call('ranked-start', { entry: e.entry, adv: 'adventurer', sim: cur, ...extra }); assert.equal(r.code, 200, JSON.stringify(r)); return r.json;
}
function play(run) {
  const s = rankedSim({ seed: run.seed, mapId: run.map, adv: run.adv, ground: null }), rec = new RunRecorder(), p = s.players[0];
  while (!s.over) {
    if (s.pending.p1) { rec.pick(0); choose(s, 'p1', 0); continue; }
    // Honest, modest movement; no forced death or edited simulation state.
    const before = s.tick;
    step(s, { p1: rec.input(Math.cos(s.t * .4) * .3, Math.sin(s.t * .4) * .3, s.tick % 900 === 450 ? 0 : null) }, TICK);
    rec.after(s.tick !== before); s.fx.length = 0;
    assert.ok(s.tick <= 28800);
  }
  return { log: rec.log(), result: { t: Math.floor(s.t), kills: s.kills, level: s.level, won: s.over === 'win' } };
}
async function ready() { const e = await enter(), run = await start(e), played = play(run); now += (played.result.t + 10) * 1000; return { e, run, ...played }; }
const submit = (r, log = r.log) => call('ranked-submit', { run: r.run.run, name: 'Tester', log });

test('honest signed paid run is replayed, retained and listed once', async t => {
  const r = await ready();
  assert.deepEqual(await submit(r), { code: 200, json: { ok: true, ...r.result, rank: 1 } });
  const board = await call('ranked-week');
  assert.equal(board.json.entries, 1); assert.equal(board.json.poolDmt, .45);
  assert.equal(board.json.rows.length, 1); assert.equal(board.json.rows[0].wallet, r.e.w.address);
  assert.equal(board.json.rows[0].t, r.result.t);
  assert.deepEqual(JSON.parse(gunzipSync(Buffer.from(db.rows[0].log, 'base64'))), JSON.parse(JSON.stringify(r.log)));
  expectError(await submit(r), 400, 'that run was already sent');
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

test('entry cap and IP eligibility are checked before payment; paid refusals are refunds', async () => {
  const w = wallet(), auth = await nonce(w);
  for (let i = 0; i < 20; i++) assert.equal((await call('ranked-enter', { ...auth, tx: payment(w) })).code, 200);
  expectError(await call('ranked-nonce?wallet=' + w.address), 400, 'you have used all 20 ranked entries this week');
  assert.deepEqual(await call('ranked-enter', { ...auth, tx: payment(w) }), { code: 400, json: { error: 'all 20 entries used this week. Your 0.5 DMT will be sent back.', refund: true } });
  const b = wallet();
  expectError(await call('ranked-nonce?wallet=' + b.address), 400, 'one wallet per player each week: this connection already entered with another wallet');
  const otherAuth = await nonce(b, { ip: '192.0.2.2' });
  assert.deepEqual(await call('ranked-enter', { ...otherAuth, tx: payment(b) }), { code: 400, json: { error: 'one wallet per player each week. Your 0.5 DMT will be sent back.', refund: true } });
  assert.deepEqual(db.rows.slice(-2).map(e => e.refund_reason), ['all 20 entries used this week', 'one wallet per player each week']);
});

test('start rejects forged, wrong-wallet, old-week, stale-version and special adventurer entries', async () => {
  const e = await enter(), tk = decode(e.entry);
  expectError(await call('ranked-start', { entry: e.entry + 'x', adv: 'adventurer', sim: cur }), 400, 'no entry');
  expectError(await call('ranked-start', { entry: signed({ ...tk, a: wallet().address }), adv: 'adventurer', sim: cur }), 400, 'that entry was already used');
  expectError(await call('ranked-start', { entry: signed({ ...tk, w: -1 }), adv: 'adventurer', sim: cur }), 400, 'that entry was for last week');
  assert.deepEqual(await call('ranked-start', { entry: e.entry, adv: 'adventurer', sim: 'old' }), { code: 409, json: { error: 'a new version of the game is out: tap Update, then start your run', sim: cur } });
  for (const adv of ['constructor', 'unknown', ADVENTURERS.find(a => a.special).id]) expectError(await call('ranked-start', { entry: e.entry, adv, sim: cur }), 400, 'pick an adventurer');
  assert.equal(db.rows[0].started_at, undefined);
  const first = await start(e);
  // the answer got lost: asking again returns the same run (seed, adventurer and clock), whatever adventurer is sent now
  await new Promise((r) => setTimeout(r, 20));
  const again = await call('ranked-start', { entry: e.entry, adv: 'knight', sim: cur });
  assert.equal(again.code, 200); assert.equal(again.json.again, true);
  assert.equal(again.json.seed, first.seed); assert.equal(again.json.adv, first.adv);
  assert.equal(decode(again.json.run).s, decode(first.run).s, 'the clock is not restarted');
});

test('parallel submissions count and replay only once', async t => {
  const r = await ready(), results = await Promise.all([submit(r), submit(r)]);
  assert.deepEqual(results.map(x => x.code).sort(), [200, 400]);
  expectError(results.find(x => x.code === 400), 400, 'that run was already sent');
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
  const e = await enter(), run = await start(e), played = play(run);
  assert.ok(played.result.t > 10);
  expectError(await submit({ run, ...played }), 400, 'this run did not check out (faster than real time)');
  const e2 = await enter(e.w), run2 = await start(e2);
  now += (960 + 40 * 60 + 1) * 1000; // past the 16-minute run plus 40 minutes for pauses and reloads
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
  expectError(await call('ranked-submit', 'x'.repeat(1500001)), 413, 'that run log is too big');
  expectError(await call('ranked-submit', { run: run.run, log: { ...base, runs: [[28801, 0, 0]] } }), 400, 'run too long');
  const deep = '{"run":' + JSON.stringify(run.run) + ',"log":{"v":1,"runs":[[1,0,0]],"uses":[],"picks":[' + '['.repeat(12000) + '0' + ']'.repeat(12000) + ']}}';
  expectError(await call('ranked-submit', deep), 400, 'bad choice');
  for (const [route, error] of [['ranked-enter', 'that sign-in expired, start again'], ['ranked-start', 'no entry'], ['ranked-submit', 'no run'], ['ranked-void', 'no run']]) expectError(await call(route, 'null'), 400, error);
  assert.equal(db.rows[0].claimed_at, undefined);
});

test('void requires a different version, excludes submitted and voided runs, and lists refunds', async () => {
  const e = await enter(), run = await start(e);
  expectError(await call('ranked-void', { run: run.run }), 400, 'the game has not changed since this run started: resume it instead');
  const oldRun = signed({ ...decode(run.run), v: 'c7ce54471d48' });
  assert.deepEqual(await call('ranked-void', { run: oldRun }), { code: 200, json: { ok: true, refund: true } });
  expectError(await call('ranked-void', { run: oldRun }), 400, 'that run was already sent');
  expectError(await call('ranked-submit', { run: run.run, log: { v: 1, runs: [[1, 0, 0]], uses: [], picks: [] } }), 400, 'that run was already sent');
  const refunds = (await db.rpc('sqs_ranked_settle', { p_key: 'reports-key', p_week: 0 })).refunds;
  assert.deepEqual(refunds, [{ wallet: e.w.address, tx: e.tx, paid: '500000000000000000', why: `game updated during the run (c7ce54471d48 -> ${cur})` }]);
  assert.equal((await call('ranked-week')).json.entries, 0);
  const e2 = await enter(e.w), run2 = await start(e2);
  await call('ranked-submit', { run: run2.run, log: { v: 1, runs: [], uses: [], picks: [] } });
  expectError(await call('ranked-void', { run: signed({ ...decode(run2.run), v: 'c7ce54471d48' }) }), 400, 'that run was already sent');
});

test('database finish refusal must not be reported as an accepted score', async () => {
  const r = await ready(); db.finishError = 'that run was already sent';
  expectError(await submit(r), 400, 'that run was already sent');
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
  expectError(await call('ranked-enter', { ...e.auth, tx: e.tx }), 400, 'that payment was already used for an entry');
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
  for (const log of [{ ...base, runs: Array(28801).fill([1, 0, 0]) }, { ...base, uses: Array(5001).fill([0, 0]) }, { ...base, picks: Array(601).fill(0) }]) {
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
  expectError(await call('ranked-start', { entry: e.entry, sim: cur, adv: { toString: null } }), 400, 'pick an adventurer');
  assert.equal(db.rows[0].started_at, undefined);
});

test('non-string display name cannot crash an otherwise valid paid submit', async () => {
  const r = await ready();
  assert.equal((await call('ranked-submit', { run: r.run.run, name: { toString: null }, log: r.log })).code, 200);
  assert.equal((await call('ranked-week')).json.rows[0].name, 'Adventurer');
});
