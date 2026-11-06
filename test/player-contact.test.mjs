import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSim, spawnEnemy, step, TICK, snapshot } from '../src/sim.js';
import { MAP_BY_ID, ENEMIES, PLAYER_BASE } from '../src/content.js';
import { unpackGround } from '../src/ground-pack.js';
const actual=unpackGround(readFileSync(new URL('../tools/vercel-api/ground.bin',import.meta.url)));
function scene({ground=null,pace=2,x=365,z=300}={}){
 const s=createSim({seed:1106,pace,ground,map:MAP_BY_ID.greentown}),p=s.players[0];p.x=x;p.z=z;p.weapons={};p.godMode=true;p.hp=p.maxHp=1e6;s.spawnAcc=-1e9;s.bossIndex=99;s.eventT=s.shrineT=1e9;
 return{s,p,add(type,dx,dz=0){spawnEnemy(s,type,p.x+dx,p.z+dz);const e=s.enemies.at(-1);e.rise=0;e.atkCd=1e9;return e;}};
}
const distance=(p,e)=>Math.hypot(e.x-p.x,e.z-p.z);
function run(s,ticks=300){for(let n=0;n<ticks;n++){step(s,{p1:{}},TICK);s.fx.length=0;}}
for(const ground of [null,actual])for(const type of ['chicken','goblin','slimer','ogre'])test(`${type} stops outside stationary player centre and still contacts, ground=${!!ground}`,()=>{
 const{s,p,add}=scene({ground}),e=add(type,4);run(s);const min=(ENEMIES[type].r+PLAYER_BASE.radius)*.9;assert.ok(distance(p,e)>=min,JSON.stringify({type,distance:distance(p,e)}));assert.ok(distance(p,e)<ENEMIES[type].r+PLAYER_BASE.radius);assert.ok(p.hp<1e6);
 const positions=[];for(let n=0;n<60;n++){step(s,{p1:{}},TICK);positions.push([e.x,e.z]);s.fx.length=0;}
 assert.ok(positions.every(([x,z])=>Math.hypot(x-positions[0][0],z-positions[0][1])<.02),'no centre-side oscillation');
 const view=snapshot(s),monster=view.enemies.find(row=>row[0]===e.id);assert.ok(Math.hypot(monster[2]-p.x,monster[3]-p.z)>.5,'rounded view no longer places enemy on player');
});
for(const count of [1,12])test(`${count} exactly coincident goblins resolve deterministically and cannot become contact-immune`,()=>{
 const a=scene(),b=scene();for(let n=0;n<count;n++){a.add('goblin',0);b.add('goblin',0);}run(a.s,120);run(b.s,120);
 assert.ok(a.p.hp<1e6);assert.ok(a.s.enemies.every(e=>distance(a.p,e)>=.9));assert.deepEqual(a.s.enemies.map(e=>[e.x,e.z]),b.s.enemies.map(e=>[e.x,e.z]));
});
for(const count of [2,12,36])test(`${count} pursuing goblins cannot crowd-separate inward through the player`,()=>{
 const{s,p,add}=scene();for(let n=0;n<count;n++){const a=n*Math.PI*2/count;add('goblin',4*Math.cos(a),4*Math.sin(a));}run(s,600);
 assert.ok(s.enemies.every(e=>distance(p,e)>=.9),JSON.stringify(s.enemies.map(e=>distance(p,e))));assert.ok(p.hp<1e6);
});
test('outward knockback remains outward and inward knockback cannot push a normal mob into the player',()=>{
 const a=scene(),e=a.add('goblin',1);e.kx=8;step(a.s,{p1:{}},TICK);assert.ok(e.x-a.p.x>1.1);
 const b=scene(),other=b.add('goblin',1.1);other.kx=-20;step(b.s,{p1:{}},TICK);assert.ok(distance(b.p,other)>=.9);
});
test('boss windup stays put, its charge crosses the target, then ordinary chase restores stand-off',()=>{
 const{s,p,add}=scene(),e=add('ogre',-4);e.charge={wind:.1,dash:.9,dx:1,dz:0};const before=e.x;step(s,{p1:{}},TICK);assert.equal(e.x,before);
 let crossed=false;for(let n=0;n<40;n++){step(s,{p1:{}},TICK);if(e.x>p.x)crossed=true;s.fx.length=0;}assert.equal(crossed,true);
 run(s,300);assert.ok(distance(p,e)>=(ENEMIES.ogre.r+PLAYER_BASE.radius)*.9);
});
test('sealed thin wall still prevents contact and correction cannot push through it',()=>{
 const n=32,g={n,cell:true,blocked:new Uint8Array(n*n),walls:new Uint8Array(n*n)};for(let z=0;z<n;z++)g.walls[z*n+16]=8;
 const{s,p,add}=scene({ground:g,x:15.65,z:16.5}),e=add('goblin',.7);run(s,120);assert.equal(p.hp,1e6);assert.ok(e.x>=16.35-1e-8);assert.equal(p.x,15.65);
});
test('a real doorway still permits pursuit into contact without clipping the wall',()=>{
 const{s,p,add}=scene({ground:actual,x:325.8,z:334.5}),e=add('goblin',324-p.x,336.5-p.z);run(s,600);assert.ok(distance(p,e)<1.1);assert.ok(distance(p,e)>=.9);assert.ok(p.hp<1e6);
});
test('pace1 retains its exact legacy coincident-enemy behavior',()=>{
 const{s,p,add}=scene({pace:1}),e=add('goblin',0);run(s,120);assert.equal(distance(p,e),0);assert.equal(p.hp,1e6);
});

for(const axis of ['x','z'])for(const side of [-1,1])for(const offset of [0,.1])test(`wall-pinned overlap escapes legally axis=${axis} side=${side} offset=${offset}`,()=>{
 const n=32,g={n,cell:true,blocked:new Uint8Array(n*n),walls:new Uint8Array(n*n)};
 for(let i=0;i<n;i++)g.walls[axis==='x'?i*n+16:16*n+i]=axis==='x'?8:1;
 const along=16+side*.35,x=axis==='x'?along:16.5,z=axis==='z'?along:16.5;
 const{s,p,add}=scene({ground:g,x:x+(axis==='x'?side*offset:0),z:z+(axis==='z'?side*offset:0)}),e=add('goblin',x-p.x,z-p.z);e.id=4;
 for(let i=0;i<300;i++){const before={x:e.x,z:e.z};step(s,{p1:{}},TICK);s.fx.length=0;assert.ok(Math.hypot(e.x-before.x,e.z-before.z)<=e.speed*TICK+1e-8,'bounded escape speed');assert.ok(side*((axis==='x'?e.x:e.z)-16)>=.35-1e-8,'solid wall margin');}
 assert.ok(distance(p,e)>=.9,JSON.stringify({axis,side,offset,distance:distance(p,e)}));assert.ok(p.hp<1e6,'contact still hurts');
});
