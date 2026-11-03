import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import * as C from '../src/content.js';
import { createSim, playerStats, rollChoices, spawnEnemy, damageEnemy, step, choose, snapshot, TICK } from '../src/sim.js';
import { rankedSim } from '../src/ranked.js';
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test('four starting slots, Strength and Prayer unlock the fifth and sixth independently', () => {
  for (const rank of [0, 1, 2]) for (const kind of ['weapon', 'passive']) {
    const s = createSim({ meta: { [kind === 'weapon' ? 'strength' : 'prayer']: rank } }), p = s.players[0];
    const ids = kind === 'weapon' ? C.WEAPON_IDS : C.PASSIVE_IDS, key = kind === 'weapon' ? 'weapons' : 'passives';
    const st = playerStats(p);
    assert.equal(st.weaponSlots, kind === 'weapon' ? 4 + rank : 4);
    assert.equal(st.passiveSlots, kind === 'passive' ? 4 + rank : 4);
    p.weapons = {}; p.passives = {};
    p[key] = Object.fromEntries(ids.slice(0, 3 + rank).map((id) => [id, 1]));
    let offered = false;
    for (let i = 0; i < 100; i++) if (rollChoices(s, p).some((c) => c.kind === kind && !p[key][c.id])) offered = true;
    assert.ok(offered, `${kind} slot ${4 + rank} available`);
    p[key][ids[3 + rank]] = 1;
    for (let i = 0; i < 100; i++) {
      const choices = rollChoices(s, p);
      assert.ok(!choices.some((c) => c.kind === kind && !p[key][c.id]), `${kind} limit ${4 + rank}`);
      assert.ok(choices.some((c) => c.kind === kind && p[key][c.id]) || choices.some((c) => c.kind !== kind));
    }
  }
});

test('new skills have individual maxima and prices; saved levels are clamped', () => {
  assert.equal(typeof C.clampSkills, 'function');
  const maxima = { strength: 2, prayer: 2, projectileSpeed: 2, amount: 1, area: 2, luck: 3, coins: 5, rerolls: 3, revive: 1 };
  for (const [id, max] of Object.entries(maxima)) {
    assert.equal(C.SKILLS[id].max, max);
    assert.ok(existsSync(new URL('../public/assets/' + C.SKILLS[id].icon, import.meta.url)));
    assert.equal(C.clampSkills({ [id]: 99 })[id], max);
    for (let level = 0; level < max; level++) assert.ok(C.skillCost(id, level) > 0);
  }
  for (const id of ['strength', 'prayer']) assert.deepEqual([0, 1].map((l) => C.skillCost(id, l)), [1500, 4000]);
  assert.equal(C.skillCost('amount', 0), 3000); assert.equal(C.skillCost('revive', 0), 5000);
  for (const input of [null, [], 'bad', 2]) assert.deepEqual(C.clampSkills(input), {});
  assert.deepEqual(C.clampSkills({ combat: '3.9', strength: -1, prayer: 'bad', revive: 100, unknown: 9 }), { combat: 3, strength: 0, prayer: 0, revive: 1 });
  assert.equal(C.clampSkills({ combat: Infinity }).combat, 5);
});

test('all nine existing skills retain their effects and cost curve', () => {
  const p = createSim().players[0], b = playerStats(p);
  const effects = { combat: ['might', b.might + .2], magic: ['magnet', b.magnet * 1.5], mining: ['armor', b.armor + 2], smithing: ['maxHp', b.maxHp + 40], woodcutting: ['speed', C.PLAYER_BASE.speed * (1 + .15 + .06)], fletching: ['haste', .85], fishing: ['heal', 1.6], cooking: ['regen', .5], herblore: ['growth', 1.25] };
  for (const [id, [stat, value]] of Object.entries(effects)) {
    close(playerStats(p, { [id]: 5 })[stat], value);
    assert.equal(C.SKILLS[id].max, 5);
    for (let l = 0; l < 5; l++) assert.equal(C.skillCost(id, l), Math.round(60 * (l + 1) ** 1.7));
  }
  assert.equal(playerStats(p, { mining: 1 }).armor, 0);
  assert.equal(playerStats(p, { mining: 2 }).armor, 1);
  assert.equal(playerStats(p, { mining: 3 }).armor, 1);
});

test('new skill stats stack with passives and initialize rerolls and revives', () => {
  const s = createSim({ meta: { projectileSpeed: 2, amount: 1, area: 2, luck: 3, coins: 5, rerolls: 3, revive: 1 } }), p = s.players[0];
  p.passives = { area: 2, amount: 4, greed: 2 };
  const st = playerStats(p);
  close(st.projectileSpeed, 1.2); assert.equal(st.amount, 3); close(st.area, 1.3);
  close(st.luck, 1.45); close(st.casket, 1.5 * 1.45); close(st.coinBonus, 1.5);
  close(st.coin, 1.3); // end-run Coins must not also increase coin drops
  assert.equal(p.rerolls, C.REROLLS_PER_RUN + 3); assert.equal(p.revives, 1);
});

