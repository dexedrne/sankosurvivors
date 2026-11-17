import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import{createSim,step,TICK}from'../src/sim.js';import{MAP_BY_ID}from'../src/content.js';import{unpackGround}from'../src/ground-pack.js';
const current=unpackGround(fs.readFileSync('tools/vercel-api/ground.bin')),prior=unpackGround(fs.readFileSync('tools/vercel-api/sims/73d74cfe60a2/ground.bin'));
function fixture(x,z,ground=current,pace=2){const s=createSim({seed:1116,pace,map:MAP_BY_ID.apache,ground}),p=s.players[0];Object.assign(s,{spawnAcc:-1e9,bossIndex:99,eventT:1e9,shrineT:1e9});Object.assign(p,{x,z,weapons:{},godMode:true});return{s,p};}
function walk(r,direction){for(let i=0;i<18;i++){step(r.s,{p1:{mx:0,mz:direction}},TICK);r.s.fx.length=0;}}
for(const x of[186.5,186.75,187,187.25,187.5])for(const direction of[-1,1])test(`native Apache camel gate passes ${x} both halves, direction ${direction}`,()=>{
 const r=fixture(x,direction>0?87.8:91.2);walk(r,direction);assert(direction>0?r.p.z>90.5:r.p.z<88.5,JSON.stringify({x,direction,end:r.p.z}));
});
for(const x of[184.5,190.5])test(`camel-pen fence beside the entrance stays solid at ${x}`,()=>{
 const r=fixture(x,87.8);walk(r,1);assert(r.p.z<89,JSON.stringify({x,z:r.p.z}));
});
test('gate precision alters only the inspected native fence-tip cells and retains unrelated structural bits',()=>{
 assert.deepEqual(current.blocked,prior.blocked);assert.deepEqual(current.walls,prior.walls);assert.deepEqual(current.water,prior.water);
 const changed=[];for(let k=0;k<current.fences.length;k++)if(current.fences[k]!==prior.fences[k])changed.push([k%512,Math.floor(k/512),prior.fences[k],current.fences[k]]);
 assert.deepEqual(changed,[[186,88,4,0],[186,89,9,8],[370,281,2,0],[371,281,12,4],[371,290,3,1],[372,290,8,0],[370,291,2,0],[371,291,12,4],[356,305,238,204],[357,305,238,68],[358,305,238,68],[359,305,255,119],[356,306,187,153],[357,306,187,17],[358,306,187,17],[359,306,187,17],[360,306,153,17]]);
});
test('pace1 movement still matches the immutable prior ground at the gate',()=>{
 for(const x of[186.5,187.5]){const a=fixture(x,87.8,current,1),b=fixture(x,87.8,prior,1);for(let i=0;i<18;i++){step(a.s,{p1:{mx:0,mz:1}},TICK);step(b.s,{p1:{mx:0,mz:1}},TICK);assert.equal(a.p.x,b.p.x);assert.equal(a.p.z,b.p.z);}}
});
test('both recognized ground versions retain pasture and Oasis corrections',()=>{
 for(const ground of[prior,current]){
  const pasture=createSim({ground,map:MAP_BY_ID.greentown}),oasis=createSim({ground,map:MAP_BY_ID.oasis});
  let pastureCells=0,oasisCells=0;for(let k=0;k<ground.blocked.length;k++){if(pasture.ground.blocked[k]!==ground.blocked[k])pastureCells++;if(oasis.ground.blocked[k]!==pasture.ground.blocked[k])oasisCells++;}
  assert.equal(pastureCells,179);assert.equal(oasisCells,140);assert.equal(ground.blocked[283*512+322],1);assert.equal(ground.blocked[477*512+43],1);
 }
});
