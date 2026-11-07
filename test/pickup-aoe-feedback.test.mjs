import test from 'node:test';import assert from 'node:assert/strict';
import{createSim,step,playerStats,spawnEnemy,snapshot,TICK}from'../src/sim.js';import{ENEMIES}from'../src/content.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
function scene(pace=2){const s=createSim({pace,seed:1106}),p=s.players[0];p.weapons={};s.spawnAcc=-1e9;s.bossIndex=999;s.eventT=s.shrineT=1e9;return{s,p};}
for(const pace of[1,2])test(`base pickup pulls bones and coins only within its pace${pace} radius`,()=>{
 const{s,p}=scene(pace),r=pace===2?2.5:2.8;close(playerStats(p).magnet,r);
 for(const[d,id]of[[r-.01,1],[r+.01,2]]){s.gems.push({id:s.nextId++,x:p.x+d,z:p.z,v:id});s.pickups.push({id:s.nextId++,kind:'coin',x:p.x+d,z:p.z});}
 step(s,{p1:{}},TICK);assert.equal(s.gems[0].pulled,true);assert.equal(!!s.gems[1].pulled,false);assert.equal(s.pickups[0].pulled,true);assert.equal(!!s.pickups[1].pulled,false);
});
test('pickup bonuses and quality scale the new base rather than replacing it',()=>{
 const{s,p}=scene();p.passives.magnet=1;p.quality.passives.magnet=15;p.meta={magic:2};p.gb={magnet:.15};close(playerStats(p).magnet,2.5*(1+.3*1.15+.2+.15));
 const ranger=createSim({pace:2,players:[{id:'p1',adv:'ranger'}]}).players[0];close(playerStats(ranger).magnet,3.25);
});
test('forced Warp pull still reaches distant drops outside the smaller pickup radius',()=>{
 const{s,p}=scene();s.gems.push({id:s.nextId++,x:p.x+30,z:p.z,v:1,pulled:true});s.pickups.push({id:s.nextId++,kind:'coin',x:p.x+30,z:p.z,pulled:true});step(s,{p1:{}},TICK);assert.ok(s.gems[0].x<p.x+30&&s.pickups[0].x<p.x+30);
});
for(const pace of[1,2])test(`boss warning and damage radius use the same ${pace===2?'5% smaller':'legacy'} circle`,()=>{
 const{s,p}=scene(pace);s.rng=()=>0;spawnEnemy(s,'colossus',p.x+10,p.z);const e=s.enemies[0];e.rise=0;e.atkCd=0;e.speed=0;p.godMode=true;step(s,{p1:{}},TICK);const h=s.hazards[0];assert.ok(h,'actual boss slam');const base=3.5+ENEMIES.colossus.r*1.2;close(h.r,base*(pace===2?.95:1));close(h.max,1.1+base*.07);
 const view=snapshot(s);assert.ok(view.hazards.some(v=>v[2]===h.r),'warning snapshot shares hazard radius');
 p.godMode=false;p.hp=p.maxHp=1000;p.inv=0;p.x=h.x-h.r-.01;p.z=h.z;h.t=TICK/2;e.atkCd=999;const hp=p.hp;step(s,{p1:{}},TICK);assert.equal(p.hp,hp,'outside the smaller circle is safe');const fx=s.fx.find(f=>f.k==='slam');assert.ok(fx);close(fx.r,h.r);
});
for(const pace of[1,2])test(`meteor warning radius keeps its original delay on pace${pace}`,()=>{
 const{s,p}=scene(pace);p.godMode=true;s.event={kind:'meteors',t:20,next:0};step(s,{p1:{}},TICK);const h=s.hazards.find(h=>h.meteor);assert.ok(h);close(h.r,2.6*(pace===2?.95:1));close(h.max,1.1);
});
