import test from 'node:test';
import assert from 'node:assert/strict';
import { createSim, step, TICK, snapshot, choose, WORLD, rollChoices, applyChoice, playerStats, spawnEnemy } from '../src/sim.js';
import { MAPS } from '../src/content.js';
import { ENEMIES, WEAPONS, WEAPON_IDS, weaponModelPath, ARMOR_TIERS, ADVENTURERS, passiveItem, weaponItem, itemIconFile, PASSIVES, PASSIVE_IDS, gemItem } from '../src/content.js';
import { existsSync } from 'node:fs';

const run = (sim, seconds, inputs = {}) => { for (let i = 0; i < seconds / TICK; i++) { step(sim, inputs, TICK); for (const id of Object.keys(sim.pending)) choose(sim, id, 0); if (sim.over) break; } };

test('player moves freely: every map opens the whole world (the ground decides where you can go)', () => {
  const sim = createSim({ seed: 3 });
  const x0 = sim.players[0].x;
  run(sim, 30, { p1: { mx: 1, mz: 0 } });
  const p = sim.players[0];
  assert.ok(p.x > x0 + 70, 'ran well past the old 70-unit edge, x=' + p.x.toFixed(1));
  assert.ok(Math.hypot(p.x - sim.map.cx, p.z - sim.map.cz) <= sim.map.r + 0.01);
});

test('enemies spawn, chase and the katana kills things', () => {
  const sim = createSim({ seed: 5 });
  run(sim, 25);
  assert.ok(sim.kills > 5, 'kills ' + sim.kills);
  assert.ok(sim.level >= 2);
});

test('standing still forever eventually kills a lone player (the run ends)', () => {
  const sim = createSim({ seed: 9, players: [{ id: 'p1', name: 'x', weapon: 'pickaxe' }] });
  run(sim, 900);
  assert.ok(sim.over === 'dead' || sim.over === 'win');
});

test('level up pauses the sim until the player chooses', () => {
  const sim = createSim({ seed: 1 });
  sim.gems.push({ id: 999, x: sim.players[0].x, z: sim.players[0].z, v: 50, vx: 0, vz: 0 });
  step(sim, {}, TICK);
  assert.ok(sim.pending.p1, 'choices rolled');
  const t = sim.t; step(sim, {}, TICK); assert.equal(sim.t, t, 'paused');
  assert.equal(sim.pending.p1.choices.length, 3);
  choose(sim, 'p1', 1);
  assert.equal(sim.pending.p1, undefined);
});

test('co-op: 4 players, shared level, each gets choices, snapshot is compact', () => {
  const sim = createSim({ seed: 2, players: ['a', 'b', 'c', 'd'].map((id) => ({ id, name: id })) });
  sim.gems.push({ id: 999, x: sim.players[0].x, z: sim.players[0].z, v: 99, vx: 0, vz: 0 });
  step(sim, {}, TICK);
  assert.equal(Object.keys(sim.pending).length, 4);
  for (const id of Object.keys(sim.pending)) choose(sim, id, 0);
  run(sim, 60);
  const snap = snapshot(sim);
  assert.equal(snap.players.length, 4);
  assert.ok(JSON.stringify(snap).length < 120000);
});

test('deterministic for the same seed', () => {
  const a = createSim({ seed: 42 }), b = createSim({ seed: 42 });
  run(a, 40, { p1: { mx: 0.5, mz: 0.5 } }); run(b, 40, { p1: { mx: 0.5, mz: 0.5 } });
  assert.equal(a.kills, b.kills); assert.equal(a.enemies.length, b.enemies.length);
});

test('every model referenced by the game data exists on disk', () => {
  const missing = [];
  for (const [k, e] of Object.entries(ENEMIES)) {
    if (e.model) { if (!existsSync('public/assets/models/' + e.model)) missing.push(e.model); }
    else {
      const slots = { head: 'Head', chest: 'Chest', hands: 'Hands', legs: 'Legs', feet: 'Feet' };
      for (const [k2, folder] of Object.entries(slots)) if (e.rig[k2]) { const f = `public/assets/models/playerCharacter/${folder}/Clothing/${e.rig[k2]}.glb`; if (!existsSync(f)) missing.push(f); }
    }
  }
  const F = { head: 'Head', chest: 'Chest', hands: 'Hands', legs: 'Legs', feet: 'Feet' };
  for (const a of ADVENTURERS) for (const [slot, name] of Object.entries(a.look.armor)) { const f = `public/assets/models/playerCharacter/${F[slot]}/Clothing/${name}.glb`; if (!existsSync(f)) missing.push(f); if (a.look.hair && !existsSync(`public/assets/models/playerCharacter/Head/Styles/${a.look.hair}.glb`)) missing.push('hair ' + a.look.hair); }
  // armor tiers worn by the player, and every icon the UI asks for
  for (const t of ARMOR_TIERS) for (const [folder, n] of [['Head', 'Helmet'], ['Chest', 'Chestplate'], ['Hands', 'Gauntlets'], ['Legs', 'Leggings'], ['Feet', 'Boots']]) { const f = `public/assets/models/playerCharacter/${folder}/Clothing/${t} ${n}.glb`; if (!existsSync(f)) missing.push(f); }
  const icons = [];
  for (const id of PASSIVE_IDS) for (let l = 1; l <= 5; l++) icons.push(passiveItem(id, l));
  for (const id of WEAPON_IDS) for (let l = 1; l <= 6; l++) icons.push(weaponItem(id, l));
  for (const v of [1, 3, 8, 30, 100]) icons.push(gemItem(v));
  icons.push('Cooked Bubba Bass', 'Gold');
  for (const n of new Set(icons)) { const f = 'public/assets/ui/items/' + itemIconFile(n); if (!existsSync(f)) missing.push(f); }
  for (const id of WEAPON_IDS) for (let l = 1; l <= 6; l++) {
    if (!WEAPONS[id].model) continue; // thrown or worn effects without a hand model (baseball, lighter)
    const p = weaponModelPath(id, l); if (!existsSync('public/assets/models/' + p)) missing.push(p);
    if (WEAPONS[id].arrowModel) { const a = weaponModelPath(id, l, 'arrowModel'); if (!existsSync('public/assets/models/' + a)) missing.push(a); }
  }
  assert.deepEqual([...new Set(missing)], []);
});

