import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { quoteDmt, checkBuilt, buyDmt, KYBER_ROUTER, SLIPPAGE_BPS } from '../src/swap.js';
import { rankedSim } from '../src/ranked.js';
import { createSim } from '../src/sim.js';
import { MAP_BY_ID } from '../src/content.js';

const me = '0x1111111111111111111111111111111111111111';
const fakeKyber = (outPerEthWei) => async (url) => {
  const amountIn = BigInt(new URL(url).searchParams.get('amountIn'));
  return new Response(JSON.stringify({ code: 0, data: { routeSummary: { amountIn: String(amountIn), amountOut: String(amountIn * outPerEthWei), amountInUsd: '10', amountOutUsd: '9.9' } } }), { status: 200 });
};
test('buy DMT: a quote for the amount asked, with the slippage floor and the loss shown', async () => {
  const q = await quoteDmt(2.5, fakeKyber(1800n)); // 1 ETH buys 1800 DMT
  assert.ok(q.dmtOut >= 2.5 && q.dmtOut < 2.6, String(q.dmtOut)); // asks 2% over, so the pool moving still leaves enough
  assert.equal(q.minOut, Math.floor(q.dmtOut * (10000 - SLIPPAGE_BPS) / 100) / 100 >= 0 ? q.minOut : 0);
  assert.ok(q.minOut < q.dmtOut && q.minOut > q.dmtOut * 0.89); // 10% slippage (owner 3 Nov: the DMT pool is thin)
  assert.ok(Math.abs(q.loss - 0.01) < 1e-9);
  await assert.rejects(quoteDmt(0, fakeKyber(1n)), /Pick an amount/);
  await assert.rejects(quoteDmt(1, async () => new Response('{"code":4008}', { status: 400 })), /No DMT price/);
});
// a real build answer from KyberSwap's API (3 Nov 2026), then the same with one field of the swap changed
const real = JSON.parse(readFileSync(new URL('./fixtures/kyber-build.json', import.meta.url), 'utf8'));
const W = (hex, at) => hex.slice(at, at + 64), put = (hex, at, w) => hex.slice(0, at) + w + hex.slice(at + 64);
const descAt = (hex) => { const p = 8 + Number(BigInt('0x' + W(hex, 8))) * 2; return p + Number(BigInt('0x' + W(hex, p + 3 * 64))) * 2; };
test('buy DMT: the game decodes the swap and refuses one that pays anyone else, gives less, or is not KyberSwap', () => {
  const q = { amountIn: real.summary.amountIn, summary: real.summary }, b = real.build, h = b.data.slice(2), d = descAt(h);
  assert.equal(checkBuilt(b, q, me), BigInt(q.amountIn));
  const partial = { ...b, data: '0x' + put(h, d + 9 * 64, (BigInt('0x' + W(h, d + 9 * 64)) | 1n).toString(16).padStart(64, '0')) };
  assert.throws(() => checkBuilt(partial, q, me), /partial fill/i, 'a partial fill does not enforce the displayed absolute DMT minimum');
  const thief = '000000000000000000000000' + '2'.repeat(40);
  const swapped = (at, w) => ({ ...b, data: '0x' + put(h, at, w) });
  assert.throws(() => checkBuilt(swapped(d + 6 * 64, thief), q, me), /did not pay your own wallet/, 'DMT to someone else');
  assert.throws(() => checkBuilt(swapped(d + 8 * 64, '0'.repeat(63) + '1'), q, me), /did not pay your own wallet/, 'a 1 wei minimum');
  assert.throws(() => checkBuilt(swapped(d + 64, thief), q, me), /did not pay your own wallet/, 'another token out');
  // the old check passed any data with the address anywhere in it
  assert.throws(() => checkBuilt({ ...b, data: '0x' + SWAP + '0'.repeat(24) + me.slice(2) }, q, me), /could not be prepared|did not pay/);
  assert.throws(() => checkBuilt({ ...b, data: '0x1234' + me.slice(2) + 'ff' }, q, me), /not a plain KyberSwap swap/);
  assert.throws(() => checkBuilt({ ...b, routerAddress: '0x' + '9'.repeat(40) }, q, me), /not going to KyberSwap/);
  assert.throws(() => checkBuilt({ ...b, transactionValue: String(BigInt(q.amountIn) + 1n) }, q, me), /price moved/);
  assert.throws(() => checkBuilt({ ...b, transactionValue: '200000000000000000' }, { ...q, amountIn: '200000000000000000' }, me), /bigger than this page allows/);
  assert.throws(() => checkBuilt({ ...b, data: 'nope' }, q, me), /could not be prepared/);
  assert.throws(() => checkBuilt({ ...b, data: b.data.slice(0, 600) }, q, me), /could not be prepared/, 'cut short');
  assert.throws(() => checkBuilt(null, q, me), /could not be prepared/);
  assert.equal(checkBuilt(b, q, me.toUpperCase().replace('0X', '0x')), BigInt(q.amountIn), 'any letter case of the address');
});
const SWAP = 'e21fd0e9';
test('buy DMT refuses a chain switch while its build is pending', async () => {
  let chain = '0xa4b1', sends = 0;
  const wallet = { p: { request: async ({ method }) => {
    if (method === 'eth_chainId') return chain;
    if (method === 'eth_sendTransaction') { sends++; return 'fixture-tx'; }
    if (method === 'eth_getTransactionReceipt') return { status: '0x1' };
  } } };
  const q = { amountIn: real.summary.amountIn, summary: real.summary, ethIn: Number(real.summary.amountIn) / 1e18, minOut: 1 };
  await assert.rejects(buyDmt(wallet, me, q, () => {}, async () => {
    chain = '0x1';
    return new Response(JSON.stringify({ code: 0, data: real.build }));
  }), /Arbitrum|chain/i);
  assert.equal(sends, 0);
});

test('buy DMT binds the wallet transaction to Arbitrum', async () => {
  let sent;
  const wallet = { p: { request: async ({ method, params }) => {
    if (method === 'eth_chainId') return '0xa4b1';
    if (method === 'eth_sendTransaction') { sent = params[0]; return 'fixture-tx'; }
    if (method === 'eth_getTransactionReceipt') return { status: '0x1' };
  } } };
  const q = { amountIn: real.summary.amountIn, summary: real.summary, ethIn: Number(real.summary.amountIn) / 1e18, minOut: 1 };
  await buyDmt(wallet, me, q, () => {}, async () => new Response(JSON.stringify({ code: 0, data: real.build })));
  assert.equal(sent.chainId, '0xa4b1');
});
test('the crowd: casual runs on the denser pace; ranked week 0 keeps the pace it started on, week 1 the new one', () => {
  assert.equal(createSim({ seed: 1, map: MAP_BY_ID.greentown }).pace, 2);
  const base = { seed: 3, mapId: 'apache', adv: 'adventurer', ground: null };
  assert.equal(rankedSim({ ...base, week: 0 }).pace, 1);
  assert.equal(rankedSim({ ...base, week: 1 }).pace, 2);
});
