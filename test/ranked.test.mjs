import test from 'node:test';
import assert from 'node:assert/strict';
import { step, choose, reroll, TICK } from '../src/sim.js';
import { rankedSim, RunRecorder, replay, RANKED, weekOf, weekMap, kpm, kpmMicro, kpmWeek, racesOf, compareRuns, prizePlaces, placeable, runSeconds, scoreKey } from '../src/ranked.js';
import { mulberry32 } from '../src/sim.js';
import { ENEMIES, MAP_BY_ID } from '../src/content.js';

// a quick bot: backs off from close monsters, circles slowly, picks the first card (sometimes rerolls)
function play(seed, mapId, adv, { maxT = 400, rerollAt = 3, week = 0, mode = 'normal' } = {}) {
  const sim = rankedSim({ seed, mapId, adv, ground: null, week, mode }), rec = new RunRecorder(), p = sim.players[0];
  let levels = 0;
  while (!sim.over) {
    if (sim.pending.p1) {
      levels++;
      if (levels === rerollAt && p.rerolls > 0 && !sim.pending.p1.casket) { rec.reroll(); reroll(sim, 'p1'); }
      const i = levels % sim.pending.p1.choices.length; rec.pick(i); choose(sim, 'p1', i); continue; // a casket card has two choices
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
    const r = replay(log, { seed, mapId: map, adv, ground: null, week: 0 });
    assert.ok(!r.error, r.error);
    assert.deepEqual([r.t, r.kills, r.level, r.won], [Math.floor(sim.t), sim.kills, sim.level, sim.over === 'win'], `${map} seed ${seed}`);
  }
});

test('tampered runs do not replay to the claimed result', () => {
  const seed = 21, params = { seed, mapId: 'greentown', adv: 'adventurer', ground: null, week: 0 };
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
  const seed = 31, params = { seed, mapId: 'greentown', adv: 'adventurer', ground: null, week: 0 };
  const sim = rankedSim(params), rec = new RunRecorder(), p = sim.players[0]; let autos = 0, levels = 0;
  while (!sim.over) {
    if (sim.pending.p1) {
      levels++;
      if (levels % 2 === 0) { rec.auto(); autos++; while (sim.pending.p1) step(sim, {}, 1 / 60); } // what main.js does on the card screen
      else { rec.pick(1); choose(sim, 'p1', 1); }
      continue;
    }
    let fx = Math.cos(sim.t * 0.4) * 0.3, fz = Math.sin(sim.t * 0.4) * 0.3;
    // flee only at sword reach, so monsters (slower since the new season) still come close enough to die and give levels
    for (const e of sim.enemies) { const dx = p.x - e.x, dz = p.z - e.z, d = Math.hypot(dx, dz); if (d < 2 && d > 0.01) { fx += dx / d / d; fz += dz / d / d; } }
    const l = Math.hypot(fx, fz) || 1, before = sim.tick;
    step(sim, { p1: rec.input(fx / l, fz / l, null) }, TICK); rec.after(sim.tick !== before);
  }
  assert.ok(autos > 0, 'the run had at least one timed-out card screen');
  const r = replay(rec.log(), params);
  assert.ok(!r.error, r.error);
  assert.deepEqual([r.t, r.kills, r.level], [Math.floor(sim.t), sim.kills, sim.level]);
});

test('replay() answers malformed logs and params with an error instead of throwing', () => {
  const ok = { seed: 1, mapId: 'greentown', adv: 'adventurer', ground: null, week: 0 };
  const base = { v: 1, runs: [[1, 0, 0]], uses: [], picks: [] };
  for (const log of [{ ...base, uses: [null] }, { ...base, uses: [[]] }, { ...base, uses: [[0, 9]] }, { ...base, runs: [null] }, { ...base, runs: [[2 ** 53, 0, 0]] }]) assert.ok(replay(log, ok).error);
  for (const params of [null, undefined, {}, { ...ok, mapId: 'constructor' }, { ...ok, mapId: '__proto__' }, { ...ok, adv: 'constructor' }, { ...ok, adv: 'alex' }, { ...ok, mapId: 'nope' }, { ...ok, week: undefined }, { ...ok, week: '1' }, { ...ok, mode: 'hard' }, { ...ok, week: 1, mode: 'nightmare' }, { ...ok, week: 1, mode: 'constructor' }]) assert.equal(replay(base, params).error, 'bad ranked run');
});

