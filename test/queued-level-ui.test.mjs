import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSim,step,choose} from '../src/sim.js';

const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const block=source.slice(source.indexOf("} else if (mode === 'levelup') {"),source.indexOf("} else if (mode === 'casket') {",source.indexOf("} else if (mode === 'levelup') {")));
function frame(sim,accept=false) {
  return Function('sim','step','choose','accept',`
    let mode='levelup',shownPending=true,selCard=2,redraws=0,hidden=0;
    const PLAYER='p1',rankedRec=null,dt=1/30,edges={a:accept};
    const audio={duck(){}},$=()=>({classList:{add(){hidden++;}}}),markCard=()=>{};
    const showLevelUp=()=>{redraws++;selCard=0;};
    const pick=i=>{choose(sim,PLAYER,i);mode='play';shownPending=false;};
    if(false){${block}}
    return {mode,shownPending,selCard,redraws,hidden};
  `)(sim,step,choose,accept);
}
function queued() {
  const sim=createSim({seed:6,pace:2});
  sim.spawnAcc=-1e9;sim.bossIndex=99;sim.eventT=1e9;sim.shrineT=1e9;
  const p=sim.players[0];sim.gems.push({id:sim.nextId++,x:p.x,z:p.z,v:100});step(sim);
  return sim;
}
test('timeout redraws a queued upgrade and resets the highlighted card',()=>{
  const sim=queued(),before=sim.pending.p1;before.left=0;
  assert.deepEqual(frame(sim),{mode:'levelup',shownPending:true,selCard:0,redraws:1,hidden:0});
  assert.notEqual(sim.pending.p1,before);
});
test('last timeout exits the chooser; a manual pick leaves the next card for the play loop',()=>{
  const sim=queued();
  while(sim.players[0].levelQ>0)choose(sim,'p1',0);
  sim.pending.p1.left=0;
  assert.equal(frame(sim).mode,'play');
  const manual=queued(),before=manual.pending.p1;
  assert.equal(frame(manual,true).redraws,0);
  assert.notEqual(manual.pending.p1,before);
});
