import test from 'node:test';
import assert from 'node:assert/strict';
import { createSim, spawnEnemy, step, TICK } from '../src/sim.js';
import { MAPS } from '../src/content.js';

function fresh(options = {}) {
  const sim = createSim({ seed: 1107, ...options });
  sim.spawnAcc = -1e9; sim.bossIndex = 99; sim.eventT = sim.shrineT = 1e9;
  const p = sim.players[0]; p.inv = 1e9;
  return { sim, p };
}
function target(sim, type, x, z) {
  spawnEnemy(sim, type, x, z);
  const e = sim.enemies.at(-1); e.hp = e.maxHp = 1e9; e.rise = 1e9;
  return e;
}
function attack(weapon, distance, { pace = 2, level = 1, evolved = false, area = 0, type = 'dragon' } = {}) {
  const { sim, p } = fresh({ startWeapon: weapon, pace });
  p.x = p.z = 0; p.weapons[weapon] = level; p.evo[weapon] = evolved;
  p.passives.area = area; p.cd[weapon] = 0; sim.rng = () => .9;
  const e = target(sim, type, 0, distance);
  step(sim);
  return { damage: e.maxHp - e.hp, sim, p };
}

// A large boss already inside the hit volume must not need a second enemy to trigger melee.
for (const [weapon, level, distance, damage] of [
  ['katana', 1, 4.95, 9], ['katana', 6, 6.7, 25],
  ['greatsword', 1, 5.25, 15], ['greatsword', 6, 6.75, 40],
  ['pickaxe', 1, 5.7, 18], ['pickaxe', 6, 8.2, 46],
]) test(`${weapon} L${level} hits an isolated Dragon by its body edge only on pace2`, () => {
  assert.equal(attack(weapon, distance, { level }).damage, damage);
  assert.equal(attack(weapon, distance, { level, pace: 1 }).damage, 0);
});

for (const [weapon, edge, damage] of [
  ['katana', 3 + 2.4, 9], ['greatsword', 3.3 + 2.4, 15], ['pickaxe', 3.5 + 2.4, 18],
]) test(`${weapon} accepts the exact Dragon edge and rejects a target outside it`, () => {
  assert.equal(attack(weapon, edge).damage, damage);
  assert.equal(attack(weapon, edge + .01).damage, 0);
});

for (const [weapon, inside, outside, damage] of [
  ['katana', 10.7, 10.8, 40], ['greatsword', 10.4, 10.5, 56], ['pickaxe', 14.9, 15.1, 73],
]) test(`${weapon} acquisition follows evolved range and Cape area`, () => {
  assert.equal(attack(weapon, inside, { level: 6, evolved: true, area: 4 }).damage, damage);
  assert.equal(attack(weapon, outside, { level: 6, evolved: true, area: 4 }).damage, 0);
});

test('ordinary melee hits remain intact and equal-distance Katana targets keep their first-target aim', () => {
  for (const weapon of ['katana', 'greatsword', 'pickaxe']) assert.ok(attack(weapon, 2, { type: 'goblin' }).damage > 0);
  const { sim, p } = fresh(); p.x = p.z = 0; p.cd.katana = 0; sim.rng = () => .9;
  const first = target(sim, 'dragon', 0, 4.95), second = target(sim, 'dragon', 0, -4.95);
  step(sim);
  assert.equal(first.maxHp - first.hp, 9); assert.equal(second.maxHp - second.hp, 0);
});

test('ranged center-distance acquisition and nearest-target ties remain unchanged', () => {
  const { sim, p } = fresh({ startWeapon: 'bow' }); p.x = p.z = 0; p.cd.bow = 0;
  target(sim, 'dragon', 0, 19); step(sim); assert.equal(sim.proj.length, 0);
  sim.enemies = []; p.cd.bow = 0;
  target(sim, 'goblin', 0, 10); target(sim, 'goblin', 0, -10);
  step(sim); assert.equal(sim.proj.length, 1); assert.ok(sim.proj[0].vz > 0);
});

function endless(mapId, options = {}) {
  const { sim, p } = fresh({ map: MAPS.find(m => m.id === mapId), endless: true, ...options });
  p.weapons = {}; return sim;
}
function at(sim, time) { sim.t = time - TICK; step(sim); }

