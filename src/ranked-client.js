import {entryForWeek,entryMessage} from './ranked-entry-price.js';
import { hex } from './dmt.js';
// where entry fees go, fixed here so a tampered server answer can never redirect a payment (security pass, 3 Nov)
const ENTRY_WALLET = '0xa1e6e6ee71300c238935b7d59c8983b06e991be0', DMT_CONTRACT = '0x8b0e6f19ee57089f7649a455d89d7bc6314d04e8';
import { RANKED, raceForWeek } from './ranked.js';
import { clockPolicy } from './ranked-clock.js';
const PAYMENT = 'sq-ranked-payment', ENTRIES = 'sq-ranked-entries';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pendingMemory = new WeakMap();
let lastStorage;
const parse = raw => { try { return JSON.parse(raw); } catch { return null; } };
const plain = message => Object.assign(new Error(message), { plain:true });
function paymentStorage() { try { return lastStorage = globalThis.localStorage; } catch { return lastStorage; } }
export const readRanked = (key, fallback = null) => {
  const store = paymentStorage();
  if (key === PAYMENT) {
    const memory = store && pendingMemory.get(store); if (memory) return memory;
    try { const backup = parse(sessionStorage.getItem(PAYMENT)); if (backup) return backup; } catch {}
  }
  try { return JSON.parse(store.getItem(key)) ?? fallback; } catch { return fallback; }
};
// Paid tickets and runs must not silently disappear when storage is unavailable.
export function writeRanked(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
const samePayment = (a, b) => a && b && a.nonce === b.nonce && a.signature === b.signature && (!a.tx || !b.tx || a.tx === b.tx);
function forgetPayment(payment) {
  const store = paymentStorage();
  for (const storage of [store, (() => { try { return sessionStorage; } catch { return null; } })()]) {
    try { if (samePayment(parse(storage.getItem(PAYMENT)), payment)) storage.removeItem(PAYMENT); } catch {}
  }
  if (store && samePayment(pendingMemory.get(store), payment)) pendingMemory.delete(store);
}
function keepPayment(payment, required = false) {
  const store = paymentStorage(), encoded = JSON.stringify(payment); let saved = 0;
  if (store) pendingMemory.set(store, payment);
  for (const storage of [store, (() => { try { return sessionStorage; } catch { return null; } })()]) {
    try {
      const existing = parse(storage.getItem(PAYMENT));
      if (existing && !samePayment(existing, payment)) continue;
      storage.setItem(PAYMENT, encoded); if (storage.getItem(PAYMENT) === encoded) saved++;
    } catch {}
  }
  if (required && saved !== 2) {
    forgetPayment(payment);
    throw plain('Payment recovery could not be saved on this device. No payment was requested.');
  }
}
function paymentLock(action) {
  if (!globalThis.navigator?.locks?.request) throw plain('Ranked payments are unavailable in this browser. Update your browser and try again.');
  return navigator.locks.request('sqs-ranked-payment', { ifAvailable:true }, lock => {
    if (!lock) throw plain('A payment is in progress in another tab. Finish checking it there first.');
    return action();
  });
}

export async function rankedApi(base, route, body) {
  const r = await fetch(`${base}api/ranked-${route}`, body === undefined ? {cache:'no-store'} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await r.json();
  if (!r.ok || d.error) throw Object.assign(new Error(d.error || 'The ranked server could not answer.'), { status: r.status, refund: d.refund, retry: d.retry, update: d.update, plain: d.update === true });
  return d;
}

export async function requireRankedBuild(base, client) {
  const unavailable = () => Object.assign(plain('Could not verify the latest game version. Reconnect and try again before entering ranked.'), {status:503});
  let current;
  try {
    const r = await fetch(`${base}api/ranked-version`, {cache:'no-store', signal:AbortSignal.timeout(10000)});
    current = await r.json();
    if (!r.ok || !current || typeof current.build !== 'string' || !/^[A-Za-z0-9+._-]{1,80}$/.test(current.build) || current.build === 'dev' || typeof current.sim !== 'string' || !/^[0-9a-f]{12}$/.test(current.sim)) throw unavailable();
  } catch { throw unavailable(); }
  if (!client || client.build !== current.build || client.sim !== current.sim) throw Object.assign(plain('Update the game before entering or starting ranked. Your saved payments and runs are kept.'), {status:409, update:true});
}

async function recoverExact(base, onStep, payment, candidate = false) {
  onStep('Checking your saved payment. No new payment is needed…');
  for (let i = 0; ; i++) {
    try {
      const d = await rankedApi(base, 'enter', { tx:payment.tx, signature:payment.signature, nonce:payment.nonce });
      if (!Number.isSafeInteger(d.id) || d.id < 1 || typeof d.entry !== 'string' || !d.entry || !Number.isInteger(d.week) || d.week < 0 || !['normal','hard'].includes(d.mode ?? 'normal')) throw plain('The ranked server did not return a usable entry. Your payment is saved. Use Check payment; do not pay again.');
      const entries = readRanked(ENTRIES, []);
      if (!entries.some(e => e.id === d.id)) entries.push({ entry:d.entry, id:d.id, week:d.week, mode:d.mode === 'hard' ? 'hard' : 'normal' });
      try { writeRanked(ENTRIES, entries); }
      catch { throw plain('Your payment is registered, but the entry could not be saved here. Keep this page open and use Check payment. Do not pay again.'); }
      forgetPayment(payment);
      onStep('Entry ready. Pick an adventurer and start when ready.');
      return d;
    } catch (e) {
      if (!candidate && (e.refund || (e.status === 400 && /payment failed on-chain/i.test(e.message)))) forgetPayment(payment);
      if (!e.retry || i >= 4) throw e;
      onStep('Waiting for the server to see your Arbitrum payment…');
      await wait(3000);
    }
  }
}
export async function recoverPayment(base, onStep, transactionHash) {
  return paymentLock(async () => {
    const payment = readRanked(PAYMENT); if (!payment) return;
    if (!payment.tx) {
      if (!/^0x[0-9a-f]{64}$/i.test(transactionHash || '')) throw plain('Check your wallet activity. If the payment was sent, paste its Arbitrum transaction hash to recover it. Do not pay again.');
      // A pasted hash can be unrelated; keep the original reservation until an entry is safely saved.
      return recoverExact(base, onStep, { tx:transactionHash.toLowerCase(), signature:payment.signature, nonce:payment.nonce }, true);
    }
    return recoverExact(base, onStep, payment);
  });
}
export async function clearUnsentPayment() {
  return paymentLock(() => {
    const payment = readRanked(PAYMENT); if (!payment) return;
    if (payment.tx) throw plain('Check your saved payment before entering again.');
    forgetPayment(payment);
  });
}

// onTx(hash) hears about the payment as soon as the wallet sends it (for an Arbiscan link while it confirms).
// The wallet is only ever asked for the selected week's exact race price.
export async function payEntry(wallet, base, onStep, onTx = () => {}, mode = 'normal', expectedWeek, client, tier = 'standard') {
  if (!['standard','high'].includes(tier) || !Object.hasOwn(RANKED.races, mode)) throw new Error('Pick a ranked race first.');
  return paymentLock(async () => {
    if (readRanked(PAYMENT)) throw plain('Check your saved payment before entering again.');
    writeRanked(ENTRIES, readRanked(ENTRIES, []));
    await requireRankedBuild(base, client);
    const p = wallet.p;
    onStep('Approve the connection in your wallet…');
    const [address] = await p.request({ method:'eth_requestAccounts' });
    if (!/^0x[\da-f]{40}$/i.test(address || '')) throw new Error('No account was shared.');
    onStep('Checking your entries for this week…');
    const n = await rankedApi(base, `nonce?wallet=${encodeURIComponent(address)}${tier==='high'?'&tier=high':''}${mode === 'normal' ? '' : `&mode=${mode}`}&build=${encodeURIComponent(client.build)}&sim=${encodeURIComponent(client.sim)}${Number.isSafeInteger(client.deadline) ? `&deadline=${client.deadline}` : ''}`);
    const race = entryForWeek(n.week, mode,tier);
    if (!race || (n.tier??'standard')!==tier || tier==='high'&&n.message!==entryMessage(n.nonce,n.week,mode,n.clockVersion===1?n.deadline:undefined,tier) || !Number.isSafeInteger(n.week) || n.week < 0 || (expectedWeek !== undefined && n.week !== expectedWeek) || !n.message || !n.nonce || n.chainId !== 42161 || String(n.dmt).toLowerCase() !== DMT_CONTRACT || String(n.collect).toLowerCase() !== ENTRY_WALLET || n.amountWei !== race.entryWei || (n.mode ?? 'normal') !== mode) throw new Error('Invalid entry details. No payment was requested.');
    if (n.clockVersion === 1 && (client.deadline !== n.deadline || !Number.isSafeInteger(n.deadline) || !Number.isFinite(n.serverNow) || clockPolicy(n.week, n.serverNow).deadline !== n.deadline || !clockPolicy(n.week, n.serverNow).admissionOpen)) throw plain('Read and acknowledge the weekly cutoff before paying or starting.');
    onStep('Switch to Arbitrum One in your wallet…');
    const chain = { chainId:'0xa4b1' };
    try { await p.request({ method:'wallet_switchEthereumChain', params:[chain] }); }
    catch (e) {
      if (Number(e.code) !== 4902) throw e;
      await p.request({ method:'wallet_addEthereumChain', params:[{ ...chain, chainName:'Arbitrum One', nativeCurrency:{ name:'Ether', symbol:'ETH', decimals:18 }, rpcUrls:['https://arb1.arbitrum.io/rpc'], blockExplorerUrls:['https://arbiscan.io'] }] });
      await p.request({ method:'wallet_switchEthereumChain', params:[chain] });
    }
    if (String(await p.request({ method:'eth_chainId' })).toLowerCase() !== chain.chainId) throw new Error('Switch to Arbitrum One before paying.');
    onStep('Sign the message in your wallet (free)…');
    const signature = await p.request({ method:'personal_sign', params:[hex(n.message), address] });
    await requireRankedBuild(base, client);
    if (String(await p.request({ method:'eth_chainId' })).toLowerCase() !== chain.chainId) throw new Error('Switch to Arbitrum One before paying.');
    if (n.clockVersion === 1) {
      const current = await rankedApi(base, 'week');
      if (!current.open || current.week !== n.week || !Number.isFinite(current.serverNow) || current.endsAt !== n.deadline || !clockPolicy(n.week, current.serverNow).admissionOpen) throw plain('Ranked starts are closed until the weekly reset. Your saved payments are kept.');
    }
    // Reserve more room than the final record in both stores BEFORE asking the wallet to broadcast.
    const reserved = { tx:null, signature, nonce:n.nonce, reserve:'0'.repeat(66) };
    keepPayment(reserved, true);
    onStep(`Approve the ${race.entryDmt} DMT ${race.name} entry in your wallet. Arbitrum gas is paid in ETH…`);
    const data = '0xa9059cbb' + ENTRY_WALLET.slice(2).padStart(64, '0') + BigInt(n.amountWei).toString(16).padStart(64, '0');
    let tx;
    try { tx = await p.request({ method:'eth_sendTransaction', params:[{ from:address, to:DMT_CONTRACT, data, value:'0x0', chainId:chain.chainId }] }); }
    catch (e) {
      if (Number(e.code) === 4001) { forgetPayment(reserved); throw e; }
      throw plain('Your wallet did not confirm whether it sent the payment. Check wallet activity before trying again.');
    }
    if (!/^0x[0-9a-f]{64}$/i.test(tx || '')) throw plain('Your wallet did not return a transaction hash. Check wallet activity before trying again.');
    const payment = { tx:tx.toLowerCase(), signature, nonce:n.nonce };
    const store = paymentStorage(); if (store) pendingMemory.set(store, payment);
    try { onTx(payment.tx); } catch { /* display only */ }
    keepPayment(payment);
    onStep('Payment sent. Waiting for its Arbitrum receipt…');
    // The server independently verifies the receipt; a stalled wallet receipt RPC cannot strand recovery.
    return recoverExact(base, onStep, payment);
  });
}