test('every map: pools and bosses use real enemies, the final boss is scheduled, and a run works', () => {
  for (const m of MAPS) {
    for (const e of m.pool) assert.ok(ENEMIES[e.type], `${m.id}: unknown enemy ${e.type}`);
    for (const b of m.bosses) assert.ok(ENEMIES[b.type]?.boss, `${m.id}: bad boss ${b.type}`);
    assert.ok(m.bosses.some((b) => b.type === m.finalBoss), `${m.id}: final boss never spawns`);
    assert.ok(m.pool.some((e) => e.t === 0), `${m.id}: nothing spawns at the start`);
    const sim = createSim({ seed: 11, map: m });
    run(sim, 40, { p1: { mx: 1, mz: 0.3 } });
    assert.ok(Math.hypot(sim.players[0].x - m.cx, sim.players[0].z - m.cz) <= m.r + 0.01);
    assert.ok(sim.kills > 0 || sim.enemies.length > 0, `${m.id}: nothing happened`);
  }
});

test('evolution: maxed weapon + its passive offers the evolution first, and it hits harder', () => {
  const sim = createSim({ seed: 4 }); const p = sim.players[0];
  p.weapons.katana = 6; p.passives.might = 1;
  const ch = rollChoices(sim, p);
  assert.equal(ch[0].kind, 'evolve'); assert.equal(ch[0].id, 'katana');
  applyChoice(sim, p, ch[0]); assert.ok(p.evo.katana);
  const base = createSim({ seed: 4 }); base.players[0].weapons.katana = 6; base.players[0].passives.might = 1;
  run(sim, 25); run(base, 25);
  assert.ok(sim.kills >= base.kills, `evolved ${sim.kills} vs plain ${base.kills}`);
});

test('power-ups go on the belt and work when used: beer speeds you up, pumpkin blasts, chest gives a choice', () => {
  const sim = createSim({ seed: 6 }); const p = sim.players[0];
  sim.enemies.push({ id: 900, type: 'goblin', x: p.x + 3, z: p.z, hp: 5, maxHp: 5, face: 0, hit: 0, kx: 0, kz: 0, cdHit: {}, speed: 0 });
  for (const kind of ['beer', 'pumpkin', 'warp']) sim.pickups.push({ id: sim.nextId++, x: p.x, z: p.z, kind });
  step(sim, {}, TICK); step(sim, {}, TICK);
  assert.deepEqual(p.belt, ['beer', 'pumpkin', 'warp'], 'kept on the belt');
  step(sim, { p1: { mx: 0, mz: 0, use: 0 } }, TICK); step(sim, { p1: { mx: 0, mz: 0, use: 0 } }, TICK); step(sim, { p1: { mx: 0, mz: 0, use: 0 } }, TICK);
  assert.equal(p.belt.length, 0);
  assert.ok(p.buffs.speed > 0, 'beer buff'); assert.equal(sim.enemies.filter((e) => e.id === 900).length, 0, 'pumpkin killed it');
  sim.pickups.push({ id: sim.nextId++, x: p.x, z: p.z, kind: 'chest' }); step(sim, {}, TICK);
  assert.ok(sim.pending.p1, 'chest opened a level-up');
});

test('meta skills and hard mode change the numbers', () => {
  const a = createSim({ seed: 8 }), b = createSim({ seed: 8, meta: { combat: 5, smithing: 5 }, hard: true });
  assert.ok(playerStats(b.players[0]).might > playerStats(a.players[0]).might);
  assert.ok(playerStats(b.players[0]).maxHp > playerStats(a.players[0]).maxHp);
  run(a, 30); run(b, 30);
  assert.ok(b.enemies.length >= a.enemies.length - 5);
});

// ---- ground: cliffs, mountains and water block movement; monsters find their way around --------------------------
import { buildTerrain, classify, T_ROCK, T_WATER, T_LAND, T_ROAD } from '../src/terrain.js';
import { walkable } from '../src/sim.js';

function wallGround(n = 513, wallX = 370, gapZ = null) {
  const blocked = new Uint8Array(n * n);
  for (let j = 0; j < n; j++) if (gapZ === null || Math.abs(j - gapZ) > 2) blocked[j * n + wallX] = blocked[j * n + wallX + 1] = 1;
  return { n, blocked };
}

test('the player cannot walk through a cliff and slides along it', () => {
  const sim = createSim({ seed: 3, ground: wallGround() });
  run(sim, 8, { p1: { mx: 1, mz: 0.3 } });
  const p = sim.players[0];
  assert.ok(p.x < 370, 'stopped at the wall, x=' + p.x.toFixed(2));
  assert.ok(p.z > sim.map.cz + 2, 'slid along it, z=' + p.z.toFixed(2));
});

test('monsters walk around a wall through the gap instead of piling against it', () => {
  const ground = wallGround(513, 370, 330);
  const sim = createSim({ seed: 4, ground });
  sim.enemies.length = 0; sim.spawnAcc = -1e9; // no random spawns
  const p = sim.players[0];
  sim.enemies.push({ id: 999, type: 'goblin', x: 380, z: p.z, hp: 1e6, maxHp: 1e6, face: 0, hit: 0, kx: 0, kz: 0, cdHit: {}, speed: 3 });
  const e = sim.enemies[0];
  let crossed = false;
  for (let i = 0; i < 40 / TICK && !crossed; i++) { step(sim, {}, TICK); sim.spawnAcc = -1e9; for (const id of Object.keys(sim.pending)) choose(sim, id, 0); if (e.x < 369) crossed = true; assert.ok(walkable(sim, e.x, e.z), 'monster stood in a wall'); }
  assert.ok(crossed, 'monster got around the wall, at ' + e.x.toFixed(1) + ',' + e.z.toFixed(1));
});

