// Reward caskets: the gear pool, the casket odds, and the Wear / High alch card (a recorded choice, like a level-up).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createSim, step, choose, reroll, skipLevel, autoChoice, TICK, mulberry32 } from '../src/sim.js';
import { rankedSim, RunRecorder, replay } from '../src/ranked.js';
import { rankedChoice, rankedStep, resumeRanked } from '../src/ranked-play.js';
import {
  GEAR, GEAR_SLOTS, GEAR_SETS, ARMOR_TIERS, MAP_BY_ID, MAPS, gearBonus, rollCasket, casketWeights, casketRank, compareGear,
  alchValue, gearRarity, itemIconFile,
  ADVENTURER_BY_ID,
} from '../src/content.js';
import { botInput } from '../qa-kit/simlib.mjs';
// the QA kiting bot (keeps its distance, walks to pickups): it lives long enough to meet casket cards
const kite = (sim, p, map) => botInput(sim, p, MAP_BY_ID[map], ['katana', 'greatsword', 'pickaxe', 'shield', 'lighter'].includes(ADVENTURER_BY_ID[p.adv].weapon));

const PIECES = ['Helmet', 'Chestplate', 'Gauntlets', 'Leggings', 'Boots'];
const SPECIALS = ['Shape Wizard Hat', 'Shape Robe', 'Shape Skirt', 'Wizard Hat', 'Wizard Robe', 'Wizard Skirt', 'Ranger Helmet', 'Ranger Chestplate', 'Ranger Gauntlets', 'Ranger Leggings', 'Ranger Boots',
  'Beret', 'Straw Hat', 'Bowler Hat', 'Hamburger Hat', 'Mystic Hat', 'Pumpkin Head', 'Uggs Boots', 'Winged Boots', 'Green Boots', 'Quilted Boots', 'Cape', 'Ogre Shield'];

// put a casket at the player's feet and step until it is picked up
function pickUp(sim, n = 1) {
  const p = sim.players[0];
  for (let i = 0; i < n; i++) sim.pickups.push({ id: sim.nextId++, x: p.x, z: p.z, kind: 'casket' });
  sim.spawnAcc = -1e9; sim.eventT = 1e9;
  for (let i = 0; i < 5 && sim.pickups.some((k) => k.kind === 'casket'); i++) step(sim, {}, TICK);
}

test('the pool has every metal tier (Runite too) as all five pieces and both shields, plus every special', () => {
  assert.deepEqual(ARMOR_TIERS, ['Bronze', 'Iron', 'Steel', 'Mithril', 'Adamantite', 'Runite']);
  assert.ok(GEAR_SLOTS.includes('offhand'));
  for (const [i, t] of ARMOR_TIERS.entries()) {
    for (const piece of PIECES) { const g = GEAR[`${t} ${piece}`]; assert.ok(g, `${t} ${piece}`); assert.equal(g.tier, i); assert.equal(g.set, t); }
    for (const sh of ['Kiteshield', 'Shield']) { const g = GEAR[`${t} ${sh}`]; assert.ok(g && g.slot === 'offhand' && g.tier === i && g.bonus.armor > 0, `${t} ${sh}`); assert.ok(existsSync(new URL(`../public/assets/models/${g.model}`, import.meta.url)), g.model); }
  }
  for (const n of SPECIALS) assert.ok(GEAR[n], n);
  for (const n of Object.keys(GEAR)) assert.ok(existsSync(new URL(`../public/assets/ui/items/${itemIconFile(n)}`, import.meta.url)), 'icon ' + n);
  // Runite's set is above Adamantite's in every stat it shares
  for (const [k, v] of Object.entries(GEAR_SETS.Adamantite.bonus)) assert.ok(GEAR_SETS.Runite.bonus[k] > v, k);
  // a full Runite set
  const full = Object.fromEntries(PIECES.map((piece, i) => [['head', 'chest', 'hands', 'legs', 'feet'][i], `Runite ${piece}`]));
  assert.deepEqual(gearBonus(full).sets, ['Runite']);
  // shields never complete a metal set on their own
  assert.deepEqual(gearBonus({ head: 'Iron Helmet', chest: 'Iron Chestplate', hands: 'Iron Gauntlets', legs: 'Iron Leggings', offhand: 'Iron Kiteshield' }).sets, []);
  // old saves: unknown names (and prototype keys) are ignored
  assert.deepEqual(gearBonus({ head: 'Dragon Helmet', chest: '__proto__', feet: 'constructor' }), { sets: [] });
});

