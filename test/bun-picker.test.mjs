import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NATIVE_PETS,petChoice } from '../src/pets.js';
import { createBunCompanions,bunChoice } from '../src/bun-companions.js';
const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const section=source.slice(source.indexOf('// ---- cosmetic companions'),source.indexOf("$('gearclose').onclick"));
const address='0x'+'1'.repeat(40);
function setup(preference=null){
  const store=new Map([['sq-coins','609'],['sq-pet',JSON.stringify(preference)]]),nodes=new Map(),requests=[],visibility=[];let wallet={address},revision=1;
  const body={id:'body'},document={activeElement:body,hidden:false,addEventListener:(type,fn)=>visibility.push({type,fn})};
  const $=id=>{
    if(!nodes.has(id)){
      const classes=new Set(id==='pets'?['hidden']:[]);let html='',buttons=[];
      const node={id,dataset:{},textContent:'',onclick:null,classList:{contains:v=>classes.has(v),remove:v=>classes.delete(v),add:v=>classes.add(v),toggle(v,on){if(on)classes.add(v);else classes.delete(v);}},
        get innerHTML(){return html;},set innerHTML(value){if(buttons.includes(document.activeElement))document.activeElement=body;html=value;buttons=[...value.matchAll(/data-pet="([^"]*)" aria-pressed="([^"]*)"/g)].map(m=>({dataset:{pet:m[1]},pressed:m[2]==='true',parent:node,disabled:false}));},
        contains(el){return el===node||id==='pets'&&(el===nodes.get('petlist')||nodes.get('petlist')?.querySelectorAll('button').includes(el));},
        querySelector(selector){if(selector==='button')return buttons[0]||null;if(selector==='[aria-pressed="true"]')return buttons.find(b=>b.pressed)||null;const match=selector.match(/^\[data-pet="([^"]*)"\]$/);return match?buttons.find(b=>b.dataset.pet===match[1])||null:null;},
        querySelectorAll:()=>buttons,addEventListener(){}};nodes.set(id,node);
    }return nodes.get(id);
  };
  const calls=[],renderer={state:'idle',setPet(id,allowed=()=>true){calls.push({id,allowed});this.state=id?'ready':'idle';return Promise.resolve(true);},petState(){return this.state;}};
  const app=Function('$','NATIVE_PETS','petChoice','createBunCompanions','bunChoice','load','localStorage','renderer','document','walletNow','walletRevision','navFocus','addEventListener',section+`;return{open:()=>$('petsbtn').onclick(),apply:applyPetChoice,pref:()=>selectedPet,refresh:()=>bunCompanions.refresh()};`)(
    $,NATIVE_PETS,petChoice,options=>createBunCompanions({...options,load:(owner,opts)=>new Promise(resolve=>requests.push({owner,opts,resolve}))}),bunChoice,(key,fallback)=>store.has(key)?JSON.parse(store.get(key)):fallback,{setItem:(key,value)=>store.set(key,value)},renderer,document,()=>wallet,()=>revision,el=>{if(el)document.activeElement=el;},()=>{});
  const finish=(i,pets)=>requests[i].resolve({status:'ready',address,identity:requests[i].opts.identity,block:{number:'0x123',hash:'0x'+'a'.repeat(64)},pets});
  return{app,$,store,calls,requests,finish,visibility,document,focusChoice:id=>{document.activeElement=$('petlist').querySelector(`[data-pet="${id}"]`);assert(document.activeElement);},switch:()=>{wallet=null;revision++;}};
}
test('saved Bun preference waits for current ownership; an outage preserves coins and ordinary choices',async()=>{
  const s=setup('bun:3351');assert.equal(s.app.pref(),'bun:3351');await s.app.apply();assert.equal(s.calls.at(-1).id,null);
  const ready=s.app.refresh();s.finish(0,[{tokenId:'3351',variety:'Mini',type:'Bun',eligible:true}]);await ready;await Promise.resolve();
  assert.equal(s.calls.at(-1).id,'bun:Mini');assert.equal(s.calls.at(-1).allowed(),true);
  s.app.open();assert(s.$('petlist').innerHTML.includes('bun:3351'));assert(s.$('petlist').innerHTML.includes('chicken'));assert(s.$('petlist').innerHTML.includes('fox'));
  s.switch();assert.equal(s.calls.at(-1).allowed(),false);
  const missing=s.app.refresh();await missing;assert.equal(s.calls.at(-1).id,null);assert.equal(s.store.get('sq-coins'),'609');assert.equal(s.store.get('sq-pet'),'"bun:3351"');
});


test('a saved unavailable BUN opens Pets with ordinary-choice focus and keeps its preference',()=>{
  const s=setup('bun:3351');s.app.open();assert(s.$('pets').contains(s.document.activeElement));assert.equal(s.document.activeElement.dataset.pet,'');assert.equal(s.app.pref(),'bun:3351');assert.equal(s.store.get('sq-coins'),'609');
});
test('ownership refresh removes a focused BUN and restores focus inside the modal',async()=>{
  const s=setup('bun:3351');let ready=s.app.refresh();s.finish(0,[{tokenId:'3351',variety:'Mini',type:'Bun',eligible:true}]);await ready;
  s.app.open();s.focusChoice('bun:3351');ready=s.app.refresh();assert(s.$('pets').contains(s.document.activeElement));assert.equal(s.document.activeElement.dataset.pet,'');
  s.finish(1,[]);await ready;assert(s.$('pets').contains(s.document.activeElement));assert.equal(s.app.pref(),'bun:3351');assert.equal(s.store.get('sq-pet'),'"bun:3351"');
});
