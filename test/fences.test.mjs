import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSim, step, TICK } from '../src/sim.js';
import { MAP_BY_ID } from '../src/content.js';
import { unpackGround, packGround, groundHash } from '../src/ground-pack.js';

const ground = unpackGround(readFileSync(new URL('../tools/vercel-api/ground.bin', import.meta.url)));
const fences = JSON.parse(readFileSync(new URL('../public/assets/world/tiles/fences.json', import.meta.url), 'utf8'));
const walkInto = (pace) => { // a pen fence near Apache runs north-south along x = 172 (z 79-89)
  const s = createSim({ seed: 1, map: MAP_BY_ID.apache, ground, pace }); s.spawnAcc = -1e9; s.bossIndex = 99; s.eventT = 1e9;
  const p = s.players[0]; p.x = 170.5; p.z = 84.5;
  for (let i = 0; i < 2 / TICK; i++) step(s, { p1: { mx: 1, mz: 0 } }, TICK);
  return p.x;
};
test('fences are walls on pace 2 (casual, ranked from week 1); ranked week 0 (pace 1) walks as it always did', () => {
  assert.ok(fences.cells.length > 300, 'the fence layer has the world\'s fences');
  assert.ok(ground.fences && ground.fences.some(Boolean), 'ground.bin carries the fence layer');
  const x2 = walkInto(2), x1 = walkInto(1);
  assert.ok(x2 < 172, `stopped at the fence (x ${x2.toFixed(2)})`);
  assert.ok(x1 > 172.5, `pace 1 walks on (x ${x1.toFixed(2)})`);
});
test('the fence layer packs and unpacks exactly, and older ground files (no fence layer) still read', () => {
  const again = unpackGround(packGround(ground));
  assert.equal(groundHash(again), groundHash(ground));
  const old = unpackGround(packGround({ ...ground, fences: null }));
  assert.equal(old.fences, null); assert.deepEqual(old.walls, ground.walls);
});
