import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../src/sim.js';
import {rankedSim} from '../src/ranked.js';
const params={seed:8,mapId:'apache',adv:'adventurer',ground:null,mode:'normal'};
function scene(week=2){const s=rankedSim({...params,week});s.spawnAcc=-1e9;s.bossIndex=99;s.eventT=s.shrineT=s.merchantT=1e9;const p=s.players[0];p.weapons={};p.hp=20;p.inv=0;return s;}
function stock(s,kinds){const p=s.players[0];p.belt=[];p.foodStacks={};for(const [kind,n]of kinds){p.belt.push(kind);if(S.FOOD[kind])p.foodStacks[kind]=n;}return p;}
function hit(s,damage,kind='slam',input){const p=s.players[0];if(kind==='volley')s.eproj.push({id:s.nextId++,x:p.x,z:p.z,vx:0,vz:0,life:1,r:.2,dmg:damage,art:'air'});else s.hazards.push({x:p.x,z:p.z,r:2,t:0,max:.1,dmg:damage,meteor:kind==='meteor'});S.step(s,input);return p;}
function pickup(s,kind){const p=s.players[0];s.pickups.push({id:s.nextId++,x:p.x,z:p.z,kind});S.step(s);}

test('trusted ranked week selects food rules; old weeks and casual/co-op cannot opt in',()=>{
 for(const week of[0,1])assert.equal(Object.hasOwn(scene(week),'rankedFood'),false);
 for(const week of[2,3])assert.equal(scene(week).rankedFood,true);
 assert.equal(rankedSim({...params,week:2,rankedFood:false}).rankedFood,true);
 assert.equal(Object.hasOwn(rankedSim({...params,week:1,rankedFood:true}),'rankedFood'),false);
 for(const opts of[{},{ranked:true,pace:1},{coop:true,players:[{id:'p1'},{id:'p2'}]}])assert.equal(Object.hasOwn(S.createSim({...opts,rankedFood:true}),'rankedFood'),false);
});
for(const kind of Object.keys(S.FOOD))test('week2 caps '+kind+' at five and eats only the overflow portion',()=>{
 const s=scene(),p=s.players[0];for(let n=0;n<5;n++)pickup(s,kind);assert.equal(S.beltCount(p,0),5);assert.equal(p.hp,20);pickup(s,kind);assert.equal(S.beltCount(p,0),5);assert.equal(p.hp,Math.min(p.maxHp,20+S.FOOD[kind].heal));assert.equal(s.fx.filter(f=>f.k==='use'&&f.kind===kind).length,1);
});
test('week1 still stacks past five and does not eat before fatal damage',()=>{
 const s=scene(1),p=s.players[0];for(let n=0;n<7;n++)pickup(s,'bass');assert.equal(S.beltCount(p,0),7);assert.equal(p.hp,20);hit(s,20);assert.equal(p.alive,false);assert.equal(S.beltCount(p,0),7);
});
for(const route of['slam','meteor','volley'])test('lethal '+route+' automatically eats normal food before damage, without extra invulnerability',()=>{
 const s=scene(),p=stock(s,[['beer',1],['cheese',3],['warp',1]]);p.revives=1;hit(s,20,route);assert.equal(p.alive,true);assert.equal(p.hp,15);assert.equal(p.revives,1);assert.equal(p.inv,.75);assert.equal(s.hurtBy[route],20);assert.equal(S.beltCount(p,1),2);assert.deepEqual(p.belt,['beer','cheese','warp']);assert.equal(p.buffs.speed||0,0);assert.equal(s.fx.filter(f=>f.k==='auto-food').length,1);
});
test('multiple portions follow belt order, survive strict equality, and handle emptied slots',()=>{
 const s=scene(),p=stock(s,[['cheese',1],['beer',1],['trout',3]]);p.hp=5;hit(s,45);assert.equal(p.alive,true);assert.equal(p.hp,25);assert.deepEqual(p.belt,['beer','trout']);assert.equal(p.foodStacks.trout,1);assert(!Object.hasOwn(p.foodStacks,'cheese'));assert.deepEqual(s.fx.filter(f=>f.k==='use').map(f=>f.kind),['cheese','trout','trout']);assert.equal(s.fx.find(f=>f.k==='auto-food').count,3);
});
test('nonlethal, empty, utility-only, insufficient and impossible hits never waste stored items',()=>{
 for(const [hp,damage,kinds,alive]of [[30,20,[['cheese',5]],true],[20,20,[],false],[20,20,[['beer',1],['warp',1],['pumpkin',1]],false],[5,50,[['cheese',2]],false],[20,100,[['bass',5]],false],[20,101,[['bass',5]],false]]){
  const s=scene(),p=stock(s,kinds);p.hp=hp;const belt=JSON.stringify([p.belt,p.foodStacks]);hit(s,damage);assert.equal(p.alive,alive);assert.equal(JSON.stringify([p.belt,p.foodStacks]),belt);assert(!s.fx.some(f=>f.k==='use'||f.k==='auto-food'));
 }
});
test('insufficient food leaves the existing revive behavior intact',()=>{const s=scene(),p=stock(s,[['cheese',1]]);p.hp=5;p.revives=1;hit(s,50);assert.equal(p.alive,true);assert.equal(p.hp,p.maxHp*.5);assert.equal(p.revives,0);assert.equal(p.inv,2);assert.equal(p.foodStacks.cheese,1);});
test('manual food in the same tick heals first and does not also consume an unnecessary portion',()=>{const s=scene(),p=stock(s,[['cheese',2]]);hit(s,20,'slam',{p1:{mx:0,mz:0,use:0}});assert.equal(p.alive,true);assert.equal(p.hp,15);assert.equal(p.foodStacks.cheese,1);assert.equal(s.fx.filter(f=>f.k==='use').length,1);assert(!s.fx.some(f=>f.k==='auto-food'));});
test('hit immunity prevents both damage and automatic eating',()=>{const s=scene(),p=stock(s,[['cheese',2]]);p.inv=1;hit(s,30);assert.equal(p.hp,20);assert.equal(p.foodStacks.cheese,2);assert(!s.fx.some(f=>f.k==='use'||f.k==='auto-food'));});
for(const type of['chicken','giant'])test('automatic food covers '+type+' contact with the existing mitigation',()=>{
 const s=scene(),p=stock(s,[['bass',1]]);p.hp=1;S.spawnEnemy(s,type,p.x+.2,p.z);s.enemies[0].atkCd=1e9;S.step(s);const source=type==='giant'?'boss-contact':'contact';assert(s.hurtBy[source]>0);assert.equal(p.alive,true);assert.equal(p.hp,51-s.hurtBy[source]);assert.equal(p.belt.length,0);assert.equal(p.inv,.75);
});
test('normal healing bonuses and armour mitigation apply before the emergency decision',()=>{
 const s=scene(),p=stock(s,[['cheese',1]]);p.meta.fishing=2;p.hp=5;hit(s,23);assert.equal(p.alive,true);assert(Math.abs(p.hp-.6)<1e-9);assert.equal(p.belt.length,0);
 const a=scene(),q=stock(a,[['cheese',1]]);q.passives.armor=4;q.hp=20;hit(a,21);assert.equal(q.hp,3);assert.equal(q.foodStacks.cheese,1);assert(!a.fx.some(f=>f.k==='auto-food'));
});
test('manual healing may still need exactly one further automatic portion',()=>{const s=scene(),p=stock(s,[['cheese',3]]);hit(s,40,'slam',{p1:{mx:0,mz:0,use:0}});assert.equal(p.hp,10);assert.equal(p.foodStacks.cheese,1);assert.equal(s.fx.filter(f=>f.k==='use').length,2);assert.equal(s.fx.find(f=>f.k==='auto-food').count,1);});
