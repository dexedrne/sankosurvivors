import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {createSim,step,TICK} from '../src/sim.js';
const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const nodes=()=>{const map=new Map();return id=>{if(!map.has(id))map.set(id,{hidden:true,textContent:'',innerHTML:'',classList:{toggle(){}}});return map.get(id)}};
function hud(sim,player='p1'){
 const a=source.indexOf('function updateReviveHud() {'),b=source.indexOf('\n}',a);assert(a>=0&&b>a,'revive status is part of actual HUD');const $=nodes();return{$,update:Function('sim','PLAYER','$','imgTag',source.slice(a,b+2)+';return updateReviveHud;')(sim,player,$,()=>'<img>')};
}
test('revive HUD follows real death consumption and hides when spent',()=>{
 const sim=createSim({meta:{revive:1}}),p=sim.players[0],h=hud(sim);h.update();assert.equal(h.$('revivehud').hidden,false);assert.equal(h.$('reviveleft').textContent,'1');
 p.hp=1;sim.eproj.push({id:sim.nextId++,x:p.x,z:p.z,vx:0,vz:0,r:1,dmg:999,life:2,art:"ice"});step(sim,{},TICK);h.update();assert.equal(p.revives,0);assert(p.alive);assert.equal(h.$('revivehud').hidden,true);
});
test('guest revive uses its own player and death/new-run state hides the indicator',()=>{
 const sim=createSim({coop:true,players:[{id:'p1',meta:{revive:1}},{id:'p2',meta:{}}]}),h=hud(sim,'p2');h.update();assert(h.$('revivehud').hidden);sim.players[1].revives=1;h.update();assert(!h.$('revivehud').hidden);sim.players[1].alive=false;h.update();assert(h.$('revivehud').hidden);sim.players=createSim().players;h.update();assert(h.$('revivehud').hidden);
});
test('co-op choice seconds come from each replicated pending state and vanish when it ends',()=>{
 const a=source.indexOf('  const other = sim.players.find(p => p.id !== PLAYER), waiting ='),b=source.indexOf('\n}\n// ---- solo and ranked startup',a);assert(a>=0&&b>a);
 const sim=createSim({coop:true,players:[{id:'p1'},{id:'p2'}]}),$=nodes();sim.pending.p1={left:20.1};sim.pending.p2={left:15.2};
 const render=Function('sim','PLAYER','$','esc','mode','run','pending',source.slice(a,b));render(sim,'p2',$,String,'levelup',{held:false},sim.pending.p2);
 assert.equal($('coopleveltimer').textContent,'Automatic choice in 16s');assert.equal($('coopleveltimer').hidden,false);assert.match($('coopwait').innerHTML,/21s/);
 delete sim.pending.p2;render(sim,'p2',$,String,'play',{held:false},null);assert($('coopleveltimer').hidden);render(sim,'p2',$,String,'play',{held:true},{left:10});assert($('coopleveltimer').hidden);
});
