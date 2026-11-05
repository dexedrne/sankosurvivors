import test from 'node:test';
import assert from 'node:assert/strict';
import {createSim,rollChoices} from '../src/sim.js';

// Independent design table: old route, new alternative. Test the actual offered choices.
const routes=[['katana','might','thorns'],['bow','boots','crit'],['axe','vigor','amount'],['shield','armor','thorns'],['staff','growth','area'],['pickaxe','haste','area'],['greatsword','vigor','armor'],['shortsword','magnet','boots'],['baseball','amount','might'],['lighter','crit','growth']];
function offers(weapon,passives,{pace=2,level=6,evolved=false}={}){
 const sim=createSim({seed:71,pace}),p=sim.players[0];p.weapons={[weapon]:level};p.passives=passives;p.evo=evolved?{[weapon]:true}:{};return rollChoices(sim,p).filter(c=>c.kind==='evolve').map(c=>c.id);
}
for(const[weapon,original,alternative]of routes){
 test(`${weapon} can evolve with alternative ${alternative} on pace2`,()=>{assert.deepEqual(offers(weapon,{[alternative]:1}),[weapon]);});
 test(`${weapon} keeps original ${original} and its legacy/cap/ownership guards`,()=>{
  for(const pace of [1,2])assert.deepEqual(offers(weapon,{[original]:1},{pace}),[weapon]);
  assert.deepEqual(offers(weapon,{[alternative]:1},{pace:1}),[]);assert.deepEqual(offers(weapon,{}),[]);assert.deepEqual(offers(weapon,{[alternative]:0}),[]);assert.deepEqual(offers(weapon,{[alternative]:1},{level:5}),[]);assert.deepEqual(offers(weapon,{[original]:1},{evolved:true}),[]);
 });
}
