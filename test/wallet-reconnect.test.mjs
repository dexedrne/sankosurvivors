import test from 'node:test';
import assert from 'node:assert/strict';

const events = new Map();
globalThis.window = { addEventListener: (name, fn) => events.set(name, fn), dispatchEvent() {} };
const A = '0x' + '12'.repeat(20), B = '0x' + '34'.repeat(20), C = '0x' + '56'.repeat(20);
let sequence = 0;
function deferred() {
  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
}
async function fixture() {
  const data = new Map(), seen = [], requests = [], id = ++sequence;
  globalThis.localStorage = { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)), removeItem: k => data.delete(k) };
  const wallet = await import(`../src/wallet.js?reconnect=${id}`);
  wallet.onWallet(c => seen.push(c ? { name: c.w.name, address: c.address } : null));
  function provider(label, request = () => [A], announce = true) {
    const handlers = new Map();
    const w = { name: label + id, rdns: `test.sqs.${label}${id}`, p: {
      async request(args) { requests.push([label, args.method]); return args.method === 'wallet_revokePermissions' ? null : await request(args); },
      on: (name, fn) => handlers.set(name, fn),
    } };
    const emit = () => events.get('eip6963:announceProvider')({ detail: { info: { uuid: w.rdns, rdns: w.rdns, name: w.name, icon: '' }, provider: w.p } });
    if (announce) emit();
    return { w, announce: emit, accounts: value => handlers.get('accountsChanged')?.(value) };
  }
  const remember = w => localStorage.setItem('sq-wallet', JSON.stringify({ name: w.name, rdns: w.rdns, address: A }));
  const saved = () => JSON.parse(localStorage.getItem('sq-wallet') || 'null');
  return { wallet, seen, requests, provider, remember, saved };
}

