import test from 'node:test';
import assert from 'node:assert/strict';
import {createSim,playerStats} from '../src/sim.js';
import {pauseBuild,pauseBuildHTML} from '../src/pause-build.js';
const make=()=>createSim({seed:711,pace:2,players:[{id:'p1',adv:'wizard'}]});
test('pause build uses actual actor equipment, levels and derived stats without changing the run',()=>{
 const sim=make(),p=sim.players[0];p.weapons.bow=3;p.passives.boots=2;p.gear={head:'Bronze Helmet'};p.gearLv={'Bronze Helmet':2};
 const before=JSON.stringify(sim),build=pauseBuild(sim,p);
 assert.equal(build.sections.find(s=>s.title==='Weapons').rows.find(r=>r.name.includes('Bow')).level,3);
 assert.match(build.sections.find(s=>s.title==='Equipment').rows[0].name,/Bronze Helmet \+2/);
 assert.equal(build.stats.find(s=>s.id==='speed').value,Math.round(playerStats(p).speed*100)/100);
 assert(!build.sections.some(s=>s.title==='Active effects'));assert.equal(JSON.stringify(sim),before);
});
test('timed effects report real combined stat ratios and negative effects first',()=>{
 const sim=make(),p=sim.players[0];p.buffs={speed:6.2,strength:20,agility:30,wisdom:40,chill:5.1};
 const effects=pauseBuild(sim,p).effects;assert.equal(effects[0].id,'chill');assert.equal(effects.length,5);
 for(const [id,factor,seconds] of [['speed',1.35,7],['strength',1.3,20],['agility',1.25,30],['wisdom',1.4,40],['chill',.9,6]]){
  const effect=effects.find(e=>e.id===id);assert.equal(effect.factor,factor,id);assert.equal(effect.seconds,seconds);assert(effect.icon.startsWith('ui/items/'));assert(effect.stat.length);
 }
});
test('expired, invalid and unknown timers stay out; removing a real effect updates stats',()=>{
 const sim=make(),p=sim.players[0];p.buffs={speed:3,strength:0,chill:-1,wisdom:NaN,unknown:90};
 const active=pauseBuild(sim,p);assert.deepEqual(active.effects.map(e=>e.id),['speed']);p.buffs.speed=0;
 const after=pauseBuild(sim,p);assert.deepEqual(after.effects,[]);assert(after.stats.find(s=>s.id==='speed').value<active.stats.find(s=>s.id==='speed').value);
});
test('co-op pause selects only the supplied actor, not the other player or a profile',()=>{
 const sim=createSim({seed:711,pace:2,coop:true,players:[{id:'p1',adv:'ranger',meta:{combat:2}},{id:'p2',adv:'wizard',meta:{magic:1}}]});
 const a=pauseBuild(sim,sim.players[0]),b=pauseBuild(sim,sim.players[1]);assert.notEqual(a.sections[0].rows[0].name,b.sections[0].rows[0].name);
 assert.notEqual(a.stats.find(s=>s.id==='might').value,b.stats.find(s=>s.id==='might').value);
});
test('missing actor cannot display stale run data',()=>{assert.equal(pauseBuild(null,null),null);assert.equal(pauseBuild(make(),null),null);});
test('pause view exposes all stats, native build art and labelled effect timers',()=>{
 const sim=make(),p=sim.players[0];p.buffs.speed=4.2;const data=pauseBuild(sim,p);
 const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
 const html=pauseBuildHTML(data,path=>'/assets/'+path,escape);
 assert(html.includes('data-pause-group="stats"'));assert(html.includes('data-pause-group="build"'));assert(html.includes('data-pause-group="effects"'));
 for(const stat of data.stats)assert(html.includes('data-pause-stat="'+stat.id+'"'),stat.id);
 assert(html.includes('data-pause-seconds="speed"'));assert(html.includes('role="timer"'));assert(html.includes('/assets/ui/items/'));
 data.sections[0].rows[0].name='<unsafe>';assert(!pauseBuildHTML(data,path=>path,escape).includes('<unsafe>'));
});
