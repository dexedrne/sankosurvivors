import test from 'node:test';
import assert from 'node:assert/strict';
import {createSim,step,snapshot,TICK,SHRINE,SHRINES} from '../src/sim.js';
import {MAP_BY_ID} from '../src/content.js';

function scene(extra={}){
 const s=createSim({seed:37,map:MAP_BY_ID.greentown,...extra});
 s.spawnAcc=-1e9;s.bossIndex=999;s.eventT=1e9;s.shrineT=0;s.rng=()=>.999999;
 for(const p of s.players){p.weapons={};p.godMode=true;}
 return s;
}
function advance(s,seconds){
 for(let t=0;t<seconds;t+=TICK)step(s,{},TICK);
}
test('ordinary casual Adventure can spawn a gold node with the regular shrine lifetime and snapshots',()=>{
 const s=scene();step(s,{},TICK);
 assert.equal(s.shrines[0]?.kind,'gold');
 assert.equal(SHRINES.gold.name,'Gold node');
 assert.equal(snapshot(s).shrines[0][1],'gold');
 assert(s.shrines[0].life<=SHRINE.life);
});
test('ranked and special modes keep their original six shrine outcomes at every selection boundary',()=>{
 for(const settings of [{ranked:true},{variant:'raid'},{variant:'boss'}]){
  for(let i=0;i<7;i++){
   const s=scene(settings);s.rng=()=>Math.min(.999999,i/6);
   step(s,{},TICK);
   const kind=s.shrines[0]?.kind;
   if(settings.variant==='boss'){assert.equal(s.shrines.length,0);continue;}
   assert(kind);assert.notEqual(kind,'gold');
   if(i===6)assert.equal(kind,'wealth');
  }
 }
 const old=scene({pace:1});step(old,{},TICK);assert.equal(old.shrines.length,0);
});
test('gold charges only in its circle, releases exactly 24 collectible coins once and then disappears',()=>{
 const s=scene();step(s,{},TICK);const node=s.shrines[0],p=s.players[0];
 advance(s,1);assert.equal(node.charge,0);
 p.x=node.x;p.z=node.z;advance(s,1);const charged=node.charge;assert(charged>.9);
 p.x+=6;advance(s,.5);assert(node.charge<charged);assert.equal(s.pickups.length,0);
 p.x=node.x;p.z=node.z;
 for(let i=0;i<120&&s.shrines.length;i++)step(s,{},TICK);
 assert.equal(s.shrines.length,0);
 assert.equal(s.pickups.filter(p=>p.kind==='coin').length,24);
 assert.equal(p.coins,0);
 assert.equal(s.fx.filter(f=>f.k==='shrine-done'&&f.kind==='gold').length,1);
 advance(s,1);assert.equal(p.coins+s.pickups.length,24);
});
test('two co-op players standing together complete one node and receive one shared set of coins',()=>{
 const s=scene({coop:true,players:[{id:'p1'},{id:'p2'}]});step(s,{},TICK);const node=s.shrines[0];
 assert.equal(node.kind,'gold');
 for(const p of s.players){p.x=node.x;p.z=node.z;}
 advance(s,SHRINE.charge+.1);
 assert.equal(s.shrines.length,0);
 assert.equal(s.pickups.length+s.players.reduce((sum,p)=>sum+p.coins,0),24);
 assert.equal(s.fx.filter(f=>f.k==='shrine-done'&&f.kind==='gold').length,1);
});
