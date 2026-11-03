// Buy DMT with ETH on Arbitrum without leaving the game (owner 3 Nov: "some way to buy DMT through this website").
// Quotes and the swap transaction come from KyberSwap's public aggregator API, which finds the best DMT pool. For safety
// the game itself checks what it is about to send: only to KyberSwap's router, only the quoted ETH, and the DMT must go
// to the player's own address. Nothing passes through us and there is no fee.
import { DMT_TOKEN } from './wallet.js';

export const KYBER = 'https://aggregator-api.kyberswap.com/arbitrum/api/v1';
export const KYBER_ROUTER = '0x6131b5fae19ea4f9d964eac0408e4408b66337b5'; // MetaAggregationRouterV2, the same on every chain
export const SLIPPAGE_BPS = 100; // 1%: the swap fails rather than give less than 99% of the quote
const ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', HEAD = { 'x-client-id': 'sankosurvivors' };
const ARB = { chainId: '0xa4b1' };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function route(amountInWei, f = fetch) {
  let d = {}, ok = false;
  try { const r = await f(`${KYBER}/routes?tokenIn=${ETH}&tokenOut=${DMT_TOKEN}&amountIn=${amountInWei}`, { headers: HEAD }); ok = r.ok; d = await r.json(); } catch { /* below */ }
  const s = d && d.data && d.data.routeSummary;
  if (!ok || d.code !== 0 || !s || !/^\d+$/.test(String(s.amountOut)) || !/^\d+$/.test(String(s.amountIn)) || BigInt(s.amountOut) <= 0n) throw new Error('No DMT price right now. Try again in a minute.');
  return s;
}
/** A quote for about `dmt` DMT: what it costs in ETH, what you get, and how much is lost to the pool's price and fees. */
export async function quoteDmt(dmt, f = fetch) {
  if (!(dmt > 0 && dmt <= 1000)) throw new Error('Pick an amount of DMT.');
  const probe = 2000000000000000n; // 0.002 ETH, to read the price first
  const s0 = await route(probe.toString(), f);
  const want = BigInt(Math.round(dmt * 1e6)) * 10n ** 12n; // DMT in wei (18 decimals)
  // ETH for that much at the probe's price, plus 2% for the pool moving on a bigger buy
  const amountIn = (want * probe * 102n) / (BigInt(s0.amountOut) * 100n) + 1n;
  const s = await route(amountIn.toString(), f);
  const usdIn = Number(s.amountInUsd) || 0, usdOut = Number(s.amountOutUsd) || 0;
  return {
    amountIn: String(s.amountIn), ethIn: Number(s.amountIn) / 1e18, dmtOut: Number(BigInt(s.amountOut) / 10n ** 12n) / 1e6,
    minOut: Number((BigInt(s.amountOut) * BigInt(10000 - SLIPPAGE_BPS)) / 10000n / 10n ** 12n) / 1e6,
    usdIn, usdOut, loss: usdIn > 0 && usdOut > 0 ? Math.max(0, 1 - usdOut / usdIn) : null, summary: s,
  };
}
/** Check a built KyberSwap transaction before the wallet ever sees it. Returns the value to send, or throws. */
export function checkBuilt(b, q, address) {
  if (!b || typeof b.data !== 'string' || !/^0x[0-9a-f]+$/i.test(b.data)) throw new Error('The swap could not be prepared. Try again.');
  if (String(b.routerAddress || '').toLowerCase() !== KYBER_ROUTER) throw new Error('That swap was not going to KyberSwap: stopped for your safety.');
  const value = BigInt(b.transactionValue ?? b.amountIn ?? -1);
  if (value !== BigInt(q.amountIn)) throw new Error('The price moved. Get a new quote.');
  if (!b.data.toLowerCase().includes(address.slice(2).toLowerCase())) throw new Error('That swap did not pay your own wallet: stopped for your safety.');
  return value;
}
/** Swap: switch to Arbitrum, build, check, send, wait for it. wallet: { p } (an EIP-1193 provider). */
export async function buyDmt(wallet, address, q, onStep = () => {}, f = fetch) {
  const p = wallet.p;
  onStep('Switch to Arbitrum One in your wallet…');
  try { await p.request({ method: 'wallet_switchEthereumChain', params: [ARB] }); }
  catch (e) {
    if (Number(e.code) !== 4902) throw e;
    await p.request({ method: 'wallet_addEthereumChain', params: [{ ...ARB, chainName: 'Arbitrum One', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://arb1.arbitrum.io/rpc'], blockExplorerUrls: ['https://arbiscan.io'] }] });
    await p.request({ method: 'wallet_switchEthereumChain', params: [ARB] });
  }
  if (String(await p.request({ method: 'eth_chainId' })).toLowerCase() !== ARB.chainId) throw new Error('Switch to Arbitrum One first.');
  onStep('Preparing the swap…');
  let d = {}, ok = false;
  try {
    const r = await f(`${KYBER}/route/build`, { method: 'POST', headers: { ...HEAD, 'Content-Type': 'application/json' },
      body: JSON.stringify({ routeSummary: q.summary, sender: address, recipient: address, slippageTolerance: SLIPPAGE_BPS, deadline: Math.floor(Date.now() / 1000) + 1200, source: 'sankosurvivors' }) });
    ok = r.ok; d = await r.json();
  } catch { /* below */ }
  if (!ok || d.code !== 0) throw new Error('The swap could not be prepared. Get a new quote.');
  const value = checkBuilt(d.data, q, address);
  onStep(`Confirm the swap in your wallet: ${q.ethIn.toFixed(5)} ETH for at least ${q.minOut} DMT…`);
  const tx = await p.request({ method: 'eth_sendTransaction', params: [{ from: address, to: KYBER_ROUTER, data: d.data.data, value: '0x' + value.toString(16) }] });
  onStep('Swap sent. Waiting for Arbitrum…');
  const until = Date.now() + 120000;
  while (Date.now() < until) {
    const receipt = await p.request({ method: 'eth_getTransactionReceipt', params: [tx] });
    if (receipt) { if (receipt.status !== '0x1') throw Object.assign(new Error('The swap did not go through (the price moved past 1%). Your ETH was not spent, only a little gas.'), { tx }); return { tx }; }
    await wait(2000);
  }
  throw Object.assign(new Error('Still waiting for Arbitrum. Your DMT will show up when it lands.'), { tx });
}
