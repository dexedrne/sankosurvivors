import test from 'node:test';import assert from 'node:assert/strict';
import{rankedSim,RunRecorder,replay}from'../src/ranked.js';import{rankedStep,rankedChoice,resumeRanked}from'../src/ranked-play.js';import{spellEvolutions}from'../src/content.js';import{FOOD}from'../src/sim.js';import{botInput}from'../qa-kit/simlib.mjs';
test('earned ranked Blast paging resumes/replays at each prefix and continues identically',()=>{
 const params={seed:1,week:1,mapId:'apache',adv:'wizard',ground:null},sim=rankedSim(params),rec=new RunRecorder(),p=sim.players[0];
 while(!sim.over&&sim.tick<18000&&!sim.pending.p1?.spell){
  const pend=sim.pending.p1;
  if(pend){const branches=spellEvolutions(p,sim.pace),score=c=>c.kind==='evolve'?(c.id==='staff'?(branches.length>=3?1000:-100):400):c.kind==='weapon'?(c.id==='staff'?900:p.weapons[c.id]?200:100):c.kind==='passive'?(spellEvolutions({...p,weapons:{staff:6},passives:{...p.passives,[c.id]:1}},2).length>branches.length?800:['air','water','earth','fire','void','growth','area'].includes(c.id)?300:-50):p.hp<p.maxHp*.5?700:0;const index=pend.choices.reduce((best,c,i)=>score(c)>score(pend.choices[best])?i:best,0);assert(rankedChoice(sim,rec,pend.casket?pend.rec:index));}
  else{const input=botInput(sim,p,sim.map,false);let use=p.belt.findIndex(k=>FOOD[k]&&p.hp<p.maxHp*.7);if(use<0)use=p.belt.findIndex(k=>k==='beer'&&!(p.buffs.speed>0));if(use<0)use=p.rollCd===0&&sim.enemies.some(e=>Math.hypot(e.x-p.x,e.z-p.z)<6)?4:null;rankedStep(sim,rec,input.mx,input.mz,use);}
  sim.fx.length=0;
 }
 assert(sim.pending.p1?.spell,'ordinary inputs must earn the selector;no XP/gear/health injection');
 const prefix=()=>{const log=JSON.parse(JSON.stringify(rec.log())),restored=resumeRanked(log,params),out=replay(log,params,{allowPartial:true});assert(!out.error,out.error);assert.equal(out.picksUsed,log.picks.length);assert.deepEqual(restored.sim.players,sim.players);assert.deepEqual(restored.sim.pending,sim.pending);assert.deepEqual(restored.rec.log(),log);return{log,restored};};
 const picksBeforePaging=rec.picks.length,stateBeforePaging=JSON.stringify(sim);
 for(let i=0;i<4500;i++)assert(rankedChoice(sim,rec,sim.pending.p1.choices.findIndex(c=>c.kind==='spell-page')));
 assert.equal(rec.picks.length,picksBeforePaging);assert.equal(JSON.stringify(sim),stateBeforePaging);
 const opened=prefix().log;for(const action of[3,'spell:fire']){const bad=structuredClone(opened);bad.picks.push(action);assert.equal(replay(bad,params,{allowPartial:true}).error,'bad choice');}
 assert(rankedChoice(sim,rec,sim.pending.p1.choices.findIndex(c=>c.kind==='spell-page')));prefix();assert(rankedChoice(sim,rec,sim.pending.p1.choices.findIndex(c=>c.kind==='evolve')));const{restored}=prefix();assert.equal(p.spellElement,'earth');let cast=false;
 const state=s=>({players:s.players,pending:s.pending,enemies:s.enemies,proj:s.proj,eproj:s.eproj,kills:s.kills,xp:s.xp,level:s.level,tick:s.tick});
 for(let frame=0;frame<120&&!sim.over;frame++){
  if(sim.pending.p1){const index=sim.pending.p1.casket?sim.pending.p1.rec:0;assert(rankedChoice(sim,rec,index));assert(rankedChoice(restored.sim,restored.rec,index));}
  else{const input=botInput(sim,p,sim.map,false);rankedStep(sim,rec,input.mx,input.mz,null);rankedStep(restored.sim,restored.rec,input.mx,input.mz,null);}
  cast ||= sim.proj.some(pr=>pr.art==='bolt'&&pr.element==='earth');assert.deepEqual(state(restored.sim),state(sim));sim.fx.length=restored.sim.fx.length=0;
 }
 assert(JSON.stringify(restored.rec.log())===JSON.stringify(rec.log()),'recorded wire logs diverged after continuation');
 assert(cast,'earned Earth Blast must reach real projectile state after continuation');
});
