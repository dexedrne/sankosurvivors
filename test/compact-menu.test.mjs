import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const code=source.slice(source.indexOf('const compactMenu ='),source.indexOf("let PLAYER = 'p1'"));
test('narrow layout closes both pickers and returning to tablet layout opens them',()=>{
 const nodes={adventurerpick:{open:true},mappick:{open:true}},listeners=new Map();
 const media={matches:false,addEventListener:(event,fn)=>listeners.set(event,fn)};
 Function('matchMedia','$',code)(()=>media,id=>nodes[id]);
 assert.equal(nodes.adventurerpick.open,true);assert.equal(nodes.mappick.open,true);
 listeners.get('change')?.({matches:true});assert.equal(nodes.adventurerpick.open,false);assert.equal(nodes.mappick.open,false);
 nodes.adventurerpick.open=true;listeners.get('change')({matches:false});assert.equal(nodes.adventurerpick.open,true);assert.equal(nodes.mappick.open,true);
});

test('tablet landscape opens pickers while narrow phone layouts collapse them',()=>{
 const nodes={adventurerpick:{open:false},mappick:{open:false}};
 const wide={matches:true,addEventListener(){}},phone={matches:false,addEventListener(event,fn){this.change=fn;}};
 Function('matchMedia','$',code)(query=>query.includes('pointer:coarse')?wide:phone,id=>nodes[id]);
 assert.equal(nodes.adventurerpick.open,true,'the Duo wide display should show available choices');assert.equal(nodes.mappick.open,true);
 phone.change?.({matches:true});assert.equal(nodes.adventurerpick.open,false);assert.equal(nodes.mappick.open,false);
 phone.change?.({matches:false});assert.equal(nodes.adventurerpick.open,true);assert.equal(nodes.mappick.open,true);
});