// ---- week 1 rules: endless runs scored by kills plus survival, and the historical Hard race ----

test('every run is endless with the 2:00:00 limit (week 0 too, owner 2 Nov); the Hard race from week 1', () => {
  const base = { seed: 3, mapId: 'apache', adv: 'adventurer', ground: null };
  const w0 = rankedSim({ ...base, week: 0 });
  assert.deepEqual([w0.endless, w0.hard, w0.endAt], [true, false, RANKED.timeLimit]);
  assert.equal(RANKED.timeLimit, 7200, 'no 45-minute cap: runs can go 2 hours');
  const n1 = rankedSim({ ...base, week: 1 }), h1 = rankedSim({ ...base, week: 1, mode: 'hard' });
  assert.deepEqual([n1.endless, n1.hard, n1.endAt], [true, false, RANKED.timeLimit]);
  assert.deepEqual([h1.endless, h1.hard, h1.endAt], [true, true, RANKED.timeLimit]);
  assert.throws(() => rankedSim({ ...base, week: 0, mode: 'hard' }), /bad ranked run/, 'no Hard race in week 0');
  assert.deepEqual([racesOf(0), racesOf(1), racesOf(7)], [['normal'], ['normal', 'hard'], ['normal', 'hard']]);
  assert.deepEqual([kpmWeek(-1), kpmWeek(0), kpmWeek(1)], [false, false, true]);
  assert.deepEqual([runSeconds(0), runSeconds(1)], [RANKED.timeLimit + 60, RANKED.timeLimit + 60]);
  assert.deepEqual([RANKED.races.normal.entryWei, RANKED.races.hard.entryWei], ['500000000000000000', '1500000000000000000']);
  assert.equal(RANKED.races.normal.entryDmt, RANKED.entryDmt);
});

test('endless Normal and Hard runs (week 1) replay exactly, and a different race or week does not', () => {
  for (const [seed, map, adv, mode] of [[41, 'apache', 'adventurer', 'normal'], [42, 'apache', 'knight', 'hard'], [43, 'greentown', 'ranger', 'hard']]) {
    const { sim, log } = play(seed, map, adv, { maxT: 1e9, week: 1, mode });
    assert.equal(sim.over, 'dead', 'an endless run only ends at death (or the time limit)');
    const params = { seed, mapId: map, adv, ground: null, week: 1, mode };
    const r = replay(log, params);
    assert.ok(!r.error, r.error);
    assert.deepEqual([r.t, r.kills, r.level, r.won, r.timeUp], [Math.floor(sim.t), sim.kills, sim.level, false, false], `${map} ${mode}`);
    const other = replay(log, { ...params, mode: mode === 'hard' ? 'normal' : 'hard' });
    assert.ok(other.error || other.kills !== r.kills || other.t !== r.t, 'the other race is another run');
    // week 0 keeps its own crowd pace (pace 1) and Normal only, so the same inputs are another run there
    const old = replay(log, { ...params, week: 0, mode: 'normal' });
    assert.ok(old.error || old.kills !== r.kills || old.t !== r.t, 'week 0 rules are another run');
  }
});

test('random inputs and choices replay exactly in both races (fuzz)', () => {
  for (let k = 0; k < 4; k++) {
    const mode = k % 2 ? 'hard' : 'normal', seed = 900 + k, rnd = mulberry32(seed), params = { seed, mapId: RANKED.maps[k % RANKED.maps.length], adv: RANKED.advs[k % RANKED.advs.length], ground: null, week: 1 + k, mode };
    const sim = rankedSim(params), rec = new RunRecorder();
    while (!sim.over) {
      if (sim.pending.p1) {
        const c = sim.pending.p1, roll = rnd();
        if (!c.casket && roll < 0.1 && sim.players[0].rerolls > 0) { rec.reroll(); reroll(sim, 'p1'); continue; }
        const i = Math.floor(rnd() * c.choices.length); rec.pick(i); choose(sim, 'p1', i); continue;
      }
      // a jittery stick held for a few ticks, now and then a belt item
      const x = Math.round((rnd() * 2 - 1) * 100) / 100, z = Math.round((rnd() * 2 - 1) * 100) / 100, hold = 1 + Math.floor(rnd() * 20);
      for (let h = 0; h < hold && !sim.over && !sim.pending.p1; h++) {
        const before = sim.tick;
        step(sim, { p1: rec.input(x, z, rnd() < 0.002 ? Math.floor(rnd() * 4) : null) }, TICK);
        rec.after(sim.tick !== before); sim.fx.length = 0;
      }
    }
    const r = replay(rec.log(), params);
    assert.ok(!r.error, r.error);
    assert.deepEqual([r.t, r.kills, r.level], [Math.floor(sim.t), sim.kills, sim.level], `fuzz ${k} ${mode}`);
  }
});

