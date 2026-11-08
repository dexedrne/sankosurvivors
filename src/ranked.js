// Ranked weekly DMT runs: the rules, the run recorder and the replay that checks a run. The game and the server both use
// this file, so a run replays on the server exactly as it was played (the simulation's maths is deterministic, see
// dmath.js). Ranked runs start equal: no skills, no gear, no DMT perks, any adventurer.
import { createSim, step, choose, reroll, skipLevel, autoChoice, banish, TICK } from './sim.js';
import { MAPS, MAP_BY_ID, ADVENTURERS, ADVENTURER_BY_ID } from './content.js';

export const RANKED = {
  pauseSeconds: 30 * 60,         // total wall-clock slack per run, shared across pauses, choices and reloads
  entryDmt: '0.5',               // legacy defaults; current prices use raceForWeek(week, mode)
  // Historical race definitions stay available for signed payments, replays and settlement.
  races: {
    normal: { name: 'Normal', entryDmt: '0.5', entryWei: '500000000000000000', hard: false },
    hard: { name: 'Hard', entryDmt: '1.5', entryWei: '1500000000000000000', hard: true },
  },
  houseShare: 0.10,              // to the house wallet; the rest is the race's prize pool
  payouts: [0.40, 0.25, 0.15, 0.12, 0.08], // of a race's prize pool, to its week's top 5 wallets
  maxEntriesPerWallet: 1000000,  // no real cap (owner 3 Nov: "let people play as much as they want, we want volume"); the SQL takes a number
  weekEpoch: Date.UTC(2026, 10, 2), // a Monday, 00:00 UTC: weeks run Monday to Sunday (UTC)
  // From this week on runs are scored by kills plus whole seconds survived; the Hard race exists historically. Runs are endless from this build on
  // (owner 2 Nov: "ranked should be endless mode from now on"), so week 0 ranks by time survived, then kills; its earlier
  // 15:00 runs replay on their own version. tools/supabase/*.sql and the payout bot use the same switch.
  kpmWeek: 1,
  minSeconds: 180,               // a week1+ run must last 3:00 to place (shorter runs are listed as too short)
  timeLimit: 2 * 3600,           // owner 2 Nov: "no 45 mins cap, can go 2 hours": the run stops here with its score counted
  maps: MAPS.filter((m) => !m.special).map((m) => m.id), // one map per week, in turn
  advs: ADVENTURERS.filter((a) => !a.special).map((a) => a.id), // every regular adventurer is open in ranked
};
export function pauseRemaining(started, played, now = Date.now(), graceMs = 0) {
  if (!Number.isFinite(started) || started <= 0 || !Number.isFinite(played) || played < 0 || !Number.isFinite(now) || !Number.isFinite(graceMs) || graceMs < 0) return null;
  return RANKED.pauseSeconds - Math.max(0, (now - started - graceMs) / 1000 - Math.floor(played));
}
export const weekOf = (ms = Date.now()) => Math.floor((ms - RANKED.weekEpoch) / (7 * 24 * 3600 * 1000));
export const weekStart = (w) => RANKED.weekEpoch + w * 7 * 24 * 3600 * 1000;
export const weekMap = (w) => w === 1 ? 'apache' : RANKED.maps[((w % RANKED.maps.length) + RANKED.maps.length) % RANKED.maps.length];
export function raceForWeek(week, mode = 'normal') {
  if (!Object.hasOwn(RANKED.races, mode)) return null;
  const race = RANKED.races[mode];
  return week >= 1 ? { ...race, entryDmt: mode === 'hard' ? '2' : '1', entryWei: mode === 'hard' ? '2000000000000000000' : '1000000000000000000' } : race;
}

// ---- the week's rules: one switch, used by the game, the server, the boards and the payout bot ----
export const kpmWeek = (w) => Number.isInteger(w) && w >= RANKED.kpmWeek;
export const racesOf = (w) => (kpmWeek(w) ? ['normal', 'hard'] : ['normal']);
// New ranked entries are Standard only; closing a race must not erase historical liabilities.
export const entryRacesOf = () => ['normal'];
export const isRace = (w, mode) => racesOf(w).includes(mode);
// the longest a run of that week can last, in game seconds (a little slack for the end screen)
export const runSeconds = () => RANKED.timeLimit + 60; // every run of this build is endless
// kills per minute in millionths, exact and identical in JS and SQL: floor(kills * 60,000,000 / seconds)
export const kpmMicro = (kills, t) => {
  const k = Math.max(0, Math.floor(Number(kills) || 0)), s = Math.floor(Number(t) || 0);
  return s > 0 ? Number((BigInt(k) * 60000000n) / BigInt(s)) : 0;
};
export const kpm = (kills, t) => kpmMicro(kills, t) / 1e6;
export function rankedPoints(kills, t) {
  const k = Number(kills), s = Number(t);
  return (Number.isFinite(k) ? Math.max(0, Math.floor(k)) : 0) + (Number.isFinite(s) ? Math.max(0, Math.floor(s)) : 0);
}
// can this run place (and win) in its week? Too-short runs stay on the board but never win.
export const placeable = (w, r) => !kpmWeek(w) || (Number(r.t) || 0) >= RANKED.minSeconds;
// the ranking key, highest first. Week 0: time, kills (endless runs never "win"). From week 1: long enough, combined points, kills per minute, kills.
// Ties: the earlier finish, then the earlier entry. Same order as sqs_ranked_score() in tools/supabase/ranked.sql.
export const scoreKey = (w, r) => (kpmWeek(w)
  ? [placeable(w, r) ? 1 : 0, rankedPoints(r.kills, r.t), kpmMicro(r.kills, r.t), Number(r.kills) || 0]
  : [0, Number(r.t) || 0, Number(r.kills) || 0]);
