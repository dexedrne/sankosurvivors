// SankoQuest's own sound effects and music tracks. Starts on the first click (browser autoplay rules).
import { asset } from './assets.js';
const BASE = import.meta.env.BASE_URL || './';
const SFX = {
  hit: ['Sword_Hit1', 'Sword_Hit2', 'Sword_Hit3', 'Sword_Hit4'], die: ['NPC_Death'], hurt: ['goblin_attacked', 'goblin_attacked2', 'goblin_attacked3', 'goblin_attacked4'],
  pickup: ['PickUp_item'], level: ['Teleport'], choose: ['Cash_Register'], quake: ['Mining1', 'Mining2'], axe: ['Tree_Chop'], boss: ['NPC_Attack'], bow: ['NPC_Block'], magic: ['magic-edit-1'],
  drink: ['Bun_Burp_v1'], pop: ['poppop'], slam: ['Mining1', 'Mining2'], smith: ['Metal_Smith1', 'Metal_Smith2'], drop: ['Drop_item'], casket: ['Smelt'],
};
const EXT = { 'NPC_Block': 'wav', 'magic-edit-1': 'wav', 'Bun_Burp_v1': 'wav' };
const TRACKS = { early: 'Fresh_Beginnings', mid: 'Adobe_Fantasy', late: 'snowdrift_mix', boss: 'payasan_town_mix', final: 'grotto1' };