test('alch values grow with tier and rarity', () => {
  for (const piece of PIECES) for (let i = 1; i < ARMOR_TIERS.length; i++) assert.ok(alchValue(`${ARMOR_TIERS[i]} ${piece}`) > alchValue(`${ARMOR_TIERS[i - 1]} ${piece}`), piece);
  assert.equal(gearRarity('Iron Helmet'), 'common'); assert.equal(gearRarity('Beret'), 'rare'); assert.equal(gearRarity('Ogre Shield'), 'unique');
  assert.ok(alchValue('Beret') > alchValue('Iron Helmet'));
  for (const n of Object.keys(GEAR)) { const v = alchValue(n); assert.ok(Number.isInteger(v) && v >= 25 && v % 5 === 0, n + ' ' + v); }
});

test('rollCasket stays in the pool and follows map, time and hard mode', () => {
  const rng = mulberry32(5), tierOf = (n) => GEAR[n].tier;
  const avg = (rank, hard, t, N = 3000) => { let s = 0, runite = 0; for (let i = 0; i < N; i++) { const n = rollCasket(rng, rank, hard, t); assert.ok(GEAR[n], n); s += tierOf(n); if (tierOf(n) === 5) runite++; } return { avg: s / N, runite: runite / N }; };
  // early in a Greentown run: only Bronze and Iron-tier pieces
  for (let i = 0; i < 2000; i++) assert.ok(tierOf(rollCasket(rng, 0, false, 30)) <= 1);
  // Runite never early, never on Greentown, rare late on later maps
  assert.equal(avg(5, false, 300).runite, 0); assert.equal(avg(0, false, 850).runite, 0);
  const late = avg(5, false, 850); assert.ok(late.runite > 0 && late.runite < 0.04, 'runite ' + late.runite);
  assert.ok(avg(1, false, 600).avg > avg(0, false, 600).avg, 'later maps give better tiers');
  assert.ok(avg(2, false, 800).avg > avg(2, false, 150).avg, 'later in the run gives better tiers');
  assert.ok(avg(0, true, 400).avg > avg(0, false, 400).avg, 'hard mode gives better tiers');
  for (const [rank, hard, t] of [[0, false, 0], [3, true, 900], [9, true, 5000]]) for (const [n, w] of casketWeights(rank, hard, t)) assert.ok(GEAR[n] && w > 0);
  // Tutorial Island counts as the first map, the Whole World as the fourth
  assert.equal(casketRank(MAP_BY_ID.tutorial), 0); assert.equal(casketRank(MAP_BY_ID.world), 3); assert.equal(casketRank(MAPS[1]), 1);
});

test('compareGear: stat changes, set progress and the recommendation', () => {
  const c = compareGear({ head: 'Bronze Helmet' }, {}, 'Iron Helmet');
  assert.equal(c.old, 'Bronze Helmet'); assert.equal(c.slot, 'head'); assert.ok(c.better && c.anyUp); assert.equal(c.delta.armor, 0.1);
  const d = compareGear({ head: 'Mithril Helmet' }, {}, 'Bronze Helmet');
  assert.ok(!d.better && !d.anyUp); assert.ok(d.delta.armor < 0);
  const same = compareGear({ head: 'Iron Helmet' }, {}, 'Iron Helmet'); assert.ok(!same.better && !same.anyUp); assert.deepEqual(same.delta, {});
  const mixed = compareGear({ head: 'Iron Helmet' }, {}, 'Beret'); assert.ok(mixed.anyUp && mixed.delta.armor < 0 && mixed.delta.speed > 0);
  // the fifth piece completes the set and the card says so
  const four = { head: 'Steel Helmet', chest: 'Steel Chestplate', hands: 'Steel Gauntlets', legs: 'Steel Leggings', feet: 'Bronze Boots' };
  const s = compareGear(four, {}, 'Steel Boots'); assert.deepEqual(s.setsGained, ['Steel']); assert.deepEqual(s.set, { name: 'Steel', have: 5, need: 5 }); assert.ok(s.better);
  const lose = compareGear({ ...four, feet: 'Steel Boots' }, {}, 'Winged Boots'); assert.deepEqual(lose.setsLost, ['Steel']);
  // Armoury levels count
  assert.ok(!compareGear({ head: 'Iron Helmet' }, { 'Iron Helmet': 3 }, 'Steel Helmet').better);
});

