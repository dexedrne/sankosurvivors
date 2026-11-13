import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/render.js',import.meta.url),'utf8');
const start=source.indexOf('    // camera\n'),end=source.indexOf('    const gy =',start);assert(start>0&&end>start);
const frame=Function('settings','cam','reducedMotion','dt','Math',source.slice(start,end)+'return {sx,sz};');
const fixedRandom=Object.assign(Object.create(Math),{random:()=>.75});
for(const shake of [true,false])for(const reduce of [true,false])test(`camera shake ${shake} with device reduced motion ${reduce}`,()=>{
 const settings={shake},cam={shake:.4,flash:.3},saved={...settings};const result=frame(settings,cam,{matches:reduce},.05,fixedRandom);
 const expected=shake && !reduce ? .07 : 0;assert(Math.abs(result.sx-expected)<1e-12);assert(Math.abs(result.sz-expected)<1e-12);
 assert.deepEqual(settings,saved);assert(Math.abs(cam.shake-.35)<1e-12);assert.equal(cam.flash,.25,'hit feedback keeps its existing decay');
});
test('live device preference changes take effect without overwriting the saved shake choice',()=>{
 const settings={shake:true},preference={matches:false},cam={shake:.4,flash:0};
 assert(frame(settings,cam,preference,0,fixedRandom).sx>0);preference.matches=true;assert.equal(frame(settings,cam,preference,0,fixedRandom).sx,0);preference.matches=false;assert(frame(settings,cam,preference,0,fixedRandom).sx>0);assert.equal(settings.shake,true);
});
test('browsers without a motion preference retain the existing shake control',()=>{
 assert(frame({shake:true},{shake:.4,flash:0},undefined,0,fixedRandom).sx>0);assert.equal(frame({shake:false},{shake:.4,flash:0},undefined,0,fixedRandom).sx,0);
});