for (const response of [[A], []]) test(`delayed restore ${JSON.stringify(response)} preserves a newer wallet choice`, async () => {
  const f = await fixture(), pending = deferred();
  const old = f.provider('Old', () => pending.promise), next = f.provider('New', () => [B]);
  f.remember(old.w); const restoring = f.wallet.restore();
  await f.wallet.connect(next.w); pending.resolve(response); await restoring;
  assert.equal(f.wallet.current().w.p, next.w.p);
  assert.equal(f.wallet.current().address, B);
  assert.equal(f.saved()?.rdns, next.w.rdns);
  assert.deepEqual(f.seen, [{ name: next.w.name, address: B }]);
});
test('delayed restore cannot reconnect after Disconnect', async () => {
  const f = await fixture(), pending = deferred(), old = f.provider('Old', () => pending.promise);
  f.remember(old.w); const restoring = f.wallet.restore(); f.wallet.disconnect();
  pending.resolve([A]); await restoring;
  assert.equal(f.wallet.current(), null); assert.equal(f.saved(), null);
  assert.deepEqual(f.seen, [null]);
});
test('Disconnect also cancels a pending explicit connection', async () => {
  const f = await fixture(), pending = deferred(), w = f.provider('Old', () => pending.promise);
  const connecting = f.wallet.connect(w.w); f.wallet.disconnect(); pending.resolve([A]);
  await assert.rejects(connecting, /wallet.*changed/i);
  assert.equal(f.wallet.current(), null); assert.equal(f.saved(), null);
});
test('the newer explicit connection wins when the old prompt responds last', async () => {
  const f = await fixture(), pending = deferred();
  const old = f.provider('Old', () => pending.promise), next = f.provider('New', () => [B]);
  const connecting = f.wallet.connect(old.w); await f.wallet.connect(next.w); pending.resolve([A]);
  await assert.rejects(connecting, /wallet.*changed/i);
  assert.equal(f.wallet.current().w.p, next.w.p); assert.equal(f.saved().address, B);
  assert.deepEqual(f.seen, [{ name: next.w.name, address: B }]);
});
test('an active account-change event supersedes an earlier connection response', async () => {
  const f = await fixture(), pending = deferred(); let calls = 0;
  const w = f.provider('Old', () => ++calls === 1 ? [A] : pending.promise);
  await f.wallet.connect(w.w); const connecting = f.wallet.connect(w.w);
  w.accounts([C]); pending.resolve([A]);
  await assert.rejects(connecting, /wallet.*changed/i);
  assert.equal(f.wallet.current().address, C); assert.equal(f.saved().address, C);
});
test('locking the active wallet invalidates a pending connection response', async () => {
  const f = await fixture(), pending = deferred(); let calls = 0;
  const w = f.provider('Old', () => ++calls === 1 ? [A] : pending.promise);
  await f.wallet.connect(w.w); const connecting = f.wallet.connect(w.w);
  w.accounts([]); pending.resolve([A]);
  await assert.rejects(connecting, /wallet.*changed/i);
  assert.equal(f.wallet.current(), null); assert.equal(f.saved(), null);
});
test('matching account-change events during a connection prompt are accepted', async () => {
  const f = await fixture(), pending = deferred(); let calls = 0;
  const w = f.provider('Old', () => ++calls === 1 ? [A] : pending.promise);
  await f.wallet.connect(w.w); const connecting = f.wallet.connect(w.w);
  w.accounts([C]); pending.resolve([C]);
  const result = await connecting;
  assert.equal(result.address, C); assert.equal(f.wallet.current().address, C);
});
test('passive restore does not start while an explicit connection is pending', async () => {
  const f = await fixture(), pending = deferred();
  const old = f.provider('Old', () => [A]), next = f.provider('New', () => pending.promise);
  f.remember(old.w); const connecting = f.wallet.connect(next.w); await f.wallet.restore();
  const during = f.wallet.current(), requests = f.requests.slice();
  pending.resolve([B]); await connecting;
  assert.equal(during, null); assert.deepEqual(requests, [['New', 'eth_requestAccounts']]);
  assert.equal(f.wallet.current().address, B);
});
test('the first accepted passive restore cannot be overwritten by another pending restore', async () => {
  const f = await fixture(), first = deferred(), second = deferred(); let calls = 0;
  const w = f.provider('Old', () => ++calls === 1 ? first.promise : second.promise);
  f.remember(w.w); const one = f.wallet.restore(), two = f.wallet.restore();
  first.resolve([A]); await one; second.resolve([B]); await two;
  assert.equal(f.wallet.current().address, A); assert.equal(f.saved().address, A);
  assert.deepEqual(f.seen, [{ name: w.w.name, address: A }]);
});
test('empty passive permission result invalidates another older pending restore', async () => {
  const f = await fixture(), first = deferred(), second = deferred(); let calls = 0;
  const w = f.provider('Old', () => ++calls === 1 ? first.promise : second.promise);
  f.remember(w.w); const one = f.wallet.restore(), two = f.wallet.restore();
  first.resolve([]); await one; second.resolve([A]); await two;
  assert.equal(f.wallet.current(), null); assert.equal(f.saved(), null);
});
test('Disconnect cancels passive provider discovery before it asks for accounts', async () => {
  const f = await fixture(), w = f.provider('Late', () => [A], false);
  f.remember(w.w); const restoring = f.wallet.restore(); f.wallet.disconnect(); w.announce();
  await restoring;
  assert.deepEqual(f.requests, []); assert.equal(f.wallet.current(), null); assert.equal(f.saved(), null);
});
for (const response of [null, A, { 0: A }, [123], ['0xwrong'], []]) {
  test(`malformed or absent account ${JSON.stringify(response)} cannot become a restored wallet`, async () => {
    const f = await fixture(), w = f.provider('Bad', () => response);
    f.remember(w.w); await f.wallet.restore();
    assert.equal(f.wallet.current(), null); assert.equal(f.saved(), null);
    assert.deepEqual(f.seen, []);
  });
  test(`explicit connection validates account response ${JSON.stringify(response)}`, async () => {
    const f = await fixture(), w = f.provider('Bad', () => response);
    await assert.rejects(f.wallet.connect(w.w), /No account was shared/);
    assert.equal(f.wallet.current(), null); assert.equal(f.saved(), null);
  });
}
test('malformed active account events clear the selection without publishing invalid addresses', async () => {
  for (const response of [null, A, { 0: A }, [123], ['0xwrong']]) {
    const f = await fixture(), w = f.provider('Bad', () => [A]);
    await f.wallet.connect(w.w); assert.doesNotThrow(() => w.accounts(response));
    assert.equal(f.wallet.current(), null); assert.equal(f.saved(), null);
    assert.deepEqual(f.seen, [{ name: w.w.name, address: A }, null]);
  }
});
test('inactive provider events do not cancel the selected provider connection', async () => {
  const f = await fixture(), pending = deferred();
  const old = f.provider('Old', () => [A]), next = f.provider('New', () => [B]), third = f.provider('Third', () => pending.promise);
  await f.wallet.connect(old.w); await f.wallet.connect(next.w);
  const connecting = f.wallet.connect(third.w); old.accounts([C]); pending.resolve([C]);
  await connecting;
  assert.equal(f.wallet.current().w.p, third.w.p); assert.equal(f.saved().address, C);
});
test('provider rejection preserves the previously connected wallet', async () => {
  const f = await fixture(), old = f.provider('Old', () => [A]), next = f.provider('New', () => { throw new Error('fixture rejection'); });
  await f.wallet.connect(old.w); await assert.rejects(f.wallet.connect(next.w), /fixture rejection/);
  assert.equal(f.wallet.current().w.p, old.w.p); assert.equal(f.saved().address, A);
});