test('the time limit ends an endless run with its score counted (replays to the same end)', () => {
  const saved = RANKED.timeLimit; RANKED.timeLimit = 70; // a short hunt so the test stays quick; the rule is the same
  try {
    const sim = rankedSim({ seed: 5, mapId: 'greentown', adv: 'adventurer', ground: null, week: 1 });
    assert.equal(sim.endAt, 70);
    const { sim: done, log } = play(5, 'greentown', 'adventurer', { maxT: 1e9, week: 1 });
    assert.equal(done.over, 'time'); assert.ok(done.t >= 70 && done.t < 70.1);
    const r = replay(log, { seed: 5, mapId: 'greentown', adv: 'adventurer', ground: null, week: 1 });
    assert.ok(!r.error, r.error);
    assert.deepEqual([r.t, r.kills, r.timeUp, r.won], [70, done.kills, true, false]);
    const longer = structuredClone(log); longer.runs.push([30, 0, 0]);
    assert.match(replay(longer, { seed: 5, mapId: 'greentown', adv: 'adventurer', ground: null, week: 1 }).error, /after the run ended|run too long/);
  } finally { RANKED.timeLimit = saved; }
});

test('combined points order week 1 boards with exact integer KPM as the tiebreak', () => {
  assert.equal(kpmMicro(100, 200), 30000000);
  assert.equal(kpmMicro(1, 7), 8571428); // floor(60/7 * 1e6)
  assert.equal(kpmMicro(5, 0), 0); assert.equal(kpmMicro(-3, 100), 0);
  assert.equal(kpm(452, 600), 45.2);
  // equal rates tie exactly, then more kills, then the earlier finish, then the earlier entry
  assert.equal(kpmMicro(60, 180), kpmMicro(120, 360));
  const rows = [
    { id: 1, wallet: 'a', t: 179, kills: 900, at: 1 },  // the best rate, but under 3:00: listed, never wins
    { id: 2, wallet: 'b', t: 180, kills: 60, at: 5 },   // 20/min
    { id: 3, wallet: 'c', t: 360, kills: 120, at: 9 },  // 20/min, more kills
    { id: 4, wallet: 'd', t: 2700, kills: 900, at: 2 }, // 20/min, the most kills
    { id: 5, wallet: 'e', t: 600, kills: 300, at: 3 },  // 30/min
    { id: 6, wallet: 'f', t: 180, kills: 60, at: 4 },   // ties b exactly, finished earlier
    { id: 7, wallet: 'g', t: 900, kills: 0, at: 0, won: true }, // a win means nothing from week 1
  ];
  const w1 = [...rows].sort(compareRuns(1)).map((r) => r.wallet);
  assert.deepEqual(w1, ['d', 'e', 'g', 'c', 'f', 'b', 'a']);
  // week 0 (endless now): time survived, then kills; a win from the 15:00 runs counts only as its time
  const w0 = [...rows].sort(compareRuns(0)).map((r) => r.wallet);
  assert.deepEqual(w0, ['d', 'g', 'e', 'c', 'f', 'b', 'a']);
  assert.deepEqual(scoreKey(0, rows[6]), [0, 900, 0]);
  assert.deepEqual(scoreKey(1, rows[0]), [0, 1079, kpmMicro(900, 179), 900]);
});

test('the 3:00 minimum: too-short runs and the dev wallet take no prize place (week 1); week 0 had no minimum', () => {
  const dev = '0x9d506ba29843a232409d85e289edece8d6a7b452', noPrize = (w) => w === dev;
  assert.equal(RANKED.minSeconds, 180);
  assert.deepEqual([placeable(1, { t: 179 }), placeable(1, { t: 180 }), placeable(0, { t: 10 })], [false, true, true]);
  const board = [{ wallet: 'x', t: 400 }, { wallet: dev, t: 500 }, { wallet: 'y', t: 300 }, { wallet: 'z', t: 100 }];
  assert.deepEqual(prizePlaces(board, 1, noPrize), [0, -1, 1, -1]);
  assert.deepEqual(prizePlaces(board, 0, noPrize), [0, -1, 1, 2]);
});
