// Host-ordered inputs adapt RunEscape v0.27's co-op protocol to SQS30Hz; see licenses/run-escape.txt.
import {TRIAL_BOSSES,BOSS_KIT} from './game-modes.js';
import {ADVENTURER_BY_ID,MAP_BY_ID,MAPS,SKILLS,GEAR,GEAR_SLOTS,GEAR_MAX_LV} from './content.js';
export const COOP_PROTOCOL=1, COOP_HZ=30, COOP_PARTY=2, COOP_HISTORY=600;
const record=v=>!!v&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v));
const keys=(v,allowed)=>record(v)&&Reflect.ownKeys(v).every(k=>typeof k==='string'&&allowed.includes(k));
const uint=v=>Number.isInteger(v)&&v>=0&&v<=0xffffffff;
const known=(table,id)=>typeof id==='string'&&Object.hasOwn(table,id);

export function cleanLoadout(value){
 if(!keys(value,['name','adv','meta','gear','gearLv','cleared']))return null;
 const {name,adv,meta,gear,gearLv,cleared}=value;
 if(typeof name!=='string'||!name.trim()||name.length>16||/[\u0000-\u001f\u007f]/.test(name)||!known(ADVENTURER_BY_ID,adv))return null;
 if(!keys(meta,Object.keys(SKILLS))||Object.entries(meta).some(([id,n])=>!uint(n)||n>SKILLS[id].max))return null;
 if(!keys(gear,GEAR_SLOTS)||Object.entries(gear).some(([slot,item])=>!known(GEAR,item)||GEAR[item].slot!==slot))return null;
 if(!keys(gearLv,Object.values(gear))||Object.values(gearLv).some(n=>!uint(n)||n>GEAR_MAX_LV))return null;
 if(!Array.isArray(cleared)||cleared.length>MAPS.length||new Set(cleared).size!==cleared.length||cleared.some(id=>!known(MAP_BY_ID,id)))return null;
 return {name:name.trim(),adv,meta:{...meta},gear:{...gear},gearLv:{...gearLv},cleared:[...cleared]};
}

export function quantizeMove(x,z){
 if(!Number.isFinite(x)||!Number.isFinite(z))return null;
 const length=Math.hypot(x,z);if(!Number.isFinite(length))return null;
 const scale=Math.max(1,length);
 return [Math.round(x/scale*127)||0,Math.round(z/scale*127)||0];
}
export function cleanMove(value){
 if(!Array.isArray(value)||value.length!==2||value.some(n=>!Number.isInteger(n)||Math.abs(n)>127))return null;
 return Math.hypot(...value)>128?quantizeMove(value[0],value[1]):[...value];
}
export function cleanAction(value){
 if(!keys(value,['kind','index']))return null;
 const {kind,index}=value;
 if(['choose','banish','use'].includes(kind))return uint(index)&&index<=(kind==='use'?4:2)?{kind,index}:null;
 return ['reroll','skip'].includes(kind)&&!Object.hasOwn(value,'index')?{kind}:null;
}

export function cleanRoomSettings(value){
 if(!keys(value,['protocol','build','sim','map','hard','endless','variant','trialBoss']))return null;
 const {protocol,build,sim,map,hard,endless}=value;
 if(protocol!==COOP_PROTOCOL||typeof build!=='string'||!/^[A-Za-z0-9+._-]{1,80}$/.test(build)||typeof sim!=='string'||!/^[0-9a-f]{12}$/.test(sim)||!known(MAP_BY_ID,map)||typeof hard!=='boolean'||typeof endless!=='boolean')return null;
 const mode={};
 if(Object.hasOwn(value,'variant')){
  const {variant,trialBoss}=value;
  if(!['boss','raid','fun'].includes(variant)||hard||(variant==='fun'?(map!=='oasis'||!endless):endless))return null;
  if(variant==='boss'){if(!TRIAL_BOSSES.includes(trialBoss))return null;mode.trialBoss=trialBoss;}
  else if(Object.hasOwn(value,'trialBoss'))return null;
  mode.variant=variant;
 }else if(Object.hasOwn(value,'trialBoss'))return null;
 return {protocol,build,sim,map,hard,endless,...mode};
}

export function roomSettings(value){
 if(!record(value))return null;
 return cleanRoomSettings(Object.fromEntries(['protocol','build','sim','map','hard','endless','variant','trialBoss'].filter(k=>Object.hasOwn(value,k)).map(k=>[k,value[k]])));
}

