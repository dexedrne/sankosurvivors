// Ranked week 0 (pace 1) must play bit for bit as it did before the 9 Nov items: no card rarity, no weapon metals, the
// old casket pool, and the new pieces counting for nothing. The numbers below were made by test/pace1-play.mjs run against
// main's checkout (fdc54f9; 3e5afa7 and 5bba35a give the same) with tools/pace1-baseline.mjs; this branch must give
// exactly the same kills, time, level and fingerprint of every card and casket the runs met.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSim, step, choose, reroll, TICK, mulberry32 } from '../src/sim.js';
import { rankedSim, RunRecorder, replay } from '../src/ranked.js';
import { MAP_BY_ID, casketWeights, rollCasket, gearBonus } from '../src/content.js';
import { botInput, pickCard } from '../qa-kit/simlib.mjs';
import { playPace1, PACE1_RUNS, playImmortal, IMMORTAL_RUNS, tablesPace1 } from './pace1-play.mjs';

const M = { rankedSim, RunRecorder, step, choose, reroll, TICK, mulberry32, botInput, pickCard, createSim, MAP_BY_ID };
// The suite runs test files side by side and the ranked API test has a CPU-time budget, so this file plays the quicker
// runs (6 of the 8 ranked runs, 1 of the 2 immortal ones, about 40 s). tools/pace1-baseline.mjs runs them all: every one
// matched main (ITEMS.md).
const QUICK_RANKED = PACE1_RUNS.filter((r) => r.seed !== 101 && r.seed !== 106), QUICK_IMMORTAL = IMMORTAL_RUNS.filter((r) => r.seed === 201);

// from main (see above): one line per run, as the generator printed it
const MAIN = {
  tables: 2885508957,
  immortal: [
    { seed: 201, mapId: 'apache', adv: 'farmer', t: 800, kills: 3076, level: 32, cards: 33, caskets: 25, loot: 26, hash: 4035395673 },
    { seed: 202, mapId: 'goblins', adv: 'ranger', t: 800, kills: 2596, level: 31, cards: 30, caskets: 9, loot: 9, hash: 2319327353 },
  ],
  ranked: [
    { seed: 101, mapId: 'greentown', adv: 'adventurer', t: 547, kills: 235, level: 10, cards: 12, caskets: 0, loot: 1, hash: 3435487261, replay: [547, 235, 10, null] },
    { seed: 102, mapId: 'apache', adv: 'ranger', t: 200, kills: 282, level: 13, cards: 15, caskets: 0, loot: 1, hash: 4102331921, replay: [200, 282, 13, null] },
    { seed: 103, mapId: 'graves', adv: 'wizard', t: 297, kills: 338, level: 11, cards: 13, caskets: 0, loot: 0, hash: 4216742610, replay: [297, 338, 11, null] },
    { seed: 104, mapId: 'goblins', adv: 'knight', t: 320, kills: 527, level: 15, cards: 17, caskets: 1, loot: 4, hash: 3242056869, replay: [320, 527, 15, null] },
    { seed: 105, mapId: 'duel', adv: 'farmer', t: 376, kills: 713, level: 16, cards: 18, caskets: 0, loot: 3, hash: 3865756888, replay: [376, 713, 16, null] },
    { seed: 106, mapId: 'greentown', adv: 'knight', t: 773, kills: 169, level: 8, cards: 9, caskets: 0, loot: 0, hash: 775282915, replay: [773, 169, 8, null] },
    { seed: 107, mapId: 'apache', adv: 'ranger', t: 412, kills: 758, level: 16, cards: 18, caskets: 0, loot: 1, hash: 1967451559, replay: [412, 758, 16, null] },
    { seed: 108, mapId: 'swamp', adv: 'swordsman', t: 367, kills: 542, level: 15, cards: 17, caskets: 0, loot: 0, hash: 3945694518, replay: [367, 542, 15, null] },
  ],
};

test('pace 1: the casket pool, casket rolls and worn-gear bonuses are main\'s exactly', () => {
  const h = tablesPace1({ W: (r, hd, t) => casketWeights(r, hd, t, { pace: 1 }), roll: (g, r, hd, t) => rollCasket(g, r, hd, t, { pace: 1 }), B: (g, l) => gearBonus(g, l, 1), mulberry32 });
  assert.equal(h, MAIN.tables);
});

test('pace 1: long immortal runs with new pieces worn meet the same cards, caskets and end as on main', () => {
  for (const cfg of QUICK_IMMORTAL) {
    const r = playImmortal(M, cfg), want = MAIN.immortal.find((x) => x.seed === cfg.seed);
    assert.deepEqual([r.t, r.kills, r.level, r.cards, r.caskets, r.loot, r.hash], [want.t, want.kills, want.level, want.cards, want.caskets, want.loot, want.hash], `seed ${cfg.seed}`);
  }
});

test('pace 1: recorded ranked week-0 runs give main\'s kills, time and level, and replay to them', () => {
  for (const cfg of QUICK_RANKED) {
    const r = playPace1(M, cfg), want = MAIN.ranked.find((x) => x.seed === cfg.seed);
    assert.deepEqual([r.t, r.kills, r.level, r.cards, r.caskets, r.loot, r.hash], [want.t, want.kills, want.level, want.cards, want.caskets, want.loot, want.hash], `seed ${cfg.seed}`);
    const back = replay(r.log, r.params);
    assert.ok(!back.error, back.error);
    assert.deepEqual([back.t, back.kills, back.level], want.replay.slice(0, 3), `replay seed ${cfg.seed}`);
  }
});
