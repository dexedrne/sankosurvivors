import {predictedView} from '../src/coop-view.js';
import {phaseCoins} from '../src/casual-continuation.js';
import{drawStormMinimap}from'../src/storm-effects.js';
import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{createSim,playerStats}from'../src/sim.js';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
function source(a,b){const i=main.indexOf(a),j=main.indexOf(b,i+1);assert(i>=0&&j>i,a);return main.slice(i,j);}
function actions(){
 const sent=[],sim=createSim({coop:true,players:[{id:'p1',adv:'adventurer'},{id:'p2',adv:'adventurer'}]});sim.pending.p2={choices:[{kind:'heal'}]};
 const f=Function('sim','sent',`const PLAYER='p2',coop={run:{action:a=>{sent.push(a);return true;}}},rankedRec=null;const coopDecision=7;let mode='levelup',shownPending=true,banishMode=false;const choose=()=>{throw Error('local mutation')},reroll=choose,skipLevel=choose,banish=choose,canBanish=()=>true,rankedChoice=choose,persistRanked=choose,showLevelUp=()=>{},audio={duck(){}},resumeAfterReward=()=>{},afterCasket=()=>{},$=()=>({classList:{add(){}}});
 ${source('function doReroll()', "$('reroll').onclick")}
 ${source('function doBanish(i)', "$('banishlv').onclick")}
 ${source('function pick(i)', '// ---- reward casket card')}
 ${source('function pickCasket(i', "$('ckwear').onclick")}
 return{pick,doReroll,doSkip,doBanish,pickCasket,casket(){sim.pending.p2.casket={};mode='casket';},state:()=>({mode,shownPending})};`)(sim,sent);
 return{f,sent,sim};
}
for(const [method,arg,expected]of[['pick',0,{kind:'choose',index:0}],['doReroll',undefined,{kind:'reroll'}],['doSkip',undefined,{kind:'skip'}],['doBanish',0,{kind:'banish',index:0}],['pickCasket',1,{kind:'choose',index:1}]])test('actual co-op '+method+' sends the local intent without mutating or hiding an unacknowledged choice',()=>{
 const {f,sent}=actions();if(method==='pickCasket')f.casket();const before=f.state();f[method](arg);assert.deepEqual(sent,[expected]);assert.deepEqual(f.state(),before);
});
test('actual solo-start handler cannot leave an active co-op lobby through a background button',async()=>{
 const start=Function('coop',`let runStarting=false,mode='coop';const rankedLive=()=>{throw Error('entered paid/solo startup');};${source('async function startRun(', 'let bannerT =')};return startRun;`)({});await assert.doesNotReject(()=>start());
});
test('actual guest GP calculation uses its own kills, coins and alch',()=>{
 const sim=createSim({coop:true,players:[{id:'p1'},{id:'p2'}]});sim.kills=600;sim.players[0].kills=594;sim.players[0].coins=20;sim.players[1].kills=6;sim.players[1].coins=2;sim.players[1].alch=7;
 const calculate=Function('PLAYER','playerStats','phaseCoins',`const savedPass=()=>null,DMT_COIN_BONUS=.25;const casualRun=null;${source('function runCoinOptions(', 'function cardImage(')};return runCoins;`)('p2',playerStats,phaseCoins);assert.equal(calculate(sim),14);assert.equal(calculate(sim,true),134);
});
test('public lobby loadout sends only worn reinforcement levels and known cleared maps',()=>{
 const make=Function('MAP_BY_ID',`const selAdv='ranger',runAdv=()=>({id:'ranger'}),getGear=()=>({head:'Bronze Helmet'}),getGearLv=()=>({'Bronze Helmet':1,'Runite Helmet':3}),getSkills=()=>({combat:2}),clearedMaps=()=>new Set(['greentown','future-zone']),$=()=>({value:' Guest fixture '});${source('function coopLoadout()', 'function openCoop()')};return coopLoadout;`)({greentown:{}});
 assert.deepEqual(make(),{name:'Guest fixture',adv:'ranger',gear:{head:'Bronze Helmet'},gearLv:{'Bronze Helmet':1},meta:{combat:2},cleared:['greentown']});
});
test('lobby entry refuses active play, recovery, pending payments and an outstanding wallet operation',()=>{
 for(const [mode,canReload,pending]of[['play',true,false],['recovery',true,false],['title',false,false],['title',true,true]]){
  const notes=[],open=Function('mode','canManuallyReload','readRanked','banner','progressCanLoad','selVariant',source('function openCoop()', "$('coopbtn').onclick")+';return openCoop;')(mode,()=>canReload,()=>pending?{}:null,(...a)=>notes.push(a),()=>true,'normal');assert.doesNotThrow(()=>open());assert.equal(notes.length,1);
 }
});
test('actual co-op render loop never advances a second clock in play or a local pause menu',async()=>{
 const{default:vm}=await import('node:vm'),{createCoopRun}=await import('../src/coop-run.js'),{snapshot}=await import('../src/sim.js');
 const game={protocol:1,epoch:'00112233445566778899aabbccddeeff',build:'test-local',sim:'0f890c11956a',ground:'0',seed:711,map:'greentown',hard:false,endless:false,players:['p1','p2'].map(id=>({id,loadout:{name:id,adv:'adventurer',meta:{},gear:{},gearLv:{},cleared:[]}}))},run=createCoopRun({start:game,localId:'p1',ground:null,send(){}});run.begin(0);
 const nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',classList:{add(){},remove(){},toggle(){},contains(){return true;}}});return nodes.get(id);};
 const context={predictedView,enforceRankedDeadline:()=>false,syncRankedClock(){},setMapPeek(){},hideItemInspection(){},inspectedElement:null,waitingForMove:false,document:{hidden:false},petViewer:null,bunCompanions:{sync(){}},bunChoice:()=>null,selectedPet:null,requestAnimationFrame(){},renderer:{getSettings:()=>({fps:0}),update:()=>0},readInput:()=>({mx:1,mz:0,pad:[]}),padEdges:()=>({}),navMove(){},navBack(){},navPress(){},navScreen:()=>({id:'title'}),$,snapshot,PLAYER:'p1',audio:{onFx(){},duck(){}},MAP_BY_ID:{},updateHud(){},drawMinimap(){},console,step(){throw Error('second simulation clock');},endRun(){throw Error('unverified completion');}};
 vm.createContext(context);vm.runInContext(`const TICK=1/30;let coop={run:null},sim=null,mode='play',last=0,frame=0,acc=0,hudT=0,slowmo=0,lastDrawn=0,lastMenuDrawn=-Infinity,pendingUse=null,coopDecision=-1;${source('function syncCoopRun(', '// ---- solo and ranked startup')};${source('function loop(ts)', 'boot().then(')};globalThis.setup=(r)=>{coop.run=r;sim=r.sim;};globalThis.pauseMenu=()=>mode='pause';globalThis.render=loop;`,context);context.setup(run);for(let i=0;i<10;i++)context.render(i*40+1000);assert.equal(run.frame,0);assert.equal(run.sim.tick,0);assert(run.advance());assert.equal(run.frame,1);context.pauseMenu();for(let i=0;i<10;i++)context.render(i*40+2000);assert.equal(run.frame,1);assert.equal(run.sim.tick,1);
});
test('guest upgrade previews use the guest weapon metal by default',async()=>{
 const{weaponStep}=await import('../src/content.js'),sim=createSim({coop:true,players:[{id:'p1'},{id:'p2'}]});sim.players[0].wm.bow=0;sim.players[1].wm.bow=2;const text=main.split('\n').find(s=>s.startsWith('const stepOf ='));const step=Function('sim','PLAYER','weaponStep',text+';return stepOf;')(sim,'p2',weaponStep);assert.equal(step('bow'),2);
});
test('guest minimap keeps itself centred and marks the other adventurer',()=>{
 const arcs=[],ctx=new Proxy({fillStyle:'',arc(x,z,r){arcs.push({x,z,r,color:this.fillStyle});}},{get:(o,k)=>k in o?o[k]:()=>{}}),view={players:[{id:'p1',x:10,z:10,f:0,al:1},{id:'p2',x:20,z:20,f:0,al:1}],pickups:[],enemies:[]};
 const draw=Function('mmx','drawStormMinimap',`const PLAYER='p2',sim={coop:true,map:{r:1000}},mmImg={src:'fixture'},mm={width:100},renderer={getYaw:()=>0},ENEMIES={};${source('function drawMinimap(', '// ---- main loop')};return drawMinimap;`)(ctx,drawStormMinimap);draw(view);assert(arcs.some(a=>a.x===-24&&a.z===-24&&a.color==='#69c8ff'));
});
test('joining another map keeps the selected ordinary adventurer until the room applies its own forced rules',()=>{
 const make=Function('MAP_BY_ID',`const selAdv='wizard',runAdv=()=>({id:'alex'}),getGear=()=>({head:'Bronze Helmet'}),getGearLv=()=>({'Bronze Helmet':1}),getSkills=()=>({}),clearedMaps=()=>new Set(),$=()=>({value:'Guest'});${source('function coopLoadout()', 'function openCoop()')};return coopLoadout;`)({greentown:{}});const me=make();assert.equal(me.adv,'wizard');assert.deepEqual(me.gear,{head:'Bronze Helmet'});
});

