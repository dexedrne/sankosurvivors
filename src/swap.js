// Buy DMT with ETH on Arbitrum without leaving the game (owner 3 Nov: "some way to buy DMT through this website").
// Quotes and the swap transaction come from KyberSwap's public aggregator API, which finds the best DMT pool. For safety
// the game itself checks what it is about to send: only to KyberSwap's router, only the quoted ETH, and the DMT must go
// to the player's own address. Nothing passes through us and there is no fee.
import { DMT_TOKEN, current, walletRevision } from './wallet.js';

export const KYBER = 'https://aggregator-api.kyberswap.com/arbitrum/api/v1';
export const KYBER_ROUTER = '0x6131b5fae19ea4f9d964eac0408e4408b66337b5'; // MetaAggregationRouterV2, the same on every chain
export const SLIPPAGE_BPS = 1000; // 10% (owner 3 Nov: the DMT pool is thin), with the minimum rounded down to six decimals
const ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', HEAD = { 'x-client-id': 'sankosurvivors' };
const ARB = { chainId: '0xa4b1' };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Enforce the same downward-rounded six-decimal minimum that the player sees.
const minimumMicros = (s) => (BigInt(s.amountOut) * BigInt(10000 - SLIPPAGE_BPS)) / 10000n / 10n ** 12n;

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
  const minimum = minimumMicros(s);
  return {
    amountIn: String(s.amountIn), ethIn: Number(s.amountIn) / 1e18, dmtOut: Number(BigInt(s.amountOut) / 10n ** 12n) / 1e6,
    minOut: `${minimum / 1000000n}.${(minimum % 1000000n).toString().padStart(6, '0')}`.replace(/\.?0+$/, ''),
    usdIn, usdOut, loss: usdIn > 0 && usdOut > 0 ? Math.max(0, 1 - usdOut / usdIn) : null, summary: s,
  };
}
/** Check a built KyberSwap transaction before the wallet ever sees it. Returns the value to send, or throws.
 *  It decodes the router's swap(SwapExecutionParams) call and checks the swap itself, not just that the address appears
 *  somewhere (a hostile or broken API answer could hide the player's address in free-form bytes and pay someone else):
 *  ETH in, DMT out, the DMT to the player's own wallet, the quoted ETH, at least the quote less the slippage (the router reverts
 *  below that), no fee receivers and no permit. Owner 3 Nov: "security is number one". */
