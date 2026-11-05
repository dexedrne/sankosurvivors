import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createCloud } from '../src/cloud.js';
import * as W from '../src/wallet.js';
import { prove as proveHolder } from '../src/dmt.js';
import { importProgress as importProgressImpl, recoverProgressImport as recoverProgressImportImpl } from '../src/progress-import.js';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const cloudBlock=main.slice(main.indexOf('let cloudConnecting ='),main.indexOf('onSaved = (k)'));
const pull=main.slice(main.indexOf('const cloudPull ='),main.indexOf("document.addEventListener('visibilitychange'",main.indexOf('const cloudPull =')));
const start=main.slice(main.indexOf('async function startRun('),main.indexOf('let bannerT ='));
const action=main.slice(main.indexOf('async function rankedAction('),main.indexOf('// the wallet the entry'));
const rankedStart=main.slice(main.indexOf('async function startRankedEntry('),main.indexOf('async function submitRanked()'));
const menu=main.slice(main.indexOf('function toMenu()'),main.indexOf('// ---- input ---'));
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
async function setup(t,{pause='login',established=false,holdStart=true,failStart=false,browserFailure=null,noBrowserApis=false,importData={'sq-coins':'100'},importFailure=null,holderReply=false}={}){
  const previous=globalThis.localStorage,previousWindow=globalThis.window,store=new Map(established?[['sq-coins','500'],['sq-cloud',JSON.stringify({a:A,key:'fixture-key',rev:1})],['sq-cloud-base',JSON.stringify({'sq-coins':'500'})]]:[]);
  let writesBlocked=false,importFailed=false,holderActive=false,traceConnect=false;
  globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>{if(importFailure==='reserve'&&k==='sq-import-backup-v1')throw Error('fixture quota');if(writesBlocked)throw Error('fixture storage blocked');if(importFailure&&k==='sq-name'&&v==='\"Imported\"'&&!importFailed){importFailed=true;writesBlocked=importFailure==='persistent';throw Error('fixture import write failure');}store.set(k,String(v));},removeItem:k=>{if(writesBlocked)throw Error('fixture storage blocked');store.delete(k);}};globalThis.window={};
  t.mock.timers.enable({apis:['setTimeout']});
  const gates=Object.fromEntries(['nonce','signature','login','pull','push','map','gear','choice','registrations','worker-update','cache-keys','cache-delete','version','import-lock','holder-connect','holder-account','holder-signature','holder-response'].map(k=>[k,{hit:deferred(),gate:deferred()}])),calls=[],pending=[];
  let reloads=0;
  const stage=async name=>{gates[name].hit.resolve();if(pause===name||holdStart&&['map','gear'].includes(name))await gates[name].gate.promise;};
  const w={p:{on(){},request:async({method})=>{if(method==='personal_sign'){await stage(holderActive?'holder-signature':'signature');return'fixture-signature';}if(method==='eth_requestAccounts'&&traceConnect)await stage(holderActive?'holder-account':'holder-connect');if(method==='wallet_revokePermissions')return null;return[A];}}};
  await W.connect(w);traceConnect=true;
  const other={p:{on(){},request:async args=>{if(args.method==='eth_requestAccounts')await stage('holder-connect');else if(args.method==='personal_sign')await stage('holder-signature');return args.method==='personal_sign'?'fixture-signature':[A];}}};
  t.mock.method(globalThis,'fetch',async(url,options={})=>{
    const route=url.split('/').pop();calls.push(route);
    if(route==='nonce')return reply({nonce:'fixture-holder-nonce',message:'fixture holder only'});
    if(route==='holder'){await stage('holder-response');const body=JSON.parse(options.body);return reply({address:body.address,holder:holderReply,pass:holderReply?'fixture-holder-pass':undefined,balance:'10'});}
    if(route==='save-nonce'){await stage('nonce');return reply({nonce:'fixture-nonce',message:'fixture sign-in'});}
    if(route==='save-login'){await stage('login');return reply({address:A,key:'login-fixture-key',rev:1,data:{'sq-coins':'100'}});}
    if(route==='save-get'){await stage('pull');return reply({rev:2,data:{'sq-coins':'700'}});}
    if(route==='save-put'){await stage('push');const body=JSON.parse(options.body);return reply({ok:true,rev:body.rev+1});}
    if(route==='version.json'){await stage('version');return reply({build:'fixture-new'});}
    if(route==='run')return reply({ticket:'fixture-ticket'});
    throw Error('unexpected fixture route '+route);
  });
  const browserStage=async name=>{calls.push(name);await stage(name);if(browserFailure===name)throw Error('fixture browser API failure');};
  const nodes=new Map(),$=id=>{
    if(!nodes.has(id)){const classes=new Set(['hidden']);nodes.set(id,{value:id==='rankedadv'?'adventurer':id==='rankedname'?'Fixture':'',textContent:'',disabled:false,dataset:{},focus(){if(id==='cloudusewal')gates.choice.hit.resolve();},querySelectorAll:()=>[],replaceChildren(){},classList:{contains:c=>classes.has(c),add:c=>classes.add(c),remove:c=>classes.delete(c),toggle:(c,on)=>on?classes.add(c):classes.delete(c)}});}return nodes.get(id);
  };
  const app=Function('createCloud','walletNow','walletRevision','onWallet','$','location','gearStage','mapStage','failStart','navigator','caches','requestWallet','prove','importData','importProgress','recoverProgressImport','otherWallet',`
    let buyBusy=null,walletConnecting=null,walletUi=false,walletBal=null;const walletModalOpen=()=>walletUi;
    let mode='title',sim=null,rankedRun=null,rankedRec=null,rankedBusy=false,storedLive=null,runTicket=null,mapLoading=false,loadedMapId='greentown',selMap='greentown',selAdv='adventurer',acc=0,selCard=0,shownPending=false,waitingForMove=false,rewardWasShown=false,pendingUse=null,slowmo=0,runBest=null,passedBest=false,chase=null;
    const BASE='./',PLAYER='p',SIM_ID='fixture-sim',params=new URLSearchParams(),keys=new Set(),slotCache={},WEAPONS={},PASSIVES={};
    const map={id:'greentown',name:'Greentown',length:900,finalBoss:'dragon',music:'fixture'},MAP_BY_ID={greentown:map};
    const hardOn=false,endlessOn=false,rankedWeek={map:'greentown'},rankedLive=()=>storedLive,rankedPlaying=()=>!!rankedRun&&!!sim&&!sim.over;
    const renderer={async preloadGear(){await gearStage();if(failStart)throw Error('fixture gear failure');},reset(){},setZoom(){},setShift(){},setYaw(){},setAura(){}};
    const pickMap=async id=>{await mapStage();loadedMapId=id;},audio={init:async()=>{},music(){}};
    const getCoins=()=>Number(JSON.parse(localStorage.getItem('sq-coins')||'0')),xferRead=code=>code==='fixture-code'?{data:importData}:{error:'fixture invalid code'};
    const getGear=()=>({}),getGearLv=()=>({}),getSkills=()=>({}),getBests=()=>({}),runGround=()=>null,runAdv=()=>({id:'adventurer',weapon:'Sword'}),bestKey=()=>'';
    const makeSim=()=>({map,players:[{}],pending:{},over:null,t:0}),createSim=makeSim,resumeRankedAsync=async()=>({sim:makeSim(),rec:{log:()=>({runs:[]})}});
    const banner=()=>{},preloadIcons=()=>{},weaponItem=()=>'',passiveItem=()=>'',clearTouch=()=>{},showLevelUp=()=>{},persistRanked=()=>{},fmtT=s=>String(s),slayName=()=> 'Dragon',kpmWeek=()=>false,liveRace=live=>live;
    const renderWallet=()=>{},renderDmt=()=>{},refreshBalances=()=>{},wallets=()=>[],short=a=>a,renderRanked=()=>{},rankedMessage=()=>{},openRanked=()=>{},why=e=>e.message,plain=s=>Error(s),applyDmt=()=>{},buildAdventurers=()=>{},buildMaps=()=>{},showBest=()=>{},submitRanked=async()=>{};
    const readRanked=(key,fallback=null)=>key==='sq-ranked-live'?storedLive:fallback,writeRanked=(key,value)=>{if(key==='sq-ranked-live')storedLive=value;};
    const rankedApi=async()=>({run:'fixture-run',seed:1,map:'greentown',week:0,mode:'normal'}),RunRecorder=class{log(){return{runs:[]};}};
    ${cloudBlock}
    ${connectWrapper}
    ${holder}
    function bindPerks(c,msg){${perks}}
    const cloudFor=c=>{const s=cloud.state();return s&&c&&s.a.toLowerCase()===c.address.toLowerCase()?s:null;};
    ${bind}
    ${lock}
    function showProgressRecovery(){mode='recovery';}
    const stopWallet=${observer}
    ${updater}
    ${importer}
    ${pull}
    ${action}
    ${rankedStart}
    ${start}
    ${menu}
    return{cloud,dispose:stopWallet,holder:kind=>kind==='new'?connectDmt(otherWallet):kind==='same'?connectDmt(walletNow().w):(bindPerks(walletNow(),()=>{}),$('wlperks').onclick()),cloudUI:()=>{bindCloud(walletNow(),()=>{});return $('wlcloud').onclick();},recover:()=>recoverProgressImport(localStorage),startRun,rankedAction,startRankedEntry,recoverRankedRun,toMenu,pull:cloudPull,mode:v=>mode=v,state:()=>({mode,rankedBusy,sim}),setLive:v=>storedLive=v,update:()=>$('updatebtn').onclick(),check:checkForUpdate,load:(sure=true)=>{$('xferin').value='fixture-code';$('xferload').dataset.sure=sure?'1':'';return $('xferload').onclick();},walletBusy:(kind,value)=>{if(kind==='buy')buyBusy=value?{}:null;else if(kind==='connect')walletConnecting=value?{}:null;else walletUi=value;}};
  `)(createCloud,W.current,W.walletRevision,W.onWallet,$,{reload(){reloads++;}},()=>stage('gear'),()=>stage('map'),failStart,
    noBrowserApis?{}:{locks:{request:async(name,fn)=>{calls.push('import-lock');await stage('import-lock');return fn();}},serviceWorker:{getRegistrations:async()=>{await browserStage('registrations');return[{update:async()=>browserStage('worker-update')}];}}},
    noBrowserApis?{}:{keys:async()=>{await browserStage('cache-keys');return['sqs-v3'];},delete:async()=>{await browserStage('cache-delete');return true;}},W.connect,async(...args)=>{holderActive=true;try{return await proveHolder(...args);}finally{holderActive=false;}},importData,importProgressImpl,recoverProgressImportImpl,other);
  const track=p=>{pending.push(p);p.catch(()=>{});return p;};
  t.after(async()=>{for(const x of Object.values(gates))x.gate.resolve();t.mock.timers.tick(1000);await Promise.allSettled(pending);app.dispose();writesBlocked=false;W.disconnect();globalThis.localStorage=previous;globalThis.window=previousWindow;});
  return{app,store,gates,calls,$,allowWrites:()=>writesBlocked=false,reloads:()=>reloads,sign:()=>track(app.cloud.signIn(W.current())),pull:()=>track(app.pull()),update:()=>track(app.update()),check:()=>track(app.check()),
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
