import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as content from '../src/content.js';
import {createSim,playerStats} from '../src/sim.js';
import {createCloud,betterRun,SAVE_KEYS} from '../src/cloud.js';
import {profileValue,profileBest,finiteNumber} from '../src/progress-values.js';
import {writeRanked} from '../src/ranked-client.js';
import {current} from '../src/wallet.js';
import * as continuation from '../src/casual-continuation.js';
import {prepareRunRewards} from '../src/run-rewards.js';
import {saveRunProgress,recoverRunProgress,recoverProgressImport} from '../src/progress-import.js';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8'),J=JSON.stringify;
const profile=main.slice(main.indexOf('const load = '),main.indexOf('// ---- icons:'));
const best=main.slice(main.indexOf('const bestKey = '),main.indexOf('function showBest()'));
const finish=main.slice(main.indexOf('function runCoins('),main.indexOf('function toMenu()'));
const persist=main.slice(main.indexOf('function persistRanked()'),main.indexOf('setInterval(() => { if (rankedPlaying())'));
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
function fixture(t,{cloudOn=true,ranked=false,coopPlay=false,outcome='win',responses=[],storageFault=null,continuePlay=false}={}){
 const previous=globalThis.localStorage,store=new Map(Object.entries({'sq-coins':'100','sq-bank':J(['Bronze Helmet']),'sq-stats':J({kills:299,'kills.goblin':299}),'sq-gear-reset1':'1'})),calls=[],notes=[],nodes=new Map();let submissions=0;
 if(cloudOn){store.set('sq-cloud',J({a:'0x'+'1'.repeat(40),key:'fixture-session',rev:1}));store.set('sq-cloud-base',J(Object.fromEntries(SAVE_KEYS.filter(k=>store.has(k)).map(k=>[k,store.get(k)]))));}
 let armed=false;const denied=(action,k)=>armed&&storageFault?.(action,k);
 globalThis.localStorage={getItem:k=>{if(denied('read',k))throw Error('fixture read denied');return store.get(k)??null;},setItem:(k,v)=>{if(denied('write',k))throw Error('fixture quota');store.set(k,String(v));},removeItem:k=>{if(denied('remove',k))throw Error('fixture cleanup denied');store.delete(k);}};
 t.mock.timers.enable({apis:['setTimeout']});t.after(()=>{globalThis.localStorage=previous;});
 t.mock.method(globalThis,'fetch',async(url,options={})=>{
  assert.equal(url,'api/save-put','only a consented save upload is allowed');const body=JSON.parse(options.body);calls.push(body);
  const next=responses.shift();if(next instanceof Error)throw next;
  return typeof next==='function'?await next(body):new Response(J(next||{ok:true,rev:body.rev+1}));
 });
 const $=id=>{if(!nodes.has(id)){const classes=new Set(['hidden']);nodes.set(id,{textContent:'',innerHTML:'',disabled:false,focus(){},classList:{contains:c=>classes.has(c),add:c=>classes.add(c),remove:c=>classes.delete(c),toggle:(c,on)=>on?classes.add(c):classes.delete(c)}});}return nodes.get(id);};
 const sim=createSim({seed:7,map:content.MAP_BY_ID.greentown,...(coopPlay?{coop:true,players:[{id:'p1'},{id:'p2'}]}:{})});Object.assign(sim,{over:outcome,t:600,kills:6,bossKills:0,evolves:0,loot:['Bronze Helmet','Iron Helmet'],alched:[],killsByType:{goblin:6}});Object.assign(sim.players[0],{coins:2,alch:7});if(coopPlay)Object.assign(sim.players[1],{kills:3,killsByType:{goblin:3},loot:['Iron Helmet'],alched:[],coins:4,alch:9});
 const app=Function('content','sim','$','createCloud','betterRun','profileValue','profileBest','finiteNumber','playerStats','writeRanked','SAVE_KEYS','note','submit','prepareRunRewards','saveRunProgress','recoverRunProgress','recoverProgressImport','continuation',`
  const {MAPS,MAP_BY_ID,ADVENTURER_BY_ID,GEAR,GEAR_SLOTS,GEAR_MAX_LV,clampSkills,ADVENTURERS,QUESTS,WEAPONS,isWeaponItem}=content,params=new URLSearchParams();
  ${profile}
  ${best}
  const PLAYER='${coopPlay?'p2':'p1'}',coopResult=${coopPlay?"'complete'":'null'},coop=${coopPlay?'{}':'null'},coopLoading=false;let runStarting=false,mode='play',waitingForMove=false,rewardWasShown=false,lastRun=null;
  let rankedRun=${ranked?"{week:0,mode:'normal',run:'fixture-run'}":'null'},rankedRec=${ranked?"{log:()=>({runs:[]})}":'null'};
  const {canContinueCasual,captureRewardBaseline,continueCasual,phaseCoins,phaseAlch}=continuation;
  let casualRun=${continuePlay?"{sim,normalCommitted:false,baseline:null,endlessTicket:'child',phase:'playing'}":'null'};
  const LATEST='fixture-version',savedPass=()=>null,DMT_COIN_BONUS=.25;let runTicket='fixture-ticket';
  const keys=new Set(),clearTouch=()=>{},audio={duck(){}},showLevelUp=()=>{},resumeAfterReward=()=>{};let pendingUse=null,slowmo=0,acc=0,shownPending=false,runBest=null,passedBest=false;
  const fmtT=t=>String(t),imgTag=()=>'',buildMaps=()=>{},buildAdventurers=()=>{},showBest=()=>{},stepOf=()=>null,iconHTML=()=>'',weaponDisplay=()=>({name:'Sword'});
  const alchValue=()=>0,submitScore=async()=>({ok:true}),liveRace=s=>s,kpmWeek=()=>false,submitRanked=submit,banner=note;
  const walletModalOpen=()=>walletOpen,cancelPendingLoads=()=>{},location={reload(){throw Error('in-memory run must not reload');}};
  const navigator={},buyBusy=null,walletConnecting=null,holderChecking=null,walletRequests=0;let rankedBusy=false,walletOpen=false;
  ${main.slice(main.indexOf('function withImportLock('),main.indexOf("$('xferload').onclick"))}
  ${persist}
  const cloud=createCloud('',{canSave:()=>mode!=='recovery',note,merged:()=>{}});
  onSaved=k=>{if(SAVE_KEYS.includes(k))cloud.changed();};
  ${finish}
  ${main.slice(main.indexOf('async function startRun('),main.indexOf('let bannerT ='))}
  return{startRun,endRun,continueAfterScore,cloud,save,setBusy(v){rankedBusy=v;},lock(fn){navigator.locks={request:fn};},wallet(v){walletOpen=v;},forgetRanked(){rankedRun=rankedRec=null;},state:()=>({mode,lastRun,casualRun}),mode:v=>mode=v};
 `)(content,sim,$,createCloud,betterRun,profileValue,profileBest,finiteNumber,playerStats,writeRanked,SAVE_KEYS,text=>notes.push(text),()=>submissions++,prepareRunRewards,saveRunProgress,recoverRunProgress,recoverProgressImport,continuation);
 return{app,store,sim,$,calls,notes,submissions:()=>submissions,flush,arm:()=>armed=true,restore:()=>armed=false,end:()=>app.endRun()};
}
for(const key of ['sq-coins','sq-bank','sq-stats','sq-quests'])test(`failed completed-run ${key} write cannot silently upload partial rewards`,async t=>{
 const f=fixture(t,{storageFault:(action,k)=>action==='write'&&k===key});f.arm();f.end();await f.flush();assert.equal(f.app.state().mode,'recovery');assert.equal(f.calls.length,0,'partial rewards must never upload');assert.equal(f.$('progressrecovery').classList.contains('hidden'),false);
});
test('unreadable saved coins cannot become a zero-baseline reward overwrite',async t=>{
 const f=fixture(t,{storageFault:(action,k)=>action==='read'&&k==='sq-coins'});f.arm();f.end();await f.flush();assert.equal(f.app.state().mode,'recovery');assert.equal(f.store.get('sq-coins'),'100');assert.equal(f.calls.length,0);
});
test('failure clearing the completed-run journal retains a blocked recoverable finish',async t=>{
 const f=fixture(t,{storageFault:(action,k)=>action==='remove'&&k==='sq-run-save-v1'});f.arm();f.end();await f.flush();assert.equal(f.app.state().mode,'recovery');assert.equal(f.calls.length,0);assert.ok(f.store.has('sq-run-save-v1'));
});
for(const key of ['sq-coins','sq-bank','sq-stats','sq-quests','sq-run-save-v1'])test(`retry completed-run ${key} failure saves exactly once then uploads complete progress`,async t=>{
 const f=fixture(t,{storageFault:(action,k)=>(key==='sq-run-save-v1'?action==='remove':action==='write')&&k===key});f.arm();f.end();await f.flush();assert.equal(f.app.state().mode,'recovery');assert.equal(f.$('progressretry').textContent,'Retry saving run');assert.match(f.$('progressrecoverytext').textContent,/Keep this page open/);f.restore();await f.$('progressretry').onclick();await f.flush();assert.equal(f.app.state().mode,'end');assert.equal(f.$('progressrecovery').classList.contains('hidden'),true);assert.equal(f.store.get('sq-coins'),'609');assert.equal(JSON.parse(f.store.get('sq-stats')).kills,305);assert.deepEqual(JSON.parse(f.store.get('sq-quests')),['goblins','survivor','achievement-first-clear']);assert.equal(f.calls.length,1);assert.equal(f.calls[0].data['sq-coins'],'609');assert.equal(f.store.has('sq-run-save-v1'),false);
});
test('ranked submission proceeds once while local rewards wait; retry keeps ranked context after acknowledgement',async t=>{
 const f=fixture(t,{ranked:true,storageFault:(action,k)=>action==='write'&&k==='sq-coins'});f.arm();f.end();await f.flush();assert.equal(f.app.state().mode,'recovery');assert.equal(f.submissions(),1);assert.equal(JSON.parse(f.store.get('sq-ranked-live')).ended,true);f.app.forgetRanked();f.restore();await f.$('progressretry').onclick();await f.flush();assert.equal(f.submissions(),1);assert.equal(f.app.state().lastRun.ranked,true);assert.equal(f.store.has('sq-bests'),false);assert.equal(f.calls.length,1);assert.equal(f.store.get('sq-coins'),'609');
});
test('failed completion checkpoint never submits a stale ranked log',async t=>{
 const f=fixture(t,{ranked:true,storageFault:(action,k)=>action==='write'&&k==='sq-ranked-live'});f.arm();f.end();await f.flush();assert.equal(f.submissions(),0);assert.equal(f.app.state().mode,'recovery');assert.equal(f.store.get('sq-coins'),'100');f.restore();await f.$('progressretry').onclick();await f.flush();assert.equal(f.submissions(),1);assert.equal(f.store.get('sq-coins'),'609');
});
// Returning only the old debounce would miss this immediate request and its complete reward snapshot.
for(const ranked of [false,true])test(`${ranked?'ranked':'casual'} win uploads final rewards immediately without awaiting the network`,async t=>{
 const f=fixture(t,{ranked});assert.equal(current(),null,'an established cloud session does not need an open wallet');assert.equal(f.end(),undefined);assert.equal(f.app.state().mode,'end');assert.equal(f.$('end').classList.contains('hidden'),false);assert.equal(f.store.get('sq-coins'),'609');await f.flush();
 assert.equal(f.calls.length,1,'POST begins without advancing the four-second debounce');const data=f.calls[0].data;assert.equal(data['sq-coins'],'609');assert.deepEqual(JSON.parse(data['sq-bank']),['Bronze Helmet','Iron Helmet','Bowler Hat','Cape']);assert.deepEqual(JSON.parse(data['sq-quests']),['goblins','survivor','achievement-first-clear']);assert.deepEqual(JSON.parse(data['sq-cleared']),['greentown']);assert.equal(JSON.parse(data['sq-stats']).kills,305);assert.equal(JSON.parse(data['sq-stats']).caskets,2);assert.deepEqual(JSON.parse(data['sq-best']),{t:600,level:1,kills:6,won:true});
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

test('in-memory local reward retry does not wait for an unrelated ranked server check',async t=>{
 const f=fixture(t,{ranked:true,storageFault:(action,k)=>action==='write'&&k==='sq-coins'});f.arm();f.end();f.app.setBusy(true);f.restore();await f.$('progressretry').onclick();await f.flush();assert.equal(f.app.state().mode,'end');assert.equal(f.store.get('sq-coins'),'609');assert.equal(f.submissions(),1);
});
test('run reward recovery waits for an open wallet action and retries after it closes',async t=>{
 const f=fixture(t,{storageFault:(action,k)=>action==='write'&&k==='sq-coins'});f.arm();f.end();f.restore();f.app.wallet(true);await f.$('progressretry').onclick();assert.equal(f.app.state().mode,'recovery');assert.equal(f.store.get('sq-coins'),'100');assert.match(f.$('progressrecoverystatus').textContent,/wallet action/);f.app.wallet(false);await f.$('progressretry').onclick();await f.flush();assert.equal(f.app.state().mode,'end');assert.equal(f.store.get('sq-coins'),'609');
});

test('native progress-lock retry rechecks wallet admission and ignores a second click while queued',async t=>{
 const f=fixture(t,{storageFault:(action,k)=>action==='write'&&k==='sq-coins'});f.arm();f.end();f.restore();let grant,calls=0;f.app.lock((name,fn)=>{assert.equal(name,'sqs-progress-import');calls++;return new Promise(resolve=>grant=()=>resolve(fn()));});const retry=f.$('progressretry').onclick();assert.equal(f.$('progressretry').disabled,true);await f.$('progressretry').onclick();assert.equal(calls,1);f.app.wallet(true);grant();await retry;assert.equal(f.app.state().mode,'recovery');assert.equal(f.store.get('sq-coins'),'100');assert.equal(f.$('progressretry').disabled,false);f.app.wallet(false);f.app.lock((name,fn)=>fn());await f.$('progressretry').onclick();await f.flush();assert.equal(f.store.get('sq-coins'),'609');assert.equal(f.app.state().mode,'end');
});

test('actual Start refuses a new run while interrupted completed rewards are in recovery',async t=>{
 const f=fixture(t,{storageFault:(action,k)=>action==='write'&&k==='sq-coins'});f.arm();f.end();const s=f.sim;await f.app.startRun();assert.equal(f.app.state().mode,'recovery');assert.equal(f.sim,s);assert.equal(f.store.get('sq-coins'),'100');assert.equal(f.calls.length,0);
});
test('actual guest end saves only its reward receipt, leaves both solo bests and sends no solo score',async t=>{
 const f=fixture(t,{coopPlay:true,cloudOn:false});f.store.set('sq-best','{"t":55,"kills":1}');f.store.set('sq-bests','{"greentown:n:r":{"t":55,"kills":1}}');f.end();await f.flush();assert.equal(f.app.state().mode,'end');assert.equal(f.store.get('sq-coins'),'591');assert.equal(JSON.parse(f.store.get('sq-stats')).kills,302);assert.match(f.$('endloot').innerHTML,/Iron Helmet/);assert.doesNotMatch(f.$('endloot').innerHTML,/Bronze Helmet/);assert.equal(f.store.get('sq-best'),'{"t":55,"kills":1}');assert.equal(f.store.get('sq-bests'),'{"greentown:n:r":{"t":55,"kills":1}}');assert.equal(f.app.state().lastRun.sent,true);assert.equal(f.app.state().lastRun.ticket,null);assert(f.$('endlb').classList.contains('hidden'));assert.equal(f.calls.length,0);
});
test('actual guest end keeps its local ownership and absolute receipt through a denied save Retry',async t=>{
 const f=fixture(t,{coopPlay:true,cloudOn:false,storageFault:(action,k)=>action==='write'&&k==='sq-coins'});f.arm();f.end();assert.equal(f.app.state().mode,'recovery');f.restore();await f.$('progressretry').onclick();await f.flush();assert.equal(f.app.state().mode,'end');assert.equal(f.store.get('sq-coins'),'591');assert.equal(JSON.parse(f.store.get('sq-stats')).kills,302);assert.equal(f.store.has('sq-run-save-v1'),false);assert.equal(f.app.state().lastRun.coop,true);
});

test('actual normal finish and continued Endless finish bank only new progress through cloud/journal retries',async t=>{
 const f=fixture(t,{continuePlay:true,storageFault:(action,key)=>action==='remove'&&key==='sq-run-save-v1'});f.end();await f.flush();const initial=Number(f.store.get('sq-coins'));assert.equal(f.app.state().casualRun.normalCommitted,true);const s=f.sim,p=s.players[0];p.hp=17;
 await f.app.continueAfterScore();assert.equal(f.sim,s);assert.equal(p.hp,17);assert.equal(s.endless,true);s.over='dead';s.t=920;s.kills=12;s.killsByType.goblin=12;p.coins=3;
 f.arm();f.end();assert.equal(f.app.state().mode,'recovery');f.restore();await f.$('progressretry').onclick();await f.flush();
 assert.equal(f.app.state().mode,'end');assert.equal(Number(f.store.get('sq-coins'))-initial,6);assert.equal(JSON.parse(f.store.get('sq-stats')).kills,311);assert.equal(f.app.state().lastRun.ticket,'child');assert.equal(f.app.state().lastRun.t,920);assert.equal(f.app.state().lastRun.kills,12);
 const best=JSON.parse(f.store.get('sq-bests'));assert.equal(best['greentown:n:r'].t,600);assert.equal(best['greentown:n:e'].t,920);
});