function shots(weapon, meta = {}, passives = {}) {
  const s = createSim({ seed: 7, meta, players: [{ id: 'p1', weapon }] }), p = s.players[0];
  p.passives = passives; p.godMode = true; s.spawnAcc = -1e9;
  spawnEnemy(s, 'cow', p.x + 6, p.z, 100); s.enemies[0].speed = 0;
  for (let i = 0; i < 100 && !s.proj.length; i++) { step(s, {}, TICK); s.fx.length = 0; }
  return { s, p, shots: s.proj };
}
test('projectile speed and amount reach every Feather weapon; Area matches Cape', () => {
  for (const w of ['bow', 'axe', 'staff', 'shortsword', 'baseball']) {
    const base = shots(w), fast = shots(w, { projectileSpeed: 2 }), more = shots(w, { amount: 1 });
    assert.ok(base.shots.length && fast.shots.length);
    close(Math.hypot(fast.shots[0].vx, fast.shots[0].vz) / Math.hypot(base.shots[0].vx, base.shots[0].vz), 1.2);
    assert.equal(more.shots.length, base.shots.length + 1, w);
    const area = shots(w, { area: 2 }), cape = shots(w, {}, { area: 1 });
    assert.deepEqual(area.shots, cape.shots, w);
  }
  const a = shots('shield'), b = shots('shield', { amount: 1 });
  assert.equal(snapshot(b.s).players[0].shields.count - snapshot(a.s).players[0].shields.count, 1);
  const wide = shots('shield', { area: 2 });
  close(snapshot(wide.s).players[0].shields.radius, C.WEAPONS.shield.stats(1).radius * 1.05);
});

test('Luck increases marginal casket odds and adds bonus boss chests without replacing guaranteed loot', () => {
  const kill = (meta, type, r) => {
    const s = createSim({ seed: 1, meta }), p = s.players[0]; spawnEnemy(s, type, p.x + 5, p.z);
    s.rng = () => r; damageEnemy(s, s.enemies[0], 1e9, p.id);
    return s.pickups.map((q) => q.kind);
  };
  assert.ok(!kill({}, 'goblin', .0007).includes('casket')); // pace 2: 0.06% a kill, x1.45 with Luck 3
  assert.ok(kill({ luck: 3 }, 'goblin', .0007).includes('casket'));
  assert.equal(kill({}, 'giant', .2).filter((k) => k === 'chest').length, 1);
  assert.equal(kill({ luck: 3 }, 'giant', .2).filter((k) => k === 'chest').length, 2);
});

function lethal(s) {
  const p = s.players[0]; p.hp = 1; p.inv = 0;
  s.hazards.push({ x: p.x, z: p.z, r: 3, t: 0, max: 1, dmg: 1000 });
  step(s, {}, TICK);
}
test('Revive restores half HP, protects briefly, shows an effect, and only works once deterministically', () => {
  const make = () => createSim({ seed: 5, meta: { revive: 1, smithing: 5 } });
  const a = make(), b = make();
  for (const s of [a, b]) {
    const p = s.players[0]; lethal(s);
    assert.equal(p.hp, p.maxHp * .5); assert.ok(p.alive); assert.equal(p.revives, 0); assert.ok(p.inv >= 1.9);
    assert.ok(s.fx.some((f) => f.k === 'revive'));
    const hp = p.hp; s.hazards.push({ x: p.x, z: p.z, r: 3, t: 0, max: 1, dmg: 1000 }); step(s, {}, TICK); assert.equal(p.hp, hp);
    lethal(s); assert.equal(p.hp, 0); assert.equal(p.alive, false); assert.equal(s.over, 'dead');
    assert.equal(s.fx.filter((f) => f.k === 'revive').length, 1);
  }
  assert.deepEqual({ ...a, rng: null }, { ...b, rng: null });
});
test('ranked ignores supplied upgrades, remains 4/4, and never revives', () => {
  const s = rankedSim({ seed: 1, mapId: 'greentown', adv: 'adventurer', ground: null, week: 0, meta: { revive: 1, strength: 2, prayer: 2 } });
  const p = s.players[0], st = playerStats(p);
  assert.equal(st.weaponSlots, 4); assert.equal(st.passiveSlots, 4); assert.equal(p.revives, 0);
  lethal(s); assert.equal(p.alive, false); assert.ok(!s.fx.some((f) => f.k === 'revive'));
  // the same in both week 1 races (endless, Hard on hard rules)
  for (const mode of ['normal', 'hard']) {
    const h = rankedSim({ seed: 1, mapId: 'greentown', adv: 'adventurer', ground: null, week: 1, mode, meta: { revive: 1, strength: 2, prayer: 2 } });
    const hp = h.players[0], hs = playerStats(hp);
    assert.deepEqual([hs.weaponSlots, hs.passiveSlots, hp.revives, h.hard, h.endless], [4, 4, 0, mode === 'hard', true]);
    lethal(h); assert.equal(hp.alive, false); assert.ok(!h.fx.some((f) => f.k === 'revive'));
  }
});
test('base health and enemy HP and speed scaling follow the new season rules', () => {
  assert.equal(createSim().players[0].hp, 100);
  const s = createSim(); s.t = 300; spawnEnemy(s, 'giant', 0, 0);
  close(s.enemies[0].hp, C.ENEMIES.giant.hp * (1 + 300 / 240)); // pace 2 (3 Nov): health grows faster
  const v = createSim({ meta: { might: 1, haste: 1 } }); v.t = 300; spawnEnemy(v, 'giant', 0, 0);
  close(v.enemies[0].hp, C.ENEMIES.giant.hp * (1 + 300 / 240) * (1 + 0.015 * Object.values(v.meta).reduce((a, b) => a + b, 0)), 'veterans meet tougher monsters (1.5% a skill rank)');
  const s1 = createSim({ pace: 1 }); s1.t = 300; spawnEnemy(s1, 'giant', 0, 0);
  close(s1.enemies[0].hp, C.ENEMIES.giant.hp * 2); // pace 1 (ranked week 0) as before
  close(s.enemies[0].speed, C.ENEMIES.giant.speed * .95 * 1.2); // speed-up capped at +20%, reached at 5:00
});

