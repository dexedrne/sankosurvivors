import test from 'node:test';
import assert from 'node:assert/strict';
import {predictedView} from '../src/coop-view.js';
test('prediction changes only the local rendered pose without touching confirmed state or other actors',()=>{
 const view={players:[{id:'p1',x:1,z:2,f:0,mv:0,hp:50},{id:'p2',x:3,z:4,f:0,mv:0,hp:40}],kills:2};
 const original=structuredClone(view),pose={x:7,z:8,f:1,mv:1,hp:999,kills:999};
 const rendered=predictedView(view,pose,'p2');assert.deepEqual(view,original);assert.equal(rendered.players[0],view.players[0]);assert.deepEqual(rendered.players[1],{...view.players[1],x:7,z:8,f:1,mv:1});assert.equal(rendered.kills,2);
 assert.equal(predictedView(view,null,'p2'),view);
});
