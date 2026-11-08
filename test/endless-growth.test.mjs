import test from 'node:test';
import assert from 'node:assert/strict';
import {createSim,step,choose,reroll,skipLevel,rollChoices,previewChoice,playerStats,openCasket,snapshot,spawnEnemy,TICK} from '../src/sim.js';
import {xpForLevel,GEAR} from '../src/content.js';

const near=(actual,wanted)=>assert.ok(Math.abs(actual-wanted)<1e-9,`${actual} != ${wanted}`);
function complete(p) {
 p.weapons={katana:6,bow:6,shield:6,axe:6};
 p.passives={might:5,boots:5,area:5,vigor:5};
 p.evo={katana:true,bow:true,shield:true,axe:true};
 p.maxHp=playerStats(p).maxHp;p.hp=p.maxHp;
}
function fresh(options={}) {
 const sim=createSim({seed:1108,endless:true,...options});
 sim.spawnAcc=-1e9;sim.bossIndex=99;sim.eventT=sim.shrineT=1e9;
 for(const p of sim.players)complete(p);
 return {sim,p:sim.players[0]};
}
function earn(sim,amount=sim.xpNeed-sim.xp) {
 const p=sim.players.find(p=>p.alive)||sim.players[0];
 sim.gems.push({id:sim.nextId++,x:p.x,z:p.z,v:amount});step(sim);
}
function rolls(sim,stat) {
 let calls=0;sim.rng=()=>++calls%2 ? .9 : stat;
 return ()=>calls;
}

