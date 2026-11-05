// Cloud saves on a wallet (the server: tools/vercel-api/cloud.js). Sign once on each device; after that this device's
// progress is saved to the wallet a few seconds after it changes, and a newer save from another device is loaded when the
// game opens or comes back to the front. Graphics, sound and roof settings stay per device.
//
// Two devices playing at the same time: a save made on top of an older one is refused with the newer one, and the two are
// merged against the last save both had seen (`base`): coins and run counters add up what each device earned or spent,
// cleared maps, finished quests and found gear are joined, skill ranks keep the higher, the best run keeps the better;
// for anything else this device wins. Nothing one device earned is lost.
import { current, walletRevision } from './wallet.js';

export const SAVE_KEYS = ['sq-coins', 'sq-name', 'sq-gear', 'sq-gearlv', 'sq-bank', 'sq-best', 'sq-bests', 'sq-stats', 'sq-skills', 'sq-quests', 'sq-cleared', 'sq-map', 'sq-adv', 'sq-autoalch'];
const ST = 'sq-cloud', BASE_KEY = 'sq-cloud-base', UPLOAD_KEY = 'sq-cloud-upload';

const parse = (v, d) => { try { const x = JSON.parse(v); return x ?? d; } catch { return d; } };
const num = (v) => { const n = Number(parse(v, 0)); return Number.isFinite(n) ? n : 0; };
const obj = (v) => { const o = parse(v, {}); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; };
const arr = (v) => { const a = parse(v, []); return Array.isArray(a) ? a : []; };
// Same personal-record order as casual boards: victory, whole seconds, then kills. Keep the old record on a full tie.
export function betterRun(a, b) {
  const valid = r => r && typeof r === 'object' && !Array.isArray(r) && typeof r.t === 'number' && Number.isFinite(r.t) && r.t >= 0;
  if (!valid(a)) return valid(b) ? b : null;
  if (!valid(b)) return a;
  const key = r => [r.won === true ? 1 : 0, Math.floor(r.t), Number.isFinite(r.kills) ? Math.min(999999, Math.max(0, Math.floor(r.kills))) : 0];
  const x = key(a), y = key(b);
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return y[i] > x[i] ? b : a;
  return a;
}

// the merge of one key: base is what both devices last agreed on (undefined: never synced)
function mergeKey(k, base, mine, theirs) {
  // Personal records only improve, including when an older client makes a one-sided weaker edit.
  if ((k === 'sq-best' || k === 'sq-bests') && (base !== undefined || mine !== undefined || theirs !== undefined)) {
    if (k === 'sq-best') return JSON.stringify(betterRun(betterRun(parse(base, null), parse(theirs, null)), parse(mine, null)));
    const sources = [obj(base), obj(theirs), obj(mine)], keys = new Set(sources.flatMap(Object.keys));
    return JSON.stringify(Object.fromEntries([...keys].map(key => [key, sources.reduce((best, records) => betterRun(best, Object.hasOwn(records, key) ? records[key] : null), null)])));
  }
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
  const r = await fetch(`${baseUrl}api/${route}`, { signal: AbortSignal.timeout(10000), ...(body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) });
  const d = await r.json().catch(() => ({}));
  return { status: r.status, d };
}
const hex = (s) => '0x' + [...new TextEncoder().encode(s)].map((b) => b.toString(16).padStart(2, '0')).join('');

