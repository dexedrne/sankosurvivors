import test from 'node:test';
import assert from 'node:assert/strict';
// Real controller; the document boundary models supported, denied and absent browser APIs.
const load = () => import('../src/fullscreen.js');
const fixture = () => {
  const calls=[], listeners=new Map(), button={hidden:false,disabled:false,textContent:''};
  const doc={fullscreenEnabled:true,fullscreenElement:null,documentElement:{async requestFullscreen(options){calls.push(options);doc.fullscreenElement=this;listeners.get('fullscreenchange')();}},async exitFullscreen(){calls.push('exit');doc.fullscreenElement=null;listeners.get('fullscreenchange')();},addEventListener:(type,fn)=>listeners.set(type,fn)};
  return {doc,button,calls,listeners};
};
test('fullscreen is gesture-only, uses hidden navigation and tracks native exit',async()=>{
  const {setupFullscreen}=await load(),f=fixture();let errors=0;
  setupFullscreen(f.button,()=>errors++,f.doc);assert.deepEqual(f.calls,[]);assert.equal(f.button.hidden,false);
  await f.button.onclick();assert.deepEqual(f.calls,[{navigationUI:'hide'}]);assert.equal(f.button.textContent,'Exit fullscreen');
  f.doc.fullscreenElement=null;f.listeners.get('fullscreenchange')();assert.equal(f.button.textContent,'Enter fullscreen');
  await f.button.onclick();await f.button.onclick();assert.equal(f.calls.at(-1),'exit');assert.equal(errors,0);
});
test('denied or unsupported fullscreen preserves the page and allows retry',async()=>{
  const {setupFullscreen}=await load(),f=fixture();let errors=0;
  f.doc.documentElement.requestFullscreen=()=>Promise.reject(new Error('blocked'));setupFullscreen(f.button,()=>errors++,f.doc);
  await f.button.onclick();assert.equal(errors,1);assert.equal(f.button.disabled,false);assert.equal(f.doc.fullscreenElement,null);
  await f.button.onclick();assert.equal(errors,2);
  for(const disabled of [{fullscreenEnabled:false},{documentElement:{}},{exitFullscreen:null}]){const g=fixture();Object.assign(g.doc,disabled);setupFullscreen(g.button,()=>{},g.doc);assert.equal(g.button.hidden,true);assert.deepEqual(g.calls,[]);}
});
test('pending fullscreen cannot be requested twice',async()=>{
  const {setupFullscreen}=await load(),f=fixture();let resolve;
  f.doc.documentElement.requestFullscreen=()=>{f.calls.push('pending');return new Promise(r=>resolve=r);};setupFullscreen(f.button,()=>{},f.doc);
  const first=f.button.onclick();await f.button.onclick();assert.equal(f.calls.length,1);assert.equal(f.button.disabled,true);resolve();await first;assert.equal(f.button.disabled,false);
});
