import test from 'node:test';
import assert from 'node:assert/strict';
import { petChoice } from '../src/pets.js';
import { createBunCompanions } from '../src/bun-companions.js';
import { readFileSync } from 'node:fs';
import { createCloud } from '../src/cloud.js';
import { cleanSettings } from '../src/settings.js';
import { profileValue, profileBest } from '../src/progress-values.js';
import * as W from '../src/wallet.js';
import { prove as proveHolder } from '../src/dmt.js';
import { importProgress as importProgressImpl, recoverProgressImport as recoverProgressImportImpl, recoverRunProgress as recoverRunProgressImpl } from '../src/progress-import.js';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const rankedNameInput=main.split('\n').find(s=>s.startsWith("$('rankedname').oninput ="));
const cloudBlock=main.slice(main.indexOf('let cloudConnecting ='),main.indexOf('onSaved = (k)'));
const pull=main.slice(main.indexOf('const cloudPull ='),main.indexOf("document.addEventListener('visibilitychange'",main.indexOf('const cloudPull =')));
const preferenceHelpers=main.slice(main.indexOf('function applySavedGraphics('),main.indexOf('async function boot()'));
const bootSource=main.slice(main.indexOf('async function boot('),main.indexOf('// ---- gear ---'));
const petInitSource=main.slice(main.indexOf('function syncPetPreview()'),main.indexOf("$('petsbtn').onclick"));
const currentPetSource=main.slice(main.indexOf('function currentPetChoice()'),main.indexOf('function buildPets()'));
const afterBoot=main.slice(main.indexOf('boot().then('),main.indexOf('// QA hooks'));
const choices=main.slice(main.indexOf('function savedChoice('),main.indexOf('let selMap ='));
const mapPicker=main.slice(main.indexOf('async function pickMap('),main.indexOf('async function selectVariant('));
const mapBuilder=main.slice(main.indexOf('function buildMaps('),main.indexOf('async function pickMap('));
const tickets=main.slice(main.indexOf('function loadCasualTickets('),main.indexOf('function runGround()'));
const start=main.slice(main.indexOf('async function startRun('),main.indexOf('let bannerT ='));
const action=main.slice(main.indexOf('async function rankedAction('),main.indexOf('// the wallet the entry'));
const rankedStart=main.slice(main.indexOf('async function startRankedEntry('),main.indexOf('async function submitRanked()'));
const menu=main.slice(main.indexOf('function toMenu()'),main.indexOf('// ---- input ---'));
const quitHelpers=main.slice(main.indexOf('let quitTarget = null;'),main.indexOf('function pause(on)'));
const updater=main.slice(main.indexOf('const BUILD ='),main.indexOf('\ncheckForUpdate();')).replace('import.meta.env.VITE_BUILD',"'fixture-build'");
const importer=main.slice(main.indexOf("$('xferload').onclick ="),main.indexOf("for (const b of document.querySelectorAll('#more",main.indexOf("$('xferload').onclick =")));
const connectWrapper=main.slice(main.indexOf('async function walletConnect('),main.indexOf('// a button for each wallet'));
const holder=main.slice(main.indexOf('async function connectDmt('),main.indexOf("$('dmtbtn').onclick"));
const perks=main.split('\n').find(s=>s.trim().startsWith("if ($('wlperks'))"));
const bind=main.slice(main.indexOf('function bindCloud('),main.indexOf('// open the game or come back'));
const observerStart=main.indexOf('onWallet(',main.indexOf("$('wallet').addEventListener"));
const observer=main.slice(observerStart,main.indexOf('function renderWalletConnect(',observerStart));
const lockStart=main.indexOf('function withImportLock(');
const lock=lockStart<0?'':main.slice(lockStart,main.indexOf('function showProgressRecovery(',lockStart));
const A='0x'+'1'.repeat(40),deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
const reply=(value,status=200)=>new Response(JSON.stringify(value),{status});
async function setup(t,{pause='login',established=false,holdStart=true,failStart=false,browserFailure=null,noBrowserApis=false,importData={'sq-coins':'100'},importFailure=null,holderReply=false,cloudData={'sq-coins':'100'},pullData={'sq-coins':'700'},failMap=false,putResponses=[],failSettings=false,initialName=null}={}){
  const previous=globalThis.localStorage,previousWindow=globalThis.window,store=new Map(established?[['sq-coins','500'],['sq-cloud',JSON.stringify({a:A,key:'fixture-key',rev:1})],['sq-cloud-base',JSON.stringify({'sq-coins':'500'})]]:[]);
  if(initialName!==null){store.set('sq-name',JSON.stringify(initialName));if(established)store.set('sq-cloud-base',JSON.stringify({'sq-coins':'500','sq-name':JSON.stringify(initialName)}));}
  const writes=[];let writesBlocked=false,importFailed=false,holderActive=false,traceConnect=false;
  globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>{if(importFailure==='reserve'&&k==='sq-import-backup-v1')throw Error('fixture quota');if(writesBlocked)throw Error('fixture storage blocked');if(importFailure&&k==='sq-name'&&v==='\"Imported\"'&&!importFailed){importFailed=true;writesBlocked=importFailure==='persistent';throw Error('fixture import write failure');}writes.push(k);store.set(k,String(v));},removeItem:k=>{if(writesBlocked)throw Error('fixture storage blocked');store.delete(k);}};globalThis.window={};
  t.mock.timers.enable({apis:['setTimeout']});
  const gates=Object.fromEntries(['nonce','signature','login','pull','push','map','gear','choice','registrations','worker-update','cache-keys','cache-delete','version','import-lock','holder-connect','holder-account','holder-signature','holder-response','resume'].map(k=>[k,{hit:deferred(),gate:deferred()}])),calls=[],pending=[];
  let reloads=0;
  const stage=async name=>{gates[name].hit.resolve();if(pause===name||holdStart&&['map','gear'].includes(name))await gates[name].gate.promise;};
  const w={p:{on(){},request:async({method})=>{if(method==='personal_sign'){await stage(holderActive?'holder-signature':'signature');return'fixture-signature';}if(method==='eth_requestAccounts'&&traceConnect)await stage(holderActive?'holder-account':'holder-connect');if(method==='wallet_revokePermissions')return null;return[A];}}};
  await W.connect(w);traceConnect=true;
  const other={p:{on(){},request:async args=>{if(args.method==='eth_requestAccounts')await stage('holder-connect');else if(args.method==='personal_sign')await stage('holder-signature');return args.method==='personal_sign'?'fixture-signature':[A];}}};
  t.mock.method(globalThis,'fetch',async(url,options={})=>{
    const route=url.split('/').pop().split('?')[0];calls.push(route);
    if(route==='nonce')return reply({nonce:'fixture-holder-nonce',message:'fixture holder only'});
    if(route==='holder'){await stage('holder-response');const body=JSON.parse(options.body);return reply({address:body.address,holder:holderReply,pass:holderReply?'fixture-holder-pass':undefined,balance:'10'});}
    if(route==='save-nonce'){await stage('nonce');return reply({nonce:'fixture-nonce',message:'fixture sign-in'});}
    if(route==='save-login'){await stage('login');return reply({address:A,key:'login-fixture-key',rev:1,data:cloudData});}
    if(route==='save-get'){await stage('pull');return reply({rev:2,data:pullData});}
    if(route==='save-put'){await stage('push');const body=JSON.parse(options.body);if(putResponses.length){const next=putResponses.shift();return reply(next.body,next.status);}return reply({ok:true,rev:body.rev+1});}
    if(route==='version.json'){await stage('version');return reply({build:'fixture-new'});}
    if(route==='run')return reply({ticket:'fixture-ticket'});
    throw Error('unexpected fixture route '+route);
  });
  const browserStage=async name=>{calls.push(name);await stage(name);if(browserFailure===name)throw Error('fixture browser API failure');};
  const document={activeElement:null},nodes=new Map(),$=id=>{
    if(!nodes.has(id)){const classes=new Set(['hidden']);nodes.set(id,{value:id==='rankedadv'?'adventurer':id==='rankedname'?(initialName??'Fixture'):id==='lbname'?(initialName??''):'',textContent:'',disabled:false,dataset:{},focus(){document.activeElement=this;if(id==='cloudusewal')gates.choice.hit.resolve();},children:[],querySelectorAll:()=>[],replaceChildren(){},classList:{contains:c=>classes.has(c),add:c=>classes.add(c),remove:c=>classes.delete(c),toggle:(c,on)=>on?classes.add(c):classes.delete(c)}});}return nodes.get(id);
  };
  const app=Function('createCloud','walletNow','walletRevision','onWallet','$','location','gearStage','mapStage','failStart','navigator','caches','requestWallet','prove','importData','importProgress','recoverProgressImport','otherWallet','failMap','resumeStage','cleanSettings','profileValue','profileBest','failSettings','recoverRunProgress','document','petChoice','createBunCompanions',`
    const coopReviveUi={clear(){}};let buyBusy=null,walletConnecting=null,walletRequests=0,walletUi=false,walletBal=null,recoveryCanRestart=null,recoveryOptions=null;const walletModalOpen=()=>walletUi;
    let coop=null,coopResult=null,coopHomeMap=null,coopLoading=false;let mode='title',sim=null,rankedRun=null,rankedRec=null,rankedBusy=false,storedLive=null,runTicket=null,casualRun=null,mapLoading=false,loadedMapId='greentown',selMap='greentown',selAdv='adventurer',acc=0,selCard=0,shownPending=false,waitingForMove=false,rewardWasShown=false,pendingUse=null,slowmo=0,runBest=null,passedBest=false,chase=null;
    let selVariant='normal',trialBoss='giant',fieldMap=selMap;
    const audioApplied=[];const walletHandoff=null;let PLAYER='p';const LATEST='fixture-version',BASE='./',SIM_ID='fixture-sim',params=new URLSearchParams(),keys=new Set(),slotCache={},WEAPONS={},PASSIVES={};
    const map={id:'greentown',name:'Greentown',length:900,finalBoss:'dragon',music:'fixture'},tutorial={...map,id:'tutorial',name:'Tutorial Island',special:true,forceAdv:'alex'},MAPS=[map,tutorial],MAP_BY_ID={greentown:map,tutorial};
    const ADVENTURER_BY_ID={adventurer:{id:'adventurer',weapon:'Sword'},wizard:{id:'wizard',weapon:'Staff'},alex:{id:'alex',weapon:'Sword'}},mapRequests=[];
    const load=(key,fallback)=>{try{return profileValue(key,JSON.parse(localStorage.getItem(key)||'null')??fallback,fallback);}catch{return fallback;}},save=(key,value)=>localStorage.setItem(key,JSON.stringify(value)),clearedMaps=()=>new Set(load('sq-cleared',[])),unlockedMap=()=>true,asset=()=>'',bossName=()=> 'Dragon',weaponTitle=()=> 'Sword';
    let hardOn=false,endlessOn=false;const rankedWeek={map:'greentown'},rankedLive=()=>storedLive,rankedPlaying=()=>!!rankedRun&&!!sim&&!sim.over;
    let selectedPet=null,petRequest=0,petViewer=null;const petRequests=[];
    let rendererDefaults=null;let renderer={setPet:async id=>{petRequests.push(id);},getSettings:()=>({}),applySettings(next){if(failSettings&&Object.hasOwn(next,'res'))throw Error('fixture display failure');},async loadMap(map){mapRequests.push(map.id);await mapStage();if(failMap)throw Error('fixture map failure');},async preloadGear(){await gearStage();if(failStart)throw Error('fixture gear failure');},reset(){},setZoom(){},setShift(){},setYaw(){},setAura(){}};
    const bunCompanions=createBunCompanions({walletNow,walletRevision,onChange:applyPetChoice,load:async(address,{identity})=>({status:'ready',address,identity,block:{number:'0x123',hash:'0x'+'a'.repeat(64)},pets:[]})});
    ${currentPetSource}
    ${petInitSource}
    ${mapPicker}
    const playTitleMusic=()=>{};
    const audio={init:async()=>{},music(){},applyPreferences:data=>audioApplied.push(data)};
    const getCoins=()=>Number(JSON.parse(localStorage.getItem('sq-coins')||'0')),xferRead=code=>code==='fixture-code'?{data:importData}:{error:'fixture invalid code'};
    const getGear=()=>({}),getGearLv=()=>({}),getSkills=()=>({}),getBests=()=>({}),runGround=()=>null,runAdv=()=>ADVENTURER_BY_ID[MAP_BY_ID[selMap].forceAdv||selAdv],bestKey=()=>'';
    const makeSim=()=>({map,players:[{}],pending:{},over:null,t:0}),createSim=options=>({...makeSim(),map:options.map,hard:options.hard,endless:options.endless,players:[{adv:options.players[0].adv}]}),resumeRankedAsync=async(log,options,progress)=>{await resumeStage();progress?.(1,1);return{sim:makeSim(),rec:{log:()=>({runs:[]})}};};
    const banner=()=>{},preloadIcons=()=>{},weaponItem=()=>'',passiveItem=()=>'',clearTouch=()=>{},showLevelUp=()=>{},persistRanked=()=>{},fmtT=s=>String(s),slayName=()=> 'Dragon',kpmWeek=()=>false,liveRace=live=>live;
    const renderWallet=()=>{},renderDmt=()=>{},refreshBalances=()=>{},wallets=()=>[],short=a=>a,renderRanked=()=>{},rankedMessage=()=>{},openRanked=()=>{},why=e=>e.message,plain=s=>Error(s),applyDmt=()=>{},buildAdventurers=()=>{},showBest=()=>{},buildSettings=()=>{},submitRanked=async()=>{};
    const readRanked=(key,fallback=null)=>key==='sq-ranked-live'?storedLive:fallback,writeRanked=(key,value)=>{if(key==='sq-ranked-live')storedLive=value;};
    const requireRankedBuild=async()=>{};
    const rankedApi=async()=>({run:'fixture-run',seed:1,map:'greentown',week:0,mode:'normal'}),RunRecorder=class{log(){return{runs:[]};}};
    ${rankedNameInput}
    ${choices}
    ${mapBuilder}
    ${cloudBlock}
    ${connectWrapper}
    ${holder}
    function bindPerks(c,msg){${perks}}
    const cloudFor=c=>{const s=cloud.state();return s&&c&&s.a.toLowerCase()===c.address.toLowerCase()?s:null;};
    ${bind}
    ${lock}
    function showProgressRecovery(canRestart=()=>true,settingsOnly=false,runRecovery=null){mode='recovery';recoveryCanRestart=canRestart;recoveryOptions=runRecovery;}
    const stopWallet=${observer}
    ${updater}
    ${importer}
    ${pull}
    ${action}
    ${rankedStart}
    ${tickets}
    ${start}
    ${quitHelpers}
    ${menu}
    const pickAssetHost=async()=>{},createRenderer=async()=>renderer,requestAnimationFrame=()=>{},loop=()=>{};
    ${preferenceHelpers}
    ${bootSource}
    return{cloud,pickMap,recoveryOptions:()=>recoveryOptions,audioApplied:()=>audioApplied,connect:walletConnect,canRestartRecovery:()=>recoveryCanRestart?.(),boot:()=>{const refreshRanked=async()=>{};return ${afterBoot}},dispose:stopWallet,holder:kind=>kind==='new'?connectDmt(otherWallet):kind==='same'?connectDmt(walletNow().w):(bindPerks(walletNow(),()=>{}),$('wlperks').onclick()),cloudUI:()=>{bindCloud(walletNow(),()=>{});return $('wlcloud').onclick();},recover:()=>recoverProgressImport(localStorage),startRun,rankedAction,startRankedEntry,recoverRankedRun,toMenu,pull:cloudPull,mode:v=>mode=v,state:()=>({mode,rankedBusy,sim,selMap,selAdv,loadedMapId,mapLoading,hardOn,endlessOn,mapRequests}),select:(map,adv)=>{selMap=map;selAdv=adv;},hard:()=>{hardOn=endlessOn=true;},setLive:v=>storedLive=v,update:()=>$('updatebtn').onclick(),check:checkForUpdate,load:(sure=true)=>{$('xferin').value='fixture-code';$('xferload').dataset.sure=sure?'1':'';return $('xferload').onclick();},walletBusy:(kind,value)=>{if(kind==='buy')buyBusy=value?{}:null;else if(kind==='connect')walletConnecting=value?{}:null;else walletUi=value;}};
  `)(createCloud,W.current,W.walletRevision,W.onWallet,$,{reload(){reloads++;}},()=>stage('gear'),()=>stage('map'),failStart,
    noBrowserApis?{}:{locks:{request:async(name,fn)=>{calls.push('import-lock');await stage('import-lock');return fn();}},serviceWorker:{getRegistrations:async()=>{await browserStage('registrations');return[{update:async()=>browserStage('worker-update')}];}}},
    noBrowserApis?{}:{keys:async()=>{await browserStage('cache-keys');return['sqs-v3'];},delete:async()=>{await browserStage('cache-delete');return true;}},W.connect,async(...args)=>{holderActive=true;try{return await proveHolder(...args);}finally{holderActive=false;}},importData,importProgressImpl,recoverProgressImportImpl,other,failMap,()=>stage('resume'),cleanSettings,profileValue,profileBest,failSettings,recoverRunProgressImpl,document,petChoice,createBunCompanions);
  const track=p=>{pending.push(p);p.catch(()=>{});return p;};
  t.after(async()=>{for(const x of Object.values(gates))x.gate.resolve();t.mock.timers.tick(1000);await Promise.allSettled(pending);app.dispose();writesBlocked=false;W.disconnect();globalThis.localStorage=previous;globalThis.window=previousWindow;});
  return{app,store,writes,gates,calls,$,allowWrites:()=>writesBlocked=false,reloads:()=>reloads,sign:()=>track(app.cloud.signIn(W.current())),pull:()=>track(app.pull()),update:()=>track(app.update()),check:()=>track(app.check()),
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

for(const mode of ['play','pause','levelup','casket','end'])test(`Update refuses browser work and reload in ${mode}`,async t=>{
 const f=await setup(t,{pause:null,holdStart:false});f.app.mode(mode);await f.update();assert.deepEqual(f.calls,[]);assert.equal(f.reloads(),0);
});
for(const kind of ['buy','connect','modal'])test(`Update preserves a pending wallet ${kind}`,async t=>{
 const f=await setup(t,{pause:null,holdStart:false});f.app.walletBusy(kind,true);await f.update();assert.deepEqual(f.calls,[]);assert.equal(f.reloads(),0);
});
for(const pause of ['registrations','worker-update','cache-keys','cache-delete'])test(`run intent cancels Update while ${pause} is pending`,async t=>{
 const f=await setup(t,{pause}),updating=f.update();await f.gates[pause].hit.promise;
 const starting=f.start();await f.gates.gear.hit.promise;f.gates[pause].gate.resolve();await updating;f.finish();await starting;
 assert.equal(f.reloads(),0);assert.equal(f.$('updatebtn').disabled,false);
 const order=['registrations','worker-update','cache-keys','cache-delete'];assert.ok(f.calls.filter(c=>order.includes(c)).every(c=>order.indexOf(c)<=order.indexOf(pause)));
});
test('Update cancelled by a run cannot resurrect after return to title',async t=>{
 const f=await setup(t,{pause:'worker-update'}),updating=f.update();await f.gates['worker-update'].hit.promise;
 const starting=f.start();f.finish();await starting;f.app.toMenu();f.gates['worker-update'].gate.resolve();await updating;assert.equal(f.reloads(),0);
});
test('cancelled Update A cannot reload or unlock newer Update B',async t=>{
 const f=await setup(t,{pause:'registrations'}),a=f.update();await f.gates.registrations.hit.promise;const old=f.gates.registrations.gate;
 const starting=f.start();f.finish();await starting;f.app.toMenu();f.gates.registrations.hit=deferred();f.gates.registrations.gate=deferred();
 const b=f.update();await f.gates.registrations.hit.promise;old.resolve();await a;const stale={reloads:f.reloads(),disabled:f.$('updatebtn').disabled};
 f.gates.registrations.gate.resolve();await b;assert.deepEqual(stale,{reloads:0,disabled:true});assert.equal(f.reloads(),1);
});
test('a failed run invalidates its old Update but permits a new explicit Update',async t=>{
 const f=await setup(t,{pause:'registrations',holdStart:false,failStart:true}),updating=f.update();await f.gates.registrations.hit.promise;
 await assert.rejects(f.start(),/fixture gear failure/);f.gates.registrations.gate.resolve();await updating;const stale=f.reloads();await f.update();
 assert.equal(stale,0);assert.equal(f.reloads(),1);
});
test('duplicate Update callbacks share one worker/cache flow',async t=>{
 const f=await setup(t,{pause:'registrations',holdStart:false}),a=f.update();await f.gates.registrations.hit.promise;const b=f.update();f.gates.registrations.gate.resolve();await Promise.all([a,b]);
 assert.equal(f.calls.filter(c=>c==='registrations').length,1);assert.equal(f.reloads(),1);
});
test('normal title Update still refreshes worker/cache and reloads once',async t=>{
 const f=await setup(t,{pause:null,holdStart:false});await f.update();assert.deepEqual(f.calls,['registrations','worker-update','cache-keys','cache-delete']);assert.equal(f.reloads(),1);
});
for(const browserFailure of ['registrations','worker-update','cache-keys','cache-delete'])test(`Update retains best-effort fallback after ${browserFailure} failure`,async t=>{
 const f=await setup(t,{pause:null,holdStart:false,browserFailure});await f.update();assert.equal(f.reloads(),1);
});
test('Update without browser worker/cache APIs can still reload safely at title',async t=>{
 const f=await setup(t,{pause:null,holdStart:false,noBrowserApis:true});await f.update();assert.equal(f.reloads(),1);
});
test('a saved ranked run and active ranked setup refuse Update',async t=>{
 const f=await setup(t,{pause:null,holdStart:false});f.app.setLive({run:'fixture-saved'});await f.update();assert.equal(f.reloads(),0);f.app.setLive(null);
 const action=f.track(f.app.rankedAction(()=>f.gates.choice.gate.promise));await f.update();f.gates.choice.gate.resolve();await action;assert.equal(f.reloads(),0);
});
test('a late version response cannot reveal Update during run preload',async t=>{
 const f=await setup(t,{pause:'version'}),checking=f.check();await f.gates.version.hit.promise;const starting=f.start();await f.gates.gear.hit.promise;
 f.gates.version.gate.resolve();await checking;const hidden=f.$('updatebtn').classList.contains('hidden');f.finish();await starting;assert.equal(hidden,true);
});
for(const mode of ['play','pause','levelup','casket'])test(`confirmed progress import cannot replace a ${mode} run`,async t=>{
 const f=await setup(t,{pause:null,holdStart:false});f.store.set('sq-coins','500');f.app.mode(mode);await f.app.load();t.mock.timers.tick(1000);assert.equal(f.store.get('sq-coins'),'500');assert.equal(f.reloads(),0);
});
test('a queued import reload cannot interrupt the next run',async t=>{
 const f=await setup(t,{pause:null});await f.app.load();const starting=f.start();await f.gates.gear.hit.promise;t.mock.timers.tick(1000);const reloads=f.reloads();f.finish();await starting;
 assert.equal(f.store.get('sq-coins'),'100');assert.equal(reloads,0);
});
test('healthy title import still requires confirmation and reloads once',async t=>{
 const f=await setup(t,{pause:null,holdStart:false});f.store.set('sq-coins','500');await f.app.load(false);assert.equal(f.$('xferload').dataset.sure,'1');assert.equal(f.store.get('sq-coins'),'500');assert.equal(f.reloads(),0);
 await f.app.load();assert.equal(f.store.get('sq-coins'),'100');t.mock.timers.tick(600);assert.equal(f.reloads(),1);
});

for(const [kind,pause]of[['new','holder-connect'],['same','holder-account'],['same','holder-signature'],['perks','holder-signature'],['cloud','signature']])test(`pending ${kind} wallet action blocks Update and import at ${pause}`,async t=>{
 const f=await setup(t,{pause,holdStart:false}),operation=f.track(kind==='cloud'?f.app.cloudUI():f.app.holder(kind));await f.gates[pause].hit.promise;
 f.store.set('sq-coins','500');await f.update();await f.app.load();const observed={coins:f.store.get('sq-coins'),reloads:f.reloads(),browser:f.calls.filter(c=>c==='registrations').length};
 const starting=f.start();f.finish();await starting;f.gates[pause].gate.resolve();await operation;
 assert.deepEqual(observed,{coins:'500',reloads:0,browser:0});
});
for(const kind of ['same','perks','cloud'])test(`a newer ${kind} wallet action permanently invalidates old Update ownership`,async t=>{
 const f=await setup(t,{pause:'worker-update',holdStart:false}),updating=f.update();await f.gates['worker-update'].hit.promise;
 await(kind==='cloud'?f.app.cloudUI():f.app.holder(kind));f.gates['worker-update'].gate.resolve();await updating;assert.equal(f.reloads(),0);
 if(kind==='cloud'){assert.equal(f.store.get('sq-coins'),'100');t.mock.timers.tick(600);assert.equal(f.reloads(),1);}
});
test('a disconnected pending holder response cannot restore a cached pass',async t=>{
 const f=await setup(t,{pause:'holder-response',holdStart:false,holderReply:true}),checking=f.track(f.app.holder('same'));await f.gates['holder-response'].hit.promise;
 W.disconnect();await f.update();f.gates['holder-response'].gate.resolve();await checking;assert.equal(f.store.has('sq-dmt'),false);assert.equal(f.reloads(),1);
});
test('a transient import write failure rolls every changed key back',async t=>{
 const f=await setup(t,{pause:null,holdStart:false,importFailure:'once',importData:{'sq-coins':'100','sq-name':'"Imported"'}});f.store.set('sq-coins','500');f.store.set('sq-name','"Before"');await f.app.load();
 assert.equal(f.store.get('sq-coins'),'500');assert.equal(f.store.get('sq-name'),'"Before"');assert.equal(f.store.has('sq-import-backup-v1'),false);assert.equal(f.reloads(),0);
});
test('backup reservation failure refuses import before changing progress',async t=>{
 const f=await setup(t,{pause:null,holdStart:false,importFailure:'reserve'});f.store.set('sq-coins','500');await f.app.load();assert.equal(f.store.get('sq-coins'),'500');assert.equal(f.reloads(),0);
});
test('unrestorable import keeps durable old progress and stops play until recovery',async t=>{
 const f=await setup(t,{pause:null,holdStart:false,established:true,importFailure:'persistent',importData:{'sq-coins':'100','sq-name':'"Imported"'}});f.store.set('sq-name','"Before"');await f.app.load();
 const raw=f.store.get('sq-import-backup-v1');assert.ok(raw,'original progress must remain recoverable');assert.deepEqual(JSON.parse(raw).before,{'sq-coins':'500','sq-name':'"Before"'});
 await f.start();assert.equal(f.app.state().mode,'recovery');assert.equal(f.reloads(),0);
 f.allowWrites();f.app.recover();assert.equal(f.store.get('sq-coins'),'500');assert.equal(f.store.get('sq-name'),'"Before"');assert.equal(f.store.has('sq-import-backup-v1'),false);
});
test('run intent cancels an import waiting for another tab even after returning to title',async t=>{
 const f=await setup(t,{pause:'import-lock',holdStart:false});f.store.set('sq-coins','500');const importing=f.track(Promise.resolve(f.app.load()));await f.flush();
 const starting=f.start();f.finish();await starting;f.app.toMenu();f.gates['import-lock'].gate.resolve();await importing;assert.equal(f.store.get('sq-coins'),'500');assert.equal(f.reloads(),0);
});
test('recovery mode cannot upload a mixed profile even if storage refuses sign-out writes',async t=>{
 const f=await setup(t,{pause:null,holdStart:false,established:true});f.store.set('sq-coins','650');f.app.mode('recovery');assert.equal(await f.app.cloud.push(true),false);assert.equal(f.calls.includes('save-put'),false);
});

test('an upload response cannot change local state after recovery begins',async t=>{
 const f=await setup(t,{pause:'push',holdStart:false,established:true});f.store.set('sq-coins','650');const uploading=f.track(f.app.cloud.push(true));await f.gates.push.hit.promise;
 f.app.mode('recovery');f.gates.push.gate.resolve();assert.equal(await uploading,false);assert.equal(f.app.cloud.state().rev,1);assert.equal(f.store.get('sq-coins'),'650');assert.equal(f.store.get('sq-cloud-base'),JSON.stringify({'sq-coins':'500'}));
});

for(const source of ['sign-in','pull','import'])test(`adopted ${source} selections survive cancelled reload and the next run`,async t=>{
 const data={'sq-coins':'100','sq-map':'"greentown"','sq-adv':'"wizard"','sq-name':'"Loaded"'},f=await setup(t,{pause:null,holdStart:false,established:source==='pull',cloudData:data,pullData:data,importData:data});
 f.$('rankedname').value=f.$('lbname').value='Before';if(source==='sign-in')await f.sign();else if(source==='pull')await f.pull();else await f.app.load();
 const adopted=f.app.state(),names=[f.$('rankedname').value,f.$('lbname').value];const starting=f.start();f.finish();await starting;t.mock.timers.tick(1000);
 assert.equal(adopted.selAdv,'wizard');assert.deepEqual(names,source==='pull'?['Before','Before']:['Loaded','Loaded']);assert.equal(f.app.state().sim.players[0].adv,'wizard');assert.equal(f.reloads(),0);
 f.app.toMenu();assert.equal(f.app.state().selAdv,'wizard');assert.equal(f.store.get('sq-name'),'"Loaded"');
});
test('adopted map loads through the normal picker without rewriting saved selections',async t=>{
 const data={'sq-coins':'100','sq-map':'"tutorial"','sq-adv':'"wizard"','sq-name':'"Loaded"'},f=await setup(t,{pause:'map',holdStart:false,cloudData:data});await f.sign();await f.flush();const loading=f.app.state();
 assert.equal(loading.selMap,'tutorial');assert.equal(loading.mapLoading,true);assert.equal(f.$('start').disabled,true);assert.deepEqual(loading.mapRequests,['tutorial']);assert.equal(f.writes.filter(k=>k==='sq-map').length,1);
 f.finish();await f.flush();assert.equal(f.$('start').disabled,false);const starting=f.start();await starting;t.mock.timers.tick(1000);assert.equal(f.app.state().sim.map.id,'tutorial');assert.equal(f.app.state().sim.players[0].adv,'alex');assert.equal(f.reloads(),0);
});
for(const invalid of ['__proto__','constructor','missing'])test(`unrecognized adopted selection ${invalid} falls back safely`,async t=>{
 const f=await setup(t,{pause:null,holdStart:false,cloudData:{'sq-coins':'100','sq-map':JSON.stringify(invalid),'sq-adv':JSON.stringify(invalid)}});f.app.select('tutorial','wizard');await f.sign();
 assert.equal(f.app.state().selMap,'greentown');assert.equal(f.app.state().selAdv,'adventurer');
});
for(const phase of ['boot','map'])test(`${phase} loading refuses new cloud adoption until ready`,async t=>{
 const f=await setup(t,{pause:phase==='map'?'map':null,holdStart:false});let picking;if(phase==='boot')f.$('start').disabled=true;else{picking=f.track(f.app.pickMap('tutorial'));await f.gates.map.hit.promise;}
 const result=await f.sign().then(value=>({value}),error=>({error}));if(picking){f.finish();await picking;}else f.$('start').disabled=false;
 assert.ok(result.error);assert.equal(f.store.has('sq-coins'),false);assert.equal(await f.sign(),'loaded');
});
test('late cloud login cannot replace progress while a map is loading',async t=>{
 const f=await setup(t,{pause:'login',holdStart:true}),signing=f.sign();await f.gates.login.hit.promise;const picking=f.track(f.app.pickMap('tutorial'));await f.gates.map.hit.promise;f.gates.login.gate.resolve();
 const result=await signing.then(value=>({value}),error=>({error}));f.finish();await picking;assert.ok(result.error);assert.equal(f.store.has('sq-coins'),false);
});
test('adopted map refresh resets Hard and Endless when that map is uncleared',async t=>{
 const f=await setup(t,{pause:null,holdStart:false,cloudData:{'sq-coins':'100'}});f.app.hard();await f.sign();assert.equal(f.app.state().hardOn,false);assert.equal(f.app.state().endlessOn,false);
});
test('map-load failure after adoption retains the save and lets the healthy reload proceed',async t=>{
 const f=await setup(t,{pause:null,holdStart:false,failMap:true,cloudData:{'sq-coins':'100','sq-map':'"tutorial"'}});await f.sign();await f.flush();assert.deepEqual(f.app.state().mapRequests,['tutorial']);assert.equal(f.app.state().mapLoading,false);assert.equal(f.$('start').disabled,false);assert.equal(f.store.get('sq-map'),'"tutorial"');t.mock.timers.tick(600);assert.equal(f.reloads(),1);
});

test('boot completion retries a startup pull that had to wait for the game to load',async t=>{
 const f=await setup(t,{pause:null,holdStart:false,established:true});f.$('start').disabled=true;await f.pull();assert.equal(f.calls.includes('save-get'),false);await f.app.boot();await f.flush();assert.equal(f.calls.filter(c=>c==='save-get').length,1);assert.equal(f.store.get('sq-coins'),'700');
});

test('manual Update can still recover a stalled title-screen boot',async t=>{
 const f=await setup(t,{pause:null,holdStart:false});f.$('start').disabled=true;await f.update();assert.equal(f.reloads(),1);
});
test('confirmed import waits for title-screen boot readiness',async t=>{
 const f=await setup(t,{pause:null,holdStart:false});f.$('start').disabled=true;await f.app.load();assert.equal(f.store.has('sq-coins'),false);assert.equal(f.reloads(),0);
});

// Wrong blocker selection must never reach confirmation or alter the local save.
for(const phase of ['boot','map'])for(const confirmed of [false,true])test(`${phase} loading explains import readiness before ${confirmed?'commit':'confirmation'}`,async t=>{
 const f=await setup(t,{pause:phase==='map'?'map':null,holdStart:false});f.store.set('sq-coins','900');const before=new Map(f.store),beforeWrites=f.writes.length;let picking;
 if(phase==='boot')f.$('start').disabled=true;else{picking=f.track(f.app.pickMap('tutorial',false));await f.gates.map.hit.promise;}
 await f.app.load(confirmed);assert.match(f.$('xfermsg').textContent,/not ready/i);assert.doesNotMatch(f.$('xfermsg').textContent,/run|wallet/i);assert.deepEqual(f.store,before);assert.equal(f.writes.length,beforeWrites);assert.equal(f.calls.includes('import-lock'),false);assert.equal(f.reloads(),0);
 if(picking){f.finish();await picking;}else f.$('start').disabled=false;
 await f.app.load();t.mock.timers.tick(600);assert.equal(f.store.get('sq-coins'),'100');assert.equal(f.reloads(),1);
});
for(const blocker of ['run','wallet'])test(`a ${blocker} blocker takes priority over import readiness`,async t=>{
 const f=await setup(t,{pause:null,holdStart:false});f.$('start').disabled=true;if(blocker==='run')f.app.mode('play');else f.app.walletBusy('connect',true);
 await f.app.load();assert.match(f.$('xfermsg').textContent,/run or wallet/i);assert.equal(f.store.has('sq-coins'),false);assert.equal(f.calls.includes('import-lock'),false);assert.equal(f.reloads(),0);
});
test('Update remains usable while a title map is loading',async t=>{
 const f=await setup(t,{pause:'map',holdStart:false}),picking=f.track(f.app.pickMap('tutorial',false));await f.gates.map.hit.promise;await f.update();assert.equal(f.reloads(),1);f.finish();await picking;
});

test('startup pull waits for a saved nondefault map after both early pull opportunities',async t=>{
 const f=await setup(t,{pause:'map',holdStart:false,established:true});f.app.select('tutorial','wizard');f.$('start').disabled=true;const booting=f.track(f.app.boot());await f.gates.map.hit.promise;await f.pull();await f.flush();
 assert.equal(f.calls.includes('save-get'),false);f.finish();await booting;await f.flush();assert.equal(f.calls.filter(c=>c==='save-get').length,1);assert.equal(f.store.get('sq-coins'),'700');assert.equal(f.app.state().loadedMapId,'tutorial');
});

async function mergedTitle(t,{map='greentown',...options}={}){
 const f=await setup(t,{pause:null,holdStart:false,established:true,initialName:'Before',...options,putResponses:[{status:409,body:{conflict:true,rev:2,data:{'sq-coins':'200','sq-map':JSON.stringify(map),'sq-adv':'"wizard"','sq-name':'"Merged"','sq-cleared':'["greentown"]'}}}]});
 const before={'sq-coins':'100','sq-map':'"greentown"','sq-adv':'"adventurer"','sq-name':'"Before"'};f.store.set('sq-cloud-base',JSON.stringify(before));for(const key of ['sq-map','sq-adv','sq-name'])f.store.set(key,before[key]);f.$('rankedname').value=f.$('lbname').value='Before';return f;
}
test('a committed upload conflict refreshes the title choices used by the next run',async t=>{
 const f=await mergedTitle(t);await f.app.cloud.push(true);assert.equal(f.store.get('sq-adv'),'"wizard"');assert.equal(f.app.state().selAdv,'wizard');assert.deepEqual([f.$('rankedname').value,f.$('lbname').value],['Merged','Merged']);await f.start();assert.equal(f.app.state().sim.players[0].adv,'wizard');t.mock.timers.tick(1000);assert.equal(f.reloads(),0);
});
test('a merge during play preserves the current actor and refreshes choices on return to title',async t=>{
 const f=await mergedTitle(t);await f.start();const playing=f.app.state().sim;await f.app.cloud.push(true);assert.equal(f.app.state().sim,playing);assert.equal(f.app.state().mode,'play');assert.equal(f.app.state().sim.players[0].adv,'adventurer');assert.equal(f.app.state().selAdv,'adventurer');assert.deepEqual([f.$('rankedname').value,f.$('lbname').value],['Merged','Merged']);f.app.toMenu();await f.flush();assert.equal(f.app.state().selAdv,'wizard');assert.equal(f.reloads(),0);
});
test('an end-screen name edit survives a background conflict merge',async t=>{
 const f=await mergedTitle(t);f.app.mode('end');f.$('lbname').value='MyEdit';await f.app.cloud.push(true);assert.equal(f.$('lbname').value,'MyEdit');assert.equal(f.$('rankedname').value,'Merged');assert.equal(f.app.state().selAdv,'adventurer');assert.equal(f.reloads(),0);
});
test('Run again uses a deferred merged map and its forced character',async t=>{
 const f=await mergedTitle(t,{map:'tutorial'});await f.start();await f.app.cloud.push(true);f.app.mode('end');await f.start();assert.equal(f.app.state().sim.map.id,'tutorial');assert.equal(f.app.state().sim.players[0].adv,'alex');assert.equal(f.app.state().selAdv,'wizard');assert.equal(f.reloads(),0);
});
test('map-loader completion reconciles a merge that arrived while title assets loaded',async t=>{
 const f=await mergedTitle(t,{pause:'map'}),picking=f.track(f.app.pickMap('tutorial'));await f.gates.map.hit.promise;await f.app.cloud.push(true);assert.equal(f.$('start').disabled,true);f.finish();await picking;await f.flush();assert.equal(f.app.state().selAdv,'wizard');assert.equal(f.app.state().loadedMapId,'tutorial');assert.equal(f.$('start').disabled,false);assert.equal(f.reloads(),0);
});
test('boot completion awaits deferred merged map choices before its next cloud pull',async t=>{
 const f=await mergedTitle(t,{map:'tutorial',pause:'gear'});f.$('start').disabled=true;const booting=f.track(f.app.boot());await f.gates.gear.hit.promise;await f.app.cloud.push(true);f.finish();await booting;await f.flush();assert.equal(f.app.state().selMap,'tutorial');assert.equal(f.app.state().loadedMapId,'tutorial');assert.equal(f.app.state().selAdv,'wizard');assert.equal(f.$('lbname').value,'Merged');
});
test('a merged local commit still refreshes title choices if session activation fails',async t=>{
 const f=await mergedTitle(t),set=globalThis.localStorage.setItem;globalThis.localStorage.setItem=(key,value)=>{if(key==='sq-cloud'&&JSON.parse(value).rev===2)throw Error('fixture activation denied');return set(key,value);};await f.app.cloud.push(true);assert.equal(f.app.cloud.state(),null);assert.equal(f.store.get('sq-adv'),'"wizard"');assert.equal(f.app.state().selAdv,'wizard');assert.equal(f.$('lbname').value,'Merged');
});
for(const source of ['sign-in','pull'])test(`native lock completion cannot expose old title choices before ${source} returns`,async t=>{
 const f=await setup(t,{pause:null,holdStart:false,established:source==='pull',cloudData:{'sq-coins':'100','sq-adv':'"wizard"'},pullData:{'sq-coins':'700','sq-adv':'"wizard"'}}),descriptor=Object.getOwnPropertyDescriptor(globalThis,'navigator');
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{locks:{request:async(name,fn)=>{const result=fn();await f.start();return result;}}}});t.after(()=>{if(descriptor)Object.defineProperty(globalThis,'navigator',descriptor);else delete globalThis.navigator;});
 if(source==='sign-in')await f.sign();else await f.pull();assert.equal(f.app.state().mode,'play');assert.equal(f.app.state().sim.players[0].adv,'wizard');assert.equal(f.reloads(),0);
});

