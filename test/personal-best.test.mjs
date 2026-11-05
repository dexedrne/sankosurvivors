import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as cloud from '../src/cloud.js';
import { profileBest } from '../src/progress-values.js';
import {createSim} from '../src/sim.js';
import {prepareRunRewards} from '../src/run-rewards.js';
import {saveRunProgress} from '../src/progress-import.js';
const J=JSON.stringify;
const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const perMap=source.slice(source.indexOf('  let bestNote ='),source.indexOf("  $('endtext').textContent"));
const fmtT=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
function finish(prev,candidate){
  const values=new Map([['sq-best',J(prev)],['sq-bests',J({'greentown:n:r':prev})]]);
  const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
  const sim=createSim();Object.assign(sim,{t:candidate.t,kills:candidate.kills,level:candidate.level,over:candidate.won?'win':'dead'});
  const receipt=prepareRunRewards(storage,sim,{earned:0});saveRunProgress(storage,receipt.data);
  const note=Function('sim','receipt','fmtT',`const wasRanked=false;${perMap};return bestNote;`)(sim,receipt,fmtT);
  return{'sq-best':JSON.parse(values.get('sq-best')),'sq-bests':JSON.parse(values.get('sq-bests')),note};
}
test('local and per-map best retain a victory over a longer failed run',()=>{
  const win={t:600,kills:300,level:20,won:true};
  const actual=finish(win,{t:900.9,kills:600,level:30,won:false});
  assert.deepEqual(actual['sq-best'],win);
  assert.deepEqual(actual['sq-bests']['greentown:n:r'],win);
  assert.ok(!actual.note.includes('-'),'best feedback cannot show a negative time deficit');
});
test('local and per-map best use whole seconds then kills, preserving complete ties',()=>{
  const previous={t:600,kills:300,level:20,won:false};
  const tied=finish(previous,{t:600.9,kills:299,level:30,won:false});
  assert.deepEqual(tied['sq-best'],previous);
  assert.deepEqual(tied['sq-bests']['greentown:n:r'],previous);
  const upgraded=finish(previous,{t:600.9,kills:301,level:21,won:false});
  const expected={t:600,kills:301,level:21,won:false};
  assert.deepEqual(upgraded['sq-best'],expected);
  assert.deepEqual(upgraded['sq-bests']['greentown:n:r'],expected);
});
test('cloud keeps the greater kill count on a tied win and time',()=>{
  const a={t:600,kills:300,level:20,won:true},b={t:600,kills:301,level:21,won:true};
  for(const [mine,theirs] of [[a,b],[b,a]]) {
    const actual=cloud.mergeSaves(null,{'sq-best':J(mine)},{'sq-best':J(theirs)});
    assert.deepEqual(JSON.parse(actual['sq-best']),b);
  }
});
test('cloud joins each map and mode independently, preserving unique maps and stronger records',()=>{
  const weak={t:400,kills:200,won:false},strong={t:900,kills:500,won:true};
  const base={'sq-bests':J({'greentown:n:r':weak})};
  const mine={'sq-bests':J({'greentown:n:r':weak,'apache:n:r':strong})};
  const theirs={'sq-bests':J({'greentown:n:r':strong,'greentown:h:e':weak})};
  const result=JSON.parse(cloud.mergeSaves(base,mine,theirs)['sq-bests']);
  assert.deepEqual(result,{'greentown:n:r':strong,'apache:n:r':strong,'greentown:h:e':weak});
});
test('a one-sided weaker edit cannot downgrade the best known record',()=>{
  const win={t:600,kills:300,won:true},loss={t:900,kills:500,won:false};
  const base={'sq-best':J(win),'sq-bests':J({'greentown:n:r':win})};
  const weaker={'sq-best':J(loss),'sq-bests':J({'greentown:n:r':loss})};
  for(const [mine,theirs] of [[base,weaker],[weaker,base],[weaker,weaker]]) {
    const merged=cloud.mergeSaves(base,mine,theirs);
    assert.deepEqual(JSON.parse(merged['sq-best']),win);
    assert.deepEqual(JSON.parse(merged['sq-bests'])['greentown:n:r'],win);
  }
});
test('HUD does not announce a new best for a loss after a shorter victory',()=>{
  const start=source.indexOf('  if (runBest && !passedBest'),end=source.indexOf("  $('clockgoal').textContent",start);
  const code=source.slice(start,end);
  const shown=[];
  const runBest={t:600,kills:300,won:true},view={kills:600};
  Function('runBest','view','sim','banner','audio','betterRun','profileBest',`let passedBest=false;const t=900;${code}`)(runBest,view,{map:{name:'Greentown'},over:null},message=>shown.push(message),{play(){}},cloud.betterRun);
  assert.deepEqual(shown,[]);
});
test('routine cloud pull preserves stronger records even without unsaved local changes',async t=>{
  const win={t:600,kills:300,won:true},loss={t:900,kills:500,won:false};
  const local={'sq-coins':'100','sq-best':J(win),'sq-bests':J({'greentown:n:r':win})};
  const remote={'sq-coins':'200','sq-best':J(loss),'sq-bests':J({'greentown:n:r':loss,'apache:n:r':win})};
  const store=new Map(Object.entries({...local,'sq-cloud-base':J(local),'sq-cloud':J({a:'fixture',key:'fixture',rev:1})}));
  const previous=globalThis.localStorage;
  globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
  t.mock.method(globalThis,'fetch',async()=>new Response(J({rev:2,data:remote}),{status:200}));
  const client=cloud.createCloud('./',{note(){}});
  t.after(()=>{client.signOut();if(previous===undefined) delete globalThis.localStorage;else globalThis.localStorage=previous;});
  assert.equal(await client.pull(),true);
  assert.deepEqual(JSON.parse(store.get('sq-best')),win);
  assert.deepEqual(JSON.parse(store.get('sq-bests')),{'greentown:n:r':win,'apache:n:r':win});
  assert.equal(store.get('sq-coins'),'200','ordinary pull uses remote coins without adding them twice');
});
test('record comparison tolerates legacy missing kills and rejects malformed records',()=>{
  const legacy={t:600,won:false},valid={t:600,kills:1,won:false};
  assert.equal(cloud.betterRun(legacy,valid),valid);
  for(const invalid of [null,[],{}, {t:-1,won:true},{t:Infinity,won:true},{t:'bad',won:true}]) {
    assert.equal(cloud.betterRun(invalid,valid),valid);
    assert.equal(cloud.betterRun(valid,invalid),valid);
  }
  assert.equal(cloud.betterRun(null,{}),null);
});
test('personal-best kill ties use the same 999999 cap as casual scores',()=>{
  const previous={t:600,kills:999999,level:20,won:false};
  const tied=finish(previous,{t:600,kills:1000000,level:30,won:false});
  assert.deepEqual(tied['sq-best'],previous);
  assert.deepEqual(tied['sq-bests']['greentown:n:r'],previous);
});
test('personal records survive when only the last shared snapshot still has them',()=>{
  const win={t:600,kills:300,won:true};
  const base={'sq-best':J(win),'sq-bests':J({'greentown:n:r':win})};
  const merged=cloud.mergeSaves(base,{},{});
  assert.equal(merged['sq-best'],J(win));
  assert.deepEqual(JSON.parse(merged['sq-bests']),{'greentown:n:r':win});
});
