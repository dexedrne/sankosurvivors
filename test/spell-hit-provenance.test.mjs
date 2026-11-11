import test from 'node:test';import assert from 'node:assert/strict';
import {createSim,spawnEnemy,step} from '../src/sim.js';
for(const pace of[1,2])test(`pace${pace} actual collision preserves spell provenance only for current rules`,()=>{
 const sim=createSim({seed:28,pace}),p=sim.players[0];sim.spawnAcc=-1e9;sim.bossIndex=99;sim.shrineT=sim.eventT=1e9;p.cd.katana=1e9;
 spawnEnemy(sim,'chicken',p.x+.4,p.z);const e=sim.enemies[0],id=sim.nextId++;
 sim.proj.push({id,art:'bolt',owner:p.id,lvl:5,evo:false,x:e.x,z:e.z,vx:0,vz:0,speed:0,life:1,r:.5,hit:[],dmg:1,burst:2,homing:e.id});step(sim);
 const burst=sim.fx.find(f=>f.k==='burst');assert(burst,'real projectile collision must burst');
 if(pace>=2)assert.deepEqual({projectile:burst.projectile,owner:burst.owner,lvl:burst.lvl},{projectile:id,owner:p.id,lvl:5});
 else assert.deepEqual(Object.keys(burst).sort(),['evo','k','r','x','z']);
});

for(const pace of[1,2])for(const burst of[0,2])test(`pace${pace} ${burst?'splash':'level-one'} hit identifies its exact projectile and target`,()=>{
 const sim=createSim({seed:28,pace}),p=sim.players[0];sim.spawnAcc=-1e9;sim.bossIndex=99;sim.shrineT=sim.eventT=1e9;p.cd.katana=1e9;
 spawnEnemy(sim,'chicken',p.x+.4,p.z);const e=sim.enemies[0],id=sim.nextId++;
 sim.proj.push({id,art:'bolt',owner:p.id,lvl:burst?2:1,evo:false,x:e.x,z:e.z,vx:0,vz:0,speed:0,life:1,r:.5,hit:[],dmg:1,burst,homing:e.id});step(sim);
 const hit=sim.fx.find(f=>f.k==='spell-hit');
 if(pace===1)assert.equal(hit,undefined);else assert.deepEqual(hit,{k:'spell-hit',projectile:id,target:e.id,x:e.x,z:e.z,owner:p.id,lvl:burst?2:1,evo:0,r:burst});
});
for(const pace of[1,2])test(`pace${pace} hostile spell collision records only the player actually struck`,()=>{
 const sim=createSim({seed:3,pace}),p=sim.players[0];sim.spawnAcc=-1e9;sim.bossIndex=99;sim.shrineT=sim.eventT=1e9;p.cd.katana=1e9;p.inv=0;const id=sim.nextId++;
 sim.eproj.push({id,x:p.x,z:p.z,vx:0,vz:0,r:.35,dmg:8,life:1,art:'ice'});step(sim);
 const hit=sim.fx.find(f=>f.k==='spell-hit');if(pace===1)assert.equal(hit,undefined);else assert.deepEqual(hit,{k:'spell-hit',projectile:id,target:p.id,x:p.x,z:p.z,enemy:1,art:'ice'});
});

for(const pace of[1,2])test(`pace${pace} actual Colossus volley preserves aimed target and caster only in current rules`,()=>{
 const sim=createSim({seed:3,pace}),p=sim.players[0];sim.spawnAcc=-1e9;sim.bossIndex=99;sim.shrineT=sim.eventT=1e9;p.cd.katana=1e9;
 spawnEnemy(sim,'colossus',p.x+10,p.z);const boss=sim.enemies[0];boss.atkCd=0;sim.rng=()=>.9;step(sim);assert.equal(sim.eproj.length,5);
 for(const shot of sim.eproj){if(pace===1){assert(!Object.hasOwn(shot,'caster'));assert(!Object.hasOwn(shot,'target'));}else {assert.equal(shot.caster,boss.id);assert.equal(shot.target,p.id);}}
});
