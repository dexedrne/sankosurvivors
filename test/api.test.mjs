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
