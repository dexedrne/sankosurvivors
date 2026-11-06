import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../src/content.js';
import * as S from '../src/sim.js';
import { rankedSim, RunRecorder } from '../src/ranked.js';
import { rankedStep, rankedChoice, resumeRanked } from '../src/ranked-play.js';
import { createRequire } from 'node:module';

const close=(actual,want)=>assert.ok(Math.abs(actual-want)<1e-10,`${actual} != ${want}`);
const fresh=(weapon='bow',pace=2)=>{const sim=S.createSim({seed:1106,startWeapon:weapon,pace});sim.spawnAcc=-1e9;sim.bossIndex=99;sim.eventT=sim.shrineT=1e9;return{sim,p:sim.players[0]};};
const pick=(sim,p,kind,id,rarity)=>S.applyChoice(sim,p,{kind,id,rarity,from:(kind==='weapon'?p.weapons:p.passives)[id]||0,level:((kind==='weapon'?p.weapons:p.passives)[id]||0)+1});
function helpers(){assert.equal(typeof C.weaponStats,'function');assert.equal(typeof C.passiveStrength,'function');assert.equal(typeof S.previewChoice,'function');}

test('quality names and weights give exactly one level per card',()=>{
 assert.deepEqual(C.CARD_RARITIES,['common','uncommon','rare','epic']);assert.deepEqual(C.CARD_QUALITY,[100,115,130,150]);assert.deepEqual(C.CARD_GAIN,[1,1,1,1]);
 for(const [roll,name]of [[.9,'common'],[.2,'uncommon'],[.05,'rare'],[.005,'epic']]){
  const{sim,p}=fresh();sim.rng=()=>roll;
  for(const c of S.rollChoices(sim,p)){if(c.kind==='evolve'||c.kind==='heal'||c.id==='curse')continue;assert.equal(c.rarity,name);assert.equal(c.level-c.from,1);}
 }
});
for(const[rarity,damage,cd,points]of [['common',11.3,1.11,0],['uncommon',11.72,1.0965,15],['rare',12.14,1.083,30],['epic',12.7,1.065,50]])test(`${rarity} Bow1→2 has retained continuous strength and real integer unlocks`,()=>{
 helpers();const{sim,p}=fresh();pick(sim,p,'weapon','bow',rarity);const stats=C.weaponStats(p,'bow');
 assert.equal(p.weapons.bow,2);assert.equal(p.quality.weapons.bow||0,points);close(stats.dmg,damage);close(stats.cd,cd);assert.equal(stats.count,2);assert.equal(stats.pierce,1);
 pick(sim,p,'weapon','bow','common');assert.equal(p.weapons.bow,3);close(C.weaponStats(p,'bow').dmg,damage+2.8);assert.equal(p.quality.weapons.bow||0,points);
});
test('Epic acquisition is useful without early arrows, piercing or burst unlocks',()=>{
 helpers();const{sim,p}=fresh('katana');pick(sim,p,'weapon','bow','epic');assert.equal(p.weapons.bow,1);const s=C.weaponStats(p,'bow');close(s.dmg,9.9);close(s.cd,1.155);assert.equal(s.count,1);assert.equal(s.pierce,0);
 pick(sim,p,'weapon','staff','epic');assert.equal(C.weaponStats(p,'staff').burst,0);assert.equal(C.weaponStats(p,'staff').count,1);
});
test('all Common stats stay exact and extreme valid quality never changes discrete stats or yields invalid timers',()=>{
 helpers();for(const id of C.WEAPON_IDS)for(let level=1;level<=6;level++){
  const{p}=fresh(id);p.weapons[id]=level;assert.deepEqual(C.weaponStats(p,id),C.WEAPONS[id].stats(level));
  p.quality.weapons[id]=level*50;const a=C.weaponStats(p,id),raw=C.WEAPONS[id].stats(level);
  for(const key of ['count','pierce','bounces','both'])assert.equal(a[key],raw[key],`${id}/${level}/${key}`);
  for(const stats of [a,C.evolveStats(id,a)])for(const[key,value]of Object.entries(stats))if(typeof value==='number'){assert.ok(Number.isFinite(value)&&value>=0);if(['cd','hitcd','tick'].includes(key))assert.ok(value>0);}
 }
});
test('maxed weapons/passives cannot receive more quality or farm Epic healing',()=>{
 const{sim,p}=fresh();for(let i=0;i<5;i++)pick(sim,p,'weapon','bow','epic');for(let i=0;i<5;i++)pick(sim,p,'passive','might','rare');
 const before=JSON.stringify({weapons:p.weapons,passives:p.passives,quality:p.quality});p.hp=1;
 for(let i=0;i<20;i++){pick(sim,p,'weapon','bow','epic');pick(sim,p,'passive','might','epic');}
 assert.equal(JSON.stringify({weapons:p.weapons,passives:p.passives,quality:p.quality}),before);assert.equal(p.hp,1);
 const ids=S.rollChoices(sim,p).map(c=>c.id);assert.ok(!ids.includes('bow')&&!ids.includes('might'));
});
test('passive strength changes continuous gains, while Feather thresholds and Curse remain integer',()=>{
 helpers();const{sim,p}=fresh();pick(sim,p,'passive','might','epic');close(S.playerStats(p).might,1.18);assert.equal(p.passives.might,1);
 pick(sim,p,'passive','vigor','epic');assert.equal(p.maxHp,130);close(S.playerStats(p).regen,.225);
 for(let i=0;i<3;i++)pick(sim,p,'passive','amount','epic');let stats=S.playerStats(p);assert.equal(stats.amount,1);close(stats.reach,1.27);
 pick(sim,p,'passive','amount','common');assert.equal(S.playerStats(p).amount,2);
 pick(sim,p,'passive','curse','epic');assert.equal(p.passives.curse,1);assert.equal(p.quality.passives.curse||0,0);
 let saw=false;for(let i=0;i<100;i++)for(const c of S.rollChoices(sim,p))if(c.id==='curse'){saw=true;assert.equal(c.rarity,undefined);assert.equal(c.level-c.from,1);}assert.equal(saw,true);
});
test('quality Rusty Key improves rarity luck and haste still respects its real cap',()=>{
 helpers();const a=fresh(),b=fresh();a.p.passives.greed=b.p.passives.greed=1;b.p.quality.passives.greed=50;a.sim.rng=b.sim.rng=()=>.0109;
 assert.equal(S.rollChoices(a.sim,a.p)[0].rarity,'rare');assert.equal(S.rollChoices(b.sim,b.p)[0].rarity,'epic');
 b.p.passives.haste=5;b.p.quality.passives.haste=250;b.p.meta={fletching:5};b.p.gb={haste:.2};assert.equal(S.playerStats(b.p).haste,.3);
});
test('preview uses actual application, preserves prior quality, and never mutates live state',()=>{
 helpers();const{sim,p}=fresh();pick(sim,p,'weapon','bow','rare');p.hp=1;const before=JSON.stringify(sim),c={kind:'weapon',id:'bow',from:2,level:3,rarity:'epic'};
 const after=S.previewChoice(sim,p,c);assert.equal(JSON.stringify(sim),before);const expected=structuredClone(p);S.applyChoice({...sim,fx:[]},expected,c);assert.deepEqual(after,expected);assert.equal(after.quality.weapons.bow,80);assert.equal(after.hp,after.maxHp);
 p.wm={bow:2,arrow:3};const strength=C.weaponStats(p,'bow');p.wm={bow:3,arrow:4};assert.deepEqual(C.weaponStats(p,'bow'),strength);
 pick(sim,p,'weapon','bow','common');pick(sim,p,'weapon','bow','common');pick(sim,p,'weapon','bow','common');const points=p.quality.weapons.bow;S.applyChoice(sim,p,{kind:'evolve',id:'bow',level:1});assert.equal(p.quality.weapons.bow,points);assert.equal(p.evo.bow,true);
});
for(const id of ['bow','lighter','shield'])test(`${id} actual attack consumer uses retained quality`,()=>{
 helpers();const{sim,p}=fresh(id);pick(sim,p,'weapon',id,'epic');S.spawnEnemy(sim,'goblin',p.x+2,p.z);sim.enemies[0].hp=10000;p.cd[id]=0;S.step(sim,{},S.TICK);const stats=C.weaponStats(p,id);
 if(id==='bow'){assert.ok(sim.proj.length>0);close(sim.proj[0].dmg,stats.dmg);}else if(id==='lighter')close(p.fire,stats.radius);else close(p.shields.dmg,stats.dmg);
});
test('pace1 has no quality state and keeps one-level ordinary stats',()=>{
 helpers();const{sim,p}=fresh('bow',1);assert.equal(Object.hasOwn(p,'quality'),false);const c=S.rollChoices(sim,p).find(c=>c.id==='bow');S.applyChoice(sim,p,c);assert.equal(p.weapons.bow,2);assert.deepEqual(C.weaponStats(p,'bow'),C.WEAPONS.bow.stats(2));assert.equal(Object.hasOwn(p,'quality'),false);
});