test('spawns never land inside cliffs or water', () => {
  const sim = createSim({ seed: 8, ground: wallGround(513, 380) });
  run(sim, 40);
  for (const e of sim.enemies) assert.ok(walkable(sim, e.x, e.z));
  // and nothing spawns on the far side of a wall it cannot get around
  assert.ok(sim.enemies.every((e) => e.x < 380), 'a monster spawned behind the wall');
});

test('terrain: minimap colours are read as the right kinds of ground', () => {
  assert.equal(classify(55, 128, 180), T_WATER);   // sea
  assert.equal(classify(86, 89, 90), T_ROCK);      // ridge and mountain grey
  assert.equal(classify(89, 90, 77), T_ROAD);      // road grey (yellower)
  assert.equal(classify(104, 121, 72), T_LAND);    // Greentown grass
});

test('terrain: a grey ridge between a plateau and a valley rises above both and blocks the way', () => {
  const S = 64, rgba = new Uint8Array(S * S * 4);
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const o = (j * S + i) * 4, ridge = i >= 30 && i <= 34;
    const c = ridge ? [86, 89, 90] : [104, 121, 72];
    rgba[o] = c[0]; rgba[o + 1] = c[1]; rgba[o + 2] = c[2]; rgba[o + 3] = 255;
  }
  const props = [];
  for (let j = 4; j < 60; j += 6) { props.push({ x: 10, y: 3.3, z: j }); props.push({ x: 50, y: 7, z: j }); }
  const T = buildTerrain({ rgba, S, props });
  const h = (x, z) => T.h[z * T.n + x];
  assert.ok(Math.abs(h(10, 30) - 3.3) < 0.6, 'valley ' + h(10, 30));
  assert.ok(Math.abs(h(50, 30) - 7) < 0.6, 'plateau ' + h(50, 30));
  assert.ok(h(32, 30) > 9, 'ridge top ' + h(32, 30));
  assert.ok(T.blocked[30 * T.n + 32], 'ridge blocks');
  assert.ok(!T.blocked[30 * T.n + 20] && !T.blocked[30 * T.n + 45]);
});

// ---- gear, caskets, rerolls, endless, quests ----------------------------------------------------------------------
import { GEAR, GEAR_SETS, gearBonus, rollCasket, QUESTS, REROLLS_PER_RUN } from '../src/content.js';
import { reroll, skipLevel, damageEnemy } from '../src/sim.js';

test('worn gear changes the stats, and a full set adds its bonus', () => {
  const plain = createSim({ seed: 1 }).players[0];
  const geared = createSim({ seed: 1, players: [{ id: 'p1', gear: { head: 'Adamantite Helmet', chest: 'Adamantite Chestplate', hands: 'Adamantite Gauntlets', legs: 'Adamantite Leggings', feet: 'Adamantite Boots', back: 'Cape' } }] }).players[0];
  const a = playerStats(plain), b = playerStats(geared);
  assert.ok(b.armor >= a.armor + 3 + 1 - 1e-9, 'armor ' + b.armor);
  assert.equal(b.maxHp, a.maxHp + 40);
  assert.ok(b.speed > a.speed && b.growth > a.growth);
  assert.deepEqual(gearBonus({ head: 'Wizard Hat', chest: 'Wizard Robe' }).sets, []);
  assert.deepEqual(gearBonus({ head: 'Wizard Hat', chest: 'Wizard Robe', legs: 'Wizard Skirt' }).sets, ['Wizard']);
});

test('gear, casket and quest items all exist with icons and models', () => {
  const F = { head: 'Head', chest: 'Chest', hands: 'Hands', legs: 'Legs', feet: 'Feet', back: 'Back' };
  for (const [n, g] of Object.entries(GEAR)) {
    assert.ok(existsSync(new URL(`../public/assets/ui/items/${itemIconFile(n)}`, import.meta.url)), 'icon ' + n);
    assert.ok(existsSync(new URL(`../public/assets/models/playerCharacter/${F[g.slot]}/Clothing/${n}.glb`, import.meta.url)), 'model ' + n);
  }
  for (const q of QUESTS) if (q.item) assert.ok(GEAR[q.item], 'quest item ' + q.item);
  for (const s of Object.keys(GEAR_SETS)) assert.ok(Object.values(GEAR).filter((g) => g.set === s).length >= GEAR_SETS[s].pieces, 'set ' + s);
  let seed = 7; const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 200; i++) assert.ok(GEAR[rollCasket(rng, i % 6, i % 2 === 0)]);
});

test('bosses drop a reward casket, and picking it up keeps an item', () => {
  const sim = createSim({ seed: 2 });
  const p = sim.players[0];
  const giant = { id: 900, type: 'giant', x: p.x + 1, z: p.z, hp: 1, maxHp: 1, face: 0, hit: 0, kx: 0, kz: 0, cdHit: {}, speed: 0 };
  sim.enemies.push(giant);
  damageEnemy(sim, giant, 10, 'p1');
  const casket = sim.pickups.find((k) => k.kind === 'casket');
  assert.ok(casket, 'casket dropped');
  casket.x = p.x; casket.z = p.z; delete sim.pending.p1;
  run(sim, 0.2);
  assert.equal(sim.loot.length, 1); assert.ok(GEAR[sim.loot[0]]);
});

test('rerolls are limited per run; skipping a level gives a coin', () => {
  const sim = createSim({ seed: 3 });
  sim.xp = sim.xpNeed; sim.gems.push({ id: 1, x: sim.players[0].x, z: sim.players[0].z, v: 1, pulled: true });
  for (let i = 0; i < 30 && !sim.pending.p1; i++) step(sim, {}, TICK);
  assert.ok(sim.pending.p1);
  for (let i = 0; i < REROLLS_PER_RUN; i++) assert.ok(reroll(sim, 'p1'));
  assert.equal(reroll(sim, 'p1'), false);
  const coins = sim.players[0].coins;
  assert.ok(skipLevel(sim, 'p1')); assert.equal(sim.pending.p1, undefined); assert.equal(sim.players[0].coins, coins + 1);
});

