import test from 'node:test';import assert from 'node:assert/strict';
import * as C from '../src/content.js';import * as S from '../src/sim.js';
import { rankedChoice } from '../src/ranked-play.js';
import { RunRecorder } from '../src/ranked.js';
const elements=['air','water','earth','fire','void'];
function scene(passives={air:1,water:1,earth:1,fire:1,void:1},extra={}){const sim=S.createSim({seed:13,pace:2,...extra}),p=sim.players[0];p.weapons={staff:6};p.passives={...passives};p.hp=1;sim.pending[p.id]={left:7,choices:[{kind:'evolve',id:'staff',level:1}]};return{sim,p};}
const requireHelpers=()=>{assert.equal(typeof C.spellEvolutions,'function');assert.equal(typeof C.spellEvolutionChoices,'function');};
test('all owned element combinations yield only their eligible branches and preserve legacy Void routes',()=>{
 requireHelpers();for(let mask=0;mask<32;mask++){const owned=Object.fromEntries(elements.filter((_,i)=>mask&(1<<i)).map(e=>[e,1])),{sim,p}=scene(owned);assert.deepEqual(C.spellEvolutions(p,sim.pace),elements.filter(e=>owned[e]));}
 for(const legacy of ['growth','area']){const{p}=scene({[legacy]:1});assert.deepEqual(C.spellEvolutions(p,2),['void']);}
 const{p}=scene();assert.deepEqual(C.spellEvolutions(p,1),[]);p.weapons.staff=5;assert.deepEqual(C.spellEvolutions(p,2),[]);p.weapons.staff=6;p.evo.staff=true;assert.deepEqual(C.spellEvolutions(p,2),[]);
 assert.deepEqual(C.evolutionPassives('staff',1),['growth']);
});
test('every eligible branch is reachable through three-index cyclic pages',()=>{
 requireHelpers();const{p}=scene();const reached=[];for(let page=0;page<3;page++){const choices=C.spellEvolutionChoices(p,2,page);assert(choices.length<=3);assert.equal(choices[0].kind,'evolve');reached.push(...choices.filter(c=>c.kind==='evolve').map(c=>c.element));const nav=choices.at(-1);assert.equal(nav.kind,'spell-page');assert.equal(nav.level,(page+1)%3);}assert.deepEqual(reached,elements);
});
test('opening/paging a selector preserves health, quality, queued rewards, RNG, timers and evolution counters',()=>{
 const{sim,p}=scene();p.levelQ=1;p.casketQ=['Iron Boots'];const before=JSON.stringify(p),fx=JSON.stringify(sim.fx);let draws=0;sim.rng=()=>{draws++;return .5;};
 assert(S.choose(sim,p.id,0));assert.equal(sim.pending[p.id].spell,true);assert.equal(sim.pending[p.id].left,7);assert.equal(JSON.stringify(p),before);assert.equal(JSON.stringify(sim.fx),fx);assert.equal(sim.evolves,0);
 for(let page=0;page<6;page++){const pending=sim.pending[p.id],index=pending.choices.findIndex(c=>c.kind==='spell-page');assert(index>=0&&index<=2);assert(S.choose(sim,p.id,index));assert.equal(sim.pending[p.id].left,7);assert.equal(JSON.stringify(p),before);assert.equal(JSON.stringify(sim.fx),fx);assert.equal(sim.evolves,0);}assert.equal(draws,0);
});
for(const element of elements)test(`${element} commits once and advances the existing reward queue`,()=>{
 const{sim,p}=scene();p.casketQ=['Iron Boots'];assert(S.choose(sim,p.id,0));for(let page=0;page<3&&!sim.pending[p.id].choices.some(c=>c.element===element);page++)assert(S.choose(sim,p.id,sim.pending[p.id].choices.findIndex(c=>c.kind==='spell-page')));
 const index=sim.pending[p.id].choices.findIndex(c=>c.element===element);assert(index>=0);assert(S.choose(sim,p.id,index));assert.equal(p.evo.staff,true);assert.equal(p.spellElement,element==='void'?undefined:element);assert.equal(sim.evolves,1);assert.equal(p.hp,1);assert(sim.pending[p.id].casket);assert(!sim.pending[p.id].spell);assert.equal(p.casketQ.length,0);
});
test('single branches and old Void routes evolve directly without a selector',()=>{
 for(const [passives,want]of [[{air:1},'air'],[{growth:1},undefined],[{area:1},undefined],[{void:1},undefined]]){const{sim,p}=scene(passives);assert(S.choose(sim,p.id,0));assert.equal(sim.pending[p.id],undefined);assert.equal(p.evo.staff,true);assert.equal(p.spellElement,want);assert.equal(sim.evolves,1);}
});
test('stale or invalid selector actions do not consume the reward or grant an unowned branch',()=>{
 const{sim,p}=scene({air:1,water:1});assert(S.choose(sim,p.id,0));const before=JSON.stringify(sim.pending),rerolls=p.rerolls;assert.equal(S.reroll(sim,p.id),false);assert.equal(S.skipLevel(sim,p.id),false);assert.equal(S.canBanish(sim,p.id,0),false);assert.equal(S.banish(sim,p.id,0),false);assert.equal(p.rerolls,rerolls);assert.equal(JSON.stringify(sim.pending),before);
 sim.pending[p.id].choices=[{kind:'evolve',id:'staff',level:1,element:'fire'}];assert.equal(S.choose(sim,p.id,0),false);assert(!p.evo.staff);assert.equal(sim.evolves,0);assert(sim.pending[p.id]);
 const invalid=S.previewChoice(sim,p,{kind:'evolve',id:'staff',element:'constructor',level:1});assert(!invalid.evo.staff);assert(!p.evo.staff);
});
test('previewing a real branch is detached and page navigation has no preview side effects',()=>{
 const{sim,p}=scene();assert(S.choose(sim,p.id,0));const before=JSON.stringify(sim);const after=S.previewChoice(sim,p,sim.pending[p.id].choices[0]);assert.equal(after.evo.staff,true);assert.equal(after.spellElement,'air');assert.equal(JSON.stringify(sim),before);
 const nav=S.previewChoice(sim,p,sim.pending[p.id].choices.at(-1));assert.equal(nav.hp,p.hp);assert.deepEqual(nav.evo,p.evo);assert.equal(nav.spellElement,undefined);assert.equal(JSON.stringify(sim),before);
});
test('timer auto-choice chooses a real branch without restarting or advancing gameplay',()=>{
 const{sim,p}=scene();sim.pending[p.id].left=.01;S.step(sim,{},.02);assert.equal(sim.pending[p.id].spell,true);assert(sim.pending[p.id].left<=0);assert.equal(sim.t,0);S.step(sim,{},.02);assert.equal(p.spellElement,'air');assert.equal(sim.evolves,1);assert.equal(sim.pending[p.id],undefined);assert.equal(sim.t,0);
});
test('co-op selection changes only the pending owner and does not consume a teammate reward',()=>{
 const{sim,p}=scene(undefined,{coop:true,players:[{id:'p1'},{id:'p2'}]}),peer=sim.players[1];sim.pending[peer.id]={left:9,choices:[{kind:'heal',id:'heal',level:1}]};const before=JSON.stringify(peer),pending=JSON.stringify(sim.pending[peer.id]);assert(S.choose(sim,p.id,0));assert(S.choose(sim,p.id,0));assert.equal(p.spellElement,'air');assert.equal(p.evolves,1);assert.equal(peer.evolves,0);assert.equal(JSON.stringify(peer),before);assert.equal(JSON.stringify(sim.pending[peer.id]),pending);
});
test('invalid or stale selector indices cannot fall back to committing the first branch',()=>{
 for(const index of [-1,3,99,NaN,undefined]){const{sim,p}=scene();assert(S.choose(sim,p.id,0));const before=JSON.stringify(sim);assert.equal(S.choose(sim,p.id,index),false);assert.equal(JSON.stringify(sim),before);}
 const{sim,p}=scene();S.choose(sim,p.id,0);S.choose(sim,p.id,2);S.choose(sim,p.id,2);assert.equal(sim.pending[p.id].choices.length,2);const before=JSON.stringify(sim);assert.equal(S.choose(sim,p.id,2),false);assert.equal(JSON.stringify(sim),before);
});
test('a committed Blast opens an earned level before the queued casket and is counted only once',()=>{
 const{sim,p}=scene();p.levelQ=1;p.casketQ=['Iron Boots'];S.choose(sim,p.id,0);assert(S.choose(sim,p.id,0));assert.equal(p.levelQ,0);assert(!sim.pending[p.id].spell&&!sim.pending[p.id].casket);assert.deepEqual(p.casketQ,['Iron Boots']);assert.equal(sim.evolves,1);assert(S.choose(sim,p.id,0));assert(sim.pending[p.id].casket);assert.equal(sim.evolves,1);assert.equal(p.casketQ.length,0);
});

test('ranked full page cycles retain the same bounded recorded prefix, pending state and branch choice',()=>{
 for(const passives of [{air:1,water:1,earth:1},{air:1,water:1,earth:1,fire:1,void:1}]){
  const {sim,p}=scene(passives),rec=new RunRecorder();rec.pick('prior');assert(rankedChoice(sim,rec,0));const prefix=JSON.stringify(rec.log()),state=JSON.stringify(sim),pages=Math.ceil(Object.keys(passives).length/2);
  for(let cycle=0;cycle<1500;cycle++){for(let page=0;page<pages;page++){const nav=sim.pending.p1.choices.findIndex(c=>c.kind==='spell-page');assert(rankedChoice(sim,rec,nav));assert(rec.picks.length<=2+pages-1);}assert.equal(JSON.stringify(rec.log()),prefix);assert.equal(JSON.stringify(sim),state);}
  assert(rankedChoice(sim,rec,2));assert(rankedChoice(sim,rec,0));assert.equal(p.spellElement,'earth');assert.deepEqual(rec.picks,['prior',0,2,0]);
 }
});
