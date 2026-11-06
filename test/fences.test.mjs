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
for(const [x,z,boundary]of[[370.4,291.5,371],[371.4,290.5,372]])test(`Greentown park fence corner keeps its existing collision at ${boundary},${z}`,()=>{
 const s=createSim({seed:1106,pace:2,ground,map:MAP_BY_ID.greentown}),p=s.players[0];s.spawnAcc=-1e9;s.bossIndex=99;s.eventT=s.shrineT=1e9;p.x=x;p.z=z;p.weapons={};
 for(let i=0;i<16;i++)step(s,{p1:{mx:1,mz:0}},TICK);assert.ok(p.x<boundary,JSON.stringify({x:p.x,z:p.z,boundary}));
});
test('doorway precision preserves the inspected world prop admission rules',async()=>{
 const {buildFences}=await import('../tools/build-fences.mjs'),f=await buildFences();
 assert.equal(f.used,322);assert.equal(f.byFile['kit_Wall_stone_1tile.glb'],36);assert.equal(f.byFile['kit_Wall_interior_1tile.glb'],13);assert.equal(f.byFile['castle/wall_interior.glb'],75);
});

test('structural prop upper bits round trip while old low-only files retain their layout',()=>{
 const f=new Uint8Array(ground.fences);f[123]=0x88;const g={...ground,fences:f};assert.deepEqual(unpackGround(packGround(g)).fences,f);
});
test('native Greentown house interior walls block tumble even with an open door',()=>{
 const s=createSim({seed:1106,pace:2,ground,map:MAP_BY_ID.greentown}),p=s.players[0];s.spawnAcc=-1e9;s.bossIndex=99;s.eventT=s.shrineT=1e9;p.x=358.5;p.z=284.5;p.weapons={};
 for(let i=0;i<6;i++)step(s,{p1:{mx:1,mz:0,use:i===0?4:null}},TICK);assert.ok(p.x<359,`solid house wall stopped tumble: ${p.x}`);
});

test('previous low-only packed fence format remains byte sized and readable',()=>{
 const f=ground.fences.map(v=>v&15),g={...ground,fences:f},bytes=packGround(g),n=g.n;
 assert.equal(bytes.length,4+Math.ceil(n*n/8)+Math.ceil((n+1)*(n+1)/8)+2*Math.ceil(n*n/2));assert.deepEqual(unpackGround(bytes).fences,f);
});
