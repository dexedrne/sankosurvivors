import test from 'node:test';
import assert from 'node:assert/strict';
import {createSim,step,choose,applyChoice,previewChoice,spawnEnemy,damageEnemy,playerStats,TICK} from '../src/sim.js';
import {GEAR,GEAR_SLOTS,gearBonus,ENEMIES,MAP_BY_ID} from '../src/content.js';
function party(){
 const sim=createSim({seed:711,map:MAP_BY_ID.greentown,coop:true,players:[{id:'p1',adv:'adventurer',meta:{combat:5}},{id:'p2',adv:'ranger',meta:{smithing:5}}]});
 sim.spawnAcc=-1e9;sim.eventT=sim.shrineT=1e9;sim.bossIndex=99;
 for(const p of sim.players)p.weapons={};return sim;
}
function fullGear(p){p.gear=Object.fromEntries(GEAR_SLOTS.map(slot=>[slot,Object.keys(GEAR).find(name=>GEAR[name].slot===slot)]));p.gb=gearBonus(p.gear,{},2);}
function drop(sim,kind){const p=sim.players[0];sim.pickups.push({id:sim.nextId++,x:p.x,z:p.z,kind});step(sim,{},TICK);}
test('co-op is explicitly two-player casual pace2 and keeps personal skills separate',()=>{
 const sim=party();assert.equal(sim.coop,true);assert.deepEqual(sim.players[0].meta,{combat:5});assert.deepEqual(sim.players[1].meta,{smithing:5});
 assert.equal(sim.players[0].maxHp,100);assert.equal(sim.players[1].maxHp,140);assert(playerStats(sim.players[0]).might>playerStats(sim.players[1]).might);assert.equal(sim.vet,1.075);
 for(const extra of [{pace:1},{ranked:true},{players:[{id:'p1'}]}])assert.throws(()=>createSim({coop:true,players:[{id:'p1'},{id:'p2'}],...extra}),/co-op/i);
 const solo=createSim({players:[{id:'p1',meta:{smithing:5}}]});assert.equal('coop' in solo,false);assert.deepEqual(solo.players[0].meta,{});assert.equal('loot' in solo.players[0],false);
});
test('a shared casket grants one owned roll to each living player in roster order',()=>{
 const sim=party();for(const p of sim.players)fullGear(p);drop(sim,'casket');
 const [a,b]=sim.players;assert.equal(a.loot.length,1);assert.equal(b.loot.length,1);assert.deepEqual(sim.loot,[...a.loot,...b.loot]);assert(sim.pending.p1.casket&&sim.pending.p2.casket);
 const bGear={...b.gear};assert(choose(sim,'p1',0));assert.equal(sim.pending.p1,undefined);assert(sim.pending.p2);assert.deepEqual(b.gear,bGear);
 assert(choose(sim,'p2',1));assert.equal(a.alched.length,0);assert.deepEqual(b.alched,b.loot);assert.deepEqual(sim.alched,b.alched);assert.equal(a.alch,0);assert(b.alch>0);
 const owned=sim.fx.filter(f=>f.k==='casket');assert.deepEqual(owned.map(f=>f.player),['p1','p2','p1']);
});
test('downed players receive no shared casket while coins are collected only once',()=>{
 const sim=party();sim.players[1].alive=false;drop(sim,'casket');assert.equal(sim.players[0].loot.length,1);assert.equal(sim.players[1].loot.length,0);
 for(const id of Object.keys(sim.pending))choose(sim,id,0);
 drop(sim,'coin');assert.equal(sim.players.reduce((n,p)=>n+p.coins,0),1);
});
test('a shared boss chest opens independent choices and the world waits for both',()=>{
 const sim=party();drop(sim,'chest');assert(sim.pending.p1&&sim.pending.p2);assert.notEqual(sim.pending.p1.choices,sim.pending.p2.choices);
 const tick=sim.tick,p2=structuredClone(sim.pending.p2.choices);assert(choose(sim,'p1',0));step(sim,{p1:{mx:1,mz:0}},TICK);assert.equal(sim.tick,tick);assert.deepEqual(sim.pending.p2.choices,p2);
 assert(choose(sim,'p2',2));step(sim,{},TICK);assert.equal(sim.tick,tick+1);
});
test('kill, boss, damage and evolution progress belongs to the player who earned it',()=>{
 const sim=party(),[a,b]=sim.players;spawnEnemy(sim,'goblin',a.x+1,a.z);const goblin=sim.enemies.at(-1);goblin.hp=1;sim.src='bow';damageEnemy(sim,goblin,5,'p2');
 assert.equal(a.kills,0);assert.equal(b.kills,1);assert.equal(b.killsByType.goblin,1);assert.deepEqual(a.killsByType,{});assert.equal(a.dmgBy.bow,undefined);assert(b.dmgBy.bow>=5);
 const type=Object.keys(ENEMIES).find(type=>ENEMIES[type].boss);spawnEnemy(sim,type,a.x+3,a.z);const boss=sim.enemies.at(-1);boss.hp=1;damageEnemy(sim,boss,5,'p1');assert.equal(a.bossKills,1);assert.equal(b.bossKills,0);
 const before=a.evolves;previewChoice(sim,a,{kind:'evolve',id:'katana'});assert.equal(a.evolves,before);assert.equal(sim.evolves,0);
 applyChoice(sim,b,{kind:'evolve',id:'bow'});assert.equal(b.evolves,1);assert.equal(a.evolves,0);assert.equal(sim.evolves,1);
});

test('shared melee effects identify the attacking adventurer',()=>{
 const sim=party();sim.players[0].weapons={katana:1};sim.players[1].weapons={greatsword:1};for(const p of sim.players)p.cd={katana:0,greatsword:0};
 spawnEnemy(sim,'goblin',sim.map.cx,sim.map.cz);sim.enemies[0].hp=sim.enemies[0].maxHp=1e6;step(sim,{},TICK);
 assert.equal(sim.fx.find(f=>f.k==='slash')?.player,'p1');assert.equal(sim.fx.find(f=>f.k==='spin')?.player,'p2');
});
test('co-op use effects identify whose belt item was consumed without changing solo effect shape',()=>{
 const s=createSim({coop:true,players:[{id:'p1'},{id:'p2'}]});s.players[1].belt.push('beer');step(s,{p2:{use:0}},TICK);assert.equal(s.fx.find(f=>f.k==='use')?.player,'p2');
 const solo=createSim();solo.players[0].belt.push('beer');step(solo,{p1:{use:0}},TICK);assert(!Object.hasOwn(solo.fx.find(f=>f.k==='use'),'player'));
});