test('endless runs keep going past the clock and bring bosses back', () => {
  const sim = createSim({ seed: 4, endless: true });
  sim.t = sim.map.length - 1; sim.bossIndex = sim.map.bosses.length;
  const p = sim.players[0]; p.godMode = true; p.hp = p.maxHp = 1e9;
  run(sim, 100);
  assert.equal(sim.over, null);
  assert.ok(sim.endlessCycle >= 1, 'a boss came back');
});

// ---- boss attacks and elites ---------------------------------------------------------------------------------------
test('a boss slam is telegraphed: it lands where you stood, so standing still hurts and stepping out does not', () => {
  const mk = () => { const sim = createSim({ seed: 6 }); sim.spawnAcc = -1e9; const p = sim.players[0]; p.hp = p.maxHp = 5000;
    sim.enemies.push({ id: 77, type: 'giant', x: p.x + 8, z: p.z, hp: 1e6, maxHp: 1e6, face: 0, hit: 0, kx: 0, kz: 0, cdHit: {}, speed: 0, atkCd: 0, charge: null }); return sim; };
  const still = mk(); const p1 = still.players[0], hp0 = p1.hp;
  for (let i = 0; i < 1 / TICK; i++) { step(still, {}, TICK); still.spawnAcc = -1e9; for (const id of Object.keys(still.pending)) choose(still, id, 0); }
  assert.ok(still.hazards.length || p1.hp < hp0, 'a slam was telegraphed');
  for (let i = 0; i < 1 / TICK; i++) { step(still, {}, TICK); still.spawnAcc = -1e9; for (const id of Object.keys(still.pending)) choose(still, id, 0); }
  assert.ok(p1.hp < hp0, 'standing still got hit');
  const dodge = mk(); const p2 = dodge.players[0], hp1 = p2.hp;
  step(dodge, {}, TICK);
  for (let i = 0; i < 1.6 / TICK; i++) { step(dodge, { p1: { mx: -1, mz: 0 } }, TICK); dodge.spawnAcc = -1e9; for (const id of Object.keys(dodge.pending)) choose(dodge, id, 0); }
  assert.equal(p2.hp, hp1, 'running out of the circle avoided it');
});

test('monster volleys fly and can be dodged; elites always drop a reward casket', () => {
  const sim = createSim({ seed: 9 }); sim.spawnAcc = -1e9; const p = sim.players[0]; p.hp = p.maxHp = 5000;
  sim.eproj.push({ id: 1, x: p.x + 6, z: p.z, vx: -9, vz: 0, r: 0.55, dmg: 30, life: 3, art: 'fire' });
  const hp0 = p.hp; for (let i = 0; i < 1.2 / TICK; i++) step(sim, {}, TICK);
  assert.ok(p.hp < hp0, 'the fireball hit');
  const e = { id: 50, type: 'goblin', x: p.x + 1, z: p.z, hp: 1, maxHp: 1, face: 0, hit: 0, kx: 0, kz: 0, cdHit: {}, speed: 0, elite: true };
  sim.enemies.push(e); damageEnemy(sim, e, 5, 'p1');
  assert.ok(sim.pickups.some((k) => k.kind === 'casket'), 'elite dropped a casket');
});

test('random events happen every few minutes: a treasure goblin runs away with loot', () => {
  const sim = createSim({ seed: 12 }); const p = sim.players[0]; p.godMode = true; p.hp = p.maxHp = 1e9;
  sim.eventT = 0.01; let kinds = new Set();
  for (let n = 0; n < 6; n++) { sim.eventT = 0.01; sim.event = null; step(sim, {}, TICK); if (sim.event) kinds.add(sim.event.kind); for (const id of Object.keys(sim.pending)) choose(sim, id, 0); }
  assert.ok(kinds.size >= 1, 'an event started');
  // force a treasure goblin and check it flees
  sim.event = null; sim.enemies.length = 0; let found = null;
  for (let tries = 0; tries < 40 && !found; tries++) { sim.event = null; sim.eventT = 0.01; step(sim, {}, TICK); if (sim.event && sim.event.kind === 'treasure') found = sim.enemies.find((e) => e.id === sim.event.id); }
  assert.ok(found, 'treasure goblin spawned');
  const d0 = Math.hypot(found.x - p.x, found.z - p.z); for (let i = 0; i < 30; i++) step(sim, {}, TICK);
  assert.ok(Math.hypot(found.x - p.x, found.z - p.z) >= d0 - 0.5, 'it runs away');
});

test('the Armoury: reinforced gear gives more of its bonus', async () => {
  const { gearBonus: gb, gearUpgradeCost, GEAR_MAX_LV } = await import('../src/content.js');
  const base = gb({ head: 'Winged Boots' }).speed, up = gb({ head: 'Winged Boots' }, { 'Winged Boots': 2 }).speed;
  assert.ok(Math.abs(up - base * 1.5) < 1e-9, `${base} -> ${up}`);
  assert.ok(gearUpgradeCost('Winged Boots', 1) > gearUpgradeCost('Winged Boots', 0));
  assert.equal(GEAR_MAX_LV, 3);
  const sim = createSim({ seed: 1, players: [{ id: 'p1', gear: { feet: 'Winged Boots' }, gearLv: { 'Winged Boots': 3 } }] });
  const plain = createSim({ seed: 1, players: [{ id: 'p1', gear: { feet: 'Winged Boots' } }] });
  assert.ok(playerStats(sim.players[0]).speed > playerStats(plain.players[0]).speed);
});

test('the whole-world map takes its monsters from the region you stand in', async () => {
  const { MAP_BY_ID } = await import('../src/content.js');
  const sim = createSim({ seed: 2, map: MAP_BY_ID.world }); const p = sim.players[0];
  p.godMode = true; p.hp = p.maxHp = 1e9;
  run(sim, 2); assert.equal(sim.region, 'greentown');
  p.x = MAP_BY_ID.apache.cx; p.z = MAP_BY_ID.apache.cz; sim.enemies.length = 0;
  run(sim, 30); assert.equal(sim.region, 'apache');
  const types = new Set(sim.enemies.map((e) => e.type));
  assert.ok([...types].every((t) => MAP_BY_ID.apache.pool.some((s) => s.type === t) || ENEMIES[t].boss), [...types].join(','));
});