test('a cancelled world load must settle before another co-op lobby can start',()=>{
 const notes=[],open=Function('canManuallyReload','progressCanLoad','readRanked','banner',`const mode='title',selVariant='normal';${source('function openCoop()', "$('coopbtn').onclick")};return openCoop;`)(()=>true,()=>false,()=>null,text=>notes.push(text));assert.doesNotThrow(()=>open());assert.equal(notes.length,1);
});


test('cancelled gear preload keeps new lobby and solo admission blocked until restoration settles',async()=>{
 const nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,{value:'',disabled:false,textContent:'',classList:{add(){},remove(){},toggle(){}},focus(){}});return nodes.get(id);};
 let release;const gear=new Promise(r=>release=r),clients=[],maps=[],notes=[];
 const f=Function('$','gear','clients','maps','notes',`let mode='title',selVariant='normal',coop=null,coopHomeMap=null,coopLoading=false,coopResult=null,lastRun=null,selMap='greentown',loadedMapId='greentown',runStarting=false,mapLoading=false;const coopRelay='ws://127.0.0.1/coop',BUILD='fixture',SIM_ID='fixture',renderer={preloadGear:()=>gear};const rankedBusy=false,rankedLive=()=>false,buyBusy=false,walletConnecting=null,holderChecking=null,walletRequests=0,walletModalOpen=()=>false,cloudConnecting=null;${source('const cloudCanLoad =', 'function cancelPendingLoads()')}
 const readRanked=()=>null,banner=t=>notes.push(t),cancelPendingLoads=()=>{},load=()=>'',createCoopClient=options=>{const c={closed:false,options};clients.push(c);return c;},pickMap=async id=>{maps.push(id);selMap=loadedMapId=id;},runGround=()=>null;
 ${source('function openCoop()', "$('coopbtn').onclick")}
 ${source('async function startRun(', 'let bannerT =')}
 return{openCoop,startRun,cancel(){coop.closed=true;coop=null;mode='title';selMap=loadedMapId='greentown';},canLoad:cloudCanLoad,state:()=>({selMap,loadedMapId,runStarting})};` )($,gear,clients,maps,notes);
 f.openCoop();assert.equal(clients.length,1);const pending=clients[0].options.load({map:'apache',players:[]});await Promise.resolve();await Promise.resolve();assert.deepEqual(maps,['apache']);f.cancel();assert.equal(f.canLoad(),false,'cancelled gear work still owns startup');f.openCoop();assert.equal(clients.length,1,'new lobby blocked');await assert.doesNotReject(f.startRun);release();await assert.rejects(pending,/cancelled/i);assert.deepEqual(maps,['apache','greentown']);assert.equal(f.canLoad(),true);f.openCoop();assert.equal(clients.length,2,'new lobby allowed only after old cleanup');assert.equal(f.state().loadedMapId,'greentown');
});

