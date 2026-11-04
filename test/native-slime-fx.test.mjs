import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import * as THREE from 'three';
import { createSim, spawnEnemy, damageEnemy } from '../src/sim.js';

const source = readFileSync(new URL('../src/render.js', import.meta.url), 'utf8');
const start = source.indexOf('  // native Slime Blob flecks');
const end = source.indexOf('  // flat effects', start);
const updateStart = source.indexOf('    // slime flecks\n');
const updateEnd = source.indexOf('    // flat effects\n', updateStart);
function pool(fx = 'full') {
  assert.ok(start >= 0 && end > start, 'renderer has a bounded native icon pool');
  let iconCalls = 0;
  const dyn = new THREE.Group(), settings = { fx }, map = new THREE.Texture();
  const iconTex = name => { assert.equal(name, 'Slime Blob'); iconCalls++; return map; };
  const result = Function('THREE', 'dyn', 'settings', 'iconTex', 'fxOnly', 'groundAt', `${source.slice(start, end)};
    return { burst: slimeBurst, sprites: slimeFlecks, tick(dt) { ${source.slice(updateStart, updateEnd)} } };
  `)(THREE, dyn, settings, iconTex, () => {}, () => 0);
  return { ...result, dyn, map, iconCalls: () => iconCalls };
}

for (const pace of [1, 2]) test(`pace ${pace}: death events ${pace === 2 ? 'identify native slime types' : 'keep their exact legacy shape'}`, () => {
  for (const type of ['slimer', 'mslimer', 'chicken']) {
    const sim = createSim({ seed: 5, pace }), p = sim.players[0];
    spawnEnemy(sim, type, p.x + 3, p.z);
    const e = sim.enemies[0];
    damageEnemy(sim, e, e.hp + 1, p.id);
    const expected = { k: 'die', x: e.x, z: e.z, boss: 0, elite: e.elite ? 1 : 0 };
    if (pace >= 2) expected.type = type;
    assert.deepEqual(sim.fx.find(f => f.k === 'die'), expected);
  }
});

test('native blue Slime Blob bursts reuse at most 32 sprites and one cached uncolored material', () => {
  assert.ok(existsSync(new URL('../public/assets/ui/items/item_Slime_Blob.png', import.meta.url)));
  const p = pool();
  assert.equal(p.iconCalls(), 0, 'icon loads lazily');
  p.burst(10, 20);
  assert.equal(p.sprites.filter(s => s.visible).length, 6);
  const initial = p.sprites[0].position.clone();
  p.tick(0.1);
  assert.notDeepEqual(p.sprites[0].position, initial, 'flecks move through their pooled velocity');
  assert.ok(p.sprites[0].scale.x < 0.5 && p.sprites[0].scale.x > 0, 'flecks shrink over their lifetime');
  for (let i = 0; i < 100; i++) p.burst(i, i);
  assert.equal(p.sprites.length, 32); assert.equal(p.dyn.children.length, 32);
  assert.equal(p.iconCalls(), 1);
  assert.equal(new Set(p.sprites.map(s => s.material)).size, 1);
  assert.equal(p.sprites[0].material.map, p.map);
  assert.equal(p.sprites[0].material.color.getHex(), 0xffffff, 'native icon keeps its actual blue');
  const ids = p.sprites.map(s => s.uuid);
  p.tick(2);
  assert.ok(p.sprites.every(s => !s.visible), 'flecks expire without remaining visible');
  p.burst(0, 0);
  assert.deepEqual(p.sprites.map(s => s.uuid), ids, 'expired slots are reused');
  assert.equal(p.iconCalls(), 1);
});

test('reduced FX emits fewer flecks and retains its shared cache after expiry', () => {
  const full = pool(), reduced = pool('reduced');
  full.burst(0, 0); reduced.burst(0, 0);
  assert.equal(reduced.sprites.filter(s => s.visible).length, 2);
  assert.ok(reduced.sprites.length < full.sprites.length);
  const reset = source.slice(source.indexOf('  function reset() {'), source.indexOf('  return { hop:', source.indexOf('  function reset() {')));
  assert.match(reset, /for \(const sp of slimeFlecks\) \{ sp.visible = false; sp.userData.life = 0; \}/);
  reduced.tick(2);
  assert.ok(reduced.sprites.every(s => !s.visible));
  reduced.burst(0, 0); assert.equal(reduced.iconCalls(), 1);
});

test('only slimer and mslimer death events trigger the native blob burst', () => {
  const handler = source.slice(source.indexOf("      else if (f.k === 'die')"), source.indexOf("      else if (f.k ===", source.indexOf("      else if (f.k === 'die')") + 20));
  assert.match(handler, /f.type === 'slimer' \|\| f.type === 'mslimer'/);
  const run = Function('f', 'slimeBurst', `const pop=()=>{},ringFx=()=>{},emit=()=>{},groundAt=()=>0;if(false){} ${handler}`);
  for (const type of ['slimer', 'mslimer', 'chicken', undefined]) {
    let n = 0;
    run({ k: 'die', type, x: 1, z: 2 }, (x, z) => { assert.deepEqual([x, z], [1, 2]); n++; });
    assert.equal(n, type === 'slimer' || type === 'mslimer' ? 1 : 0);
  }
});
