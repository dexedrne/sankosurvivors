import test from 'node:test';
import assert from 'node:assert/strict';
import { clockPolicy, CLOSE_MS, UPLOAD_MS, IDLE_MS } from '../src/ranked-clock.js';
import { weekStart, pauseRemaining, replay } from '../src/ranked.js';
test('clock admission ends exactly thirty minutes before reset',()=>{
 const deadline=weekStart(1), closesAt=deadline-1800000;
 assert.deepEqual([CLOSE_MS,UPLOAD_MS,IDLE_MS],[1800000,300000,30000]);
 assert.deepEqual(clockPolicy(0,closesAt-1),{deadline,closesAt,admissionOpen:true,remainingMs:1800001});
 assert.equal(clockPolicy(0,closesAt).admissionOpen,false);
 assert.equal(clockPolicy(0,deadline+1).remainingMs,0);
});
test('verified continuous pause credit is additional to the total allowance',()=>{
 for(const ms of [3000,30000,90000]) assert.equal(pauseRemaining(1000,10,11000+ms,Math.min(ms,30000)),1800-Math.max(0,ms-30000)/1000);
 assert.equal(pauseRemaining(1000,10,11000,-1),null);
});
test('only explicit cutoff replay permits an unfinished run',()=>{
 const log={v:1,runs:[[30,0,0]],uses:[],picks:[]}, params={seed:1,mapId:'greentown',adv:'adventurer',ground:null,week:0};
 assert.equal(replay(log,params).error,'the run had not ended');
 assert.equal(replay(log,params,{allowPartial:true}).ticks,30);
 assert.equal(replay(log,params,{allowPartial:true,maxTicks:29}).error,'run too long');
});