test('spawn crowd grows smoothly toward the last third; hard and co-op keep their scaling', () => {
  const crowd = (t, count = 1, hard = false, pace = 1) => {
    const s = createSim({ hard, pace, players: Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}` })) });
    s.t = t - TICK; s.bossIndex = 99; s.eventT = 1e9; s.spawnAcc = 10000;
    step(s, {}, TICK); return s.enemies.length;
  };
  assert.equal(crowd(0), 75);
  assert.equal(crowd(180), 82);
  assert.equal(crowd(540), 131);
  assert.equal(crowd(900), 230);
  assert.equal(crowd(0, 2), 145);
  assert.equal(crowd(0, 1, true), 75);
  // pace 2 (casual from 3 Nov, ranked from week 1): back to the old crowd by mid-run, growing evenly
  assert.deepEqual([0, 180, 540, 900].map((t) => crowd(t, 1, false, 2)), [125, 155, 215, 275]);
  assert.equal(crowd(0, 2, false, 2), 195);
});

test('each rank adds exactly its advertised skill bonus', () => {
  const p = createSim().players[0], base = playerStats(p);
  for (const [id, stat, per] of [
    ['projectileSpeed', 'projectileSpeed', .1], ['area', 'area', .05],
    ['amount', 'amount', 1], ['luck', 'luck', .15], ['coins', 'coinBonus', .1],
    ['rerolls', 'rerolls', 1], ['revive', 'revives', 1],
  ]) for (let rank = 1; rank <= C.SKILLS[id].max; rank++) {
    close(playerStats(p, { [id]: rank })[stat], base[stat] + per * rank);
  }
});

test('the last-third spawn budget is largest, and endless keeps increasing afterward', () => {
  const budget = (t, count = 1, hard = false) => {
    const s = createSim({ hard, endless: true, players: Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}` })) });
    s.t = t - TICK; s.bossIndex = 99; s.endlessBossT = 1e9; s.eventT = 1e9;
    step(s, {}, TICK); return s.spawnAcc / TICK;
  };
  const a = budget(0), b = budget(300), c = budget(600), d = budget(900);
  assert.ok(a > .9 && a < 1.4, 'a steady starting trickle');
  assert.ok(b > a && c > b && d > c && d - c > c - b, 'pressure increases most late');
  close(budget(300, 1, true) / b, 1.35);
  close(budget(300, 2) / b, 1.6 / 1.15);
  assert.ok(budget(990) > d, 'endless does not flatten after the normal run');
});

test('two overlapping chests each grant a choice instead of losing the second reward', () => {
  const s = createSim(), p = s.players[0]; s.spawnAcc = -1e9;
  s.pickups.push(...[0, 1].map(() => ({ id: s.nextId++, kind: 'chest', x: p.x, z: p.z })));
  step(s, {}, TICK);
  assert.ok(s.pending.p1);
  assert.equal(s.pickups.filter(k => k.kind === 'chest').length, 1);
  // Choosing the first reward lets the second chest open on the following tick.
  const first = s.pending.p1;
  choose(s, 'p1', 0); step(s, {}, TICK);
  assert.ok(s.pending.p1 && s.pending.p1 !== first);
  assert.equal(s.pickups.filter(k => k.kind === 'chest').length, 0);
});

test('treasure goblins also receive the 5% enemy slowdown', () => {
  const s = createSim({ map: { ...C.MAP_BY_ID.greentown, events: ['treasure'] } });
  s.eventT = 0; s.spawnAcc = -1e9;
  step(s, {}, TICK);
  const g = s.enemies.find(e => e.treasure);
  assert.ok(g); close(g.speed, C.PLAYER_BASE.speed * .82 * .95);
});
