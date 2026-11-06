import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSim,step,TICK,walkable} from '../src/sim.js';
import {unpackGround,groundHash} from '../src/ground-pack.js';
import {MAP_BY_ID} from '../src/content.js';

const raw=unpackGround(readFileSync(new URL('../tools/vercel-api/ground.bin',import.meta.url)));
const key=283*512+322;
function fixture({ground=raw,pace=2,x=322.5,z=284.2,map='greentown'}={}){
 const s=createSim({seed:55,pace,ground,map:MAP_BY_ID[map]});s.spawnAcc=-1e9;s.bossIndex=99;s.eventT=s.shrineT=1e9;
 const p=s.players[0];p.x=x;p.z=z;p.weapons={};return {s,p};
}
function travel(s,direction,roll=true,n=roll?6:30){for(let i=0;i<n;i++)step(s,{p1:{mx:0,mz:direction,use:roll&&i===0?4:null}},TICK);}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);

test('actual west pasture: tumble clears the nav-painted fence in both directions',()=>{
 assert.equal(raw.blocked[key],1);assert.equal(raw.walls[key],0);assert.equal(raw.fences[key],9);
 const north=fixture();travel(north.s,-1);near(north.p.z,280.6);assert.equal(north.p.rollT,0);assert.ok(north.p.rollCd>4.8);
 const south=fixture({z:281.8});travel(south.s,1);near(south.p.z,285.4);
});
test('actual pasture: normal walking still stops at both sides of the railing',()=>{
 const north=fixture();travel(north.s,-1,false);assert.ok(north.p.z>283);
 const south=fixture({z:281.8});travel(south.s,1,false);assert.ok(south.p.z<283);
});
test('only native low-fence footprint bits change, without mutating shared ground or its other layers',()=>{
 const before=groundHash(raw),a=fixture(),b=fixture();assert.equal(before,'d10eff3c');
 assert.ok(a.s.ground!==raw,'pace2 has its own corrected ground');assert.ok(a.s.ground===b.s.ground,'normalization is cached');assert.ok(a.s.ground.blocked!==raw.blocked,'only the blocked array is copied');
 for(const layer of ['walls','water','fences'])assert.equal(a.s.ground[layer],raw[layer]);
 let changes=0;for(let k=0;k<raw.blocked.length;k++)if(a.s.ground.blocked[k]!==raw.blocked[k]){
  changes++;assert.equal(raw.blocked[k],1);assert.equal(a.s.ground.blocked[k],0);assert.ok(raw.fences[k]);assert.equal(raw.walls[k],0);
  const x=k%512,z=Math.floor(k/512);for(const i of[z*513+x,z*513+x+1,(z+1)*513+x,(z+1)*513+x+1])assert.ok(Number.isNaN(raw.water[i]));
 }
 assert.equal(changes,179);assert.equal(groundHash(raw),before);assert.equal(raw.blocked[key],1);
 assert.ok(walkable(a.s,322.5,283.5));
});
test('pace1 retains the exact original world and its blocked pasture strip',()=>{
 const {s,p}=fixture({pace:1});assert.equal(s.ground,raw);assert.equal(walkable(s,322.5,283.5),false);
 travel(s,-1);assert.ok(p.z>=284);
});
for(const variant of ['wall','water','other terrain','missing fences'])test(`unrecognized ${variant} ground is not rewritten`,()=>{
 const g={...raw,blocked:raw.blocked.slice(),walls:raw.walls.slice(),water:raw.water.slice(),fences:raw.fences.slice()};
 if(variant==='wall')g.walls[key]=1;
 if(variant==='water')g.water[283*513+322]=.8;
 if(variant==='other terrain')g.blocked[0]=raw.blocked[0]?0:1;
 if(variant==='missing fences')g.fences=null;
 const {s}=fixture({ground:g});assert.equal(s.ground,g);assert.equal(s.ground.blocked[key],1);assert.equal(walkable(s,322.5,283.5),false);
});
test('an actual sealed Apache pen still refuses the tumble',()=>{
 const {s,p}=fixture({map:'apache',x:171,z:84.5});for(let i=0;i<6;i++)step(s,{p1:{mx:1,mz:0,use:i===0?4:null}},TICK);
 assert.ok(p.x<172);assert.ok(p.rollCd>4.8);assert.equal(p.inv,0);
});
