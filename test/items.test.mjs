// The 9 Nov items: every SankoQuest wearable, the Neck and Ring slots, weapon metals and arrows, rarity on level-up
// cards, and how they replay. Everything here is pace 2 (casual, ranked from week 1); test/pace1-same.test.mjs proves
// pace 1 (ranked week 0) plays exactly as before.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createSim, step, choose, openCasket, rollChoices, applyChoice, playerStats, snapshot, spawnEnemy, TICK, mulberry32 } from '../src/sim.js';
import { rankedSim, RunRecorder, replay } from '../src/ranked.js';
import {
  GEAR, GEAR_SLOTS, GEAR_SLOT_NAMES, GEAR_SETS, WEAPONS, WEAPON_ITEMS, METAL_FAMILY, BOW_NAMES, ARROW_TIERS, METAL_DMG, ARROW_DMG, ARROW_PIERCE, MAX_WEAPON_LEVEL, MAX_PASSIVE_LEVEL,
  itemIconFile, weaponModelPath, weaponMetal, weaponLook, weaponStep, weaponItem, isWeaponItem, compareWeaponItem, casketWeights, rollCasket, gearBonus, gearOn, gearGroups, alchValue, gearRarity,
  CARD_ODDS, CARD_GAIN, CARD_RARITIES, cardOdds, rarityFromRoll, MAP_BY_ID,
} from '../src/content.js';
import { botInput, pickCard } from '../qa-kit/simlib.mjs';

const icon = (n) => existsSync(new URL(`../public/assets/ui/items/${itemIconFile(n)}`, import.meta.url));
const model = (p) => existsSync(new URL(`../public/assets/models/${p}`, import.meta.url));
const FOLDER = { head: 'Head', chest: 'Chest', hands: 'Hands', legs: 'Legs', feet: 'Feet', back: 'Back' };
const NEW_PIECES = Object.keys(GEAR).filter((n) => GEAR[n].pace === 2);

test('every wearable in SankoQuest\'s catalog is gear, with an icon and a model (amulets and rings need none)', () => {
  const catalog = JSON.parse(readFileSync(new URL('../reference/items-api.json', import.meta.url), 'utf8'));
  const wear = catalog.filter((i) => /^equipment-(head|chest|hands|legs|feet|offhand|back)$/.test(i.category) && !/^NA\d?$/.test(i.name));
  assert.ok(wear.length >= 76, 'the catalog has its wearables: ' + wear.length);
  for (const i of wear) assert.ok(Object.hasOwn(GEAR, i.name), 'missing ' + i.name);
  for (const n of ['NA', 'NA2', 'NA3']) assert.ok(!Object.hasOwn(GEAR, n), 'placeholders stay out');
  for (const piece of ['Helmet', 'Chestplate', 'Gauntlets', 'Leggings', 'Boots']) for (const t of ['Bronze', 'Iron', 'Steel']) {
    const g = GEAR[`${t} ${piece} (t)`], plain = GEAR[`${t} ${piece}`];
    assert.ok(g && g.trim && g.set === t && g.slot === plain.slot, `${t} ${piece} (t)`);
    assert.ok(g.bonus.armor > plain.bonus.armor, 'a trimmed piece is a little better');
  }
  assert.deepEqual([GEAR['Minion Robe'].set, GEAR['Minion Skirt'].set, GEAR_SETS.Minion.pieces], ['Minion', 'Minion', 2]);
  assert.equal(GEAR['Wooden Shield'].slot, 'offhand');
  for (const [n, g] of Object.entries(GEAR)) {
    assert.ok(icon(n), 'icon ' + n);
    if (g.slot === 'neck' || g.slot === 'ring') { assert.ok(!g.model && !g.file, n + ' is not drawn on the hero'); continue; }
    const m = g.model || `playerCharacter/${FOLDER[g.slot]}/Clothing/${g.file || n}.glb`;
    assert.ok(model(m), 'model ' + m);
  }
});

