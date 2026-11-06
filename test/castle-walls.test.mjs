import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
import{createSim,step,spawnEnemy,TICK}from'../src/sim.js';import{MAP_BY_ID}from'../src/content.js';import{unpackGround}from'../src/ground-pack.js';
const raw=unpackGround(readFileSync(new URL('../tools/vercel-api/ground.bin',import.meta.url)));
function fixture({pace=2,ground=raw,x=328,z=335}={}){const s=createSim({seed:1106,pace,ground,map:MAP_BY_ID.greentown});s.spawnAcc=-1e9;s.bossIndex=99;s.eventT=s.shrineT=1e9;const p=s.players[0];p.x=x;p.z=z;p.weapons={};p.godMode=true;p.hp=p.maxHp=1e6;return{s,p};}
const cell=(g,x,z)=>{const f=g.cell?Math.floor:Math.round;return[f(x),f(z)];};
function illegalCorner(g,a,b){const[x,z]=cell(g,...a),[nx,nz]=cell(g,...b);return x!==nx&&z!==nz&&(g.blocked[z*g.n+nx]||g.blocked[nz*g.n+x]);}
function chase(pace=2){const{s,p}=fixture({pace});spawnEnemy(s,'goblin',333,335);const e=s.enemies[0];e.rise=0;const path=[];for(let i=0;i<900;i++){const from=[e.x,e.z];step(s,{p1:{}},TICK);path.push({from,to:[e.x,e.z]});s.fx.length=0;}return {s,p,e,path};}
test('actual castle-side house: enemies route through its west doorway, without diagonal wall shortcuts',()=>{
 const{s,p,e,path}=chase();assert.ok(path.every(({from,to})=>!illegalCorner(s.ground,from,to)),'no diagonal through either blocked side cell');
 assert.ok(path.some(({from,to})=>from[0]<325&&to[0]>=325&&to[1]>=336&&to[1]<337),'enters by the real west doorway');assert.ok(Math.hypot(e.x-p.x,e.z-p.z)<1.3,'reaches the player instead of sticking at the corner');
});
test('actual castle house: a player cannot cut its south-east blocked corner',()=>{
 const{s,p}=fixture({x:331.01,z:338.01});assert.equal(raw.blocked[337*512+331],1);assert.equal(raw.blocked[338*512+330],1);step(s,{p1:{mx:-1,mz:-1}},TICK);assert.ok(p.x>=331||p.z>=338,JSON.stringify({x:p.x,z:p.z}));
});
for(const [sx,sz]of[[1,1],[1,-1],[-1,1],[-1,-1]])for(const actor of ['player','enemy'])test(`closed blocked corner stays solid: ${actor} direction ${sx}/${sz}`,()=>{
 const n=32,g={n,cell:true,blocked:new Uint8Array(n*n),walls:new Uint8Array(n*n),water:null,fences:null};const bx=16,bz=16,x=bx-sx*.01,z=bz-sz*.01,ix=Math.floor(x),iz=Math.floor(z),nx=Math.floor(x+sx*.1),nz=Math.floor(z+sz*.1);g.blocked[iz*n+nx]=g.blocked[nz*n+ix]=1;
 const{s,p}=fixture({ground:g,x:actor==='player'?x:x+sx*2,z:actor==='player'?z:z+sz*2});let o=p;
 if(actor==='enemy'){spawnEnemy(s,'goblin',x,z);o=s.enemies[0];o.rise=0;}
 const before=[o.x,o.z];step(s,{p1:actor==='player'?{mx:sx,mz:sz}:{}},TICK);assert.ok(!illegalCorner(g,before,[o.x,o.z]));
});
for(const actor of ['player','enemy'])test(`blocked single-side corner slides without crossing: ${actor}`,()=>{
 const n=32,g={n,cell:true,blocked:new Uint8Array(n*n),walls:new Uint8Array(n*n),water:null,fences:null};g.blocked[15*n+16]=1;const{s,p}=fixture({ground:g,x:actor==='player'?15.99:18,z:actor==='player'?15.99:18});let o=p;
 if(actor==='enemy'){spawnEnemy(s,'goblin',15.99,15.99);o=s.enemies[0];o.rise=0;}
 const before=[o.x,o.z];for(let i=0;i<10;i++){const from=[o.x,o.z];step(s,{p1:actor==='player'?{mx:1,mz:1}:{}},TICK);assert.ok(!illegalCorner(g,from,[o.x,o.z]));}assert.ok(o.z>before[1]);assert.ok(!g.blocked[Math.floor(o.z)*n+Math.floor(o.x)]);
});
for(const axis of ['x','z'])test(`a fast knockback cannot jump a one-cell solid wall along ${axis}`,()=>{
 const n=32,g={n,cell:true,blocked:new Uint8Array(n*n),walls:new Uint8Array(n*n),water:null,fences:null};for(let i=0;i<n;i++)g.blocked[axis==='x'?i*n+16:16*n+i]=1;
 const{s,p}=fixture({ground:g,x:12,z:12});spawnEnemy(s,'goblin',axis==='x'?15.7:12,axis==='z'?15.7:12);const e=s.enemies[0];e.rise=0;e['k'+axis]=90;step(s,{p1:{}},TICK);assert.ok(e[axis]<16,JSON.stringify({x:e.x,z:e.z}));
});
test('pace1 keeps the actual original corner shortcut exactly',()=>{
 const{path}=chase(1);assert.ok(path.some(({from,to})=>illegalCorner(raw,from,to)),'legacy ranked week0 is unchanged');
 const{s,p}=fixture({pace:1,x:331.01,z:338.01});step(s,{p1:{mx:-1,mz:-1}},TICK);assert.ok(p.x<331&&p.z<338);
});
test('open ground and no-ground movement remain available',()=>{
 for(const ground of[null,{n:32,cell:true,blocked:new Uint8Array(1024),walls:new Uint8Array(1024)}]){const{s,p}=fixture({ground,x:15.5,z:15.5});step(s,{p1:{mx:1,mz:1}},TICK);assert.ok(p.x>15.5&&p.z>15.5);assert.ok(Number.isFinite(p.x+p.z));}
});