for(const [roll,stat,might,maxHp,area] of [[0,'might',1.616,200,1.5],[.4,'maxHp',1.6,202,1.5],[.9,'area',1.6,200,1.515]]) {
 test(`completed Endless XP level grants one real ${stat} bonus and keeps its heal`,()=>{
  const {sim,p}=fresh();p.hp=50;const calls=rolls(sim,roll);
  const before=JSON.stringify([p.weapons,p.passives,p.evo,p.quality]);earn(sim);
  assert.equal(sim.level,2);assert.equal(calls(),2);
  assert.equal(p.endlessGrowth?.[stat],1);
  const st=playerStats(p);near(st.might,might);assert.equal(st.maxHp,maxHp);near(st.area,area);
  assert.equal(p.maxHp,maxHp);assert.equal(p.hp,stat==='maxHp'?52:50);
  assert.deepEqual(sim.pending.p1.choices,[{kind:'heal',id:'fish',level:1,rarity:'common'}]);
  choose(sim,'p1',0);assert.equal(p.hp,stat==='maxHp'?92:90);assert.equal(sim.pending.p1,undefined);
  assert.equal(JSON.stringify([p.weapons,p.passives,p.evo,p.quality]),before);
  assert.deepEqual(sim.fx.filter(f=>f.k==='endless-growth'),[{k:'endless-growth',player:'p1',stat}]);
 });
}
test('one hundred growth points add linearly and a new run starts without the old bonus',()=>{
 const {p}=fresh();p.endlessGrowth={might:100,maxHp:100,area:100};
 const s=playerStats(p);near(s.might,3.2);assert.equal(s.maxHp,400);near(s.area,3);
 assert.equal(fresh().p.endlessGrowth,undefined);
});
for(const options of [{endless:false},{ranked:true},{pace:1}])test(`existing rules exclude growth for ${JSON.stringify(options)}`,()=>{
 const {sim,p}=fresh(options);sim.rng=()=>.9;earn(sim);
 assert.equal(p.endlessGrowth,undefined);near(playerStats(p).might,1.6);assert.equal(playerStats(p).maxHp,200);near(playerStats(p).area,1.5);
 assert.equal(sim.fx.some(f=>f.k==='endless-growth'),false);
});
for(const kind of ['weapon','passive','evolution','slot'])test(`remaining ${kind} upgrade prevents growth`,()=>{
 const {sim,p}=fresh();
 if(kind==='weapon')p.weapons.katana=5;
 if(kind==='passive')p.passives.might=4;
 if(kind==='evolution')p.evo.katana=false;
 if(kind==='slot')p.meta={strength:1};
 sim.rng=()=>.9;earn(sim);
 assert.equal(p.endlessGrowth,undefined);
 assert(sim.pending.p1.choices.some(c=>['weapon','passive','evolve'].includes(c.kind)&&c.id!=='curse'));
});
test('optional Curse stays manual while completed positive upgrades still grant growth',()=>{
 const {sim,p}=fresh();p.passives={might:5,boots:5,area:5,curse:1};p.maxHp=100;p.hp=60;
 const values=[.9,.9,0];sim.rng=()=>values.shift()??.9;earn(sim);
 assert.equal(p.endlessGrowth?.might,1);
 assert.deepEqual(sim.pending.p1.choices.map(c=>c.id),['fish','curse']);
 assert.equal(p.passives.curse,1);assert.equal(p.hp,60);
 choose(sim,'p1',0);assert.equal(p.passives.curse,1);assert.equal(p.hp,100);
});
test('queued XP levels grant once when opened, with no extra grant from reroll, preview or snapshot',()=>{
 const {sim,p}=fresh();const calls=rolls(sim,0);
 earn(sim,sim.xpNeed+xpForLevel(2));
 assert.equal(sim.level,3);assert.equal(p.levelQ,1);assert.equal(p.endlessGrowth?.might,1);
 const state=JSON.stringify(p);const before=calls();previewChoice(sim,p,sim.pending.p1.choices[0]);snapshot(sim);
 assert.equal(JSON.stringify(p),state);assert.equal(calls(),before);
 assert.equal(reroll(sim,'p1'),true);assert.equal(p.endlessGrowth.might,1);
 choose(sim,'p1',0);assert.equal(p.levelQ,0);
 assert.equal(Object.values(p.endlessGrowth).reduce((a,n)=>a+n,0),2);
 choose(sim,'p1',0);assert.equal(sim.pending.p1,undefined);
 assert.equal(Object.values(p.endlessGrowth).reduce((a,n)=>a+n,0),2);
});
test('opening a queued level after a casket grants once; chest rolls and ordinary previews do not',()=>{
 const {sim,p}=fresh();sim.rng=()=>.9;
 for(let i=0;i<3;i++)previewChoice(sim,p,rollChoices(sim,p)[0]);
 assert.equal(p.endlessGrowth,undefined);
 sim.pickups.push({id:sim.nextId++,x:p.x,z:p.z,kind:'chest'});step(sim);
 assert.equal(p.endlessGrowth,undefined);choose(sim,'p1',0);
 p.casketQ.push(Object.keys(GEAR)[0]);assert.equal(openCasket(sim,p),true);
 p.levelQ=1;choose(sim,'p1',1);assert.equal(p.endlessGrowth?.area,1);choose(sim,'p1',0);
 assert.equal(p.endlessGrowth.area,1);
});
test('skipping a pending heal cannot create another growth point without another earned level',()=>{
 const {sim,p}=fresh();rolls(sim,0);earn(sim);assert.equal(p.endlessGrowth?.might,1);
 assert.equal(skipLevel(sim,'p1'),true);assert.equal(skipLevel(sim,'p1'),false);
 assert.equal(p.endlessGrowth.might,1);assert.equal(p.coins,1);
});
test('co-op shared XP gives each living completed build its own bonus and owned feedback',()=>{
 const {sim}=fresh({coop:true,players:[{id:'p1'},{id:'p2'}]});
 const values=[.9,0,.9,.9];sim.rng=()=>values.shift()??.9;earn(sim);
 assert.equal(sim.players[0].endlessGrowth?.might,1);assert.equal(sim.players[1].endlessGrowth?.area,1);
 assert.notEqual(sim.players[0].endlessGrowth,sim.players[1].endlessGrowth);
 assert.deepEqual(sim.fx.filter(f=>f.k==='endless-growth'),[{k:'endless-growth',player:'p1',stat:'might'},{k:'endless-growth',player:'p2',stat:'area'}]);
 choose(sim,'p1',0);assert(sim.pending.p2);choose(sim,'p2',0);assert.equal(Object.keys(sim.pending).length,0);
});
test('seeded grants remain identical when only one view previews and drains FX',()=>{
 const a=fresh(),b=fresh();
 for(let i=0;i<20;i++) {
  earn(a.sim);earn(b.sim);assert(a.p.endlessGrowth);
  previewChoice(a.sim,a.p,a.sim.pending.p1.choices[0]);snapshot(a.sim);
  choose(a.sim,'p1',0);choose(b.sim,'p1',0);
  assert.deepEqual(a.p.endlessGrowth,b.p.endlessGrowth);assert.deepEqual(playerStats(a.p),playerStats(b.p));
 }
});
test('growth damage is consumed by a real weapon hit',()=>{
 const {sim,p}=fresh();rolls(sim,0);earn(sim);choose(sim,'p1',0);
 sim.rng=()=>.9;p.cd.katana=0;spawnEnemy(sim,'dragon',p.x,p.z+1);const e=sim.enemies.at(-1);e.hp=e.maxHp=1e9;e.rise=1e9;
 step(sim);assert.equal(sim.dmgBy.katana,65);
});
test('dead players and finished runs cannot receive growth',()=>{
 const a=fresh();a.p.alive=false;earn(a.sim);assert.equal(a.p.endlessGrowth,undefined);
 const b=fresh();b.sim.over='win';earn(b.sim);assert.equal(b.p.endlessGrowth,undefined);
});
