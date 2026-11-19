import test from 'node:test';
import assert from 'node:assert/strict';
import { createSim, playerStats, step, snapshot, spawnEnemy } from '../src/sim.js';
import { pauseBuild } from '../src/pause-build.js';

function charge(options = {}) {
  const sim = createSim({ seed: 1, ...options });
  sim.spawnAcc = -1e9;
  sim.bossIndex = 99;
  sim.eventT = sim.shrineT = 1e9;
  const player = sim.players[0];
  player.hp = 30;
  const armor = playerStats(player).armor;
  sim.shrines.push({ id: 100, kind: 'prayer', x: player.x, z: player.z, life: 75, charge: 3.49 });
  step(sim);
  return {sim, player, armor};
}

test('Adventure Prayer shrine heals and grants Harden through the existing effect timer', () => {
  const {sim, player, armor} = charge();
  assert.equal(player.hp, player.maxHp);
  assert(player.inv > 2.9);
  assert.equal(playerStats(player).armor, armor + 2);
  assert(sim.fx.some(f => f.k === 'shrine-done' && f.psalm === 'harden'));
  assert(pauseBuild(sim, player).effects.some(e => e.name === 'Harden' && e.seconds === 15));
  for (let i = 0; i < 450; i++) step(sim);
  assert.equal(playerStats(player).armor, armor);
  assert(!pauseBuild(sim, player).effects.some(e => e.name === 'Harden'));
});

test('Ranked and co-op retain the original Prayer shrine reward', () => {
  for(const options of [{ranked:true},{coop:true,players:[{id:'p1'},{id:'p2'}]}]){
    const {sim, player, armor} = charge(options);
    assert.equal(player.hp, player.maxHp);
    assert(player.inv > 2.9);
    assert.equal(playerStats(player).armor, armor);
    assert(!sim.fx.some(f => f.psalm));
  }
});

function applyBlessing(sim, player, psalm) {
  sim.shrines.push({ id: 101, kind: 'prayer', x: player.x, z: player.z, life: 75, charge: 3.49, psalm });
  assert.equal(snapshot(sim).shrines.at(-1)[6], psalm);
  step(sim);
}

test('an advertised Psalm is granted on charge and replaces a previous Psalm', () => {
  const {sim, player, armor} = charge();
  applyBlessing(sim, player, 'greaterMight');
  assert.equal(playerStats(player).armor, armor);
  assert.equal(player.buffs.greaterMight, 15);
  assert(sim.fx.some(f => f.k === 'shrine-done' && f.psalm === 'greaterMight'));
  applyBlessing(sim, player, 'mysticLore');
  assert.equal(player.buffs.greaterMight, 0);
  const active = pauseBuild(sim, player).effects;
  assert(active.some(e => e.name === 'Mystic Lore' && e.seconds === 15 && e.icon.endsWith('/mystic-lore.png')));
  assert(!active.some(e => e.name === 'Greater Might'));
});

test('offensive Psalms boost only their intended weapon styles', () => {
  function damage(weapon, psalm) {
    const sim = createSim({seed:3});
    const p = sim.players[0];
    sim.spawnAcc=-1e9;sim.bossIndex=99;sim.eventT=sim.shrineT=1e9;sim.rng=()=>.99;
    p.weapons={[weapon]:6}; p.cd[weapon]=0;
    if(psalm) p.buffs[psalm]=15;
    spawnEnemy(sim,'goblin',p.x+1.9,p.z);
    Object.assign(sim.enemies[0],{maxHp:1e6,hp:1e6,speed:0});
    for(let i=0;i<60&&!sim.dmgBy[weapon];i++)step(sim);
    assert(sim.dmgBy[weapon]>0,weapon);
    return sim.dmgBy[weapon];
  }
  assert(damage('katana','greaterMight') > damage('katana'));
  assert(damage('staff','mysticLore') > damage('staff'));
  assert(damage('lighter','mysticLore') > damage('lighter'));
  assert.equal(damage('katana','mysticLore'),damage('katana'));
  assert.equal(damage('staff','greaterMight'),damage('staff'));
  assert.equal(damage('bow','greaterMight'),damage('bow'));
  assert.equal(damage('mortar','mysticLore'),damage('mortar'));
});

test('a naturally spawned Prayer shrine carries the advertised Psalm before charging', () => {
  for (const [id, psalm] of [[3, 'harden'], [4, 'greaterMight'], [5, 'mysticLore']]) {
    const sim=createSim({seed:1});
    sim.spawnAcc=-1e9;
    sim.bossIndex=99;
    sim.eventT=1e9;
    sim.shrineT=0;
    sim.nextId=id;
    sim.rng=()=>.2;
    step(sim);
    assert.equal(sim.shrines[0].kind,'prayer');
    assert.equal(snapshot(sim).shrines[0][6],psalm);
  }
});
