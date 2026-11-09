import test from 'node:test';
import assert from 'node:assert/strict';
import { petChoice } from '../src/pets.js';
import { createBunCompanions } from '../src/bun-companions.js';
import { readFileSync } from 'node:fs';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8'),render=readFileSync(new URL('../src/render.js',import.meta.url),'utf8');
const helpers=main.slice(main.indexOf('function applySavedGraphics('),main.indexOf('async function boot()'));
const boot=main.slice(main.indexOf('async function boot()'),main.indexOf('// ---- gear'));
const petInit=main.slice(main.indexOf('async function applyPetChoice()'),main.indexOf("$('petsbtn').onclick"));
const currentPetSource=main.slice(main.indexOf('function currentPetChoice()'),main.indexOf('function buildPets()'));
const apply=render.slice(render.indexOf('  function applySettings('),render.indexOf('  // rain: streaks',render.indexOf('  function applySettings(')));
const defaults=render.slice(render.indexOf('  const settings = {'),render.indexOf('  // time of day:',render.indexOf('  const settings = {')));
let cleanSettings=null;
try{({cleanSettings}=await import('../src/settings.js'));}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
async function start(raw,petPending=false){
 return Function('raw','cleanSettings','factoryDefaults','petPending','petChoice','createBunCompanions',`'use strict';
  const store=new Map([['sq-settings',JSON.stringify(raw)],['sq-coins','850']]),nodes=new Map();
  const $=id=>{if(!nodes.has(id))nodes.set(id,{disabled:true,textContent:'',style:{},classList:{add(){},contains:()=>true}});return nodes.get(id);};
  const load=(key,fallback)=>JSON.parse(store.get(key)||'null')??fallback,save=(key,v)=>store.set(key,JSON.stringify(v)),params=new URLSearchParams();
  let applied=null,caught=null,renderer=null,rendererDefaults=null;const console={error:e=>caught=e},getGear=()=>({}),labels={},selMap='greentown';
  const playTitleMusic=()=>{};
  let selectedPet=petPending?'chicken':null,petRequest=0;const petRequests=[];
  const bunCompanions=createBunCompanions({walletNow:()=>null,walletRevision:()=>0,onChange:()=>{}});
  ${currentPetSource}
  ${petInit}
  const createRenderer=async()=>({setPet(id){petRequests.push(id);return petPending?new Promise(()=>{}):Promise.resolve(true);},preloadGear:async()=>{},getSettings:()=>({...factoryDefaults}),applySettings:v=>applied=v,setZoom(){},setShift(){}}),pickAssetHost=async()=>{},buildAdventurers=()=>{},buildMaps=()=>{},showBest=()=>{},requestAnimationFrame=()=>{},loop=()=>{};
  ${helpers}
  ${boot}
  return (async()=>{await boot();return{disabled:$('start').disabled,applied,error:caught?.message||null,coins:store.get('sq-coins'),saved:JSON.parse(store.get('sq-settings')),petRequests};})();
 `)(raw,cleanSettings,Function('low',defaults+';return {...settings};')(true),petPending,petChoice,createBunCompanions);
}
function change(next,then){
 return Function('next','then','cleanSettings',`'use strict';
  const low=true,window={devicePixelRatio:2};${defaults}
  let ratio=null,settingsReady=false,roofsOff=false,folCell='',SMALL_DIST=34;
  const renderer={shadowMap:{enabled:true},setPixelRatio:v=>{assertRatio(v);ratio=v;}},sun={castShadow:false,shadow:{mapSize:{x:1024,set(){}},camera:{}}},scene={traverse(){}};
  const bloom={},bokeh={},gtao={},grade={},folMeshes={},roofHidden=new Set(),rainGroup={},rainOn=()=>false,waterMat={specular:{set(){}},shininess:0},groundMat={},fxaa={},applyTime=()=>{},resize=()=>{};
  const PR={low:0.6,medium:1,high:2,auto:1.25},autoPR=1.25;
  function assertRatio(v){if(!Number.isFinite(v)||v<=0||v>4)throw Error('Invalid renderer pixel ratio '+String(v));}
  ${apply}
  applySettings(next);if(then!==undefined)applySettings(then);return{settings,ratio,distance:SMALL_DIST,plain:Object.getPrototypeOf(settings)===Object.prototype};
 `)(next,then,cleanSettings);
}
for(const raw of ['broken',42,false,{v:{valueOf:0,toString:0}}])test('strict boot survives malformed graphics settings '+JSON.stringify(raw),async()=>{
 const result=await start(raw);assert.equal(result.error,null);assert.equal(result.disabled,false);assert.equal(result.coins,'850');assert.equal(result.applied.roofs,'off');assert.equal(result.applied.quality,'auto');
});
test('valid existing settings and legacy migration keep their values',async()=>{
 const current=await start({v:2,quality:'low',res:'0.5',fps:'30',shadows:false});assert.equal(current.error,null);assert.equal(current.disabled,false);assert.equal(current.applied.res,'0.5');assert.equal(current.applied.quality,'low');
 const old=await start({quality:'high',roofs:'auto',res:'0.75'});assert.equal(old.saved.v,2);assert.equal(old.applied.quality,'auto');assert.equal(old.applied.roofs,'off');assert.equal(old.applied.res,'0.75');
});
test('boot starts optional companion loading without waiting or changing saved progress',async()=>{
 const result=await start({v:2,quality:'low'},true);assert.equal(result.error,null);assert.equal(result.disabled,false);assert.equal(result.coins,'850');assert.deepEqual(result.petRequests,['chicken']);
});
for(const res of ['0','-2','Infinity','NaN','1000000',0,{},[]])test('renderer ignores invalid resolution '+JSON.stringify(res),()=>{
 const result=change({res});assert.ok(Number.isFinite(result.ratio)&&result.ratio>0&&result.ratio<=4);assert.equal(result.settings.res,'auto');
});
test('renderer ignores inherited-name choices and unknown/prototype settings',()=>{
 const result=change(JSON.parse('{"quality":"constructor","view":"constructor","__proto__":{"polluted":true},"extra":"x","v":2}'));assert.equal(result.plain,true);assert.equal(result.settings.quality,'low');assert.equal(result.settings.view,'normal');assert.ok(Number.isFinite(result.distance));assert.equal(Object.hasOwn(result.settings,'extra'),false);assert.equal(Object.hasOwn(result.settings,'v'),false);
});
test('renderer ignores invalid boolean values while retaining valid partial updates',()=>{
 const result=change({bloom:'true',grade:[],water:{},shake:0,foliage:false,res:'0.5'});assert.equal(result.settings.bloom,false);assert.equal(result.settings.grade,true);assert.equal(result.settings.water,true);assert.equal(result.settings.shake,true);assert.equal(result.settings.foliage,false);assert.equal(result.ratio,1);
});

