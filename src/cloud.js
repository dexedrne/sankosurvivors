// Cloud saves on a wallet (the server: tools/vercel-api/cloud.js). Sign once on each device; after that this device's
// progress is saved to the wallet a few seconds after it changes, and a newer save from another device is loaded when the
// game opens or comes back to the front. Graphics, sound and roof settings stay per device.
//
// Two devices playing at the same time: a save made on top of an older one is refused with the newer one, and the two are
// merged against the last save both had seen (`base`): coins and run counters add up what each device earned or spent,
// cleared maps, finished quests and found gear are joined, skill ranks keep the higher, the best run keeps the better;
// for anything else this device wins. Nothing one device earned is lost.
import { current, walletRevision } from './wallet.js';
import { numberValue, finiteNumber } from './progress-values.js';
import { MILESTONES, DUPLICATE_GEAR_COINS } from './profile-milestones.js';
import { importProgress, IMPORT_BACKUP_KEY, RUN_SAVE_KEY } from './progress-import.js';

export const SAVE_KEYS = ['sq-coins', 'sq-name', 'sq-gear', 'sq-gearlv', 'sq-bank', 'sq-best', 'sq-bests', 'sq-stats', 'sq-skills', 'sq-quests', 'sq-cleared', 'sq-map', 'sq-adv', 'sq-autoalch'];
const ST = 'sq-cloud', BASE_KEY = 'sq-cloud-base', UPLOAD_KEY = 'sq-cloud-upload';

const parse = (v, d) => { try { const x = JSON.parse(v); return x ?? d; } catch { return d; } };
const num = (v) => finiteNumber(parse(v, 0));
const obj = (v) => { const o = parse(v, {}); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; };
const arr = (v) => { const a = parse(v, []); return Array.isArray(a) ? a : []; };
import { betterRun } from './personal-record.js';
export { betterRun } from './personal-record.js';

// the merge of one key: base is what both devices last agreed on (undefined: never synced)
function mergeKey(k, base, mine, theirs, sharedQuestCoins = 0) {
  // A new claim on both devices pays once, even if one device spent back to its base balance.
  if (k === 'sq-coins' && sharedQuestCoins > 0 && mine !== undefined && theirs !== undefined && mine !== theirs)
    return JSON.stringify(Math.max(0, Math.round(num(theirs) + num(mine) - num(base) - sharedQuestCoins)));
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
      for (const [s, v] of Object.entries(m)) if (Number.isFinite(numberValue(v))) out[s] = finiteNumber(t[s]) + numberValue(v) - finiteNumber(b[s]); else out[s] = v;
      return JSON.stringify(out);
    }
    case 'sq-skills': case 'sq-gearlv': { const m = obj(mine), t = obj(theirs), out = { ...t }; for (const [s, v] of Object.entries(m)) out[s] = Math.max(finiteNumber(v), finiteNumber(t[s])); return JSON.stringify(out); }
    case 'sq-cleared': case 'sq-quests': case 'sq-bank': return JSON.stringify([...new Set([...arr(theirs), ...arr(mine)])]);
    default: return mine;
  }
}
export function mergeSaves(base, mine, theirs) {
  const before = new Set(arr(base?.['sq-quests'])), a = new Set(arr(mine['sq-quests'])), b = new Set(arr(theirs['sq-quests'])), bank = new Set(arr(base?.['sq-bank']));
  const sharedQuestCoins = base ? MILESTONES.reduce((sum, q) => sum + (!before.has(q.id) && a.has(q.id) && b.has(q.id) ? q.coins + (q.item && bank.has(q.item) ? DUPLICATE_GEAR_COINS : 0) : 0), 0) : 0;
  const out = {};
  for (const k of SAVE_KEYS) { const v = mergeKey(k, base ? base[k] : undefined, mine[k], theirs[k], sharedQuestCoins); if (v !== undefined) out[k] = v; }
  // Longest runs and distinct map clears are records, not additive run counters.
  if (out['sq-stats'] !== undefined) {
    const times = [base, mine, theirs].map(d => obj(d?.['sq-stats']).bestTime), hasTime = times.some(v => v !== undefined), hasMaps = out['sq-cleared'] !== undefined;
    if (hasTime || hasMaps) {
      const stats = obj(out['sq-stats']);
      if (hasTime) stats.bestTime = Math.max(...times.map(finiteNumber));
      if (hasMaps) stats.cleared = new Set(arr(out['sq-cleared']).filter(v => typeof v === 'string')).size;
      out['sq-stats'] = JSON.stringify(stats);
    }
  }
  return out;
}
// what a save holds, for the "which progress do you want" choice
export function summary(d) {
  const skills = obj(d['sq-skills']);
  return { coins: num(d['sq-coins']), maps: arr(d['sq-cleared']).length, ranks: Object.values(skills).reduce((a, b) => a + finiteNumber(b), 0), gear: arr(d['sq-bank']).length };
}
// a device that has not really played yet (its progress can be replaced without asking)
export const isFresh = (d) => {
  const s = summary(d);
  const history = ['sq-stats', 'sq-gearlv', 'sq-best', 'sq-bests'].some(k => Object.keys(obj(d[k])).length);
  return !s.coins && !s.maps && !s.ranks && !s.gear && !history && !arr(d['sq-quests']).length;
};

