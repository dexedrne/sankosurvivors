import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
let DamageMeter,bindBeltItem;
try{({DamageMeter}=await import('../src/damage-meter.js'));}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
try{({bindBeltItem}=await import('../src/belt-input.js'));}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const meter=()=>{assert.equal(typeof DamageMeter,'function','damage sampler exists');return new DamageMeter();};
test('DPS uses simulated time and existing totals without changing them',()=>{
 const m=meter(),totals={bow:0};m.sample(0,totals);totals.bow=120;m.sample(30,totals);assert.equal(m.read().perSecond.bow,120);assert.equal(m.read().totals.bow,120);assert.deepEqual(totals,{bow:120});
 totals.bow=240;assert.equal(m.read().totals.bow,120,'sample owns a copy');m.sample(30,totals);assert.equal(m.read().totals.bow,120,'paused same tick cannot create damage/time');
});
test('DPS keeps an eight-second recent window and retains run totals',()=>{
 const m=meter();for(let s=0;s<=20;s++)m.sample(s*30,{bow:s*20,staff:Math.max(0,s-10)*40});
 assert.equal(m.read().perSecond.bow,20);assert.equal(m.read().perSecond.staff,40);assert.equal(m.read().totals.bow,400);
 for(let s=21;s<=29;s++)m.sample(s*30,{bow:400,staff:400});assert.equal(m.read().perSecond.bow||0,0);assert.equal(m.read().perSecond.staff||0,0);
});
test('DPS handles empty data, new sources, rewind and explicit new-run reset',()=>{
 const m=meter();assert.deepEqual(m.read().perSecond,{});m.sample(0,{});m.sample(30,{staff:45,other:15});assert.equal(m.read().perSecond.staff,45);assert.equal(m.read().perSecond.other,15);
 m.sample(0,{bow:0});assert.deepEqual(m.read().perSecond,{});assert.deepEqual(m.read().totals,{bow:0});m.reset();assert.deepEqual(m.read().totals,{});
});
function belt(t,{active=true}={}){
 assert.equal(typeof bindBeltItem,'function','safe belt handler exists');t.mock.timers.enable({apis:['setTimeout']});
 const handlers=new Map(),docHandlers=new Map(),tip={hidden:true,style:{},getBoundingClientRect:()=>({width:240,height:70})};let uses=0,captures=0;
 const el={dataset:{kind:'beer'},isConnected:true,ownerDocument:{hidden:false,documentElement:{clientWidth:393,clientHeight:852},addEventListener:(n,f)=>docHandlers.set(n,f),removeEventListener:(n,f)=>{if(docHandlers.get(n)===f)docHandlers.delete(n);}},
 querySelector:()=>tip,getBoundingClientRect:()=>({left:8,right:64,top:700,bottom:756,width:56,height:56}),setPointerCapture:()=>captures++,
 addEventListener:(n,f)=>handlers.set(n,f),removeEventListener:(n,f)=>{if(handlers.get(n)===f)handlers.delete(n);}};
 const dispose=bindBeltItem(el,{use:()=>uses++,canUse:()=>active});
 const fire=(name,more={})=>{const e={pointerId:7,pointerType:name==='click'?'':'touch',button:0,clientX:28,clientY:720,key:'',preventDefault(){},...more};handlers.get(name)?.(e);el['on'+name]?.(e);};
 return{el,tip,fire,uses:()=>uses,captures:()=>captures,setActive(v){active=v;},tick:n=>t.mock.timers.tick(n),hide(){el.ownerDocument.hidden=true;docHandlers.get('visibilitychange')?.();},dispose};
}
test('a touch tap uses once and suppresses its synthetic click',t=>{
 const f=belt(t);f.fire('pointerdown');f.tick(80);f.fire('pointerup');f.fire('click');assert.equal(f.uses(),1);assert.equal(f.captures(),1);f.tick(401);f.fire('click');assert.equal(f.uses(),2);
});
test('a touch hold inspects without using on release or synthetic click',t=>{
 const f=belt(t);f.fire('pointerdown');f.tick(500);assert.equal(f.tip.hidden,false);f.fire('pointerup');f.fire('click');assert.equal(f.uses(),0);assert.equal(f.tip.hidden,true);
});
test('a replacement button rejects the previous touch or pen synthetic click',t=>{
 const f=belt(t);
 f.fire('click',{pointerType:'touch'});f.fire('click',{pointerType:'pen'});f.fire('click',{pointerType:undefined,sourceCapabilities:{firesTouchEvents:true}});
 assert.equal(f.uses(),0);
 f.fire('click',{pointerType:'mouse'});assert.equal(f.uses(),1);
 f.fire('click',{pointerType:'',detail:0});assert.equal(f.uses(),2);
});
for(const event of ['pointercancel','lostpointercapture'])test(event+' cancels a pending item tap',t=>{
 const f=belt(t);f.fire('pointerdown');f.fire(event);f.tick(550);f.fire('pointerup');f.fire('click');assert.equal(f.uses(),0);assert.equal(f.tip.hidden,true);
});
test('drift before a hold and page hiding cancel without using',t=>{
 const f=belt(t);f.fire('pointerdown');f.fire('pointermove',{clientX:55});f.tick(550);f.fire('pointerup',{clientX:55});f.fire('click');assert.equal(f.uses(),0);assert.equal(f.tip.hidden,true);
 f.tick(401);f.fire('pointerdown');f.hide();f.tick(550);f.fire('pointerup');assert.equal(f.uses(),0);
});
test('replacement or detached belt buttons cannot use a different item',t=>{
 const f=belt(t);f.fire('pointerdown');f.el.dataset.kind='warp';f.fire('pointerup');f.fire('click');assert.equal(f.uses(),0);
 f.el.isConnected=false;f.tick(401);f.fire('click');assert.equal(f.uses(),0);f.dispose();
});
test('mouse and keyboard inspect accessibly and blocked gameplay never queues use',t=>{
 const f=belt(t);f.fire('pointerenter',{pointerType:'mouse'});assert.equal(f.tip.hidden,false);f.fire('pointerleave',{pointerType:'mouse'});assert.equal(f.tip.hidden,true);
 f.fire('focus');assert.equal(f.tip.hidden,false);f.fire('keydown',{key:'Escape'});assert.equal(f.tip.hidden,true);f.fire('click');assert.equal(f.uses(),1);
 f.setActive(false);f.fire('click');f.fire('pointerdown');f.tick(50);f.fire('pointerup');assert.equal(f.uses(),1);
});
function loopFixture({fps='max',initialMode='title'}={}){
 let draws=0,inputs=0;const start=main.indexOf('let lastDrawn ='),end=main.indexOf('\nboot().then',start);assert.ok(start>=0&&end>start);
 const nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,{disabled:false,classList:{toggle(){},contains:()=>true}});return nodes.get(id);};
 const context={requestAnimationFrame(){},renderer:{getSettings:()=>({fps}),getYaw:()=>0,setYaw(){},update(){draws++;return 0;}},readInput(){inputs++;return{pad:[]};},padEdges:()=>({}),navMove(){},navBack(){},navPress(){},navScreen:()=>({id:'title'}),$,
 snapshot:()=>({players:[{f:0}],fx:[]}),compactMenu:{matches:true},params:{has:()=>true},window:{__idleSim:{}},performance:{now:()=>0},PLAYER:'p1',audio:{onFx(){}},MAP_BY_ID:{},updateHud(){},drawMinimap(){},console};
 vm.createContext(context);vm.runInContext(`let mode='${initialMode}',sim=${initialMode==='pause'?"{map:{world:false,music:''}}":'null'},last=0,frame=0,acc=0,hudT=0,slowmo=0;const TICK=1/30;${main.slice(start,end)};globalThis.frameAt=loop;`,context);
 return{run(ts){context.frameAt(ts);},draws:()=>draws,inputs:()=>inputs};
}
for(const hz of [60,144,240])test(`actual title loop caps rendering at30FPS on${hz}Hz and keeps input polling`,()=>{
 const f=loopFixture();for(let i=0;i<hz;i++)f.run(1000+i*1000/hz);assert.ok(f.draws()>=28&&f.draws()<=31,`draws=${f.draws()}`);assert.equal(f.inputs(),hz);
});
test('actual pause loop caps rendering without throttling controls',()=>{
 const f=loopFixture({initialMode:'pause'});for(let i=0;i<144;i++)f.run(1000+i*1000/144);assert.ok(f.draws()>=28&&f.draws()<=31,`draws=${f.draws()}`);assert.equal(f.inputs(),144);
});
test('configured30FPS title still renders at30 rather than15',()=>{
 const f=loopFixture({fps:'30'});for(let i=0;i<60;i++)f.run(1000+i*1000/60);assert.ok(f.draws()>=28&&f.draws()<=31,`draws=${f.draws()}`);
});
test('actual damage HUD reads counters, freezes on pause and resets for another run',()=>{
 const start=main.indexOf('function updateDamageHud()'),end=main.indexOf('function updateTumbleHud(',start);assert.ok(start>=0&&end>start,'damage HUD exists');
 const nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',classList:{contains:()=>true}});return nodes.get(id);};
 const app=Function('$','DamageMeter',`let sim={tick:0,dmgBy:{bow:0},players:[{weapons:{bow:1},evo:{}}]},mode='play',damageRun=null,damageReading=null;const damageMeter=new DamageMeter(),WEAPONS={bow:{}},weaponDisplay=()=>({name:'Bow'}),stepOf=()=>null,esc=s=>s;${main.slice(start,end)};return{update:updateDamageHud,setTick(t,d){sim.tick=t;sim.dmgBy=d;},pause(){mode='pause';},play(){mode='play';},replace(){sim={tick:0,dmgBy:{},players:[{weapons:{},evo:{}}]};}};` )($,DamageMeter);
 app.update();app.setTick(30,{bow:90});app.update();assert.equal($('dpsvalue').textContent,'90 DPS');app.pause();app.setTick(60,{bow:180});app.update();assert.equal($('dpsvalue').textContent,'90 DPS');app.play();app.replace();app.update();assert.equal($('dpsvalue').textContent,'0 DPS');
});
test('opening damage from body gives keyboard navigation a focus target and closing restores it',()=>{
 const doc={activeElement:{id:'body'}},nodes=new Map();
 const $=id=>{if(!nodes.has(id))nodes.set(id,{id,classList:{toggle(){}},setAttribute(){},contains:e=>e?.id==='damageclose',focus(){doc.activeElement=this;}});return nodes.get(id);};
 const start=main.indexOf('function setDamagePanel('),end=main.indexOf("\n$('damagebtn').onclick",start);
 const setPanel=Function('$','document',`let damageReading;const updateDamageHud=()=>{};${main.slice(start,end)};return setDamagePanel;`)($,doc);
 setPanel(true);assert.equal(doc.activeElement.id,'damageclose');
 setPanel(false);assert.equal(doc.activeElement.id,'damagebtn');
 doc.activeElement={id:'belt-item'};setPanel(false);assert.equal(doc.activeElement.id,'belt-item','unrelated focus stays put');
});
test('actual belt admission rejects reward-resume waiting without queuing a later use',()=>{
 const start=main.indexOf('beltDisposers.push(bindBeltItem('),end=main.indexOf('\n',start);
 const admission=Function('waitingForMove',`let pendingUse=null,options;const mode='play',PLAYER='p1',i=0,kind='beer',el={},beltDisposers=[],sim={pending:{},over:false,players:[{belt:['beer']}]},bindBeltItem=(e,o)=>{options=o;};${main.slice(start,end)};if(options.canUse())options.use();return pendingUse;`);
 assert.equal(admission(true),null);assert.equal(admission(false),0);
});
test('DPS has an accessible minimap toggle and close action; belt buttons expose their own descriptions',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.match(html,/<button[^>]*id="damagebtn"[^>]*aria-controls="damagepanel"/);assert.match(html,/id="damageclose"/);assert.match(html,/id="damagerows"/);
 assert.ok(main.includes('bindBeltItem(el,'));assert.ok(main.includes('role="tooltip"'));assert.ok(main.includes("k === 'tab'"));
});
test('casual upload admits the shipped upstream notice while refusing other root files',async()=>{
 const {assertCasualBundle}=await import('../tools/wavedash/edition.mjs');assert.doesNotThrow(()=>assertCasualBundle('', ['licenses/run-escape.txt']));assert.throws(()=>assertCasualBundle('', ['licenses/private.env']));
 const license=readFileSync(new URL('../public/licenses/run-escape.txt',import.meta.url),'utf8');assert.match(license,/BSD 2-Clause License/);assert.match(license,/Copyright \(c\) 2022-2023, dennisdev/);assert.match(license,/THIS SOFTWARE IS PROVIDED/);
});
test('run insight and belt effects have actual text in every supported language',async()=>{
 const {translateText}=await import('../src/i18n.js');
 const messages=['Know your build',"See each weapon's recent damage from the minimap or Tab. Hold a belt item to read what it does without using it.",'Menus now render at up to 30 frames per second while controls stay responsive.','Show weapon damage','Weapon damage','Last 8 seconds. Includes overkill.','Total damage','No damage yet.','Empty item slot','Restores 20 health, boosted by healing bonuses. Run faster for 8 seconds.','Blasts nearby enemies. Damage grows with run time.','Pulls all dropped bones and coins to you.','Tap to use. Hold to inspect.'];
 for(const language of ['tr','es','fil'])for(const m of messages)assert.notEqual(translateText(m,language),m,language+': '+m);
});
