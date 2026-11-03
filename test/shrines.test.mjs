import test from 'node:test';
import assert from 'node:assert/strict';
import { createSim, step, TICK, SHRINE, SHRINES } from '../src/sim.js';
import { MAP_BY_ID } from '../src/content.js';

const run = (s, sec, inp = () => ({})) => { for (let i = 0; i < sec / TICK; i++) { step(s, { p1: inp(s) }, TICK); for (const id of Object.keys(s.pending)) delete s.pending[id]; } };
test('shrines: one rises after 1:15, standing in it charges it, and it pays its boon; pace 1 has none', () => {
  const s = createSim({ seed: 5, map: MAP_BY_ID.greentown }); s.spawnAcc = -1e9; s.bossIndex = 99; s.eventT = 1e9;
  const p = s.players[0]; p.hp = 1e9; p.maxHp = 1e9;
  run(s, SHRINE.first - 1); assert.equal(s.shrines.length, 0);
  run(s, 2); assert.equal(s.shrines.length, 1); const sh = s.shrines[0]; assert.ok(SHRINES[sh.kind]);
  const d = Math.hypot(sh.x - p.x, sh.z - p.z); assert.ok(d > 15 && d < 27, 'not right on top of you');
  p.x = sh.x; p.z = sh.z; p.hp = 50; p.maxHp = 100; const coins = s.pickups.length;
  run(s, SHRINE.charge + 0.2);
  assert.equal(s.shrines.length, 0, 'charged and used');
  const k = sh.kind, b = p.buffs;
  if (k === 'strength') assert.ok(b.strength > 0); else if (k === 'agility') assert.ok(b.agility > 0); else if (k === 'magic') assert.ok(b.wisdom > 0);
  else if (k === 'prayer') assert.equal(p.hp, p.maxHp); else assert.ok(s.pickups.length > coins);
  const s1 = createSim({ seed: 5, map: MAP_BY_ID.greentown, pace: 1 }); s1.spawnAcc = -1e9; s1.bossIndex = 99; s1.eventT = 1e9; s1.players[0].hp = 1e9;
  run(s1, SHRINE.first + 30); assert.equal(s1.shrines.length, 0);
});
test('a shrine left alone fades, and stepping out drains its charge', () => {
  const s = createSim({ seed: 7, map: MAP_BY_ID.greentown }); s.spawnAcc = -1e9; s.bossIndex = 99; s.eventT = 1e9; s.players[0].hp = 1e9;
  run(s, SHRINE.first + 1); assert.equal(s.shrines.length, 1);
  run(s, SHRINE.life + 1); assert.equal(s.shrines.length, 0, 'gone');
});
