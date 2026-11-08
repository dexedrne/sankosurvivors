import {WEAPONS,EVOLUTIONS,GEAR,GEAR_SLOT_NAMES,GEAR_SLOTS,GEAR_MAX_LV,weaponDisplay,weaponStep,weaponMetal,weaponStats,evolveStats,evolutionPassives,PASSIVES,gearPieceBonus,bonusText} from './content.js';
const statRows=[['dmg','Base damage'],['cd','Cooldown',' s'],['count','Projectiles'],['pierce','Pierce'],['range','Range'],['radius','Radius'],['r','Size'],['speed','Projectile speed'],['burst','Burst radius']];
export function itemInspection(player,kind,id,pace=2) {
  if(!player)return null;
  if(kind==='gear') {
    const name=player.gear?.[id];
    if(!GEAR_SLOTS.includes(id)||typeof name!=='string'||!Object.hasOwn(GEAR,name)||GEAR[name].slot!==id)return null;
    const rawRank=player.gearLv?.[name],rank=Number.isFinite(rawRank)?Math.max(0,Math.min(GEAR_MAX_LV,Math.floor(rawRank))):0,g=GEAR[name];
    const bonuses=Object.fromEntries(Object.entries(gearPieceBonus(name,pace)).map(([key,value])=>[key,value*(1+.25*rank)]));
    return {title:name+(rank?` +${rank}`:''),details:[id==='back'?'Cape':GEAR_SLOT_NAMES[id],bonusText(bonuses),...(g.set?[`${g.set} set`]:[])]};
  }
  if(kind!=='weapon'||!Object.hasOwn(WEAPONS,id)||!Object.hasOwn(player.weapons||{},id))return null;
  const level=player.weapons[id];if(!Number.isInteger(level)||level<1||level>6)return null;
  const evolved=!!player.evo?.[id],base=weaponStats(player,id),stats=evolved?evolveStats(id,base):base;
  if(pace>=2){const metal=weaponMetal(id,player.wm);if(Number.isFinite(stats.dmg))stats.dmg*=metal.dmg;if(metal.pierce)stats.pierce=(stats.pierce||0)+metal.pierce;}
  const title=weaponDisplay(id,level,evolved,pace>=2?weaponStep(id,player.wm):null).name;
  const details=[`Level: ${level}`,evolved?EVOLUTIONS[id].blurb:WEAPONS[id].blurb];
  for(const[key,label,suffix='']of statRows)if(Number.isFinite(stats[key]))details.push(`${label}: ${Math.round(stats[key]*100)/100}${suffix}`);
  details.push('Weapon values before shared bonuses.');
  if(!evolved&&EVOLUTIONS[id])details.push('Evolves with '+evolutionPassives(id,pace).map(p=>PASSIVES[p].name).join(' or ')+'.');
  return {title,details};
}
