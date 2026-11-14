import test from 'node:test';import assert from 'node:assert/strict';
import * as S from '../src/sim.js';import {rankedSim} from '../src/ranked.js';
function scene(week=2){const s=rankedSim({seed:8,mapId:'apache',adv:'adventurer',ground:null,mode:'normal',week});s.spawnAcc=-1e9;s.bossIndex=99;s.eventT=s.shrineT=1e9;s.players[0].weapons={};return s;}
function pickup(s){const p=s.players[0],item={id:s.nextId++,x:p.x,z:p.z,kind:'pumpkin'};s.pickups.push(item);S.step(s);return item;}
test('week2 stores ten Pumpkin bombs in one slot, then leaves overflow on the ground',()=>{
 const s=scene(),p=s.players[0];for(let i=0;i<10;i++)pickup(s);
 assert.deepEqual(p.belt,['pumpkin']);assert.equal(S.beltCount(p,0),10);assert(!s.fx.some(f=>f.k==='nuke'));
 const extra=pickup(s);assert.equal(S.beltCount(p,0),10);assert(s.pickups.includes(extra));assert(!extra.taken);assert(!s.fx.some(f=>f.k==='nuke'));
});
test('one activation spends one bomb, frees capacity and removes only the final bomb slot',()=>{
 const s=scene(),p=s.players[0];for(let i=0;i<10;i++)pickup(s);
 assert(S.useBelt(s,p.id,0));assert.equal(S.beltCount(p,0),9);assert.equal(s.fx.filter(f=>f.k==='nuke').length,1);
 pickup(s);assert.equal(S.beltCount(p,0),10);
 for(let i=0;i<10;i++)assert(S.useBelt(s,p.id,0));assert.equal(p.belt.length,0);assert.equal(S.beltCount(p,0),0);assert(!S.useBelt(s,p.id,0));
});
test('week2 full unrelated belt leaves bombs untouched; an existing stack can grow in a full belt',()=>{
 const s=scene(),p=s.players[0];p.belt=['beer','warp','cheese','trout'];const extra=pickup(s);assert(s.pickups.includes(extra));assert.equal(extra.taken,false);assert(!s.fx.some(f=>f.k==='nuke'));
 p.belt=['beer','warp','cheese','pumpkin'];p.pumpkinStack=2;S.step(s);assert.equal(S.beltCount(p,3),3);assert(!s.pickups.includes(extra));
});
for(const week of [0,1])test('week'+week+' retains separate utility slots and full-belt automatic use',()=>{
 const s=scene(week),p=s.players[0];for(let i=0;i<5;i++)pickup(s);assert.equal(p.belt.length,4);assert(p.belt.every(k=>k==='pumpkin'));assert.equal(S.beltCount(p,0),1);assert(s.fx.some(f=>f.k==='nuke'));assert(!Object.hasOwn(p,'pumpkinStack'));
});
test('snapshot and final build retain bomb quantity alongside five food portions',async()=>{
 const {captureRunBuild}=await import('../src/run-build.js');const s=scene(),p=s.players[0];for(let i=0;i<10;i++)pickup(s);p.belt.push('cheese');p.foodStacks.cheese=5;
 assert.deepEqual(S.snapshot(s).players[0].beltCounts,[10,5]);const rows=captureRunBuild(s,p).sections.find(x=>x.title==='Belt').rows;
 assert(rows.find(x=>x.name==='Pumpkin').details.includes('Quantity: 10'));assert(rows.find(x=>x.name==='Cheese').details.includes('Quantity: 5'));
});