for(const boundary of ['gear','map','resume'])test(`persistent cloud recovery cannot be escaped by pending ${boundary} setup`,async t=>{
 const f=await setup(t,{pause:boundary,holdStart:false,established:true,importFailure:'persistent',putResponses:[{status:409,body:{conflict:true,rev:2,data:{'sq-coins':'700','sq-name':'"Imported"'}}}]});
 f.store.set('sq-name','"Before"');f.store.set('sq-cloud-base',JSON.stringify({'sq-coins':'500','sq-name':'"Before"'}));
 if(boundary==='map')f.app.select('tutorial','adventurer');if(boundary==='resume')f.app.setLive({run:'fixture-saved',sim:'fixture-sim',map:'greentown',adv:'adventurer',log:{runs:[]}});
 const starting=f.start(boundary==='resume'?'ranked resume':undefined);await f.gates[boundary].hit.promise;f.store.set('sq-coins','550');await f.app.cloud.push(true);assert.equal(f.app.state().mode,'recovery');f.finish();f.gates.resume.gate.resolve();await starting;
 assert.equal(f.app.state().mode,'recovery');assert.equal(f.app.state().sim,null);assert.ok(f.store.has('sq-import-backup-v1'));
});
test('recovery waits for the actual cloud signature after logical cancellation',async t=>{
 const f=await setup(t,{pause:null,holdStart:false,established:true,importFailure:'persistent',putResponses:[{status:409,body:{conflict:true,rev:2,data:{'sq-coins':'700','sq-name':'"Imported"'}}}]}),B='0x'+'2'.repeat(40);
 f.store.set('sq-name','"Before"');f.store.set('sq-cloud-base',JSON.stringify({'sq-coins':'500','sq-name':'"Before"'}));
 await W.connect({p:{on(){},request:async({method})=>{if(method==='personal_sign'){f.gates.signature.hit.resolve();await f.gates.signature.gate.promise;return'fixture-signature';}return[B];}}});
 const signing=f.track(f.app.cloudUI());await f.flush();assert.ok(f.calls.includes('save-nonce'),JSON.stringify(f.calls));await f.gates.signature.hit.promise;f.store.set('sq-coins','550');await f.app.cloud.push(true);const waiting=f.app.canRestartRecovery();f.gates.signature.gate.resolve();await signing;
 assert.equal(waiting,false);assert.equal(f.app.canRestartRecovery(),true);assert.equal(f.calls.filter(c=>c==='save-login').length,0);
});
test('Update waits for a cancelled injected cloud signature to settle after return to title',async t=>{
 const f=await setup(t,{pause:'signature',holdStart:false}),signing=f.track(f.app.cloudUI());await f.gates.signature.hit.promise;await f.start();f.app.toMenu();await f.update();const waiting=f.reloads();f.gates.signature.gate.resolve();await signing;await f.update();assert.equal(waiting,0);assert.equal(f.reloads(),1);
});

