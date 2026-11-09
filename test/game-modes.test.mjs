import test from 'node:test';
import assert from 'node:assert/strict';
import { createSim, step, damageEnemy, spawnEnemy, snapshot, walkable, TICK } from '../src/sim.js';
import { ENEMIES, MAP_BY_ID } from '../src/content.js';
import { merchantEligible } from '../src/merchant.js';
import { readFileSync } from 'node:fs';
import { unpackGround } from '../src/ground-pack.js';

const bosses = s => s.enemies.filter(e => !e.dead && e.hp > 0 && ENEMIES[e.type].boss);
const jump = (s, t) => { s.t = t - TICK; step(s); };
const immortal = s => { for (const p of s.players) { p.inv = 1e6; p.weapons = {}; } return s; };

test('special starts validate variant, boss, casual pace, difficulty and native map', () => {
  for (const options of [{ variant: 'wat' }, { variant: 'boss', trialBoss: 'chicken' }, { variant: 'boss', ranked: true }, { variant: 'raid', pace: 1 }, { variant: 'raid', hard: true }, { variant: 'boss', endless: true }, { variant: 'raid', endless: true }, { variant: 'fun', map: MAP_BY_ID.greentown }, { variant: 'raid', endAt: 10 }]) assert.throws(() => createSim(options), JSON.stringify(options));
});

test('Boss Trials replace all saved loadout bonuses with a disclosed native kit', async () => {
  const modes = await import('../src/game-modes.js');
  assert.deepEqual(Object.keys(modes.VARIANTS), ['normal', 'boss', 'raid', 'fun']);
  assert.deepEqual(modes.TRIAL_BOSSES, ['giant', 'sankson', 'ogre', 'colossus', 'reaper', 'dragon']);
  const s = createSim({ variant: 'boss', trialBoss: 'dragon', meta: { smithing: 5 }, players: [{ id: 'local', name: 'Keeper', adv: 'alex', weapon: 'staff', meta: { coins: 5 }, gear: { head: 'Runite Helmet' }, gearLv: { 'Runite Helmet': 5 } }] });
  const p = s.players[0];
  assert.equal(s.variant, 'boss'); assert.equal(s.trialBoss, 'dragon');
  assert.equal(p.id, 'local'); assert.equal(p.name, 'Keeper'); assert.equal(p.adv, modes.BOSS_KIT.adv);
  assert.deepEqual(p.weapons, { bow: 6, katana: 6 }); assert.deepEqual(p.passives, { boots: 3, armor: 3 });
  assert.deepEqual(p.meta, {}); assert.deepEqual(s.meta, {}); assert.deepEqual(p.gear, {}); assert.deepEqual(p.gearLv, {}); assert.equal(s.vet, 1);
  assert.equal(s.enemies.length, 1); assert.equal(s.enemies[0].type, 'dragon');
  assert.ok(Math.abs(Math.hypot(p.x - s.enemies[0].x, p.z - s.enemies[0].z) - 20) < .01);
  assert.equal(walkable(s, s.enemies[0].x, s.enemies[0].z), true);
});

test('every native trial wins on its selected boss without any XP or loot', () => {
  for (const type of ['giant', 'sankson', 'ogre', 'colossus', 'reaper', 'dragon']) {
    const s = createSim({ variant: 'boss', trialBoss: type });
    assert.equal(s.enemies.length, 1);
    damageEnemy(s, s.enemies[0], 1e9, 'p1');
    assert.equal(s.over, 'win'); assert.equal(s.bossKills, 1); assert.equal(s.kills, 1);
    assert.deepEqual(s.gems, []); assert.deepEqual(s.pickups, []); assert.deepEqual(s.loot, []); assert.equal(s.level, 1);
  }
});