test('Goblin War: warbands charge in ranks from one side, led by an elite warchief', async () => {
  const { MAP_BY_ID } = await import('../src/content.js');
  const sim = createSim({ seed: 5, map: MAP_BY_ID.goblins }); const p = sim.players[0]; p.godMode = true; p.hp = p.maxHp = 1e9; sim.t = 420;
  let found = false;
  for (let tries = 0; tries < 30 && !found; tries++) {
    sim.enemies.length = 0; sim.event = null; sim.eventT = 0.01; step(sim, {}, TICK);
    const fx = sim.fx.filter((f) => f.k === 'event').pop(); sim.fx = []; if (fx && fx.kind === 'warband') found = fx;
  }
  assert.ok(found, 'a warband came');
  assert.ok(['north', 'south', 'east', 'west'].includes(found.dir), 'from a named side');
  const gobs = sim.enemies.filter((e) => e.type === 'goblin');
  assert.ok(gobs.length >= 16, 'at least 16 goblins: ' + gobs.length);
  assert.ok(gobs.some((e) => e.elite), 'an elite warchief leads them');
  // they all start on the same side of you
  const cx = gobs.reduce((a, e) => a + e.x - p.x, 0) / gobs.length, cz = gobs.reduce((a, e) => a + e.z - p.z, 0) / gobs.length;
  assert.ok(Math.hypot(cx, cz) > 10, 'grouped on one side, not a ring');
});

test('Chapel Graves: the dead rise in a ring close around you and stand still for a moment first', async () => {
  const { MAP_BY_ID } = await import('../src/content.js');
  const sim = createSim({ seed: 9, map: MAP_BY_ID.graves }); const p = sim.players[0]; p.godMode = true; p.hp = p.maxHp = 1e9; sim.t = 420;
  let found = false;
  for (let tries = 0; tries < 30 && !found; tries++) {
    sim.enemies.length = 0; sim.event = null; sim.eventT = 0.01; step(sim, {}, TICK);
    const fx = sim.fx.filter((f) => f.k === 'event').pop(); sim.fx = []; if (fx && fx.kind === 'rising') found = true;
  }
  assert.ok(found, 'the dead rose');
  const risen = sim.enemies.filter((e) => e.rise > 0);
  assert.ok(risen.length >= 8, 'at least 8 skeletons: ' + risen.length);
  for (const e of risen) assert.ok(Math.hypot(e.x - p.x, e.z - p.z) < 9, 'close around you');
  const pos = risen.map((e) => [e.x, e.z]);
  step(sim, {}, TICK); step(sim, {}, TICK);
  risen.forEach((e, i) => assert.ok(Math.abs(e.x - pos[i][0]) < 1e-6 && Math.abs(e.z - pos[i][1]) < 1e-6, 'they do not move while rising'));
});

test('Payasan Village: a blizzard slows you while it lasts and brings snowmen', async () => {
  const { MAP_BY_ID } = await import('../src/content.js');
  const { playerStats } = await import('../src/sim.js');
  const sim = createSim({ seed: 4, map: MAP_BY_ID.paya }); const p = sim.players[0]; p.godMode = true; p.hp = p.maxHp = 1e9; sim.t = 420;
  const v0 = playerStats(p).speed; let found = false;
  for (let tries = 0; tries < 30 && !found; tries++) {
    sim.enemies.length = 0; sim.event = null; sim.eventT = 0.01; step(sim, {}, TICK);
    const fx = sim.fx.filter((f) => f.k === 'event').pop(); sim.fx = []; if (fx && fx.kind === 'blizzard') found = true;
  }
  assert.ok(found, 'a blizzard came');
  assert.ok(playerStats(p).speed < v0 * 0.95, 'slower in the blizzard');
  assert.ok(sim.enemies.filter((e) => e.type === 'snowman').length >= 10, 'snowmen came with it');
  for (let i = 0; i < 16 * 30; i++) { step(sim, {}, TICK); for (const id of Object.keys(sim.pending)) choose(sim, id, 0); }
  assert.ok(!(p.buffs.chill > 0), 'the chill wears off');
  const now = playerStats(p).speed; p.buffs.chill = 5; assert.ok(playerStats(p).speed < now, 'and it was the chill that slowed you');
});

test('Apache sandstorm and Wilderness ambush: map events bring their own monsters', async () => {
  const { MAP_BY_ID } = await import('../src/content.js');
  for (const [map, kind, type] of [['apache', 'sandstorm', 'scorpion'], ['swamp', 'ambush', 'alligator']]) {
    const sim = createSim({ seed: 3, map: MAP_BY_ID[map] }); const p = sim.players[0]; p.godMode = true; p.hp = p.maxHp = 1e9; sim.t = 420;
    let found = false;
    for (let tries = 0; tries < 30 && !found; tries++) {
      sim.enemies.length = 0; sim.event = null; sim.eventT = 0.01; step(sim, {}, TICK);
      const fx = sim.fx.filter((f) => f.k === 'event').pop(); sim.fx = []; if (fx && fx.kind === kind) found = true;
    }
    assert.ok(found, kind + ' came on ' + map);
    assert.ok(sim.enemies.filter((e) => e.type === type).length >= 5, kind + ' brought ' + type + 's');
  }
});

