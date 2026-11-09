import test from 'node:test';
import assert from 'node:assert/strict';
import { createSim, useBelt, playerStats } from '../src/sim.js';

for (const remaining of [52, 57, 60, 80]) {
  test(`pace2 beer caps ${remaining} seconds at 60 and still heals and consumes`, () => {
    const sim = createSim(), p = sim.players[0], speed = playerStats(p).speed;
    p.buffs.speed = remaining; p.hp = 10; p.belt = ['beer'];
    assert.equal(useBelt(sim, p.id, 0), true);
    assert.equal(p.buffs.speed, 60);
    assert.equal(p.hp, 30);
    assert.deepEqual(p.belt, []);
    assert.equal(playerStats(p).speed, speed * 1.35);
  });
}
test('pace2 beer handles a negative old timer while pace1 still refreshes exactly eight seconds', () => {
  for (const [pace, remaining, expected] of [[2, -1, 8], [1, 3, 8], [1, 60, 8]]) {
    const sim = createSim({ pace }), p = sim.players[0];
    p.buffs.speed = remaining; p.belt = ['beer'];
    assert.equal(useBelt(sim, p.id, 0), true);
    assert.equal(p.buffs.speed, expected);
  }
});
test('ranked pace2 and only the consuming co-op player use the same duration cap', () => {
  const ranked = createSim({ ranked: true }), p = ranked.players[0];
  p.buffs.speed = 59; p.belt = ['beer'];
  assert.equal(useBelt(ranked, p.id, 0), true);
  assert.equal(p.buffs.speed, 60);
  const coop = createSim({ coop: true, players: [{ id: 'p1' }, { id: 'p2' }] }), [a, b] = coop.players;
  a.buffs.speed = 12; b.buffs.speed = 58; b.belt = ['beer'];
  assert.equal(useBelt(coop, b.id, 0), true);
  assert.equal(a.buffs.speed, 12);
  assert.equal(b.buffs.speed, 60);
});