test('an empty slot wears the casket item straight away; an occupied one pauses on a Wear / High alch card', () => {
  const sim = createSim({ seed: 9, map: MAP_BY_ID.greentown, players: [{ id: 'p1', adv: 'adventurer' }] });
  const p = sim.players[0]; p.godMode = true; p.hp = p.maxHp = 1e6;
  sim.enemies.length = 0;
  // empty: worn, no card
  p.casketQ = []; sim.loot = [];
  pickUp(sim);
  assert.equal(sim.loot.length, 1);
  const first = sim.loot[0], slot = GEAR[first].slot;
  assert.equal(p.gear[slot], first); assert.ok(!sim.pending.p1, 'no card for an empty slot');
  // fill every slot, then a casket must pause on a card
  for (const s of GEAR_SLOTS) if (!p.gear[s]) p.gear[s] = Object.keys(GEAR).find((n) => GEAR[n].slot === s);
  p.gb = gearBonus(p.gear, {});
  pickUp(sim);
  const pend = sim.pending.p1; assert.ok(pend && pend.casket, 'card open');
  assert.equal(pend.choices.length, 2); assert.equal(pend.choices[0].kind, 'wear'); assert.equal(pend.choices[1].kind, 'alch');
  assert.equal(pend.casket.item, sim.loot[1]); assert.equal(pend.casket.old, p.gear[GEAR[sim.loot[1]].slot]);
  assert.equal(pend.rec, pend.casket.better ? 0 : 1);
  // the world is paused while the card is open
  const t = sim.t; step(sim, {}, TICK); assert.equal(sim.t, t);
  // no reroll or skip on a casket card
  assert.equal(reroll(sim, 'p1'), false); assert.equal(skipLevel(sim, 'p1'), false);
});

function cardSim() {
  const sim = createSim({ seed: 9, map: MAP_BY_ID.greentown, players: [{ id: 'p1', adv: 'adventurer' }] });
  const p = sim.players[0]; p.godMode = true; p.hp = p.maxHp = 1e6; sim.enemies.length = 0;
  for (const s of GEAR_SLOTS) p.gear[s] = Object.keys(GEAR).find((n) => GEAR[n].slot === s && GEAR[n].tier === 0) || Object.keys(GEAR).find((n) => GEAR[n].slot === s);
  p.gb = gearBonus(p.gear, {});
  return { sim, p };
}

test('Wear puts the item on and the old one is gone; High alch pays its coins and keeps what you wear', () => {
  { const { sim, p } = cardSim(); pickUp(sim); const item = sim.pending.p1.casket.item, slot = GEAR[item].slot, old = p.gear[slot];
    assert.ok(old && choose(sim, 'p1', 0)); assert.equal(p.gear[slot], item); assert.ok(!Object.values(p.gear).includes(old) || old === item, 'the old piece is off');
    assert.deepEqual(p.gb, gearBonus(p.gear, {})); assert.equal(p.alch, 0); assert.ok(!sim.pending.p1); assert.deepEqual(sim.alched, []); }
  { const { sim, p } = cardSim(); pickUp(sim); const item = sim.pending.p1.casket.item, slot = GEAR[item].slot, before = { ...p.gear };
    assert.ok(choose(sim, 'p1', 1)); assert.deepEqual(p.gear, before); assert.equal(p.alch, alchValue(item)); assert.deepEqual(sim.alched, [item]);
    assert.ok(sim.fx.some((f) => f.k === 'alch' && f.item === item && f.coins === alchValue(item))); void slot; }
});

test('several caskets queue one after another, and a level-up card goes first', () => {
  const { sim, p } = cardSim();
  pickUp(sim, 3);
  assert.equal(sim.loot.length, 3);
  assert.ok(sim.pending.p1.casket); assert.equal(sim.pending.p1.more, 2);
  choose(sim, 'p1', 1); assert.ok(sim.pending.p1.casket); assert.equal(sim.pending.p1.more, 1);
  choose(sim, 'p1', 0); assert.ok(sim.pending.p1.casket); assert.equal(sim.pending.p1.more, 0);
  choose(sim, 'p1', 1); assert.ok(!sim.pending.p1);
  assert.equal(sim.alched.length, 2);
  // a level-up and a casket on the same step: the level-up card first, then the casket
  sim.xp = sim.xpNeed - 0.5; sim.gems.push({ id: sim.nextId++, x: p.x, z: p.z, v: 1, pulled: true });
  pickUp(sim);
  assert.ok(sim.pending.p1 && !sim.pending.p1.casket, 'level-up first'); assert.equal(p.casketQ.length, 1);
  choose(sim, 'p1', 0); assert.ok(sim.pending.p1 && sim.pending.p1.casket, 'then the casket');
});

