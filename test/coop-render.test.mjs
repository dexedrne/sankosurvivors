import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
const source=readFileSync(new URL('../src/render.js',import.meta.url),'utf8');
function effect(kind,f,localId,actors,cam={}){const line=source.split('\n').find(line=>line.includes("else if (f.k === '"+kind+"')"));assert(line);const body=line.slice(line.indexOf('{')+1,line.lastIndexOf('}'));return Function('f','localId','playerActors','slashFx','ringFx','number','cam','spFx',body)(f,localId,actors,()=>{},()=>{},()=>{},cam,{hurt:[]});}
test('native effect handlers animate the attack owner and flash only the hurt local hero',()=>{
 const played=[],actors=new Map(['p1','p2'].map(id=>[id,{kit:{play:()=>played.push(id)}}]));
 effect('slash',{player:'p2',a:1},'p1',actors);effect('spin',{player:'p1'},'p2',actors);assert.deepEqual(played,['p2','p1']);
 const cam={shake:0,flash:0};effect('hurt',{id:'p2'},'p1',actors,cam);assert.deepEqual(cam,{shake:0,flash:0});effect('hurt',{id:'p1'},'p1',actors,cam);assert.deepEqual(cam,{shake:.35,flash:.3});
});