const SWAP_SELECTOR = 'e21fd0e9'; // MetaAggregationRouterV2.swap((address,address,bytes,(address,address,address[],uint256[],address[],uint256[],address,uint256,uint256,uint256,bytes),bytes))
export const MAX_BUY_WEI = 100000000000000000n; // 0.1 ETH a buy: plenty for entries, and caps what a lying price can cost
export function checkBuilt(b, q, address) {
  const bad = () => new Error('The swap could not be prepared. Try again.');
  if (!b || typeof b.data !== 'string' || !/^0x(?:[0-9a-f]{2})+$/i.test(b.data)) throw bad();
  if (String(b.routerAddress || '').toLowerCase() !== KYBER_ROUTER) throw new Error('That swap was not going to KyberSwap: stopped for your safety.');
  if (!/^\d+$/.test(String(b.transactionValue ?? ''))) throw bad();
  const value = BigInt(b.transactionValue);
  if (value !== BigInt(q.amountIn)) throw new Error('The price moved. Get a new quote.');
  if (value <= 0n || value > MAX_BUY_WEI) throw new Error('That buy is bigger than this page allows (0.1 ETH at a time).');
  const h = b.data.slice(2).toLowerCase();
  if (h.slice(0, 8) !== SWAP_SELECTOR) throw new Error('That was not a plain KyberSwap swap: stopped for your safety.');
  const word = (at) => { if (!(at >= 8 && at + 64 <= h.length)) throw bad(); return h.slice(at, at + 64); };
  const num = (at) => BigInt('0x' + word(at)), addr = (at) => { const w = word(at); if (!/^0{24}/.test(w)) throw bad(); return '0x' + w.slice(24); };
  const off = (base, i) => { const o = num(base + i * 64); if (o > BigInt(h.length)) throw bad(); return base + Number(o) * 2; };
  const p = off(8, 0), d = off(p, 3), len = (i) => num(off(d, i)); // desc: src, dst, srcReceivers, srcAmounts, feeReceivers, feeAmounts, dstReceiver, amount, minReturn, flags, permit
  // Partial fills enforce a proportional price, not the absolute DMT minimum shown to the player.
  if (num(d + 9 * 64) & 1n) throw new Error('That swap allowed a partial fill: stopped for your safety.');
  const minOut = minimumMicros(q.summary) * 10n ** 12n;
  if (addr(d) !== ETH.toLowerCase() || addr(d + 64) !== DMT_TOKEN.toLowerCase() || addr(d + 6 * 64) !== address.toLowerCase()
    || num(d + 7 * 64) !== value || num(d + 8 * 64) < minOut || len(4) !== 0n || len(5) !== 0n || len(10) !== 0n)
    throw new Error('That swap did not pay your own wallet: stopped for your safety.');
  return value;
}
/** Swap: switch to Arbitrum, build, check, send, wait for it. wallet: { p } (an EIP-1193 provider). */
export async function buyDmt(wallet, address, q, onStep = () => {}, f = fetch) {
  const p = wallet.p, revision = walletRevision();
  const checkWallet = () => {
    const c = current();
    if (walletRevision() !== revision || !c || c.w.p !== p || c.address.toLowerCase() !== address.toLowerCase()) throw new Error('Wallet changed. Get a new quote before buying.');
  };
  const request = async (args) => {
    try { return await p.request(args); }
    catch (e) { const error = new Error(typeof e?.message === 'string' ? e.message : 'The wallet request failed.'); if (typeof e?.code === 'number') error.code = e.code; throw error; }
  };
  checkWallet();
  onStep('Switch to Arbitrum One in your wallet…');
  try { await request({ method: 'wallet_switchEthereumChain', params: [ARB] }); }
  catch (e) {
    checkWallet();
    if (Number(e.code) !== 4902) throw e;
    await request({ method: 'wallet_addEthereumChain', params: [{ ...ARB, chainName: 'Arbitrum One', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://arb1.arbitrum.io/rpc'], blockExplorerUrls: ['https://arbiscan.io'] }] });
    checkWallet();
    await request({ method: 'wallet_switchEthereumChain', params: [ARB] });
  }
  checkWallet();
  if (String(await request({ method: 'eth_chainId' })).toLowerCase() !== ARB.chainId) throw new Error('Switch to Arbitrum One first.');
  checkWallet();
  onStep('Preparing the swap…');
  let d = {}, ok = false;
  try {
    const r = await f(`${KYBER}/route/build`, { method: 'POST', headers: { ...HEAD, 'Content-Type': 'application/json' },
      body: JSON.stringify({ routeSummary: q.summary, sender: address, recipient: address, slippageTolerance: SLIPPAGE_BPS, deadline: Math.floor(Date.now() / 1000) + 1200, source: 'sankosurvivors' }) });
    ok = r.ok; d = await r.json();
  } catch { /* below */ }
  checkWallet();
  if (!ok || d.code !== 0) throw new Error('The swap could not be prepared. Get a new quote.');
  const value = checkBuilt(d.data, q, address);
  onStep(`Confirm the swap in your wallet: ${q.ethIn.toFixed(5)} ETH for at least ${q.minOut} DMT…`);
  const accounts = await request({ method: 'eth_accounts' });
  checkWallet();
  if (!Array.isArray(accounts) || typeof accounts[0] !== 'string' || accounts[0].toLowerCase() !== address.toLowerCase()) throw new Error('Wallet changed. Get a new quote before buying.');
  if (String(await request({ method: 'eth_chainId' })).toLowerCase() !== ARB.chainId) throw new Error('Switch to Arbitrum One first.');
  checkWallet();
  let tx, reverted = false;
  try {
    const result = await p.request({ method: 'eth_sendTransaction', params: [{ from: address, to: KYBER_ROUTER, chainId: ARB.chainId, data: d.data.data, value: '0x' + value.toString(16) }] });
    if (typeof result !== 'string' || !/^0x[\da-f]{64}$/i.test(result)) throw new Error('The wallet did not return a usable transaction hash.');
    tx = result;
    onStep('Swap sent. Waiting for Arbitrum…');
    const until = Date.now() + 120000;
    while (Date.now() < until) {
      const receipt = await p.request({ method: 'eth_getTransactionReceipt', params: [tx] });
      if (receipt) {
        const quantity = (v) => typeof v === 'string' && /^0x(?:0|[1-9a-f][\da-f]*)$/i.test(v);
        if (typeof receipt.transactionHash !== 'string' || receipt.transactionHash.toLowerCase() !== tx.toLowerCase()
          || typeof receipt.from !== 'string' || receipt.from.toLowerCase() !== address.toLowerCase()
          || typeof receipt.to !== 'string' || receipt.to.toLowerCase() !== KYBER_ROUTER
          || typeof receipt.blockHash !== 'string' || !/^0x[\da-f]{64}$/i.test(receipt.blockHash)
          || !quantity(receipt.blockNumber) || !quantity(receipt.transactionIndex) || !['0x0', '0x1'].includes(receipt.status)) throw new Error('The swap receipt could not be confirmed.');
        if (receipt.status === '0x0') { reverted = true; throw new Error('The swap did not go through. Your ETH was not spent, only a little gas.'); }
        return { tx };
      }
      await wait(2000);
    }
    throw new Error('Still waiting for Arbitrum.');
  } catch (e) {
    if (!tx && Number(e?.code) === 4001) throw Object.assign(new Error('Cancelled in your wallet.'), { code: 4001 });
    const error = new Error(reverted ? 'The swap did not go through. Your ETH was not spent, only a little gas.' : 'Swap outcome is not confirmed. Check your wallet activity before buying again.');
    if (tx) error.tx = tx;
    error.uncertain = !reverted;
    throw error;
  }
}
