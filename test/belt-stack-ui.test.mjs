import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {bindBeltItem} from '../src/belt-input.js';import {FOOD} from '../src/sim.js';
const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
test('quantity-only HUD changes preserve a pressed food button and its keyboard focus',t=>{
 t.mock.timers.enable({apis:['setTimeout']});const doc={hidden:false,documentElement:{clientWidth:800,clientHeight:600},addEventListener(){},removeEventListener(){}};
 const belt={children:[],set innerHTML(html){for(const old of this.children){old.isConnected=false;if(doc.activeElement===old)doc.activeElement=null;}this.children=[...html.matchAll(/<button([^>]*)>/g)].map(([,attrs])=>{const get=k=>attrs.match(new RegExp('data-'+k+'="([^"]*)"'))?.[1],listeners=new Map(),tip={hidden:true,style:{},getBoundingClientRect:()=>({width:240,height:60})},badge={textContent:'',hidden:false};return{dataset:{kind:get('kind'),i:get('i'),count:get('count')},isConnected:true,ownerDocument:doc,setPointerCapture(){},addEventListener:(k,f)=>listeners.set(k,f),removeEventListener:k=>listeners.delete(k),setAttribute(k,v){this[k]=v;},querySelector:s=>s==='.beltcount'?badge:tip,getBoundingClientRect:()=>({left:8,top:450,bottom:500}),fire(k){listeners.get(k)?.({pointerId:7,pointerType:'touch',clientX:20,clientY:470,preventDefault(){}})}};});}};
 const a=source.indexOf('  const bk = JSON.stringify('),b=source.indexOf('  const wk = JSON.stringify(',a);assert(a>=0&&b>a);
 const draw=Function('$','bindBeltItem','FOOD',`const PLAYER='p1',BELT_SIZE=4,mode='play',waitingForMove=false,sim={pace:2,pending:{},players:[{belt:['cheese']}]},slotCache={},imgTag=()=>'';let beltDisposers=[],pendingUse=null;return{draw(me){${source.slice(a,b)}},use:()=>pendingUse};`)(()=>belt,bindBeltItem,FOOD);
 draw.draw({belt:['cheese'],beltCounts:[3]});const original=belt.children[0];doc.activeElement=original;original.fire('pointerdown');t.mock.timers.tick(80);
 draw.draw({belt:['cheese'],beltCounts:[4]});assert.equal(belt.children[0],original);assert.equal(doc.activeElement,original);original.fire('pointerup');assert.equal(draw.use(),0);
 assert.equal(original.querySelector('.beltcount').textContent,'×4');assert.equal(original['aria-label'],'Cheese ×4');
});
