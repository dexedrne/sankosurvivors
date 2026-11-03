// The pace-1 baseline for test/pace1-same.test.mjs: run test/pace1-play.mjs against a checkout and print what it saw.
//   node tools/pace1-baseline.mjs <root of a checkout, e.g. main's> test/pace1-play.mjs main    (main: the old call signatures)
//   node tools/pace1-baseline.mjs . test/pace1-play.mjs branch                                    (this branch: pace 1 passed in)
// Long runs: use the job box, not the laptop.
import { pathToFileURL } from 'node:url';
const ROOT = process.argv[2].replace(/\/$/, ''), branch = process.argv[4] === 'branch';
const imp = (f) => import(pathToFileURL(ROOT + f).href);
const R = await imp('/src/ranked.js'), S = await imp('/src/sim.js'), Q = await imp('/qa-kit/simlib.mjs'), C = await imp('/src/content.js');
const { playPace1, PACE1_RUNS, playImmortal, IMMORTAL_RUNS, tablesPace1 } = await import(pathToFileURL(process.argv[3]).href);
const M = { rankedSim: R.rankedSim, RunRecorder: R.RunRecorder, step: S.step, choose: S.choose, reroll: S.reroll, TICK: S.TICK, mulberry32: S.mulberry32, botInput: Q.botInput, pickCard: Q.pickCard, createSim: S.createSim, MAP_BY_ID: C.MAP_BY_ID };
const T = branch
  ? { W: (r, h, t) => C.casketWeights(r, h, t, { pace: 1 }), roll: (g, r, h, t) => C.rollCasket(g, r, h, t, { pace: 1 }), B: (g, l) => C.gearBonus(g, l, 1), mulberry32: S.mulberry32 }
  : { W: (r, h, t) => C.casketWeights(r, h, t), roll: (g, r, h, t) => C.rollCasket(g, r, h, t), B: (g, l) => C.gearBonus(g, l), mulberry32: S.mulberry32 };
console.log(JSON.stringify({ tables: tablesPace1(T) }));
for (const cfg of IMMORTAL_RUNS) { const t0 = Date.now(), r = playImmortal(M, cfg); console.log(JSON.stringify({ immortal: true, ...cfg, ...r, ms: Date.now() - t0 })); }
for (const cfg of PACE1_RUNS) {
  const t0 = Date.now(), r = playPace1(M, cfg), rp = R.replay(r.log, r.params);
  console.log(JSON.stringify({ ...cfg, t: r.t, kills: r.kills, level: r.level, cards: r.cards, caskets: r.caskets, loot: r.loot, hash: r.hash, replay: [rp.t, rp.kills, rp.level, rp.error || null], ms: Date.now() - t0 }));
}
