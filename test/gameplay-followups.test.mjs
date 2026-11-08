import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSim,step,snapshot,useBelt,playerStats,spawnEnemy,damageEnemy,mulberry32,TICK} from '../src/sim.js';
import {MAP_BY_ID} from '../src/content.js';
import {unpackGround} from '../src/ground-pack.js';
import {drawStormMinimap} from '../src/storm-effects.js';

const ground=unpackGround(readFileSync(new URL('../tools/vercel-api/ground.bin',import.meta.url)));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function quiet(options={}) {
 const s=createSim({seed:1,...options});s.spawnAcc=-1e9;s.bossIndex=999;s.eventT=s.shrineT=1e9;
 for(const p of s.players){p.weapons={};p.godMode=true;p.hp=p.maxHp=1e9;}
 return s;
}
function tumble(x,z,mx,mz,dt=TICK) {
 const s=quiet({ground,map:MAP_BY_ID.apache}),p=s.players[0];p.x=x;p.z=z;
 for(let elapsed=0;elapsed<.2-1e-9;elapsed+=dt)step(s,{p1:{mx,mz,use:elapsed===0?4:null}},dt);
 return p;
}
for(const[x,z,mx,mz]of[[170.5,82.5,1,0],[170.5,84.5,1,0],[170.5,86.5,1,0],[170.5,88.5,1,0],[173.5,84.5,-1,0],[173.5,88.5,-1,0],[173.5,87.5,0,1],[173.5,91.5,0,-1]])test(`actual Apache low fence admits full reachable tumble ${x},${z} direction ${mx},${mz}`,()=>{
 const p=tumble(x,z,mx,mz);near(p.x,x+mx*3.6);near(p.z,z+mz*3.6);
});
test('native Apache fence crossing also handles one long frame',()=>{const p=tumble(170.5,84.5,1,0,.2);near(p.x,174.1);});
for(const z of[79.5,80.5])test(`actual Apache blocked row ${z} stays solid`,()=>{const p=tumble(175.5,z,-1,0);assert.ok(p.x>=175,`blocked terrain: ${p.x}`);});
test('a tumble whose full landing remains inside the row89 fence footprint cannot enter it',()=>{const p=tumble(170.5,89.5,1,0);assert.ok(p.x<171,`unreachable landing: ${p.x}`);});

test('reachable ground beyond the map boundary cannot approve a fence landing inside it',()=>{
 const map={...MAP_BY_ID.apache,cx:170.5,cz:84.5,r:1},s=quiet({map,ground}),p=s.players[0];p.x=170.5;p.z=84.5;
 for(let i=0;i<6;i++)step(s,{p1:{mx:1,mz:0,use:i===0?4:null}},TICK);
 assert.ok(p.x<171,`map edge cannot strand a tumble in the fence footprint: ${p.x}`);
});
for(const obstruction of['blocked','walls','structural'])test(`native low fence cannot approve a path ending at ${obstruction}`,()=>{
 const g={...ground,blocked:ground.blocked.slice(),walls:ground.walls.slice(),fences:ground.fences.slice()},k=84*g.n+174;
 if(obstruction==='blocked')g.blocked[k]=1;else if(obstruction==='walls')g.walls[k]=8;else g.fences[k]=0x88;
 const s=quiet({ground:g,map:MAP_BY_ID.apache}),p=s.players[0];p.x=170.5;p.z=84.5;
 for(let i=0;i<6;i++)step(s,{p1:{mx:1,mz:0,use:i===0?4:null}},TICK);
 assert.ok(p.x<171,`invalid full path cannot approve passage through the low fence: ${p.x}`);
});

for(const dt of[TICK,.2])for(const coop of[false,true])test(`a diagonal clearance slide cannot carry fence approval into an unreachable landing: dt=${dt},coop=${coop}`,()=>{
 const n=32,g={n,cell:true,blocked:new Uint8Array(n*n),walls:new Uint8Array(n*n),fences:new Uint8Array(n*n)};
 g.blocked[11*n+12]=1;for(let x=14;x<=15;x++)for(let z=11;z<=12;z++)g.fences[z*n+x]=15;
 const s=quiet({ground:g,map:{...MAP_BY_ID.apache,cx:16,cz:16,r:15},coop,players:coop?[{id:'p1'},{id:'p2'}]:[{id:'p1'}]});
 const p=s.players.at(-1);if(coop){s.players[0].x=8.5;s.players[0].z=8.5;}p.x=12.96;p.z=10.21;
 let slid=false;
 for(let elapsed=0;elapsed<.2-1e-9;elapsed+=dt){
  step(s,{[p.id]:{mx:3,mz:4,use:elapsed===0?4:null}},dt);
  const alongZ=10.21+(p.x-12.96)*4/3;if(Math.abs(p.z-alongZ)>1e-8)slid=true;
  if(slid)assert.equal(g.fences[Math.floor(p.z)*n+Math.floor(p.x)],0,'a deviated roll cannot enter the sealed fence footprint');
 }
 assert.equal(p.rollT,0);assert.equal(g.fences[Math.floor(p.z)*n+Math.floor(p.x)],0,'landing must remain reachable from outside the sealed footprint');
});

