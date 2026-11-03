// SankoQuest's own sound effects and music tracks. Starts on the first click (browser autoplay rules).
const BASE = import.meta.env.BASE_URL || './';
const SFX = {
  hit: ['Sword_Hit1', 'Sword_Hit2', 'Sword_Hit3', 'Sword_Hit4'], die: ['NPC_Death'], hurt: ['goblin_attacked', 'goblin_attacked2', 'goblin_attacked3', 'goblin_attacked4'],
  pickup: ['PickUp_item'], level: ['Teleport'], choose: ['Cash_Register'], quake: ['Mining1', 'Mining2'], axe: ['Tree_Chop'], boss: ['NPC_Attack'], bow: ['NPC_Block'], magic: ['magic-edit-1'],
  drink: ['Bun_Burp_v1'], pop: ['poppop'], slam: ['Mining1', 'Mining2'], smith: ['Metal_Smith1', 'Metal_Smith2'], drop: ['Drop_item'], casket: ['Smelt'],
};
const EXT = { 'NPC_Block': 'wav', 'magic-edit-1': 'wav', 'Bun_Burp_v1': 'wav' };
const TRACKS = { early: 'Fresh_Beginnings', mid: 'Adobe_Fantasy', late: 'snowdrift_mix', boss: 'payasan_town_mix', final: 'grotto1' };

export function createAudio() {
  let ctx = null, sfxGain = null, musicEl = null, musicName = '', muted = localStorage.getItem('sq-muted') === '1';
  const buffers = new Map(); const last = {};
  async function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); sfxGain = ctx.createGain(); sfxGain.gain.value = muted ? 0 : 0.5; sfxGain.connect(ctx.destination);
    await Promise.all([...new Set(Object.values(SFX).flat())].map(async (n) => {
      try { const r = await fetch(`${BASE}assets/sound/soundEffects/${n}.${EXT[n] || 'mp3'}`); buffers.set(n, await ctx.decodeAudioData(await r.arrayBuffer())); } catch { /* optional */ }
    }));
  }
  function play(kind, { minGap = 0.05, vol = 1, rate = 1 } = {}) {
    if (!ctx || muted) return;
    const now = ctx.currentTime; if (now - (last[kind] || 0) < minGap) return; last[kind] = now;
    const list = SFX[kind]; const name = list[Math.floor(Math.random() * list.length)]; const buf = buffers.get(name); if (!buf) return;
    const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate * (0.92 + Math.random() * 0.16);
    const g = ctx.createGain(); g.gain.value = vol; src.connect(g); g.connect(sfxGain); src.start();
  }
  function music(key) {
    const file = TRACKS[key]; if (!file || file === musicName) return;
    musicName = file;
    const old = musicEl; const el = new Audio(`${BASE}assets/music/${file}.mp3`); el.loop = true; el.volume = 0; el.preload = 'auto';
    musicEl = el; el.play().catch(() => {});
    let v = 0; const target = muted ? 0 : 0.3;
    const fade = setInterval(() => { v = Math.min(target, v + 0.02); el.volume = v; if (old) old.volume = Math.max(0, old.volume - 0.03); if (v >= target && (!old || old.volume <= 0)) { clearInterval(fade); old && old.pause(); } }, 100);
  }
  function setMuted(m) { muted = m; localStorage.setItem('sq-muted', m ? '1' : '0'); if (sfxGain) sfxGain.gain.value = m ? 0 : 0.5; if (musicEl) musicEl.volume = m ? 0 : 0.3; }
  function duck(on) { if (musicEl && !muted) musicEl.volume = on ? 0.1 : 0.3; }
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
    }
    if (view) { const t = view.t; music(t >= 720 ? 'final' : t >= 540 ? 'boss' : t >= 330 ? 'late' : t >= 150 ? 'mid' : base); }
  }
  return { init, play, music, onFx, setMuted, duck, get muted() { return muted; } };
}
