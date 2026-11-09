import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSim,spawnEnemy,step,TICK} from '../src/sim.js';
import {SKILLS} from '../src/content.js';
import {translateText} from '../src/i18n.js';
const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
function readout(meta={},gear={},forced=false,variant='normal') {
  const start=source.indexOf('function progressionText('),end=source.indexOf('function buildSkills(',start);
  assert(start>=0&&end>start,'shared progression readout exists');
  return Function('createSim','getSkills','getGear','runAdv','selAdv','PLAYER','selVariant',`${source.slice(start,end)};return progressionText(getSkills(),getGear());`)(createSim,()=>meta,()=>gear,()=>({id:forced?'sankson':'adventurer'}),'adventurer','p1',variant);
}
test('new progression has no extra pressure; utility ranks disclose their real cost',()=>{
  assert.equal(readout(),'Casual scaling: enemy HP/contact damage +0%; base spawn pressure +0%.');
  assert.equal(readout({coins:5}),'Casual scaling: enemy HP/contact damage +7.5%; base spawn pressure +4.125%.');
  assert.equal(readout({mining:1}),'Casual scaling: enemy HP/contact damage +1.5%; base spawn pressure +0.825%.');
});
test('starting gear counts twice and a forced adventurer ignores the saved gear exactly like startRun',()=>{
  const meta=Object.freeze({coins:5}),gear=Object.freeze({head:'Bronze Helmet',feet:'Bronze Boots'});
  assert.equal(readout(meta,gear),'Casual scaling: enemy HP/contact damage +13.5%; base spawn pressure +7.425%.');
  assert.equal(readout(meta,gear,true),readout(meta));
  assert.equal(readout(meta,gear,true,'wizard'),readout(meta,gear),'the cosmetic elder role retains saved gear pressure');
  assert.deepEqual(meta,{coins:5});assert.deepEqual(gear,{head:'Bronze Helmet',feet:'Bronze Boots'});
});
test('the current cap and corrupt stored skills follow the simulation clamp',()=>{
  const max=Object.fromEntries(Object.entries(SKILLS).map(([id,s])=>[id,s.max]));
  assert.equal(readout(max),'Casual scaling: enemy HP/contact damage +75%; base spawn pressure +41.25%.');
  assert.equal(readout({coins:999,unknown:500}),readout({coins:5}));
});
test('displayed factors agree with actual enemy HP and the base spawn accumulator',()=>{
  for(const meta of [{},{mining:1},{coins:5},{coins:5,combat:5}]) {
    const sim=createSim({meta}),base=createSim();
    for(const s of [sim,base]){s.bossIndex=99;s.eventT=s.shrineT=1e9;spawnEnemy(s,'giant',s.players[0].x+10,s.players[0].z);}
    const beforeHp=sim.enemies[0].hp/base.enemies[0].hp;
    step(sim,{},TICK);step(base,{},TICK);
    const numbers=[...readout(meta).matchAll(/\+(\d+(?:\.\d+)?)%/g)].map(m=>Number(m[1]));
    assert(Math.abs(numbers[0]-100*(beforeHp-1))<1e-9);
    assert(Math.abs(numbers[1]-100*(sim.spawnAcc/base.spawnAcc-1))<1e-9);
  }
});
for(const language of ['tr','es','fil'])test(`${language}: scaling copy translates and preserves precise percentages`,()=>{
  for(const text of ['Casual scaling: enemy HP/contact damage +7.5%; base spawn pressure +4.125%.','Each skill rank adds 1.5% enemy HP/contact damage. Each starting gear piece counts as two ranks, up to +75%. Ranked ignores both.','Before armour and other modifiers.']){
    const translated=translateText(text,language);assert.notEqual(translated,text);
    for(const number of text.match(/\d+(?:\.\d+)?/g)||[])assert(translated.includes(number));
  }
});
