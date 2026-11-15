import {WEAPONS,PASSIVES,GEAR,GEAR_SLOTS,MAX_WEAPON_LEVEL,MAX_PASSIVE_LEVEL,MAP_BY_ID,ADVENTURER_BY_ID} from './content.js';
import {VARIANTS} from './game-modes.js';

// Observations never enter serialized combat state or consume RNG.
const tracking=new WeakMap(),copy=value=>JSON.parse(JSON.stringify(value));
export function startRunStats(p){
 if(!tracking.has(p))tracking.set(p,{starter:{weapons:{...p.weapons},passives:{...p.passives}},offered:{weapon:{},passive:{}},chosen:{weapon:{},passive:{}}});
}
function count(p,choice,key){
 const stats=tracking.get(p),ids=choice.kind==='weapon'?WEAPONS:choice.kind==='passive'?PASSIVES:null;
 if(!stats||!ids||!Object.hasOwn(ids,choice.id))return;
 const counts=stats[key][choice.kind];counts[choice.id]=(counts[choice.id]||0)+1;
}
export function noteRunOffers(p,cards){for(const card of cards)count(p,card,'offered');return cards;}
export function noteRunChoice(p,choice){count(p,choice,'chosen');}
export function captureRunStats(sim,p){
 const stats=tracking.get(p);
 return copy({v:1,complete:!!stats,starter:stats?.starter||null,weapons:p.weapons,passives:p.passives,evo:p.evo,quality:p.quality||{weapons:{},passives:{}},gear:p.gear,metals:p.wm||{},offered:stats?.offered||null,chosen:stats?.chosen||null});
}
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const keys=(value,expected)=>object(value)&&Object.keys(value).length===expected.length&&expected.every(key=>Object.hasOwn(value,key));
const numericMap=(value,ids,min,max)=>object(value)&&Object.keys(value).length<=Object.keys(ids).length&&Object.entries(value).every(([id,n])=>Object.hasOwn(ids,id)&&Number.isSafeInteger(n)&&n>=min&&n<=max);
function itemMaps(value,maxWeapon,maxPassive,min=1){return keys(value,['weapons','passives'])&&numericMap(value.weapons,WEAPONS,min,maxWeapon)&&numericMap(value.passives,PASSIVES,min,maxPassive);}
function counters(value){return keys(value,['weapon','passive'])&&numericMap(value.weapon,WEAPONS,1,20000)&&numericMap(value.passive,PASSIVES,1,20000);}
export function normalizeRunStats(value){
 try{
  if(!keys(value,['v','complete','starter','weapons','passives','evo','quality','gear','metals','offered','chosen'])||value.v!==1||typeof value.complete!=='boolean')return null;
  if(!numericMap(value.weapons,WEAPONS,1,MAX_WEAPON_LEVEL)||!numericMap(value.passives,PASSIVES,1,MAX_PASSIVE_LEVEL))return null;
  if(value.complete?(!itemMaps(value.starter,MAX_WEAPON_LEVEL,MAX_PASSIVE_LEVEL)||!counters(value.offered)||!counters(value.chosen)):(value.starter!==null||value.offered!==null||value.chosen!==null))return null;
  if(!object(value.evo)||Object.entries(value.evo).some(([id,on])=>!Object.hasOwn(value.weapons,id)||on!==true))return null;
  if(!itemMaps(value.quality,10000,10000,0)||Object.keys(value.quality.weapons).some(id=>!Object.hasOwn(value.weapons,id))||Object.keys(value.quality.passives).some(id=>!Object.hasOwn(value.passives,id)))return null;
  if(!object(value.gear)||Object.keys(value.gear).length>GEAR_SLOTS.length||Object.entries(value.gear).some(([slot,name])=>typeof name!=='string'||!Object.hasOwn(GEAR,name)||GEAR[name].slot!==slot))return null;
  if(!numericMap(value.metals,{...WEAPONS,arrow:true},0,15))return null;
  const encoded=JSON.stringify(value);return encoded.length<=12000?JSON.parse(encoded):null;
 }catch{return null;}
}
export function runStatsScope(kind,map,adv){
 return typeof map==='string'&&Object.hasOwn(MAP_BY_ID,map)&&typeof kind==='string'&&(['casual','coop','ranked'].includes(kind)||kind!=='normal'&&Object.hasOwn(VARIANTS,kind))&&typeof adv==='string'&&(Object.hasOwn(ADVENTURER_BY_ID,adv)?kind!=='ranked'||!ADVENTURER_BY_ID[adv].special:kind==='wizard'&&adv==='wise-old-man');
}
export function normalizeRunSummary(value){
 try{
  if(!keys(value,['kind','map','adv','hard','endless','t','kills','level','won','build','sim','week','stats'])||!runStatsScope(value.kind,value.map,value.adv))return null;
  if(['hard','endless','won'].some(key=>typeof value[key]!=='boolean')||value.endless&&value.won)return null;
  if(!Number.isSafeInteger(value.t)||value.t<1||value.t>14400||!Number.isSafeInteger(value.kills)||value.kills<0||value.kills>1000000||!Number.isSafeInteger(value.level)||value.level<1||value.level>10000)return null;
  if(typeof value.build!=='string'||!/^[A-Za-z0-9+._-]{1,80}$/.test(value.build)||typeof value.sim!=='string'||!/^[0-9a-f]{12}$/.test(value.sim))return null;
  if(value.kind==='ranked'?(!Number.isSafeInteger(value.week)||value.week<0||value.week>10000):value.week!==null)return null;
  const stats=normalizeRunStats(value.stats);return stats?copy({...value,stats}):null;
 }catch{return null;}
}
export function captureCasualRunSummary(sim,p,build,simId){
 if(sim.ranked)return null;
 return normalizeRunSummary({kind:sim.coop?'coop':sim.variant||'casual',map:sim.map.id,adv:p.adv,hard:!!sim.hard,endless:!!sim.endless,t:Math.floor(sim.t),kills:sim.kills,level:sim.level,won:sim.over==='win',build,sim:simId,week:null,stats:captureRunStats(sim,p)});
}
