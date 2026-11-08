import test from 'node:test';
import assert from 'node:assert/strict';
import {createSim,step,TICK} from '../src/sim.js';
import {MAP_BY_ID} from '../src/content.js';
function scene({radius=40,ground=null,coop=false}={}) {
 const s=createSim({map:{...MAP_BY_ID.greentown,cx:16,cz:16,r:radius},ground,coop,players:coop?[{id:'p1'},{id:'p2'}]:[{id:'p1'}]});
 s.spawnAcc=-1e9;s.eventT=1e9;s.bossIndex=999;s.shrineT=0;s.rng=()=>0;
 for(const p of s.players){p.x=16;p.z=16;p.weapons={};p.godMode=true;}
 return s;
}
test('the entire shrine circle stays inside the arena, not just its centre',()=>{
 const edge=scene({radius:17});step(edge,{},TICK);assert.equal(edge.shrines.length,0);
 const room=scene({radius:20});step(room,{},TICK);assert.equal(room.shrines.length,1);assert.ok(Math.hypot(room.shrines[0].x-16,room.shrines[0].z-16)+2.75<=20);
});
for(const kind of ['shore','wall'])test(`a shrine cannot hang across a ${kind} even with an open centre`,()=>{
 const n=64,g={n,cell:true,blocked:new Uint8Array(n*n),walls:new Uint8Array(n*n)};
 for(let z=0;z<n;z++)if(kind==='shore')for(let x=34;x<n;x++)g.blocked[z*n+x]=1;else g.walls[z*n+34]=8;
 const s=scene({ground:g});step(s,{},TICK);assert.equal(s.shrines.length,0);
});
test('a distant co-op partner cannot receive a shrine inside a disconnected room outside the old flow field',()=>{
 const n=256,g={n,cell:true,blocked:new Uint8Array(n*n),walls:new Uint8Array(n*n)};
 for(let z=0;z<n;z++)g.walls[z*n+196]=8;
 const s=scene({ground:g,coop:true,radius:1000});s.players[0].x=16;s.players[1].x=180;
 let i=0;s.rng=()=>i++===0?.99:0;step(s,{},TICK);assert.equal(s.shrines.length,0);
});
test('the circle cannot overlap a blocked cell between the cardinal and diagonal directions',()=>{
 const n=64,g={n,cell:true,blocked:new Uint8Array(n*n),walls:new Uint8Array(n*n)};
 g.blocked[17*n+35]=1;const s=scene({ground:g});s.players[0].x=s.players[0].z=16.5;
 step(s,{},TICK);assert.equal(s.shrines.length,0);
});