test('Neck and Ring slots: SankoQuest\'s three amulets and six rings of our own, each with a modest bonus', () => {
  assert.deepEqual(GEAR_SLOTS.slice(-2), ['neck', 'ring']);
  assert.deepEqual([GEAR_SLOT_NAMES.neck, GEAR_SLOT_NAMES.ring], ['Neck', 'Ring']);
  const neck = Object.keys(GEAR).filter((n) => GEAR[n].slot === 'neck'), ring = Object.keys(GEAR).filter((n) => GEAR[n].slot === 'ring');
  assert.deepEqual(neck.sort(), ["Magician's Amulet", 'Power Amulet', "Warrior's Amulet"]);
  assert.ok(ring.length >= 4 && ring.length <= 6, 'four to six rings');
  for (const n of ring) {
    const b = GEAR[n].bonus;
    assert.ok(Object.keys(b).length >= 1 && (b.dmg || 0) <= 0.05 && (b.haste || 0) <= 0.05 && (b.speed || 0) <= 0.05 && (b.armor || 0) <= 0.4 && (b.hp || 0) <= 10, 'modest: ' + n);
  }
  assert.ok(GEAR["Magician's Amulet"].bonus.magic > 0 && GEAR["Warrior's Amulet"].bonus.dmg > 0);
  const pw = GEAR['Power Amulet'].bonus; assert.ok(pw.dmg > 0 && pw.magic > 0 && pw.armor > 0 && pw.hp > 0, 'the Power Amulet: a little of everything');
  // worn in a run they count: the Warrior's Amulet and the Ember Band are damage, the Minion set is magic damage
  const sim = createSim({ seed: 1, players: [{ id: 'p1', gear: { neck: "Warrior's Amulet", ring: 'Ember Band', chest: 'Minion Robe', legs: 'Minion Skirt' } }] });
  const st = playerStats(sim.players[0]), plain = playerStats(createSim({ seed: 1 }).players[0]);
  assert.ok(Math.abs(st.might - plain.might - 0.09) < 1e-9, 'might ' + st.might);
  assert.deepEqual(sim.players[0].gb.sets, ['Minion']);
  assert.ok(Math.abs(st.magic - (1 + 0.08 + 0.06 + GEAR_SETS.Minion.bonus.magic)) < 1e-9, 'magic ' + st.magic);
  // the Shard Staff and the Lighter hit harder with magic gear; the Katana does not care (the robe alone: no haste)
  const bolt = (gear, weapon) => { const s = createSim({ seed: 3, players: [{ id: 'p1', weapon, gear }] }); s.spawnAcc = -1e9; s.eventT = 1e9; s.bossIndex = 99; s.shrineT = 1e9; const p = s.players[0]; p.weapons[weapon] = 3; spawnEnemy(s, 'cow', p.x + 2, p.z, 1e6); s.enemies[0].speed = 0; s.rng = () => 0.99; for (let i = 0; i < 90; i++) step(s, {}, TICK); return s.dmgBy[weapon] || 0; };
  const robe = { chest: 'Minion Robe' };
  for (const w of ['staff', 'lighter']) assert.ok(bolt(robe, w) > bolt({}, w) * 1.04, `${w}: magic weapons hit harder`);
  assert.equal(bolt(robe, 'katana'), bolt({}, 'katana'), 'others do not');
});

test('old saves: unknown names are ignored and the new slots start empty', () => {
  assert.deepEqual(gearBonus({ neck: 'Amulet of Nothing', ring: '__proto__', head: 'Dragon Helmet' }), { sets: [] });
  const old = { head: 'Iron Helmet', chest: 'Iron Chestplate', offhand: 'Iron Kiteshield' };
  assert.deepEqual(gearBonus(old), gearBonus({ ...old, neck: undefined, ring: undefined }));
  const sim = createSim({ seed: 2, players: [{ id: 'p1', gear: old }] });
  assert.equal(sim.players[0].gear.neck, undefined); assert.equal(sim.players[0].gear.ring, undefined);
  // pace 1 does not know the new pieces: worn, they count for nothing (as unknown names always did)
  const both = { ...old, neck: 'Power Amulet', ring: 'Bulwark Band', hands: 'Iron Gauntlets (t)' };
  assert.deepEqual(gearBonus(both, {}, 1), gearBonus(old, {}, 1));
  assert.ok(gearBonus(both).armor > gearBonus(old).armor);
  for (const n of NEW_PIECES) { assert.ok(!gearOn(n, 1) && gearOn(n, 2), n); }
});

