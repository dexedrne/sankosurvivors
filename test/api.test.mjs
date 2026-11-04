import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { Readable } from 'node:stream';
import { createHmac } from 'node:crypto';
import { MAPS } from '../src/content.js';

// the API, run locally against a fake Supabase that records what reaches it
Object.assign(process.env, { SUPABASE_URL: 'https://db.test', SUPABASE_KEY: 'k', SQS_TICKET_SECRET: 'ticket-secret', SQS_SERVER_KEY: 'server-key' });
const require = createRequire(import.meta.url);
const handler = require('../tools/vercel-api/index.js');
const calls = [];
globalThis.fetch = async (url, opts) => { calls.push({ url: String(url), body: JSON.parse(opts.body) }); return new Response(JSON.stringify({ ok: true, rank: 1 }), { status: 200 }); };

function call(method, route, body, headers = { 'content-type': 'application/json' }) {
  const req = Readable.from(body === undefined ? [] : [typeof body === 'string' ? body : JSON.stringify(body)]);
  Object.assign(req, { method, url: `/api?route=${route}`, headers: { 'x-forwarded-for': '1.2.3.4', ...headers } });
  return new Promise((done) => {
    const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(s) { done({ code: this.statusCode, json: JSON.parse(s) }); } };
    handler(req, res);
  });
}
// a run ticket issued `ago` seconds ago
function ticket(ago) {
  const body = Buffer.from(JSON.stringify({ s: Date.now() - ago * 1000, n: 'n' + Math.random() })).toString('base64url');
  return body + '.' + createHmac('sha256', 'ticket-secret').update(body).digest('base64url');
}

test("the server's win rules match each map's length and final boss", () => {
  for (const m of MAPS) {
    const boss = m.bosses.at(-1); assert.equal(boss.type, m.finalBoss, m.id + ': the last boss on the schedule is the final one');
    assert.deepEqual(handler.WIN[m.id], [boss.t, m.length], m.id);
  }
});

test('scores: a win before the final boss can exist is refused; honest runs go through', async () => {
  calls.length = 0;
  assert.equal((await call('POST', 'score', { map: 'greentown', t: 5, kills: 150, level: 3, won: true, ticket: ticket(10) })).code, 400, 'an instant win');
  assert.equal((await call('POST', 'score', { map: 'goblins', t: 500, kills: 400, level: 9, won: true, ticket: ticket(520) })).code, 400, 'a win before the last ogre arrives');
  assert.equal(calls.length, 0, 'none of that reached the database');
  assert.equal((await call('POST', 'score', { map: 'greentown', t: 901, kills: 2000, level: 30, won: true, ticket: ticket(930) })).code, 200, 'a survived run');
  assert.equal((await call('POST', 'score', { map: 'goblins', t: 815, kills: 900, level: 20, won: true, ticket: ticket(830) })).code, 200, 'an early win by beating the last ogre');
  const saved = calls.at(-1).body; assert.equal(saved.p_won, true); assert.equal(saved.p_map, 'goblins');
  assert.equal((await call('POST', 'score', { map: 'greentown', t: 200, kills: 5, level: 4, won: 'false', ticket: ticket(210) })).code, 200);
  assert.equal(calls.at(-1).body.p_won, false, 'only a real true counts as a win');
});

test('junk input gets a clear refusal, not a crash', async () => {
  calls.length = 0;
  for (const bad of [{ map: { x: 1 }, t: 10, ticket: ticket(20) }, { map: 'nowhere', t: 10, ticket: ticket(20) }])
    assert.equal((await call('POST', 'score', bad)).code, 400);
  const r = await call('POST', 'score', { map: 'greentown', t: 100, kills: 1e300, level: 1e10, ticket: ticket(120) });
  assert.equal(r.code, 200); assert.ok(calls.at(-1).body.p_kills <= 1e6 && calls.at(-1).body.p_level <= 1e6, 'numbers are clamped');
  for (const route of ['score', 'report', 'holder']) {
    const n = await call('POST', route, 'null'); assert.ok(n.code >= 400 && n.code < 500, `${route}: null body is a 4xx (${n.code})`);
  }
  assert.equal((await call('POST', 'score', 'x'.repeat(30000))).code, 400, 'an oversized body');
  assert.equal((await call('POST', 'report', { text: 'hi', settings: { a: 'x'.repeat(5000) } })).code, 200);
  assert.equal(calls.at(-1).body.p_report.settings, null, 'huge settings are dropped');
});

