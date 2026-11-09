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
