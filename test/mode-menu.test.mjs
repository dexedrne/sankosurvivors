import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
function block(name){const at=main.indexOf(`function ${name}(`);assert(at>=0,name);const end=main.indexOf('\n}',at);return main.slice(at,end+2);}
function setup(){
 const nodes=new Map(),node=()=>({textContent:'',dataset:{},disabled:false,children:[],classList:{hidden:new Set(),toggle(k,on){on?this.hidden.add(k):this.hidden.delete(k);},add(k){this.hidden.add(k);},remove(k){this.hidden.delete(k);},contains(k){return this.hidden.has(k);}},setAttribute(k,v){this[k]=v;},querySelector(){return null;}}),$=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);};
 $('runvariant').children=['normal','boss','raid','fun','wizard'].map(variant=>({...node(),dataset:{variant,category:variant==='normal'?'normal':['fun','wizard'].includes(variant)?'fun':'challenge'}}));
 $('modecategories').children=['normal','challenge','fun'].map(category=>({...node(),dataset:{category}}));
 const fn=Function('$',`let mode='title',selVariant='normal',mapLoading=false,runStarting=false,coop=null;const MODE_GROUPS={normal:{name:'Adventure',blurb:'Explore'},challenge:{name:'Boss & Raid',blurb:'Challenge'},fun:{name:'Fun',blurb:'Silly'}};${block('showModeCategory')};return showModeCategory;`)($);
 return{$,show:fn};
}
test('Fun is a category with Slimer Invasion and a real same-site driving game',()=>{
 for(const id of ['modemenu','modebtn','modecategories','modemenutitle','modemenublurb','racersplay','modemenuclose'])assert(html.includes('id="'+id+'"'),id);
 assert.match(html,/<a[^>]*id="racersplay"[^>]*href="\.\/fun\/racers\/\?mode=survivors"/);
 assert(html.includes('Boss &amp; Raid'));assert(html.includes('Slimer Invasion'));
});
test('browsing Fun shows its three experiences without selecting or starting a survival run',()=>{
 const t=setup();t.show('fun');assert.equal(t.$('modemenutitle').textContent,'Fun');assert.equal(t.$('racersplay').classList.contains('hidden'),false);
 assert.deepEqual(t.$('runvariant').children.filter(n=>!n.classList.contains('hidden')).map(n=>n.dataset.variant),['fun','wizard']);
 assert.deepEqual(t.$('modecategories').children.map(n=>n['aria-pressed']),['false','false','true']);
});
test('Boss and Raid share one category while keeping their separate choices',()=>{
 const t=setup();t.show('challenge');assert.equal(t.$('modemenutitle').textContent,'Boss & Raid');assert.equal(t.$('racersplay').classList.contains('hidden'),true);
 assert.deepEqual(t.$('runvariant').children.filter(n=>!n.classList.contains('hidden')).map(n=>n.dataset.variant),['boss','raid']);
 t.show('unsupported');assert.equal(t.$('modemenutitle').textContent,'Boss & Raid');
});
test('Racers navigation refuses a busy or unreadable title without navigating or cancelling recovery',()=>{
 let cancelled=0,navigated=0,prevented=0;
 const invoke=Function('mode','canManuallyReload','progressCanLoad','coop','cancelPendingLoads','location','banner',`return ${block('enterRacers')}`);
 for(const [mode,manual,progress,coop]of[['play',true,true,null],['title',false,true,null],['title',true,false,null],['title',true,true,{}]]){
  const fn=invoke(mode,()=>manual,()=>progress,coop,()=>cancelled++,{assign(){navigated++;}},()=>{});fn({preventDefault(){prevented++;}});
 }
 assert.equal(prevented,4);assert.equal(cancelled,0);assert.equal(navigated,0);
 const fn=invoke('title',()=>true,()=>true,null,()=>cancelled++,{assign(path){assert.equal(path,'./fun/racers/?mode=survivors');navigated++;}},()=>{});fn({preventDefault(){prevented++;}});assert.equal(cancelled,1);assert.equal(navigated,1);
});
