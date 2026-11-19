import test from 'node:test';
import assert from 'node:assert/strict';
import * as ranked from '../src/ranked.js';
import { rankedChoice, rankedShop, rankedStep, resumeRanked } from '../src/ranked-play.js';
import { merchantNear, step } from '../src/sim.js';
import { merchantServicePrices } from '../src/merchant.js';
import { phaseCoins } from '../src/casual-continuation.js';
import api from '../tools/vercel-api/ranked.js';
import { bot, pick } from './balance.mjs';

const params = { seed: 71, mapId: 'tutorial', adv: 'adventurer', week: 3 };
const fixture = () => {
  const sim = ranked.rankedSim(params), p = sim.players[0];
  sim.tick = 7200; sim.t = 240; sim.kills = 6000;
  p.gear.head = 'Bronze Helmet';
  p.passives.might = 2;
  sim.merchant = { id: 42, x: p.x, z: p.z, life: 75, offers: [{ item: 'Iron Helmet', price: 90, sold: false }] };
  return sim;
};

test('next weekly reset enables the merchant in Standard only', () => {
  assert.equal(ranked.weekStart(3), Date.UTC(2026, 10, 23));
  for (const [week, mode, enabled] of [[2, 'normal', false], [3, 'normal', true], [3, 'hard', false]]) {
    const sim = ranked.rankedSim({ ...params, week, mode });
    assert.equal(Object.hasOwn(sim, 'merchant'), enabled);
    sim.merchantT = 0;
    step(sim);
    assert.equal(!!sim.merchant, enabled);
  }
});

test('execute the gear purchase and its choice before upgrading and removing gear in the same tick', () => {
  const sim = fixture(), p = sim.players[0], rec = new ranked.RunRecorder();
  assert(merchantNear(sim, 'p1'));
  const buy = 'm:7200:42:buy:0';
  assert(ranked.applyRankedShopAction(sim, buy));
  rec.pick(buy);
  const quote = service => merchantServicePrices(phaseCoins(sim), sim.t)[service];
  const upgrade = 'm:7200:42:upgrade:passive:might:2:' + quote('upgrade');
  assert.equal(ranked.applyRankedShopAction(sim, upgrade), false, 'purchase choice takes precedence');
  assert(rankedChoice(sim, rec, 0));
  assert.equal(p.gear.head, 'Iron Helmet');
  const price = quote('upgrade');
  assert.equal(ranked.applyRankedShopAction(sim, upgrade + '0'), false, 'stale quote');
  assert(ranked.applyRankedShopAction(sim, upgrade));
  assert.equal(p.passives.might, 3);
  assert.equal(sim.merchantSpent, 90 + price);
  assert.equal(ranked.applyRankedShopAction(sim, upgrade), false, 'cannot upgrade the old level again');
  assert.equal(ranked.applyRankedShopAction(sim, buy), false, 'cannot buy the sold offer again');
  assert(ranked.applyRankedShopAction(sim, 'm:7200:42:remove:passive:might:3:' + quote('remove')));
  assert.equal(p.passives.might, undefined);
});

test('only a supported signed week and bounded valid commands pass API log shape', () => {
  const log = { v: 1, runs: [[1, 0, 0]], uses: [], picks: ['m:1:42:buy:0'] };
  assert.equal(api.logShape(log, 100), 'bad choice');
  assert.equal(api.logShape(log, 100, ranked.rankedShopTick), null);
  for (const token of ['m:2:42:buy:0', 'm:01:42:buy:0', 'm:1:42:buy:3', 'm:1:42:remove:weapon:katana:1:0', 'm:1:42:buy:0\n']) {
    assert.equal(api.logShape({ ...log, picks: [token] }, 100, ranked.rankedShopTick), 'bad choice');
  }
  assert.match(ranked.replay(log, params, { allowPartial: true }).error, /merchant/i, 'no encounter at that tick');
  assert.throws(() => resumeRanked(log, params), /merchant/i);
  for (const week of [2, 3]) {
    const future = { ...log, picks: ['m:100:42:buy:0'] };
    assert.match(ranked.replay(future, { ...params, week }, { allowPartial: true }).error, /merchant/i);
    assert.throws(() => resumeRanked(future, { ...params, week }), /actions/i);
  }
});

test('a naturally earned gear purchase resumes at the recorded tick and verifies server-side', () => {
  const run = { seed: 21, mapId: ranked.weekMap(3), adv: 'knight', week: 3 };
  const sim = ranked.rankedSim(run), rec = new ranked.RunRecorder(), p = sim.players[0];
  let transaction;
  while (!sim.over && sim.t < 240) {
    if (sim.pending.p1) {
      assert(rankedChoice(sim, rec, pick(sim.pending.p1.choices, p)));
      continue;
    }
    const merchant = sim.merchant;
    if (merchant) {
      if (!merchantNear(sim, 'p1')) {
        const dx = merchant.x - p.x, dz = merchant.z - p.z, d = Math.hypot(dx, dz);
        rankedStep(sim, rec, dx / d, dz / d, null);
        continue;
      }
      const index = merchant.offers.findIndex(offer => offer.price <= phaseCoins(sim));
      if (index >= 0) {
        transaction = 'm:' + [sim.tick, merchant.id, 'buy', index].join(':');
        assert(rankedShop(sim, rec, transaction));
        assert(sim.pending.p1?.merchantPurchase);
        const draft = resumeRanked(JSON.parse(JSON.stringify(rec.log())), run);
        assert.deepEqual(draft.sim.pending, sim.pending);
        assert(rankedChoice(sim, rec, 0));
        break;
      }
    }
    const { mx, mz } = bot(sim, p);
    rankedStep(sim, rec, mx, mz, null);
  }
  assert(transaction, 'the recorded inputs must reach a merchant with enough earned GP');
  const log = JSON.parse(JSON.stringify(rec.log())), resumed = resumeRanked(log, run);
  assert.deepEqual(resumed.rec.log(), log);
  assert.deepEqual(resumed.sim.players[0].gear, p.gear);
  assert.deepEqual(resumed.sim.merchant, sim.merchant);
  assert.equal(resumed.sim.merchantSpent, sim.merchantSpent);
  assert.equal(api.logShape(log, sim.tick, ranked.rankedShopTick), null);
  assert.deepEqual(ranked.replay(log, run, { allowPartial: true }), {
    t: Math.floor(sim.t), kills: sim.kills, level: sim.level, won: false, timeUp: false, ticks: sim.tick, picksUsed: log.picks.length,
  });
});
