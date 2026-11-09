import test from 'node:test';
import assert from 'node:assert/strict';
import {itemInspection} from '../src/item-inspection.js';
import {createSim} from '../src/sim.js';
let bindItemInspection;
try { ({bindItemInspection}=await import('../src/item-inspection-input.js')); } catch(e) { if(e.code!=='ERR_MODULE_NOT_FOUND')throw e; }

test('owned passive inspection explains rarity-adjusted strength and actual evolution links',()=>{
 const p=createSim().players[0];p.passives={area:3};p.quality.passives.area=125;
 const before=JSON.stringify(p),card=itemInspection(p,'passive','area',2);
 assert(card);assert.equal(card.title,'Cape');assert(card.details.includes('Level: 3'));assert(card.details.includes('Effective level: 4.25'));
 assert(card.details.some(s=>s.includes('Spells')&&s.includes('Pickaxe Quake')));assert.equal(JSON.stringify(p),before);
});
test('passive inspection rejects absent, malformed and inherited entries',()=>{
 const p=createSim().players[0];for(const id of['area','constructor','__proto__'])assert.equal(itemInspection(p,'passive',id,2),null);
 for(const level of[0,-1,1.5,6,NaN,Infinity,'2']){p.passives.area=level;assert.equal(itemInspection(p,'passive','area',2),null);}
});
function fixture(t){
 assert.equal(typeof bindItemInspection,'function');t.mock.timers.enable({apis:['setTimeout']});
 const handlers=new Map(),dh=new Map(),wh=new Map(),win={addEventListener:(k,f)=>wh.set(k,f),removeEventListener:k=>wh.delete(k)},doc={hidden:false,defaultView:win,addEventListener:(k,f)=>dh.set(k,f),removeEventListener:k=>dh.delete(k)};
 let current=true,shown=0,hidden=0,allowed=true;
 const item={isConnected:true,dataset:{inspect:'passive',inspectId:'area'},closest:()=>item};
 const root={ownerDocument:doc,contains:e=>e===item&&current,setPointerCapture(){},addEventListener:(k,f)=>handlers.set(k,f),removeEventListener:k=>handlers.delete(k)};
 const dispose=bindItemInspection(root,{show:e=>{assert.equal(e.target,item);shown++;},hide:()=>hidden++,canInspect:()=>allowed});
 return{fire(k,more={}){const e={target:item,pointerId:7,pointerType:'touch',clientX:10,clientY:10,preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;},...more};handlers.get(k)?.(e);return e;},tick:n=>t.mock.timers.tick(n),get shown(){return shown},get hidden(){return hidden},replace(){current=false;item.isConnected=false;},block(){allowed=false;},hide(){doc.hidden=true;dh.get('visibilitychange')?.();},blur(){wh.get('blur')?.();},dispose,handlers};
}
test('touch hold inspects at500ms and never leaks its pointer into movement',t=>{
 const f=fixture(t),down=f.fire('pointerdown');assert(down.prevented&&down.stopped);f.tick(499);assert.equal(f.shown,0);f.tick(1);assert.equal(f.shown,1);f.fire('pointerup');assert(f.hidden>0);f.fire('click');assert.equal(f.shown,1);
});
for(const cancellation of['pointercancel','lostpointercapture','move','replacement','mode','hidden','blur'])test('touch inspection cancels on '+cancellation,t=>{
 const f=fixture(t);f.fire('pointerdown');if(cancellation==='move')f.fire('pointermove',{clientX:21});else if(cancellation==='replacement')f.replace();else if(cancellation==='mode')f.block();else if(cancellation==='hidden')f.hide();else if(cancellation==='blur')f.blur();else f.fire(cancellation);f.tick(501);assert.equal(f.shown,0);
});
test('mouse is left to existing hover handlers; pen holds inspect; disposing retires pending work',t=>{
 const f=fixture(t);f.fire('pointerdown',{pointerType:'mouse'});f.tick(501);assert.equal(f.shown,0);f.fire('pointerdown',{pointerType:'pen'});f.tick(500);assert.equal(f.shown,1);f.fire('pointerup');f.fire('pointerdown');f.dispose();f.tick(501);assert.equal(f.shown,1);assert.equal(f.handlers.size,0);
});

test('long measured inspection uses the full viewport when the lower Flex pane cannot fit it',async()=>{
 const {readFileSync}=await import('node:fs'),source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 const a=source.indexOf('function showItemInspection(event) {'),b=source.indexOf("\nbindItemInspection($('loadout')",a);assert(a>=0&&b>a);
 // Natural265px content comes from the native clipped466x520 repro; no locale dependency.
 const tip={style:{},hidden:true,scrollHeight:265,replaceChildren(){},appendChild(){},get clientHeight(){return Math.min(265,Number.parseFloat(this.style.maxHeight)-4)},getBoundingClientRect(){return{width:250,height:this.clientHeight+4}}};
 const element={dataset:{inspect:'weapon',inspectId:'bow'},closest(){return this},setAttribute(){},getBoundingClientRect:()=>({right:70,top:275})};
 const $=id=>id==='itemtip'?tip:{getBoundingClientRect:()=>({top:260})};
 Function('$','itemInspection','document','screenLayout','innerWidth','innerHeight',`const sim={players:[{id:'p1'}],pace:2},PLAYER='p1',mode='play',hideItemInspection=()=>{};let inspectedElement=null;${source.slice(a,b)};showItemInspection({type:'touchhold',target:arguments[6]});`)($,()=>({title:'Bow',details:['All stats and evolution links']}),{createElement:()=>({})},{active:true},466,520,element);
 assert(tip.scrollHeight<=tip.clientHeight);assert(Number.parseFloat(tip.style.top)<268,'long tooltip can extend above the lower pane');assert(Number.parseFloat(tip.style.top)+tip.getBoundingClientRect().height<=512);
});
