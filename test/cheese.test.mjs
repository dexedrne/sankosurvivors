import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { FOOD, foodDrop, createSim, spawnEnemy, damageEnemy, step, playerStats } from '../src/sim.js';

const oldFood = (t, u, elite) => {
  let tier = t < 180 ? (u < .7 ? 0 : 1) : t < 480 ? (u < .35 ? 0 : u < .75 ? 1 : 2) : (u < .3 ? 1 : u < .78 ? 2 : 3);
  if (elite) tier = Math.min(3, tier + 1);
  return ['crawdad', 'trout', 'catfish', 'bass'][tier];
};

test('Cheese uses its native icon and the lowest food healing value', () => {
  assert.deepEqual(FOOD.cheese, { heal: 15, item: 'Cheese' });
  assert.ok(existsSync(new URL('../public/assets/ui/items/item_Cheese.png', import.meta.url)));
});

test('pace 2 splits only half the lowest food band into Cheese at every time boundary', () => {
  for (const t of [0, 179.999, 180, 479.999, 480, 1000]) {
    for (const elite of [false, true]) {
      for (const u of [0, .174999, .175, .299999, .3, .349999, .35, .699999, .7, .749999, .75, .779999, .78, .999999]) {
        const before = oldFood(t, u, elite);
        assert.equal(foodDrop(t, u, elite), before, 'existing direct callers keep legacy defaults');
        assert.equal(foodDrop(t, u, elite, 1), before, `pace 1 at ${t}/${u}/${elite}`);
        const cheese = !elite && before === 'crawdad' && u < (t < 180 ? .35 : .175);
        assert.equal(foodDrop(t, u, elite, 2), cheese ? 'cheese' : before, `pace 2 at ${t}/${u}/${elite}`);
      }
    }
  }
});

function killDrop(pace, r) {
  const sim = createSim({ seed: 8, pace }), p = sim.players[0];
  spawnEnemy(sim, 'chicken', p.x + 4, p.z);
  const enemy = sim.enemies[0]; enemy.hp = 1; enemy.elite = false;
  const draws = [1, r, 1, 1]; let calls = 0;
  sim.rng = () => { assert.ok(calls < draws.length, 'no extra random draws'); return draws[calls++]; };
  damageEnemy(sim, enemy, 2, p.id);
  assert.equal(calls, 4, 'critical, drop, coin and casket use their original draws');
  return sim.pickups.map(k => k.kind);
}

test('real enemy drops halve only pace2 food frequency and retain random-call count', () => {
  for (const r of [.009999, .01, .015999, .016, .021999, .022, .024, .0263, .0304, .033999, .034, .9]) {
    const before = killDrop(1, r), after = killDrop(2, r);
    const expected = r >= .022 && r < .028 ? [foodDrop(0, (r - .022) / .006, false, 2)] : r >= .028 && r < .034 ? [] : before;
    assert.deepEqual(after, expected, `drop roll ${r}`);
    assert.ok(after.length <= before.length, 'no extra pickups');
  }
});

test('Cheese overflow is eaten on pickup and retains healing bonuses, HP cap and exact feedback', () => {
  for (const hp of [20, 99, 100]) {
    const sim = createSim({ seed: 8, pace: 2, meta: { fishing: 2 } }), p = sim.players[0];
    sim.spawnAcc = -1e9; sim.eventT = 1e9; p.weapons = {}; p.hp = hp;
    p.belt = ['beer', 'warp', 'pumpkin', 'beer'];
    sim.pickups.push({ id: sim.nextId++, x: p.x, z: p.z, kind: 'cheese' });
    step(sim);
    assert.equal(p.hp, Math.min(p.maxHp, hp + 15 * playerStats(p).heal));
    assert.deepEqual(p.belt, ['beer', 'warp', 'pumpkin', 'beer']);
    assert.equal(sim.pickups.length, 0);
    assert.ok(sim.fx.some(f => f.k === 'use' && f.kind === 'cheese'));
    assert.equal(sim.fx.find(f => f.k === 'get' && f.kind === 'cheese').heal, p.hp - hp, 'feedback reports only actual healing');
  }
});

test('pace 1 food pickup FX retain their original shape', () => {
  const sim = createSim({ seed: 8, pace: 1 }), p = sim.players[0];
  p.weapons = {}; p.hp = 20;
  sim.pickups.push({ id: sim.nextId++, x: p.x, z: p.z, kind: 'crawdad' });
  step(sim);
  const fx = sim.fx.find(f => f.k === 'get');
  assert.deepEqual(fx, { k: 'get', kind: 'crawdad', x: p.x, z: p.z });
});