export function createAudio() {
  let ctx = null, sfxGain = null, loading = null, resuming = null, current = null, outgoing = null, desired = '', fade = null, muted = false, ducked = false;
  const musicSlots = [];
  // volume sliders, 0-100 each (Settings, Sound): 60 is the old fixed loudness, so there is room both ways
  const vol = { s: 60, m: 60 };
  function readPreferences(data) {
    if (!data || Object.hasOwn(data, 'sq-muted')) {
      muted = false;
      try { muted = (data ? data['sq-muted'] : localStorage.getItem('sq-muted')) === '1'; } catch { /* defaults */ }
    }
    if (!data || Object.hasOwn(data, 'sq-vol')) {
      vol.s = vol.m = 60;
      try { const v = JSON.parse((data ? data['sq-vol'] : localStorage.getItem('sq-vol')) || 'null'); for (const k of ['s', 'm']) if (Number.isFinite(v?.[k])) vol[k] = Math.max(0, Math.min(100, v[k])); } catch { /* defaults */ }
    }
  }
  readPreferences();
  const sfxLevel = () => (muted ? 0 : 0.5 * vol.s / 60), musicLevel = () => (muted ? 0 : Math.min(1, 0.3 * vol.m / 60) * (ducked ? 1 / 3 : 1));
  const buffers = new Map(); const last = {};
  function stopFade() { if (fade !== null) clearInterval(fade); fade = null; }
  function retire(slot) {
    slot.generation++; slot.pending = null; slot.ready = false; slot.gain.gain.value = 0; slot.el.pause();
  }
  function startFade() {
    if (fade !== null || !current?.ready) return;
    fade = setInterval(() => {
      if (!current?.ready) { stopFade(); return; }
      const target = musicLevel();
      current.gain.gain.value = Math.min(target, current.gain.gain.value + 0.02);
      if (outgoing) {
        outgoing.gain.gain.value = Math.max(0, Math.min(target, outgoing.gain.gain.value) - 0.03);
        if (!outgoing.gain.gain.value) { retire(outgoing); outgoing = null; }
      }
      if (current.gain.gain.value >= target && !outgoing) stopFade();
    }, 100);
  }
  function attempt(slot) {
    if (slot.pending) return;
    const generation = slot.generation;
    slot.ready = false;
    let promise;
    try { promise = Promise.resolve(slot.el.play()); } catch (e) { promise = Promise.reject(e); }
    slot.pending = promise;
    promise.then(() => {
      if (slot.generation !== generation || slot.pending !== promise) return;
      slot.pending = null; slot.primed = true; slot.ready = true;
      if (slot === current) startFade();
      else if (slot !== outgoing) { slot.el.pause(); slot.ready = false; }
    }, () => {
      if (slot.generation !== generation || slot.pending !== promise) return;
      slot.pending = null; slot.ready = false;
    });
  }
  async function init() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = new AC(); sfxGain = ctx.createGain(); sfxGain.gain.value = sfxLevel(); sfxGain.connect(ctx.destination);
      for (let i = 0; i < 2; i++) {
        const el = new Audio(), gain = ctx.createGain();
        el.crossOrigin = 'anonymous'; el.loop = true; el.volume = 1; el.preload = 'auto';
        const file = desired || TRACKS.early; el.src = asset(`music/${file}.mp3`);
        const source = ctx.createMediaElementSource(el); source.connect(gain); gain.gain.value = 0; gain.connect(ctx.destination);
        musicSlots.push({ el, gain, source, file, generation: 0, pending: null, ready: false, primed: false });
      }
      if (desired) current = musicSlots[0];
    }
    if (!resuming && (ctx.state === 'suspended' || ctx.state === 'interrupted')) {
      try { resuming = Promise.resolve(ctx.resume()); } catch (e) { resuming = Promise.reject(e); }
      const pending = resuming;
      pending.then(() => { if (resuming === pending) resuming = null; }, () => { if (resuming === pending) resuming = null; });
    }
    const resumed = resuming;
    // Start both reusable streams in this gesture, before any optional effect decoding.
    if (current && (!current.ready || current.el.paused)) attempt(current);
    for (const slot of musicSlots) if (slot !== current && slot !== outgoing && !slot.primed) attempt(slot);
    loading ||= Promise.all([...new Set(Object.values(SFX).flat())].map(async (n) => {
      try { const r = await fetch(asset(`sound/soundEffects/${n}.${EXT[n] || 'mp3'}`)); buffers.set(n, await ctx.decodeAudioData(await r.arrayBuffer())); } catch { /* optional */ }
    }));
    await Promise.all([resumed, loading]);
  }
  function play(kind, { minGap = 0.05, vol: gain = 1, rate = 1 } = {}) {
    if (!ctx || muted || !vol.s) return;
    const now = ctx.currentTime; if (now - (last[kind] || 0) < minGap) return; last[kind] = now;
    const list = SFX[kind]; const name = list[Math.floor(Math.random() * list.length)]; const buf = buffers.get(name); if (!buf) return;
    const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate * (0.92 + Math.random() * 0.16);
    const g = ctx.createGain(); g.gain.value = gain; src.connect(g); g.connect(sfxGain); src.start();
  }
  function music(key) {
    const file = TRACKS[key]; if (!file || file === desired) return;
    desired = file; if (!ctx) return;
    const old = current, healthy = current?.ready && current.gain.gain.value > 0 ? current : outgoing;
    const next = musicSlots.find(slot => slot !== (healthy || current));
    stopFade(); retire(next);
    if (next.file !== file) { next.file = file; next.el.src = asset(`music/${file}.mp3`); }
    next.el.currentTime = 0;
    outgoing = healthy;
    if (old && old !== next && old !== outgoing) retire(old);
    current = next; attempt(current);
  }
  const apply = () => {
    if (sfxGain) sfxGain.gain.value = sfxLevel();
    const level = musicLevel();
    if (current) current.gain.gain.value = current.ready ? level : 0;
    if (outgoing) {
      outgoing.gain.gain.value = Math.min(outgoing.gain.gain.value, level);
      if (!outgoing.gain.gain.value) { retire(outgoing); outgoing = null; }
    }
  };
  function applyPreferences(data) { readPreferences(data); apply(); }
  function setMuted(m) { muted = m; try { localStorage.setItem('sq-muted', m ? '1' : '0'); } catch { /* this visit only */ } apply(); }
  function duck(on) { ducked = !!on; apply(); }
  // kind: 's' sound effects or 'm' music; pct 0-100
  function setVolume(kind, pct) {
    if (kind !== 's' && kind !== 'm') return; vol[kind] = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
    try { localStorage.setItem('sq-vol', JSON.stringify(vol)); } catch { /* storage blocked */ }
    apply();
  }
  function onFx(list, view, base = 'early') {
    for (const f of list) {
      if (f.k === 'dmg') play('hit', { minGap: 0.045, vol: 0.5 });
      else if (f.k === 'die') play('die', { minGap: 0.08, vol: f.boss ? 1 : 0.45 });
      else if (f.k === 'hurt') play('hurt', { minGap: 0.1, vol: 0.9 });
      else if (f.k === 'get') play('pickup', { minGap: 0.05, vol: 0.6 });
      else if (f.k === 'level') play('level', { vol: 0.8 });
      else if (f.k === 'pick') play('choose', { vol: 0.6 });
      else if (f.k === 'quake') play('quake', { vol: 0.9 });
      else if (f.k === 'burst') play('magic', { minGap: 0.1, vol: 0.5 });
      else if (f.k === 'boss') play('boss', { vol: 1 });
      else if (f.k === 'use') play(f.kind === 'beer' ? 'drink' : f.kind === 'pumpkin' ? 'pop' : 'level', { vol: 0.9 });
      else if (f.k === 'slam') play('slam', { minGap: 0.15, vol: f.meteor ? 0.6 : 1, rate: f.meteor ? 1.3 : 0.75 });
      else if (f.k === 'casket') play('casket', { vol: 0.9 });
      else if (f.k === 'alch') play('pickup', { vol: 1, rate: 0.8 });
      else if (f.k === 'evolve') play('smith', { vol: 1 });
      else if (f.k === 'treasure') play('choose', { vol: 1 });
      else if (f.k === 'event') play('boss', { vol: 0.7, rate: 1.2 });
      else if (f.k === 'volley') play('magic', { minGap: 0.2, vol: 0.7, rate: 0.7 });
      else if (f.k === 'aim') play('bow', { vol: 0.6, rate: 0.6 });
      else if (f.k === 'jump') play('choose', { minGap: 0.2, vol: 0.35, rate: 1.6 });
    }
    if (view) { const t = view.t; music(t >= 720 ? 'final' : t >= 540 ? 'boss' : t >= 330 ? 'late' : t >= 150 ? 'mid' : base); }
  }
  return { init, play, music, onFx, applyPreferences, setMuted, duck, setVolume, volume: (k) => vol[k], get muted() { return muted; } };
}
