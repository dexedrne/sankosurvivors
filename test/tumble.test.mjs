import test from 'node:test';
import assert from 'node:assert/strict';
import {createSim,step,snapshot,TICK} from '../src/sim.js';
import {rankedSim,replay} from '../src/ranked.js';
import {RunRecorder} from '../src/ranked.js';
import {rankedStep,rankedChoice,resumeRanked} from '../src/ranked-play.js';
import {MAPS} from '../src/content.js';

function fixture({pace=2,cell=true,ground=true,players}={}) {
 const n=32,g=ground?{n,cell,blocked:new Uint8Array(n*n),walls:new Uint8Array(n*n),fences:new Uint8Array(n*n)}:null;
 const s=createSim({seed:55,pace,ground:g,map:{...MAPS[0],id:'test',cx:16,cz:16,r:15,length:1e9,bosses:[]},players});
 s.spawnAcc=-1e9;s.bossIndex=99;s.eventT=s.shrineT=1e9;
 const p=s.players[0];p.x=12.5;p.z=10.5;p.weapons={};return {s,p,g};
}
function ticks(s,n,input={mx:0,mz:0}){for(let i=0;i<n;i++)step(s,{p1:input},TICK);}
const east={mx:1,mz:0,use:4};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('tumble travels 3.6 units in a captured direction, then has a five-second simulation cooldown',()=>{
 const {s,p}=fixture();const x=p.x,z=p.z;p.belt=['beer','warp'];step(s,{p1:east});
 assert.ok(p.rollT>0);assert.equal(p.rollCd,5);assert.equal(p.inv,0);assert.deepEqual(p.belt,['beer','warp']);
 ticks(s,5,{mx:0,mz:-1,use:4});near(p.x-x,3.6);near(p.z,z);assert.equal(p.rollT,0);assert.ok(p.rollCd>4.8);
 const cd=p.rollCd;ticks(s,1,{mx:0,mz:0,use:4});near(p.x-x,3.6);assert.ok(p.rollCd<cd);
 ticks(s,144);assert.equal(p.rollCd,0);step(s,{p1:east});assert.equal(p.rollCd,5);
});
test('standing tumble uses last movement direction and normalizes a partial stick',()=>{
 for(const input of [{mx:.2,mz:0,use:4},{mx:0,mz:0,use:4}]){const{s,p}=fixture({ground:false});p.moveFace=Math.PI/2;const x=p.x;step(s,{p1:input});ticks(s,5);near(p.x-x,3.6);}
});
test('tumble uses only the remaining duration when the caller steps by a larger dt',()=>{
 const{s,p}=fixture();const x=p.x;step(s,{p1:east},.15);step(s,{p1:{mx:0,mz:0}},.15);near(p.x-x,3.6);assert.equal(p.rollT,0);
});
for(const layer of ['fences','walls','blocked'])test(`tumble crosses only reachable low fences: ${layer}`,()=>{
 const{s,p,g}=fixture();for(let z=3;z<16;z++)g[layer][z*g.n+14]=layer==='blocked'?1:8;
 ticks(s,6,east);if(layer==='fences')assert.ok(p.x>14.5,`crossed: ${p.x}`);else assert.ok(p.x<14,`stopped: ${p.x}`);
});
test('normal movement still respects fences and tumble cannot enter a sealed fenced pen',()=>{
 const a=fixture();for(let z=3;z<16;z++)a.g.fences[z*a.g.n+14]=8;ticks(a.s,30,{mx:1,mz:0});assert.ok(a.p.x<14);
 const{s,p,g}=fixture();for(let z=9;z<=12;z++){g.fences[z*g.n+14]|=8;g.fences[z*g.n+17]|=2;}for(let x=14;x<=17;x++){g.fences[9*g.n+x]|=1;g.fences[12*g.n+x]|=4;}
 ticks(s,6,east);assert.ok(p.x<14,`closed pen remains unreachable: ${p.x}`);assert.ok(p.rollCd>4.8);
});
for(const distance of [59,100])for(const sealed of [false,true])test(`co-op tumble establishes reachability for its own player: distance=${distance},sealed=${sealed}`,()=>{
 const n=256,g={n,cell:true,blocked:new Uint8Array(n*n),walls:new Uint8Array(n*n),fences:new Uint8Array(n*n)};
 const s=createSim({ground:g,map:{...MAPS[0],cx:128,cz:128,r:170},players:[{id:'p1'},{id:'p2'}]});s.spawnAcc=-1e9;s.bossIndex=99;s.eventT=s.shrineT=1e9;
 const[a,p]=s.players;a.x=32.5;a.z=32.5;p.x=a.x+distance;p.z=32.5;for(const hero of s.players)hero.weapons={};const edge=Math.floor(p.x)+2;
 for(let z=31;z<=34;z++){g.fences[z*n+edge]|=8;if(sealed)g.fences[z*n+edge+3]|=2;}
 if(sealed)for(let x=edge;x<=edge+3;x++){g.fences[31*n+x]|=1;g.fences[34*n+x]|=4;}
 for(let i=0;i<6;i++)step(s,{p2:east});if(sealed)assert.ok(p.x<edge,`sealed pen: x=${p.x},edge=${edge}`);else assert.ok(p.x>edge,`reachable fence: x=${p.x},edge=${edge}`);
});
test('diagonal tumble slides along a building without crossing a blocked corner',()=>{
 const{s,p,g}=fixture();for(let z=3;z<25;z++)g.walls[z*g.n+14]=8;const z=p.z;ticks(s,6,{mx:1,mz:1,use:4});assert.ok(p.x<14);assert.ok(p.z>z+1);
});
test('blocked terrain remains solid on vertex ground and map bounds still constrain tumble',()=>{
 const{s,p,g}=fixture({cell:false});for(let z=0;z<32;z++)g.blocked[z*32+14]=1;ticks(s,6,east);assert.ok(p.x<13.5);
 const b=fixture({ground:false});b.p.x=b.s.map.cx+b.s.map.r-.2;b.p.z=b.s.map.cz;ticks(b.s,6,east);assert.ok(b.p.x<=b.s.map.cx+b.s.map.r);
});
test('pending rewards, dead players and ended runs cannot start or advance a tumble',()=>{
 for(const kind of ['pending','dead','over']){const{s,p}=fixture();if(kind==='pending')s.pending.p1={left:20,choices:[]};if(kind==='dead')p.alive=false;if(kind==='over')s.over='dead';const x=p.x;step(s,{p1:east});assert.equal(p.x,x);assert.ok(!p.rollT);assert.ok(!p.rollCd);}
 const{s,p}=fixture();step(s,{p1:east});const state=[p.x,p.rollT,p.rollCd];s.pending.p1={left:20,choices:[]};ticks(s,10,east);assert.deepEqual([p.x,p.rollT,p.rollCd],state);
});
test('a tumble does not protect the player from a boss slam',()=>{
 const{s,p}=fixture();p.hp=100;s.hazards=[{x:p.x+.6,z:p.z,r:2,t:TICK/2,max:1,dmg:25}];step(s,{p1:east});assert.equal(p.hp,75);assert.ok(p.rollT>0);
});
test('tumble state in the renderer snapshot comes from the sim; pace1 retains the old shape and action4 no-op',()=>{
 const{s,p}=fixture();step(s,{p1:east});const v=snapshot(s).players[0];assert.equal(v.rollT,p.rollT);assert.equal(v.rollFace,p.rollFace);assert.equal(v.rollCd,p.rollCd);
 const a=fixture({pace:1}),b=fixture({pace:1});ticks(a.s,9,east);ticks(b.s,9,{mx:1,mz:0});assert.deepEqual(snapshot(a.s),snapshot(b.s));assert.equal(Object.hasOwn(snapshot(a.s).players[0],'rollT'),false);
});
test('honest ranked tumble logs resume mid-roll and replay to the same result on each pace',()=>{
 for(const week of [0,1]){
  const params={seed:171,mapId:'greentown',adv:'adventurer',ground:null,week,mode:'normal'};let s=rankedSim(params),rec=new RunRecorder(),cut=false;
  while(!s.over){
   if(s.pending.p1){rankedChoice(s,rec,0);continue;}
   const tick=s.tick;rankedStep(s,rec,Math.sin(tick/150),Math.cos(tick/150),tick%151===0?4:null);s.fx.length=0;
   if(!cut&&s.tick===2){const saved=JSON.parse(JSON.stringify(rec.log())),copy=resumeRanked(saved,params);assert.deepEqual(snapshot(copy.sim),snapshot(s));assert.deepEqual(copy.rec.log(),rec.log());({sim:s,rec}=copy);cut=true;}
  }
  assert.ok(cut);assert.ok(rec.log().uses.some(row=>row[1]===4));const r=replay(rec.log(),params);assert.ok(!r.error,r.error);assert.deepEqual([r.t,r.kills,r.level,r.won],[Math.floor(s.t),s.kills,s.level,s.over==='win']);
 }
});
