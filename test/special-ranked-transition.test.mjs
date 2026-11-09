import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createSim, findWalkable } from '../src/sim.js';
import { MAP_BY_ID, ADVENTURER_BY_ID } from '../src/content.js';
import { VARIANTS, BOSS_KIT, WISE_OLD_MAN } from '../src/game-modes.js';

const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
function block(name){const at=main.indexOf(`function ${name}(`),end=main.indexOf('\n}',at);assert.ok(at>=0&&end>at);return main.slice(main.slice(at-6,at)==='async '?at-6:at,end+2);}
const idle=main.slice(main.indexOf('        if (!window.__idleSim) {'),main.indexOf('        const v = snapshot(window.__idleSim)'));
function harness(variant,route,{failLoad=false}={}){
 const nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,{value:id==='rankedadv'?'ranger':'Fixture',disabled:false,textContent:'',children:[],classList:{add(){},remove(){},toggle(){}},setAttribute(){}});return nodes.get(id);};
 let release,loading;const gate=new Promise(r=>release=r),hit=new Promise(r=>loading=r),saved=new Map();
 const live={run:'local-fixture',sim:'fixture',seed:11,map:'apache',adv:'ranger',week:1,mode:'normal',log:{runs:[]},clockVersion:0};
 if(route!=='entry')saved.set('sq-ranked-live',live);
 const c={$,MAP_BY_ID,ADVENTURER_BY_ID,VARIANTS,BOSS_KIT,WISE_OLD_MAN,createSim,findWalkable,window:{},PLAYER:'p1',selVariant:variant,selMap:variant==='fun'?'oasis':'greentown',fieldMap:'greentown',loadedMapId:variant==='fun'?'oasis':'greentown',selAdv:'adventurer',trialBoss:'giant',hardOn:false,endlessOn:false,mapLoading:false,runStarting:false,coop:null,coopLoading:false,mode:'title',sim:null,rankedRun:null,rankedRec:null,rankedClock:null,runTicket:null,casualRun:null,merchantVisit:null,coopResult:null,MODE_INFO:{},SIM_ID:'fixture',BUILD:'fixture',BASE:'fixture',rankedWeek:{map:'apache'},liveRace:live=>live,kpmWeek:()=>false,raceOf:()=>({rows:[]}),walletNow:()=>null,titleProgressPending:false,params:new URLSearchParams(),WEAPONS:{},PASSIVES:{},slotCache:{},keys:new Set(),enforceRankedDeadline:()=>false,syncRankedClock(){},showLevelUp(){},getGear:()=>({}),getGearLv:()=>({}),getSkills:()=>({}),save(){},cancelPendingLoads(){},buildAdventurers(){},buildMaps(){},showBest(){},updateModePicker(){},refreshPendingTitleProgress(){},playTitleMusic(){},audio:{music(){},init:async()=>{}},preloadIcons(){},runGround:()=>null,clearTouch(){},loadCasualTickets(){},profileBest:x=>x,getBests:()=>({}),bestKey:()=>'',fmtT:String,slayName:()=>'',banner(){},applyDmt(){},persistRanked(){},rankedMessage(){},rankedApi:async()=>({run:live.run,seed:live.seed,map:'apache',week:1,mode:'normal'}),requireRankedBuild:async()=>{},rankedConsent:()=>0,rankedAction:async fn=>fn(),readRanked:(key,fallback=null)=>saved.get(key)??fallback,writeRanked:(key,value)=>saved.set(key,value),RunRecorder:class{log(){return{runs:[]};}},resumeRankedAsync:async()=>({sim:createSim({map:MAP_BY_ID.apache}),rec:{}}),rankedLive:()=>saved.get('sq-ranked-live'),rankedPlaying:()=>false,openRanked(){},renderer:{async loadMap(){loading();await gate;if(failLoad)throw Error('fixture map unavailable');},preloadGear:async()=>{},reset(){},setZoom(){},setShift(){},setYaw(){},setAura(){}},localStorage:{removeItem:key=>saved.delete(key)}};
 vm.createContext(c);
 vm.runInContext(`const runAdv=()=>selVariant==='wizard'?WISE_OLD_MAN:ADVENTURER_BY_ID[selVariant==='boss'?BOSS_KIT.adv:selAdv];${['pickMap','startRun','startRankedEntry','recoverRankedRun','toMenu'].map(block).join('\n')}`,c);
 return{c,hit,release,preview:()=>vm.runInContext(idle+';window.__idleSim',c),start:()=>route==='entry'?c.startRankedEntry({id:1,entry:'local-fixture'}):route==='recover'?c.recoverRankedRun():c.startRun(live)};
}

for(const variant of ['wizard','fun'])for(const route of ['entry','recover','direct'])test(`${variant} → ranked ${route} normalizes before Apache loads and menu/retry stay playable`,async()=>{
 const f=harness(variant,route),pending=f.start();await f.hit;
 try{
  assert.equal(f.c.selVariant,'normal');assert.equal(f.c.selMap,'apache');
  assert.doesNotThrow(f.preview);assert.equal(f.c.window.__idleSim.players[0].adv,'adventurer');
 }finally{f.release();await pending;}
 f.c.toMenu();assert.equal(f.c.selVariant,'normal');assert.equal(f.c.selMap,'apache');assert.doesNotThrow(f.preview);
 f.c.rankedLive=()=>null;await f.c.startRun();assert.equal(f.c.sim.map.id,'apache');assert.equal(f.c.sim.variant,undefined);assert.notEqual(f.c.sim.players[0].adv,'wise-old-man');
});

for(const variant of ['wizard','fun'])test(`${variant} → failed ranked map load leaves a normal playable menu for retry`,async()=>{
 const f=harness(variant,'entry',{failLoad:true}),pending=f.start();await f.hit;f.release();await assert.rejects(pending,/fixture map unavailable/);
 f.c.toMenu();assert.equal(f.c.selVariant,'normal');assert.doesNotThrow(f.preview);
 f.c.renderer.loadMap=async()=>{};f.c.rankedLive=()=>null;await f.c.startRun();assert.equal(f.c.sim.map.id,'apache');assert.equal(f.c.sim.variant,undefined);
});
