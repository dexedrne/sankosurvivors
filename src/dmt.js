// DMT holder perks. The player connects an EVM wallet and signs a free message (no transaction, no gas); the game
// server recovers the signer, reads its DMT balance on Arbitrum and hands back a holder pass for 24 hours.
// Perks are cosmetic and coins only: a DMT glow, +25% coins after a run, and a DMT badge on the leaderboard.
export const DMT_COIN_BONUS = 0.25;
const KEY = 'sq-dmt';

const found = new Map();
if (typeof window !== 'undefined') {
  window.addEventListener('eip6963:announceProvider', (e) => { const d = e.detail; if (d && d.info && d.info.uuid && d.provider) found.set(d.info.uuid, d); });
  window.dispatchEvent(new Event('eip6963:requestProvider'));
}
export function wallets() {
  const list = [...found.values()].map((d) => ({ name: d.info.name, icon: d.info.icon, rdns: d.info.rdns || '', p: d.provider }));
  if (!list.length && window.ethereum && window.ethereum.request) list.push({ name: 'Browser wallet', icon: null, p: window.ethereum });
  return list;
}

// Providers may appear after the first panel is drawn. Readiness only redraws choices: it never asks to connect.
export function watchWallets(onChange) {
  let previous = wallets(), timer = null, polls = 0, stopped = false;
  const check = () => {
    if (stopped) return;
    const next = wallets();
    if (next.length !== previous.length || next.some((w, i) => w.p !== previous[i]?.p || w.name !== previous[i]?.name)) {
      previous = next; onChange();
    }
  };
  const poll = () => { check(); if (!stopped && ++polls < 20) timer = setTimeout(poll, 150); else timer = null; };
  window.addEventListener('ethereum#initialized', check);
  window.addEventListener('eip6963:announceProvider', check);
  window.dispatchEvent(new Event('eip6963:requestProvider'));
  timer = setTimeout(poll, 150);
  return () => {
    stopped = true; clearTimeout(timer);
    window.removeEventListener('ethereum#initialized', check);
    window.removeEventListener('eip6963:announceProvider', check);
  };
}

export function savedPass() {
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); return s && s.pass && s.exp > Date.now() ? s : null; } catch { return null; }
}
export function forget() { try { localStorage.removeItem(KEY); } catch { /* storage blocked */ } }

export const hex = (s) => '0x' + Array.from(new TextEncoder().encode(s), (b) => b.toString(16).padStart(2, '0')).join('');

// connect + sign + check; onStep reports progress in words
export async function prove(wallet, base, onStep) {
  const p = wallet.p;
  onStep('Approve the connection in your wallet…');
  const [address] = await p.request({ method: 'eth_requestAccounts' });
  if (!address) throw new Error('no account was shared');
  const n = await (await fetch(`${base}api/nonce`)).json();
  if (!n || !n.message) throw new Error('the game server is not answering');
  onStep('Sign the message in your wallet (free, no transaction)…');
  const signature = await p.request({ method: 'personal_sign', params: [hex(n.message), address] });
  onStep('Checking your DMT on Arbitrum…');
  const r = await fetch(`${base}api/holder`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address, signature, nonce: n.nonce }) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'the check failed');
  if (d.holder) {
    const keep = { address: d.address, balance: d.balance, pass: d.pass, exp: Date.now() + 23.5 * 3600 * 1000 };
    try { localStorage.setItem(KEY, JSON.stringify(keep)); } catch { /* storage blocked: perks last this visit */ }
    return keep;
  }
  forget();
  return { address: d.address, balance: d.balance, holder: false };
}

export const short = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const HANDOFF_INTENTS = ['connect', 'holder', 'ranked'];
const HANDOFF_LANGUAGES = ['en', 'tr', 'es', 'fil'];
// A handoff selects UI only. Never copy the original query/hash: it can contain progress, credentials or tickets.
export function walletAppLinks(intent = 'connect', language = document.documentElement.lang) {
  const here = new URL(location.origin + location.pathname);
  here.searchParams.set('wallet', HANDOFF_INTENTS.includes(intent) ? intent : 'connect');
  if (HANDOFF_LANGUAGES.includes(language)) here.searchParams.set('lang', language);
  const encoded = encodeURIComponent(here.href);
  return [
    ['MetaMask', `https://metamask.app.link/dapp/${here.host + here.pathname + here.search}`],
    // Rabby Mobile: constant/universalLink.ts + hooks/universalLink.ts in RabbyHub/rabby-mobile.
    ['Rabby', `https://go.rabby.io/mobile/?_cmd=open-dapp&dapp=${encoded}`],
    ['Coinbase Wallet', `https://go.cb-w.com/dapp?cb_url=${encoded}`],
    ['Trust Wallet', `https://link.trustwallet.com/open_url?coin_id=60&url=${encoded}`],
  ];
}

export function takeWalletHandoff() {
  const here = new URL(location.href), intents = here.searchParams.getAll('wallet');
  if (intents.length !== 1 || !HANDOFF_INTENTS.includes(intents[0])) return null;
  const languages = here.searchParams.getAll('lang');
  const language = languages.length === 1 && HANDOFF_LANGUAGES.includes(languages[0]) ? languages[0] : null;
  here.searchParams.delete('wallet'); here.searchParams.delete('lang');
  try { history.replaceState(history.state, '', here.pathname + here.search + here.hash); } catch { /* UI-only hint; no wallet request on reload */ }
  return { intent: intents[0], language };
}

export function why(err) {
  const msg = String((err && err.message) || err || '');
  if ((err && err.code === 4001) || /reject|denied|declin|cancel/i.test(msg)) return 'Cancelled in your wallet. No worries.';
  return msg ? `That didn't work: ${msg.slice(0, 140)}` : "That didn't work. Try again?";
}
