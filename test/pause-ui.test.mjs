import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSim,TICK} from '../src/sim.js';
import {pauseBuild,pauseBuildHTML} from '../src/pause-build.js';
const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
function fixture(){
 const nodes=new Map(),document={activeElement:null},models=[];
 const $=id=>{if(!nodes.has(id)){const classes=new Set(['hidden']);nodes.set(id,{id,textContent:'',scrollTop:0,renders:0,groups:[],timers:[],classList:{contains:k=>classes.has(k),add:k=>classes.add(k),remove:k=>classes.delete(k)},get innerHTML(){return this.html||'';},set innerHTML(html){this.html=html;this.renders++;this.groups=[...html.matchAll(/<details data-pause-group="([^"]+)"( open)?>/g)].map(m=>{const group={dataset:{pauseGroup:m[1]},open:!!m[2]};group.summary={group,closest:()=>group};return group;});this.timers=[...html.matchAll(/data-pause-seconds="([^"]+)"/g)].map(m=>({dataset:{pauseSeconds:m[1]},textContent:''}));},querySelectorAll(selector){return selector==='[data-pause-group]'?this.groups:this.timers;},querySelector(selector){return this.groups.find(g=>selector.includes('"'+g.dataset.pauseGroup+'"'))?.summary;},contains(el){return this.groups.some(g=>g.summary===el);}});}return nodes.get(id);};
 const sim=createSim({seed:711,pace:2,players:[{id:'p1',adv:'wizard'}]});
 const env={sim,mode:'pause',PLAYER:'p1',TICK,document,$,pauseBuild:(s,p)=>{models.push(p.id);return pauseBuild(s,p);},pauseBuildHTML,asset:x=>'/native/'+x,esc:x=>String(x),navFocus:e=>document.activeElement=e};
 const a=source.indexOf('let quitTarget = null;'),b=source.indexOf('function pause(on)',a);assert(a>=0&&b>a);
 const api=Function('env',`with(env){${source.slice(a,b)};return{refresh:refreshPauseBuild};}`)(env);
 return{...api,env,sim,p:sim.players[0],$,document,models};
}
test('pause details use current actor and timed refresh without rebuilding on countdown alone',()=>{
 const f=fixture();f.p.buffs.speed=10;f.refresh(true);const box=f.$('pausedetails'),count=box.renders;
 f.refresh();assert.equal(box.renders,count);assert.deepEqual(f.models,['p1']);
 f.sim.tick+=30;f.p.buffs.speed=9;f.refresh();assert.equal(box.renders,count);assert.equal(box.timers[0].textContent,'9s');
});
test('a real stat change preserves expanded sections, scroll and summary focus',()=>{
 const f=fixture();f.refresh(true);const box=f.$('pausedetails'),group=box.groups.find(g=>g.dataset.pauseGroup==='build');group.open=true;f.$('pausebody').scrollTop=72;f.document.activeElement=group.summary;
 f.p.passives.boots=2;f.sim.tick+=30;f.refresh();assert.equal(box.groups.find(g=>g.dataset.pauseGroup==='build').open,true);assert.equal(f.$('pausebody').scrollTop,72);assert.equal(f.document.activeElement.group.dataset.pauseGroup,'build');
});
test('quit confirmation and inactive screens do not refresh hidden build controls',()=>{
 const f=fixture();f.refresh(true);const n=f.models.length;f.$('quitconfirm').classList.remove('hidden');f.sim.tick+=30;f.refresh();assert.equal(f.models.length,n);
 f.$('quitconfirm').classList.add('hidden');f.env.mode='play';f.refresh();assert.equal(f.models.length,n);
});
test('pause has an independent scroll body and persistent action group',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');assert(html.includes('id="pausebody"'));assert(html.includes('id="pausedetails"'));assert(html.includes('class="pauseactions"'));
 const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');assert(css.includes('#pausebody'));assert(css.includes('.pauseactions'));
});
