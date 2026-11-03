import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { Readable } from 'node:stream';
import { randomBytes, createHmac } from 'node:crypto';
import { mergeSaves, summary, isFresh, createCloud, SAVE_KEYS } from '../src/cloud.js';

// the API against a fake Supabase that keeps saves like tools/supabase/update4.sql does
Object.assign(process.env, { SUPABASE_URL: 'https://db.test', SUPABASE_KEY: 'k', SQS_TICKET_SECRET: 'ticket-secret', SQS_SERVER_KEY: 'server-key' });
const require = createRequire(import.meta.url);
const handler = require('../tools/vercel-api/index.js');
const cloudApi = require('../tools/vercel-api/cloud.js');
const { secp256k1, keccak_256 } = require('../tools/vercel-api/noble-crypto.cjs');

const saves = new Map(); let dbCalls = 0;
function db(fn, a) {
  dbCalls++;
  if (a.p_server_key !== 'server-key') return { error: 'forbidden' };
  const w = String(a.p_wallet).toLowerCase(), s = saves.get(w);
  if (fn === 'sqs_save_get') return s ? { rev: s.rev, data: s.data, at: s.at } : { rev: 0 };
  if (fn === 'sqs_save_put') {
    if (!s) { if (a.p_rev !== 0) return { conflict: true, rev: 0 }; saves.set(w, { rev: 1, data: a.p_data, at: Date.now() }); return { ok: true, rev: 1 }; }
    if (s.rev !== a.p_rev) return { conflict: true, rev: s.rev, data: s.data, at: s.at };
    saves.set(w, { rev: s.rev + 1, data: a.p_data, at: Date.now() }); return { ok: true, rev: s.rev + 1 };
  }
  throw new Error('unexpected ' + fn);
}
function call(method, route, body) {
  const req = Readable.from(body === undefined ? [] : [typeof body === 'string' ? body : JSON.stringify(body)]);
  Object.assign(req, { method, url: `/api?route=${route}`, headers: { 'x-forwarded-for': '1.2.3.4', 'content-type': 'application/json' } });
  return new Promise((done) => {
    const res = { statusCode: 200, setHeader() {}, end(s) { done({ code: this.statusCode, json: JSON.parse(s) }); } };
    handler(req, res);
  });
}
globalThis.fetch = async (url, opts = {}) => {
  url = String(url);
  if (url.startsWith('https://db.test/rest/v1/rpc/')) return new Response(JSON.stringify(db(url.split('/').pop(), JSON.parse(opts.body))), { status: 200 });
  const route = url.replace(/^.*api\//, ''), r = await call(opts.method || 'GET', route, opts.body === undefined ? undefined : JSON.parse(opts.body));
  return new Response(JSON.stringify(r.json), { status: r.code });
};
function wallet() {
  const key = randomBytes(32), pub = secp256k1.getPublicKey(key, false);
  const address = '0x' + Buffer.from(keccak_256(pub.subarray(1))).subarray(-20).toString('hex');
  const sign = (message) => {
    const msg = Buffer.from(message), hash = keccak_256(Buffer.concat([Buffer.from(`\x19Ethereum Signed Message:\n${msg.length}`), msg]));
    const sig = secp256k1.sign(hash, key);
    return '0x' + Buffer.concat([sig.toCompactRawBytes(), Buffer.from([sig.recovery + 27])]).toString('hex');
  };
  // an EIP-1193 wallet that signs personal_sign messages (sent as hex)
  const p = { request: async ({ method, params }) => { assert.equal(method, 'personal_sign'); return sign(Buffer.from(params[0].slice(2), 'hex').toString()); } };
  return { address, sign, conn: { w: { p }, address } };
}
async function login(w) {
  const n = (await call('GET', 'save-nonce')).json;
  const r = await call('POST', 'save-login', { nonce: n.nonce, signature: w.sign(n.message), address: w.address });
  assert.equal(r.code, 200, JSON.stringify(r.json)); return r.json;
}
const J = JSON.stringify;

test('the server: sign in once, save on top of the last revision, a stale save gets the newer one back', async () => {
  const w = wallet(), a = await login(w);
  assert.equal(a.address, w.address); assert.equal(a.rev, 0); assert.ok(a.key);
  const data = { 'sq-coins': '500', 'sq-skills': J({ might: 2 }), 'sq-settings': J({ ao: true }), 'sq-name': 'not json' };
  const p1 = await call('POST', 'save-put', { key: a.key, rev: 0, data });
  assert.deepEqual(p1, { code: 200, json: { ok: true, rev: 1 } });
  assert.deepEqual(Object.keys(saves.get(w.address).data), ['sq-coins', 'sq-skills'], 'only progress keys that the game saves (JSON); device settings stay on the device');
  const stale = await call('POST', 'save-put', { key: a.key, rev: 0, data: { 'sq-coins': '9' } });
  assert.equal(stale.code, 409); assert.deepEqual([stale.json.conflict, stale.json.rev, stale.json.data['sq-coins']], [true, 1, '500']);
  assert.deepEqual((await call('POST', 'save-put', { key: a.key, rev: 1, data: { 'sq-coins': '650' } })).json, { ok: true, rev: 2 });
  const got = await call('POST', 'save-get', { key: a.key });
  assert.deepEqual([got.code, got.json.rev, got.json.data['sq-coins']], [200, 2, '650']);
  const again = await login(w); assert.deepEqual([again.rev, again.data['sq-coins']], [2, '650'], 'signing in on another device shows the save');
});

test('the server refuses forged keys, other wallets, wrong signatures, junk and oversized saves', async () => {
  const w = wallet(), other = wallet(), a = await login(w);
  const forged = Buffer.from(J({ k: 'save', a: other.address, exp: Date.now() + 1e9 })).toString('base64url') + '.nope';
  assert.equal((await call('POST', 'save-get', { key: forged })).code, 401);
  const nonceKey = (await call('GET', 'save-nonce')).json.nonce;
  assert.equal((await call('POST', 'save-get', { key: nonceKey })).code, 401, 'a sign-in nonce is not a save key');
  const expired = (() => { const body = Buffer.from(J({ k: 'save', a: w.address, exp: Date.now() - 1 })).toString('base64url'); return body + '.' + createHmac('sha256', 'ticket-secret').update(body).digest('base64url'); })();
  assert.equal((await call('POST', 'save-get', { key: expired })).code, 401);
  const n = (await call('GET', 'save-nonce')).json;
  assert.equal((await call('POST', 'save-login', { nonce: n.nonce, signature: other.sign(n.message), address: w.address })).code, 400, 'signed by another wallet');
  assert.equal((await call('POST', 'save-login', { nonce: n.nonce, signature: w.sign('something else'), address: w.address })).code, 400);
  const old = (() => { const body = Buffer.from(J({ k: 'snonce', s: Date.now() - 16 * 60000, n: 'x' })).toString('base64url'); return body + '.' + createHmac('sha256', 'ticket-secret').update(body).digest('base64url'); })();
  assert.equal((await call('POST', 'save-login', { nonce: old, signature: w.sign(cloudApi.saveMessage(old)) })).code, 400, 'a sign-in older than 15 minutes');
  for (const data of [null, [], 'x', { junk: '1' }, { 'sq-coins': 5 }]) assert.equal((await call('POST', 'save-put', { key: a.key, rev: 0, data })).code, 400, J(data));
  for (const rev of [-1, 1.5, '0', null]) assert.equal((await call('POST', 'save-put', { key: a.key, rev, data: { 'sq-coins': '1' } })).code, 400);
  assert.equal((await call('POST', 'save-put', { key: a.key, rev: 0, data: { 'sq-bank': J(['x'.repeat(20000)]) } })).code, 400, 'a value over 12 KB is dropped, leaving nothing');
  assert.equal((await call('POST', 'save-put', { key: a.key, rev: 0, data: { 'sq-bank': J(['x'.repeat(50000)]) } })).code, 413, 'a body over 32 KB is refused');
  assert.equal((await call('POST', 'save-put', 'x'.repeat(160000))).code, 413);
  assert.equal((await call('GET', 'save-put')).code, 404);
});

test('merging two devices keeps what each earned', () => {
  const base = { 'sq-coins': '500', 'sq-stats': J({ kills: 100, runs: 3 }), 'sq-skills': J({ might: 1 }), 'sq-cleared': J(['greentown']), 'sq-best': J({ t: 400, won: false }), 'sq-name': J('Al') };
  const mine = { ...base, 'sq-coins': '550', 'sq-stats': J({ kills: 140, runs: 4 }), 'sq-cleared': J(['greentown', 'apache']), 'sq-name': J('Alex') };
  const theirs = { ...base, 'sq-coins': '300', 'sq-stats': J({ kills: 160, runs: 5 }), 'sq-skills': J({ might: 3, luck: 1 }), 'sq-best': J({ t: 900, won: true }), 'sq-bank': J(['Bronze Helmet']) };
  const m = mergeSaves(base, mine, theirs);
  assert.equal(m['sq-coins'], '350', 'their 200 spent and my 50 earned');
  assert.deepEqual(JSON.parse(m['sq-stats']), { kills: 200, runs: 6 });
  assert.deepEqual(JSON.parse(m['sq-skills']), { might: 3, luck: 1 });
  assert.deepEqual(JSON.parse(m['sq-cleared']), ['greentown', 'apache']);
  assert.deepEqual(JSON.parse(m['sq-best']), { t: 900, won: true });
  assert.deepEqual(JSON.parse(m['sq-bank']), ['Bronze Helmet'], 'only they had it');
  assert.equal(m['sq-name'], J('Alex'), 'otherwise this device wins');
  // never synced before: a straight join
  assert.equal(mergeSaves(null, { 'sq-coins': '5' }, { 'sq-coins': '7' })['sq-coins'], '12');
  assert.deepEqual(summary(m), { coins: 350, maps: 2, ranks: 4, gear: 1 });
  assert.ok(isFresh({})); assert.ok(!isFresh({ 'sq-coins': '1' }));
});

// ---- two devices end to end: their own storage, one cloud --------------------------------------------------------------
class Store { constructor() { this.m = new Map(); } getItem(k) { return this.m.has(k) ? this.m.get(k) : null; } setItem(k, v) { this.m.set(k, String(v)); } removeItem(k) { this.m.delete(k); } }
function device() {
  const store = new Store(), notes = [], reloads = [];
  let pick = 'cloud';
  const ui = { choose: async () => pick, note: (t) => notes.push(t), reload: () => reloads.push(1) };
  const use = () => { globalThis.localStorage = store; };
  use(); const c = createCloud('./', ui);
  const run = async (f) => { use(); return f(c); };
  return { store, notes, reloads, run, set: (k, v) => { use(); store.setItem(k, v); }, get: (k) => store.getItem(k), choose: (v) => { pick = v; } };
}
test('two devices: the first save goes up, a fresh device loads it, saves made at the same time are joined', async () => {
  const w = wallet(), A = device(), B = device();
  A.set('sq-coins', '500'); A.set('sq-cleared', J(['greentown'])); A.set('sq-settings', J({ ao: false }));
  assert.equal(await A.run((c) => c.signIn(w.conn)), 'saved');
  assert.equal(saves.get(w.address).data['sq-coins'], '500'); assert.equal(saves.get(w.address).data['sq-settings'], undefined);
  assert.equal(await B.run((c) => c.signIn(w.conn)), 'loaded', 'a device with no progress takes the wallet\'s');
  assert.deepEqual([B.get('sq-coins'), B.reloads.length], ['500', 1]);
  // both play: A earns 100, B earns 50 and clears Apache, B saves second
  A.set('sq-coins', '600'); await A.run((c) => c.push(true));
  B.set('sq-coins', '550'); B.set('sq-cleared', J(['greentown', 'apache'])); await B.run((c) => c.push(true));
  assert.equal(B.get('sq-coins'), '650', 'B joined A\'s save into its own'); assert.ok(B.notes.some((n) => /other device/.test(n)));
  await B.run((c) => c.push(true));
  assert.deepEqual([saves.get(w.address).data['sq-coins'], JSON.parse(saves.get(w.address).data['sq-cleared'])], ['650', ['greentown', 'apache']]);
  // A opens the game again: the newer save comes down
  assert.equal(await A.run((c) => c.pull()), true);
  assert.deepEqual([A.get('sq-coins'), A.get('sq-settings')], ['650', J({ ao: false })], 'settings never leave the device');
  assert.equal(await A.run((c) => c.pull()), false, 'nothing newer');
  // a device with its own progress is asked, and can keep its own
  const C = device(); C.set('sq-coins', '42'); C.choose('device');
  assert.equal(await C.run((c) => c.signIn(w.conn)), 'saved'); assert.equal(saves.get(w.address).data['sq-coins'], '42');
  assert.ok(SAVE_KEYS.includes('sq-bank'));
});
