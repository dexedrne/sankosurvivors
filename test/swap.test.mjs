import test from 'node:test';
import assert from 'node:assert/strict';
import { quoteDmt, checkBuilt, KYBER_ROUTER, SLIPPAGE_BPS } from '../src/swap.js';
import { rankedSim } from '../src/ranked.js';
import { createSim } from '../src/sim.js';
import { MAP_BY_ID } from '../src/content.js';

const me = '0x1111111111111111111111111111111111111111';
const fakeKyber = (outPerEthWei) => async (url) => {
  const amountIn = BigInt(new URL(url).searchParams.get('amountIn'));
  return new Response(JSON.stringify({ code: 0, data: { routeSummary: { amountIn: String(amountIn), amountOut: String(amountIn * outPerEthWei), amountInUsd: '10', amountOutUsd: '9.9' } } }), { status: 200 });
};
test('buy DMT: a quote for the amount asked, with the 1% floor and the loss shown', async () => {
  const q = await quoteDmt(2.5, fakeKyber(1800n)); // 1 ETH buys 1800 DMT
  assert.ok(q.dmtOut >= 2.5 && q.dmtOut < 2.6, String(q.dmtOut)); // asks 2% over, so the pool moving still leaves enough
  assert.equal(q.minOut, Math.floor(q.dmtOut * (10000 - SLIPPAGE_BPS) / 100) / 100 >= 0 ? q.minOut : 0);
  assert.ok(q.minOut < q.dmtOut && q.minOut > q.dmtOut * 0.98);
  assert.ok(Math.abs(q.loss - 0.01) < 1e-9);
  await assert.rejects(quoteDmt(0, fakeKyber(1n)), /Pick an amount/);
  await assert.rejects(quoteDmt(1, async () => new Response('{"code":4008}', { status: 400 })), /No DMT price/);
});
test('buy DMT: the game refuses a built swap that is not KyberSwap, not the quoted ETH, or not paying the player', () => {
  const q = { amountIn: '1354933835528732' }, data = '0x1234' + me.slice(2) + 'ff';
  assert.equal(checkBuilt({ routerAddress: KYBER_ROUTER, transactionValue: q.amountIn, data }, q, me), 1354933835528732n);
  assert.throws(() => checkBuilt({ routerAddress: '0x' + '9'.repeat(40), transactionValue: q.amountIn, data }, q, me), /not going to KyberSwap/);
  assert.throws(() => checkBuilt({ routerAddress: KYBER_ROUTER, transactionValue: '1354933835528733', data }, q, me), /price moved/);
  assert.throws(() => checkBuilt({ routerAddress: KYBER_ROUTER, transactionValue: q.amountIn, data: '0x1234' + '2'.repeat(40) }, q, me), /did not pay your own wallet/);
  assert.throws(() => checkBuilt({ routerAddress: KYBER_ROUTER, transactionValue: q.amountIn, data: 'nope' }, q, me), /could not be prepared/);
  assert.throws(() => checkBuilt(null, q, me), /could not be prepared/);
});
test('the crowd: casual runs on the denser pace; ranked week 0 keeps the pace it started on, week 1 the new one', () => {
  assert.equal(createSim({ seed: 1, map: MAP_BY_ID.greentown }).pace, 2);
  const base = { seed: 3, mapId: 'apache', adv: 'adventurer', ground: null };
  assert.equal(rankedSim({ ...base, week: 0 }).pace, 1);
  assert.equal(rankedSim({ ...base, week: 1 }).pace, 2);
});
