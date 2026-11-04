import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

Object.assign(process.env, { SUPABASE_URL: 'https://db.test', SUPABASE_KEY: 'fixture', SQS_SERVER_KEY:'server-key', SQS_TICKET_SECRET:'ticket-secret' });
const require = createRequire(import.meta.url);
const ranked = require('../tools/vercel-api/ranked.js');
const handler = require('../tools/vercel-api/index.js');
function deadlines(t) {
  const original = AbortSignal.timeout.bind(AbortSignal);
  t.mock.method(AbortSignal, 'timeout', ms => { assert.equal(ms, 10000); return original(10); });
  const hung = signal => {
    assert.ok(signal instanceof AbortSignal, 'upstream fetch must have a deadline');
    return new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
  };
  return hung;
}
test('ranked receipt lookup aborts a stalled first RPC and reaches fallback', async t => {
  const hung = deadlines(t), urls = [];
  t.mock.method(globalThis, 'fetch', async (url, opts) => {
    urls.push(String(url));
    if (urls.length === 1) return hung(opts.signal);
    assert.ok(opts.signal instanceof AbortSignal);
    return new Response(JSON.stringify({ result: null }));
  });
  const keepAlive = setTimeout(() => {}, 1000); t.after(() => clearTimeout(keepAlive));
  const result = await ranked.checkPayment('0x' + '1'.repeat(64), '0x' + '2'.repeat(40), 0);
  assert.equal(result.retry, true);
  assert.equal(urls.length, 2);
  assert.match(urls[1], /publicnode/);
});
test('database RPC deadline returns a server error instead of holding a request indefinitely', async t => {
  const hung = deadlines(t);
  let bounded = false;
  t.mock.method(globalThis, 'fetch', (_url, opts) => { bounded = opts.signal instanceof AbortSignal; return hung(opts.signal); });
  t.mock.method(console, 'error', () => {});
  const keepAlive = setTimeout(() => {}, 1000); t.after(() => clearTimeout(keepAlive));
  let result;
  await handler({ method: 'GET', url: '/api/scores?map=greentown', headers: {} }, {
    setHeader() {}, end(body) { result = { status: this.statusCode, body: JSON.parse(body) }; },
  });
  assert.equal(result.status, 500);
  assert.equal(bounded, true);
  assert.equal(result.body.error, 'server error');
});