test('POSTs must be JSON (another site cannot submit from a visitor\'s browser)', async () => {
  assert.equal((await call('POST', 'score', JSON.stringify({ map: 'greentown' }), { 'content-type': 'text/plain' })).code, 415);
  assert.equal((await call('POST', 'report', JSON.stringify({ text: 'x' }), {})).code, 415);
});

test('malformed signed tokens are refused without exceptions or database calls', async () => {
  calls.length = 0;
  const valid = ticket(120), body = valid.split('.')[0];
  const saveBody = Buffer.from(JSON.stringify({ k: 'save', a: '0x' + 'ab'.repeat(20), exp: Date.now() + 60000 })).toString('base64url');
  const saveToken = saveBody + '.' + createHmac('sha256', 'ticket-secret').update(saveBody).digest('base64url');
  const saveBad = [saveToken + '.extra', saveBody + '.' + 'é'.repeat(43), saveBody + '.' + 'a'.repeat(42)];
  let i = 0;
  for (const bad of [valid + '.extra', body + '.' + 'é'.repeat(43), body + '.' + 'a'.repeat(42)]) {
    const score = await call('POST', 'score', { map: 'greentown', t: 100, kills: 10, level: 2, ticket: bad });
    assert.deepEqual(score, { code: 400, json: { error: 'no ticket' } });
    const save = await call('POST', 'save-get', { key: saveBad[i++] });
    assert.equal(save.code, 401);
  }
  assert.equal(calls.length, 0);
});

test('endless runs: their own boards, never a win, and an old database (before update3.sql) still takes the score', async () => {
  calls.length = 0;
  assert.equal((await call('POST', 'score', { map: 'greentown', t: 1500, kills: 6000, level: 60, won: true, endless: true, ticket: ticket(1510) })).code, 200);
  let saved = calls.at(-1).body; assert.equal(saved.p_endless, true); assert.equal(saved.p_won, false, 'an endless run is never a win');
  assert.equal((await call('POST', 'score', { map: 'oasis', t: 300, kills: 400, level: 12, ticket: ticket(310) })).code, 200, 'the Hidden Oasis has a board');
  assert.equal(calls.at(-1).body.p_endless, undefined, 'a normal run says nothing about endless');
  // the database has no endless boards yet: the endless mark is dropped and the score still saves
  const real = globalThis.fetch; calls.length = 0;
  globalThis.fetch = async (url, opts) => { const b = JSON.parse(opts.body); calls.push({ url: String(url), body: b }); return b.p_endless ? new Response('{"message":"no function"}', { status: 404 }) : new Response(JSON.stringify({ ok: true, rank: 3 }), { status: 200 }); };
  try {
    assert.equal((await call('POST', 'score', { map: 'greentown', t: 1200, kills: 5000, level: 50, endless: true, ticket: ticket(1210) })).code, 200);
    assert.equal(calls.at(-1).body.p_endless, undefined);
  } finally { globalThis.fetch = real; }
});

test('casual score fields reject poisoned objects and coerced arrays before upstream work', async () => {
  const base = { ticket: ticket(120), map: 'greentown', name: 'Ranger', adv: 'knight', t: 100, kills: 12, level: 3 };
  for (const field of ['map', 'name', 'adv', 't', 'kills', 'level']) {
    const bad = ['map', 'name', 'adv'].includes(field) ? [{ toString: 1 }, { valueOf: 1 }, [], ['greentown'], false, 42] : [{ toString: 1 }, { valueOf: 1 }, [], [100], false, true, 'NaN', 'Infinity'];
    for (const value of bad) {
      calls.length = 0;
      const out = await call('POST', 'score', { ...base, [field]: value });
      assert.equal(out.code, 400, field + ': ' + JSON.stringify(value));
      assert.equal(calls.length, 0, field + ' did not reach upstream');
    }
  }
});

test('casual validation preserves legacy numeric strings, Unicode and strict-true flags', async () => {
  calls.length = 0;
  const out = await call('POST', 'score', { ticket: ticket(120), map: 'greentown', name: 'Çağrı 🧀', adv: 'knight', t: '100.9', kills: '12.8', level: '3.6', won: 'false', hard: 'no' });
  assert.equal(out.code, 200);
  const saved = calls.at(-1).body;
  assert.equal(saved.p_name, 'Çağrı 🧀'); assert.equal(saved.p_adv, 'knight');
  assert.equal(saved.p_t, 100); assert.equal(saved.p_kills, 12); assert.equal(saved.p_level, 3);
  assert.equal(saved.p_won, false); assert.equal(saved.p_hard, false);
});