for(const boundary of ['holder-connect','holder-account','holder-signature'])test(`switched-away ${boundary} keeps Update and import blocked until the provider settles`,async t=>{
 const f=await setup(t,{pause:boundary,holdStart:false});f.store.set('sq-coins','500');
 const checking=f.track(f.app.holder(boundary==='holder-connect'?'new':'same'));await f.gates[boundary].hit.promise;
 await W.connect({p:{on(){},request:async()=>['0x'+'2'.repeat(40)]}});await f.update();await f.app.load();t.mock.timers.tick(1000);
 const before={coins:f.store.get('sq-coins'),reloads:f.reloads()};f.gates[boundary].gate.resolve();await checking;
 assert.deepEqual(before,{coins:'500',reloads:0});assert.equal(f.calls.filter(c=>c==='holder').length,0);assert.equal(f.store.has('sq-dmt'),false);
 await f.update();assert.equal(f.reloads(),1);await f.app.load();t.mock.timers.tick(1000);assert.equal(f.store.get('sq-coins'),'100');assert.equal(f.reloads(),2);
});
for(const boundary of ['holder-connect','holder-account','holder-signature'])test(`cloud recovery cannot restart over a switched-away ${boundary}`,async t=>{
 const f=await setup(t,{pause:boundary,holdStart:false,established:true,importFailure:'persistent',putResponses:[{status:409,body:{conflict:true,rev:2,data:{'sq-coins':'700','sq-name':'"Imported"'}}}]});
 f.store.set('sq-name','"Before"');f.store.set('sq-cloud-base',JSON.stringify({'sq-coins':'500','sq-name':'"Before"'}));
 const checking=f.track(f.app.holder(boundary==='holder-connect'?'new':'same'));await f.gates[boundary].hit.promise;await W.connect({p:{on(){},request:async()=>['0x'+'2'.repeat(40)]}});
 f.store.set('sq-coins','550');await f.app.cloud.push(true);const allowed=f.app.canRestartRecovery();f.gates[boundary].gate.resolve();await checking;
 assert.equal(f.app.state().mode,'recovery');assert.equal(allowed,false);assert.equal(f.app.canRestartRecovery(),true);assert.equal(f.calls.filter(c=>c==='holder').length,0);
});
test('switched-away ordinary connection keeps the reload guard until its provider settles',async t=>{
 const f=await setup(t,{pause:null,holdStart:false});let release,hit;const entered=new Promise(r=>hit=r),gate=new Promise(r=>release=r);
 const connecting=f.track(f.app.connect({p:{on(){},request:async()=>{hit();await gate;return['0x'+'3'.repeat(40)];}}})).catch(e=>e);await entered;
 await W.connect({p:{on(){},request:async()=>['0x'+'2'.repeat(40)]}});await f.update();const before=f.reloads();release();await connecting;
 assert.equal(before,0);assert.equal(W.current().address,'0x'+'2'.repeat(40));await f.update();assert.equal(f.reloads(),1);
});
test('a cancelled holder HTTP response alone does not keep the wallet prompt guard',async t=>{
 const f=await setup(t,{pause:'holder-response',holdStart:false,holderReply:true}),checking=f.track(f.app.holder('same'));await f.gates['holder-response'].hit.promise;
 await W.connect({p:{on(){},request:async()=>['0x'+'2'.repeat(40)]}});await f.update();const before=f.reloads();f.gates['holder-response'].gate.resolve();await checking;
 assert.equal(before,1);assert.equal(f.store.has('sq-dmt'),false);assert.equal(W.current().address,'0x'+'2'.repeat(40));
});
for(const outcome of ['resolve','reject'])test(`a newer completed holder check cannot clear an older ${outcome} prompt`,async t=>{
 const f=await setup(t,{pause:null,holdStart:false}),provider=W.current().w.p,request=provider.request,releases=[];
 provider.request=async args=>args.method==='personal_sign'?await new Promise((resolve,reject)=>releases.push({resolve,reject})):request(args);
 const old=f.track(f.app.holder('same'));await f.flush();assert.equal(releases.length,1);const next=f.track(f.app.holder('perks'));await f.flush();assert.equal(releases.length,2);
 releases[1].resolve('fixture-signature');await next;await f.update();const before=f.reloads();releases[0][outcome](outcome==='reject'?Error('fixture rejection'):'fixture-signature');await old;
 assert.equal(before,0);assert.equal(f.calls.filter(c=>c==='holder').length,1);await f.update();assert.equal(f.reloads(),1);
});
test('completed holder proof leaves the older cancelled cloud signature guarded',async t=>{
 const f=await setup(t,{pause:null,holdStart:false}),provider=W.current().w.p,request=provider.request,releases=[];
 provider.request=async args=>args.method==='personal_sign'?await new Promise(resolve=>releases.push(resolve)):request(args);
 const cloud=f.track(f.app.cloudUI());await f.flush();assert.equal(releases.length,1);const holder=f.track(f.app.holder('same'));await f.flush();assert.equal(releases.length,2);
 releases[1]('fixture-signature');await holder;await f.update();const before=f.reloads();releases[0]('fixture-signature');await cloud;
 assert.equal(before,0);assert.equal(f.calls.filter(c=>c==='save-login').length,0);await f.update();assert.equal(f.reloads(),1);
});

