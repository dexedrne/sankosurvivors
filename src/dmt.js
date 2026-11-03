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

// phone browsers have no wallet inside: open this page in a wallet app's own browser instead
export function walletAppLinks() {
  const here = location.host + location.pathname;
  return [
    ['MetaMask', `https://metamask.app.link/dapp/${here}`],
    ['Coinbase Wallet', `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(location.origin + location.pathname)}`],
    ['Trust Wallet', `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(location.origin + location.pathname)}`],
  ];
}

export function why(err) {
  const msg = String((err && err.message) || err || '');
  if ((err && err.code === 4001) || /reject|denied|declin|cancel/i.test(msg)) return 'Cancelled in your wallet. No worries.';
  return msg ? `That didn't work: ${msg.slice(0, 140)}` : "That didn't work. Try again?";
}