test('a casket card left open picks the recommended choice when its timer runs out', () => {
  const { sim, p } = cardSim(); pickUp(sim);
  const rec = sim.pending.p1.rec, item = sim.pending.p1.casket.item; assert.equal(autoChoice(sim.pending.p1), rec);
  while (sim.pending.p1) step(sim, {}, 1);
  if (rec === 0) assert.equal(p.gear[GEAR[item].slot], item); else assert.equal(p.alch, alchValue(item));
});

// the auto high alch setting lives in the game, not the sim: it picks High alch for the player (a recorded pick, so
// replays need no setting). This mirrors main.js: open card + nothing improves -> pick 1.
const autoAlch = (pend) => pend && pend.casket && !pend.casket.anyUp;
test('auto high alch skips the card only for pieces that improve nothing', () => {
  const { sim, p } = cardSim();
  for (const s of GEAR_SLOTS) { const best = Object.keys(GEAR).filter((n) => GEAR[n].slot === s).sort((a, b) => GEAR[b].tier - GEAR[a].tier)[0]; p.gear[s] = best; }
  p.gb = gearBonus(p.gear, {});
  let autos = 0, shown = 0;
  for (let i = 0; i < 20; i++) {
    pickUp(sim);
    while (sim.pending.p1) { if (autoAlch(sim.pending.p1)) { autos++; choose(sim, 'p1', 1); } else { shown++; choose(sim, 'p1', 1); } }
  }
  assert.ok(autos > 0, 'downgrades were alched without a card');
  assert.equal(compareGear({ head: 'Runite Helmet' }, {}, 'Bronze Helmet').anyUp, false);
  assert.equal(compareGear({ head: 'Bronze Helmet' }, {}, 'Beret').anyUp, true, 'a sidegrade still shows its card');
  void shown;
});

// a ranked bot that meets casket cards: wears, alches, lets one time out, and never rerolls or skips a casket card
function rankedRun(seed, mapId, adv, { cap = 1e9, autoOn = false } = {}) {
  const params = { seed, mapId, adv, ground: null, week: 0 };
  const sim = rankedSim(params), rec = new RunRecorder(), p = sim.players[0], rnd = mulberry32(seed * 7);
  let cards = 0, wears = 0, alchs = 0;
  // drop extra caskets on a schedule, part of the deterministic run (a test of the card, not of the drop rate)
  while (!sim.over) {
    if (sim.pending.p1) {
      const pend = sim.pending.p1;
      if (pend.casket) {
        cards++;
        if (autoOn && !pend.casket.anyUp) { assert.ok(rankedChoice(sim, rec, 1)); alchs++; continue; }
        const i = rnd() < 0.5 ? 0 : 1; assert.ok(rankedChoice(sim, rec, i)); if (i) alchs++; else wears++;
      } else assert.ok(rankedChoice(sim, rec, Math.floor(rnd() * pend.choices.length)));
      continue;
    }
    let fx = Math.cos(sim.t * 0.4) * 0.3, fz = Math.sin(sim.t * 0.4) * 0.3;
    for (const e of sim.enemies) { const dx = p.x - e.x, dz = p.z - e.z, d = Math.hypot(dx, dz); if (d < 4 && d > 0.01) { fx += dx / d / d; fz += dz / d / d; } }
    const l = Math.hypot(fx, fz) || 1;
    rankedStep(sim, rec, fx / l, fz / l, null);
    sim.fx.length = 0;
    if (sim.tick % 600 === 300) sim.pickups.push({ id: sim.nextId++, x: p.x, z: p.z, kind: 'casket' });
    if (sim.t > cap && !sim.over) { p.hp = 0; p.alive = false; rankedStep(sim, rec, 0, 0, null); }
  }
  return { sim, log: rec.log(), params, cards, wears, alchs };
}

