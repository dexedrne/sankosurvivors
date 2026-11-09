import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {TRANSFER_KEYS} from '../src/progress-import.js';
const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
function handlers(keep=false,hidden=false,startMode='play') {
 const a=source.indexOf("addEventListener('blur', () => { keys.clear(); clearTouch();"),b=source.indexOf('\nfunction pause(on)',a);assert(a>=0&&b>a);
 const win=new Map(),doc=new Map(),document={hidden,addEventListener:(k,f)=>doc.set(k,f)};
 const state=Function('document','keepPlayingUnfocused','addEventListener',`let mode=${JSON.stringify(startMode)},pendingUse=2,cleared=0;const keys=new Set(['d']),clearTouch=()=>cleared++,pause=()=>mode='pause';${source.slice(a,b)};return()=>({mode,pendingUse,cleared,keys:keys.size});`)(document,()=>keep,(k,f)=>win.set(k,f));
 return {state,fire:k=>(k==='blur'?win:doc).get(k)()};
}
test('keep-playing opt-in leaves a visible unfocused run active while clearing held input',()=>{
 const h=handlers(true);h.fire('blur');assert.deepEqual(h.state(),{mode:'play',pendingUse:null,cleared:1,keys:0});
});
test('default focus loss still pauses; a hidden page always pauses even with opt-in',()=>{
 for(const[keep,hidden,event]of[[false,false,'blur'],[true,true,'blur'],[true,true,'visibilitychange']]){
  const h=handlers(keep,hidden);h.fire(event);assert.equal(h.state().mode,'pause');assert.equal(h.state().pendingUse,null);assert.equal(h.state().keys,0);
 }
});
test('focus changes do not turn reward or pause menus into active play',()=>{
 for(const mode of['pause','levelup','casket','merchant']){const h=handlers(true,false,mode);h.fire('blur');assert.equal(h.state().mode,mode);assert.equal(h.state().pendingUse,null);}
});
test('keep-playing preference accepts only true and stays out of transfer keys',()=>{
 const line=source.split('\n').find(s=>s.startsWith('const keepPlayingUnfocused ='));assert(line);
 for(const value of[undefined,null,false,0,1,'true',{},[]])assert.equal(Function('load',line+';return keepPlayingUnfocused();')(()=>value),false);
 assert.equal(Function('load',line+';return keepPlayingUnfocused();')(()=>true),true);assert(!TRANSFER_KEYS.includes('sq-keep-playing-unfocused'));
});