// Literal intervals at independently chosen elapsed times catch early/missing ramp and floor errors.
for (const mapId of ['greentown', 'world']) {
  test(`${mapId} first Endless return starts at its own normal-run boundary`, () => {
    const sim = endless(mapId); at(sim, sim.map.length - 1);
    assert.equal(sim.endlessCycle, 0);
    at(sim, sim.map.length);
    assert.equal(sim.endlessCycle, 1); assert.equal(sim.endlessBossT, 90);
    assert.equal(sim.enemies.at(-1).type, sim.map.bosses[0].type);
    assert.ok(Math.abs(sim.enemies.at(-1).maxHp - 900 * (1 + sim.map.length / 240) * 1.5) < 1e-7);
  });
  for (const [elapsed, interval] of [[119, 90], [120, 85], [1079, 50], [1080, 45], [3600, 45]]) {
    test(`${mapId} casual Endless return at +${elapsed}s waits ${interval}s`, () => {
      const sim = endless(mapId); sim.endlessCycle = 1;
      at(sim, sim.map.length + elapsed);
      assert.equal(sim.endlessCycle, 2); assert.equal(sim.endlessBossT, interval);
      assert.equal(sim.enemies.at(-1).type, sim.map.bosses[1].type);
      sim.enemies = []; sim.endlessBossT = TICK * 2;
      step(sim); assert.equal(sim.endlessCycle, 2);
      step(sim); assert.equal(sim.endlessCycle, 3);
    });
  }
}

test('six live bosses hold a return at zero without RNG, rotation consumption or spawn debt', () => {
  const sim = endless('greentown'); sim.t = sim.map.length + 1200;
  const p = sim.players[0];
  for (const type of ['colossus', 'colossus', 'ogre', 'ogre', 'ogre', 'ogre']) target(sim, type, p.x + 20, p.z);
  sim.endlessBossT = TICK / 2; sim.endlessCycle = 4;
  let rolls = 0; sim.rng = () => { rolls++; return .9; };
  for (let i = 0; i < 120; i++) step(sim);
  assert.equal(sim.endlessBossT, 0); assert.equal(sim.endlessCycle, 4); assert.equal(rolls, 0);
  assert.equal(sim.enemies.length, 6);
  sim.enemies[0].dead = true;
  step(sim);
  assert.equal(sim.endlessCycle, 5); assert.equal(sim.enemies.length, 6); assert.equal(sim.endlessBossT, 45);
  const rollsAfterReturn = rolls; step(sim);
  assert.equal(sim.endlessCycle, 5); assert.equal(rolls, rollsAfterReturn);
});

test('zero-HP bosses and ordinary enemies do not occupy Endless boss slots', () => {
  const sim = endless('greentown'); sim.t = sim.map.length + 1200;
  const p = sim.players[0];
  for (let i = 0; i < 5; i++) target(sim, 'ogre', p.x + 20, p.z);
  target(sim, 'dragon', p.x + 20, p.z).hp = 0;
  for (let i = 0; i < 8; i++) target(sim, 'goblin', p.x + 20, p.z);
  step(sim); assert.equal(sim.endlessCycle, 1); assert.equal(sim.endlessBossT, 45);
});

test('normal scheduled bosses still spawn when six bosses are alive', () => {
  const sim = endless('greentown'); const p = sim.players[0];
  for (let i = 0; i < 6; i++) target(sim, 'ogre', p.x + 20, p.z);
  sim.bossIndex = 0; at(sim, sim.map.bosses[0].t);
  assert.equal(sim.bossIndex, 1); assert.equal(sim.enemies.length, 7); assert.equal(sim.endlessCycle, 0);
});

for (const options of [{ pace: 1 }, { pace: 2, ranked: true }]) test(`legacy Endless cadence and uncapped returns remain for ${JSON.stringify(options)}`, () => {
  const sim = endless('world', options); sim.t = sim.map.length + 3600;
  const p = sim.players[0];
  for (let i = 0; i < 6; i++) target(sim, 'ogre', p.x + 20, p.z);
  step(sim);
  assert.equal(sim.endlessCycle, 1); assert.equal(sim.endlessBossT, 90); assert.equal(sim.enemies.length, 7);
});
