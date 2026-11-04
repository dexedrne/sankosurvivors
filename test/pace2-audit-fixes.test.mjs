import test from 'node:test';
import assert from 'node:assert/strict';
import { createSim, step, choose, skipLevel, reroll, autoChoice, spawnEnemy, playerStats } from '../src/sim.js';
import { MAX_WEAPON_LEVEL, MAX_PASSIVE_LEVEL } from '../src/content.js';

function quiet(pace = 2, players) {
  const sim = createSim({ seed: 6, pace, players });
  sim.spawnAcc = -1e9; sim.bossIndex = 99; sim.eventT = 1e9; sim.shrineT = 1e9;
  return sim;
}
function xp(sim, ...amounts) {
  const p = sim.players[0];
  sim.gems.push(...amounts.map(v => ({ id: sim.nextId++, x: p.x, z: p.z, v })));
  step(sim);
}

for (const pace of [1, 2]) test(`pace ${pace}: 100 XP retains ${pace === 2 ? 'all five' : 'the legacy single'} rewards`, () => {
  const sim = quiet(pace);
  xp(sim, 100);
  assert.equal(sim.level, 6);
  let cards = 0;
  while (sim.pending.p1 && cards < 10) { cards++; choose(sim, 'p1', 0); }
  assert.equal(cards, pace === 2 ? 5 : 1);
});

test('queued levels survive repeated bursts, reroll, skip, timeout and casket choices for every living player', () => {
  const sim = quiet(2, [{ id: 'p1' }, { id: 'p2' }, { id: 'dead' }]);
  sim.players[2].alive = false;
  xp(sim, 100, 100);
  assert.ok(!sim.pending.dead);
  const earned = sim.level - 1, time = sim.t;
  for (const p of sim.players.slice(0, 2)) {
    p.casketQ.push('Iron Katana', 'Steel Katana');
    assert.ok(reroll(sim, p.id));
    for (let i = 0; i < earned; i++) {
      const pend = sim.pending[p.id];
      assert.ok(pend && !pend.casket, `level ${i + 1} for ${p.id}`);
      if (i % 3 === 0) assert.ok(skipLevel(sim, p.id));
      else if (i % 3 === 1) assert.ok(choose(sim, p.id, autoChoice(pend)));
      else { pend.left = 0; step(sim); }
    }
    assert.ok(sim.pending[p.id]?.casket, 'caskets wait for all earned levels');
    assert.equal(skipLevel(sim, p.id), false, 'a casket cannot consume a level skip');
    choose(sim, p.id, 1);
    assert.ok(sim.pending[p.id]?.casket);
    sim.pending[p.id].left = 0; step(sim);
    assert.ok(!sim.pending[p.id]);
  }
  assert.equal(sim.t, time, 'the world remains paused through every reward');
});

test('queued cards roll after the previous pick and never offer upgrades beyond capacity', () => {
  const sim = quiet(), p = sim.players[0];
  // Leave one free weapon/passive slot and one rank on existing items.
  p.weapons = { katana: MAX_WEAPON_LEVEL - 1, bow: MAX_WEAPON_LEVEL, axe: MAX_WEAPON_LEVEL };
  p.passives = { might: MAX_PASSIVE_LEVEL - 1, haste: MAX_PASSIVE_LEVEL, area: MAX_PASSIVE_LEVEL };
  xp(sim, 1000);
  const earned = sim.level - 1;
  let cards = 0;
  while (sim.pending.p1 && cards < 100) {
    const st = playerStats(p), pend = sim.pending.p1;
    for (const c of pend.choices) {
      if (c.kind === 'weapon' || c.kind === 'passive') {
        const owned = c.kind === 'weapon' ? p.weapons : p.passives;
        const max = c.kind === 'weapon' ? MAX_WEAPON_LEVEL : MAX_PASSIVE_LEVEL;
        const slots = c.kind === 'weapon' ? st.weaponSlots : st.passiveSlots;
        assert.equal(c.from, owned[c.id] || 0, 'card reflects current build');
        assert.ok(c.level <= max && (owned[c.id] || Object.keys(owned).length < slots));
      }
    }
    choose(sim, p.id, autoChoice(pend)); cards++;
    assert.ok(Object.keys(p.weapons).length <= playerStats(p).weaponSlots);
    assert.ok(Object.keys(p.passives).length <= playerStats(p).passiveSlots);
  }
  assert.equal(cards, earned);
});

for (const pace of [1, 2]) test(`pace ${pace}: katana-killed chicken ${pace === 2 ? 'cannot' : 'still can'} move or contact`, () => {
  const sim = quiet(pace), p = sim.players[0];
  spawnEnemy(sim, 'chicken', p.x + 0.2, p.z);
  const e = sim.enemies[0], at = [e.x, e.z], hp = p.hp;
  e.hp = 1; p.cd.katana = 0;
  step(sim);
  assert.equal(sim.kills, 1);
  assert.equal(p.hp < hp, pace === 1);
  if (pace === 2) assert.deepEqual([e.x, e.z], at);
});

for (const pace of [1, 2]) test(`pace ${pace}: forward spawn follows ${pace === 2 ? 'movement' : 'attack facing'}`, () => {
  function spawn(weapon) {
    const sim = quiet(pace), p = sim.players[0];
    p.weapons = { [weapon]: 1 }; p.cd[weapon] = 0;
    spawnEnemy(sim, 'chicken', p.x, p.z - 2);
    sim.enemies[0].hp = 1e6;
    sim.rng = () => 0.5; sim.spawnAcc = 1;
    step(sim, { p1: { mx: 0, mz: 1 } });
    return sim.enemies[1].z - p.z;
  }
  assert.ok(spawn('bow') > 20);
  assert.equal(spawn('katana') > 20, pace === 2);
});

test('a corpse killed by thorns during enemy AI no longer pushes the remaining crowd', () => {
  function survivor(withCorpse) {
    const sim = quiet(), p = sim.players[0];
    p.weapons = {}; p.passives.thorns = 1;
    if (withCorpse) { spawnEnemy(sim, 'chicken', p.x + 0.2, p.z); sim.enemies[0].hp = 1; }
    spawnEnemy(sim, 'chicken', p.x + 0.7, p.z);
    const living = sim.enemies.at(-1); living.hp = 100; living.speed = 0;
    step(sim);
    if (withCorpse) assert.equal(sim.kills, 1, 'thorns killed the first chicken');
    return living.x - p.x;
  }
  assert.equal(survivor(true), survivor(false));
});
