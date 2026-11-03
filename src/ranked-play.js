// The only simulation mutations used by the ranked UI. Choices pause indefinitely.
import { step, choose, reroll, skipLevel, autoChoice, TICK } from './sim.js';
import { rankedSim, RunRecorder } from './ranked.js';

export function rankedStep(sim, rec, mx, mz, use) {
  if (sim.over || sim.pending.p1) return;
  const before = sim.tick;
  step(sim, { p1: rec.input(mx, mz, use) }, TICK);
  rec.after(sim.tick !== before);
}

export function rankedChoice(sim, rec, action) {
  if (!sim.pending.p1 || sim.over) return false;
  if (action === 'r') { if (!reroll(sim, 'p1')) return false; rec.reroll(); }
  else if (action === 's') { if (!skipLevel(sim, 'p1')) return false; rec.skip(); }
  else if ([0, 1, 2, 'a'].includes(action)) {
    const i = action === 'a' ? autoChoice(sim.pending.p1) : action;
    if (!sim.pending.p1.choices[i]) return false;
    choose(sim, 'p1', i); if (action === 'a') rec.auto(); else rec.pick(i);
  } else return false;
  return true;
}

// Replay a prefix, including choices after its last tick, and continue the same recorder.
export function resumeRanked(log, params) {
  if (!log || log.v !== 1 || ![log.runs, log.uses, log.picks].every(Array.isArray)) throw new Error('Invalid saved run.');
  const sim = rankedSim(params), rec = new RunRecorder();
  let pi = 0, ui = 0, total = 0;
  const choices = () => {
    while (sim.pending.p1 && pi < log.picks.length) {
      if (!rankedChoice(sim, rec, log.picks[pi++])) throw new Error('Invalid saved choice.');
    }
  };
  for (const row of log.runs) {
    if (!Array.isArray(row) || row.length !== 3 || !row.every(Number.isInteger) || row[0] < 1 || Math.abs(row[1]) > 100 || Math.abs(row[2]) > 100 || (total += row[0]) > 28800) throw new Error('Invalid saved input.');
    for (let i = 0; i < row[0]; i++) {
      choices();
      if (sim.pending.p1 || sim.over) throw new Error('Invalid saved run boundary.');
      let use = null;
      if (ui < log.uses.length && log.uses[ui]?.[0] === sim.tick) {
        const u = log.uses[ui++];
        if (u.length !== 2 || !Number.isInteger(u[1]) || u[1] < 0 || u[1] > 3) throw new Error('Invalid saved item.');
        use = u[1];
      }
      rankedStep(sim, rec, row[1] / 100, row[2] / 100, use);
      sim.fx.length = 0;
    }
  }
  choices();
  if (pi !== log.picks.length || ui !== log.uses.length) throw new Error('Invalid saved actions.');
  return { sim, rec };
}
