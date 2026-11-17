import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const source=fs.readFileSync(new URL('../src/render.js',import.meta.url),'utf8'),a=source.indexOf('  let drag = null; const rotKeys'),b=source.indexOf('  function zoomBy(',a),code=source.slice(a,b),advance=source.split('\n').find(line=>line.includes('cam.yaw += ((rotKeys.e'));
assert(a>=0&&b>a&&advance);
function fixture(){const window=new EventTarget(),document=new EventTarget();document.hidden=false;const cam={yaw:0,pitch:1,zoomT:1},state=Function('window','document','cam','canvas',code+'\nreturn {step(dt){'+advance+'},read:()=>({drag,keys:{...rotKeys}})};')(window,document,cam,{});return{cam,document,state,emit(target,type,values={}){const event=new Event(type,{cancelable:true});Object.assign(event,values);(target==='window'?window:document).dispatchEvent(event);return event;}};}
for(const kind of ['blur','hidden'])test(`${kind} releases both camera rotation keys without changing the camera pose`,()=>{
 const f=fixture();for(const key of ['q','e'])f.emit('window','keydown',{key});f.cam.yaw=1.25;
 if(kind==='blur')f.emit('window','blur');else{f.document.hidden=true;f.emit('document','visibilitychange');}
 assert.deepEqual(f.state.read().keys,{q:false,e:false});assert.equal(f.cam.yaw,1.25);assert.equal(f.cam.pitch,1);assert.equal(f.cam.zoomT,1);f.state.step(.1);assert.equal(f.cam.yaw,1.25);
 f.emit('window','keydown',{key:'e'});f.state.step(.1);assert.equal(f.cam.yaw,1.43,'a new key press still rotates');
});
for(const kind of ['blur','hidden'])test(`${kind} ends a middle-mouse drag before later movement reaches the page`,()=>{
 const f=fixture();f.emit('window','mousedown',{button:1,clientX:10,clientY:10});f.emit('window','mousemove',{clientX:30,clientY:20});assert.equal(f.cam.yaw,-.12);const before={...f.cam};
 if(kind==='blur')f.emit('window','blur');else{f.document.hidden=true;f.emit('document','visibilitychange');}
 f.emit('window','mousemove',{clientX:500,clientY:500});assert.deepEqual(f.cam,before);assert.equal(f.state.read().drag,null);
 f.emit('window','mousedown',{button:1,clientX:50,clientY:50});f.emit('window','mousemove',{clientX:60,clientY:50});assert.equal(f.cam.yaw,-.18);
});
test('visible notifications preserve held controls and ordinary release still ends rotation and drag',()=>{
 const f=fixture();f.emit('window','keydown',{key:'Q'});f.emit('window','mousedown',{button:1,clientX:10,clientY:10});f.emit('document','visibilitychange');assert.equal(f.state.read().keys.q,true);assert(f.state.read().drag);f.state.step(.1);assert.equal(f.cam.yaw,-.18000000000000002);
 f.emit('window','keyup',{key:'Q'});f.emit('window','mouseup',{button:1});assert.deepEqual(f.state.read(),{drag:null,keys:{q:false,e:false}});
});