export function cleanStart(value){
 if(!keys(value,['protocol','epoch','build','sim','ground','seed','map','hard','endless','players','variant','trialBoss']))return null;
 const {protocol,epoch,build,sim,ground,seed,map,hard,endless,players}=value;
 const settings=roomSettings(value);
 if(!settings||typeof epoch!=='string'||!/^[A-Za-z0-9_-]{16,64}$/.test(epoch)||typeof ground!=='string'||!/^[0-9a-f]{1,8}$/.test(ground)||!uint(seed)||!Array.isArray(players)||players.length!==COOP_PARTY)return null;
 const definition=MAP_BY_ID[map],mapIndex=MAPS.indexOf(definition),roster=[];
 for(let i=0;i<players.length;i++){
  const member=players[i];if(!keys(member,['id','loadout'])||member.id!==`p${i+1}`)return null;
  const loadout=cleanLoadout(member.loadout);if(!loadout)return null;
  const cleared=new Set(loadout.cleared),adventurer=ADVENTURER_BY_ID[loadout.adv];
  if(settings.variant!=='fun'&&(!definition.special&&mapIndex>0&&!cleared.has(definition.after||MAPS[mapIndex-1].id)||(hard||endless)&&!cleared.has(map)))return null;
  if(settings.variant==='boss'){if(loadout.adv!==BOSS_KIT.adv||Object.keys(loadout.meta).length||Object.keys(loadout.gear).length||Object.keys(loadout.gearLv).length)return null;}
  else if(definition.forceAdv?loadout.adv!==definition.forceAdv:adventurer.special||adventurer.unlock>cleared.size)return null;
  if(definition.forceAdv){loadout.gear={};loadout.gearLv={};}
  roster.push({id:member.id,loadout});
 }
 return {...settings,epoch,ground,seed,players:roster};
}

// Room selections become the map's forced loadout; received start packets still use strict cleanStart.
export function prepareStart(value){
 const force=record(value)&&(value.variant==='boss'?BOSS_KIT.adv:MAP_BY_ID[value.map]?.forceAdv);
 if(!force)return cleanStart(value);
 if(!Array.isArray(value.players)||!value.players.every(m=>keys(m,['id','loadout'])&&cleanLoadout(m.loadout)))return null;
 return cleanStart({...value,players:value.players.map(m=>({...m,loadout:{...m.loadout,adv:force,...(value.variant==='boss'?{meta:{},gear:{},gearLv:{}}:{})}}))});
}

export function cleanFrame(value,partySize){
 if(!keys(value,['frame','hero','move','moveSeq','action','actionSeq','decision','leave'])||!uint(value.frame)||!Number.isInteger(partySize)||partySize<1||partySize>COOP_PARTY||!uint(value.hero)||value.hero>=partySize)return null;
 const {frame,hero}=value,variants=['move','action','leave'].filter(k=>Object.hasOwn(value,k));if(variants.length!==1)return null;
 if(variants[0]==='move'){
  const move=cleanMove(value.move),echo=Object.hasOwn(value,'moveSeq');return move&&(!echo||uint(value.moveSeq)&&value.moveSeq>0)&&!Object.hasOwn(value,'actionSeq')&&!Object.hasOwn(value,'decision')?{frame,hero,move,...(echo?{moveSeq:value.moveSeq}:{})}:null;
 }
 if(Object.hasOwn(value,'moveSeq'))return null;
 if(variants[0]==='leave')return value.leave===true&&!Object.hasOwn(value,'actionSeq')&&!Object.hasOwn(value,'decision')?{frame,hero,leave:true}:null;
 const action=cleanAction(value.action),{actionSeq,decision}=value;
 if(!action||!uint(actionSeq)||actionSeq===0)return null;
 if(action.kind==='use')return !Object.hasOwn(value,'decision')?{frame,hero,action,actionSeq}:null;
 return uint(decision)?{frame,hero,action,actionSeq,decision}:null;
}

export function cleanUp(value){
 if(!record(value))return null;
 if(Object.hasOwn(value,'move')){
  const move=cleanMove(value.move);
  return keys(value,['move','moveSeq'])&&move&&uint(value.moveSeq)&&value.moveSeq>0?{move,moveSeq:value.moveSeq}:null;
 }
 if(Object.hasOwn(value,'resend'))return keys(value,['resend'])&&uint(value.resend)?{resend:value.resend}:null;
 if(!keys(value,['action','actionSeq','decision']))return null;
 const event=cleanFrame({frame:0,hero:0,...value},COOP_PARTY);
 if(!event)return null;
 delete event.frame;delete event.hero;return event;
}

export function cleanDown(value){
 if(!keys(value,['from','upTo','events','hash']))return null;
 const {from,upTo,events}=value;
 if(!uint(from)||from===0||!uint(upTo)||upTo<from||upTo-from>=60||!Array.isArray(events)||events.length>240)return null;
 const cleaned=[];let prior=from;
 for(const event of events){
  const e=cleanFrame(event,COOP_PARTY);
  if(!e||e.frame<prior||e.frame>upTo)return null;
  cleaned.push(e);prior=e.frame;
 }
 if(Object.hasOwn(value,'hash')){
  const hash=value.hash;
  if(!Array.isArray(hash)||hash.length!==2||hash[0]!==upTo||!uint(hash[1]))return null;
  return {from,upTo,events:cleaned,hash:[...hash]};
 }
 return {from,upTo,events:cleaned};
}
