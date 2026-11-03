import { hex } from './dmt.js';
// where entry fees go, fixed here so a tampered server answer can never redirect a payment (security pass, 3 Nov)
const ENTRY_WALLET = '0xa1e6e6ee71300c238935b7d59c8983b06e991be0', DMT_CONTRACT = '0x8b0e6f19ee57089f7649a455d89d7bc6314d04e8';
import { RANKED } from './ranked.js';
const PAYMENT = 'sq-ranked-payment', ENTRIES = 'sq-ranked-entries';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const readRanked = (key, fallback = null) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
// Paid tickets and runs must not silently disappear when storage is unavailable.
export function writeRanked(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

export async function rankedApi(base, route, body) {
  const r = await fetch(`${base}api/ranked-${route}`, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await r.json();
  if (!r.ok || d.error) throw Object.assign(new Error(d.error || 'The ranked server could not answer.'), { status: r.status, refund: d.refund, retry: d.retry });
  return d;
}

export async function recoverPayment(base, onStep) {
  const payment = readRanked(PAYMENT);
  if (!payment) return;
  onStep('Checking your saved payment. No new payment is needed…');
  for (let i = 0; ; i++) {
    try {
      const d = await rankedApi(base, 'enter', payment);
      const entries = readRanked(ENTRIES, []);
      if (!entries.some((e) => e.id === d.id)) entries.push({ entry: d.entry, id: d.id, week: d.week, mode: d.mode === 'hard' ? 'hard' : 'normal' });
      writeRanked(ENTRIES, entries);
      localStorage.removeItem(PAYMENT);
      onStep('Entry ready. Pick an adventurer and start when ready.');
      return d;
    } catch (e) {
      if (e.refund || (e.status === 400 && /payment failed on-chain/i.test(e.message))) localStorage.removeItem(PAYMENT);
      if (!e.retry || i >= 4) throw e;
      onStep('Waiting for the server to see your Arbitrum payment…');
      await wait(3000);
    }
  }
}

// onTx(hash) hears about the payment as soon as the wallet sends it (for an Arbiscan link while it confirms).
// mode: the race, 'normal' (0.5 DMT) or 'hard' (1.5 DMT). The wallet is only ever asked for that race's exact price.
export async function payEntry(wallet, base, onStep, onTx = () => {}, mode = 'normal') {
  const race = Object.hasOwn(RANKED.races, mode) ? RANKED.races[mode] : null;
  if (!race) throw new Error('Pick a ranked race first.');
  if (readRanked(PAYMENT)) throw new Error('Check your saved payment before entering again.');
  // Check persistence before asking for any money.
  writeRanked(ENTRIES, readRanked(ENTRIES, []));
  const p = wallet.p;
  onStep('Approve the connection in your wallet…');
  const [address] = await p.request({ method: 'eth_requestAccounts' });
  if (!/^0x[\da-f]{40}$/i.test(address || '')) throw new Error('No account was shared.');
  onStep('Checking your entries for this week…');
  const n = await rankedApi(base, `nonce?wallet=${encodeURIComponent(address)}${mode === 'normal' ? '' : `&mode=${mode}`}`);
  if (!n.message || !n.nonce || n.chainId !== 42161 || String(n.dmt).toLowerCase() !== DMT_CONTRACT || String(n.collect).toLowerCase() !== ENTRY_WALLET || n.amountWei !== race.entryWei || (n.mode ?? 'normal') !== mode) throw new Error('Invalid entry details. No payment was requested.');
  onStep('Switch to Arbitrum One in your wallet…');
  const chain = { chainId: '0xa4b1' };
  try { await p.request({ method: 'wallet_switchEthereumChain', params: [chain] }); }
  catch (e) {
    if (Number(e.code) !== 4902) throw e;
    // https://docs.arbitrum.io/chain-info
    await p.request({ method: 'wallet_addEthereumChain', params: [{ ...chain, chainName: 'Arbitrum One', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://arb1.arbitrum.io/rpc'], blockExplorerUrls: ['https://arbiscan.io'] }] });
    await p.request({ method: 'wallet_switchEthereumChain', params: [chain] });
  }
  if (String(await p.request({ method: 'eth_chainId' })).toLowerCase() !== chain.chainId) throw new Error('Switch to Arbitrum One before paying.');
  onStep('Sign the message in your wallet (free)…');
  const signature = await p.request({ method: 'personal_sign', params: [hex(n.message), address] });
  onStep(`Approve the ${race.entryDmt} DMT ${race.name} entry in your wallet. Arbitrum gas is paid in ETH…`);
  const data = '0xa9059cbb' + ENTRY_WALLET.slice(2).padStart(64, '0') + BigInt(n.amountWei).toString(16).padStart(64, '0');
  const tx = await p.request({ method: 'eth_sendTransaction', params: [{ from: address, to: DMT_CONTRACT, data, value: '0x0' }] });
  writeRanked(PAYMENT, { tx, signature, nonce: n.nonce });
  try { onTx(tx); } catch { /* display only */ }
  onStep('Payment sent. Waiting for its Arbitrum receipt…');
  const until = Date.now() + 120000;
  while (Date.now() < until) {
    const receipt = await p.request({ method: 'eth_getTransactionReceipt', params: [tx] });
    if (receipt) {
      if (receipt.status !== '0x1') { localStorage.removeItem(PAYMENT); throw new Error('That payment failed on-chain.'); }
      return recoverPayment(base, onStep);
    }
    await wait(2000);
  }
  throw new Error('Still waiting for the payment. Tap Check payment to try again without paying again.');
}