test('reward caskets: new pieces, amulets and rings join the pool on pace 2 (amulets and rings rarer); pace 1 keeps its pool', () => {
  const rng = mulberry32(11), seen = {}, N = 30000;
  for (let i = 0; i < N; i++) { const n = rollCasket(rng, 2, false, 600); seen[n] = (seen[n] || 0) + 1; }
  for (const n of NEW_PIECES) if (GEAR[n].tier <= 4) assert.ok(seen[n] > 0, 'drops: ' + n);
  const share = (f) => Object.entries(seen).filter(([n]) => f(GEAR[n])).reduce((a, [, c]) => a + c, 0) / N;
  const ringShare = share((g) => g.slot === 'ring') / 6, neckShare = share((g) => g.slot === 'neck') / 3, hatShare = share((g) => g.slot === 'head' && !g.set && !g.pace) / 6;
  assert.ok(ringShare > 0 && ringShare < hatShare && neckShare < hatShare, `a ring ${ringShare}, an amulet ${neckShare}, a hat ${hatShare}`);
  assert.ok(share((g) => g.slot === 'ring' || g.slot === 'neck') < 0.05, 'amulets and rings now and then');
  for (const [rank, hard, t] of [[0, false, 30], [2, true, 500], [5, false, 900]]) for (const [n] of casketWeights(rank, hard, t, { pace: 1, weapons: { katana: 1, bow: 1 } })) assert.ok(!GEAR[n].pace && !isWeaponItem(n), 'pace 1: ' + n);
  for (const n of NEW_PIECES) { const v = alchValue(n); assert.ok(Number.isInteger(v) && v >= 25 && v % 5 === 0, n + ' ' + v); assert.ok(gearRarity(n)); }
});

test('weapon metals: an item for a weapon you carry, never one you lack', () => {
  for (const id of Object.keys(METAL_FAMILY)) for (let i = 0; i < 6; i++) {
    const n = weaponItem(id, 1, i); assert.ok(WEAPON_ITEMS[n] && WEAPON_ITEMS[n].weapon === id, n);
    assert.ok(icon(n), 'icon ' + n); assert.ok(model(weaponModelPath(id, 1, 'model', i)), 'model ' + n);
  }
  BOW_NAMES.forEach((n, i) => { assert.ok(icon(n), 'icon ' + n); assert.ok(model(weaponModelPath('bow', 1, 'model', i)), n); });
  ARROW_TIERS.forEach((t, i) => { assert.ok(icon(`${t} Arrow`), t); assert.ok(model(weaponModelPath('bow', 1, 'arrowModel', i)), t + ' arrow'); });
  const rng = mulberry32(5); let wpn = 0;
  for (let i = 0; i < 20000; i++) {
    const carry = i % 2 ? { katana: 2, bow: 1 } : { axe: 3 };
    const n = rollCasket(rng, i % 4, i % 3 === 0, 100 + (i % 800), { weapons: carry });
    if (isWeaponItem(n)) { wpn++; assert.ok(Object.hasOwn(carry, WEAPON_ITEMS[n].weapon), `${n} without its weapon`); }
    assert.ok(!isWeaponItem(rollCasket(rng, 2, false, 600, { weapons: { staff: 1, lighter: 1 } })), 'no metals for the staff or lighter');
    assert.ok(!isWeaponItem(rollCasket(rng, 2, false, 600)), 'no weapons named: no weapon items');
  }
  assert.ok(wpn > 20000 * 0.04, 'weapon items drop: ' + wpn);
});

// a durable target in front of the hero, crits off, nothing else spawning: damage per weapon is exact
function dealt(weapon, wm, { pace = 2, secs = 2.5, level = 1 } = {}) {
  const s = createSim({ seed: 3, pace, players: [{ id: 'p1', weapon }] }); s.spawnAcc = -1e9; s.eventT = 1e9; s.bossIndex = 99; s.shrineT = 1e9;
  const p = s.players[0]; p.weapons[weapon] = level; p.wm = { ...wm }; spawnEnemy(s, 'cow', p.x + 2, p.z, 1e6); s.enemies[0].speed = 0; s.rng = () => 0.99;
  const proj = [], seen = new Set(); // each projectile as it left the hand (an arrow's pierce counts down as it hits)
  for (let i = 0; i < secs / TICK; i++) { step(s, {}, TICK); for (const pr of s.proj) if (!seen.has(pr.id)) { seen.add(pr.id); proj.push({ ...pr }); } }
  return { dmg: s.dmgBy[weapon] || 0, proj, snap: snapshot(s).players[0] };
}

