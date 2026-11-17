import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const source=fs.readFileSync(new URL('../src/render.js',import.meta.url),'utf8');
const lines=source.split('\n').filter(line=>line.includes("window.addEventListener('keydown'" )||line.includes("window.addEventListener('keyup'"));assert.equal(lines.length,4);
function fixture(){const callbacks={},writes=[];const state=Function('window','localStorage',`let roofsOff=false;const roofHidden=new Set(),rotKeys={q:false,e:false},cam={yaw:1,pitch:1,zoomT:1};${lines.join('\n')}\nreturn()=>({roofsOff,roofKeys:roofHidden.size,rotKeys:{...rotKeys},cam:{...cam}});`)({addEventListener(type,fn){(callbacks[type]??=[]).push(fn);}},{setItem(k,v){writes.push([k,v]);}});return{state,writes,send(key,target,type='keydown'){const e={key,target,repeat:false,preventDefault(){throw Error('Text shortcuts must retain native behavior');}};for(const fn of callbacks[type]||[])fn(e);}};}
const target=(tag,editable=false)=>({isContentEditable:editable,matches:selector=>selector.split(',').some(s=>s.trim()===tag)});
const initial={roofsOff:false,roofKeys:0,rotKeys:{q:false,e:false},cam:{yaw:1,pitch:1,zoomT:1}};
for(const [name,node]of [['input',target('input')],['textarea',target('textarea')],['select',target('select')],['editable descendant',target('span',true)]]){
 test(`${name} typing cannot toggle roofs or write the roof preference`,()=>{const f=fixture();f.send('t',node);assert.deepEqual(f.state(),initial);assert.deepEqual(f.writes,[]);});
 test(`${name} typing cannot hold camera turn keys or reset the view with Home`,()=>{const f=fixture();for(const key of ['q','e','Home'])f.send(key,node);assert.deepEqual(f.state(),initial);});
 test(`${name} plus and minus retain the camera zoom`,()=>{for(const key of ['+','=','-','_']){const f=fixture();f.send(key,node);assert.deepEqual(f.state(),initial);}});
}
for(const [name,node]of [['body',target('body')],['button',target('button')]])test(`${name} keeps ordinary roof, rotation and zoom shortcuts`,()=>{
 const f=fixture();for(const key of ['t','q','e','+'])f.send(key,node);const s=f.state();assert.equal(s.roofsOff,true);assert.equal(s.roofKeys,1);assert.deepEqual(s.rotKeys,{q:true,e:true});assert(Math.abs(s.cam.zoomT-.8695652173913044)<1e-12);assert.deepEqual(f.writes,[['sq-roofs','off']]);
});
test('releasing keys over an editable field still clears earlier camera holds',()=>{const f=fixture();for(const key of ['q','e'])f.send(key,target('body'));for(const key of ['q','e'])f.send(key,target('input'),'keyup');assert.deepEqual(f.state().rotKeys,{q:false,e:false});});
