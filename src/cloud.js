// Cloud saves on a wallet (the server: tools/vercel-api/cloud.js). Sign once on each device; after that this device's
// progress is saved to the wallet a few seconds after it changes, and a newer save from another device is loaded when the
// game opens or comes back to the front. Graphics, sound and roof settings stay per device.
//
// Two devices playing at the same time: a save made on top of an older one is refused with the newer one, and the two are
// merged against the last save both had seen (`base`): coins and run counters add up what each device earned or spent,
// cleared maps, finished quests and found gear are joined, skill ranks keep the higher, the best run keeps the better;
// for anything else this device wins. Nothing one device earned is lost.

export const SAVE_KEYS = ['sq-coins', 'sq-name', 'sq-gear', 'sq-gearlv', 'sq-bank', 'sq-best', 'sq-stats', 'sq-skills', 'sq-quests', 'sq-cleared', 'sq-map', 'sq-adv', 'sq-autoalch'];
const ST = 'sq-cloud', BASE_KEY = 'sq-cloud-base';

const parse = (v, d) => { try { const x = JSON.parse(v); return x ?? d; } catch { return d; } };
const num = (v) => { const n = Number(parse(v, 0)); return Number.isFinite(n) ? n : 0; };
const obj = (v) => { const o = parse(v, {}); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; };
const arr = (v) => { const a = parse(v, []); return Array.isArray(a) ? a : []; };
const better = (a, b) => (!a ? b : !b ? a : (!!b.won !== !!a.won ? (b.won ? b : a) : (Number(b.t) || 0) > (Number(a.t) || 0) ? b : a));

// the merge of one key: base is what both devices last agreed on (undefined: never synced)
function mergeKey(k, base, mine, theirs) {
  if (mine === theirs || theirs === undefined) return mine;
  if (mine === undefined || mine === base) return theirs;
  if (theirs === base) return mine;
  switch (k) { // both changed it
    case 'sq-coins': return JSON.stringify(Math.max(0, Math.round(num(theirs) + num(mine) - num(base))));
    case 'sq-stats': { // run counters: each device's own additions
      const b = obj(base), m = obj(mine), t = obj(theirs), out = { ...t };
      for (const [s, v] of Object.entries(m)) if (Number.isFinite(Number(v))) out[s] = (Number(t[s]) || 0) + Number(v) - (Number(b[s]) || 0); else out[s] = v;
      return JSON.stringify(out);
    }
    case 'sq-skills': case 'sq-gearlv': { const m = obj(mine), t = obj(theirs), out = { ...t }; for (const [s, v] of Object.entries(m)) out[s] = Math.max(Number(v) || 0, Number(t[s]) || 0); return JSON.stringify(out); }
    case 'sq-cleared': case 'sq-quests': case 'sq-bank': return JSON.stringify([...new Set([...arr(theirs), ...arr(mine)])]);
    case 'sq-best': return JSON.stringify(better(obj(theirs), obj(mine)));
    default: return mine;
  }
}
export function mergeSaves(base, mine, theirs) {
  const out = {};
  for (const k of SAVE_KEYS) { const v = mergeKey(k, base ? base[k] : undefined, mine[k], theirs[k]); if (v !== undefined) out[k] = v; }
  return out;
}
// what a save holds, for the "which progress do you want" choice
export function summary(d) {
  const skills = obj(d['sq-skills']);
  return { coins: num(d['sq-coins']), maps: arr(d['sq-cleared']).length, ranks: Object.values(skills).reduce((a, b) => a + (Number(b) || 0), 0), gear: arr(d['sq-bank']).length };
}
// a device that has not really played yet (its progress can be replaced without asking)
export const isFresh = (d) => { const s = summary(d); return !s.coins && !s.maps && !s.ranks && !s.gear; };

// ---- this device's storage --------------------------------------------------------------------------------------------
const get = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const set = (k, v) => { try { if (v === null || v === undefined) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* storage blocked */ } };
export const cloudState = () => parse(get(ST), null);
const setState = (s) => set(ST, s ? JSON.stringify(s) : null);
export function snapshot() { const d = {}; for (const k of SAVE_KEYS) { const v = get(k); if (v !== null) d[k] = v; } return d; }
function applySnapshot(d) { for (const k of SAVE_KEYS) set(k, typeof d[k] === 'string' ? d[k] : null); set(BASE_KEY, JSON.stringify(d)); }
const base = () => parse(get(BASE_KEY), null);
const same = (a, b) => SAVE_KEYS.every((k) => (a[k] ?? null) === (b[k] ?? null));

