import test from 'node:test';
import assert from 'node:assert/strict';
import { createSim } from '../src/sim.js';
import { MAP_BY_ID } from '../src/content.js';
import { prepareRunRewards } from '../src/run-rewards.js';
import { canContinueCasual, phaseCoins } from '../src/casual-continuation.js';
import { saveRunProgress } from '../src/progress-import.js';

const stored = { 'sq-coins': '100', 'sq-bank': '["Bronze Helmet"]', 'sq-stats': '{"kills":299}', 'sq-quests': '["survivor"]', 'sq-cleared': '["apache"]', 'sq-best': '{"t":100}', 'sq-bests': '{"greentown:n:e":{"t":100}}', 'sq-ranked-live': 'ticket', 'sq-settings': '{"x":1}' };
const storage = () => { const data = new Map(Object.entries(stored)); return { data, getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: k => data.delete(k) }; };
const finished = variant => { const s = createSim({ variant, ...(variant === 'fun' ? { map: MAP_BY_ID.oasis } : {}) }); Object.assign(s, { over: 'win', t: 1500, kills: 12, killsByType: { goblin: 12 }, bossKills: 3, evolves: 1, loot: ['Bronze Helmet', 'Iron Helmet', 'Iron Katana'] }); Object.assign(s.players[0], { coins: 2, alch: 7 }); return s; };

test('Boss Trials cannot award durable GP, gear, quests, records, clears or continuation', () => {
  const s = finished('boss'), db = storage();
  assert.equal(phaseCoins(s, { won: true, multiplier: 3 }), 0);
  const receipt = prepareRunRewards(db, s, { earned: 999 });
  assert.deepEqual(receipt.data, {}); assert.deepEqual(receipt.loot, []); assert.deepEqual(receipt.quests, []);
  assert.equal(receipt.personalBest, null); assert.equal(receipt.newPersonalBest, false); assert.equal(canContinueCasual(s), false);
});

for (const variant of ['raid', 'fun', 'wizard']) test(`${variant} journals only earned GP and ordinary loot without campaign progress`, () => {
  const s = finished(variant), db = storage();
  const earned = phaseCoins(s, { won: true });
  assert.equal(earned, 2 + 6 + 7 + (['fun', 'wizard'].includes(variant) ? Math.floor((1500 - s.map.length) / 10) : 0));
  const receipt = prepareRunRewards(db, s, { earned });
  assert.deepEqual(Object.keys(receipt.data).sort(), ['sq-bank', 'sq-coins']);
  assert.equal(Number(receipt.data['sq-coins']), 100 + earned + 25);
  assert.deepEqual(JSON.parse(receipt.data['sq-bank']), ['Bronze Helmet', 'Iron Helmet']);
  assert.deepEqual(receipt.quests, []); assert.equal(receipt.personalBest, null); assert.equal(receipt.newPersonalBest, false);
  assert.deepEqual(receipt.cleared, ['apache']); assert.equal(receipt.clearedBefore, 1);
  saveRunProgress(db, receipt.data);
  for (const [key, value] of Object.entries(stored)) if (!['sq-bank', 'sq-coins'].includes(key)) assert.equal(db.getItem(key), value, key);
  assert.equal(canContinueCasual(s), false);
});

test('special co-op rewards require verified completion and only local earned loot', () => {
  const s = createSim({ variant: 'raid', coop: true, players: [{ id: 'a' }, { id: 'b' }] }); s.over = 'dead';
  s.players[0].loot = ['Iron Helmet']; s.players[1].loot = ['Runite Helmet']; s.loot = ['Iron Helmet', 'Runite Helmet'];
  const db = storage();
  const receipt = prepareRunRewards(db, s, { earned: 7, coop: true, playerId: 'a', result: 'complete' });
  assert.equal(receipt.data['sq-coins'], '107'); assert.deepEqual(JSON.parse(receipt.data['sq-bank']), ['Bronze Helmet', 'Iron Helmet']);
  for (const options of [{ playerId: 'missing' }, { earned: -1 }, { earned: NaN }, { result: 'abandoned' }, { ranked: true }]) assert.throws(() => prepareRunRewards(db, s, { earned: 7, coop: true, playerId: 'a', result: 'complete', ...options }));
  assert.throws(() => prepareRunRewards(db, s, { earned: 7 }));
});
