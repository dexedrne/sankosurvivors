import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSim,step,spawnEnemy,TICK} from '../src/sim.js';
import {MAP_BY_ID} from '../src/content.js';
import {unpackGround} from '../src/ground-pack.js';
const raw=unpackGround(readFileSync(new URL('../tools/vercel-api/ground.bin',import.meta.url)));
function fixture({pace=2,ground=raw,x=324,z=336.5}={}){
 const s=createSim({seed:1106,pace,ground,map:MAP_BY_ID.greentown});s.spawnAcc=-1e9;s.bossIndex=99;s.eventT=s.shrineT=1e9;
 const p=s.players[0];p.x=x;p.z=z;p.weapons={};p.godMode=true;return{s,p};
}
function move(s,mx,mz,ticks=20){for(let i=0;i<ticks;i++){step(s,{p1:{mx,mz}},TICK);s.fx.length=0;}}
test('actual castle doorway: turning north cannot enter the west-wall body margin',()=>{
 const{s,p}=fixture();move(s,1,0,6);assert.ok(p.x>325.05&&p.x<325.3);move(s,0,-1);assert.ok(p.z>=336,JSON.stringify({x:p.x,z:p.z}));
 move(s,1,0,4);move(s,0,-1,12);assert.ok(p.z<335,'moving into the room leaves the doorway usable');
});
for(const axis of['x','z'])for(const side of[-1,1])for(const end of[-1,1])test(`parallel wall margin stays clear: wall ${axis}, side ${side}, end ${end}`,()=>{
 const n=32,g={n,cell:true,blocked:new Uint8Array(n*n),walls:new Uint8Array(n*n)};
 for(let k=10;k<16;k++){const j=end===-1?k:32-k;g.walls[axis==='x'?j*n+16:16*n+j]=axis==='x'?8:1;}
 const{s,p}=fixture({ground:g,x:axis==='x'?16+side*.1:16.5,z:axis==='z'?16+side*.1:16.5});move(s,axis==='z'?end:0,axis==='x'?end:0);
 const along=axis==='x'?p.z:p.x;assert.ok(end===-1?along>=16.35:along<=16.65,JSON.stringify({x:p.x,z:p.z}));
});
for(const side of[-1,1])test(`an actor initially overlapping a wall can escape on side ${side}`,()=>{
 const n=32,g={n,cell:true,blocked:new Uint8Array(n*n),walls:new Uint8Array(n*n)};for(let z=0;z<n;z++)g.walls[z*n+16]=8;
 const{s,p}=fixture({ground:g,x:16+side*.1,z:14.5});move(s,side,0,4);assert.ok(side===-1?p.x<15.65:p.x>16.35);assert.equal(p.z,14.5);
});
for(const axis of['x','z'])for(const side of[-1,1])test(`blocked-cell wall margin stays clear: wall ${axis}, side ${side}`,()=>{
 const n=32,g={n,cell:true,blocked:new Uint8Array(n*n),walls:new Uint8Array(n*n)};
 for(let j=10;j<16;j++)g.blocked[axis==='x'?j*n+16:16*n+j]=1;
 const across=(side<0?16:17)+side*.1;
 const{s,p}=fixture({ground:g,x:axis==='x'?across:16.5,z:axis==='z'?across:16.5});move(s,axis==='z'?-1:0,axis==='x'?-1:0);
 assert.ok((axis==='x'?p.z:p.x)>=16);
});
test('a player with sufficient side clearance can keep moving along the wall',()=>{
 const n=32,g={n,cell:true,blocked:new Uint8Array(n*n),walls:new Uint8Array(n*n)};for(let z=0;z<n;z++)g.walls[z*n+16]=8;
 const{s,p}=fixture({ground:g,x:15.5,z:14.5});move(s,0,1,10);assert.equal(p.x,15.5);assert.ok(p.z>16);
});
test('actual doorway: pursuing enemies enter the room without hugging through its west wall',()=>{
 const{s,p}=fixture({x:325.8,z:334.5});spawnEnemy(s,'goblin',324,336.5);const e=s.enemies[0];e.rise=0;let margin=false;
 for(let i=0;i<400;i++){step(s,{p1:{}},TICK);if(e.z>=333&&e.z<336&&Math.abs(e.x-325)<.35)margin=true;s.fx.length=0;}
 assert.equal(margin,false);assert.ok(Math.hypot(e.x-p.x,e.z-p.z)<1.3);
});
for(const axis of['x','z'])for(const side of[-1,1])for(const solid of[false,true])test(`one-cell door preserves body clearance and pursuit: ${axis}/${side}/${solid?'blocked':'thin'}`,()=>{
 const n=32,g={n,cell:true,blocked:new Uint8Array(n*n),walls:new Uint8Array(n*n)};
 for(let k=0;k<n;k++)if(k!==16){const at=axis==='x'?k*n+16:16*n+k;if(solid)g.blocked[at]=1;else g.walls[at]=axis==='x'?8:1;}
 const start=side<0?18.5:13.5,target=side<0?13.5:18.5;
 const{s,p}=fixture({ground:g,x:axis==='x'?target:18.5,z:axis==='x'?18.5:target});spawnEnemy(s,'goblin',axis==='x'?start:14.5,axis==='x'?14.5:start);const e=s.enemies[0];e.rise=0;let crossings=0;
 for(let i=0;i<400;i++){
  const across=axis==='x'?e.x:e.z,along=axis==='x'?e.z:e.x;step(s,{p1:{}},TICK);const nextAcross=axis==='x'?e.x:e.z,nextAlong=axis==='x'?e.z:e.x;
  for(const line of solid?[16,17]:[16])if((across<line&&nextAcross>=line)||(across>=line&&nextAcross<line)){
   const z=along+(nextAlong-along)*(line-across)/(nextAcross-across);assert.ok(z>=16.35&&z<=16.65,JSON.stringify({axis,side,solid,z}));crossings++;
  }
  s.fx.length=0;
 }
 assert.ok(crossings>0);assert.ok(Math.hypot(e.x-p.x,e.z-p.z)<1.1);
});
test('pace1 retains the original actual-doorway lane exactly',()=>{
 const{s,p}=fixture({pace:1});move(s,1,0,6);move(s,0,-1);assert.equal(p.x,325.14480000000015);assert.equal(p.z,332.6839999999995);
});
test('no-ground movement retains its original distance',()=>{
 const{s,p}=fixture({ground:null,x:15,z:15});move(s,0,1,10);assert.equal(p.x,15);assert.ok(p.z>16.8&&p.z<17);
});