test('failed committed display application requires recovery before fast Start or ranked actions',async t=>{
 const data={'sq-coins':'650','sq-settings':'{"v":2,"res":"0.5"}','sq-muted':'1','sq-vol':'{"s":20,"m":70}'},f=await setup(t,{pause:null,holdStart:false,importData:data,failSettings:true});await f.app.load();assert.equal(f.store.get('sq-coins'),'650');assert.equal(f.store.has('sq-import-backup-v1'),false);await f.app.startRun();assert.equal(f.app.state().mode,'recovery');assert.deepEqual(f.app.audioApplied(),[data]);await f.app.rankedAction('start');t.mock.timers.tick(1000);assert.equal(f.reloads(),0);assert.equal(f.calls.includes('run'),false);assert.equal(f.store.get('sq-muted'),'1');
});

// Mutations caught: unconditional saved-name writes during title reconciliation lose drafts;
// omitting explicit adoption refresh leaves stale names after an accepted import or cloud pull.
for(const draft of ['Before ','  ','Before ı'])test(`a title conflict merge preserves Ranked draft ${JSON.stringify(draft)}`,async t=>{
 const f=await mergedTitle(t);f.$('rankedname').value=draft;f.$('rankedname').oninput();
 await f.app.cloud.push(true);
 assert.equal(f.$('rankedname').value,draft);assert.equal(f.$('lbname').value,draft.trim()==='Before'?'Merged':draft.trim());
 assert.equal(f.app.state().selAdv,'wizard');assert.equal(f.reloads(),0);
});
test('title reconciliation preserves an unsaved end-screen draft after returning from a merged run',async t=>{
 const f=await mergedTitle(t);await f.start();f.app.mode('end');f.$('lbname').value='MyEdit';await f.app.cloud.push(true);
 assert.equal(f.$('lbname').value,'MyEdit');f.app.toMenu();await f.flush();assert.equal(f.$('lbname').value,'MyEdit');assert.equal(f.$('rankedname').value,'Merged');assert.equal(f.app.state().selAdv,'wizard');
});
test('fast Start after a deferred conflict merge preserves the edited name',async t=>{
 const f=await mergedTitle(t);await f.start();f.app.mode('end');f.$('lbname').value='KeepMe';await f.app.cloud.push(true);await f.start();
 assert.equal(f.$('lbname').value,'KeepMe');assert.equal(f.app.state().sim.players[0].adv,'wizard');
});
test('a conflict finishing during a title map load preserves both draft fields',async t=>{
 const f=await mergedTitle(t,{pause:'map'}),picking=f.track(f.app.pickMap('tutorial'));await f.gates.map.hit.promise;
 f.$('rankedname').value='Before ';f.$('rankedname').oninput();f.$('lbname').value='EndEdit';await f.app.cloud.push(true);f.finish();await picking;await f.flush();
 assert.deepEqual([f.$('rankedname').value,f.$('lbname').value],['Before ','EndEdit']);assert.equal(f.app.state().loadedMapId,'tutorial');assert.equal(f.$('start').disabled,false);
});
test('an input edit arriving during a cloud PUT survives the resulting title refresh',async t=>{
 const f=await mergedTitle(t,{pause:'push'}),saving=f.track(f.app.cloud.push(true));await f.gates.push.hit.promise;f.$('rankedname').value='Before ';f.$('rankedname').oninput();f.gates.push.gate.resolve();await saving;
 assert.equal(f.$('rankedname').value,'Before ');assert.equal(f.store.get('sq-name'),'"Merged"');assert.equal(f.$('lbname').value,'Merged');
});
for(const source of ['import','sign-in'])test(`accepted ${source} deliberately refreshes edited names before a fast Start`,async t=>{
 const data={'sq-coins':'250','sq-name':'"Accepted"'},f=await setup(t,{pause:null,holdStart:false,established:source==='pull',importData:data,cloudData:data,pullData:data});
 f.$('rankedname').value='Draft ';f.$('lbname').value='EndDraft';
 if(source==='import')await f.app.load();else if(source==='sign-in')await f.sign();else await f.pull();
 assert.deepEqual([f.$('rankedname').value,f.$('lbname').value],['Accepted','Accepted']);await f.start();assert.equal(f.store.get('sq-name'),'"Accepted"');assert.deepEqual([f.$('rankedname').value,f.$('lbname').value],['Accepted','Accepted']);t.mock.timers.tick(1000);assert.equal(f.reloads(),0);
});