test('Boss Trials have no crowd, events, shrines, merchants or map-time victory', () => {
  const s = immortal(createSim({ variant: 'boss' }));
  jump(s, 1600);
  assert.equal(s.over, null); assert.equal(s.enemies.length, 1); assert.equal(s.event, null); assert.equal(s.eventT, 210);
  assert.deepEqual(s.shrines, []); assert.equal(merchantEligible(s), false); assert.equal(s.level, 1);
});

test('native trial placement avoids blocked and unreachable ground on every arena', () => {
  const ground = unpackGround(readFileSync(new URL('../tools/vercel-api/ground.bin', import.meta.url)));
  for (const map of Object.values(MAP_BY_ID)) for (const seed of [1, 8, 30]) {
    const s = createSim({ variant: 'boss', map, ground, seed }), e = s.enemies[0];
    assert.equal(walkable(s, e.x, e.z), true, `${map.id}/${seed}`);
    assert.ok(Math.hypot(e.x - map.cx, e.z - map.cz) <= map.r);
    const index = (Math.floor(e.z) - s.flow.z0) * 121 + Math.floor(e.x) - s.flow.x0;
    assert.ok(s.flow.dist[index] < 65535, `${map.id}/${seed} reachable`);
  }
});

test('co-op trials prescribe both kits while Raid and Fun retain selected loadouts', () => {
  const players = [{ id: 'a', name: 'A', adv: 'alex', meta: { smithing: 2 }, gear: { head: 'Iron Helmet' } }, { id: 'b', name: 'B', adv: 'wizard', meta: { coins: 3 } }];
  const trial = createSim({ variant: 'boss', coop: true, players });
  for (const p of trial.players) { assert.equal(p.adv, 'ranger'); assert.deepEqual(p.meta, {}); assert.deepEqual(p.gear, {}); assert.deepEqual(p.weapons, { bow: 6, katana: 6 }); }
  assert.deepEqual(players[0].gear, { head: 'Iron Helmet' });
  for (const variant of ['raid', 'fun']) {
    const s = createSim({ variant, coop: true, players, ...(variant === 'fun' ? { map: MAP_BY_ID.oasis } : {}) });
    assert.equal(s.players[0].adv, 'alex'); assert.deepEqual(s.players[0].meta, { smithing: 2 }); assert.deepEqual(s.players[0].gear, { head: 'Iron Helmet' });
    assert.deepEqual(s.players[1].weapons, { staff: 1 }); assert.equal(merchantEligible(s), false);
  }
});

test('raid waves request 1,2,3 native bosses, cap living bosses and skip without backlog', () => {
  const s = immortal(createSim({ variant: 'raid' }));
  jump(s, 180); assert.equal(s.wave, 1); assert.equal(s.nextWave, 360); assert.equal(bosses(s).length, 1);
  jump(s, 360); assert.equal(bosses(s).length, 3);
  jump(s, 540); assert.equal(bosses(s).length, 3); assert.equal(s.wave, 3); assert.equal(s.nextWave, 720);
  for (const e of bosses(s)) damageEnemy(s, e, 1e9, 'p1');
  s.enemies = []; s.pickups = []; s.gems = []; s.pending = {};
  step(s); assert.equal(bosses(s).length, 0);
  jump(s, 720); assert.equal(s.wave, 4); assert.equal(bosses(s).length, 3);
  assert.ok(bosses(s).every(e => s.map.bosses.some(b => b.type === e.type)));
  for (let i = 0; i < 30; i++) step(s);
  assert.ok(s.enemies.some(e => !ENEMIES[e.type].boss));
});

test('raid ignores normal final bosses/map length and wins only at 25 active minutes', () => {
  const s = immortal(createSim({ variant: 'raid' }));
  spawnEnemy(s, s.map.finalBoss, s.map.cx + 20, s.map.cz); const e = s.enemies.at(-1); e.final = true;
  damageEnemy(s, e, 1e9, 'p1'); assert.equal(s.over, null);
  s.enemies = []; s.pickups = []; s.gems = []; s.pending = {};
  jump(s, s.map.length); assert.equal(s.over, null);
  s.pending = { p1: { choices: [{ kind: 'heal', id: 'heal', level: 20 }], left: 20 } };
  const t = s.t; step(s); assert.equal(s.t, t); s.pending = {};
  jump(s, 1499); assert.equal(s.over, null);
  jump(s, 1500); assert.equal(s.over, 'win'); assert.equal(s.wave, 8); assert.equal(s.nextWave, null);
});

