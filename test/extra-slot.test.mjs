import {continueCasual,captureRewardBaseline}from '../src/casual-continuation.js';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {createSim,rollChoices,applyChoice,previewChoice,playerStats,choose,reroll,skipLevel,canBanish}from '../src/sim.js';
import {WEAPON_IDS,PASSIVES,EVOLUTIONS,evolutionPassives}from '../src/content.js';
function full(options={}){const sim=createSim(options),p=sim.players[0];sim.level=10;const stats=playerStats(p);p.weapons=Object.fromEntries(WEAPON_IDS.slice(0,stats.weaponSlots).map(id=>[id,1]));p.passives=Object.fromEntries(Object.keys(PASSIVES).slice(0,stats.passiveSlots).map(id=>[id,1]));sim.rng=()=>0;return{sim,p};}
const slot=(sim,p)=>rollChoices(sim,p).find(c=>c.kind==='slot');
test('rare casual capacity offer has no rarity or immediate item and chooses either eligible full row',()=>{
 const {sim,p}=full(),before=structuredClone(p),offer=slot(sim,p);assert.deepEqual(offer,{kind:'slot',id:'weapon',level:1});assert.deepEqual(p,before);assert(rollChoices(sim,p).length<=3);
 sim.rng=()=>.019999;assert(slot(sim,p));sim.rng=()=>.02;assert.equal(slot(sim,p),undefined);
 const passive=full();passive.p.weapons={katana:1};assert.equal(slot(passive.sim,passive.p).id,'passive');
});
test('accept one extra slot per run, preserve training and do not heal even a forged epic slot card',()=>{
 const {sim,p}=full({meta:{strength:2,prayer:2}}),before=structuredClone(p);p.hp=11;applyChoice(sim,p,{kind:'slot',id:'weapon',level:1,rarity:'epic'});assert.equal(p.slotUpgrade,'weapon');assert.equal(playerStats(p).weaponSlots,7);assert.equal(playerStats(p).passiveSlots,6);assert.equal(p.hp,11);assert.deepEqual(p.weapons,before.weapons);assert.deepEqual(p.passives,before.passives);
 const accepted=structuredClone(p);for(const id of ['weapon','passive','constructor'])applyChoice(sim,p,{kind:'slot',id,level:1});assert.deepEqual(p,accepted);assert.equal(slot(sim,p),undefined);assert.equal(playerStats(createSim({meta:{strength:2}}).players[0]).weaponSlots,6);
});
test('new item becomes available after capacity opens; preview never consumes the real offer',()=>{
 const {sim,p}=full(),offer=slot(sim,p),before=structuredClone(p),preview=previewChoice(sim,p,offer);assert.deepEqual(p,before);assert.equal(playerStats(preview).weaponSlots,5);assert.equal(playerStats(p).weaponSlots,4);
 applyChoice(sim,p,offer);sim.rng=()=>.999;const choices=Array.from({length:30},()=>rollChoices(sim,p)).flat();assert(choices.some(c=>c.kind==='weapon'&&!p.weapons[c.id]),'new weapon can be offered');assert.equal(choices.some(c=>c.kind==='slot'),false);
});
test('ranked, pace1, early levels, special modes, dead players and incomplete rows cannot gain bonus capacity',()=>{
 const changes=[s=>s.ranked=true,s=>s.pace=1,s=>s.level=9,...['boss','raid','fun','wizard','castle'].map(mode=>s=>s.variant=mode)];
 for(const change of changes){const{sim,p}=full();change(sim);p.hp=11;assert.equal(slot(sim,p),undefined);applyChoice(sim,p,{kind:'slot',id:'weapon',level:1});assert.equal(p.slotUpgrade,undefined);assert.equal(p.hp,11);}
 for(const adjust of [p=>p.alive=false,p=>{p.weapons={katana:1};p.passives={};}]){const{sim,p}=full();adjust(p);assert.equal(slot(sim,p),undefined);applyChoice(sim,p,{kind:'slot',id:'weapon',level:1});assert.equal(p.slotUpgrade,undefined);}
});
test('no offer if every remaining item for a full row is banished or already owned',()=>{
 const{sim,p}=full();p.passives={};p.banished=WEAPON_IDS.filter(id=>!p.weapons[id]).map(id=>'weapon:'+id);assert.equal(slot(sim,p),undefined);applyChoice(sim,p,{kind:'slot',id:'weapon',level:1});assert.equal(p.slotUpgrade,undefined);
 p.weapons=Object.fromEntries(WEAPON_IDS.map(id=>[id,1]));p.banished=[];assert.equal(slot(sim,p),undefined);
});
test('all three evolution cards retain priority and the offer consumes no extra RNG',()=>{
 const{sim,p}=full();const ids=Object.keys(EVOLUTIONS).slice(0,4);p.weapons=Object.fromEntries(ids.map(id=>[id,6]));for(const id of ids)p.passives[evolutionPassives(id,2)[0]]=1;let calls=0;sim.rng=()=>{calls++;return 0;};const choices=rollChoices(sim,p);assert.equal(choices.length,3);assert(choices.every(c=>c.kind==='evolve'));assert.equal(calls,0);
});
test('skip, reroll and banish cannot accidentally spend the run-only capacity award',()=>{
 const{sim,p}=full();sim.pending[p.id]={choices:rollChoices(sim,p),left:20};const i=sim.pending[p.id].choices.findIndex(c=>c.kind==='slot');assert(i>=0);assert.equal(canBanish(sim,p.id,i),false);assert(reroll(sim,p.id));assert.equal(p.slotUpgrade,undefined);assert(skipLevel(sim,p.id));assert.equal(p.slotUpgrade,undefined);
 sim.pending[p.id]={choices:rollChoices(sim,p),left:20};assert(choose(sim,p.id,sim.pending[p.id].choices.findIndex(c=>c.kind==='slot')));assert.equal(p.slotUpgrade,'weapon');assert.equal(sim.pending[p.id],undefined);
});
test('co-op capacity belongs only to the accepting player and either partner can earn it once',()=>{
 const {sim,p}=full({coop:true,players:[{id:'p1'},{id:'p2'}]}),other=sim.players[1];other.weapons={...p.weapons};other.passives={...p.passives};applyChoice(sim,p,{kind:'slot',id:'weapon',level:1});assert.equal(playerStats(p).weaponSlots,5);assert.equal(playerStats(other).weaponSlots,4);assert.equal(other.slotUpgrade,undefined);
 applyChoice(sim,other,{kind:'slot',id:'passive',level:1});assert.equal(playerStats(other).passiveSlots,5);assert.equal(playerStats(p).passiveSlots,4);
});
test('previous released ranked choice sequences and exact RNG counts are unchanged',()=>{
 const {cases}=JSON.parse(fs.readFileSync(new URL('./fixtures/extra-slot-ranked-baseline.json',import.meta.url)));for(const row of cases){const sim=createSim({pace:row.pace,ranked:true,seed:row.seed});sim.level=row.level;const p=sim.players[0];p.weapons={...row.weapons};p.passives={...row.passives};let draws=0;const random=sim.rng;sim.rng=()=>{draws++;return random();};assert.deepEqual(Array.from({length:4},()=>rollChoices(sim,p)),row.choices);assert.equal(draws,row.draws);assert.equal(p.slotUpgrade,undefined);}
});