test('required report text rejects non-strings before upstream work', async () => {
  for (const text of [{ toString: 1 }, { valueOf: 1 }, {}, ['help'], true, 42]) {
    calls.length = 0;
    assert.equal((await call('POST', 'report', { text })).code, 400, JSON.stringify(text));
    assert.equal(calls.length, 0);
  }
});

test('optional report metadata never invokes object coercion or loses valid Unicode text', async () => {
  calls.length = 0;
  const out = await call('POST', 'report', { text: 'Harita açılmıyor 🧀', map: { toString: 1 }, adv: [], v: 42, errors: [{ toString: 1 }, '<ouch>', 17], settings: { sound: false } });
  assert.equal(out.code, 200);
  const report = calls.at(-1).body.p_report;
  assert.equal(report.text, 'Harita açılmıyor 🧀');
  assert.equal(report.map, ''); assert.equal(report.adv, ''); assert.equal(report.v, '');
  assert.deepEqual(report.errors, ['', 'ouch', '']); assert.deepEqual(report.settings, { sound: false });
});

test('text limits never send an unpaired surrogate to PostgreSQL', async () => {
  calls.length = 0;
  assert.equal((await call('POST', 'score', { ticket: ticket(120), map: 'greentown', name: 'a'.repeat(15) + '🧀', adv: 'knight', t: 100, kills: 12, level: 3 })).code, 200);
  assert.equal(calls.at(-1).body.p_name, 'a'.repeat(15));
  assert.equal((await call('POST', 'report', { text: 'a'.repeat(1999) + '🧀', errors: ['b'.repeat(299) + '🧀', 'good 🧀', 'x\ud800y'] })).code, 200);
  const report = calls.at(-1).body.p_report;
  assert.equal(report.text, 'a'.repeat(1999));
  assert.deepEqual(report.errors, ['b'.repeat(299), 'good 🧀', 'xy']);
});

test('required report text containing only invalid surrogate code units is refused', async () => {
  calls.length = 0;
  assert.equal((await call('POST', 'report', { text: '\udfff\ud800' })).code, 400);
  assert.equal(calls.length, 0);
});

const { secp256k1, keccak_256 } = require('../tools/vercel-api/noble-crypto.cjs');
const fixtureAddress = '0x7e5f4552091a69125d5dfcb7b8c2659029395bdf';
function fixtureSign(message) {
  const bytes = Buffer.from(message), hash = keccak_256(Buffer.concat([Buffer.from(`\x19Ethereum Signed Message:\n${bytes.length}`), bytes]));
  const sig = secp256k1.sign(hash, Buffer.from('01'.padStart(64, '0'), 'hex'), { prehash: false, format: 'recovered' });
  return '0x' + Buffer.concat([sig.subarray(1), Buffer.from([sig[0] + 27])]).toString('hex');
}
test('holder and cloud authentication reject non-string supplied addresses before upstream work', async () => {
  for (const [route, nonceRoute] of [['holder', 'nonce'], ['save-login', 'save-nonce']]) {
    const n = (await call('GET', nonceRoute)).json, signature = fixtureSign(n.message);
    for (const address of [{ toString: 1 }, {}, [], [fixtureAddress], 0, false, '']) {
      calls.length = 0;
      const out = await call('POST', route, { nonce: n.nonce, signature, address });
      assert.equal(out.code, 400, route + ': ' + JSON.stringify(address));
      assert.equal(calls.length, 0, route + ' did not read balances or saves');
    }
  }
});

test('cloud authentication preserves omitted/null addresses and case-insensitive matching strings', async () => {
  const n = (await call('GET', 'save-nonce')).json, signature = fixtureSign(n.message);
  for (const address of [undefined, null, fixtureAddress, fixtureAddress.toUpperCase()]) {
    calls.length = 0;
    const out = await call('POST', 'save-login', { nonce: n.nonce, signature, address });
    assert.equal(out.code, 200); assert.equal(out.json.address, fixtureAddress);
    assert.equal(calls.at(-1).body.p_wallet, fixtureAddress);
  }
});