function finishMicros(row) {
  const value = row.at ?? row.finished_at, numeric = Number(value);
  if (Number.isFinite(numeric)) {
    const whole = Math.trunc(numeric);
    return BigInt(whole) * 1000n + BigInt(Math.round((numeric - whole) * 1000));
  }
  if (typeof value !== 'string') return 0n;
  const iso = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?(Z|[+-]\d{2}(?::?\d{2})?)$/i.exec(value);
  if (!iso) return 0n;
  const date = new Date(iso[1] + 'T00:00:00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== iso[1]) return 0n;
  const zone = /^[+-]\d{2}$/.test(iso[4]) ? iso[4] + ':00' : iso[4];
  const ms = Date.parse(`${iso[1]}T${iso[2]}${zone}`);
  if (iso[2].startsWith('24:') && /[1-9]/.test(iso[3] || '')) return 0n;
  // Parse whole seconds separately so Date.parse cannot discard PostgreSQL's final three fraction digits.
  return Number.isFinite(ms) ? BigInt(ms) * 1000n + BigInt((iso[3] || '').padEnd(6, '0')) : 0n;
}
export function compareRuns(w) {
  return (a, b) => {
    const ka = scoreKey(w, a), kb = scoreKey(w, b);
    for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return kb[i] - ka[i];
    const ta = finishMicros(a), tb = finishMicros(b);
    return ta < tb ? -1 : ta > tb ? 1 : (Number(a.id) || 0) - (Number(b.id) || 0);
  };
}
// which prize place each board row (already in board order) is playing for: -1 for no prize (the developer's wallet, or
// a run too short to place)
export function prizePlaces(rows, w, noPrize = () => false) {
  let k = 0;
  return rows.map((r) => (noPrize(r.wallet) || !placeable(w, r) ? -1 : k++));
}

const PID = 'p1';
// week: the ranked week the run's entry belongs to (it picks the rules); mode: 'normal' or 'hard'
export function rankedSim({ seed, mapId, adv, ground, week, mode = 'normal' } = {}) {
  // own-property lookups: 'constructor' and '__proto__' are truthy keys of a plain object
  const a = Object.hasOwn(ADVENTURER_BY_ID, adv) ? ADVENTURER_BY_ID[adv] : null;
  if (!a || a.special || !Object.hasOwn(MAP_BY_ID, mapId) || !Number.isInteger(week) || !isRace(week, mode)) throw new Error('bad ranked run');
  const endless = true; // every ranked run is endless from this build on (week 0 too); week 0 still ranks by time
  // the crowd: week 0 keeps the pace it started on (2 Nov), the denser one of 3 Nov from week 1, so a week is one contest
  return createSim({ seed, map: MAP_BY_ID[mapId], hard: mode === 'hard', endless, endAt: endless ? RANKED.timeLimit : 0, meta: {}, ground, pace: kpmWeek(week) ? 2 : 1, ranked: true,
    players: [{ id: PID, name: 'You', adv, weapon: a.weapon, gear: {}, gearLv: {} }] });
}

// stick and key input reaches the simulation in hundredths, so the recorded run is exactly what was simulated
export const q = (v) => Math.max(-100, Math.min(100, Math.round((Number(v) || 0) * 100)));

// Records one ranked run. Call tick() around every step, pick()/reroll()/skip() for level-up choices. A reward casket's
// card is a choice like a level-up: pick(0) is Wear, pick(1) is High alch (also when the auto high alch setting picks it).
export class RunRecorder {
  constructor() { this.runs = []; this.uses = []; this.picks = []; this.ticks = 0; }
  // returns the inputs to hand to step(); call after() once the step is done
  input(mx, mz, use) { this.pend = [q(mx), q(mz), use == null ? null : use]; return { mx: this.pend[0] / 100, mz: this.pend[1] / 100, use: this.pend[2] }; }
  after(advanced) {
    if (!advanced || !this.pend) return;
    const [x, z, use] = this.pend, last = this.runs[this.runs.length - 1];
    if (last && last[1] === x && last[2] === z) last[0]++; else this.runs.push([1, x, z]);
    if (use != null) this.uses.push([this.ticks, use]);
    this.ticks++;
  }
  pick(i) { this.picks.push(i); }      // 0, 1 or 2 (a casket card: 0 Wear, 1 High alch)
  auto() { this.picks.push('a'); }     // the card timer ran out and the sim picked by itself (step() does this while a card screen is open): card 0, or a casket's recommended choice
  reroll() { this.picks.push('r'); }
  skip() { this.picks.push('s'); }
  banish(i) { this.picks.push('b' + i); }
  log() { return { v: 1, runs: this.runs, uses: this.uses, picks: this.picks }; }
}

// Replays a recorded run from the same start. Returns what really happened, or { error }.
export function replay(log, params, { maxTicks = Math.ceil(runSeconds(params?.week) * 30), allowPartial = false } = {}) {
  if (!log || log.v !== 1 || !Array.isArray(log.runs) || !Array.isArray(log.uses) || !Array.isArray(log.picks)) return { error: 'bad log' };
  // cheap checks first: nothing malformed or oversized reaches the simulation (which is the expensive part)
  let total = 0;
  for (const r of log.runs) {
    if (!Array.isArray(r) || r.length !== 3) return { error: 'bad input' };
    const [count, x, z] = r;
    if (!Number.isInteger(count) || count < 1 || !Number.isInteger(x) || !Number.isInteger(z) || Math.abs(x) > 100 || Math.abs(z) > 100) return { error: 'bad input' };
    total += count; if (total > maxTicks) return { error: 'run too long' };
  }
  for (const u of log.uses) if (!Array.isArray(u) || u.length !== 2 || !Number.isInteger(u[0]) || !Number.isInteger(u[1]) || u[1] < 0 || u[1] > 4) return { error: 'bad item use' }; // 0-3 belt slots, 4 a jump
  let sim;
  try { sim = rankedSim(params); } catch { return { error: 'bad ranked run' }; }
  let pi = 0, ui = 0, tick = 0;
  const resolve = (partial = false) => {
    let guard = 0;
    while (sim.pending[PID]) {
      if (sim.pace < 2 && guard++ > 60) return 'too many choices'; // pace 2 consumes a finite pick per queued reward
      if (partial && pi === log.picks.length) return null;
      const a = log.picks[pi++];
      if (a === undefined) return 'missing a level-up choice';
      if (a === 'r') { if (!reroll(sim, PID)) return 'reroll not allowed'; }
      else if (a === 's') { if (!skipLevel(sim, PID)) return 'skip not allowed'; }
      else if (typeof a === 'string' && /^b[0-2]$/.test(a)) { if (!banish(sim, PID, Number(a[1]))) return 'banish not allowed'; }
      else if (a === 'a') choose(sim, PID, autoChoice(sim.pending[PID])); // what step() itself does when the card timer runs out
      else if (a === 0 || a === 1 || a === 2) { if (!sim.pending[PID].choices[a]) return 'no such choice'; if (!choose(sim, PID, a)) return 'choice not allowed'; }
      else return 'bad choice';
    }
    return null;
  };
  for (const r of log.runs) {
    if (!Array.isArray(r) || r.length !== 3) return { error: 'bad input' };
    const [count, x, z] = r;
    if (!Number.isInteger(count) || count < 1 || !Number.isInteger(x) || !Number.isInteger(z) || Math.abs(x) > 100 || Math.abs(z) > 100) return { error: 'bad input' };
    for (let k = 0; k < count; k++) {
      if (sim.over) return { error: 'inputs after the run ended' };
      const err = resolve(); if (err) return { error: err };
      let use = null;
      if (ui < log.uses.length && log.uses[ui][0] === tick) { use = log.uses[ui][1]; ui++; if (!Number.isInteger(use) || use < 0 || use > 4) return { error: 'bad item use' }; }
      const before = sim.tick;
      step(sim, { [PID]: { mx: x / 100, mz: z / 100, use } }, TICK);
      if (sim.tick === before) return { error: 'a step did not run' };
      tick++; sim.fx.length = 0; // nobody renders a replay: do not let effects pile up (hundreds of thousands of entries over a long run)
      if (tick > maxTicks) return { error: 'run too long' };
    }
  }
  const err = resolve(allowPartial); if (err && !sim.over) return { error: err };
  if (ui !== log.uses.length) return { error: 'item uses out of order' };
  if (!sim.over && !allowPartial) return { error: 'the run had not ended' };
  return { t: Math.floor(sim.t), kills: sim.kills, level: sim.level, won: sim.over === 'win', timeUp: sim.over === 'time', ticks: tick, picksUsed: pi };
}