test('a rare capacity option retains the safe heal before Curse and suppresses automatic Endless growth',()=>{
 const{sim,p}=full({endless:true});p.weapons=Object.fromEntries(Object.keys(p.weapons).map(id=>[id,6]));p.evo=Object.fromEntries(Object.keys(p.weapons).map(id=>[id,true]));p.passives={...Object.fromEntries(Object.keys(PASSIVES).filter(id=>id!=='curse').slice(0,3).map(id=>[id,5])),curse:1};
 sim.pending[p.id]={choices:[{kind:'heal',id:'fish',level:1}],left:20};p.levelQ=1;assert(skipLevel(sim,p.id));const choices=sim.pending[p.id].choices;assert.equal(choices[0].kind,'heal');assert(choices.some(c=>c.kind==='slot'));assert.equal(p.endlessGrowth,undefined);assert(choices.length<=3);
});

test('both full rows can receive the equally selected passive offer without a fourth card',()=>{const{sim,p}=full();let n=0;sim.rng=()=>{n++;return n===4?0:n===5?.75:.5;};const choices=rollChoices(sim,p);assert.equal(choices.find(c=>c.kind==='slot')?.id,'passive');assert.equal(choices.length,3);});

test('continuing the same victory as Endless retains the already-earned slot without another offer',()=>{const{sim,p}=full();applyChoice(sim,p,{kind:'slot',id:'weapon',level:1});sim.over='win';const baseline=captureRewardBaseline(sim,{loot:[]});continueCasual(sim,baseline);assert(sim.endless);assert.equal(p.slotUpgrade,'weapon');assert.equal(playerStats(p).weaponSlots,5);assert.equal(slot(sim,p),undefined);});
