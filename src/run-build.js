import {ADVENTURER_BY_ID,MAX_WEAPON_LEVEL,MAX_PASSIVE_LEVEL,WEAPONS,PASSIVES,GEAR,GEAR_SLOTS,GEAR_SLOT_NAMES,GEAR_MAX_LV,SKILLS,clampSkills,weaponDisplay,weaponStep,weaponSlotItem,passiveItem,passiveTitle,itemIconFile} from './content.js';
import {playerStats,FOOD,BELT_SIZE,beltCount} from './sim.js';
import {VARIANTS} from './game-modes.js';

const number=value=>Number.isFinite(value)?Math.max(0,value):0;
const rounded=value=>Math.round(number(value)*100)/100;
const icon=name=>'ui/items/'+itemIconFile(name);
export const effectNames={speed:'Tin of Beer',strength:'Strength shrine',agility:'Agility shrine',wisdom:'Wisdom shrine',chill:'Snowstorm chill'};

// Detached display data only: never attach this to a score, payment, save or replay payload.
export function captureRunBuild(sim,player,{name='Adventurer',ranked=false,version=''}={}) {
 const pace=sim.pace||1,sections=[];
 const weapons=Object.entries(player.weapons||{}).filter(([id,level])=>Object.hasOwn(WEAPONS,id)&&Number.isInteger(level)&&level>0&&level<=MAX_WEAPON_LEVEL).map(([id,level])=>{
  const evolved=!!player.evo?.[id],display=weaponDisplay(id,level,evolved,pace>=2?weaponStep(id,player.wm):null,pace>=2?player.spellElement:null),quality=number(player.quality?.weapons?.[id]);
  const metal=pace>=2?weaponStep(id,player.wm):null;
  return {name:display.name,icon:icon(display.item),level,maxLevel:MAX_WEAPON_LEVEL,evolved,details:[`Level: ${level}`,...(evolved?['Evolved']:[]),...(evolved&&metal!==null?[weaponSlotItem(id,metal)]:[]),...(pace>=2&&id==='bow'?[weaponSlotItem('arrow',player.wm?.arrow)]:[]),...(quality?[`Effective level: ${rounded(level+quality/100)}`]:[])]};
 });
 sections.push({title:'Weapons',rows:weapons});
 sections.push({title:'Passives',rows:Object.entries(player.passives||{}).filter(([id,level])=>Object.hasOwn(PASSIVES,id)&&Number.isInteger(level)&&level>0&&level<=MAX_PASSIVE_LEVEL).map(([id,level])=>{
  const quality=number(player.quality?.passives?.[id]);return{name:passiveTitle(id,level),icon:icon(passiveItem(id,level)),level,maxLevel:MAX_PASSIVE_LEVEL,evolved:false,details:[`Level: ${level}`,...(quality?[`Effective level: ${rounded(level+quality/100)}`]:[])]};
 })});
 sections.push({title:'Equipment',rows:GEAR_SLOTS.flatMap(slot=>{
  const name=player.gear?.[slot];if(!Object.hasOwn(GEAR,name)||GEAR[name].slot!==slot)return[];
  const rank=Math.min(GEAR_MAX_LV,Math.floor(number(player.gearLv?.[name])));
  return[{name:name+(rank?` +${rank}`:''),icon:icon(name),details:[GEAR_SLOT_NAMES[slot]]}];
 })});
 const skills=Object.entries(clampSkills(player.meta)).filter(([,rank])=>rank>0).map(([id,rank])=>({name:SKILLS[id].name,icon:SKILLS[id].icon,details:[`Rank: ${rank}`]}));
 if(skills.length)sections.push({title:'Skills',rows:skills});
 const belt=(player.belt||[]).slice(0,BELT_SIZE).flatMap((id,slot)=>{
  const item=FOOD[id]?.item||{beer:'Tin of Beer',pumpkin:'Pumpkin',warp:'Warp Shard'}[id];if(!item)return[];
  const count=beltCount(player,slot);return[{name:item,icon:icon(item),details:[`Quantity: ${count}`]}];
 });
 if(belt.length)sections.push({title:'Belt',rows:belt});
 const growth=Object.entries(player.endlessGrowth||{}).filter(([key,n])=>['might','maxHp','area'].includes(key)&&number(n)>0).map(([id,n])=>({name:{might:'Damage',maxHp:'Maximum health',area:'Attack area'}[id],icon:icon({might:'Power Amulet',maxHp:'Cooked Bubba Bass',area:'Cape'}[id]),details:[`+${rounded(n)}%`]}));
 if(growth.length)sections.push({title:'Endless growth',rows:growth});
 const effects=Object.entries(effectNames).flatMap(([id,label])=>number(player.buffs?.[id])>0?[{name:label,icon:icon(id==='speed'?'Tin of Beer':'Spirit Shard'),details:[`Remaining: ${rounded(player.buffs[id])} s`]}]:[]);
 if(effects.length)sections.push({title:'Active effects',rows:effects});
 const stats=playerStats(player),statRows=[
  ['maxHp','Maximum health',''],['armor','Armor',''],['might','Damage multiplier','×'],['haste','Cooldown multiplier','×'],['speed','Movement speed',''],['area','Area multiplier','×'],
  ['magnet','Pickup range',''],['growth','XP multiplier','×'],['regen','Health per second',''],['coin','Coin multiplier','×'],['luck','Luck multiplier','×'],['casket','Casket multiplier','×'],['coinBonus','End-of-run coin multiplier','×'],
  ['weaponSlots','Weapon slots',''],['passiveSlots','Passive slots',''],['projectileSpeed','Projectile speed multiplier','×'],['rerolls','Rerolls per run',''],['revives','Revives per run',''],['amount','Extra projectiles',''],['reach','Reach multiplier','×'],
  ['critC','Critical chance','%'],['critM','Critical multiplier','×'],['thorns','Thorns damage',''],['heal','Healing multiplier','×'],['magic','Magic damage multiplier','×'],
 ].map(([id,name,suffix])=>({id,name,value:rounded(stats[id]*(suffix==='%'?100:1)),suffix}));
 const adventurer=ADVENTURER_BY_ID[player.adv]?.name||(player.adv==='wise-old-man'?'Wise Old Man':'Adventurer');
 return {name:typeof name==='string'?name.slice(0,32):'Adventurer',adventurer,map:String(sim.map.name).slice(0,80),mode:[ranked?'Ranked':sim.coop?'Co-op':'Casual',...(sim.variant&&Object.hasOwn(VARIANTS,sim.variant)?[VARIANTS[sim.variant].name]:[]),...(sim.hard?['Hard']:[]),...(sim.endless?['Endless']:[])].join(' · '),outcome:sim.over==='win'?'Victory':sim.over==='time'?'Time up':'Defeat',t:Math.floor(number(sim.t)),kills:Math.floor(number(sim.kills)),level:Math.floor(number(sim.level)),version,sections,stats:statRows};
}
