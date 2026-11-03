// Ranked weekly DMT runs: the rules, the run recorder and the replay that checks a run. The game and the server both use
// this file, so a run replays on the server exactly as it was played (the simulation's maths is deterministic, see
// dmath.js). Ranked runs start equal: no skills, no gear, no DMT perks, any adventurer.
import { createSim, step, choose, reroll, skipLevel, autoChoice, TICK } from './sim.js';
import { MAPS, MAP_BY_ID, ADVENTURERS, ADVENTURER_BY_ID } from './content.js';

export const RANKED = {
  entryDmt: '0.5',               // DMT per ranked run
  houseShare: 0.10,              // to the house wallet; the rest is the players' prize pool
  payouts: [0.40, 0.25, 0.15, 0.12, 0.08], // of the prize pool, to the week's top 5 wallets
  maxEntriesPerWallet: 20,       // per week
  weekEpoch: Date.UTC(2026, 10, 2), // a Monday, 00:00 UTC: weeks run Monday to Sunday (UTC)
  maps: MAPS.filter((m) => !m.special).map((m) => m.id), // one map per week, in turn
  advs: ADVENTURERS.filter((a) => !a.special).map((a) => a.id), // every regular adventurer is open in ranked
};
export const weekOf = (ms = Date.now()) => Math.floor((ms - RANKED.weekEpoch) / (7 * 24 * 3600 * 1000));
export const weekStart = (w) => RANKED.weekEpoch + w * 7 * 24 * 3600 * 1000;
export const weekMap = (w) => RANKED.maps[((w % RANKED.maps.length) + RANKED.maps.length) % RANKED.maps.length];

const PID = 'p1';
export function rankedSim({ seed, mapId, adv, ground } = {}) {
  // own-property lookups: 'constructor' and '__proto__' are truthy keys of a plain object
  const a = Object.hasOwn(ADVENTURER_BY_ID, adv) ? ADVENTURER_BY_ID[adv] : null;
  if (!a || a.special || !Object.hasOwn(MAP_BY_ID, mapId)) throw new Error('bad ranked run');
  return createSim({ seed, map: MAP_BY_ID[mapId], hard: false, endless: false, meta: {}, ground,
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
  log() { return { v: 1, runs: this.runs, uses: this.uses, picks: this.picks }; }
}

// Replays a recorded run from the same start. Returns what really happened, or { error }.
export function replay(log, params, { maxTicks = 40 * 60 * 30 } = {}) {
  if (!log || log.v !== 1 || !Array.isArray(log.runs) || !Array.isArray(log.uses) || !Array.isArray(log.picks)) return { error: 'bad log' };
  // cheap checks first: nothing malformed or oversized reaches the simulation (which is the expensive part)
  let total = 0;
  for (const r of log.runs) {
    if (!Array.isArray(r) || r.length !== 3) return { error: 'bad input' };
    const [count, x, z] = r;
    if (!Number.isInteger(count) || count < 1 || !Number.isInteger(x) || !Number.isInteger(z) || Math.abs(x) > 100 || Math.abs(z) > 100) return { error: 'bad input' };
    total += count; if (total > maxTicks) return { error: 'run too long' };
  }
  for (const u of log.uses) if (!Array.isArray(u) || u.length !== 2 || !Number.isInteger(u[0]) || !Number.isInteger(u[1]) || u[1] < 0 || u[1] > 3) return { error: 'bad item use' };
  let sim;
  try { sim = rankedSim(params); } catch { return { error: 'bad ranked run' }; }
  let pi = 0, ui = 0, tick = 0;
  const resolve = () => {
    let guard = 0;
    while (sim.pending[PID]) {
      if (guard++ > 60) return 'too many choices';
      const a = log.picks[pi++];
      if (a === undefined) return 'missing a level-up choice';
      if (a === 'r') { if (!reroll(sim, PID)) return 'reroll not allowed'; }
      else if (a === 's') { if (!skipLevel(sim, PID)) return 'skip not allowed'; }
      else if (a === 'a') choose(sim, PID, autoChoice(sim.pending[PID])); // what step() itself does when the card timer runs out
      else if (a === 0 || a === 1 || a === 2) { if (!sim.pending[PID].choices[a]) return 'no such choice'; choose(sim, PID, a); }
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
      if (ui < log.uses.length && log.uses[ui][0] === tick) { use = log.uses[ui][1]; ui++; if (!Number.isInteger(use) || use < 0 || use > 3) return { error: 'bad item use' }; }
      const before = sim.tick;
      step(sim, { [PID]: { mx: x / 100, mz: z / 100, use } }, TICK);
      if (sim.tick === before) return { error: 'a step did not run' };
      tick++; sim.fx.length = 0; // nobody renders a replay: do not let effects pile up (hundreds of thousands of entries over a long run)
      if (tick > maxTicks) return { error: 'run too long' };
    }
  }
  const err = resolve(); if (err && !sim.over) return { error: err };
  if (ui !== log.uses.length) return { error: 'item uses out of order' };
  if (!sim.over) return { error: 'the run had not ended' };
  return { t: Math.floor(sim.t), kills: sim.kills, level: sim.level, won: sim.over === 'win', ticks: tick, picksUsed: pi };
}