test('wearing a weapon metal: more damage, its model in hand and in the air; a casket card like gear', () => {
  for (const id of ['katana', 'axe', 'greatsword', 'pickaxe', 'shortsword']) {
    const plain = dealt(id, {}).dmg, mith = dealt(id, { [id]: 3 }).dmg;
    assert.ok(plain > 0 && mith > plain * 1.2, `${id}: ${plain} -> ${mith}`);
    assert.equal(dealt(id, { [id]: 3 }, { pace: 1 }).dmg, dealt(id, {}, { pace: 1 }).dmg, `${id}: pace 1 has no metals`);
  }
  assert.ok(weaponModelPath('katana', 1, 'model', weaponLook('katana', { katana: 3 })).endsWith('mithril_katana.glb'));
  assert.equal(weaponLook('katana', { katana: 1 }, true), 5, 'an evolved weapon keeps its own look');
  assert.ok(dealt('axe', { axe: 4 }).proj.every((pr) => pr.mt === 4), 'thrown axes are Adamantite');
  assert.deepEqual(dealt('katana', { katana: 2 }).snap.wm, { katana: 2 });
  assert.equal(dealt('katana', { katana: 2 }, { pace: 1 }).snap.wm, null, 'pace 1 shows the level\'s look');
  assert.equal(weaponStep('katana', null), null); assert.equal(weaponItem('katana', 3), 'Steel Katana'); assert.equal(weaponItem('katana', 3, 0), 'Bronze Katana');
  // the casket card: what it replaces, the change, Wear or High alch
  const sim = createSim({ seed: 8, players: [{ id: 'p1', weapon: 'katana' }] }), p = sim.players[0];
  p.casketQ.push('Mithril Katana'); assert.ok(openCasket(sim, p));
  const pend = sim.pending.p1;
  assert.equal(pend.casket.item, 'Mithril Katana'); assert.equal(pend.casket.old, 'Bronze Katana');
  assert.equal(pend.casket.delta.wdmg, Math.round((METAL_DMG[3] - 1) * 1000) / 1000); assert.equal(pend.rec, 0);
  assert.deepEqual(pend.choices.map((c) => c.kind), ['wear', 'alch']); assert.equal(pend.choices[1].level, alchValue('Mithril Katana'));
  choose(sim, 'p1', 0); assert.equal(p.wm.katana, 3); assert.ok(sim.fx.some((f) => f.k === 'casket' && f.worn && f.weapon === 'katana' && f.old === 'Bronze Katana'));
  // a worse one is a downgrade: High alch is recommended, and alching keeps the Mithril
  p.casketQ.push('Iron Katana'); openCasket(sim, p); assert.equal(sim.pending.p1.rec, 1); assert.ok(!sim.pending.p1.casket.anyUp);
  choose(sim, 'p1', 1); assert.equal(p.wm.katana, 3); assert.equal(p.alch, alchValue('Iron Katana'));
});

test('arrows go on the Bow: more damage and pierce; better bows hit harder', () => {
  const plain = dealt('bow', {}), mith = dealt('bow', { arrow: 3 }), glacial = dealt('bow', { bow: 3 });
  const base = WEAPONS.bow.stats(1).pierce;
  assert.ok(plain.proj.length && plain.proj.every((pr) => pr.pierce === base));
  assert.ok(mith.proj.every((pr) => pr.pierce === base + ARROW_PIERCE[3] && pr.mt === 3), 'Mithril arrows pierce twice more');
  const d0 = plain.proj[0].dmg, d1 = mith.proj[0].dmg, d2 = glacial.proj[0].dmg;
  assert.ok(Math.abs(d1 / d0 - ARROW_DMG[3]) < 1e-9 && d2 > d1, `${d0} ${d1} ${d2}`);
  assert.deepEqual(weaponMetal('bow', { bow: 1, arrow: 4 }), { dmg: METAL_DMG[1] * ARROW_DMG[4], pierce: ARROW_PIERCE[4] });
  const c = compareWeaponItem({}, 'Steel Arrow'); assert.equal(c.old, 'Bronze Arrow'); assert.ok(c.better && c.delta.pierce === 1);
  // pace 1: arrows as before, whatever the player holds
  const p1 = dealt('bow', { arrow: 4 }, { pace: 1 }); assert.ok(p1.proj.every((pr) => pr.pierce === base && pr.mt === undefined));
});