for(const [method,arg,casket]of[['pick',0,false],['doReroll',undefined,false],['doSkip',undefined,false],['doBanish',0,false],['pickCasket',1,true]])test('actual '+method+' binds the displayed reward revision',async()=>{
 const{createCoopRun}=await import('../src/coop-run.js'),{openCasket}=await import('../src/sim.js');
  const game={protocol:1,epoch:'00112233445566778899aabbccddeeff',build:'test-local',sim:'0f890c11956a',ground:'0',seed:711,map:'greentown',hard:false,endless:false,players:['p1','p2'].map(id=>({id,loadout:{name:id,adv:'adventurer',meta:{},gear:{},gearLv:{},cleared:[]}}))};const run=createCoopRun({start:game,localId:'p1',ground:null,send(){}});run.begin(0);const sim=run.sim;sim.spawnAcc=-1e9;sim.bossIndex=99;sim.eventT=sim.shrineT=1e9;const player=sim.players[0];sim.gems.push({id:sim.nextId++,x:player.x,z:player.z,v:sim.xpNeed,vx:0,vz:0});run.advance();let shown=run.decision('p1');assert(sim.pending.p1);assert(run.action({kind:'reroll'},shown));run.advance();assert.notEqual(run.decision('p1'),shown);
  if(casket){delete sim.pending.p1;player.casketQ.push('Bronze Arrow','Iron Arrow');openCasket(sim,player);run.advance();const shownCasket=run.decision('p1');shown=shownCasket;assert(run.action({kind:'choose',index:0},shownCasket));run.advance();}
  const pending=structuredClone(sim.pending.p1);const f=Function('sim','run','coopDecision',`const PLAYER='p1',coop={run},rankedRec=null;let mode='${casket?'casket':'levelup'}',shownPending=true,banishMode=false;const canBanish=()=>true;${source('function doReroll()', "$('reroll').onclick")}${source('function doBanish(i)', "$('banishlv').onclick")}${source('function pick(i)', '// ---- reward casket card')}${source('function pickCasket(i', "$('ckwear').onclick")}return{pick,doReroll,doSkip,doBanish,pickCasket};`)(sim,run,shown);f[method](arg);run.advance();assert.deepEqual(sim.pending.p1&&{...sim.pending.p1,left:0},{...pending,left:0},method+' must not resolve a newer choice');
  assert.equal(run.action({kind:'choose',index:0},shown),false,'explicit stale revision refused');assert(run.action({kind:'choose',index:0},run.decision('p1')),'freshly displayed choice accepted');run.advance();
});


