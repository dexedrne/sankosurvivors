import test from 'node:test';
import assert from 'node:assert/strict';
import { createCloud } from '../src/cloud.js';

const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const response = data => new Response(JSON.stringify(data));
function setup(t) {
  const store = new Map([['sq-coins', '500']]), old = globalThis.localStorage;
  globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) };
  t.after(() => { globalThis.localStorage = old; });
  const login = deferred(), requested = deferred(), choice = deferred(), choosing = deferred();
  let reloads = 0;
  const cloud = createCloud('./', { choose: () => { choosing.resolve(); return choice.promise; }, note() {}, reload: () => { reloads++; } });
  t.mock.method(globalThis, 'fetch', async url => {
    if (url.endsWith('save-nonce')) return response({ message: 'fixture', nonce: 'nonce' });
    if (url.endsWith('save-login')) { requested.resolve(); return login.promise; }
    throw new Error('obsolete sign-in must not upload');
  });
  const conn = { address: 'wallet-a', w: { p: { request: async () => 'fixture-signature' } } };
  return { cloud, store, login, requested, choice, choosing, conn, reloads: () => reloads };
}

test('signing out while login is delayed cannot turn cloud back on or replace local progress', async t => {
  const d = setup(t), signing = d.cloud.signIn(d.conn);
  await d.requested.promise;
  d.cloud.signOut(); d.store.set('sq-coins', '650');
  d.login.resolve(response({ address: 'wallet-a', key: 'key-a', rev: 1, data: { 'sq-coins': '650' } }));
  await assert.rejects(signing, /cancelled|changed/i);
  assert.equal(d.cloud.state(), null);
  assert.equal(d.store.get('sq-coins'), '650');
  assert.equal(d.store.has('sq-cloud-base'), false);
  assert.equal(d.reloads(), 0);
});

test('an old save choice cannot overwrite progress after signing out', async t => {
  const d = setup(t), signing = d.cloud.signIn(d.conn);
  await d.requested.promise;
  d.login.resolve(response({ address: 'wallet-a', key: 'key-a', rev: 1, data: { 'sq-coins': '100' } }));
  await d.choosing.promise;
  d.cloud.signOut(); d.store.set('sq-coins', '650');
  d.choice.resolve('cloud');
  await assert.rejects(signing, /cancelled|changed/i);
  assert.equal(d.cloud.state(), null);
  assert.equal(d.store.get('sq-coins'), '650');
  assert.equal(d.store.has('sq-cloud-base'), false);
  assert.equal(d.reloads(), 0);
});

test('a newer wallet login wins when an older wallet response arrives last', async t => {
  const d = setup(t), first = d.cloud.signIn(d.conn);
  await d.requested.promise;
  globalThis.fetch = async url => response(url.endsWith('save-nonce') ? { message: 'fixture', nonce: 'second' }
    : { address: 'wallet-b', key: 'key-b', rev: 2, data: { 'sq-coins': '500' } });
  assert.equal(await d.cloud.signIn({ ...d.conn, address: 'wallet-b' }), 'same');
  d.login.resolve(response({ address: 'wallet-a', key: 'key-a', rev: 1, data: { 'sq-coins': '500' } }));
  await assert.rejects(first, /cancelled|changed/i);
  assert.equal(d.cloud.state().a, 'wallet-b');
  assert.equal(d.cloud.state().rev, 2);
  assert.equal(d.store.get('sq-coins'), '500');
});

test('another tab signing out prevents a delayed login from restoring its session', async t => {
  const d = setup(t);
  d.store.set('sq-cloud', JSON.stringify({ a: 'previous-wallet', key: 'previous-key', rev: 1 }));
  const signing = d.cloud.signIn(d.conn);
  await d.requested.promise;
  createCloud('./', {}).signOut();
  d.login.resolve(response({ address: 'wallet-a', key: 'key-a', rev: 1, data: { 'sq-coins': '500' } }));
  await assert.rejects(signing, /cancelled|changed/i);
  assert.equal(d.cloud.state(), null);
  assert.equal(d.store.get('sq-coins'), '500');
});

test('another tab replacing the session invalidates an old progress choice', async t => {
  const d = setup(t), signing = d.cloud.signIn(d.conn);
  await d.requested.promise;
  d.login.resolve(response({ address: 'wallet-a', key: 'key-a', rev: 1, data: { 'sq-coins': '100' } }));
  await d.choosing.promise;
  d.store.set('sq-cloud', JSON.stringify({ a: 'wallet-b', key: 'key-b', rev: 2 }));
  d.store.set('sq-coins', '650');
  d.choice.resolve('cloud');
  await assert.rejects(signing, /cancelled|changed/i);
  assert.equal(d.cloud.state().a, 'wallet-b');
  assert.equal(d.store.get('sq-coins'), '650');
  assert.equal(d.reloads(), 0);
});
