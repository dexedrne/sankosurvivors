// One wallet for the whole site. You pick it once (Rabby, MetaMask: every wallet extension announces itself, EIP-6963);
// the next visit it reconnects by itself without a prompt (eth_accounts), and DMT perks and ranked entries both use it.
// Balances are read straight from Arbitrum's public RPCs. Nothing here signs or sends anything.
import { wallets } from './dmt.js';

const KEY = 'sq-wallet';
export const DMT_TOKEN = '0x8B0E6f19Ee57089F7649A455D89D7bC6314D04e8';
export const GET_DMT = 'https://dexscreener.com/arbitrum/0x410c879c62f22794bd5ee98e2ee01490f6d47a6b'; // DMT/USDC on Camelot
export const BRIDGE = 'https://portal.arbitrum.io/bridge';
export const arbiscanTx = (tx) => `https://arbiscan.io/tx/${tx}`;
export const arbiscanAddress = (a) => `https://arbiscan.io/address/${a}`;
const RPCS = ['https://arb1.arbitrum.io/rpc', 'https://arbitrum-one-rpc.publicnode.com'];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let cur = null; // { w: { name, icon, rdns, p }, address }
let bal = null; // { address, dmt, eth, at }
let generation = 0, connecting = 0;
let revision = 0;
export const walletRevision = () => revision;
const firstAccount = (a) => Array.isArray(a) && typeof a[0] === 'string' && /^0x[\da-f]{40}$/i.test(a[0]) ? a[0] : null;
const subs = new Set();
const emit = () => { for (const f of subs) { try { f(cur); } catch (e) { console.warn(e); } } };
export const onWallet = (f) => { subs.add(f); return () => subs.delete(f); };
export const current = () => cur;
const remember = (v) => { try { if (v) localStorage.setItem(KEY, JSON.stringify(v)); else localStorage.removeItem(KEY); } catch { /* storage blocked: this visit only */ } };
const saved = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };
const listening = new WeakSet();

function attach(w, address) {
  if (!cur || cur.w.p !== w.p || cur.address.toLowerCase() !== address.toLowerCase()) revision++;
  cur = { w, address };
  if (bal && bal.address.toLowerCase() !== address.toLowerCase()) bal = null;
  remember({ rdns: w.rdns || '', name: w.name, address });
  if (w.p.on && !listening.has(w.p)) {
    listening.add(w.p);
    // switching account or locking the wallet follows along
    w.p.on('accountsChanged', (a) => {
      if (!cur || cur.w.p !== w.p) return;
      const address = firstAccount(a);
      if (address) attach(w, address); else { revision++; cur = null; bal = null; remember(null); emit(); }
    });
  }
  emit();
}

/** Ask the wallet to connect (its own prompt), and remember it for next time. */
export async function connect(w) {
  revision++;
  const attempt = ++generation, before = cur; connecting = attempt;
  try {
    const a = firstAccount(await w.p.request({ method: 'eth_requestAccounts' }));
    // Wallets can emit the newly approved account before resolving their connection prompt.
    if (attempt !== generation || cur !== before && (!cur || cur.w.p !== w.p || cur.address.toLowerCase() !== a?.toLowerCase())) throw new Error('Wallet selection changed. Please connect again.');
    if (!a) throw new Error('No account was shared.');
    if (cur === before) attach(w, a);
    return cur;
  } finally { if (connecting === attempt) connecting = 0; }
}

/** Forget the wallet here (and ask it to drop this site's permission, where it supports that). */
export function disconnect() {
  revision++;
  generation++; connecting = 0;
  const w = cur && cur.w; cur = null; bal = null; remember(null); emit();
  try { if (w) w.p.request({ method: 'wallet_revokePermissions', params: [{ eth_accounts: {} }] }).catch(() => {}); } catch { /* not supported */ }
}

/** Reconnect last visit's wallet without a prompt. Wallets announce themselves a moment after load, so wait briefly. */
export async function restore() {
  if (cur || connecting) return cur;
  const attempt = generation;
  const s = saved(); if (!s) return null;
  for (let i = 0; i < 12 && !cur && attempt === generation; i++) {
    const w = wallets().find((x) => (s.rdns && x.rdns === s.rdns) || x.name === s.name);
    if (w) {
      try {
        const a = firstAccount(await w.p.request({ method: 'eth_accounts' }));
        if (attempt !== generation || cur || connecting) return cur;
        generation++;
        if (a) attach(w, a); else remember(null);
      } catch { /* wallet locked or gone */ }
      return cur;
    }
    await wait(150);
  }
  return cur;
}

async function rpc(method, params) {
  let last = null;
  for (const url of RPCS) {
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
      const d = await r.json(); if (d && typeof d.result === 'string') return d.result;
      last = new Error((d && d.error && d.error.message) || 'no answer');
    } catch (e) { last = e; }
  }
  throw last || new Error('Arbitrum is not answering');
}

/** DMT and ETH on Arbitrum for an address (cached for 20 s; force to re-read). */
export async function balances(address, force = false) {
  if (!force && bal && bal.address.toLowerCase() === address.toLowerCase() && Date.now() - bal.at < 20000) return bal;
  const word = address.slice(2).toLowerCase().padStart(64, '0');
  const [d, e] = await Promise.all([rpc('eth_call', [{ to: DMT_TOKEN, data: '0x70a08231' + word }, 'latest']), rpc('eth_getBalance', [address, 'latest'])]);
  bal = { address, dmt: Number(BigInt(d)) / 1e18, eth: Number(BigInt(e)) / 1e18, at: Date.now() };
  return bal;
}
export const fmtDmt = (v) => (v >= 1000 ? Math.floor(v).toLocaleString('en-US') : v >= 10 ? v.toFixed(1) : v.toFixed(2)).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
export const fmtEth = (v) => (v === 0 ? '0' : v < 0.0001 ? '<0.0001' : v.toFixed(4).replace(/0+$/, '').replace(/\.$/, ''));
// ETH on Arbitrum for one token transfer (it costs well under a cent)
export const ETH_FOR_GAS = 0.000005; // below this a transfer cannot pay its gas; above it the wallet itself decides
