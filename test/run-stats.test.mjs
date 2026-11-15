import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../src/run-stats.js';
import * as S from '../src/sim.js';
import {rankedSim,RunRecorder,replay} from '../src/ranked.js';
import {rankedStep} from '../src/ranked-play.js';
import {GEAR,GEAR_SLOTS} from '../src/content.js';
const fresh=()=>S.createSim({seed:1114,players:[{id:'p1',adv:'alex'}]});
function start(sim){assert.equal(typeof R.startRunStats,'function','Run statistics tracker exists');R.startRunStats(sim.players[0]);}
test('records starters separately, actual offers and successful picks without counting previews',()=>{
 const sim=fresh(),p=sim.players[0];start(sim);
 const before=JSON.stringify(p),cards=S.rollChoices(sim,p);assert(cards.length);assert.equal(JSON.stringify(p),before);
 let stats=R.captureRunStats(sim,p);assert.equal(stats.complete,true);assert.deepEqual(stats.starter,{weapons:{greatsword:1},passives:{boots:1}});
 const offered=cards.filter(c=>['weapon','passive'].includes(c.kind));assert.equal(Object.values(stats.offered.weapon).reduce((a,b)=>a+b,0)+Object.values(stats.offered.passive).reduce((a,b)=>a+b,0),offered.length);
 const choice={kind:'weapon',id:'bow',level:1,rarity:'rare'};S.previewChoice(sim,p,choice);assert.deepEqual(R.captureRunStats(sim,p).chosen,{weapon:{},passive:{}});
 S.applyChoice(sim,p,choice);S.applyChoice(sim,p,{kind:'passive',id:'boots',level:2,rarity:'common'});stats=R.captureRunStats(sim,p);
 assert.equal(stats.weapons.bow,1);assert.equal(stats.starter.weapons.bow,undefined);assert.equal(stats.passives.boots,2);assert.equal(stats.chosen.weapon.bow,1);assert.equal(stats.chosen.passive.boots,1);
 assert.deepEqual(R.normalizeRunStats(stats),stats);const saved=JSON.stringify(stats);p.weapons.bow=3;assert.equal(JSON.stringify(stats),saved,'captured build is detached');
});
test('optional statistics never change combat state, RNG, snapshots or untracked player fields',()=>{
 const a=fresh(),b=fresh();start(a);
 for(let i=0;i<60;i++){S.step(a,{},S.TICK);S.step(b,{},S.TICK);if(i%10===0){assert.deepEqual(S.rollChoices(a,a.players[0]),S.rollChoices(b,b.players[0]));}}
 assert.deepEqual(S.snapshot(a),S.snapshot(b));assert.equal(JSON.stringify({...a,rng:null}),JSON.stringify({...b,rng:null}));assert.equal(a.rng(),b.rng());
});
test('missing observation history remains explicit rather than inventing starters or choice rates',()=>{
 const sim=fresh();assert.equal(typeof R.captureRunStats,'function');const stats=R.captureRunStats(sim,sim.players[0]);assert.equal(stats.complete,false);assert.equal(stats.starter,null);assert.equal(stats.offered,null);assert.equal(stats.chosen,null);assert.equal(stats.weapons.greatsword,1);assert.deepEqual(R.normalizeRunStats(stats),stats);
});
test('normalization rejects extra identity fields, unknown items, malformed maps and impossible counters',()=>{
 const sim=fresh();start(sim);const good=R.captureRunStats(sim,sim.players[0]);
 for(const change of [s=>s.wallet='0x123',s=>s.weapons.unknown=1,s=>s.weapons.greatsword='1',s=>s.weapons.greatsword=999,s=>s.offered.weapon.bow=-1,s=>s.chosen.passive.boots=Infinity,s=>s.gear.body='Unknown robe',s=>s.quality.weapons.greatsword=NaN,s=>s.evo.bow=true,s=>s.offered=[],s=>s.starter=null]){
  const copy=structuredClone(good);change(copy);assert.equal(R.normalizeRunStats(copy),null);
 }
 for(const bad of [null,[],1,'secret',JSON.parse('{"v":1,"__proto__":{}}')])assert.equal(R.normalizeRunStats(bad),null);
});
test('optional verified replay statistics leave the default replay contract and outcome unchanged',()=>{
 const params={week:1,mapId:'apache',adv:'adventurer',seed:71,ground:null},sim=rankedSim(params),rec=new RunRecorder();
 for(let i=0;i<60;i++)rankedStep(sim,rec,.1,0,null);
 const baseline=replay(rec.log(),params,{allowPartial:true}),observed=replay(rec.log(),params,{allowPartial:true,analytics:true});
 assert(observed.stats,'Opt-in replay returns its observed build');assert.equal(observed.stats.complete,true);assert.equal(observed.stats.starter.weapons.katana,1);assert(R.normalizeRunStats(observed.stats));delete observed.stats;assert.deepEqual(observed,baseline);assert.equal(baseline.stats,undefined);
});
test('a legitimate full nine-slot equipment build is retained',()=>{
 const sim=fresh(),p=sim.players[0];start(sim);p.gear=Object.fromEntries(GEAR_SLOTS.map(slot=>[slot,Object.keys(GEAR).find(id=>GEAR[id].slot===slot)]));assert.equal(Object.keys(p.gear).length,9);const stats=R.captureRunStats(sim,p);assert.deepEqual(R.normalizeRunStats(stats),stats);
});
test('client summary is anonymous, detached and keeps modes distinct without accepting ranked client telemetry',()=>{
 const sim=fresh(),p=sim.players[0];start(sim);sim.t=900;sim.kills=100;sim.level=5;sim.over='win';assert.equal(typeof R.captureCasualRunSummary,'function');
 const row=R.captureCasualRunSummary(sim,p,'test','a'.repeat(12));assert(row);assert.equal(row.kind,'casual');assert.equal(row.won,true);assert.equal(row.week,null);assert.equal(row.name,undefined);p.weapons.bow=1;assert.equal(row.stats.weapons.bow,undefined);
 sim.coop=true;assert.equal(R.captureCasualRunSummary(sim,p,'test','a'.repeat(12)).kind,'coop');sim.coop=false;sim.variant='fun';assert.equal(R.captureCasualRunSummary(sim,p,'test','a'.repeat(12)).kind,'fun');sim.ranked=true;assert.equal(R.captureCasualRunSummary(sim,p,'test','a'.repeat(12)),null);
});
