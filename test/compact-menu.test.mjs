import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const code=source.slice(source.indexOf('const compactMenu ='),source.indexOf("let PLAYER = 'p1'"));
test('entering compact layout closes both pickers; leaving it preserves manual choices',()=>{
 const nodes={adventurerpick:{open:true},mappick:{open:true}},listeners=new Map();
 const media={matches:false,addEventListener:(event,fn)=>listeners.set(event,fn)};
 Function('matchMedia','$',code)(()=>media,id=>nodes[id]);
 assert.equal(nodes.adventurerpick.open,true);assert.equal(nodes.mappick.open,true);
 listeners.get('change')?.({matches:true});assert.equal(nodes.adventurerpick.open,false);assert.equal(nodes.mappick.open,false);
 nodes.adventurerpick.open=true;listeners.get('change')({matches:false});assert.equal(nodes.adventurerpick.open,true);assert.equal(nodes.mappick.open,false);
});
