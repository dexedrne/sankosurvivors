import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {itemKeySlot} from '../src/item-keys.js';
import {translateText} from '../src/i18n.js';
const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
test('real gameplay handler uses remapped items while upgrade and casket numbers retain their choices',()=>{
 const code=source.slice(source.indexOf('// ---- input -----'),source.indexOf("addEventListener('keyup'"));
 const callbacks=[],controls={keys:['z','x','c','v'],slot:e=>itemKeySlot(e,['z','x','c','v'])};
 const state=Function('addEventListener','itemKeyControls',`let mode='play',pendingUse=null,picks=[];const keys=new Set(),walletModalOpen=()=>false,coopReviveUi={keyDown:()=>false},openMerchant=()=>false,$=()=>({classList:{contains:()=>true}}),pick=i=>picks.push(i),pickCasket=i=>picks.push(i);${code};return {use:()=>pendingUse,choices:()=>picks,setMode(value){mode=value;pendingUse=null;}};`)((name,fn)=>callbacks.push(fn),controls);
 const press=(key,extra={})=>callbacks[0]({key,repeat:false,target:{matches:()=>false,closest:()=>null},preventDefault(){},...extra});
 press('z');assert.equal(state.use(),0);state.setMode('play');press('1');assert.equal(state.use(),null);
 press('x',{ctrlKey:true});assert.equal(state.use(),null);
 state.setMode('levelup');press('2');assert.deepEqual(state.choices(),[1]);assert.equal(state.use(),null);
 state.setMode('casket');press('1');assert.deepEqual(state.choices(),[1,0]);assert.equal(state.use(),null);
});
test('real translator wiring follows the current document language, including after a switch',()=>{
 const a=source.indexOf('const itemKeyControls = bindItemKeys('),line=source.slice(a,source.indexOf('\n',a));assert(a>=0);
 const document={documentElement:{lang:'en'}};
 const text=Function('$','bindItemKeys','load','localStorage','translateText','document',line+';return itemKeyControls;')(()=>null,(panel,initial,persist,text)=>text,()=>null,{},translateText,document);
 for(const lang of ['en','es','tr','fil']){document.documentElement.lang=lang;assert.equal(text('Press a key…'),translateText('Press a key…',lang),lang);}
});
