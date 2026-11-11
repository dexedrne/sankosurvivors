import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transformHtml} from '../tools/wavedash/edition.mjs';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
function block(name){const at=main.indexOf(`function ${name}(`);assert(at>=0,name);const end=main.indexOf('\n}',at);return main.slice(at,end+2);}
function setup(){
 const nodes=new Map(),node=()=>({textContent:'',dataset:{},disabled:false,children:[],classList:{hidden:new Set(),toggle(k,on){on?this.hidden.add(k):this.hidden.delete(k);},add(k){this.hidden.add(k);},remove(k){this.hidden.delete(k);},contains(k){return this.hidden.has(k);}},setAttribute(k,v){this[k]=v;},querySelector(){return null;}}),$=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);};
 $('runvariant').children=['normal','boss','raid','fun','wizard','castle'].map(variant=>({...node(),dataset:{variant,category:variant==='normal'?'normal':['fun','wizard','castle'].includes(variant)?'fun':'challenge'}}));
 $('modecategories').children=['normal','challenge','fun'].map(category=>({...node(),dataset:{category}}));
 const fn=Function('$',`let mode='title',selVariant='normal',mapLoading=false,runStarting=false,coop=null;const MODE_GROUPS={normal:{name:'Adventure',blurb:'Explore'},challenge:{name:'Boss & Raid',blurb:'Challenge'},fun:{name:'Fun',blurb:'Silly'}};${block('showModeCategory')};return showModeCategory;`)($);
 return{$,show:fn};
}
test('Fun is a category with Slimer Invasion and a real same-site driving game',()=>{
 for(const id of ['modemenu','modebtn','modecategories','modemenutitle','modemenublurb','racersportal','racersplay','racerscourier','racerszombies','modemenuclose'])assert(html.includes('id="'+id+'"'),id);
 assert.match(html,/<a[^>]*id="racersplay"[^>]*href="\.\/fun\/racers\/\?mode=hub"/);
 assert.match(html,/<a[^>]*id="racerscourier"[^>]*href="\.\/fun\/racers\/\?mode=courier"/);
 assert.match(html,/<a[^>]*id="racerszombies"[^>]*href="\.\/fun\/racers\/\?mode=zombies"/);
 assert.doesNotMatch(transformHtml(html),/racersportal|racerscourier|racerszombies|fun\/racers\//);
 assert(html.includes('Boss &amp; Raid'));assert(html.includes('Slimer Invasion'));
});
test('browsing Fun shows its four experiences without selecting or starting a survival run',()=>{
 const t=setup();t.show('fun');assert.equal(t.$('modemenutitle').textContent,'Fun');assert.equal(t.$('racersportal').classList.contains('hidden'),false);
 assert.deepEqual(t.$('runvariant').children.filter(n=>!n.classList.contains('hidden')).map(n=>n.dataset.variant),['fun','wizard','castle']);
 assert.deepEqual(t.$('modecategories').children.map(n=>n['aria-pressed']),['false','false','true']);
});
test('Boss and Raid share one category while keeping their separate choices',()=>{
 const t=setup();t.show('challenge');assert.equal(t.$('modemenutitle').textContent,'Boss & Raid');assert.equal(t.$('racersportal').classList.contains('hidden'),true);
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
 const paths=[];
 const fn=invoke('title',()=>true,()=>true,null,()=>cancelled++,{assign(path){paths.push(path);}},()=>{});
 for(const racersMode of [undefined,'courier','zombies','https://example.invalid'])fn({currentTarget:{dataset:{racersMode}},preventDefault(){}});
 assert.deepEqual(paths,['hub','courier','zombies','hub'].map(mode=>'./fun/racers/?mode='+mode));
 assert.equal(cancelled,4);
});
