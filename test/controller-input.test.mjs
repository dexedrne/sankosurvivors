import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const start=main.indexOf('let padPrev ='),end=main.indexOf('// ---- level up UI',start);
assert(start>=0&&end>start);
function fixture(){
 let pads=[],clock=0,focused=true;
 const events=new Map(),keys=new Set(),touch={id:null,x:0,y:0},document={hidden:false,hasFocus:()=>focused,addEventListener:(type,fn)=>events.set(type,fn)};
 const context={navigator:{getGamepads:()=>pads},document,keys,touch,mode:'title',clearTouch(){},addEventListener:(type,fn)=>events.set(type,fn),renderer:{getYaw:()=>0},performance:{now:()=>clock}};
 const blur=main.indexOf("addEventListener('blur', () => { keys.clear();"),pause=main.indexOf('function pause(on)',blur);
 vm.createContext(context);vm.runInContext(main.slice(start,end)+main.slice(blur,pause)+';this.read=readInput;this.edges=padEdges;',context);
 return {...context,pads:value=>pads=value,focus:value=>focused=value,time:value=>clock=value,event:type=>events.get(type)()};
}
const pad=(extra={})=>({mapping:'standard',index:0,id:'Test standard controller',connected:true,axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false})),...extra});
test('standard controller left stick and D-pad retain camera-relative movement and deadzone',()=>{
 const f=fixture(),p=pad();f.pads([null,p]);p.axes=[.1,.1];assert.equal(f.read().mx,0);assert.equal(f.read().mz,0);
 p.axes=[.7,-.5];assert.equal(f.read().mx,.7);assert.equal(f.read().mz,-.5);p.axes=[0,0];p.buttons[14].pressed=true;p.buttons[12].pressed=true;assert.equal(f.read().mx,-1);assert.equal(f.read().mz,-1);
 f.renderer.getYaw=()=>Math.PI/2;assert(Math.abs(f.read().mx+1)<1e-10);assert(Math.abs(f.read().mz-1)<1e-10);
 p.connected=false;assert.equal(f.read().mx,0);assert.equal(f.read().mz,0);
});
test('denied or missing Gamepad API preserves keyboard and touch input',()=>{
 const f=fixture();f.keys.add('d');f.touch.id=1;f.touch.y=-.5;f.navigator.getGamepads=()=>{throw new Error('SecurityError: gamepad disabled');};
 let input;assert.doesNotThrow(()=>input=f.read());assert.equal(input.mx,1);assert.equal(input.mz,-.5);assert.equal(input.pad,null);
 delete f.navigator.getGamepads;assert.equal(f.read().mx,1);
});
test('an unrelated or disconnected device cannot mask the first standard controller',()=>{
 const f=fixture(),unsupported=pad({mapping:'',axes:[-1,0]}),gone=pad({connected:false,axes:[-1,0]}),standard=pad({index:2,axes:[.8,0]});
 f.pads([unsupported,gone,standard]);assert.equal(f.read().pad,standard);assert.equal(f.read().mx,.8);
 f.pads([unsupported]);assert.equal(f.read().pad,null);
});
test('hidden and unfocused pages cannot receive controller movement or actions',()=>{
 const f=fixture(),p=pad({axes:[1,0]});p.buttons[9].pressed=true;f.pads([p]);f.document.hidden=true;assert.equal(f.read().mx,0);assert.equal(f.read().pad,null);
 f.document.hidden=false;f.focus(false);assert.equal(f.read().mx,0);assert.equal(f.read().pad,null);
 f.focus(true);assert.equal(f.read().mx,1);
});
test('held A/Start on initial connection or reconnect needs release before a fresh action',()=>{
 const f=fixture(),p=pad();p.buttons[0].pressed=p.buttons[9].pressed=true;f.pads([p]);let edges=f.edges(f.read().pad);assert(!edges.a);assert(!edges.start);
 p.buttons[0].pressed=p.buttons[9].pressed=false;f.edges(p);p.buttons[0].pressed=p.buttons[9].pressed=true;edges=f.edges(p);assert(edges.a);assert(edges.start);assert(!f.edges(p).a);
 f.edges(null);edges=f.edges(p);assert(!edges.a);assert(!edges.start);
 const other=pad({index:1,id:'Second standard controller'});other.buttons[0].pressed=true;assert(!f.edges(other).a);
});
test('focus restoration cannot treat a controller button held in another app as a new click',()=>{
 const f=fixture(),p=pad();f.pads([p]);f.edges(f.read().pad);f.focus(false);f.edges(f.read().pad);p.buttons[0].pressed=true;f.focus(true);assert(!f.edges(f.read().pad).a);p.buttons[0].pressed=false;f.edges(p);p.buttons[0].pressed=true;assert(f.edges(p).a);
});
test('blur and hidden events reset button edges even when animation frames stop until return',()=>{
 for(const event of ['blur','visibilitychange']){const f=fixture(),p=pad();f.pads([p]);f.edges(p);f.document.hidden=event==='visibilitychange';f.event(event);p.buttons[0].pressed=true;f.document.hidden=false;assert(!f.edges(f.read().pad).a);p.buttons[0].pressed=false;f.edges(p);p.buttons[0].pressed=true;assert(f.edges(p).a);}
});
test('standard face/shoulder/D-pad actions stay edge-triggered and stick repeat retains its delay',()=>{
 const f=fixture(),p=pad();f.edges(p);
 for(const [index,name] of [[0,'a'],[1,'b'],[2,'x'],[3,'y'],[4,'lb'],[5,'rb'],[9,'start'],[12,'up'],[13,'down'],[14,'left'],[15,'right']]){p.buttons[index].pressed=true;assert(f.edges(p)[name]);assert(!f.edges(p)[name]);p.buttons[index].pressed=false;f.edges(p);}
 p.axes=[1,0];assert(f.edges(p).right);f.time(319);assert(!f.edges(p).right);f.time(321);assert(f.edges(p).right);f.time(460);assert(!f.edges(p).right);f.time(462);assert(f.edges(p).right);
});
