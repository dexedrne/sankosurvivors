import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSim,spawnEnemy,damageEnemy,step,TICK,findWalkable,choose} from '../src/sim.js';
import {MAP_BY_ID} from '../src/content.js';
import {unpackGround} from '../src/ground-pack.js';
const raw=unpackGround(readFileSync(new URL('../tools/vercel-api/ground.bin',import.meta.url)));
const flat=()=>({n:32,cell:true,blocked:new Uint8Array(32*32),walls:new Uint8Array(32*32)});
function kill({ground=null,x=16.5,z=16.5,pace=2,luck=false}={}){
 const s=createSim({seed:42,pace,ground,map:{...MAP_BY_ID.greentown,cx:x,cz:z},meta:luck?{luck:5}:{}}),p=s.players[0];
 p.x=x;p.z=z;p.weapons={};p.godMode=true;s.spawnAcc=-1e9;s.bossIndex=99;s.eventT=s.shrineT=s.merchantT=1e9;
 let draws=0;s.rng=()=>{draws++;return .25;};
 spawnEnemy(s,'giant',x,z);damageEnemy(s,s.enemies[0],1e9,p.id);
 return {s,p,draws:()=>draws};
}
for(const {x,kind,badX}of[{x:370.36,kind:'casket',badX:369.16},{x:363.64,kind:'chest',badX:364.84}])test(`real Greentown closed room: boss ${kind} stays on the kill side`,()=>{
 const {s,p}=kill({ground:raw,x,z:251.5}),drop=s.pickups.find(k=>k.kind===kind);
 step(s,{},TICK); // refresh the real connected-component field, and collect reachable loot
 assert.notDeepEqual(findWalkable(s,badX,251.5),[badX,251.5],'old offset lies in the disconnected room');
 assert.deepEqual([drop.x,drop.z],[x,251.5]);
 for(let i=0;i<10&&s.pickups.includes(drop);i++){while(s.pending[p.id])choose(s,p.id,0);step(s,{},TICK);}
 assert(!s.pickups.includes(drop),'reward is actually collected after any XP card is resolved');
 if(kind==='casket')assert.equal(s.loot.length,1);else assert(s.pending[p.id]);
});
for(const side of[-1,1])test(`a blocked cell cannot swallow the ${side<0?'casket':'chest'}`,()=>{
 const g=flat();g.blocked[16*32+(side<0?15:17)]=1;
 const {s}=kill({ground:g}),drop=s.pickups.find(k=>k.kind===(side<0?'casket':'chest'));
 assert.deepEqual([drop.x,drop.z],[16.5,16.5]);
});
test('the optional luck chest also stays out of blocked terrain',()=>{
 const g=flat();g.blocked[17*32+16]=1;
 const {s}=kill({ground:g,luck:true}),chests=s.pickups.filter(k=>k.kind==='chest');
 assert.equal(chests.length,2);assert.deepEqual([chests[1].x,chests[1].z],[16.5,16.5]);
});
test('the ground edge cannot swallow a chest',()=>{
 const {s}=kill({ground:flat(),x:31.5}),drop=s.pickups.find(k=>k.kind==='chest');
 assert.deepEqual([drop.x,drop.z],[31.5,16.5]);
});
test('a blocked corner retains the body clearance needed to collect a chest',()=>{
 const g=flat();g.blocked[16*32+16]=1;
 const {s}=kill({ground:g,x:15.6,z:15.8}),drop=s.pickups.find(k=>k.kind==='chest');
 assert.deepEqual([drop.x,drop.z],[15.6,15.8]);
});
for(const ground of[null,flat()])test(`${ground?'open ground':'no ground'} retains every legal offset, ID and RNG draw`,()=>{
 const {s,draws}=kill({ground,luck:true});
 assert.deepEqual(s.pickups,[{id:11,x:16.5,z:16.5,kind:'bass'},{id:12,x:17.7,z:16.5,kind:'chest'},{id:13,x:15.3,z:16.5,kind:'casket'},{id:14,x:16.5,z:17.7,kind:'chest'}]);
 assert.equal(s.nextId,15);assert.equal(draws(),11);
});
test('unsafe offset correction changes no gems, IDs, loot counts or RNG draws',()=>{
 const g=flat();g.blocked[16*32+15]=g.blocked[17*32+16]=1;
 const a=kill({ground:g,luck:true}),b=kill({luck:true});
 assert.deepEqual(a.s.gems,b.s.gems);assert.deepEqual(a.s.pickups.map(({x,z,...k})=>k),b.s.pickups.map(({x,z,...k})=>k));
 assert.equal(a.s.nextId,b.s.nextId);assert.equal(a.draws(),b.draws());
});
test('pace1 keeps the original blocked offsets exactly',()=>{
 const {s}=kill({ground:raw,x:370.36,z:251.5,pace:1,luck:true});
 assert.deepEqual(s.pickups,[{id:11,x:370.36,z:251.5,kind:'bass'},{id:12,x:371.56,z:251.5,kind:'chest'},{id:13,x:369.16,z:251.5,kind:'casket'},{id:14,x:370.36,z:252.7,kind:'chest'}]);
});
