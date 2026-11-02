import test from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/sim.js';
import { rankedSim, RunRecorder, replay } from '../src/ranked.js';
import * as play from '../src/ranked-play.js';

const result = (s) => [Math.floor(s.t), s.kills, s.level, s.over === 'win'];
test('ranked frames stop at choices; resumed logs replay across maps with items, rerolls and skips', () => {
  assert.equal(typeof play.rankedStep, 'function');
  assert.equal(typeof play.rankedChoice, 'function');
  assert.equal(typeof play.resumeRanked, 'function');
  let choices = 0, rerolls = 0, skips = 0;
  for (const [seed, mapId, adv] of [[11, 'greentown', 'adventurer'], [12, 'apache', 'knight'], [13, 'goblins', 'ranger']]) {
    const params = { seed, mapId, adv, ground: null };
    let sim = rankedSim(params), rec = new RunRecorder(), cut = false;
    const random = mulberry32(seed);
    while (!sim.over) {
      if (sim.pending.p1) {
        const before = sim.pending.p1.left, tick = sim.tick;
        for (let i = 0; i < 1000; i++) play.rankedStep(sim, rec, .137, -.289, 0);
        assert.equal(sim.tick, tick); assert.equal(sim.pending.p1.left, before);
        // Cut with a choice still open, as well as with already-recorded rerolls.
        if (!cut && sim.t > 20) {
          const copy = JSON.parse(JSON.stringify(rec.log()));
          ({ sim, rec } = play.resumeRanked(copy, params)); cut = true;
          assert.deepEqual(rec.log(), copy);
        }
        if (sim.players[0].rerolls && choices % 3 === 0) { assert.ok(play.rankedChoice(sim, rec, 'r')); rerolls++; }
        const action = choices++ % 4 === 0 ? 's' : choices % 3;
        assert.ok(play.rankedChoice(sim, rec, action)); if (action === 's') skips++;
        continue;
      }
      const x = random() * 3 - 1.5, z = random() * 3 - 1.5;
      play.rankedStep(sim, rec, x, z, sim.tick % 177 === 0 ? sim.tick % 4 : null);
      sim.fx.length = 0;
    }
    assert.ok(cut);
    const tick = sim.tick; play.rankedStep(sim, rec, 1, 1, 0); assert.equal(sim.tick, tick);
    const r = replay(rec.log(), params); assert.ok(!r.error, r.error);
    assert.deepEqual([r.t, r.kills, r.level, r.won], result(sim));
    const restored = play.resumeRanked(JSON.parse(JSON.stringify(rec.log())), params);
    assert.deepEqual(result(restored.sim), result(sim));
    assert.equal(JSON.stringify(restored.rec.log()), JSON.stringify(rec.log()));
  }
  assert.ok(choices && rerolls && skips);
});

test('a run cut at its halfway tick resumes and finishes with the uninterrupted result', () => {
  const params = { seed: 55, mapId: 'greentown', adv: 'adventurer', ground: null };
  const full = rankedSim(params), original = new RunRecorder();
  const drive = (s, rec) => {
    if (s.pending.p1) play.rankedChoice(s, rec, s.players[0].rerolls ? 'r' : 1);
    else play.rankedStep(s, rec, .129, -.387, s.tick % 50 === 0 ? 0 : null);
    s.fx.length = 0;
  };
  while (!full.over) drive(full, original);
  let sim = rankedSim(params), rec = new RunRecorder();
  while (sim.tick < Math.floor(full.tick / 2)) drive(sim, rec);
  ({ sim, rec } = play.resumeRanked(JSON.parse(JSON.stringify(rec.log())), params));
  while (!sim.over) drive(sim, rec);
  assert.deepEqual(result(sim), result(full));
  assert.equal(JSON.stringify(rec.log()), JSON.stringify(original.log()));
  const r = replay(rec.log(), params); assert.ok(!r.error, r.error);
  assert.deepEqual([r.t, r.kills, r.level, r.won], result(full));
});
