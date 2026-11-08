import test from 'node:test';
import assert from 'node:assert/strict';
import {createSim,step,snapshot,TICK} from '../src/sim.js';
import {MAP_BY_ID,MAPS,ENEMIES} from '../src/content.js';
const snow=type=>['wolf','snowman','dwarf','wight','yeti','ogre','colossus'].includes(type);
function scene({pace=2,time=359,kind=null}={}){
 const map={...MAP_BY_ID.greentown,pool:[{t:0,type:'chicken',w:1},{t:0,type:'snowman',w:10000}],bosses:[],retire:{},events:kind?[kind]:['swarm']};
 const s=createSim({seed:1106,pace,map});s.t=time;s.players[0].weapons={};s.players[0].godMode=true;s.eventT=kind?0:1e9;s.shrineT=1e9;s.spawnAcc=5;if(kind)s.rng=()=>0;
 return s;
}
for(const kind of[null,'swarm','blizzard'])test(`pace2 ${kind||'ordinary'} spawning cannot introduce winter enemies before6:00`,()=>{
 const s=scene({kind});step(s,{p1:{}},TICK);assert(s.enemies.length>0);assert(s.enemies.every(e=>!snow(e.type)));
 assert.equal(snapshot(s).snowWave,false);
});
test('winter spawns unlock at6:00 and the actual first winter spawn sets persistent music state',()=>{
 const s=scene({time:360,kind:'blizzard'});step(s,{p1:{}},TICK);assert(s.enemies.some(e=>e.type==='snowman'));assert.equal(snapshot(s).snowWave,true);
 s.enemies=[];s.event=null;s.eventT=1e9;s.spawnAcc=-100;step(s,{p1:{}},TICK);assert.equal(snapshot(s).snowWave,true,'killing a wave does not restart the old song');
});
test('pace1 retains early snow pools/events and its original snapshot shape',()=>{
 const s=scene({pace:1,time:210,kind:'blizzard'});step(s,{p1:{}},TICK);assert(s.enemies.some(e=>e.type==='snowman'));assert.equal(Object.hasOwn(snapshot(s),'snowWave'),false);
});
test('all real scheduled winter bosses and endless phases already occur after the6:00 gate',()=>{
 for(const map of MAPS){assert(map.length>=360);for(const boss of map.bosses)if(snow(boss.type))assert(boss.t>=360,map.id+' '+ENEMIES[boss.type].name);}
});

test('every real map retains non-winter spawn choices throughout the first six minutes',()=>{
 for(const map of MAPS)for(const t of[0,60,150,240,300,359])assert(map.pool.some(s=>s.t<=t&&!snow(s.type)&&!(map.retire?.[s.type]&&t>=map.retire[s.type])),map.id+' at '+t);
});
