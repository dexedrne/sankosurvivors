import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { step, choose, reroll, skipLevel, autoChoice, TICK } from '../src/sim.js';
import { xpForLevel } from '../src/content.js';
import { rankedSim, RunRecorder, runSeconds } from '../src/ranked.js';

// A synthetic XP collection exercises the real recorder/resume/replay boundaries without a long human-play claim.
const fixtureSim = params => {
  const sim = rankedSim(params), p = sim.players[0];
  sim.spawnAcc = -1e9; sim.bossIndex = 99; sim.eventT = sim.shrineT = 1e9;
  sim.endAt = 3 * TICK;
  const xp = Array.from({ length: 74 }, (_, i) => xpForLevel(i + 1)).reduce((a, b) => a + b, 0);
  sim.gems.push({ id: sim.nextId++, x: p.x, z: p.z, v: xp });
  return sim;
};
const replaySource = readFileSync(new URL('../src/ranked.js', import.meta.url), 'utf8').split('export function replay(')[1];
const replay = Function('rankedSim', 'runSeconds', 'step', 'choose', 'reroll', 'skipLevel', 'autoChoice', 'TICK',
  `const PID='p1';return function replay(${replaySource}`)(fixtureSim, runSeconds, step, choose, reroll, skipLevel, autoChoice, TICK);
const playSource = readFileSync(new URL('../src/ranked-play.js', import.meta.url), 'utf8').replace(/^import .*;$/gm, '').replace(/export /g, '');
const play = Function('rankedSim', 'RunRecorder', 'runSeconds', 'step', 'choose', 'reroll', 'skipLevel', 'autoChoice', 'TICK',
  `${playSource};return {rankedStep,rankedChoice,resumeRanked};`)(fixtureSim, RunRecorder, runSeconds, step, choose, reroll, skipLevel, autoChoice, TICK);

for (const mode of ['normal', 'hard']) test(`pace 2 ${mode}: more than 61 earned actions record, resume and replay identically`, () => {
  const params = { seed: 1104, mapId: 'greentown', adv: 'adventurer', ground: null, week: 1, mode };
  const sim = fixtureSim(params), rec = new RunRecorder();
  play.rankedStep(sim, rec, 0, 0);
  assert.equal(sim.level, 75);
  assert.equal(sim.players[0].levelQ, 73);
  while (sim.pending.p1) assert(play.rankedChoice(sim, rec, 'a'));
  assert.equal(rec.picks.length, 74);
  const prefix = play.resumeRanked(rec.log(), params);
  assert.equal(prefix.sim.level, sim.level); assert.equal(prefix.sim.tick, sim.tick);
  assert.equal(prefix.sim.pending.p1, undefined); assert.equal(prefix.sim.players[0].levelQ, 0);
  while (!sim.over) play.rankedStep(sim, rec, 0, 0);
  const result = replay(rec.log(), params);
  assert.equal(result.error, undefined);
  assert.deepEqual([result.level, result.ticks, result.picksUsed], [75, 3, 74]);
  const resumed = play.resumeRanked(rec.log(), params);
  assert.equal(resumed.sim.over, 'time'); assert.deepEqual(resumed.rec.log(), rec.log());
  assert.match(replay({ ...rec.log(), picks: rec.picks.slice(0, -1) }, params).error, /missing a level-up choice/);
  assert.match(replay({ ...rec.log(), picks: [...rec.picks.slice(0, -1), 'bad'] }, params).error, /bad choice/);
});

test('fractional time after hour 24 uses the invalid timestamp fallback', async () => {
  const { compareRuns } = await import('../src/ranked.js');
  const rows = [{ id: 2, t: 180, kills: 1, finished_at: '2026-11-03T24:00:00.000001Z' },
    { id: 1, t: 180, kills: 1, finished_at: 1 }];
  assert.deepEqual(rows.sort(compareRuns(1)).map(r => r.id), [2, 1]);
});

test('deadline snapshot keeps earned score while a final reward choice is pending',()=>{
 const params={seed:1104,mapId:'greentown',adv:'adventurer',ground:null,week:1};
 const sim=fixtureSim(params),rec=new RunRecorder();play.rankedStep(sim,rec,0,0);
 assert.ok(sim.pending.p1);assert.equal(replay(rec.log(),params).error,'missing a level-up choice');
 const result=replay(rec.log(),params,{allowPartial:true});
 assert.deepEqual([result.ticks,result.kills,result.level,result.picksUsed],[sim.tick,sim.kills,sim.level,0]);
 const malformed={...rec.log(),picks:['bad']};assert.equal(replay(malformed,params,{allowPartial:true}).error,'bad choice');
});