test('a ranked run with casket choices replays to the exact result (and resumes mid-run with a card open)', () => {
  // the sim's own drops only (bosses and elites always drop one), so the replay sees the same caskets
  let total = 0;
  for (const [seed, map, adv] of [[42, 'apache', 'ranger'], [44, 'apache', 'knight']]) {
    const params = { seed, mapId: map, adv, ground: null, week: 0 };
    let sim = rankedSim(params), rec = new RunRecorder(), cut = false;
    const rnd = mulberry32(seed);
    let cards = 0;
    while (!sim.over) {
      const pend = sim.pending.p1;
      if (pend) {
        if (pend.casket && !cut) { // save and resume with the casket card still open, as after a reload
          const copy = JSON.parse(JSON.stringify(rec.log()));
          ({ sim, rec } = resumeRanked(copy, params)); cut = true;
          assert.ok(sim.pending.p1 && sim.pending.p1.casket, 'the card is open again after resuming');
          continue;
        }
        if (pend.casket) { cards++; assert.ok(rankedChoice(sim, rec, cards % 3 === 0 ? 'a' : rnd() < 0.5 ? 0 : 1)); }
        else assert.ok(rankedChoice(sim, rec, 0));
        continue;
      }
      const b = kite(sim, sim.players[0], map); rankedStep(sim, rec, b.mx, b.mz, null); sim.fx.length = 0;
    }
    total += cards;
    const log = rec.log(), r = replay(log, params);
    assert.ok(!r.error, r.error);
    assert.deepEqual([r.t, r.kills, r.level, r.won], [Math.floor(sim.t), sim.kills, sim.level, sim.over === 'win'], map);
    const back = resumeRanked(JSON.parse(JSON.stringify(log)), params);
    assert.deepEqual([back.sim.kills, back.sim.level, back.sim.players[0].gear, back.sim.players[0].alch], [sim.kills, sim.level, sim.players[0].gear, sim.players[0].alch]);
  }
  assert.ok(total > 3, 'the runs met casket cards: ' + total);
});

test('casket choices are part of the replay: a different choice gives a different run, a bad one is refused', () => {
  const params = { seed: 44, mapId: 'apache', adv: 'knight', ground: null, week: 0 };
  const sim = rankedSim(params), rec = new RunRecorder(), p = sim.players[0];
  let first = -1;
  while (!sim.over) {
    const pend = sim.pending.p1;
    if (pend) { if (pend.casket && first < 0) first = rec.picks.length; assert.ok(rankedChoice(sim, rec, pend.casket ? 1 : 0)); continue; }
    const b = kite(sim, p, 'apache'); rankedStep(sim, rec, b.mx, b.mz, null); sim.fx.length = 0;
  }
  assert.ok(first >= 0, 'met a casket card');
  const log = rec.log(), honest = replay(log, params); assert.ok(!honest.error, honest.error);
  // a reroll or skip on a casket card is refused
  for (const bad of ['r', 's', 2]) { const l = structuredClone(log); l.picks[first] = bad; assert.ok(replay(l, params).error, 'refused ' + bad); }
  // Wear instead of High alch on the first card: the replayed run is not the same run
  const worn = structuredClone(log); worn.picks[first] = 0;
  let differs = true;
  try { const b = resumeRanked(worn, params).sim; differs = b.players[0].alch !== sim.players[0].alch || JSON.stringify(b.players[0].gear) !== JSON.stringify(sim.players[0].gear); } catch { /* the log no longer fits */ }
  assert.ok(differs);
});

test('ranked: no starting gear, caskets still drop and the card works', () => {
  const sim = rankedSim({ seed: 3, mapId: 'greentown', adv: 'adventurer', ground: null, week: 0 });
  assert.deepEqual(sim.players[0].gear, {});
  const { cards } = rankedRun(45, 'greentown', 'adventurer', { cap: 500, autoOn: true });
  assert.ok(cards > 0);
});

test('random ranked runs with casket cards replay exactly', () => {
  for (let seed = 50; seed < 54; seed++) {
    const map = ['greentown', 'apache', 'duel', 'graves'][seed % 4];
    const params = { seed, mapId: map, adv: 'adventurer', ground: null, week: 0 };
    const sim = rankedSim(params), rec = new RunRecorder(), p = sim.players[0], rnd = mulberry32(seed);
    let hold = 0, mx = 0, mz = 0;
    while (!sim.over) {
      const pend = sim.pending.p1;
      if (pend) { assert.ok(rankedChoice(sim, rec, pend.casket ? (rnd() < 0.2 ? 'a' : Math.floor(rnd() * 2)) : Math.floor(rnd() * pend.choices.length))); continue; }
      if (hold-- <= 0) { const a = rnd() * 6.283; mx = Math.cos(a); mz = Math.sin(a); hold = 10 + Math.floor(rnd() * 60); }
      rankedStep(sim, rec, mx, mz, sim.tick % 500 === 250 ? Math.floor(rnd() * 4) : null); sim.fx.length = 0;
      if (sim.t > 600 && !sim.over) { p.hp = 0; p.alive = false; rankedStep(sim, rec, 0, 0, null); }
    }
    const r = replay(rec.log(), params); assert.ok(!r.error, `seed ${seed}: ${r.error}`);
    assert.deepEqual([r.t, r.kills, r.level, r.won], [Math.floor(sim.t), sim.kills, sim.level, sim.over === 'win'], `seed ${seed}`);
  }
});