test('pace2 beer adds eight seconds to remaining duration while keeping fixed speed, healing and consumption',()=>{
 const s=quiet(),p=s.players[0],speed=playerStats(p).speed;p.hp=10;p.belt=['beer','beer'];
 assert(useBelt(s,'p1',0));assert.equal(p.hp,30);assert.equal(p.buffs.speed,8);near(playerStats(p).speed,speed*1.35);
 for(let i=0;i<60;i++)step(s,{},TICK);
 assert(useBelt(s,'p1',0));near(p.buffs.speed,14);assert.equal(p.hp,50);assert.deepEqual(p.belt,[]);near(playerStats(p).speed,speed*1.35);
 s.pending.p1={left:30,choices:[]};const remaining=p.buffs.speed;for(let i=0;i<60;i++)step(s,{},TICK);assert.equal(p.buffs.speed,remaining);
 delete s.pending.p1;p.buffs.speed=0;p.belt=['beer'];assert(useBelt(s,'p1',0));assert.equal(p.buffs.speed,8);
 p.buffs.speed=-1;p.belt=['beer'];assert(useBelt(s,'p1',0));assert.equal(p.buffs.speed,8);
});
test('pace1 beer retains its exact eight second refresh',()=>{const s=quiet({pace:1}),p=s.players[0];p.buffs.speed=3;p.belt=['beer'];assert(useBelt(s,'p1',0));assert.equal(p.buffs.speed,8);});
test('co-op beer extends only its consumer own duration',()=>{const s=quiet({coop:true,players:[{id:'p1'},{id:'p2'}]}),[a,b]=s.players;a.buffs.speed=4;b.buffs.speed=3;b.belt=['beer'];assert(useBelt(s,'p2',0));assert.equal(a.buffs.speed,4);assert.equal(b.buffs.speed,11);});

// Real kill path; fix the casket draws at each exact boundary while keeping all other draws seeded.
function caskets({ranked=false,pace=2,elite=false,ordinary=.99,bonus=.99,meta={},key=false,coop=false,down=false,type='goblin',treasure=false}={}) {
 const s=quiet({ranked,pace,meta,coop,players:coop?[{id:'p1',meta},{id:'p2'}]:[{id:'p1'}]}),p=s.players[0];
 if(key)p.passives.greed=5;if(down)s.players[1].alive=false;
 spawnEnemy(s,type,p.x+5,p.z);const e=s.enemies.at(-1);e.elite=elite;e.treasure=treasure;
 const seeded=mulberry32(1108);let draw=0;s.rng=()=>{draw++;return draw===4?ordinary:draw===5?bonus:seeded();};
 damageEnemy(s,e,e.hp+1,'p1');assert.equal(s.kills,1);
 return s.pickups.filter(k=>k.kind==='casket').length;
}
for(const[opts,cs]of[[{},1],[{meta:{luck:3}},1.45],[{key:true},2.25],[{meta:{luck:3},key:true},3.2625],[{coop:true},.5],[{coop:true,down:true},1],[{coop:true,meta:{luck:3},key:true},1.63125]]) {
 for(const elite of[false,true])test(`casual pace2 doubles ${elite?'elite':'ordinary'} random casket threshold with modifiers ${JSON.stringify(opts)}`,()=>{
  const threshold=(elite?.08:.0006)*cs;
  for(const ranked of(opts.coop?[false]:[false,true]))for(const delta of[-1e-10,0,1e-10]){
   const at=threshold*(ranked?1:2)+delta,args=elite?{ordinary:.99,bonus:at}:{ordinary:at};
   assert.equal(caskets({...opts,ranked,elite,...args}),delta<0?1:0,`ranked=${ranked},roll=${at}`);
  }
 });
}
test('legacy caskets and guaranteed boss/treasure drops retain their rules',()=>{
 assert.equal(caskets({pace:1,ordinary:.00149}),1);assert.equal(caskets({pace:1,ordinary:.0015}),0);assert.equal(caskets({pace:1,elite:true}),1);
 for(const ranked of[false,true]){assert.equal(caskets({ranked,type:'giant'}),1);assert.equal(caskets({ranked,treasure:true}),2);}
});

for(const mapId of['apache','world'])test(`existing native ${mapId} desert sandstorm reaches snapshot and minimap and expires`,()=>{
 const s=quiet({map:MAP_BY_ID[mapId],ground}),p=s.players[0];p.x=202.5;p.z=85.5;s.t=420;s.eventT=0;s.rng=()=>0;
 step(s,{},TICK);assert.equal(s.event.kind,'sandstorm');assert.equal(s.event.t,12);assert.equal(p.buffs.chill,12);assert.equal(s.enemies.filter(e=>e.type==='scorpion').length,9);
 if(mapId==='world')assert.equal(s.region,'apache');
 for(let i=0;i<60;i++)step(s,{},TICK);
 const v=snapshot(s);assert.equal(v.weather,'sandstorm');assert.equal(v.storm.kind,'sandstorm');assert.equal(v.storm.left,10);near(v.storm.intensity,1);
 let fills=0;const ctx={save(){},restore(){},beginPath(){},arc(){},clip(){},fill(){fills++},fillRect(){fills++},createRadialGradient(){return{addColorStop(){}}}};
 drawStormMinimap(ctx,144,2,v.storm,v.t);assert.ok(fills>0,'actual simulated storm draws minimap haze');
 for(let i=0;i<302;i++)step(s,{},TICK);assert.equal(s.event,null);assert.equal(snapshot(s).storm,null);
});
