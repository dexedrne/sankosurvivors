import test from 'node:test';
import assert from 'node:assert/strict';
import {createSim,spawnEnemy,step,TICK} from '../src/sim.js';
function strike(options={}){
 const s=createSim({seed:1108,...options});s.spawnAcc=-1e9;s.bossIndex=999;s.eventT=s.shrineT=1e9;
 for(const p of s.players){p.weapons={};p.cd={};}const p=s.players.at(-1);p.weapons={pickaxe:1};p.cd.pickaxe=0;for(const member of s.players){member.x=p.x;member.z=p.z;}
 spawnEnemy(s,'goblin',p.x+1,p.z);s.enemies[0].hp=s.enemies[0].maxHp=1e6;step(s,{},TICK);return{s,p,event:s.fx.find(f=>f.k==='quake')};
}
test('actual co-op pickaxe impact identifies its attacker even with overlapping adventurers',()=>{
 const {event}=strike({coop:true,players:[{id:'p1'},{id:'p2'}]});assert(event);assert.equal(event.player,'p2');
});
for(const pace of [1,2])test(`solo pace${pace} pickaxe event keeps its existing shape`,()=>{
 const {event}=strike({pace});assert(event);assert.equal(Object.hasOwn(event,'player'),false);assert.deepEqual(Object.keys(event),['k','x','z','r','lvl']);
});