test('vertex-grid ground also rejects diagonal blocked corners',()=>{
 const n=32,g={n,cell:false,blocked:new Uint8Array(n*n),walls:new Uint8Array(n*n)};g.blocked[15*n+16]=g.blocked[16*n+15]=1;
 const{s,p}=fixture({ground:g,x:15.49,z:15.49});step(s,{p1:{mx:1,mz:1}},TICK);assert.ok(p.x<15.5||p.z<15.5);
});
test('a room sealed by blocked cells cannot be entered through its open diagonal corner cells',()=>{
 const n=32,g={n,cell:true,blocked:new Uint8Array(n*n),walls:new Uint8Array(n*n)};for(let i=13;i<20;i++){g.blocked[12*n+i]=g.blocked[20*n+i]=g.blocked[i*n+12]=g.blocked[i*n+20]=1;}
 const{s}=fixture({ground:g,x:16,z:16});spawnEnemy(s,'goblin',10,10);const e=s.enemies[0];e.rise=0;
 for(let i=0;i<600;i++){const from=[e.x,e.z];step(s,{p1:{}},TICK);assert.ok(!illegalCorner(g,from,[e.x,e.z]));assert.ok(!(e.x>=13&&e.x<20&&e.z>=13&&e.z<20));}
});
test('a very fast shove still checks thin wall edges beyond eight cells',()=>{
 const n=64,g={n,cell:true,blocked:new Uint8Array(n*n),walls:new Uint8Array(n*n)};for(let z=0;z<n;z++)g.walls[z*n+20]=8;
 const{s}=fixture({ground:g,x:4,z:16});spawnEnemy(s,'goblin',5,16);const e=s.enemies[0];e.rise=0;e.kx=900;step(s,{p1:{}},TICK);assert.ok(e.x<20);
});
test('larger ordinary player steps cannot skip a one-cell blocked wall',()=>{
 const n=32,g={n,cell:true,blocked:new Uint8Array(n*n),walls:new Uint8Array(n*n)};for(let z=0;z<n;z++)g.blocked[z*n+16]=1;
 const{s,p}=fixture({ground:g,x:15.3,z:15});step(s,{p1:{mx:1,mz:0}},.4);assert.ok(p.x<16);
});
test('genuine ground-backed ranked input and mid-tumble restore continue identically',async()=>{
 const{rankedSim,RunRecorder}=await import('../src/ranked.js');const{rankedStep,rankedChoice,resumeRanked}=await import('../src/ranked-play.js');
 const params={seed:711,week:1,mode:'normal',mapId:'greentown',adv:'adventurer',ground:raw};let sim=rankedSim(params),rec=new RunRecorder(),cut=false;
 for(let i=0;i<700&&!sim.over;i++){if(sim.pending.p1){rankedChoice(sim,rec,0);continue;}rankedStep(sim,rec,1,1,4);sim.fx.length=0;if(sim.tick>100&&sim.players[0].rollT>0){cut=true;break;}}
 assert.ok(cut);const back=resumeRanked(JSON.parse(JSON.stringify(rec.log())),params);assert.deepEqual(back.sim.players,sim.players);assert.deepEqual(back.rec.log(),rec.log());
 for(let i=0;i<150&&!sim.over;i++){if(sim.pending.p1){rankedChoice(sim,rec,0);rankedChoice(back.sim,back.rec,0);}else{rankedStep(sim,rec,-1,1,4);rankedStep(back.sim,back.rec,-1,1,4);}sim.fx.length=back.sim.fx.length=0;}
 assert.deepEqual(back.sim.players,sim.players);assert.deepEqual(back.sim.enemies,sim.enemies);assert.deepEqual(back.rec.log(),rec.log());assert.deepEqual([back.sim.tick,back.sim.kills],[sim.tick,sim.kills]);
});

