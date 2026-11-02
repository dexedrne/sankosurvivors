import test from 'node:test';
import assert from 'node:assert/strict';
import { step, choose, reroll, TICK } from '../src/sim.js';
import { rankedSim, RunRecorder, replay, RANKED, weekOf, weekMap } from '../src/ranked.js';
import { ENEMIES } from '../src/content.js';

// a quick bot: backs off from close monsters, circles slowly, picks the first card (sometimes rerolls)
function play(seed, mapId, adv, { maxT = 400, rerollAt = 3 } = {}) {
  const sim = rankedSim({ seed, mapId, adv, ground: null }), rec = new RunRecorder(), p = sim.players[0];
  let levels = 0;
  while (!sim.over) {
    if (sim.pending.p1) {
      levels++;
      if (levels === rerollAt && p.rerolls > 0) { rec.reroll(); reroll(sim, 'p1'); }
      const i = levels % 3; rec.pick(i); choose(sim, 'p1', i); continue;
    }
    let fx = Math.cos(sim.t * 0.4) * 0.3, fz = Math.sin(sim.t * 0.4) * 0.3;
    for (const e of sim.enemies) { const dx = p.x - e.x, dz = p.z - e.z, d = Math.hypot(dx, dz); if (d < 4 && d > 0.01) { fx += dx / d / d; fz += dz / d / d; } }
    const l = Math.hypot(fx, fz) || 1;
    const use = sim.tick % 900 === 450 ? 0 : null;
    const before = sim.tick;
    step(sim, { p1: rec.input(fx / l, fz / l, use) }, TICK);
    rec.after(sim.tick !== before);
    if (sim.t > maxT) { p.hp = 0; p.alive = false; step(sim, { p1: rec.input(0, 0, null) }, TICK); rec.after(false); }
  }
  return { sim, log: rec.log() };
}

test('a recorded ranked run replays to exactly the same result', () => {
  for (const [seed, map, adv] of [[11, 'greentown', 'adventurer'], [12, 'apache', 'knight'], [13, 'goblins', 'ranger']]) {
    const { sim, log } = play(seed, map, adv, { maxT: 1e9 });
    const r = replay(log, { seed, mapId: map, adv, ground: null });
    assert.ok(!r.error, r.error);
    assert.deepEqual([r.t, r.kills, r.level, r.won], [Math.floor(sim.t), sim.kills, sim.level, sim.over === 'win'], `${map} seed ${seed}`);
  }
});

test('tampered runs do not replay to the claimed result', () => {
  const seed = 21, params = { seed, mapId: 'greentown', adv: 'adventurer', ground: null };
  const { sim, log } = play(seed, 'greentown', 'adventurer', { maxT: 1e9 });
  const honest = { t: Math.floor(sim.t), kills: sim.kills, level: sim.level };
  const same = (r) => !r.error && r.t === honest.t && r.kills === honest.kills && r.level === honest.level;
  // change one stretch of movement
  const a = structuredClone(log); const k = Math.floor(a.runs.length / 2); a.runs[k] = [a.runs[k][0], -a.runs[k][1] || 50, -a.runs[k][2] || 50];
  assert.ok(!same(replay(a, params)), 'edited movement changes the outcome');
  // a different seed (fishing for an easy start) gives a different run
  assert.ok(!same(replay(log, { ...params, seed: seed + 1 })), 'another seed is another run');
  // drop a level-up choice
  const b = structuredClone(log); b.picks.pop(); b.picks.pop();
  assert.ok(replay(b, params).error, 'missing choices are caught');
  // pad extra moves after death
  const c = structuredClone(log); c.runs.push([300, 0, 0]);
  assert.ok(replay(c, params).error, 'moves after the end are caught');
  // inputs out of range
  const d = structuredClone(log); d.runs[0] = [d.runs[0][0], 500, 0];
  assert.match(replay(d, params).error || '', /bad input/);
  // a run that never ended
  const e = structuredClone(log); e.runs = e.runs.slice(0, Math.floor(e.runs.length / 2));
  assert.ok(replay(e, params).error, 'an unfinished run is not a score');
  // junk
  assert.ok(replay({ v: 1, runs: 'x', uses: [], picks: [] }, params).error);
  assert.ok(replay(null, params).error);
});

test('weeks run Monday to Monday (UTC) and each week has one ranked map', () => {
  assert.equal(weekOf(Date.UTC(2026, 10, 2, 0, 0, 1)), 0);
  assert.equal(weekOf(Date.UTC(2026, 10, 8, 23, 59)), 0);
  assert.equal(weekOf(Date.UTC(2026, 10, 9, 0, 0, 1)), 1);
  assert.ok(RANKED.maps.includes(weekMap(0)) && weekMap(0) !== weekMap(1));
  assert.ok(Math.abs(RANKED.houseShare + (1 - RANKED.houseShare) * RANKED.payouts.reduce((a, b) => a + b, 0) - 1) < 1e-9, 'every DMT is accounted for');
});

test('a level-up left open until the timer runs out (auto-pick) replays when recorded with auto()', () => {
  const seed = 31, params = { seed, mapId: 'greentown', adv: 'adventurer', ground: null };
  const sim = rankedSim(params), rec = new RunRecorder(), p = sim.players[0]; let autos = 0, levels = 0;
  while (!sim.over) {
    if (sim.pending.p1) {
      levels++;
      if (levels % 2 === 0) { rec.auto(); autos++; while (sim.pending.p1) step(sim, {}, 1 / 60); } // what main.js does on the card screen
      else { rec.pick(1); choose(sim, 'p1', 1); }
      continue;
    }
    let fx = Math.cos(sim.t * 0.4) * 0.3, fz = Math.sin(sim.t * 0.4) * 0.3;
    for (const e of sim.enemies) { const dx = p.x - e.x, dz = p.z - e.z, d = Math.hypot(dx, dz); if (d < 4 && d > 0.01) { fx += dx / d / d; fz += dz / d / d; } }
    const l = Math.hypot(fx, fz) || 1, before = sim.tick;
    step(sim, { p1: rec.input(fx / l, fz / l, null) }, TICK); rec.after(sim.tick !== before);
  }
  assert.ok(autos > 0, 'the run had at least one timed-out card screen');
  const r = replay(rec.log(), params);
  assert.ok(!r.error, r.error);
  assert.deepEqual([r.t, r.kills, r.level], [Math.floor(sim.t), sim.kills, sim.level]);
});

test('replay() answers malformed logs and params with an error instead of throwing', () => {
  const ok = { seed: 1, mapId: 'greentown', adv: 'adventurer', ground: null };
  const base = { v: 1, runs: [[1, 0, 0]], uses: [], picks: [] };
  for (const log of [{ ...base, uses: [null] }, { ...base, uses: [[]] }, { ...base, uses: [[0, 9]] }, { ...base, runs: [null] }, { ...base, runs: [[2 ** 53, 0, 0]] }]) assert.ok(replay(log, ok).error);
  for (const params of [null, undefined, {}, { ...ok, mapId: 'constructor' }, { ...ok, mapId: '__proto__' }, { ...ok, adv: 'constructor' }, { ...ok, adv: 'alex' }, { ...ok, mapId: 'nope' }]) assert.equal(replay(base, params).error, 'bad ranked run');
});