test('the server walks on the same ground as the map tiles, and the swamp ambush climbs out of real water', async () => {
  const { readFileSync } = await import('node:fs');
  const { unpackGround, groundHash } = await import('../src/ground-pack.js');
  const { worldGround } = await import('../tools/build-ground.mjs');
  const { MAP_BY_ID } = await import('../src/content.js');
  const ground = unpackGround(readFileSync(new URL('../tools/vercel-api/ground.bin', import.meta.url)));
  assert.equal(groundHash(ground), groundHash(worldGround()), 'tools/vercel-api/ground.bin is current (node tools/build-ground.mjs)');
  const n = ground.n, W = n + 1, wet = (x, z) => ground.water[z * W + x] === ground.water[z * W + x];
  const sim = createSim({ seed: 4, map: MAP_BY_ID.swamp, ground }); const p = sim.players[0]; p.godMode = true; p.hp = p.maxHp = 1e9; sim.t = 420;
  // stand on dry land a few steps from the nearest water
  let spot = null;
  for (let r = 0; r < 120 && !spot; r++) for (let dx = -r; dx <= r && !spot; dx++) for (const dz of [-r, r]) {
    const x = Math.floor(p.x) + dx, z = Math.floor(p.z) + dz;
    if (x < 9 || z < 9 || x > n - 9 || z > n - 9 || ground.blocked[z * n + x] || wet(x, z)) continue;
    if (wet(x + 8, z) || wet(x - 8, z) || wet(x, z + 8) || wet(x, z - 8)) spot = [x + 0.5, z + 0.5];
  }
  assert.ok(spot, 'there is a shore near the swamp');
  p.x = spot[0]; p.z = spot[1];
  let surf = [];
  for (let tries = 0; tries < 40 && !surf.length; tries++) {
    sim.enemies.length = 0; sim.event = null; sim.eventT = 0.01; sim.fx = []; step(sim, {}, TICK);
    if (sim.fx.some((f) => f.k === 'event' && f.kind === 'ambush')) surf = sim.fx.filter((f) => f.k === 'surface');
  }
  assert.ok(surf.length >= 5, 'the ambush came');
  for (const s of surf) {
    const x = Math.floor(s.x), z = Math.floor(s.z);
    assert.ok(wet(x - 1, z) || wet(x + 1, z) || wet(x, z - 1) || wet(x, z + 1), `monsters surface at the water's edge (${s.x}, ${s.z})`);
  }
});

test('Fighting Forum: a champion challenges you, the crowd holds back, and beating it pays out', async () => {
  const { MAP_BY_ID } = await import('../src/content.js');
  const sim = createSim({ seed: 2, map: MAP_BY_ID.duel }); const p = sim.players[0]; p.godMode = true; p.hp = p.maxHp = 1e9; sim.t = 420;
  let found = false;
  for (let tries = 0; tries < 30 && !found; tries++) {
    sim.enemies.length = 0; sim.event = null; sim.eventT = 0.01; step(sim, {}, TICK);
    const fx = sim.fx.filter((f) => f.k === 'event').pop(); sim.fx = []; if (fx && fx.kind === 'duel') found = true;
  }
  assert.ok(found, 'a champion came');
  const champ = sim.enemies.find((e) => e.champion); assert.ok(champ && champ.elite, 'one golden champion');
  const n0 = sim.enemies.length; for (let i = 0; i < 90; i++) { step(sim, {}, TICK); for (const id of Object.keys(sim.pending)) choose(sim, id, 0); }
  assert.ok(sim.enemies.filter((e) => !e.champion).length <= n0 + 2, 'the crowd holds back during the duel');
  const coins0 = sim.pickups.filter((q) => q.kind === 'coin').length;
  champ.hp = 0.0001; for (let i = 0; i < 40 && sim.enemies.includes(champ); i++) step(sim, {}, TICK);
  if (sim.enemies.includes(champ)) { champ.hp = -1; step(sim, {}, TICK); }
  assert.ok(sim.pickups.filter((q) => q.kind === 'coin').length >= coins0 + 6, 'a champion drops a pile of coins');
  assert.ok(!sim.event || sim.event.kind !== 'duel', 'and the duel is over');
});

test('Greentown: a chicken stampede charges in from one side', async () => {
  const { MAP_BY_ID } = await import('../src/content.js');
  const sim = createSim({ seed: 8, map: MAP_BY_ID.greentown }); const p = sim.players[0]; p.godMode = true; p.hp = p.maxHp = 1e9; sim.t = 420;
  let found = null;
  for (let tries = 0; tries < 40 && !found; tries++) {
    sim.enemies.length = 0; sim.event = null; sim.eventT = 0.01; step(sim, {}, TICK);
    const fx = sim.fx.filter((f) => f.k === 'event').pop(); sim.fx = []; if (fx && fx.kind === 'stampede') found = fx;
  }
  assert.ok(found, 'a stampede came'); assert.ok(['north', 'south', 'east', 'west'].includes(found.dir));
  const ch = sim.enemies.filter((e) => e.type === 'chicken'); assert.ok(ch.length >= 30, 'lots of chickens: ' + ch.length);
  const cx = ch.reduce((a, e) => a + e.x - p.x, 0) / ch.length, cz = ch.reduce((a, e) => a + e.z - p.z, 0) / ch.length;
  assert.ok(Math.hypot(cx, cz) > 10, 'all from one side');
});

test('The Whole World: events come from the region you are standing in', async () => {
  const { MAP_BY_ID } = await import('../src/content.js');
  const sim = createSim({ seed: 6, map: MAP_BY_ID.world }); const p = sim.players[0]; p.godMode = true; p.hp = p.maxHp = 1e9;
  p.x = MAP_BY_ID.paya.cx; p.z = MAP_BY_ID.paya.cz; // walk to Payasan
  const kinds = new Set();
  for (let tries = 0; tries < 30; tries++) {
    sim.enemies.length = 0; sim.event = null; sim.eventT = 0.01; step(sim, {}, TICK); for (const id of Object.keys(sim.pending)) choose(sim, id, 0);
    const fx = sim.fx.filter((f) => f.k === 'event').pop(); sim.fx = []; if (fx) kinds.add(fx.kind);
    for (const q of sim.players) q.buffs = {};
  }
  assert.ok(kinds.has('blizzard'), 'a blizzard at Payasan: ' + [...kinds].join(','));
  assert.ok(![...kinds].some((k) => ['warband', 'sandstorm', 'rising', 'ambush', 'duel', 'stampede'].includes(k)), 'and nothing from other regions');
});

