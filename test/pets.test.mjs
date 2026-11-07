import test from 'node:test';
import assert from 'node:assert/strict';
const pets = await import('../src/pets.js').catch(error => { if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error; return {}; });
const trail = () => { assert.equal(typeof pets.createPetTrail, 'function'); return pets.createPetTrail(); };
const player = (x, z, extra = {}) => ({ id: 'p1', x, z, f: 0, al: true, ...extra });

test('native companion choices reject malformed, inherited and external-URL preferences', () => {
  assert.equal(typeof pets.petChoice, 'function');
  for (const value of [null, '', 'none', 'Mini', '__proto__', 'constructor', {}, [], 1, 'https://example.com/a.glb']) assert.equal(pets.petChoice(value), null);
  assert.equal(pets.petChoice('chicken'), 'chicken'); assert.equal(pets.petChoice('fox'), 'fox');
});
test('companion follows the actual walked corner with a distance gap instead of cutting across it', () => {
  const t = trail(); t.step(player(0, 0), .1, true);
  for (let x = .1; x < 2.01; x += .1) t.step(player(x, 0), .1, true);
  let p; for (let z = .1; z < 1.01; z += .1) p = t.step(player(2, z), .1, true);
  assert.ok(Math.abs(p.x - 1.9) < .000001); assert.ok(Math.abs(p.z) < .000001);
  p = t.step(player(2, 1.5), .1, true); assert.ok(Math.abs(p.x - 2) < .000001); assert.ok(Math.abs(p.z - .4) < .000001);
});
test('paused/invalid time freezes the trail and invalid/dead players hide it without mutating snapshots', () => {
  const t = trail(), p = player(1, 2), before = structuredClone(p); const first = t.step(p, .1, true);
  for (const dt of [0, -1, NaN, Infinity]) assert.deepEqual(t.step(player(3, 4), dt, true), { ...first, moving: false });
  assert.deepEqual(t.step(player(3, 4), .1, false), { ...first, moving: false });
  for (const bad of [null, player(NaN, 0), player(0, Infinity), player(0, 0, { al: false })]) assert.equal(t.step(bad, .1, true), null);
  assert.deepEqual(p, before);
});
test('teleports and map reset discard the old path; long walks keep the gap', () => {
  const t = trail(); t.step(player(0, 0), .1, true); t.step(player(4, 0), .1, true);
  assert.equal(t.step(player(100, 50), .1, true).x, 100);
  t.reset(); assert.equal(t.step(player(2, 5), .1, true).x, 2);
  let p; for (let i = 1; i <= 2000; i++) p = t.step(player(2 + i / 10, 5), .1, true);
  assert.ok(Math.abs(p.x - 200.9) < .000001); assert.equal(p.z, 5);
});