/** A cloud save on one device. ui: { choose(cloud, local), note(text), reload(), canLoad?(), canSave?() } */
export function createCloud(baseUrl, ui) {
  let timer = 0, busy = false, again = false, signInGeneration = 0;

  // sign in with a connected wallet ({ w: { p }, address }): the first save, or the choice between two
  async function signIn(conn, step = () => {}) {
    const generation = ++signInGeneration, revision = walletRevision();
    const sessionKey = cloudState()?.key;
    const checkCurrent = () => {
      const c = current();
      if (generation !== signInGeneration) throw new Error('Cloud sign-in cancelled: another action started.');
      if (ui.canLoad && !ui.canLoad()) throw new Error('Cloud loading is paused while the game loads or a run is starting or in progress.');
      if (cloudState()?.key !== sessionKey || walletRevision() !== revision
        || !c || c.w.p !== conn.w.p || c.address.toLowerCase() !== conn.address.toLowerCase()) throw new Error('Cloud sign-in cancelled: the wallet or save session changed.');
    };
    checkCurrent();
    const n = await api(baseUrl, 'save-nonce'); if (!n.d.message) throw new Error('the game server is not answering');
    checkCurrent();
    step('Sign the message in your wallet (free, no transaction)…');
    const signature = await conn.w.p.request({ method: 'personal_sign', params: [hex(n.d.message), conn.address] });
    checkCurrent();
    step('Opening your cloud save…');
    const r = await api(baseUrl, 'save-login', { nonce: n.d.nonce, signature, address: conn.address });
    checkCurrent();
    if (r.status !== 200) throw new Error(r.d.error || 'the cloud save did not open');
    const mine = snapshot();
    const hasSave = r.d.rev && r.d.data, identical = hasSave && same(mine, r.d.data);
    const pick = !hasSave || identical ? 'device' : isFresh(mine) ? 'cloud' : await ui.choose(summary(r.d.data), summary(mine));
    checkCurrent();
    if (pick !== 'cloud' && pick !== 'device') throw new Error('Cloud sign-in cancelled: no progress was selected.');
    if (!same(snapshot(), mine)) throw new Error('Your progress changed. Open cloud save again to choose.');
    // A pending choice must not replace the prior session or let autosave select a wallet for the player.
    set(UPLOAD_KEY, null);
    setState({ a: r.d.address, key: r.d.key, rev: r.d.rev || 0 });
    if (!hasSave) set(BASE_KEY, null); // nothing there yet: this device's progress goes up
    else if (identical) { set(BASE_KEY, JSON.stringify(r.d.data)); return 'same'; }
    else if (pick === 'cloud') { applySnapshot(r.d.data); ui.reload(); return 'loaded'; }
    else set(BASE_KEY, JSON.stringify(r.d.data)); // keep this device's: it replaces the cloud one
    const saved = await push(true, hasSave ? r.d.data : null);
    if (cloudState()?.key !== r.d.key) throw new Error(cloudState() ? 'Cloud sign-in cancelled: the wallet or save session changed.' : 'Cloud save is signed out. Sign in again to upload your progress.');
    return saved ? 'saved' : 'pending';
  }
  // save this device's progress (soon after a change; at once with now)
  function changed() { if (!cloudState()) return; clearTimeout(timer); timer = setTimeout(() => push(), 4000); }
  async function push(now = false, overwrite = null) {
    const s = cloudState(); if (!s || ui.canSave && !ui.canSave()) return false;
    if (busy) {
      if (overwrite) set(UPLOAD_KEY, JSON.stringify({ a: s.a, rev: s.rev, data: snapshot(), overwrite: true, uncertain: false }));
      again = true; return false;
    }
    busy = true;
    let upload;
    try {
      const pending = parse(get(UPLOAD_KEY), null), current = snapshot(), b = base();
      upload = pending?.a === s.a && pending.rev === s.rev ? pending : null;
      if (!Object.keys(current).length) return false;
      if (!upload && !overwrite && b && same(current, b) && s.rev) return true; // nothing new since the last save
      upload ||= { a: s.a, rev: s.rev, data: current, overwrite: !!overwrite, uncertain: false };
      set(UPLOAD_KEY, JSON.stringify({ ...upload, uncertain: true })); // a reload can lose the response even after the server saved
      const mine = upload.data;
      const r = await api(baseUrl, 'save-put', { key: s.key, rev: s.rev, data: mine });
      if (cloudState()?.key !== s.key || ui.canSave && !ui.canSave()) return false; // signing out or switching wallets wins over an old response
      if (r.status === 200 && r.d.ok === true && Number.isSafeInteger(r.d.rev) && r.d.rev > s.rev) {
        set(UPLOAD_KEY, null);
        setState({ ...s, rev: r.d.rev }); set(BASE_KEY, JSON.stringify(mine));
        again ||= !same(snapshot(), mine);
        return !again;
      }
      if (r.status === 401) { signOut(); ui.note('Your cloud save signed out: open the wallet to sign in again.'); return false; }
      if (r.status === 409 && r.d.conflict) { // another device saved in between: join the two, then save that
        const theirs = r.d.data || {};
        if (upload.uncertain && !same(theirs, mine)) {
          signOut();
          ui.note('Cloud save paused after an interrupted upload and another save. Your local progress is safe. Turn cloud save on again and choose which progress to keep.');
          return false;
        }
        const merged = upload.overwrite ? snapshot() : mergeSaves(upload.uncertain ? mine : b, snapshot(), theirs);
        set(UPLOAD_KEY, null);
        if (upload.overwrite) set(UPLOAD_KEY, JSON.stringify({ ...upload, rev: r.d.rev || 0, data: merged, uncertain: false }));
        for (const k of SAVE_KEYS) set(k, typeof merged[k] === 'string' ? merged[k] : null);
        setState({ ...s, rev: r.d.rev || 0 }); set(BASE_KEY, JSON.stringify(theirs));
        if (!upload.overwrite && !upload.uncertain) ui.note('Progress from your other device was added.');
        again = true; return false;
      }
      if (r.status === 429 || r.status >= 500 || r.status === 200) {
        if (r.status !== 429) upload.uncertain = true;
        set(UPLOAD_KEY, JSON.stringify(upload));
        again = true;
      } else { set(UPLOAD_KEY, null); ui.note('Progress is saved on this device but was not uploaded. Try Save now again; if it keeps failing, report it.'); }
      return false;
    } catch {
      if (upload && cloudState()?.key === s.key && (!ui.canSave || ui.canSave())) { upload.uncertain = true; set(UPLOAD_KEY, JSON.stringify(upload)); }
      again = true; return false;
    } finally {
      busy = false;
      if (again && cloudState() && (!ui.canSave || ui.canSave())) { again = false; clearTimeout(timer); timer = setTimeout(() => push(), now ? 1500 : 3000); }
      else again = false;
    }
  }
  // a newer save from another device: load it (returns true when this device's progress changed)
  async function pull() {
    const s = cloudState(), generation = signInGeneration;
    if (!s || busy || get(UPLOAD_KEY) || ui.canLoad && !ui.canLoad()) return false; // resolve an interrupted upload before merging a newer save
    try {
      const r = await api(baseUrl, 'save-get', { key: s.key });
      if (generation !== signInGeneration || ui.canLoad && !ui.canLoad() || busy || get(UPLOAD_KEY) || cloudState()?.key !== s.key || cloudState()?.rev !== s.rev) return false;
      if (r.status === 401) { setState(null); return false; }
      if (r.status !== 200 || !r.d.rev || r.d.rev <= s.rev || !r.d.data) return false;
      const mine = snapshot(), b = base(), merged = mergeSaves(b || mine, mine, r.d.data);
      applySnapshot(r.d.data); for (const k of SAVE_KEYS) set(k, typeof merged[k] === 'string' ? merged[k] : null);
      setState({ ...s, rev: r.d.rev });
      if (!same(merged, r.d.data)) changed(); // this device had unsaved progress on top: save the join
      return true;
    } catch { return false; }
  }
  function cancelPending() { signInGeneration++; }
  function signOut() { cancelPending(); clearTimeout(timer); again = false; setState(null); set(BASE_KEY, null); set(UPLOAD_KEY, null); }
  return { signIn, changed, push, pull, signOut, cancelPending, state: cloudState };
}