async function api(baseUrl, route, body) {
  const r = await fetch(`${baseUrl}api/${route}`, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  return { status: r.status, d };
}
const hex = (s) => '0x' + [...new TextEncoder().encode(s)].map((b) => b.toString(16).padStart(2, '0')).join('');

/** A cloud save on one device. ui: { choose(cloud, local) -> Promise<'cloud'|'device'>, note(text), reload() } */
export function createCloud(baseUrl, ui) {
  let timer = 0, busy = false, again = false;

  // sign in with a connected wallet ({ w: { p }, address }): the first save, or the choice between two
  async function signIn(conn, step = () => {}) {
    const n = await api(baseUrl, 'save-nonce'); if (!n.d.message) throw new Error('the game server is not answering');
    step('Sign the message in your wallet (free, no transaction)…');
    const signature = await conn.w.p.request({ method: 'personal_sign', params: [hex(n.d.message), conn.address] });
    step('Opening your cloud save…');
    const r = await api(baseUrl, 'save-login', { nonce: n.d.nonce, signature, address: conn.address });
    if (r.status !== 200) throw new Error(r.d.error || 'the cloud save did not open');
    const mine = snapshot();
    setState({ a: r.d.address, key: r.d.key, rev: r.d.rev || 0 });
    if (!r.d.rev || !r.d.data) { set(BASE_KEY, null); await push(true); return 'saved'; } // nothing there yet: this device's progress goes up
    if (same(mine, r.d.data)) { setState({ a: r.d.address, key: r.d.key, rev: r.d.rev }); set(BASE_KEY, JSON.stringify(r.d.data)); return 'same'; }
    const pick = isFresh(mine) ? 'cloud' : await ui.choose(summary(r.d.data), summary(mine));
    if (pick === 'cloud') { applySnapshot(r.d.data); ui.reload(); return 'loaded'; }
    set(BASE_KEY, JSON.stringify(r.d.data)); // keep this device's: it replaces the cloud one
    await push(true, r.d.data);
    return 'saved';
  }
  // save this device's progress (soon after a change; at once with now)
  function changed() { if (!cloudState()) return; clearTimeout(timer); timer = setTimeout(() => push(), 4000); }
  async function push(now = false, overwrite = null) {
    const s = cloudState(); if (!s) return;
    if (busy) { again = true; return; }
    busy = true;
    try {
      const mine = snapshot(); if (!Object.keys(mine).length) return;
      const b = base(); if (!overwrite && b && same(mine, b) && s.rev) return; // nothing new since the last save
      const r = await api(baseUrl, 'save-put', { key: s.key, rev: s.rev, data: mine });
      if (r.status === 200) { setState({ ...s, rev: r.d.rev }); set(BASE_KEY, JSON.stringify(mine)); return; }
      if (r.status === 401) { setState(null); ui.note('Your cloud save signed out: open the wallet to sign in again.'); return; }
      if (r.status === 409 && r.d.conflict) { // another device saved in between: join the two, then save that
        const theirs = r.d.data || {}, merged = overwrite ? mine : mergeSaves(b, mine, theirs);
        for (const k of SAVE_KEYS) set(k, typeof merged[k] === 'string' ? merged[k] : null);
        setState({ ...s, rev: r.d.rev || 0 }); set(BASE_KEY, JSON.stringify(theirs));
        if (!overwrite) ui.note('Progress from your other device was added.');
        again = true; return;
      }
      if (r.status === 429) again = true; // too soon: the next change (or the retry below) saves it
    } catch { /* offline: the next change tries again */ } finally {
      busy = false;
      if (again) { again = false; clearTimeout(timer); timer = setTimeout(() => push(), now ? 1500 : 3000); }
    }
  }
  // a newer save from another device: load it (returns true when this device's progress changed)
  async function pull() {
    const s = cloudState(); if (!s || busy) return false;
    try {
      const r = await api(baseUrl, 'save-get', { key: s.key });
      if (r.status === 401) { setState(null); return false; }
      if (r.status !== 200 || !r.d.rev || r.d.rev <= s.rev || !r.d.data) return false;
      const mine = snapshot(), b = base(), merged = b && !same(mine, b) ? mergeSaves(b, mine, r.d.data) : r.d.data;
      applySnapshot(r.d.data); for (const k of SAVE_KEYS) set(k, typeof merged[k] === 'string' ? merged[k] : null);
      setState({ ...s, rev: r.d.rev });
      if (!same(merged, r.d.data)) changed(); // this device had unsaved progress on top: save the join
      return true;
    } catch { return false; }
  }
  function signOut() { setState(null); set(BASE_KEY, null); }
  return { signIn, changed, push, pull, signOut, state: cloudState };
}
