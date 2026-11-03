import test from 'node:test';
import assert from 'node:assert/strict';
import { createSim, step, spawnEnemy, damageEnemy, SHRINE, TICK } from '../src/sim.js';

function quiet(pace = 2) {
  const sim = createSim({ seed: 6, pace });
  sim.spawnAcc = -1e9; sim.bossIndex = 99; sim.eventT = 1e9; sim.shrineT = 1e9;
  sim.players[0].weapons = {};
  return sim;
}

for (const source of ['warp', 'magic']) test(`${source} pulls distant gems toward the player on pace 2`, () => {
  const sim = quiet(), p = sim.players[0];
  const gems = [2, 20, 50, 200].map(d => ({ id: sim.nextId++, x: p.x + d, z: p.z, v: 1 }));
  sim.gems.push(...gems);
  const before = gems.map(g => g.x);
  if (source === 'warp') p.belt = ['warp'];
  else sim.shrines.push({ id: sim.nextId++, x: p.x, z: p.z, kind: 'magic', charge: SHRINE.charge, life: 100 });
  step(sim, { p1: { use: source === 'warp' ? 0 : null } }, TICK);
  gems.forEach((g, i) => assert.ok(g.x < before[i], `gem ${i} moved inward`));
  for (let i = 0; i < 300; i++) step(sim, {}, TICK);
  assert.equal(sim.gems.length, 0, 'every gem reached the player');
  assert.ok(sim.xp >= 4, 'the pulled gems awarded XP');
});

test('pace 1 retains the original distant-gem pull', () => {
  const sim = quiet(1), p = sim.players[0];
  const gem = { id: sim.nextId++, x: p.x + 50, z: p.z, v: 1 };
  sim.gems.push(gem); p.belt = ['warp'];
  const before = gem.x;
  step(sim, { p1: { use: 0 } }, TICK);
  assert.ok(gem.x > before, 'week 0 keeps its original motion');
});

for (const pace of [1, 2]) test(`pace ${pace}: killing a boss ${pace === 2 ? 'cancels' : 'retains'} its pending slam`, () => {
  const sim = quiet(pace), p = sim.players[0];
  spawnEnemy(sim, 'giant', p.x + 8, p.z);
  const boss = sim.enemies[0]; boss.speed = 0; boss.atkCd = 0; sim.rng = () => 0;
  step(sim, {}, TICK);
  assert.equal(sim.hazards.length, 1, 'the boss cast a real slam');
  const meteor = { x: p.x + 100, z: p.z, r: 2, t: 5, max: 5, dmg: 10, meteor: true };
  sim.hazards.push(meteor);
  damageEnemy(sim, boss, boss.hp + 1, p.id);
  assert.equal(sim.hazards.length, pace === 2 ? 1 : 2);
  assert.ok(sim.hazards.includes(meteor), 'unrelated meteors survive');
  const hp = p.hp;
  for (let i = 0; i < 60; i++) step(sim, {}, TICK);
  assert.equal(p.hp < hp, pace === 1, 'only the original pace takes the dead boss slam');
});

test('a killed boss cancels only its own slams', () => {
  const sim = quiet(), p = sim.players[0];
  spawnEnemy(sim, 'giant', p.x + 8, p.z);
  spawnEnemy(sim, 'giant', p.x - 8, p.z);
  sim.enemies.forEach(e => { e.speed = 0; e.atkCd = 0; }); sim.rng = () => 0;
  step(sim, {}, TICK);
  assert.equal(sim.hazards.length, 2);
  const [dead, alive] = sim.enemies;
  damageEnemy(sim, dead, dead.hp + 1, p.id);
  assert.equal(sim.hazards.length, 1);
  assert.equal(sim.hazards[0].by, alive.id, 'the living boss keeps its attack');
});

for (const pace of [1, 2]) test(`pace ${pace}: a boss killed within the tick ${pace === 2 ? 'cannot' : 'can still'} cast a slam`, () => {
  const sim = quiet(pace), p = sim.players[0];
  spawnEnemy(sim, 'giant', p.x + 8, p.z);
  const boss = sim.enemies[0]; boss.hp = 1; boss.speed = 0; boss.atkCd = 0; sim.rng = () => 0;
  p.belt = ['pumpkin'];
  step(sim, { p1: { mx: 0, mz: 0, use: 0 } }, TICK);
  assert.equal(sim.bossKills, 1, 'the pumpkin killed the boss before enemy AI');
  assert.equal(sim.hazards.length, pace === 2 ? 0 : 1);
});
