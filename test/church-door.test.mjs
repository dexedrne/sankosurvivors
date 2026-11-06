import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
import{createSim,step,TICK}from'../src/sim.js';import{MAP_BY_ID}from'../src/content.js';import{unpackGround}from'../src/ground-pack.js';
const ground=unpackGround(readFileSync(new URL('../tools/vercel-api/ground.bin',import.meta.url)));
function walk(x,z,mx,mz,roll=false){const s=createSim({seed:1106,pace:2,ground,map:MAP_BY_ID.graves}),p=s.players[0];s.spawnAcc=-1e9;s.bossIndex=99;s.eventT=s.shrineT=1e9;p.x=x;p.z=z;p.weapons={};p.godMode=true;for(let i=0;i<(roll?6:20);i++)step(s,{p1:{mx,mz,use:roll&&i===0?4:null}},TICK);return p;}
for(const x of [270.45,270.5,270.55])test(`native chapel south doorway admits walking both ways at x${x}`,()=>{assert.ok(walk(x,249.5,0,-1).z<247);assert.ok(walk(x,246.5,0,1).z>249);});
test('native chapel south door still admits tumble; both adjacent solid walls block walking and tumble',()=>{
 assert.ok(walk(270.5,249.5,0,-1,true).z<247);
 for(const x of [269.5,271.5])for(const roll of [false,true])assert.ok(walk(x,249.5,0,-1,roll).z>248,JSON.stringify({x,roll}));
 assert.ok(walk(277,241.5,1,0).x>278.5,'east doorway unchanged');
});
