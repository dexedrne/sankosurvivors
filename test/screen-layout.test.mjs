import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
let createScreenLayout;
try{({createScreenLayout}=await import('../src/screen-layout.js'));}catch(error){if(error.code!=='ERR_MODULE_NOT_FOUND')throw error;}
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const posture='(device-posture: folded)',stacked='(vertical-viewport-segments: 2)';
function fixture(t,{stored=null,readDenied=false,writeDenied=false,folded=false,vertical=false,phone=true}={}){
 const previous=Object.fromEntries(['document','localStorage','matchMedia','addEventListener','ResizeObserver','navigator'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 t.after(()=>{for(const[k,v]of Object.entries(previous))if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k];});
 const values=new Map(stored===null?[]:[['sq-screen-layout',stored]]),writes=[],classes=new Set(),media=new Map(),events=new Map();let changes=0;
 const body={classList:{toggle:(name,on)=>on?classes.add(name):classes.delete(name)}};
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{userAgent:phone?'Mozilla/5.0 (iPhone; CPU iPhone OS 27_1 like Mac OS X) Mobile Safari':'Mozilla/5.0 (X11; Linux x86_64) Chrome',userAgentData:{mobile:phone}}});
 Object.defineProperty(globalThis,'document',{configurable:true,value:{body,getElementById:()=>({})}});
 Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){if(readDenied)throw Error('fixture storage getter denied');return{getItem:k=>values.get(k)??null,setItem(k,v){if(writeDenied)throw Error('fixture quota');writes.push(k);values.set(k,v);}};}});
 Object.defineProperty(globalThis,'matchMedia',{configurable:true,value:q=>{if(!media.has(q))media.set(q,{matches:q===posture?folded:q===stacked?vertical:false,listeners:[],addEventListener(type,fn){assert.equal(type,'change');this.listeners.push(fn);}});return media.get(q);}});
 let observed;Object.defineProperty(globalThis,'ResizeObserver',{configurable:true,value:class{constructor(fn){observed=fn;}observe(){}}});
 Object.defineProperty(globalThis,'addEventListener',{configurable:true,value:(name,fn)=>events.set(name,fn)});
 assert.equal(typeof createScreenLayout,'function','real browser layout controller is required');
 const layout=createScreenLayout(()=>changes++);
 return{layout,values,writes,classes,changes:()=>changes,resize:()=>observed?observed():events.get('resize')?.(),windowResize:()=>events.get('resize')?.(),signal(q,on){const m=media.get(q);m.matches=on;for(const fn of m.listeners)fn();}};
}
test('without fold signals Auto keeps the normal layout and does not write a preference',t=>{
 const f=fixture(t);assert.equal(f.layout.mode,'auto');assert.equal(f.layout.active,false);assert.equal(f.classes.has('ds-layout'),false);assert.equal(f.writes.length,0);assert.equal(f.changes(),0);
});
test('Auto needs both folded posture and vertically stacked segments',t=>{
 const f=fixture(t);f.signal(posture,true);assert.equal(f.layout.active,false);f.signal(stacked,true);assert.equal(f.layout.active,true);assert.equal(f.classes.has('ds-layout'),true);assert.equal(f.changes(),1);f.signal(posture,true);assert.equal(f.changes(),1);f.signal(stacked,false);assert.equal(f.layout.active,false);assert.equal(f.changes(),2);
});
test('manual DS works without fold signals and returns to Standard or Auto cleanly',t=>{
 const f=fixture(t);f.layout.setMode('ds');assert.equal(f.layout.active,true);assert.equal(f.layout.mode,'ds');assert.equal(f.values.get('sq-screen-layout'),'"ds"');f.layout.setMode('standard');f.signal(posture,true);f.signal(stacked,true);assert.equal(f.layout.active,false);f.layout.setMode('auto');assert.equal(f.layout.active,true);assert.equal(f.values.get('sq-screen-layout'),'"auto"');
});
for(const stored of ['"ds"','"standard"'])test(`saved valid layout ${stored} restores on this device`,t=>{
 const f=fixture(t,{stored,folded:true,vertical:true});assert.equal(f.layout.mode,JSON.parse(stored));assert.equal(f.layout.active,stored==='"ds"');assert.equal(f.writes.length,0);
});
for(const stored of ['broken','{}','"constructor"','null'])test(`invalid saved layout ${stored} falls back without rewriting the stored value`,t=>{
 const f=fixture(t,{stored});assert.equal(f.layout.mode,'auto');assert.equal(f.layout.active,false);assert.equal(f.values.get('sq-screen-layout'),stored);assert.equal(f.writes.length,0);
});
test('blocked storage still permits a session-only manual layout',t=>{
 const f=fixture(t,{readDenied:true});assert.equal(f.layout.mode,'auto');assert.doesNotThrow(()=>f.layout.setMode('ds'));assert.equal(f.layout.active,true);assert.equal(f.layout.mode,'ds');assert.equal(f.writes.length,0);
});
test('a failed preference write keeps the chosen live layout and the old stored value',t=>{
 const f=fixture(t,{stored:'"standard"',writeDenied:true});assert.doesNotThrow(()=>f.layout.setMode('ds'));assert.equal(f.layout.active,true);assert.equal(f.layout.mode,'ds');assert.equal(f.values.get('sq-screen-layout'),'"standard"');
});
test('invalid settings values never alter layout or storage',t=>{
 const f=fixture(t);for(const v of [null,{},true,0,'__proto__','constructor','invalid'])f.layout.setMode(v);assert.equal(f.layout.mode,'auto');assert.equal(f.layout.active,false);assert.equal(f.writes.length,0);
});
test('desktop ignores saved DS and fold signals without rewriting the phone preference',t=>{
 const f=fixture(t,{phone:false,stored:'"ds"',folded:true,vertical:true});assert.equal(f.layout.available,false);assert.equal(f.layout.mode,'standard');assert.equal(f.layout.active,false);assert.equal(f.classes.has('ds-layout'),false);
 for(const mode of ['ds','auto','standard'])f.layout.setMode(mode);assert.equal(f.layout.active,false);assert.equal(f.values.get('sq-screen-layout'),'"ds"');assert.deepEqual(f.writes,[]);
});
test('desktop Settings does not offer the phone layout controls',t=>{
 const f=fixture(t,{phone:false}),nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,{html:'',set innerHTML(v){this.html=v;},querySelectorAll:()=>[]});return nodes.get(id);};
 const ui=main.slice(main.indexOf('const SETTINGS ='),main.indexOf('const openSettings ='));
 const build=Function('$','screenLayout','renderer',`const save=()=>{},audio={muted:false,volume:()=>50},autoAlchOn=()=>true,autoEquipOn=()=>false,keepPlayingUnfocused=()=>false;${ui};return buildSettings;`)($,f.layout,{getSettings:()=>({}),applySettings(){}});
 build();assert.ok(!$('setlist').html.includes('data-id="layout"'));assert.ok($('setlist').html.includes('data-id="autoequip"'));
});
test('actual Settings layout choice updates the selected option without editing graphics metadata',t=>{
 const f=fixture(t),nodes=new Map(),raw='{"v":3,"res":"0.75","future":{"keep":true}}';f.values.set('sq-settings',raw);let graphics=0;
 const $=id=>{if(!nodes.has(id))nodes.set(id,{html:'',buttons:[],set innerHTML(value){this.html=value;this.buttons=[...value.matchAll(/<button class="([^"]*)" data-id="([^"]*)" data-v='([^']*)'>(.*?)<\/button>/g)].map(m=>({className:m[1],dataset:{id:m[2],v:m[3]},textContent:m[4]}));},querySelectorAll:q=>q==='button'?nodes.get(id).buttons:[]});return nodes.get(id);};
 const ui=main.slice(main.indexOf('const SETTINGS ='),main.indexOf('const openSettings ='));
 const build=Function('$','screenLayout','renderer','save',`const audio={muted:false,volume:()=>50},autoAlchOn=()=>true,autoEquipOn=()=>false,keepPlayingUnfocused=()=>false;${ui};return buildSettings;`)($,f.layout,{getSettings:()=>({res:'0.75'}),applySettings(){graphics++;}},(k,v)=>{f.writes.push(k);f.values.set(k,JSON.stringify(v));});
 build();const ds=$('setlist').buttons.find(b=>b.dataset.id==='layout'&&b.dataset.v==='"ds"');assert.ok(ds,'DS layout choice is reachable in actual Settings');ds.onclick();assert.equal(f.layout.mode,'ds');assert.equal($('setlist').buttons.find(b=>b.dataset.id==='layout'&&b.className==='on').textContent,'Flex mode');assert.equal(f.values.get('sq-settings'),raw);assert.equal(graphics,0);assert.deepEqual(f.writes,['sq-screen-layout']);
});
function pointerFixture(active){
 const events=new Map(),nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,{style:{},classList:{add(){},remove(){}},firstElementChild:{style:{}},getBoundingClientRect:()=>({top:450})});return nodes.get(id);};
 const source=main.slice(main.indexOf("addEventListener('pointerdown'"),main.indexOf("$('pausebtn').onclick"));
 const app=Function('addEventListener','$','screenLayout',`let mode='play';const touch={id:null,x:0,y:0},stickEl=$('stick'),knob=stickEl.firstElementChild,STICK_R=56;function clearTouch(){touch.id=null;touch.x=touch.y=0;}${source};return touch;`)((k,fn)=>events.set(k,fn),$,{active});
 return{app,down:y=>events.get('pointerdown')({pointerType:'touch',pointerId:42,clientX:60,clientY:y,target:{closest:()=>null}}),move:y=>events.get('pointermove')({pointerId:42,clientX:116,clientY:y})};
}
test('actual DS touch admission ignores gameplay half and starts movement in the lower half',()=>{
 const f=pointerFixture(true);f.down(100);assert.equal(f.app.id,null);f.down(600);assert.equal(f.app.id,42);f.move(600);assert.equal(f.app.x,1);assert.equal(f.app.y,0);
});
test('standard layout keeps its original whole-field touch movement',()=>{
 const f=pointerFixture(false);f.down(100);assert.equal(f.app.id,42);f.move(100);assert.equal(f.app.x,1);
});
test('actual layout callback clears steering, pauses live play and resizes without restarting the run',t=>{
 fixture(t);const nodes=new Map(),$=id=>{if(!nodes.has(id)){const classes=new Set();nodes.set(id,{classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),toggle:(c,on)=>on?classes.add(c):classes.delete(c),contains:c=>classes.has(c)}});}return nodes.get(id);};let resizes=0;
 const init=main.slice(main.indexOf('const screenLayout = '),main.indexOf('function clearTouch()'));
 const clear=main.slice(main.indexOf('function clearTouch()'),main.indexOf("addEventListener('pointerdown'"));
 const pause=main.slice(main.indexOf('function pause(on)'),main.indexOf("$('start').onclick"));
 const quit=main.slice(main.indexOf('let quitTarget = null;'),main.indexOf('function pause(on)'));
 const app=Function('createScreenLayout','$','renderer',`let mode='play';const coop=null,rankedRun=null,touch={id:7,x:1,y:0},stickEl=$('stick'),audio={duck(){}},sim={t:10};${quit}${clear}${pause}${init};return{choose:v=>screenLayout.setMode(v),state:()=>({mode,id:touch.id,x:touch.x,t:sim.t})};`)(createScreenLayout,$,{resize(){resizes++;}});
 app.choose('ds');assert.deepEqual(app.state(),{mode:'pause',id:null,x:0,t:10});assert.equal($('pause').classList.contains('hidden'),false);assert.equal(resizes,1);
});

test('manual DS posture and segment changes notify even while DS stays active',t=>{
 const f=fixture(t);f.layout.setMode('ds');assert.equal(f.changes(),1);f.signal(posture,true);assert.equal(f.layout.active,true);assert.equal(f.changes(),2);f.signal(stacked,true);assert.equal(f.changes(),3);f.signal(stacked,true);assert.equal(f.changes(),3);f.signal(posture,false);assert.equal(f.changes(),4);
});
test('resizing an active DS view requests input/pause/renderer reconciliation only for that layout',t=>{
 const f=fixture(t);f.resize();assert.equal(f.changes(),0);f.layout.setMode('ds');f.resize();assert.equal(f.changes(),2);f.layout.setMode('standard');const before=f.changes();f.resize();assert.equal(f.changes(),before);
});

test('an unchanged synthetic window resize does not pause a DS run again',t=>{
 const f=fixture(t);f.layout.setMode('ds');const before=f.changes();f.windowResize();assert.equal(f.changes(),before);f.resize();assert.equal(f.changes(),before+1);
});