test('level-up card rarity: the odds over many seeds are close to the table, and luck lifts them a little', () => {
  assert.deepEqual(CARD_ODDS, [70, 22, 7, 1]); assert.deepEqual(CARD_GAIN, [1, 1, 1, 1]);
  const count = (greed) => {
    const n = [0, 0, 0, 0]; let total = 0;
    for (let seed = 1; seed <= 2500; seed++) { const s = createSim({ seed }), p = s.players[0]; if (greed) p.passives.greed = greed; for (const c of rollChoices(s, p)) if (c.rarity) { n[CARD_RARITIES.indexOf(c.rarity)]++; total++; } }
    return n.map((x) => (x / total) * 100);
  };
  const o = count(0);
  assert.ok(Math.abs(o[0] - 70) < 2 && Math.abs(o[1] - 22) < 2 && Math.abs(o[2] - 7) < 1.2 && Math.abs(o[3] - 1) < 0.5, 'odds ' + o.map((x) => x.toFixed(2)));
  const lucky = count(5), want = cardOdds(0.2);
  assert.ok(lucky[1] > o[1] + 2 && lucky[2] > o[2] && Math.abs(lucky[1] - want[1]) < 2.2, 'lucky ' + lucky.map((x) => x.toFixed(2)));
  // the roll -> rarity mapping itself
  assert.deepEqual([0.005, 0.05, 0.2, 0.5, 0.999].map((u) => rarityFromRoll(u)), [3, 2, 1, 0, 0]);
  // pace 1: no rarity on any card
  for (let seed = 1; seed < 50; seed++) { const s = createSim({ seed, pace: 1 }); for (const c of rollChoices(s, s.players[0])) assert.deepEqual(Object.keys(c), ['kind', 'id', 'level']); }
});

test('rarer cards retain strength at one level per pick, never past the max; Epic heals to full', () => {
  const at = (u, setup) => { const s = createSim({ seed: 4 }), p = s.players[0]; setup(p); s.rng = () => u; return { s, p, cards: rollChoices(s, p) }; };
  // Rare everywhere (roll 0.05): one level and 30 retained bonus points, including new acquisitions.
  { const { s, p, cards } = at(0.05, () => {}); for (const c of cards) { assert.equal(c.rarity, 'rare'); assert.equal(c.level - c.from, 1); }
    const nw = cards.find((c) => c.from === 0); assert.ok(nw); applyChoice(s, p, nw); const key = nw.kind === 'weapon' ? 'weapons' : 'passives'; assert.equal(p[key][nw.id], 1); assert.equal(p.quality[key][nw.id], 30); }
  // Near the cap every rarity still fits; Curse is a fixed-risk, unrolled offer.
  for (let seed = 1; seed <= 400; seed++) {
    const s = createSim({ seed }), p = s.players[0];
    p.weapons = { katana: 5, bow: 4, axe: 6 }; p.passives = { might: 4, haste: 3, vigor: 5 };
    for (const c of rollChoices(s, p)) {
      if (c.kind === 'evolve' || c.kind === 'heal') continue;
      const max = c.kind === 'weapon' ? MAX_WEAPON_LEVEL : MAX_PASSIVE_LEVEL, have = (c.kind === 'weapon' ? p.weapons : p.passives)[c.id] || 0;
      assert.equal(c.from, have); assert.ok(c.level > c.from && c.level <= max, JSON.stringify(c));
      assert.equal(c.level - c.from, 1);
      if (c.id === 'curse') assert.equal(c.rarity, undefined);
      else assert.equal(CARD_GAIN[CARD_RARITIES.indexOf(c.rarity)], 1);
      const pp = structuredClone(p); pp.hp = 10;
      applyChoice(s, pp, c); assert.ok((c.kind === 'weapon' ? pp.weapons : pp.passives)[c.id] <= max);
      if (c.rarity === 'epic') assert.equal(pp.hp, pp.maxHp, 'an Epic card heals to full');
    }
  }
  { const { s, p, cards } = at(0.005, (q) => { q.weapons = { katana: 5 }; }); const k = cards.find((c) => c.id === 'katana'); p.hp = 5;
    assert.deepEqual([k.rarity, k.from, k.level], ['epic', 5, 6]); applyChoice(s, p, k); assert.equal(p.weapons.katana, 6); assert.equal(p.hp, p.maxHp); }
  // the heal card heals more the rarer it is
  const heal = (u) => { const s = createSim({ seed: 1 }), p = s.players[0]; p.maxHp = 1000; p.hp = 1; s.rng = () => u; applyChoice(s, p, { kind: 'heal', id: 'fish', level: 1, rarity: CARD_RARITIES[rarityFromRoll(u)] }); return p.hp; };
  assert.ok(heal(0.9) < heal(0.2) && heal(0.2) < heal(0.05) && heal(0.005) === 1000);
});

