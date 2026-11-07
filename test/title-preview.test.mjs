import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSim,findWalkable} from '../src/sim.js';
import {MAP_BY_ID} from '../src/content.js';
const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const block=source.slice(source.indexOf('        if (!window.__idleSim) {'),source.indexOf('        const v = snapshot(window.__idleSim)'));
function preview(map,existing) {
  const window={__idleSim:existing};
  Function('window','createSim','findWalkable','MAP_BY_ID','selMap',`
    const renderer={},PLAYER='p1',selAdv='adventurer',runAdv=()=>({id:'adventurer'}),getGear=()=>({});
    ${block}
  `)(window,createSim,findWalkable,MAP_BY_ID,map);
  return window.__idleSim;
}
test('requested title previews use clear native spots while real runs retain their spawn',()=>{
  for(const [map,x,z] of [['greentown',378.5,270.5],['apache',202.5,85.5],['world',378.5,270.5]]) {
    const sim=preview(map);assert.equal(sim.players[0].x,x);assert.equal(sim.players[0].z,z);
    assert.equal(preview(map,sim),sim,'existing preview is retained');
    const run=createSim({map:MAP_BY_ID[map]});
    assert.ok(Math.abs(run.players[0].x-MAP_BY_ID[map].cx-1.5)<1e-8);assert.equal(run.players[0].z,MAP_BY_ID[map].cz,'actual runs retain their spawn');
  }
});
test('other maps retain their own native preview spawn',()=>{
  const sim=preview('goblins');assert.ok(Math.abs(sim.players[0].x-MAP_BY_ID.goblins.cx-1.5)<1e-8);assert.equal(sim.players[0].z,MAP_BY_ID.goblins.cz);
});
