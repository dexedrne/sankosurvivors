import test from 'node:test';
import assert from 'node:assert/strict';
import {gearBonus,compareGear} from '../src/content.js';
test('Shape robes and skirts improve every Minion piece stat at each equal reinforcement level',()=>{
 for(const level of[0,1,2,3])for(const [slot,shape,minion]of[['chest','Shape Robe','Minion Robe'],['legs','Shape Skirt','Minion Skirt']]){
  const levels={[shape]:level,[minion]:level},before=gearBonus({[slot]:minion},levels,2),after=gearBonus({[slot]:shape},levels,2);
  for(const [stat,value]of Object.entries(before))if(stat!=='sets')assert((after[stat]||0)>=value,`${shape} ${stat} at +${level}`);
  assert(after.magic>before.magic,`${shape} should be a stronger magic tier`);assert.equal(compareGear({[slot]:minion},levels,shape,2).better,true);
 }
});
test('complete Shape gear outperforms Minion with its best cooldown hat at equal reinforcement',()=>{
 for(const level of[0,1,2,3]){
  const minion={head:'Mystic Hat',chest:'Minion Robe',legs:'Minion Skirt'},shape={head:'Shape Wizard Hat',chest:'Shape Robe',legs:'Shape Skirt'};
  const levels=Object.fromEntries([...Object.values(minion),...Object.values(shape)].map(n=>[n,level]));
  const score=g=>{const b=gearBonus(g,levels,2);return(1+(b.dmg||0))*(1+(b.magic||0))/(1-(b.haste||0));};
  assert(score(shape)>score(minion),'actual magic damage/cooldown multiplier at +'+level);
 }
});
test('week-zero Shape bonuses retain their original values',()=>{
 assert.deepEqual(gearBonus({chest:'Shape Robe'},{'Shape Robe':2},1),{haste:.045,hp:7.5,sets:[]});
 assert.deepEqual(gearBonus({head:'Shape Wizard Hat',chest:'Shape Robe',legs:'Shape Skirt'},{},1),{haste:.09,hp:5,dmg:.1,sets:['Shape']});
});