test('title map choices cannot mutate the renderer while cancelled co-op loading still owns it',async()=>{
 const pickMap=Function(`const mapLoading=false,coopLoading=true;${source('async function pickMap(', 'const MODE_INFO =')};return pickMap;`)();await assert.doesNotReject(()=>pickMap('apache'));
});

test('automatic co-op heal choices use the displayed decision revision',async()=>{
 const{createCoopRun}=await import('../src/coop-run.js');const game={protocol:1,epoch:'00112233445566778899aabbccddeeff',build:'test-local',sim:'0f890c11956a',ground:'0',seed:711,map:'greentown',hard:false,endless:false,players:['p1','p2'].map(id=>({id,loadout:{name:id,adv:'adventurer',meta:{},gear:{},gearLv:{},cleared:[]}}))};const run=createCoopRun({start:game,localId:'p1',ground:null,send(){}});run.begin(0);const sim=run.sim;sim.pending.p1={choices:[{kind:'heal',level:1,rarity:'common'}],left:20};run.advance();const shown=run.decision('p1'),nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,{setAttribute(){},classList:{add(){},remove(){}}});return nodes.get(id);};
 const show=Function('sim','run','coopDecision','$',`const PLAYER='p1',coop={run},rankedRec=null,preloadNextIcons=()=>{},autoChoice=()=>0;let banishMode=false;${source('function pick(i)', '// ---- reward casket card')}${source('function showLevelUp()', '  if (!pend) return;')}};return showLevelUp;`)(sim,run,shown,$);show();run.advance();assert.equal(sim.pending.p1,undefined);
});

test('failed cancellation restoration reports the error and disables title play until map reload',async()=>{
 let release;const gear=new Promise(r=>release=r),start={disabled:false},notes=[];
 const f=Function('gear','start','notes',`let coopLoading=false;const c={closed:false},coop=c,homeMap='greentown',loadedMapId='apache',renderer={preloadGear:()=>gear},runGround=()=>null,pickMap=async()=>{throw Error('fixture map unavailable');},$=()=>start,banner=t=>notes.push(t);const options={${source('    load:async game => {','    onRoom:')}};return{load:options.load,c,loading:()=>coopLoading};`)(gear,start,notes);
 const pending=f.load({map:'apache',players:[]});assert.equal(f.loading(),true);f.c.closed=true;release();await assert.rejects(pending,/cancelled/i);assert.equal(start.disabled,true);assert.equal(f.loading(),false,'map picker can retry after the failed operation settles');assert.deepEqual(notes,['Could not restore the selected map.']);
});
