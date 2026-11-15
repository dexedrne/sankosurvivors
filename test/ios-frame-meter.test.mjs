import test from 'node:test';
import assert from 'node:assert/strict';
import {createFrameMeter} from '../tools/ios/frame-meter.mjs';
test('distinguishes30callbacks from60callbacks with30draws and measures render work',()=>{
 for(const hz of [30,60]){let clock=0,reports=[];const meter=createFrameMeter(r=>reports.push(r),()=>clock);meter.frame(0,'play');
 for(let i=1;i<=hz;i++){if(hz===30||i%2===0)meter.draw(()=>{clock+=4;return 42;});meter.frame(i*1000/hz,'play');}
 assert.deepEqual(reports,[{mode:'play',callbacks:hz,draws:30,renderMs:4}]);}
});
test('hidden and changed modes reset samples rather than reporting background as slow gameplay',()=>{
 const reports=[],m=createFrameMeter(r=>reports.push(r),()=>0);m.frame(0,'play');m.frame(500,'play',false);m.frame(10000,'play');m.frame(10100,'pause');assert.deepEqual(reports,[]);m.frame(11100,'pause');assert.equal(reports[0].mode,'pause');
});
test('draw wrapper preserves return values and errors',()=>{
 const meter=createFrameMeter(()=>{},()=>0);assert.equal(meter.draw(()=>23),23);const failure=Error('draw');assert.throws(()=>meter.draw(()=>{throw failure}),e=>e===failure);
});