test('new upgrades: Cape widens, Feather adds projectiles, Amanita crits harder, Carapace hits back, Rusty Key pays', async () => {
  const { playerStats } = await import('../src/sim.js');
  const sim = createSim({ seed: 21 }); const p = sim.players[0]; p.godMode = true; p.hp = p.maxHp = 1e9;
  const base = playerStats(p);
  p.passives = { area: 5, amount: 4, crit: 5, thorns: 3, greed: 2 };
  const st = playerStats(p);
  assert.ok(st.area > 1.45 && st.amount === 2 && st.critC > base.critC + 0.2 && st.critM > base.critM && st.thorns === 24 && st.coin > base.coin, JSON.stringify(st));
  // thorns: a monster touching you gets hurt back
  p.weapons = {}; sim.enemies.length = 0; spawnEnemy(sim, 'goblin', p.x + 0.3, p.z, 50); const g = sim.enemies[0]; const hp0 = g.hp;
  p.inv = 0; for (let i = 0; i < 6; i++) step(sim, {}, TICK);
  assert.ok(g.hp < hp0, 'thorns hurt the goblin');
});

test('Baseball ricochets between monsters; Lighter burns everything in its ring', () => {
  const sim = createSim({ seed: 22 }); const p = sim.players[0]; p.godMode = true; p.hp = p.maxHp = 1e9;
  p.weapons = { baseball: 4 }; sim.enemies.length = 0;
  for (let i = 0; i < 5; i++) spawnEnemy(sim, 'goblin', p.x + 4 + i * 1.5, p.z + (i % 2) * 1.2, 50);
  for (const e of sim.enemies) e.speed = 0;
  let maxHit = 0;
  for (let i = 0; i < 90; i++) { step(sim, {}, TICK); for (const pr of sim.proj) if (pr.art === 'ball') maxHit = Math.max(maxHit, pr.hit.length); for (const id of Object.keys(sim.pending)) choose(sim, id, 0); }
  assert.ok(maxHit >= 3, 'one ball hit several monsters: ' + maxHit);
  const sim2 = createSim({ seed: 23 }); const q = sim2.players[0]; q.godMode = true; q.hp = q.maxHp = 1e9;
  q.weapons = { lighter: 3 }; sim2.enemies.length = 0;
  spawnEnemy(sim2, 'goblin', q.x + 1.5, q.z, 50); spawnEnemy(sim2, 'goblin', q.x - 1.2, q.z + 0.8, 50); spawnEnemy(sim2, 'goblin', q.x + 9, q.z, 50);
  for (const e of sim2.enemies) e.speed = 0;
  const hp = sim2.enemies.map((e) => e.hp);
  for (let i = 0; i < 40; i++) step(sim2, {}, TICK);
  assert.ok(sim2.enemies[0].hp < hp[0] && sim2.enemies[1].hp < hp[1], 'both near monsters burn');
  assert.equal(sim2.enemies[2].hp, hp[2], 'the far one does not');
  assert.ok(snapshot(sim2).players[0].fire > 2, 'the ring shows');
});

test('every map: only the LAST scheduled boss ends the run (Goblin War has an Ogre at 7:00 and the real final Ogre later)', async () => {
  const { damageEnemy } = await import('../src/sim.js');
  for (const m of MAPS.filter((x) => ['goblins', 'swamp'].includes(x.id))) {
    const sim = createSim({ seed: 5, map: m });
    const p = sim.players[0]; p.godMode = true; p.hp = p.maxHp = 1e9;
    let finals = 0;
    for (let i = 0; i < 900 / TICK && !sim.over; i++) {
      step(sim, { p1: { mx: 0, mz: 0 } }, TICK); sim.fx.length = 0;
      for (const id of Object.keys(sim.pending)) choose(sim, id, 0);
      const boss = sim.enemies.find((e) => ENEMIES[e.type].boss && e.type === m.finalBoss && !e.dead);
      if (boss) { const wasFinal = !!boss.final; damageEnemy(sim, boss, 1e12, 'p1'); if (wasFinal) finals++; else assert.equal(sim.over, null, `${m.id}: killing an earlier ${m.finalBoss} ended the run`); }
    }
    assert.equal(sim.over, 'win', `${m.id}: killing the last boss wins`);
    assert.equal(finals, 1, `${m.id}: exactly one final boss`);
    assert.ok(sim.t >= m.bosses[m.bosses.length - 1].t, `${m.id}: won before the last boss was scheduled`);
  }
});

test('every Feather level counts, and the Cape widens arrows and thrown swords', () => {
  const firstShot = (weapon, ps) => {
    const sim = createSim({ seed: 7, players: [{ id: 'p1', name: 'A', weapon }] }); const p = sim.players[0];
    p.godMode = true; Object.assign(p.passives, ps);
    spawnEnemy(sim, 'chicken', p.x + 6, p.z);
    for (let i = 0; i < 200 && !sim.proj.length; i++) step(sim, {}, TICK);
    return sim.proj[0];
  };
  for (const w of ['bow', 'shortsword']) {
    const plain = firstShot(w, {}), caped = firstShot(w, { area: 3 });
    assert.ok(plain && caped && caped.r > plain.r, `${w}: the Cape widens its hits`);
  }
  const lives = [1, 2, 3].map((l) => firstShot('bow', { amount: l }).life);
  assert.ok(lives[1] > lives[0] && lives[2] > lives[1], 'Feather levels 2 and 3 each add reach');
});