test('a nearby player behind the actual house corner still sends enemies through the doorway',()=>{
 const{s,p}=fixture({x:330.8,z:337.8});spawnEnemy(s,'goblin',331.05,338.05);const e=s.enemies[0];e.rise=0;let door=false;
 for(let i=0;i<900;i++){const x=e.x;step(s,{p1:{}},TICK);if(x<325&&e.x>=325&&e.z>=336&&e.z<337)door=true;s.fx.length=0;}
 assert.ok(door);assert.ok(Math.hypot(e.x-p.x,e.z-p.z)<1.3);
});
test('nearby enemies route around a thin wall instead of sticking against it',()=>{
 const n=32,g={n,cell:true,blocked:new Uint8Array(n*n),walls:new Uint8Array(n*n)};for(let z=14;z<19;z++)g.walls[z*n+16]=8;
 const{s,p}=fixture({ground:g,x:15.65,z:16.5});spawnEnemy(s,'goblin',16.35,16.5);const e=s.enemies[0];e.rise=0;let around=false;
 for(let i=0;i<600;i++){const x=e.x,z=e.z;step(s,{p1:{}},TICK);if(x>=16&&e.x<16){const crossing=z+(e.z-z)*(16-x)/(e.x-x);assert.ok(crossing<14||crossing>=19);around=true;}s.fx.length=0;}
 assert.ok(around);assert.ok(Math.hypot(e.x-p.x,e.z-p.z)<1.3);
});
for(const pace of[1,2])test(`actual blocked house corner contact follows pace ${pace} rules`,()=>{
 const{s,p}=fixture({pace,x:330.8,z:337.8});p.godMode=false;p.hp=100;p.inv=0;spawnEnemy(s,'goblin',331.05,338.05);s.enemies[0].rise=0;step(s,{p1:{}},TICK);assert.equal(p.hp<100,pace===1);
});
for(const kind of['thin','solid','open','near-wall','no-ground'])test(`enemy contact respects ${kind} ground without giving open-ground immunity`,()=>{
 const n=32,g={n,cell:true,blocked:new Uint8Array(n*n),walls:new Uint8Array(n*n)};
 if(kind==='thin')g.walls[16*n+16]=8;
 if(kind==='solid')for(let z=0;z<n;z++)g.blocked[z*n+16]=1;
 if(kind==='near-wall')g.walls[16*n+16]=2;
 const{s,p}=fixture({ground:kind==='no-ground'?null:g,x:kind==='near-wall'?16.9:16.35,z:16.5});p.godMode=false;p.hp=100;p.inv=0;
 spawnEnemy(s,kind==='solid'?'giant':'goblin',kind==='near-wall'?16.4:15.7,16.5);const e=s.enemies[0];e.rise=0;e.actT=100;e.slamT=100;step(s,{p1:{}},TICK);
 assert.equal(p.hp<100,['open','near-wall','no-ground'].includes(kind));
});
