import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createCloud } from '../src/cloud.js';
import { connect, current, disconnect, walletRevision } from '../src/wallet.js';
const A='0x'+'1'.repeat(40);

function setup(t, responses) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const store = new Map([['sq-coins', '500'], ['sq-cloud', JSON.stringify({ a: 'wallet', key: 'fixture', rev: 0 })]]);
  t.mock.method(globalThis, 'fetch', async (_url, opts) => {
    calls.push(JSON.parse(opts.body));
    const r = responses.shift();
    if (r instanceof Error) throw r;
    return new Response(JSON.stringify(r?.body ?? { ok: true, rev: JSON.parse(opts.body).rev + 1 }), { status: r?.status ?? 200 });
  });
  const old = globalThis.localStorage;
  globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) };
  t.after(() => { disconnect(); globalThis.localStorage = old; });
  const calls = [], notes = [], cloud = createCloud('./', { note: n => notes.push(n) });
  return { cloud, store, calls, notes, retry: async () => { t.mock.timers.tick(4000); for (let i = 0; i < 20; i++) await Promise.resolve(); } };
}

for (const failure of [{ status: 500 }, { status: 429 }, new Error('offline'), { status: 200, body: {} }]) {
  test(`failed upload stays local and automatically retries: ${failure.status ?? failure.message}`, async t => {
    const d = setup(t, [failure]);
    assert.equal(await d.cloud.push(true), false);
    assert.equal(d.store.get('sq-coins'), '500');
    assert.equal(d.store.get('sq-cloud-base'), undefined);
    d.store.set('sq-coins', '650'); // the retry must include progress earned since the failure
    await d.retry();
    assert.equal(d.calls.length, 2);
    assert.equal(d.calls[1].data['sq-coins'], '500', 'retry resolves the original upload first');
    await d.retry();
    assert.equal(d.calls[2].data['sq-coins'], '650');
    assert.equal(JSON.parse(d.store.get('sq-cloud-base'))['sq-coins'], '650');
    assert.equal(await d.cloud.push(), true, 'already acknowledged progress is saved');
    assert.equal(d.calls.length, 3);
  });
}

test('expired sessions and invalid saves never report success or retry forever', async t => {
  const d = setup(t, [{ status: 400 }, { status: 401 }]);
  assert.equal(await d.cloud.push(true), false);
  await d.retry(); assert.equal(d.calls.length, 1);
  assert.match(d.notes[0], /not uploaded/i);
  assert.equal(await d.cloud.push(true), false);
  assert.equal(d.cloud.state(), null);
  await d.retry(); assert.equal(d.calls.length, 2);
});

test('a conflict preserves progress earned while the upload was in flight', async t => {
  const d = setup(t, []);
  d.store.set('sq-cloud-base', JSON.stringify({ 'sq-coins': '100' }));
  let finish;
  globalThis.fetch = () => new Promise(resolve => { finish = resolve; });
  const saving = d.cloud.push(); d.store.set('sq-coins', '650');
  finish(new Response(JSON.stringify({ conflict: true, rev: 1, data: { 'sq-coins': '200' } }), { status: 409 }));
  assert.equal(await saving, false);
  assert.equal(d.store.get('sq-coins'), '750');
  d.cloud.signOut();
});

test('a committed upload with a lost response is reconciled without counting earnings twice', async t => {
  const d = setup(t, [new Error('response lost'), { status: 409, body: { conflict: true, rev: 1, data: { 'sq-coins': '500' } } }]);
  d.store.set('sq-cloud-base', JSON.stringify({ 'sq-coins': '100' }));
  await d.cloud.push(); d.store.set('sq-coins', '650');
  await d.retry();
  assert.equal(d.store.get('sq-coins'), '650');
  await d.retry();
  assert.equal(JSON.parse(d.store.get('sq-cloud-base'))['sq-coins'], '650');
});

test('reopening the game during an upload reconciles a committed save without duplicating earnings', async t => {
  const d = setup(t, []);
  d.store.set('sq-cloud-base', JSON.stringify({ 'sq-coins': '100' }));
  globalThis.fetch = () => new Promise(() => {}); // the old page never receives the committed save's response
  void d.cloud.push();
  d.store.set('sq-coins', '650');
  const reopened = createCloud('./', { note() {} });
  globalThis.fetch = async () => new Response(JSON.stringify({ conflict: true, rev: 1, data: { 'sq-coins': '500' } }), { status: 409 });
  assert.equal(await reopened.push(), false);
  assert.equal(d.store.get('sq-coins'), '650');
  assert.equal(JSON.parse(d.store.get('sq-cloud-base'))['sq-coins'], '500');
  reopened.signOut();
});

