import test from 'node:test';
import assert from 'node:assert/strict';

function storage() { const map = new Map(); return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) }; }
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage() });
// a browser with two wallet extensions (EIP-6963), like Rabby and MetaMask
const listeners = {};
globalThis.window = { addEventListener: (n, f) => { listeners[n] = f; }, dispatchEvent: () => true };
const A = '0x' + '12'.repeat(20), B = '0x' + '34'.repeat(20);
function provider(name) {
  const calls = [], on = {}; let allowed = false, account = A;
  return { calls, on, setAccount: (a) => { account = a; }, p: { request: async ({ method }) => { calls.push(method); if (method === 'eth_requestAccounts') { allowed = true; return [account]; } if (method === 'eth_accounts') return allowed ? [account] : []; return null; }, on: (n, f) => { on[n] = f; } }, name };
}
const rabby = provider('Rabby Wallet'), mm = provider('MetaMask');
const W = await import('../src/wallet.js');
for (const [x, rdns] of [[rabby, 'io.rabby'], [mm, 'io.metamask']]) listeners['eip6963:announceProvider']({ detail: { info: { uuid: rdns, name: x.name, icon: '', rdns }, provider: x.p } });
const { wallets } = await import('../src/dmt.js');

test('both wallet extensions are listed by name with their rdns', () => {
  assert.deepEqual(wallets().map((w) => [w.name, w.rdns]), [['Rabby Wallet', 'io.rabby'], ['MetaMask', 'io.metamask']]);
});

test('connect asks once, is remembered, follows account switches and disconnect forgets it', async () => {
  const seen = []; W.onWallet((c) => seen.push(c && c.address));
  await W.connect(wallets()[0]);
  assert.equal(W.current().address, A); assert.deepEqual(rabby.calls, ['eth_requestAccounts']);
  assert.deepEqual(JSON.parse(localStorage.getItem('sq-wallet')), { rdns: 'io.rabby', name: 'Rabby Wallet', address: A });
  rabby.on.accountsChanged([B]); assert.equal(W.current().address, B);
  rabby.on.accountsChanged([]); assert.equal(W.current(), null); assert.equal(localStorage.getItem('sq-wallet'), null);
  await W.connect(wallets()[1]); assert.equal(W.current().w.name, 'MetaMask');
  W.disconnect(); assert.equal(W.current(), null); assert.equal(localStorage.getItem('sq-wallet'), null);
  assert.deepEqual(seen, [A, B, null, A, null]);
});

test('next visit: the saved wallet reconnects without a prompt (eth_accounts only)', async () => {
  rabby.setAccount(A); await W.connect(wallets()[0]); // saved as Rabby
  const before = rabby.calls.length;
  // simulate a reload: forget the live state but keep storage
  const saved = localStorage.getItem('sq-wallet'); W.disconnect(); localStorage.setItem('sq-wallet', saved);
  const c = await W.restore();
  assert.equal(c.w.name, 'Rabby Wallet'); assert.equal(c.address, A);
  assert.deepEqual(rabby.calls.slice(before).filter((m) => m !== 'wallet_revokePermissions'), ['eth_accounts']);
});

test('balances read DMT and ETH from Arbitrum; amounts are shown short', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, o) => {
    const b = JSON.parse(o.body);
    if (b.method === 'eth_call') { assert.equal(b.params[0].to, W.DMT_TOKEN); assert.ok(b.params[0].data.endsWith('12'.repeat(20))); return new Response(JSON.stringify({ result: '0x' + (5n * 10n ** 18n).toString(16) })); }
    return new Response(JSON.stringify({ result: '0x' + (75n * 10n ** 14n).toString(16) }));
  });
  const b = await W.balances(A, true);
  assert.equal(b.dmt, 5); assert.equal(b.eth, 0.0075);
  assert.equal(W.fmtDmt(5), '5'); assert.equal(W.fmtDmt(4.5), '4.5'); assert.equal(W.fmtDmt(0.25), '0.25'); assert.equal(W.fmtDmt(1234.9), '1,234');
  assert.equal(W.fmtEth(0.0075), '0.0075'); assert.equal(W.fmtEth(0), '0'); assert.equal(W.fmtEth(0.00001), '<0.0001');
});