test('building walls stop you (and monsters go round them, through the door)', async () => {
  const { MAP_BY_ID } = await import('../src/content.js');
  // a 20x20 patch with a wall along x = 10 (east side of column 9) from z = 0 to 15; the gap at z 16..19 is the door
  const n = 20, walls = new Uint8Array(n * n);
  for (let j = 0; j < 16; j++) walls[j * n + 9] |= 2;
  const ground = { n, blocked: new Uint8Array(n * n), cell: true, water: null, walls };
  const sim = createSim({ seed: 1, map: MAP_BY_ID.greentown, ground }); const p = sim.players[0];
  p.godMode = true; p.x = 8.5; p.z = 5.5; sim.enemies.length = 0;
  for (let i = 0; i < 90; i++) { sim.enemies.length = 0; step(sim, { p1: { mx: 1, mz: 0 } }, TICK); }
  assert.ok(p.x < 10 - 0.25 && p.x > 9.5, `you stop at the wall (x ${p.x.toFixed(2)})`);
  for (let i = 0; i < 30; i++) { sim.enemies.length = 0; step(sim, { p1: { mx: 0, mz: 1 } }, TICK); }
  assert.ok(Math.abs(p.x - 9.7) < 0.1 && p.z > 6, 'and slide along it');
  // through the door you get across
  p.x = 8.5; p.z = 17.5;
  for (let i = 0; i < 30; i++) { sim.enemies.length = 0; step(sim, { p1: { mx: 1, mz: 0 } }, TICK); }
  assert.ok(p.x > 10.5, 'the door is open');
  // a monster on the far side of the wall walks round through the door to reach you
  p.x = 5.5; p.z = 5.5; sim.enemies.length = 0;
  spawnEnemy(sim, 'chicken', 14.5, 5.5); const e = sim.enemies[0]; let crossedAtDoor = true;
  for (let i = 0; i < 900 && e.hp > 0 && e.x > 9.5; i++) { const was = e.x; step(sim, { p1: { mx: 0, mz: 0 } }, TICK); if (was >= 10 && e.x < 10 && e.z < 16) crossedAtDoor = false; }
  assert.ok(crossedAtDoor, 'it never passed through the wall');
});

test('a monster left far behind comes back in near you instead of holding a place all run', async () => {
  const { MAP_BY_ID } = await import('../src/content.js');
  const sim = createSim({ seed: 3, map: MAP_BY_ID.greentown }); const p = sim.players[0]; p.godMode = true; p.hp = p.maxHp = 1e9;
  spawnEnemy(sim, 'fox', p.x + 80, p.z); const e = sim.enemies[sim.enemies.length - 1]; e.speed = 0; // a fox that cannot follow
  for (let i = 0; i < Math.ceil(6 / TICK); i++) step(sim, { p1: { mx: 0, mz: 0 } }, TICK);
  const d = Math.hypot(e.x - p.x, e.z - p.z);
  assert.ok(sim.enemies.includes(e) && d < 40, `it is back in the fight (${d.toFixed(1)} away)`);
});

test('no wall in the world can be walked through, straight on or at an angle (sampled)', async () => {
  const { readFileSync } = await import('node:fs');
  const { unpackGround } = await import('../src/ground-pack.js');
  const { MAP_BY_ID } = await import('../src/content.js');
  const g = unpackGround(readFileSync(new URL('../tools/vercel-api/ground.bin', import.meta.url))), n = g.n, W = g.walls;
  const xWall = (i, j, d) => (d > 0 ? (W[j * n + i] & 2) || (W[j * n + i + 1] & 8) : (W[j * n + i] & 8) || (W[j * n + i - 1] & 2));
  const zWall = (i, j, d) => (d > 0 ? (W[j * n + i] & 4) || (W[(j + 1) * n + i] & 1) : (W[j * n + i] & 1) || (W[(j - 1) * n + i] & 4));
  const through = (i0, j0, i1, j1) => { const di = i1 - i0, dj = j1 - j0; if (!di && !dj) return false; if (!dj) return !!xWall(i0, j0, di); if (!di) return !!zWall(i0, j0, dj); return !!((xWall(i0, j0, di) || zWall(i0 + di, j0, dj)) && (zWall(i0, j0, dj) || xWall(i0, j0 + dj, di))); };
  const sim = createSim({ seed: 1, map: MAP_BY_ID.world, ground: g }); const p = sim.players[0]; p.godMode = true; p.hp = p.maxHp = 1e9;
  const cells = []; for (let k = 0; k < n * n; k++) if (W[k]) cells.push(k);
  let pushes = 0;
  for (let c = 0; c < cells.length; c += 7) { // every 7th walled cell, pushed into from inside at three angles each way
    const k = cells[c], i = k % n, j = (k - i) / n, w = W[k];
    for (const [bit, mx, mz] of [[2, 1, 0], [8, -1, 0], [4, 0, 1], [1, 0, -1]]) {
      if (!(w & bit)) continue;
      for (const slant of [0, 0.6, -0.6]) {
        if (g.blocked[k]) continue;
        p.x = i + 0.5; p.z = j + 0.5; pushes++;
        for (let t = 0; t < 30; t++) {
          const i0 = Math.floor(p.x), j0 = Math.floor(p.z);
          sim.enemies.length = 0; sim.pending = {}; step(sim, { p1: { mx: mx || slant, mz: mz || slant } }, TICK);
          assert.ok(!through(i0, j0, Math.floor(p.x), Math.floor(p.z)), `walked through a wall at cell ${i0},${j0}`);
        }
      }
    }
  }
  assert.ok(pushes > 100, `tested ${pushes} pushes`);
});

test('the Spirit Shard speeds up weapons without a cooldown too (shields re-hit sooner, the Lighter burns faster)', () => {
  // the Lighter's timer is reset to its burn interval after every burn: the largest value it shows is that interval
  const burnGap = (haste) => {
    const sim = createSim({ seed: 2, players: [{ id: 'p1', name: 'A', weapon: 'lighter' }] }); const p = sim.players[0];
    p.godMode = true; if (haste) p.passives.haste = haste;
    let most = 0;
    for (let i = 0; i < 120; i++) { step(sim, {}, TICK); most = Math.max(most, p.cd.lighter); }
    return most;
  };
  const plain = burnGap(0), fast = burnGap(5);
  assert.ok(plain > 0.4 && fast < plain * 0.75, `burn interval ${fast.toFixed(3)} vs ${plain.toFixed(3)}`);
});
