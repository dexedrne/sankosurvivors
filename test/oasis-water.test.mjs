import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSim,step,TICK,walkable} from '../src/sim.js';
import {MAP_BY_ID} from '../src/content.js';
import {unpackGround,groundHash} from '../src/ground-pack.js';

const raw=unpackGround(readFileSync(new URL('../tools/vercel-api/ground.bin',import.meta.url)));
function fixture(options={}) {
 const s=createSim({ground:raw,map:MAP_BY_ID.oasis,...options});
 s.spawnAcc=-1e9;s.bossIndex=999;s.eventT=s.shrineT=1e9;
 for(const p of s.players){p.weapons={};p.godMode=true;}
 return s;
}
for(const [x,z,mx,mz] of [[36.5,477.5,1,0],[49.5,477.5,-1,0],[43.5,472.5,0,1],[43.5,483.5,0,-1],[57.5,489.5,1,0]])test(`Oasis lower water permits ordinary walking from ${x},${z}`,()=>{
 const s=fixture(),p=s.players[0];p.x=x;p.z=z;
 for(let i=0;i<45;i++)step(s,{p1:{mx,mz}},TICK);
 assert.ok((p.x-x)*mx+(p.z-z)*mz>4,'walking must enter and cross the lower pool without tumbling');
});
test('Oasis correction preserves shared ground, solid edges, factory water and outside void',()=>{
 const base=fixture({map:MAP_BY_ID.apache}),s=fixture(),again=fixture();
 assert.equal(groundHash(raw),'165cf2df');assert.ok(s.ground!==base.ground);assert.ok(s.ground===again.ground);
 for(const layer of ['walls','fences','water'])assert.equal(s.ground[layer],raw[layer]);
 let changes=0;for(let k=0;k<raw.blocked.length;k++)if(base.ground.blocked[k]!==s.ground.blocked[k]){
  changes++;assert.equal(base.ground.blocked[k],1);assert.equal(s.ground.blocked[k],0);
  const x=k%512,z=Math.floor(k/512);assert.ok(x>=37&&x<=62&&z>=473&&z<=491);
  assert.equal(raw.walls[k],0);assert.equal(raw.fences[k],0);
 }
 assert.equal(changes,140);assert.equal(raw.blocked[477*512+43],1);
 for(const [x,z] of [[0.5,448.5],[38.5,490.5],[80.5,497.5]])assert.equal(walkable(s,x,z),false,`solid/void/factory ${x},${z}`);
});
test('pace1 and other maps retain the old lower-water collision',()=>{
 for(const options of [{pace:1},{map:MAP_BY_ID.apache},{map:MAP_BY_ID.world}])assert.equal(walkable(fixture(options),43.5,477.5),false);
 assert.equal(fixture({pace:1}).ground,raw);
});
test('both co-op players use the same lower-pool navigation',()=>{
 const s=fixture({coop:true,players:[{id:'p1'},{id:'p2'}]});
 for(const p of s.players){p.x=41.5;p.z=477.5;}
 for(let i=0;i<30;i++)step(s,{p1:{mx:1,mz:0},p2:{mx:1,mz:0}},TICK);
 assert.ok(s.players.every(p=>p.x>44));assert.equal(s.players[0].x,s.players[1].x);
});
test('unrecognized ground is never opened using native pool coordinates',()=>{
 const ground={...raw,blocked:raw.blocked.slice()};ground.blocked[0]^=1;
 assert.equal(walkable(fixture({ground}),43.5,477.5),false);
});
