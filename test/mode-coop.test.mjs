import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanRoomSettings,cleanStart,prepareStart} from '../src/coop-protocol.js';
import {createCoopRun} from '../src/coop-run.js';
import {BOSS_KIT} from '../src/game-modes.js';
const settings={protocol:1,build:'test-mode',sim:'2a79d4826e39',map:'greentown',hard:false,endless:false};
const member=id=>({id,loadout:{name:id,adv:'adventurer',meta:{combat:2},gear:{head:'Bronze Helmet'},gearLv:{'Bronze Helmet':1},cleared:[]}});
const game=extra=>({...settings,epoch:'00112233445566778899aabbccddeeff',ground:'0',seed:711,players:[member('p1'),member('p2')],...extra});
test('legacy normal co-op settings and starts keep their exact shape',()=>{
 assert.deepEqual(cleanRoomSettings(settings),settings);assert.deepEqual(cleanStart(game()),game());
});
for(const variant of ['boss','raid','fun'])test(`${variant} co-op binds mode through start and authoritative reconstruction`,()=>{
 const extra={variant,...(variant==='boss'?{trialBoss:'ogre'}:{}),...(variant==='fun'?{map:'oasis',endless:true}:{})};
 const start=prepareStart(game(extra));assert(start);assert.equal(start.variant,variant);
 const run=createCoopRun({start,localId:'p2',ground:null,send(){}});assert.equal(run.sim.variant,variant);assert.equal(run.sim.endless,variant==='fun');
 if(variant==='boss')for(const p of run.sim.players){assert.equal(p.adv,BOSS_KIT.adv);assert.deepEqual(p.weapons,BOSS_KIT.weapons);assert.deepEqual(p.meta,{});assert.deepEqual(p.gear,{});}
 else for(const p of run.sim.players)assert.equal(p.meta.combat,2);
});
for(const extra of [{variant:'constructor'},{variant:null},{variant:'raid',hard:true},{variant:'raid',endless:true},{variant:'raid',trialBoss:'giant'},{variant:'boss',trialBoss:'chicken'},{variant:'fun',endless:true},{variant:'fun',map:'oasis',endless:false},{trialBoss:'giant'}])test('invalid mode identity cannot enter a co-op room: '+JSON.stringify(extra),()=>{
 assert.equal(cleanRoomSettings({...settings,...extra}),null);assert.equal(prepareStart(game(extra)),null);
});
test('raw boss starts cannot smuggle saved skills or gear into the prescribed kit',()=>{
 assert.equal(cleanStart(game({variant:'boss',trialBoss:'giant'})),null);
 const start=prepareStart(game({variant:'boss',trialBoss:'giant'}));assert(start);assert.deepEqual(cleanStart(start),start);
 start.players[0].loadout.meta.combat=1;assert.equal(cleanStart(start),null);
});