test('invalid later partial updates retain earlier valid device preferences',()=>{
 const result=change({res:'0.5',quality:'medium',bloom:true},{res:'0',quality:'constructor',bloom:'no'});assert.equal(result.settings.res,'0.5');assert.equal(result.settings.quality,'medium');assert.equal(result.settings.bloom,true);assert.equal(result.ratio,1);
});
test('every existing graphics control option stays accepted by the shared boundary',()=>{
 assert.equal(typeof cleanSettings,'function');const expression=main.slice(main.indexOf('const SETTINGS = ')+17,main.indexOf(';function buildSettings()'));const controls=Function('return ('+expression+');')();
 for(const item of controls)if(item.id&&!['sound','autoalch','autoequip','keepplaying','layout'].includes(item.id))for(const [value]of item.opts)assert.deepEqual(cleanSettings({[item.id]:value}),{[item.id]:value},item.id+' '+value);
 assert.deepEqual(cleanSettings({keepplaying:true}),{},'focus preference must never enter graphics metadata');
});
test('settings boundary rejects primitive, array, coercible and prototype/meta values without mutation',()=>{
 assert.equal(typeof cleanSettings,'function');for(const input of [null,false,42,'broken',[],['low']])assert.deepEqual(cleanSettings(input),{});
 const input=JSON.parse('{"res":"0.5","foliage":false,"__proto__":{"polluted":true},"constructor":"bad","v":2,"unknown":1}');Object.freeze(input);assert.deepEqual(cleanSettings(input),{res:'0.5',foliage:false});assert.equal(Object.hasOwn(input,'__proto__'),true);
 assert.deepEqual(cleanSettings({res:1,quality:new String('low'),shadows:1,bloom:'false',view:'constructor'}),{});
});
