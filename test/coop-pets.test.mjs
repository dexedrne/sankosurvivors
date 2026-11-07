import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { createPetRenderer } from '../src/pet-renderer.js';

const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const from = main.indexOf('  view.petActive =');
assert.ok(from > 0);
const present = Function('view', 'mode', 'waitingForMove', 'sim', 'coop', main.slice(from, main.indexOf('\n', from)) + ';return view;');
const players = [{ id: 'p1', x: 100, z: 0, f: 0, al: true }, { id: 'p2', x: 0, z: 2, f: 0, al: true }];
const view = (options = {}) => ({ players: structuredClone(players), pending: {}, over: false, ...options });

test('actual presentation freezes pets while the co-op driver is held, closed or absent', () => {
  for (const coop of [null, {}, { run: { held: true } }, { run: { held: false, closed: true } }]) {
    assert.equal(present(view(), 'play', false, { coop: true }, coop).petActive, false);
  }
  assert.equal(present(view(), 'play', false, { coop: true }, { run: { held: false, closed: false } }).petActive, true);
  assert.equal(present(view(), 'play', false, {}, null).petActive, true);
});

test('local menus, either player reward and terminal state freeze the actual presentation', () => {
  const coop = { run: { held: false, closed: false } };
  for (const mode of ['pause', 'levelup', 'casket', 'recovery', 'coop']) assert.equal(present(view(), mode, false, { coop: true }, coop).petActive, false);
  for (const pending of [{ p1: { choices: [{}] } }, { p2: { choices: [{}] } }]) assert.equal(present(view({ pending }), 'play', false, { coop: true }, coop).petActive, false);
  assert.equal(present(view({ over: true }), 'play', false, { coop: true }, coop).petActive, false);
  assert.equal(present(view(), 'play', true, {}, null).petActive, false);
});

test('guest companion follows p2 without reordering the roster and holds its root and animation during reconnect', async () => {
  const group = new THREE.Group(), advances = [];
  const pet = createPetRenderer({ group, load: async () => ({}), groundAt: () => 0, spawn: () => ({ root: new THREE.Group(), update: dt => advances.push(dt) }) });
  await pet.set('fox');
  const sim = { coop: true }, coop = { run: { held: false, closed: false } };
  let next = present(view(), 'play', false, sim, coop);
  pet.update(next, .1, 'p2');
  assert.equal(group.children[0].position.x, 0);
  assert.equal(group.children[0].position.z, 2);
  assert.deepEqual(next.players, players);
  const root = group.children[0], before = root.position.clone(), count = advances.length;
  coop.run.held = true;
  next = view(); next.players[1].x = 4;
  pet.update(present(next, 'play', false, sim, coop), .1, 'p2');
  assert.deepEqual(root.position, before); assert.equal(advances.length, count);
  coop.run.held = false;
  pet.update(present(next, 'play', false, sim, coop), .1, 'p2');
  assert.ok(root.position.x > 0); assert.ok(advances.length > count);
  next.players[1].al = false;
  pet.update(present(next, 'play', false, sim, coop), .1, 'p2');
  assert.equal(group.children.length, 0);
});