// ---- this device's storage --------------------------------------------------------------------------------------------
const get = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const storageError = () => Object.assign(new Error('Browser storage is unavailable. Progress is not confirmed saved.'), { storage: true });
const read = k => { try { return localStorage.getItem(k); } catch { throw storageError(); } };
const set = (k, v) => { try { if (v === null || v === undefined) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { throw storageError(); } };
export const cloudState = () => parse(get(ST), null);
const setState = (s) => set(ST, s ? JSON.stringify(s) : null);
export function snapshot() { const d = {}; for (const k of SAVE_KEYS) { const v = read(k); if (v !== null) d[k] = v; } return d; }
const base = () => parse(read(BASE_KEY), null);
// Same lock as manual progress imports. Never hold it while awaiting a wallet or API.
// shortcut: without Web Locks only this tab is serialized; native locks are needed for cross-tab commits.
const progressLock = fn => globalThis.navigator?.locks?.request ? navigator.locks.request('sqs-progress-import', fn) : fn();
const requireStorageReady = () => { if (read(RUN_SAVE_KEY) !== null) throw Object.assign(storageError(), { recovery: true, runRecovery: true }); if (read(IMPORT_BACKUP_KEY) !== null) throw Object.assign(storageError(), { recovery: true }); };
const same = (a, b) => SAVE_KEYS.every((k) => (a[k] ?? null) === (b[k] ?? null));

async function api(baseUrl, route, body) {
  const r = await fetch(`${baseUrl}api/${route}`, { signal: AbortSignal.timeout(10000), ...(body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) });
  const d = await r.json().catch(() => ({}));
  return { status: r.status, d };
}
const hex = (s) => '0x' + [...new TextEncoder().encode(s)].map((b) => b.toString(16).padStart(2, '0')).join('');

/** A cloud save on one device. ui: { choose, note, reload, canLoad?, canSave?, merged?, recover?, signing? } */
export function createCloud(baseUrl, ui) {
  let timer = 0, busy = false, again = false, signInGeneration = 0, off = false, offKey = null, pendingOff = null;
  const state = () => { const s = cloudState(); return off && (pendingOff || s?.key === offKey) ? null : s; };
  const live = s => { const now = state(); return now?.key === s.key && now.rev === s.rev; };
  const canSave = () => !!state() && (!ui.canSave || ui.canSave());
  const storageNote = error => {
    if (!error.storage && !error.recovery) return;
    if (error.recovery) { ui.recover?.(error); ui.note('Progress recovery is required before playing.'); }
    else ui.note('Browser storage is unavailable. Progress is not confirmed saved.');
  };
  function replaceProgress(data, session, baseline, pending = null) {
    const before = snapshot(), values = Object.fromEntries(SAVE_KEYS.map(k => [k, typeof data[k] === 'string' ? data[k] : null]));
    let committed = false;
    try {
      importProgress(localStorage, values, () => {
        set(BASE_KEY, baseline ? JSON.stringify(baseline) : null);
        set(UPLOAD_KEY, pending ? JSON.stringify(pending) : null);
      });
      committed = true;
      setState(session); off = false; // last: no recovery journal can restore old progress under a newer active session
    } catch (error) {
      error.storage = true;
      if (committed && !same(before, data)) ui.merged?.(before, data);
      throw error;
    }
    if (!same(before, data)) ui.merged?.(before, data);
  }
  async function signIn(conn, step = () => {}) {
    const generation = ++signInGeneration, revision = walletRevision();
    if (pendingOff) await pendingOff;
    const sessionKey = cloudState()?.key;
    const checkCurrent = () => {
      const c = current();
      if (generation !== signInGeneration) throw new Error('Cloud sign-in cancelled: another action started.');
      if (ui.canLoad && !ui.canLoad()) throw new Error('Cloud loading is paused while the game loads or a run is starting or in progress.');
      if (cloudState()?.key !== sessionKey || walletRevision() !== revision
        || !c || c.w.p !== conn.w.p || c.address.toLowerCase() !== conn.address.toLowerCase()) throw new Error('Cloud sign-in cancelled: the wallet or save session changed.');
      requireStorageReady();
    };
    try {
      checkCurrent();
      const n = await api(baseUrl, 'save-nonce'); if (!n.d.message) throw new Error('the game server is not answering');
      checkCurrent(); step('Sign the message in your wallet (free, no transaction)…');
      let signature;
      ui.signing?.(true);
      try { signature = await conn.w.p.request({ method: 'personal_sign', params: [hex(n.d.message), conn.address] }); }
      finally { ui.signing?.(false); }
      checkCurrent(); step('Opening your cloud save…');
      const r = await api(baseUrl, 'save-login', { nonce: n.d.nonce, signature, address: conn.address });
      checkCurrent();
      if (r.status !== 200) throw new Error(r.d.error || 'the cloud save did not open');
      const mine = snapshot(), hasSave = r.d.rev && r.d.data, identical = hasSave && same(mine, r.d.data);
      const pick = !hasSave || identical ? 'device' : isFresh(mine) ? 'cloud' : await ui.choose(summary(r.d.data), summary(mine));
      const outcome = await progressLock(() => {
        checkCurrent();
        if (pick !== 'cloud' && pick !== 'device') throw new Error('Cloud sign-in cancelled: no progress was selected.');
        if (!same(snapshot(), mine)) throw new Error('Your progress changed. Open cloud save again to choose.');
        const session = { a: r.d.address, key: r.d.key, rev: r.d.rev || 0 };
        const pending = !identical && pick === 'device' && Object.keys(mine).length
          ? { a: session.a, rev: session.rev, data: mine, overwrite: !!hasSave, uncertain: false } : null;
        replaceProgress(pick === 'cloud' ? r.d.data : mine, session, hasSave ? r.d.data : null, pending);
        return identical ? 'same' : pick === 'cloud' ? 'loaded' : 'upload';
      });
      if (outcome === 'same') return 'same';
      if (outcome === 'loaded') { ui.reload(); return 'loaded'; }
      const saved = await push(true, hasSave ? r.d.data : null);
      if (state()?.key !== r.d.key) throw new Error(state() ? 'Cloud sign-in cancelled: the wallet or save session changed.' : 'Cloud save is signed out. Sign in again to upload your progress.');
      return saved ? 'saved' : 'pending';
    } catch (error) { storageNote(error); throw error; }
  }
  function changed() { if (!state()) return; clearTimeout(timer); timer = setTimeout(() => push(), 4000); }
  async function push(now = false, overwrite = null) {
    const s = state(); if (!s || !canSave()) return false;
    if (busy) {
      try { return await progressLock(() => {
        if (!live(s) || !canSave()) return false;
        requireStorageReady();
        if (overwrite) set(UPLOAD_KEY, JSON.stringify({ a: s.a, rev: s.rev, data: snapshot(), overwrite: true, uncertain: false }));
        again = true; return false;
      }); } catch (error) { storageNote(error); return false; }
    }
    busy = true;
    let upload;
    try {
      let prepared = progressLock(() => {
        if (!live(s) || !canSave()) return false;
        requireStorageReady();
        const pending = parse(read(UPLOAD_KEY), null), mine = snapshot(), b = base();
        upload = pending?.a === s.a && pending.rev === s.rev ? pending : null;
        if (!Object.keys(mine).length) return false;
        if (!upload && !overwrite && b && same(mine, b) && s.rev) return true;
        upload ||= { a: s.a, rev: s.rev, data: mine, overwrite: !!overwrite, uncertain: false };
        set(UPLOAD_KEY, JSON.stringify({ ...upload, uncertain: true }));
        return 'upload';
      });
      if (prepared?.then) prepared = await prepared;
      if (prepared !== 'upload') return prepared;
      const mine = upload.data;
      const r = await api(baseUrl, 'save-put', { key: s.key, rev: s.rev, data: mine });
      return await progressLock(() => {
        if (!live(s) || !canSave()) return false;
        requireStorageReady();
        if (r.status === 200 && r.d.ok === true && Number.isSafeInteger(r.d.rev) && r.d.rev > s.rev) {
          set(BASE_KEY, JSON.stringify(mine));
          set(UPLOAD_KEY, null);
          setState({ ...s, rev: r.d.rev });
          again ||= !same(snapshot(), mine);
          return !again;
        }
        if (r.status === 401) { signOut(); ui.note('Your cloud save signed out: open the wallet to sign in again.'); return false; }
        if (r.status === 409 && r.d.conflict) {
          const theirs = r.d.data || {};
          if (upload.uncertain && !same(theirs, mine)) {
            signOut(); ui.note('Cloud save paused after an interrupted upload and another save. Your local progress is safe. Turn cloud save on again and choose which progress to keep.'); return false;
          }
          const baseline = base();
          if (!upload.overwrite && !upload.uncertain && s.rev > 0 && (!baseline || typeof baseline !== 'object' || Array.isArray(baseline))) {
            signOut(); ui.note('Cloud save paused because the previous save could not be confirmed. Your local progress is safe. Turn cloud save on again and choose which progress to keep.'); return false;
          }
          const merged = upload.overwrite ? snapshot() : mergeSaves(upload.uncertain ? mine : baseline, snapshot(), theirs);
          const pending = upload.overwrite ? { ...upload, rev: r.d.rev || 0, data: merged, uncertain: false } : null;
          replaceProgress(merged, { ...s, rev: r.d.rev || 0 }, theirs, pending);
          if (!upload.overwrite && !upload.uncertain) ui.note('Progress from your other device was added.');
          again = true; return false;
        }
        if (r.status === 429 || r.status >= 500 || r.status === 200) {
          if (r.status !== 429) upload.uncertain = true;
          set(UPLOAD_KEY, JSON.stringify(upload)); again = true;
        } else { set(UPLOAD_KEY, null); ui.note('Progress is saved on this device but was not uploaded. Try Save now again; if it keeps failing, report it.'); }
        return false;
      });
    } catch (error) {
      storageNote(error);
      if (!error.recovery && upload) {
        try { await progressLock(() => {
          if (!live(s) || !canSave()) return;
          requireStorageReady();
          upload.uncertain = true;
          set(UPLOAD_KEY, JSON.stringify(upload));
        }); } catch (failure) { storageNote(failure); }
      }
      again = !error.recovery;
      return false;
    } finally {
      busy = false;
      if (again && state() && canSave()) { again = false; clearTimeout(timer); timer = setTimeout(() => push(), now ? 1500 : 3000); }
      else again = false;
    }
  }
  async function pull() {
    const s = state(), generation = signInGeneration;
    if (!s || busy || get(UPLOAD_KEY) || ui.canLoad && !ui.canLoad()) return false;
    try {
      requireStorageReady();
      const r = await api(baseUrl, 'save-get', { key: s.key });
      return await progressLock(() => {
        if (generation !== signInGeneration || ui.canLoad && !ui.canLoad() || busy || read(UPLOAD_KEY) || !live(s)) return false;
        requireStorageReady();
        if (r.status === 401) { setState(null); return false; }
        if (r.status !== 200 || !r.d.rev || r.d.rev <= s.rev || !r.d.data) return false;
        const mine = snapshot(), b = base();
        if (s.rev > 0 && (!b || typeof b !== 'object' || Array.isArray(b))) {
          signOut(); ui.note('Cloud save paused because the previous save could not be confirmed. Your local progress is safe. Turn cloud save on again and choose which progress to keep.'); return false;
        }
        const merged = mergeSaves(b || mine, mine, r.d.data);
        replaceProgress(merged, { ...s, rev: r.d.rev }, r.d.data);
        if (!same(merged, r.d.data)) changed();
        return true;
      });
    } catch (error) { storageNote(error); return false; }
  }
  function cancelPending() { signInGeneration++; }
  function signOut() {
    cancelPending(); clearTimeout(timer); again = false;
    offKey = cloudState()?.key; off = true;
    const clear = () => {
      let failed = false;
      try { set(ST, null); } catch (error) { storageNote(error); return; }
      for (const key of [BASE_KEY, UPLOAD_KEY]) { try { set(key, null); } catch (error) { failed = true; storageNote(error); } }
      if (!failed) off = false;
    };
    try {
      const clearing = progressLock(clear);
      if (!clearing?.then) { pendingOff = null; return; }
      const action = clearing.catch(() => clear()).finally(() => { if (pendingOff === action) pendingOff = null; });
      pendingOff = action;
      return action;
    } catch { clear(); pendingOff = null; }
  }
  return { signIn, changed, push, pull, signOut, cancelPending, state };
}
