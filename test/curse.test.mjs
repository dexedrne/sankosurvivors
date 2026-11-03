import test from 'node:test';
import assert from 'node:assert/strict';
import { createSim, step, TICK, rollChoices, spawnEnemy } from '../src/sim.js';
import { rankedSim } from '../src/ranked.js';
import { MAP_BY_ID, CURSE, PASSIVES, passiveIdsAt } from '../src/content.js';

const run = (s, sec) => { for (let i = 0; i < sec / TICK; i++) { step(s, { p1: {} }, TICK); for (const id of Object.keys(s.pending)) delete s.pending[id]; } };
// a run where nothing dies (no weapons, an endless health bar) so the crowd shows how many monsters came
const crowd = (pace, curse, sec) => {
  const s = createSim({ seed: 11, map: MAP_BY_ID.greentown, pace }); s.bossIndex = 99; s.eventT = 1e9;
  const p = s.players[0]; p.weapons = {}; p.hp = 1e9; p.maxHp = 1e9; if (curse) p.passives.curse = curse;
  run(s, sec); return s.enemies.length;
};

test('the Pumpkin Head curse brings more monsters, faster, and tougher', () => {
  assert.equal(PASSIVES.curse.item, 'Pumpkin Head');
  const plain = crowd(2, 0, 45), cursed = crowd(2, 5, 45);
  assert.ok(cursed > plain * 1.5, `more monsters early: ${cursed} vs ${plain}`);
  const full = crowd(2, 0, 400), fullCursed = crowd(2, 5, 400);
  assert.ok(fullCursed > full * (1 + CURSE.cap * 5) * 0.9 && fullCursed <= Math.ceil(full * (1 + CURSE.cap * 5)) + 2, `a bigger crowd at the cap: ${fullCursed} vs ${full}`);
  // cursed monsters are born with more health
  const born = (pace, curse) => { const s = createSim({ seed: 3, map: MAP_BY_ID.greentown, pace }); s.curse = curse; spawnEnemy(s, 'chicken', 5, 5); return s.enemies[s.enemies.length - 1].maxHp; };
  assert.ok(Math.abs(born(2, 4) / born(2, 0) - (1 + CURSE.hp * 4)) < 1e-9);
  assert.equal(born(1, 4), born(1, 0), 'pace 1 monsters are never cursed');
});

test('pace 1 (ranked week 0) never offers the curse and its crowd is unchanged', () => {
  assert.ok(!passiveIdsAt(1).includes('curse')); assert.ok(passiveIdsAt(2).includes('curse'));
  const seen = { 1: false, 2: false };
  for (const pace of [1, 2]) for (let seed = 1; seed <= 300 && !seen[pace]; seed++) {
    const s = createSim({ seed, map: MAP_BY_ID.greentown, pace });
    if (rollChoices(s, s.players[0]).some((c) => c.id === 'curse')) seen[pace] = true;
  }
  assert.deepEqual(seen, { 1: false, 2: true });
  // a pace-1 player who somehow holds it changes nothing
  assert.equal(crowd(1, 5, 45), crowd(1, 0, 45));
});

test('the curse is never the first card, a lone curse comes after a fish, and the crowd never passes the late-game crowd', () => {
  let offered = 0;
  for (let seed = 1; seed <= 300; seed++) {
    const s = createSim({ seed, map: MAP_BY_ID.greentown }), ch = rollChoices(s, s.players[0]);
    if (ch.some((c) => c.id === 'curse')) offered++;
    assert.notEqual(ch[0].id, 'curse', `seed ${seed}`);
  }
  assert.ok(offered > 10, `still offered (${offered} of 300)`);
  // everything else maxed: only the curse is left to level
  const s = createSim({ seed: 9, map: MAP_BY_ID.greentown }), p = s.players[0];
  p.weapons = { katana: 6, bow: 6, axe: 6, shield: 6 }; p.evo = { katana: 1, bow: 1, axe: 1, shield: 1 };
  p.passives = { might: 5, haste: 5, vigor: 5, curse: 1 };
  for (let i = 0; i < 20; i++) { const ch = rollChoices(s, p); if (ch.some((c) => c.id === 'curse')) assert.equal(ch[0].kind, 'heal'); }
  assert.ok(crowd(2, 5, 850) <= 275 + 2, 'cursed crowd stays within the late-game crowd');
});

test('ranked runs never offer the curse, even from week 1', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const s = rankedSim({ seed, mapId: 'greentown', adv: 'adventurer', week: 1 });
    assert.ok(!rollChoices(s, s.players[0]).some((c) => c.id === 'curse'), `seed ${seed}`);
  }
});