test('raid time win yields to death during the same tick', () => {
  const s = createSim({ variant: 'raid' }); const p = s.players[0]; p.hp = 1; p.weapons = {};
  spawnEnemy(s, 'giant', p.x, p.z); s.enemies[0].atkCd = 1e6;
  jump(s, 1500); assert.equal(p.alive, false); assert.equal(s.over, 'dead');
});

test('trial boss kill in a fatal contact tick yields to player death', () => {
  const s = createSim({ variant: 'boss' }), p = s.players[0], e = s.enemies[0];
  Object.assign(p, { hp: 1, weapons: {}, passives: { thorns: 5 } });
  Object.assign(e, { hp: 1, x: p.x, z: p.z, atkCd: 1e6 });
  step(s);
  assert.equal(s.bossKills, 1); assert.equal(p.alive, false); assert.equal(s.over, 'dead');
});

test('seeded co-op raids agree on waves and use existing party HP scaling', () => {
  const options = { variant: 'raid', coop: true, seed: 808, players: [{ id: 'a' }, { id: 'b' }] };
  const a = immortal(createSim(options)), b = immortal(createSim(options));
  for (const t of [180, 360, 540, 720]) { jump(a, t); jump(b, t); assert.deepEqual(snapshot(a), snapshot(b)); }
  const solo = immortal(createSim({ variant: 'raid', seed: 808 })); jump(solo, 180);
  assert.equal(bosses(a)[0].maxHp, bosses(solo)[0].maxHp * 1.55);
});

test('Fun is Oasis Endless with only native slimers and bounded nonrepeating bosses', () => {
  const s = immortal(createSim({ variant: 'fun', map: MAP_BY_ID.oasis, seed: 20 }));
  assert.equal(s.endless, true); assert.equal(s.nextWave, 240);
  jump(s, 239); assert.equal(bosses(s).length, 0);
  const seen = [];
  for (let i = 0; i < 6; i++) {
    s.enemies = []; s.pending = {}; s.pickups = []; s.gems = [];
    const at = s.nextWave; jump(s, at);
    assert.equal(s.wave, i + 1); assert.equal(bosses(s).length, 1); assert.ok(s.nextWave >= at + 180 && s.nextWave <= at + 300);
    const type = bosses(s)[0].type; assert.notEqual(type, seen.at(-1)); seen.push(type);
    assert.ok(s.enemies.every(e => ENEMIES[e.type].boss || ['slimer', 'mslimer'].includes(e.type)));
    assert.equal(s.over, null); assert.equal(s.event, null);
  }
  while (bosses(s).length < 3) spawnEnemy(s, 'giant', s.map.cx + 20, s.map.cz);
  jump(s, s.nextWave); assert.equal(bosses(s).length, 3);
});

test('mode snapshot metadata is absent for ordinary simulations', () => {
  const normal = createSim(), explicit = createSim({ variant: 'normal' });
  assert.deepEqual(snapshot(normal), snapshot(explicit)); assert.equal(normal.rng(), explicit.rng());
  for (const key of ['variant', 'trialBoss', 'wave', 'nextWave']) assert.equal(Object.hasOwn(normal, key), false);
  const s = createSim({ variant: 'raid' }), snap = snapshot(s);
  assert.equal(snap.variant, 'raid'); assert.equal(snap.wave, 0); assert.equal(snap.nextWave, 180);
  assert.equal(snapshot(createSim({ variant: 'boss', trialBoss: 'ogre' })).trialBoss, 'ogre');
});