test('manual import routes pending-run recovery correctly and never reorders simultaneous journals',async t=>{
 const f=await setup(t,{pause:null,holdStart:false});f.store.set('sq-coins','500');f.store.set('sq-run-save-v1',JSON.stringify({v:1,data:{'sq-coins':'609'}}));f.store.set('sq-import-backup-v1',JSON.stringify({v:1,before:{'sq-coins':'100'}}));const before=new Map(f.store);await f.app.load();assert.equal(f.app.state().mode,'recovery');const options=f.app.recoveryOptions();assert.equal(typeof options?.retry,'function','must select completed-run recovery');assert.equal(options.reload,true);f.app.walletBusy('buy',true);assert.equal(f.app.canRestartRecovery(),false);f.app.walletBusy('buy',false);assert.equal(f.app.canRestartRecovery(),true);assert.throws(()=>options.retry());assert.deepEqual(f.store,before);assert.equal(f.reloads(),0);
});

// Mutations caught: forced name adoption on automatic pull, or missing live checks
// before scheduling/firing the automatic reload, lose raw input or active typing.
for(const id of ['rankedname','lbname'])for(const timing of ['before','during'])test(`automatic pull preserves ${id} raw draft ${timing} GET`,async t=>{
 const data={'sq-coins':'700','sq-name':'"Other device"','sq-adv':'"wizard"'},f=await setup(t,{pause:timing==='during'?'pull':null,established:true,holdStart:false,initialName:'Before',pullData:data});
 const draft=' Çağrı 🧀 ';
 if(timing==='before')f.$(id).value=draft;
 const pending=f.pull();if(timing==='during'){await f.gates.pull.hit.promise;f.$(id).value=draft;f.gates.pull.gate.resolve();}await pending;
 assert.equal(f.$(id).value,draft);assert.equal(f.$(id==='rankedname'?'lbname':'rankedname').value,'Other device');t.mock.timers.tick(1000);assert.equal(f.reloads(),0);
 assert.equal(f.store.get('sq-coins'),'700');assert.equal(f.app.cloud.state().rev,2);await f.start();assert.equal(f.app.state().sim.players[0].adv,'wizard');assert.equal(f.$(id).value,draft);
});
for(const id of ['rankedname','lbname'])test(`automatic pull does not reload a focused same-value ${id}`,async t=>{
 const data={'sq-coins':'700','sq-name':'"Before"'},f=await setup(t,{pause:null,established:true,holdStart:false,initialName:'Before',pullData:data});f.$(id).focus();await f.pull();t.mock.timers.tick(1000);
 assert.equal(f.$(id).value,'Before');assert.equal(f.reloads(),0);assert.equal(f.store.get('sq-coins'),'700');assert.equal(f.app.cloud.state().rev,2);
});
for(const kind of ['draft','focus'])test(`automatic reload rechecks a ${kind} arriving after scheduling`,async t=>{
 const data={'sq-coins':'700','sq-name':'"Before"'},f=await setup(t,{pause:null,established:true,holdStart:false,initialName:'Before',pullData:data});await f.pull();
 if(kind==='draft')f.$('lbname').value=' Late edit ';else f.$('rankedname').focus();t.mock.timers.tick(1000);
 assert.equal(f.reloads(),0);assert.equal(f.store.get('sq-coins'),'700');assert.equal(f.$('lbname').value,kind==='draft'?' Late edit ':'Before');
});

for(const id of ['rankedname','lbname'])test(`automatic pull retains focused ${id} when the saved name changes`,async t=>{
 const data={'sq-coins':'700','sq-name':'"Other device"'},f=await setup(t,{pause:null,established:true,holdStart:false,initialName:'Before',pullData:data});f.$(id).focus();await f.pull();
 assert.equal(f.$(id).value,'Before');assert.equal(f.$(id==='rankedname'?'lbname':'rankedname').value,'Other device');t.mock.timers.tick(1000);assert.equal(f.reloads(),0);assert.equal(f.store.get('sq-name'),'"Other device"');
});