test('genuine quality, reroll, skip and mid-tumble prefixes restore exact player state',()=>{
 const params={seed:710,week:1,mapId:'greentown',adv:'adventurer',ground:null},sim=rankedSim(params),rec=new RunRecorder();let rerolled=false,skipped=false,found=false;
 const choose=(s,r)=>{const c=s.pending.p1.choices;const index=c.reduce((best,card,i)=>C.CARD_RARITIES.indexOf(card.rarity)>C.CARD_RARITIES.indexOf(c[best].rarity)?i:best,0);assert.equal(rankedChoice(s,r,index),true);};
 while(!sim.over&&sim.tick<6000){
  if(sim.pending.p1){
   if(sim.pending.p1.casket){assert.equal(rankedChoice(sim,rec,0),true);continue;}
   if(!rerolled){assert.equal(rankedChoice(sim,rec,'r'),true);rerolled=true;continue;}
   if(!skipped){assert.equal(rankedChoice(sim,rec,'s'),true);skipped=true;continue;}
   choose(sim,rec);
  }else{const phase=Math.floor(sim.tick/90)%4;rankedStep(sim,rec,[1,0,-1,0][phase],[0,1,0,-1][phase],4);sim.fx.length=0;}
  const p=sim.players[0];if(p.quality&&Object.values(p.quality).some(map=>Object.values(map).some(value=>value>0))&&p.rollT>0){found=true;break;}
 }
 assert.ok(rerolled&&skipped&&found,'real inputs earn quality and an active tumble without state injection');
 const restored=resumeRanked(JSON.parse(JSON.stringify(rec.log())),params);assert.deepEqual(restored.sim.players,sim.players);assert.deepEqual(restored.rec.log(),rec.log());
 for(let i=0;i<200&&!sim.over;i++){
  if(sim.pending.p1){choose(sim,rec);choose(restored.sim,restored.rec);}else{rankedStep(sim,rec,.25,-.75,4);rankedStep(restored.sim,restored.rec,.25,-.75,4);}
 }
 assert.deepEqual(restored.sim.players,sim.players);assert.deepEqual(restored.rec.log(),rec.log());assert.deepEqual([restored.sim.tick,restored.sim.kills,restored.sim.xp],[sim.tick,sim.kills,sim.xp]);
});
test('ranked logs cannot submit invented quality or non-index upgrade choices',()=>{
 const {logShape}=createRequire(import.meta.url)('../tools/vercel-api/ranked.js'),log={v:1,runs:[[1,0,0]],uses:[],picks:[]};
 assert.equal(logShape({...log,quality:{weapons:{bow:999}}},30),'bad log');assert.equal(logShape({...log,picks:[{index:0,rarity:'epic'}]},30),'bad choice');assert.equal(logShape(log,30),null);
});
