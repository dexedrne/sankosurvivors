import test from 'node:test';
import assert from 'node:assert/strict';
import {bindItemKeys} from '../src/item-keys.js';
function fixture(persist=()=>{},text=s=>s){
 const listeners={},doc={hidden:false,activeElement:null,addEventListener(k,f){listeners['doc:'+k]=f;},defaultView:{addEventListener(k,f){listeners[k]=f;}}};
 const buttons=Array.from({length:4},()=>({classList:{toggle(){}},setAttribute(k,v){this[k]=v;},focus(){doc.activeElement=this;}})),status={},reset={},screen={hidden:false,classList:{contains(){return screen.hidden;}}};
 const panel={ownerDocument:doc,open:true,closest:()=>screen,addEventListener(k,f){listeners[k]=f;},querySelectorAll:()=>buttons,querySelector:s=>s.includes('status')?status:reset};
 const control=bindItemKeys(panel,['1','2','3','4'],persist,text);
 const press=(key,extra={})=>{const e={key,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...extra};listeners.keydown(e);return e;};
 return{control,buttons,status,reset,screen,doc,listeners,press,capture(i){buttons[i].focus();buttons[i].onclick();}};
}
test('captured item key saves once, updates its hint and never reaches gameplay listeners',()=>{
 const writes=[],f=fixture(v=>writes.push([...v]));f.capture(0);const e=f.press('z');
 assert(e.prevented&&e.stopped);assert.deepEqual(writes,[['z','2','3','4']]);assert.equal(f.control.keys[0],'z');assert.equal(f.buttons[0].textContent,'Z');
 assert.equal(f.control.slot({key:'z'}),0);assert.equal(f.control.slot({key:'1'}),-1);
});
test('clicking a binding explicitly focuses it on platforms that do not focus clicked buttons',()=>{
 const f=fixture();f.buttons[0].onclick();f.press('z');assert.equal(f.doc.activeElement,f.buttons[0]);assert.equal(f.control.keys[0],'z');
});
test('reserved/duplicate keys do not replace bindings; Escape and focus loss cancel',()=>{
 const f=fixture();f.capture(0);f.press('w');f.press('2');assert.deepEqual(f.control.keys,['1','2','3','4']);
 assert(f.press('Escape').stopped);assert(!f.press('z').stopped);
 f.capture(0);f.listeners.blur();assert(!f.press('z').stopped);
 f.capture(0);f.screen.hidden=true;assert(!f.press('z').stopped);
});
test('browser shortcuts and Tab leave capture without swallowing native defaults',()=>{
 const f=fixture();f.capture(0);const shortcut=f.press('l',{ctrlKey:true});assert(!shortcut.prevented);assert(shortcut.stopped);assert(!f.press('z').stopped);
 f.capture(0);const tab=f.press('Tab');assert(!tab.prevented);assert(!f.press('z').stopped);
});
test('failed preference write retains the previous working keys and gives feedback',()=>{
 const f=fixture(()=>{throw Error('quota');});f.capture(0);f.press('z');assert.deepEqual(f.control.keys,['1','2','3','4']);assert.match(f.status.textContent,/Could not save/);
});
test('reset restores defaults and quantity of keys stays four',()=>{
 const f=fixture();f.capture(0);f.press('z');f.reset.onclick();assert.deepEqual(f.control.keys,['1','2','3','4']);assert.equal(f.buttons[0].textContent,'1');
});
test('language changes refresh the accessible key label without writing a preference',()=>{
 let language='EN',writes=0;const f=fixture(()=>writes++,s=>language+':'+s);
 assert.match(f.buttons[0]['aria-label'],/^EN:Item slot 1:/);language='TR';f.control.refresh();
 assert.match(f.buttons[0]['aria-label'],/^TR:Item slot 1:/);assert.equal(writes,0);assert.deepEqual(f.control.keys,['1','2','3','4']);
});
