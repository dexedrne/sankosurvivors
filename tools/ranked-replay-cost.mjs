// How long the server needs to replay a long endless ranked run: node tools/ranked-replay-cost.mjs [minutes] [map] [modes]
// A kiting bot (test/balance.mjs) plays with the QA god flag so it lives to the end, its inputs are recorded exactly as the
// game records them, then the log is replayed (same loop as replay() in src/ranked.js, the god flag set the same way) and
// the replay is timed at 15, 30, 45 and 60 minutes. Also prints the log size (the submit body) and the choices made.
import { readFileSync } from 'node:fs';
import { step, choose, createSim, TICK } from '../src/sim.js';
import { MAP_BY_ID, ADVENTURER_BY_ID } from '../src/content.js';
import { RunRecorder } from '../src/ranked.js';
import { unpackGround } from '../src/ground-pack.js';
import { bot, pick } from '../test/balance.mjs';

const MIN = Number(process.argv[2] || 60), mapId = process.argv[3] || 'apache', modes = (process.argv[4] || 'normal,hard').split(',');
const ground = unpackGround(readFileSync(new URL('./vercel-api/ground.bin', import.meta.url)));
const marks = [15, 30, 45, 60, 90, 120].filter((m) => m <= MIN);
const mk = (hard) => {
  const a = ADVENTURER_BY_ID.adventurer;
  const sim = createSim({ seed: 7, map: MAP_BY_ID[mapId], hard, endless: true, meta: {}, ground, players: [{ id: 'p1', name: 'You', adv: a.id, weapon: a.weapon, gear: {}, gearLv: {} }] });
  const p = sim.players[0]; p.hp = p.maxHp = 1e6; p.godMode = true; // QA only: lives to the end of the measured hour
  return sim;
};
for (const mode of modes) {
  const hard = mode === 'hard', sim = mk(hard), rec = new RunRecorder(), p = sim.players[0];
  let rec0 = Date.now();
  while (sim.t < MIN * 60 && !sim.over) {
    if (sim.pending.p1) { const i = sim.pending.p1.casket ? 0 : pick(sim.pending.p1.choices, p); rec.pick(i); choose(sim, 'p1', i); continue; }
    const m = bot(sim, p), before = sim.tick;
    step(sim, { p1: rec.input(m.mx, m.mz, null) }, TICK); rec.after(sim.tick !== before); sim.fx.length = 0;
  }
  const playMs = Date.now() - rec0, log = rec.log();
  // replay the log, timing each checkpoint
  const r = mk(hard); let pi = 0, tick = 0; const out = [];
  const t0 = process.hrtime.bigint(); let nextMark = 0;
  for (const [count, x, z] of log.runs) {
    for (let k = 0; k < count; k++) {
      while (r.pending.p1) choose(r, 'p1', log.picks[pi++]);
      step(r, { p1: { mx: x / 100, mz: z / 100, use: null } }, TICK); tick++; r.fx.length = 0;
      if (nextMark < marks.length && r.t >= marks[nextMark] * 60) {
        const ms = Number(process.hrtime.bigint() - t0) / 1e6;
        const runsAt = log.runs.reduce((acc, run) => (acc.t < tick ? { t: acc.t + run[0], n: acc.n + 1 } : acc), { t: 0, n: 0 }).n;
        out.push({ min: marks[nextMark], replayS: +(ms / 1000).toFixed(1), kills: r.kills, level: r.level, enemies: r.enemies.length, gems: r.gems.length, picks: pi, logKB: Math.round(JSON.stringify({ v: 1, runs: log.runs.slice(0, runsAt), uses: [], picks: log.picks.slice(0, pi) }).length / 1024) });
        nextMark++;
      }
    }
  }
  const same = r.kills === sim.kills && r.level === sim.level;
  console.log(JSON.stringify({ map: mapId, mode, playS: Math.round(playMs / 1000), replayMatches: same, marks: out }));
}