test('gear panel groups: every piece of a slot exactly once, the metal ladder in order, then sets, then specials', () => {
  for (const sl of GEAR_SLOTS) {
    const groups = gearGroups(sl), all = groups.flatMap((g) => g.items);
    assert.deepEqual([...all].sort(), Object.keys(GEAR).filter((n) => GEAR[n].slot === sl).sort(), sl);
    const titles = groups.map((g) => g.title), si = titles.indexOf('Sets'), sp = titles.findIndex((t) => ['Specials', 'Amulets', 'Rings', 'Capes'].includes(t));
    if (si >= 0 && sp >= 0) assert.ok(si < sp, 'sets before specials');
  }
  assert.deepEqual(gearGroups('head')[0].items.slice(0, 4), ['Bronze Helmet', 'Bronze Helmet (t)', 'Iron Helmet', 'Iron Helmet (t)']);
  assert.equal(gearGroups('head')[0].items.at(-1), 'Runite Helmet');
  assert.deepEqual(gearGroups('offhand').map((g) => g.title), ['Shields', 'Kiteshields', 'Specials']);
  assert.equal(gearGroups('offhand')[0].items[0], 'Wooden Shield');
  assert.deepEqual(gearGroups('neck').map((g) => g.title), ['Amulets']); assert.deepEqual(gearGroups('ring').map((g) => g.title), ['Rings']);
  assert.ok(gearGroups('chest').find((g) => g.title === 'Sets').items.includes('Minion Robe'));
});

// a ranked week-1 run (pace 2) played by the QA kiting bot: rare cards, weapon metals worn from caskets, replayed exactly
const MELEE = ['katana', 'greatsword', 'pickaxe', 'shield', 'lighter'];
function week1Run(seed, mapId, adv, mode) {
  const params = { seed, mapId, adv, ground: null, week: 1, mode };
  const sim = rankedSim(params), rec = new RunRecorder(), p = sim.players[0], rnd = mulberry32(seed);
  let rare = 0, metals = 0;
  while (!sim.over) {
    const pend = sim.pending.p1;
    if (pend) {
      let i;
      if (pend.casket) i = isWeaponItem(pend.casket.item) ? (pend.casket.better ? 0 : 1) : rnd() < 0.5 ? 0 : 1;
      else { i = pickCard(pend.choices, p); if (pend.choices[i].rarity && pend.choices[i].rarity !== 'common') rare++; }
      if (pend.casket && i === 0 && isWeaponItem(pend.casket.item)) metals++;
      rec.pick(i); choose(sim, 'p1', i); continue;
    }
    // kite until 10:00, then walk into the crowd: the run ends by itself, so the replay ends the same way
    let { mx, mz } = botInput(sim, p, MAP_BY_ID[mapId], MELEE.includes(Object.keys(p.weapons)[0]));
    if (sim.t > 600) { let best = null, bd = 1e9; for (const e of sim.enemies) { const d = Math.hypot(e.x - p.x, e.z - p.z); if (d < bd) { bd = d; best = e; } } if (best && bd > 0.01) { mx = (best.x - p.x) / bd; mz = (best.z - p.z) / bd; } }
    const before = sim.tick; step(sim, { p1: rec.input(mx, mz, null) }, TICK); rec.after(sim.tick !== before); sim.fx.length = 0;
  }
  return { sim, log: rec.log(), params, rare, metals, wm: { ...p.wm } };
}
test('a ranked week-1 run with rare cards and weapon metals replays exactly', () => {
  let found = null;
  for (const [seed, map, adv, mode] of [[305, 'goblins', 'ranger', 'normal']]) { // genuine inputs earn rare cards and a weapon metal with the current opening
    const r = week1Run(seed, map, adv, mode);
    if (r.rare > 0 && r.metals > 0) { found = r; break; }
  }
  assert.ok(found, 'a run met a rare card and wore a weapon metal');
  assert.ok(Object.keys(found.wm).length > 0);
  const { sim, log, params } = found, back = replay(log, params);
  assert.ok(!back.error, back.error);
  assert.deepEqual([back.t, back.kills, back.level, back.won, back.timeUp], [Math.floor(sim.t), sim.kills, sim.level, sim.over === 'win', sim.over === 'time']);
  // the same inputs as a week-0 (pace 1) run are another run
  const old = replay(log, { ...params, week: 0, mode: 'normal' });
  assert.ok(old.error || old.kills !== back.kills || old.t !== back.t);
});
