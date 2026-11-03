import test from 'node:test';
import assert from 'node:assert/strict';
import * as client from '../src/ranked-client.js';
const address = '0x' + '12'.repeat(20), token = '0x' + '34'.repeat(20), collect = '0x' + '56'.repeat(20), tx = '0x' + 'ab'.repeat(32);
const nonce = { nonce: 'signed', message: 'Sign é', week: 0, dmt: token, collect, amountWei: '500000000000000000', chainId: 42161 };
const response = (d, status = 200) => new Response(JSON.stringify(d), { status });
function storage() { const map = new Map(); return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), removeItem: (k) => map.delete(k) }; }

test('eligibility errors stop before signing or paying', async (t) => {
  assert.equal(typeof client.payEntry, 'function');
  t.mock.method(globalThis, 'fetch', async () => response({ error: 'all 20 entries used' }, 400));
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage() });
  const methods = [];
  const wallet = { p: { request: async ({ method }) => { methods.push(method); return [address]; } } };
  await assert.rejects(client.payEntry(wallet, '/', () => {}), /all 20/);
  assert.deepEqual(methods, ['eth_requestAccounts']);
});

test('payment uses signed UTF-8, official chain add, exact transfer and durable tickets', async (t) => {
  assert.equal(typeof client.payEntry, 'function');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage() });
  const requests = [], progress = [];
  t.mock.method(globalThis, 'fetch', async (url, opts) => {
    if (url.includes('nonce')) return response(nonce);
    assert.equal(opts.headers['Content-Type'], 'application/json');
    const b = JSON.parse(opts.body); assert.deepEqual(b, { tx, signature: 'sig', nonce: 'signed' });
    assert.deepEqual(JSON.parse(localStorage.getItem('sq-ranked-payment')), b);
    return response({ entry: 'ticket', id: 1, week: 0 });
  });
  const wallet = { p: { request: async (r) => {
    requests.push(r);
    if (r.method === 'eth_requestAccounts') return [address];
    if (r.method === 'personal_sign') { assert.deepEqual(r.params, ['0x5369676e20c3a9', address]); return 'sig'; }
    if (r.method === 'wallet_switchEthereumChain' && requests.filter((v) => v.method === r.method).length === 1) throw { code: 4902 };
    if (r.method === 'eth_chainId') return '0xa4b1';
    if (r.method === 'eth_sendTransaction') return tx;
    if (r.method === 'eth_getTransactionReceipt') return { status: '0x1' };
  } } };
  await client.payEntry(wallet, '/', (v) => progress.push(v));
  assert.ok(progress.length >= 6);
  const sent = requests.find((r) => r.method === 'eth_sendTransaction').params[0];
  assert.deepEqual(sent, { from: address, to: token, value: '0x0', data: '0xa9059cbb' + collect.slice(2).padStart(64, '0') + BigInt(nonce.amountWei).toString(16).padStart(64, '0') });
  const add = requests.find((r) => r.method === 'wallet_addEthereumChain').params[0];
  assert.equal(add.chainId, '0xa4b1'); assert.deepEqual(add.rpcUrls, ['https://arb1.arbitrum.io/rpc']);
  assert.deepEqual(JSON.parse(localStorage.getItem('sq-ranked-entries')), [{ entry: 'ticket', id: 1, week: 0, mode: 'normal' }]);
  assert.equal(localStorage.getItem('sq-ranked-payment'), null);
});

test('network failure retains payment; recovery never sends another transaction; refund is final', async (t) => {
  assert.equal(typeof client.recoverPayment, 'function');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage() });
  localStorage.setItem('sq-ranked-payment', JSON.stringify({ tx, signature: 'sig', nonce: 'signed' }));
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('offline'); });
  await assert.rejects(client.recoverPayment('/', () => {}), /offline/);
  assert.ok(localStorage.getItem('sq-ranked-payment'));
  globalThis.fetch = async () => response({ error: 'Your 0.5 DMT will be sent back.', refund: true }, 400);
  await assert.rejects(client.recoverPayment('/', () => {}), /sent back/);
  assert.equal(localStorage.getItem('sq-ranked-payment'), null);
});

test('a confirmed reverted payment recovered after reload releases entry controls', async (t) => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage() });
  localStorage.setItem('sq-ranked-payment', JSON.stringify({ tx, signature: 'sig', nonce: 'signed' }));
  t.mock.method(globalThis, 'fetch', async () => response({ error: 'that payment failed on-chain' }, 400));
  await assert.rejects(client.recoverPayment('/', () => {}), /failed on-chain/);
  assert.equal(localStorage.getItem('sq-ranked-payment'), null);
});

// a wallet stub that pays: records every request
function payingWallet(requests) {
  return { p: { request: async (r) => {
    requests.push(r);
    if (r.method === 'eth_requestAccounts') return [address];
    if (r.method === 'personal_sign') return 'sig';
    if (r.method === 'eth_chainId') return '0xa4b1';
    if (r.method === 'eth_sendTransaction') return tx;
    if (r.method === 'eth_getTransactionReceipt') return { status: '0x1' };
  } } };
}

test('each race pays exactly its own price: 0.5 DMT Normal, 1.5 DMT Hard; any other amount is refused before paying', async (t) => {
  for (const [mode, wei, other] of [['normal', '500000000000000000', '1500000000000000000'], ['hard', '1500000000000000000', '500000000000000000']]) {
    for (const [amountWei, nonceMode, ok] of [[wei, mode, true], [other, mode, false], ['499999999999999999', mode, false], ['1000000000000000000', mode, false], [wei, mode === 'hard' ? 'normal' : 'hard', false]]) {
      Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage() });
      const requests = [], urls = [];
      t.mock.method(globalThis, 'fetch', async (url) => {
        urls.push(url);
        if (url.includes('nonce')) return response({ ...nonce, amountWei, ...(nonceMode === 'normal' ? {} : { mode: nonceMode }) });
        return response({ entry: 'ticket', id: 7, week: 1, mode });
      });
      const run = client.payEntry(payingWallet(requests), '/', () => {}, () => {}, mode);
      if (!ok) {
        await assert.rejects(run, /Invalid entry details/);
        assert.ok(!requests.some((r) => ['personal_sign', 'eth_sendTransaction'].includes(r.method)), `${mode} ${amountWei}: nothing signed or sent`);
        continue;
      }
      await run;
      assert.equal(urls[0].includes('&mode=hard'), mode === 'hard');
      const sent = requests.find((r) => r.method === 'eth_sendTransaction').params[0];
      assert.equal(BigInt('0x' + sent.data.slice(-64)).toString(), wei);
      assert.deepEqual(JSON.parse(localStorage.getItem('sq-ranked-entries')), [{ entry: 'ticket', id: 7, week: 1, mode }]);
    }
  }
  await assert.rejects(client.payEntry(payingWallet([]), '/', () => {}, () => {}, 'nightmare'), /Pick a ranked race/);
});
