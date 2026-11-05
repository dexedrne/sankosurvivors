import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as content from '../src/content.js';
import {createSim,playerStats} from '../src/sim.js';
import {createCloud,betterRun,SAVE_KEYS} from '../src/cloud.js';
import {profileValue,profileBest,finiteNumber} from '../src/progress-values.js';
import {writeRanked} from '../src/ranked-client.js';
import {current} from '../src/wallet.js';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8'),J=JSON.stringify;
const profile=main.slice(main.indexOf('const load = '),main.indexOf('// ---- icons:'));
const best=main.slice(main.indexOf('const bestKey = '),main.indexOf('function showBest()'));
const finish=main.slice(main.indexOf('function runCoins('),main.indexOf('function toMenu()'));
const persist=main.slice(main.indexOf('function persistRanked()'),main.indexOf('setInterval(() => { if (rankedPlaying())'));
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
function fixture(t,{cloudOn=true,ranked=false,outcome='win',responses=[]}={}){
 const previous=globalThis.localStorage,store=new Map(Object.entries({'sq-coins':'100','sq-bank':J(['Bronze Helmet']),'sq-stats':J({kills:299,'kills.goblin':299}),'sq-gear-reset1':'1'})),calls=[],notes=[],nodes=new Map();let submissions=0;
 if(cloudOn){store.set('sq-cloud',J({a:'0x'+'1'.repeat(40),key:'fixture-session',rev:1}));store.set('sq-cloud-base',J(Object.fromEntries(SAVE_KEYS.filter(k=>store.has(k)).map(k=>[k,store.get(k)]))));}
 globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
 t.mock.timers.enable({apis:['setTimeout']});t.after(()=>{globalThis.localStorage=previous;});
 t.mock.method(globalThis,'fetch',async(url,options={})=>{
  assert.equal(url,'api/save-put','only a consented save upload is allowed');const body=JSON.parse(options.body);calls.push(body);
  const next=responses.shift();if(next instanceof Error)throw next;
  return typeof next==='function'?await next(body):new Response(J(next||{ok:true,rev:body.rev+1}));
 });
 const $=id=>{if(!nodes.has(id)){const classes=new Set(['hidden']);nodes.set(id,{textContent:'',innerHTML:'',disabled:false,classList:{contains:c=>classes.has(c),add:c=>classes.add(c),remove:c=>classes.delete(c),toggle:(c,on)=>on?classes.add(c):classes.delete(c)}});}return nodes.get(id);};
 const sim=createSim({seed:7,map:content.MAP_BY_ID.greentown});Object.assign(sim,{over:outcome,t:600,kills:6,bossKills:0,evolves:0,loot:['Bronze Helmet','Iron Helmet'],alched:[],killsByType:{goblin:6}});Object.assign(sim.players[0],{coins:2,alch:7});
 const app=Function('content','sim','$','createCloud','betterRun','profileValue','profileBest','finiteNumber','playerStats','writeRanked','SAVE_KEYS','note','submit',`
  const {MAPS,MAP_BY_ID,ADVENTURER_BY_ID,GEAR,GEAR_SLOTS,GEAR_MAX_LV,clampSkills,ADVENTURERS,QUESTS,WEAPONS,isWeaponItem}=content,params=new URLSearchParams();
  ${profile}
  ${best}
  let mode='play',waitingForMove=false,rewardWasShown=false,lastRun=null;
  let rankedRun=${ranked?"{week:0,mode:'normal',run:'fixture-run'}":'null'},rankedRec=${ranked?"{log:()=>({runs:[]})}":'null'};
  const LATEST='fixture-version',runTicket='fixture-ticket',savedPass=()=>null,DMT_COIN_BONUS=.25;
  const fmtT=t=>String(t),imgTag=()=>'',buildMaps=()=>{},buildAdventurers=()=>{},showBest=()=>{},stepOf=()=>null,iconHTML=()=>'',weaponDisplay=()=>({name:'Sword'});
  const alchValue=()=>0,submitScore=()=>{},liveRace=s=>s,kpmWeek=()=>false,submitRanked=submit,banner=note;
  ${persist}
  const cloud=createCloud('',{canSave:()=>mode!=='recovery',note,merged:()=>{}});
  onSaved=k=>{if(SAVE_KEYS.includes(k))cloud.changed();};
  ${finish}
  return{endRun,cloud,save,state:()=>({mode,lastRun}),mode:v=>mode=v};
 `)(content,sim,$,createCloud,betterRun,profileValue,profileBest,finiteNumber,playerStats,writeRanked,SAVE_KEYS,text=>notes.push(text),()=>submissions++);
 return{app,store,sim,$,calls,notes,submissions:()=>submissions,flush,end:()=>app.endRun()};
}
// Returning only the old debounce would miss this immediate request and its complete reward snapshot.
for(const ranked of [false,true])test(`${ranked?'ranked':'casual'} win uploads final rewards immediately without awaiting the network`,async t=>{
 const f=fixture(t,{ranked});assert.equal(current(),null,'an established cloud session does not need an open wallet');assert.equal(f.end(),undefined);assert.equal(f.app.state().mode,'end');assert.equal(f.$('end').classList.contains('hidden'),false);assert.equal(f.store.get('sq-coins'),'609');await f.flush();
 assert.equal(f.calls.length,1,'POST begins without advancing the four-second debounce');const data=f.calls[0].data;assert.equal(data['sq-coins'],'609');assert.deepEqual(JSON.parse(data['sq-bank']),['Bronze Helmet','Iron Helmet','Bowler Hat','Cape']);assert.deepEqual(JSON.parse(data['sq-quests']),['goblins','survivor']);assert.deepEqual(JSON.parse(data['sq-cleared']),['greentown']);assert.equal(JSON.parse(data['sq-stats']).kills,305);assert.equal(JSON.parse(data['sq-stats']).caskets,2);assert.deepEqual(JSON.parse(data['sq-best']),{t:600,level:1,kills:6,won:true});
 if(ranked){assert.equal(f.submissions(),1);assert.equal(JSON.parse(f.store.get('sq-ranked-live')).ended,true);assert.equal(data['sq-bests'],undefined);}else assert.deepEqual(JSON.parse(data['sq-bests'])['greentown:n:r'],{t:600,level:1,kills:6,won:true});
 assert.equal(f.app.cloud.state().rev,2);assert.equal(f.store.has('sq-cloud-upload'),false);t.mock.timers.tick(4000);await f.flush();assert.equal(f.calls.length,1,'ordinary debounce does not POST an already acknowledged run twice');
});
test('a lost run also uploads its earned progress immediately',async t=>{
 const f=fixture(t,{outcome:'dead'});f.end();await f.flush();assert.equal(f.calls.length,1);assert.equal(f.calls[0].data['sq-coins'],'489');assert.equal(JSON.parse(f.calls[0].data['sq-best']).won,false);assert.equal(f.calls[0].data['sq-cleared'],undefined);
});
test('a completed run without cloud consent stays local and never requests a wallet signature',async t=>{
 const f=fixture(t,{cloudOn:false});f.end();await f.flush();t.mock.timers.tick(10000);await f.flush();assert.equal(f.calls.length,0);assert.equal(f.store.get('sq-coins'),'609');assert.equal(f.app.cloud.state(),null);assert.equal(f.store.has('sq-cloud-upload'),false);assert.equal(f.$('end').classList.contains('hidden'),false);
});
test('a failed immediate run upload keeps local rewards and retries the same save',async t=>{
 const f=fixture(t,{responses:[Error('fixture offline')]});f.end();await f.flush();assert.equal(f.calls.length,1);assert.equal(f.store.get('sq-coins'),'609');assert.equal(f.app.state().mode,'end');assert.equal(JSON.parse(f.store.get('sq-cloud-upload')).uncertain,true);
 t.mock.timers.tick(1500);await f.flush();assert.equal(f.calls.length,2);assert.deepEqual(f.calls[1].data,f.calls[0].data);assert.equal(f.app.cloud.state().rev,2);assert.equal(f.store.has('sq-cloud-upload'),false);assert.equal(f.store.get('sq-coins'),'609');
});
test('an in-flight earlier upload cannot acknowledge away the completed run',async t=>{
 let release;const f=fixture(t,{responses:[()=>new Promise(r=>release=r)]});f.store.set('sq-cloud-base',J({'sq-coins':'50'}));const old=f.app.cloud.push(true);await f.flush();assert.equal(f.calls.length,1);assert.equal(f.calls[0].data['sq-coins'],'100');f.end();await f.flush();assert.equal(f.calls.length,1);assert.equal(f.store.get('sq-coins'),'609');
 release(new Response(J({ok:true,rev:2})));await old;await f.flush();t.mock.timers.tick(1500);await f.flush();assert.equal(f.calls.length,2);assert.equal(f.calls[1].data['sq-coins'],'609');assert.equal(f.app.cloud.state().rev,3);assert.equal(f.store.has('sq-cloud-upload'),false);
});
test('a delayed run acknowledgement preserves newer local progress and play state',async t=>{
 let release;const f=fixture(t,{responses:[()=>new Promise(r=>release=r)]});f.end();await f.flush();assert.equal(f.calls.length,1);f.app.mode('play');f.app.save('sq-coins',650);release(new Response(J({ok:true,rev:2})));await f.flush();assert.equal(f.store.get('sq-coins'),'650');assert.equal(f.app.state().mode,'play');t.mock.timers.tick(1500);await f.flush();assert.equal(f.calls.length,2);assert.equal(f.calls[1].data['sq-coins'],'650');assert.equal(f.app.cloud.state().rev,3);
});
