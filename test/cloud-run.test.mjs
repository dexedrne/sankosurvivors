import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createCloud } from '../src/cloud.js';
import * as W from '../src/wallet.js';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const cloudBlock=main.slice(main.indexOf('let cloudConnecting ='),main.indexOf('onSaved = (k)'));
const pull=main.slice(main.indexOf('const cloudPull ='),main.indexOf("document.addEventListener('visibilitychange'",main.indexOf('const cloudPull =')));
const start=main.slice(main.indexOf('async function startRun('),main.indexOf('let bannerT ='));
const action=main.slice(main.indexOf('async function rankedAction('),main.indexOf('// the wallet the entry'));
const rankedStart=main.slice(main.indexOf('async function startRankedEntry('),main.indexOf('async function submitRanked()'));
const menu=main.slice(main.indexOf('function toMenu()'),main.indexOf('// ---- input ---'));
const A='0x'+'1'.repeat(40),deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
const reply=(value,status=200)=>new Response(JSON.stringify(value),{status});
async function setup(t,{pause='login',established=false,holdStart=true,failStart=false}={}){
  const previous=globalThis.localStorage,previousWindow=globalThis.window,store=new Map(established?[['sq-coins','500'],['sq-cloud',JSON.stringify({a:A,key:'fixture-key',rev:1})],['sq-cloud-base',JSON.stringify({'sq-coins':'500'})]]:[]);
  globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};globalThis.window={};
  t.mock.timers.enable({apis:['setTimeout']});
  const gates=Object.fromEntries(['nonce','signature','login','pull','map','gear','choice'].map(k=>[k,{hit:deferred(),gate:deferred()}])),calls=[],pending=[];
  let reloads=0;
  const stage=async name=>{gates[name].hit.resolve();if(pause===name||holdStart&&['map','gear'].includes(name))await gates[name].gate.promise;};
  const w={p:{on(){},request:async({method})=>{if(method==='personal_sign'){await stage('signature');return'fixture-signature';}if(method==='wallet_revokePermissions')return null;return[A];}}};
  await W.connect(w);
  t.mock.method(globalThis,'fetch',async(url,options={})=>{
    const route=url.split('/').pop();calls.push(route);
    if(route==='save-nonce'){await stage('nonce');return reply({nonce:'fixture-nonce',message:'fixture sign-in'});}
    if(route==='save-login'){await stage('login');return reply({address:A,key:'login-fixture-key',rev:1,data:{'sq-coins':'100'}});}
    if(route==='save-get'){await stage('pull');return reply({rev:2,data:{'sq-coins':'700'}});}
    if(route==='save-put'){const body=JSON.parse(options.body);return reply({ok:true,rev:body.rev+1});}
    if(route==='run')return reply({ticket:'fixture-ticket'});
    throw Error('unexpected fixture route '+route);
  });
  const nodes=new Map(),$=id=>{
    if(!nodes.has(id)){const classes=new Set(['hidden']);nodes.set(id,{value:id==='rankedadv'?'adventurer':id==='rankedname'?'Fixture':'',textContent:'',disabled:false,focus(){if(id==='cloudusewal')gates.choice.hit.resolve();},querySelectorAll:()=>[],replaceChildren(){},classList:{contains:c=>classes.has(c),add:c=>classes.add(c),remove:c=>classes.delete(c),toggle:(c,on)=>on?classes.add(c):classes.delete(c)}});}return nodes.get(id);
  };
  const app=Function('createCloud','walletNow','walletRevision','onWallet','$','location','gearStage','mapStage','failStart',`
    let mode='title',sim=null,rankedRun=null,rankedRec=null,rankedBusy=false,storedLive=null,runTicket=null,mapLoading=false,loadedMapId='greentown',selMap='greentown',selAdv='adventurer',acc=0,selCard=0,shownPending=false,waitingForMove=false,rewardWasShown=false,pendingUse=null,slowmo=0,runBest=null,passedBest=false,chase=null;
    const BASE='./',PLAYER='p',SIM_ID='fixture-sim',params=new URLSearchParams(),keys=new Set(),slotCache={},WEAPONS={},PASSIVES={};
    const map={id:'greentown',name:'Greentown',length:900,finalBoss:'dragon',music:'fixture'},MAP_BY_ID={greentown:map};
    const hardOn=false,endlessOn=false,rankedWeek={map:'greentown'},rankedLive=()=>storedLive,rankedPlaying=()=>!!rankedRun&&!!sim&&!sim.over;
    const renderer={async preloadGear(){await gearStage();if(failStart)throw Error('fixture gear failure');},reset(){},setZoom(){},setShift(){},setYaw(){},setAura(){}};
    const pickMap=async id=>{await mapStage();loadedMapId=id;},audio={init:async()=>{},music(){}};
    const getGear=()=>({}),getGearLv=()=>({}),getSkills=()=>({}),getBests=()=>({}),runGround=()=>null,runAdv=()=>({id:'adventurer',weapon:'Sword'}),bestKey=()=>'';
    const makeSim=()=>({map,players:[{}],pending:{},over:null,t:0}),createSim=makeSim,resumeRankedAsync=async()=>({sim:makeSim(),rec:{log:()=>({runs:[]})}});
    const banner=()=>{},preloadIcons=()=>{},weaponItem=()=>'',passiveItem=()=>'',clearTouch=()=>{},showLevelUp=()=>{},persistRanked=()=>{},fmtT=s=>String(s),slayName=()=> 'Dragon',kpmWeek=()=>false,liveRace=live=>live;
    const renderWallet=()=>{},renderRanked=()=>{},rankedMessage=()=>{},openRanked=()=>{},why=e=>e.message,plain=s=>Error(s),applyDmt=()=>{},buildAdventurers=()=>{},buildMaps=()=>{},showBest=()=>{},submitRanked=async()=>{};
    const readRanked=(key,fallback=null)=>key==='sq-ranked-live'?storedLive:fallback,writeRanked=(key,value)=>{if(key==='sq-ranked-live')storedLive=value;};
    const rankedApi=async()=>({run:'fixture-run',seed:1,map:'greentown',week:0,mode:'normal'}),RunRecorder=class{log(){return{runs:[]};}};
    ${cloudBlock}
    ${pull}
    ${action}
    ${rankedStart}
    ${start}
    ${menu}
    return{cloud,startRun,rankedAction,startRankedEntry,recoverRankedRun,toMenu,pull:cloudPull,mode:v=>mode=v,state:()=>({mode,rankedBusy,sim}),setLive:v=>storedLive=v};
  `)(createCloud,W.current,W.walletRevision,W.onWallet,$,{reload(){reloads++;}},()=>stage('gear'),()=>stage('map'),failStart);
  const track=p=>{pending.push(p);p.catch(()=>{});return p;};
  t.after(async()=>{for(const x of Object.values(gates))x.gate.resolve();t.mock.timers.tick(1000);await Promise.allSettled(pending);W.disconnect();globalThis.localStorage=previous;globalThis.window=previousWindow;});
  return{app,store,gates,calls,$,reloads:()=>reloads,sign:()=>track(app.cloud.signIn(W.current())),pull:()=>track(app.pull()),
    start:kind=>track(kind==='ranked setup'?app.startRankedEntry({entry:'fixture-entry',id:1}):kind==='ranked resume'?app.recoverRankedRun():app.startRun()),
    finish(){gates.map.gate.resolve();gates.gear.gate.resolve();},flush:async()=>{for(let i=0;i<12;i++)await Promise.resolve();},track};
}
for(const kind of ['casual','ranked setup','ranked resume'])for(const pause of ['signature','login'])test(`late ${pause} cannot load progress during ${kind}`,async t=>{
  const f=await setup(t,{pause}),signing=f.sign();await f.gates[pause].hit.promise;
  if(kind==='ranked resume')f.app.setLive({run:'saved-fixture',sim:'fixture-sim',map:'greentown',adv:'adventurer',log:{runs:[]}});
  const starting=f.start(kind);await f.flush();f.gates[pause].gate.resolve();
  const result=await signing.then(value=>({value}),error=>({error}));f.finish();await starting;t.mock.timers.tick(1000);
  assert.match(result.error?.message||'',/run|cancelled|changed/i);assert.equal(f.store.has('sq-coins'),false);assert.equal(f.app.cloud.state(),null);assert.equal(f.reloads(),0);
});
for(const mode of ['play','pause','levelup','casket'])test(`a new cloud sign-in cannot load progress in ${mode}`,async t=>{
  const f=await setup(t,{pause:null,holdStart:false});f.app.mode(mode);
  await assert.rejects(f.sign(),/run|cancelled|changed/i);assert.equal(f.calls.filter(c=>c.startsWith('save-')).length,0);assert.equal(f.store.has('sq-coins'),false);
});
test('an automatic pull response cannot change progress during casual preload',async t=>{
  const f=await setup(t,{pause:'pull',established:true}),pulling=f.pull();await f.gates.pull.hit.promise;
  const starting=f.start();await f.gates.gear.hit.promise;f.gates.pull.gate.resolve();await pulling;f.finish();await starting;t.mock.timers.tick(1000);
  assert.equal(f.store.get('sq-coins'),'500');assert.equal(f.app.cloud.state().rev,1);assert.equal(f.reloads(),0);
});
for(const pending of ['sign-in','pull'])test(`run start permanently cancels an old ${pending} even after return to title`,async t=>{
  const f=await setup(t,{pause:pending==='pull'?'pull':'login',established:pending==='pull'}),operation=pending==='pull'?f.pull():f.sign();
  await f.gates[pending==='pull'?'pull':'login'].hit.promise;const starting=f.start();f.finish();await starting;f.app.toMenu();
  f.gates[pending==='pull'?'pull':'login'].gate.resolve();const result=await operation.then(value=>({value}),error=>({error}));t.mock.timers.tick(1000);
  if(pending==='sign-in')assert.match(result.error?.message||'',/run|cancelled|changed/i);
  assert.equal(f.store.get('sq-coins'),pending==='pull'?'500':undefined);assert.equal(f.reloads(),0);
});
for(const source of ['sign-in','pull'])test(`a queued ${source} reload cannot interrupt a new run`,async t=>{
  const f=await setup(t,{pause:null,established:source==='pull'});
  if(source==='sign-in')assert.equal(await f.sign(),'loaded');else await f.pull();
  const starting=f.start();f.finish();await starting;t.mock.timers.tick(1000);
  assert.equal(f.app.state().mode,'play');assert.equal(f.reloads(),0);
});
test('normal title sign-in still loads progress and reloads once',async t=>{
  const f=await setup(t,{pause:null,holdStart:false});assert.equal(await f.sign(),'loaded');t.mock.timers.tick(600);assert.equal(f.store.get('sq-coins'),'100');assert.equal(f.reloads(),1);
});
test('normal title pull still loads progress and reloads once',async t=>{
  const f=await setup(t,{pause:null,established:true,holdStart:false});await f.pull();t.mock.timers.tick(600);assert.equal(f.store.get('sq-coins'),'700');assert.equal(f.reloads(),1);
});
test('run cancellation preserves established cloud consent and progress uploads',async t=>{
  const f=await setup(t,{pause:null,established:true}),starting=f.start();f.finish();await starting;f.store.set('sq-coins','650');
  assert.equal(await f.app.cloud.push(true),true);assert.equal(f.app.cloud.state().a,A);assert.equal(f.store.get('sq-coins'),'650');assert.equal(f.app.cloud.state().rev,2);
});
test('failed run preload does not permanently block a fresh title sign-in',async t=>{
  const f=await setup(t,{pause:null,holdStart:false,failStart:true});await assert.rejects(f.start(),/fixture gear failure/);
  assert.equal(await f.sign(),'loaded');assert.equal(f.store.get('sq-coins'),'100');
});
test('run start cancels an open progress choice without selecting either save',async t=>{
  const f=await setup(t,{pause:null});f.store.set('sq-coins','500');const signing=f.sign();await f.gates.choice.hit.promise;
  const old=f.$('cloudusewal').onclick,starting=f.start(),closed=f.$('cloudpick').classList.contains('hidden');
  if(!closed)old();const result=await signing.then(value=>({value}),error=>({error}));f.finish();await starting;t.mock.timers.tick(1000);
  assert.equal(closed,true);assert.match(result.error?.message||'',/run|cancelled|changed/i);assert.equal(f.store.get('sq-coins'),'500');assert.equal(f.app.cloud.state(),null);assert.equal(f.reloads(),0);
});
test('saved ranked recovery prevents new cloud adoption and pull while still on title',async t=>{
  const f=await setup(t,{pause:null,established:true,holdStart:false});f.app.setLive({run:'fixture-saved'});
  await assert.rejects(f.sign(),/run|cancelled|changed/i);await f.pull();assert.equal(f.calls.filter(c=>c.startsWith('save-')).length,0);assert.equal(f.store.get('sq-coins'),'500');
});
test('ranked work blocks new cloud loads before a sim exists and releases the guard on failure',async t=>{
  const f=await setup(t,{pause:null,holdStart:false}),gate=deferred(),action=f.track(f.app.rankedAction(async()=>{await gate.promise;throw Error('fixture ranked failure');}));
  const result=await f.sign().then(value=>({value}),error=>({error}));gate.resolve();await action;
  assert.match(result.error?.message||'',/run|cancelled|changed/i);assert.equal(await f.sign(),'loaded');
});