test('a delayed pull cannot merge progress while an upload is resolving a conflict', async t => {
  const d = setup(t, []);
  d.store.set('sq-cloud', JSON.stringify({ a: 'wallet', key: 'fixture', rev: 1 }));
  d.store.set('sq-cloud-base', JSON.stringify({ 'sq-coins': '100' }));
  let finishGet, finishPut;
  globalThis.fetch = url => new Promise(resolve => { if (url.endsWith('save-get')) finishGet = resolve; else finishPut = resolve; });
  const pulling = d.cloud.pull(), saving = d.cloud.push();
  const newer = { rev: 2, data: { 'sq-coins': '200' } };
  finishGet(new Response(JSON.stringify(newer)));
  assert.equal(await pulling, false);
  assert.equal(d.store.get('sq-coins'), '500');
  finishPut(new Response(JSON.stringify({ ...newer, conflict: true }), { status: 409 }));
  assert.equal(await saving, false);
  assert.equal(d.store.get('sq-coins'), '600');
  d.cloud.signOut();
});

test('an ambiguous interrupted upload pauses instead of duplicating or discarding progress', async t => {
  const d = setup(t, [new Error('response lost'), { status: 409, body: { conflict: true, rev: 2, data: { 'sq-coins': '600' } } }]);
  await d.cloud.push(); d.store.set('sq-coins', '650');
  await d.retry();
  assert.equal(d.store.get('sq-coins'), '650');
  assert.equal(d.cloud.state(), null);
  assert.match(d.notes.at(-1), /choose which progress/);
  await d.retry(); assert.equal(d.calls.length, 2);
});

test('switching wallets during an upload still retries the new wallet save', async t => {
  const d = setup(t, []);
  let finish;
  globalThis.fetch = () => new Promise(resolve => { finish = resolve; });
  const saving = d.cloud.push(); d.cloud.signOut();
  d.store.set('sq-cloud', JSON.stringify({ a: 'second wallet', key: 'second fixture', rev: 0 }));
  assert.equal(await d.cloud.push(), false);
  finish(new Response(JSON.stringify({ ok: true, rev: 1 })));
  assert.equal(await saving, false);
  let uploaded = false;
  globalThis.fetch = async (_url, opts) => {
    assert.equal(JSON.parse(opts.body).key, 'second fixture'); uploaded = true;
    return new Response(JSON.stringify({ ok: true, rev: 1 }));
  };
  await d.retry(); assert.equal(uploaded, true);
  assert.equal(d.cloud.state().a, 'second wallet');
});

test('turning off cloud save cancels retries and cannot be undone by an in-flight save', async t => {
  const d = setup(t, [new Error('offline')]);
  await d.cloud.push(); d.cloud.signOut(); await d.retry();
  assert.equal(d.calls.length, 1);
  d.store.set('sq-cloud', JSON.stringify({ a: 'wallet', key: 'fixture', rev: 0 }));
  let finish;
  globalThis.fetch = () => new Promise(resolve => { finish = resolve; });
  const saving = d.cloud.push(); d.cloud.signOut();
  finish(new Response(JSON.stringify({ ok: true, rev: 1 })));
  assert.equal(await saving, false);
  assert.equal(d.cloud.state(), null);
  assert.equal(d.store.get('sq-cloud-base'), undefined);
});

test('initial wallet setup reports a pending upload, then retries it', async t => {
  const d = setup(t, []);
  await connect({p:{request:async({method})=>method==='personal_sign'?'signature':[A]}});
  let uploads = 0;
  globalThis.fetch = async url => {
    const body = url.endsWith('save-nonce') ? { message: 'fixture message', nonce: 'nonce' }
      : url.endsWith('save-login') ? { address: A, key: 'fixture', rev: 0 }
      : ++uploads === 1 ? {} : { ok: true, rev: 1 };
    return new Response(JSON.stringify(body), { status: uploads === 1 && url.endsWith('save-put') ? 500 : 200 });
  };
  assert.equal(await d.cloud.signIn(current()), 'pending');
  await d.retry();
  assert.equal(uploads, 2);
  assert.equal(JSON.parse(d.store.get('sq-cloud-base'))['sq-coins'], '500');
});

test('Save now shows success only after an acknowledged upload', async t => {
  setup(t, []); await connect({p:{request:async()=>[A]}});
  const source = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  const bind = source.slice(source.indexOf('function bindCloud('), source.indexOf('// open the game or come back'));
  for (const saved of [false, true]) {
    const button = {}, messages = [];
    const run = Function('$', 'cloud', 'renderWallet', 'record', 'walletNow', 'walletRevision', 'cloudFor', `let cloudConnecting=null; ${bind}; bindCloud(walletNow(), record);`);
    run(id => id === 'wlcloudnow' ? button : null, { push: async () => saved, state: () => ({key:'fixture'}) }, () => {}, m => messages.push(m), current, walletRevision, () => ({key:'fixture'}));
    await button.onclick();
    assert.equal(messages.at(-1) === 'Saved to your wallet.', saved);
    if (!saved) assert.match(messages.at(-1), /device|upload/i);
  }
});
