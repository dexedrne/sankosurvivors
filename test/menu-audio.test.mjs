import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function titleCode(){const a=main.indexOf('function playTitleMusic()'),b=main.indexOf('function unlockAudio(',a);assert.ok(a>=0&&b>a,'title music lifecycle exists');return main.slice(a,b);}
test('title selects its map music and clears ducking, while live play is left alone',()=>{
 const calls=[],audio={duck:v=>calls.push(['duck',v]),music:v=>calls.push(['music',v])};
 const invoke=Function('mode','audio',`const selMap='apache',MAP_BY_ID={apache:{music:'mid'}};${titleCode()};playTitleMusic();`);
 invoke('title',audio);assert.deepEqual(calls,[['duck',false],['music','mid']]);calls.length=0;invoke('play',audio);assert.deepEqual(calls,[]);
});
test('trusted click, touchend and keydown unlock in capture phase; synthetic events do not',async()=>{
 const a=main.indexOf('function unlockAudio('),b=main.indexOf('// ---- version, leaderboard',a);assert.ok(a>=0&&b>a,'gesture activation exists');
 const events=[];let starts=0;const unlock=Function('audio','addEventListener','renderer','playTitleMusic',`${main.slice(a,b)};return unlockAudio;`)({init(){starts++;return Promise.resolve();}},(...args)=>events.push(args),{},()=>{});
 assert.deepEqual(events.map(e=>[e[0],e[2]]),[['click',true],['touchend',true],['keydown',true]]);
 unlock({isTrusted:false});assert.equal(starts,0);unlock({isTrusted:true});assert.equal(starts,1);await flush();
});
test('the first trusted gesture selects music and unlocks before the renderer finishes loading',()=>{
 const a=main.indexOf('function unlockAudio('),b=main.indexOf('// ---- version, leaderboard',a),calls=[];
 const unlock=Function('audio','addEventListener','renderer','playTitleMusic',`${main.slice(a,b)};return unlockAudio;`)({init(){calls.push('init');return Promise.resolve();}},()=>{},null,()=>calls.push('title'));
 unlock({isTrusted:false});assert.deepEqual(calls,[]);
 unlock({isTrusted:true});assert.deepEqual(calls,['title','init']);
});
test('actual return-to-menu lifecycle selects the title song after a run',()=>{
 const calls=[],a=main.indexOf('function toMenu()'),b=main.indexOf('// ---- input',a);
 const run=Function('audio',`let coop=null,PLAYER='p1',rankedRun=null,rankedRec=null,sim={},mode='end',waitingForMove=false,rewardWasShown=false;const selMap='greentown',MAP_BY_ID={greentown:{music:'early'}},window={},rankedPlaying=()=>false,resetQuitConfirm=()=>{},applyDmt=()=>{},renderer={reset(){},setZoom(){},setShift(){}},$=()=>({classList:{add(){},remove(){}}}),buildAdventurers=()=>{},buildMaps=()=>{},updateModePicker=()=>{},showBest=()=>{},refreshPendingTitleProgress=()=>{};${titleCode()}${main.slice(a,b)};toMenu();return{mode,sim};`);
 assert.deepEqual(run({duck:v=>calls.push(['duck',v]),music:v=>calls.push(['music',v])}),{mode:'title',sim:null});assert.deepEqual(calls,[['duck',false],['music','early']]);
});
function sliders(){
 let resolve,starts=0,plays=0,hidden=false,now=1000;const ready=new Promise(r=>resolve=r),ranges={s:{dataset:{vol:'s'},value:'75',nextElementSibling:{},isConnected:true},m:{dataset:{vol:'m'},value:'75',nextElementSibling:{},isConnected:true}};
 const volumes={s:75,m:75},audio={setVolume(k,v){volumes[k]=Number(v);},volume:k=>volumes[k],init(){starts++;return ready;},play(){plays++;}},body=main.match(/r\.oninput = \(\) => \{([\s\S]*?)\n    \};/)[1];
 const mount=Function('audio','performance','$',`let blip=0,soundPreview=0;return r=>()=>{${body}};`)(audio,{now:()=>now},()=>({classList:{contains:()=>hidden}}));
 const s=mount(ranges.s),m=mount(ranges.m);return{s,m,ranges,starts:()=>starts,plays:()=>plays,finish:async()=>{resolve();await flush();},hide(){hidden=true;},later(){now+=200;}};
}
test('cold Sound preview waits for readiness and then plays the requested feedback',async()=>{
 const f=sliders();f.s();assert.equal(f.starts(),1);assert.equal(f.plays(),0);await f.finish();assert.equal(f.plays(),1);
});
test('cold Music slider also unlocks audio',async()=>{
 const f=sliders();f.m();assert.equal(f.starts(),1);assert.equal(f.plays(),0);await f.finish();assert.equal(f.plays(),0);
});
for(const [name,change] of [['newer Music edit',f=>f.m()],['detached range',f=>f.ranges.s.isConnected=false],['closed Settings',f=>f.hide()]])test('pending Sound preview is cancelled by '+name,async()=>{
 const f=sliders();f.s();change(f);await f.finish();assert.equal(f.plays(),0);
});
for(const [name,activation,want]of[['a trusted preboot choice',{navigator:{userActivation:{hasBeenActive:true}}},['title','init']],['no prior activation',{navigator:{userActivation:{hasBeenActive:false}}},[]],['unsupported activation API',{navigator:{}},[]]])test('menu audio startup after '+name,()=>{
 const a=main.indexOf('function unlockAudio('),b=main.indexOf('// ---- version, leaderboard',a),calls=[];
 const unlock=Function('audio','addEventListener','playTitleMusic','globalThis',`${main.slice(a,b)};return unlockAudio;`)({init(){calls.push('init');return Promise.resolve();}},()=>{},()=>calls.push('title'),activation);
 assert.deepEqual(calls,want);unlock({isTrusted:false});assert.deepEqual(calls,want,'synthetic events cannot create an audio unlock');
});
