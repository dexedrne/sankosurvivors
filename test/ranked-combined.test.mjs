import test from 'node:test';
import assert from 'node:assert/strict';
import * as ranked from '../src/ranked.js';

test('combined points add nonnegative whole kills and survival seconds',()=>{
 assert.equal(typeof ranked.rankedPoints,'function');
 assert.equal(ranked.rankedPoints(12000,1200),13200);
 assert.equal(ranked.rankedPoints(12.9,180.9),192);
 assert.equal(ranked.rankedPoints(-3,180),180);
 assert.equal(ranked.rankedPoints(null,undefined),0);
 assert.equal(ranked.rankedPoints(Infinity,NaN),0);
});
test('week1 combined points beat KPM, equal points use exact KPM then original finish order',()=>{
 const rows=[
  {id:1,t:179,kills:100000,at:1},
  {id:2,t:1200,kills:6000,at:2},
  {id:3,t:3600,kills:9000,at:3},
  {id:4,t:600,kills:2000,at:5},
  {id:5,t:1200,kills:1400,at:0},
  {id:6,t:600,kills:2000,at:4},
  {id:7,t:600,kills:2000,at:4},
 ];
 const sorted=[...rows].sort(ranked.compareRuns(1));assert.deepEqual(sorted.map(r=>r.id),[3,2,6,7,4,5,1]);
 assert.deepEqual(ranked.scoreKey(1,rows[3]),[1,2600,200000000,2000]);
 assert.deepEqual(ranked.scoreKey(1,{t:601,kills:100}),[1,701,9983361,100]);
 assert.deepEqual(ranked.prizePlaces(sorted,1),[0,1,2,3,4,5,-1]);
 assert.deepEqual(ranked.scoreKey(0,{t:1200,kills:12000}),[0,1200,12000]);
 assert.deepEqual([...rows].sort(ranked.compareRuns(0)).map(r=>r.id),[3,2,5,6,7,4,1]);
});
