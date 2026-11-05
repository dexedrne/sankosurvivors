import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createSim,step,choose,skipLevel,mulberry32,TICK} from '../src/sim.js';
import {RunRecorder,rankedSim} from '../src/ranked.js';
import * as content from '../src/content.js';
import {rankedStep,rankedChoice,resumeRanked} from '../src/ranked-play.js';

const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
function section(start,end) {const a=source.indexOf(start),b=source.indexOf(end,a);return a<0?'':source.slice(a,b);}
function setup({phone=true,held=false,ranked=false,natural=null,shown=!natural,choices=[{kind:'weapon',id:'katana',level:2}]}={}) {
  const sim=natural?rankedSim(natural):createSim({seed:1104,pace:2}),p=sim.players[0];
  if(!natural){sim.spawnAcc=-1e9;sim.bossIndex=99;sim.eventT=1e9;sim.shrineT=1e9;p.skips=2;sim.pending.p1={choices,left:20};}
  const elements=new Map(),el=id=>{if(!elements.has(id)){const classes=new Set(['hidden']);elements.set(id,{style:{},innerHTML:'',textContent:'',children:[],dataset:{},appendChild(child){this.children.push(child);},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),toggle(x,on){if(on??!classes.has(x))classes.add(x);else classes.delete(x);}}});}return elements.get(id);};
  const touch={id:held?7:null,ox:0,oy:0,x:held?1:0,y:0};
  const events=new Map(),context={...content,sim,phone,touch,events,step,choose,skipLevel,TICK,rankedStep,rankedChoice,RunRecorder,$:el,
    addEventListener:(name,fn)=>events.set(name,fn),document:{hidden:false,addEventListener:(name,fn)=>events.set(name,fn),createElement:()=>({dataset:{},classList:{toggle(){}}})},
    preloadNextIcons(){},audio:{duck(){},play(){}},renderer:{getYaw:()=>0},navigator:{getGamepads:()=>[]},
    iconHTML:()=>'',imgTag:()=>'',stepOf:()=>null,markCard(){},showCasket(){},persistRanked(){},endRun(){},hop(){},console};
  vm.createContext(context);
  const play=section("  if (mode === 'play') {\n    if (edges.start)","  } else if (mode === 'levelup') {");
  const level=section("  } else if (mode === 'levelup') {","  } else if (mode === 'casket') {");
  vm.runInContext(`
    let mode='${shown?'levelup':'play'}',shownPending=${shown},rewardWasShown=${shown},selCard=0,waitingForMove=false,acc=0,pendingUse=null,slowmo=0;
    const PLAYER='p1',isTouchUI=phone,stickEl=$('stick'),keys=new Set(),rankedRec=${ranked?'new RunRecorder()':'null'};
    ${section('function readInput() {','function padEdges(')}
    ${section('const hop =','let padPrev')}
    ${section("addEventListener('blur'",'function pause(on)')}
    ${section('function pause(on)',"$('start').onclick")}
    ${section('function clearTouch() {',"addEventListener('pointerdown'")}
    ${section('function resumeAfterReward() {','function showLevelUp() {')}
    ${section('function showLevelUp() {','function doReroll()')}
    ${section('function doSkip() {',"$('reroll').onclick")}
    ${section('function pick(i) {','// ---- reward casket card:')}
    ${section('function afterCasket() {','function pickCasket(')}
    this.api={pick,doSkip,afterCasket,showReal:showLevelUp,element:$,
      advance(x,z){rankedStep(sim,rankedRec,x,z);sim.fx.length=0;},
      openReward(){mode='levelup';shownPending=rewardWasShown=true;touch.id=null;touch.x=touch.y=0;},
      show(){const choices=sim.pending.p1.choices;sim.pending.p1.choices=[];showLevelUp();sim.pending.p1.choices=choices;},
      move(x,y=0){touch.id=7;touch.x=x;touch.y=y;},
      tumble:hop,frame(dt=.1,edges={}){const inp=readInput();${play}}},
      levelFrame(accept=false){const dt=TICK,edges={a:accept};if(false){${level}}},
      key(k){keys.add(k);},
      blur(){events.get('blur')();},hidden(){document.hidden=true;events.get('visibilitychange')();},
      state(){return {mode,shownPending,rewardWasShown,modal:!$('levelup').classList.contains('hidden'),waitingForMove,acc,hint:!$('movehint').classList.contains('hidden'),touchId:touch.id,touchX:touch.x,log:rankedRec?.log()};}
    };
  `,context);
  return {sim,p,touch,...context.api,showChecked:()=>vm.runInContext('api.showReal()',context,{timeout:200})};
}

test('a held joystick survives the reward popup like a held keyboard key',()=>{
  const h=setup({held:true});h.show();
  assert.equal(h.state().touchId,7);assert.equal(h.state().touchX,1);
  h.pick(0);assert.equal(h.state().waitingForMove,false);
});

for(const controller of [false,true])test(`explicit tumble resumes mobile reward safety wait: controller=${controller}`,()=>{
 const h=setup();h.pick(0);const tick=h.sim.tick,x=h.p.x,z=h.p.z;assert.equal(h.state().waitingForMove,true);if(!controller)h.tumble();h.frame(TICK,{a:controller});assert.equal(h.state().waitingForMove,false);assert.ok(h.sim.tick>tick);assert.ok(h.p.rollCd>0);assert.ok(Math.hypot(h.p.x-x,h.p.z-z)>0);
});
test('controller pause discards a queued tumble and freezes the entire frame',()=>{
 const h=setup({shown:false});delete h.sim.pending.p1;h.tumble();const tick=h.sim.tick;h.frame(.1,{start:true});assert.equal(h.state().mode,'pause');assert.equal(h.sim.tick,tick);assert.ok(!h.p.rollCd);
});
test('blur or hiding the page during a reward clears stale input before resuming',()=>{
  for(const event of ['blur','hidden']){
    const h=setup({held:true});h.key('d');h[event]();assert.equal(h.state().mode,'levelup');
    h.pick(0);assert.equal(h.state().touchId,null);assert.equal(h.state().waitingForMove,true,event);
  }
});
test('final level choice waits for mobile movement while desktop keeps its normal flow',()=>{
  const phone=setup();phone.pick(0);assert.equal(phone.state().waitingForMove,true);assert.equal(phone.state().hint,true);
  const desktop=setup({phone:false});desktop.pick(0);assert.equal(desktop.state().waitingForMove,false);
});
test('skip and final casket both wait for a new mobile direction',()=>{
  const skip=setup();skip.doSkip();assert.equal(skip.state().waitingForMove,true);
  const casket=setup();delete casket.sim.pending.p1;casket.afterCasket();assert.equal(casket.state().waitingForMove,true);
});
test('an auto-alched casket that never opened a popup does not stop the fight',()=>{
  const h=setup({shown:false});delete h.sim.pending.p1;h.afterCasket();assert.equal(h.state().waitingForMove,false);
});
test('queued rewards keep their pause and arm movement only after the last choice',()=>{
  const h=setup();h.p.levelQ=1;h.pick(0);assert.ok(h.sim.pending.p1);assert.equal(h.state().waitingForMove,false);
  h.pick(0);assert.equal(h.state().waitingForMove,true);
});
test('controller choosing a card cannot tick hazards in the chooser branch',()=>{
  const h=setup({phone:false});h.sim.hazards.push({x:h.p.x,z:h.p.z,r:2,t:TICK/2,max:1,dmg:1000});
  const tick=h.sim.tick;h.levelFrame(true);assert.equal(h.sim.tick,tick);assert.equal(h.p.alive,true);
});
test('the final timeout also waits for mobile movement',()=>{
  const h=setup();h.sim.pending.p1.left=0;h.levelFrame();assert.equal(h.state().waitingForMove,true);
});
test('waiting freezes near-expiry slams and discards accumulated frame time',()=>{
  const h=setup();h.p.hp=40;const x=h.p.x;
  h.sim.hazards.push({x:x-1.8,z:h.p.z,r:2,t:.15,max:1.5,dmg:111});
  h.pick(0);const tick=h.sim.tick,hp=h.p.hp;
  for(let i=0;i<30;i++)h.frame();
  assert.equal(h.sim.tick,tick);assert.equal(h.sim.hazards[0].t,.15);assert.equal(h.p.hp,hp);assert.equal(h.state().acc,0);
  h.move(1);h.frame();assert.ok(h.sim.tick>tick);assert.ok(h.p.x>x);assert.equal(h.p.alive,true);
  assert.equal(h.state().waitingForMove,false);assert.equal(h.state().hint,false);
});
test('ranked waiting records no idle ticks and directional resume records real movement',()=>{
  const h=setup({ranked:true});h.pick(0);const tick=h.sim.tick;
  for(let i=0;i<10;i++)h.frame();assert.equal(h.sim.tick,tick);assert.equal(h.state().log.runs.length,0);
  h.move(1);h.frame();assert.ok(h.sim.tick>tick);assert.equal(h.state().log.runs[0][1],100);
});
test('genuine ranked prefixes resume identically after mobile reward pauses on both paces',()=>{
  for(const [seed,week,mode,mapId,adv]of [[11,0,'normal','greentown','adventurer'],[14,1,'normal','apache','knight'],[15,1,'hard','swamp','ranger']]) {
    const params={seed,week,mode,mapId,adv,ground:null},h=setup({ranked:true,natural:params}),random=mulberry32(seed);
    let ticks=0;
    while(!h.sim.pending.p1&&!h.sim.over&&ticks++<6000)h.advance(random()*3-1.5,random()*3-1.5);
    assert.ok(h.sim.pending.p1,'honest run earned a reward: '+JSON.stringify(params));
    while(h.sim.pending.p1){h.openReward();h.pick(0);}
    const before=JSON.stringify(h.state().log);for(let i=0;i<20;i++)h.frame();assert.equal(JSON.stringify(h.state().log),before);
    h.move(.137,-.289);h.frame(TICK);
    const restored=resumeRanked(JSON.parse(JSON.stringify(h.state().log)),params);
    assert.deepEqual(restored.rec.log(),JSON.parse(JSON.stringify(h.state().log)));
    const state=s=>[s.tick,s.t,s.kills,s.level,s.players[0].x,s.players[0].z,s.players[0].hp];
    assert.deepEqual(state(restored.sim),state(h.sim));
  }
});

const onlyHeal=[{kind:'heal',id:'fish',level:1,rarity:'common'}];
for(const phone of [false,true])for(const held of [false,true])test(`sole-heal offer auto-continues without a modal or new movement wait: phone=${phone}, held=${held}`,()=>{
 const h=setup({phone,held,shown:false,choices:onlyHeal});h.p.hp=20;h.p.maxHp=100;const tick=h.sim.tick;h.showReal();
 assert.equal(h.sim.pending.p1,undefined);assert.equal(h.p.hp,60);assert.equal(h.sim.tick,tick);assert.equal(h.state().mode,'play');assert.equal(h.state().modal,false);assert.equal(h.state().shownPending,false);assert.equal(h.state().waitingForMove,false);assert.equal(h.state().hint,false);assert.equal(h.state().touchId,held?7:null);assert.equal(h.state().touchX,held?1:0);
});
for(const ranked of [false,true])test(`consecutive forced heals drain the earned level queue with one recorded choice each: ranked=${ranked}`,()=>{
 const h=setup({ranked,shown:false,choices:onlyHeal});h.p.weapons={katana:6,bow:6,axe:6,shield:6};h.p.evo={katana:true,bow:true,axe:true,shield:true};h.p.passives={might:5,boots:5,vigor:5,armor:5};h.p.levelQ=3;h.p.hp=1;h.p.maxHp=100;const tick=h.sim.tick;h.showReal();
 assert.equal(h.sim.pending.p1,undefined);assert.equal(h.p.levelQ,0);assert.equal(h.p.hp,100);assert.equal(h.sim.tick,tick);assert.equal(h.state().modal,false);assert.equal(h.state().waitingForMove,false);if(ranked){assert.deepEqual(Array.from(h.state().log.picks),[0,0,0,0]);assert.equal(h.state().log.runs.length,0);}
});
test('auto-healing after a genuinely shown manual reward retains the final mobile-resume safeguard',()=>{
 const h=setup({shown:true,choices:onlyHeal});h.showReal();assert.equal(h.sim.pending.p1,undefined);assert.equal(h.state().mode,'play');assert.equal(h.state().waitingForMove,true);assert.equal(h.state().hint,true);
});
test('a heal beside an optional curse remains an actual choice',()=>{
 const h=setup({shown:false,choices:[...onlyHeal,{kind:'passive',id:'curse',level:1,rarity:'common'}]});h.p.hp=20;h.showReal();assert.equal(h.p.hp,20);assert.equal(h.sim.pending.p1.choices.length,2);assert.equal(h.state().mode,'levelup');assert.equal(h.state().modal,true);
});
test('a single genuine upgrade is not mistaken for a forced heal',()=>{
 const h=setup({shown:false});const level=h.p.weapons.katana;h.showReal();assert.ok(h.sim.pending.p1);assert.equal(h.p.weapons.katana,level);assert.equal(h.state().mode,'levelup');assert.equal(h.state().modal,true);
});
test('an earned casket after a forced heal is not automatically selected',()=>{
 const h=setup({ranked:true,shown:false,choices:onlyHeal});h.p.gear={head:'Bronze Helmet'};h.p.casketQ.push('Iron Helmet');h.showReal();assert.ok(h.sim.pending.p1?.casket);assert.equal(h.sim.pending.p1.casket.item,'Iron Helmet');assert.equal(h.p.gear.head,'Bronze Helmet');assert.deepEqual(Array.from(h.state().log.picks),[0]);
});

test('a refused forced-heal choice falls back to its card instead of spinning the UI',()=>{
 const h=setup({shown:false,choices:onlyHeal}),before=h.sim.pending.p1;h.sim.players=[];assert.doesNotThrow(()=>h.showChecked());assert.equal(h.sim.pending.p1,before);assert.equal(h.state().mode,'levelup');assert.equal(h.state().modal,true);
});

for(const[weapon,first,second]of [['bow','Winged Boots','Amanita'],['staff','Wizard Hat','Cape']])for(const pace of [1,2])test(`actual ${weapon} max-level card explains ${pace===1?'legacy':'alternative'} evolution requirements`,()=>{
 const h=setup({shown:false,choices:[{kind:'weapon',id:weapon,level:6}]});h.sim.pace=pace;h.showReal();const html=h.element('cards').children[0].innerHTML;assert.ok(html.includes(first));if(pace===2){assert.ok(html.includes(' or '));assert.ok(html.includes(second));}else assert.ok(!html.includes(second));
});
for(const[passive,weapons]of [['area',['staff','pickaxe']],['thorns',['katana','shield']],['crit',['bow','lighter']],['boots',['bow','shortsword']]])test(`actual ${passive} passive card discloses every shared evolution route`,()=>{
 const h=setup({shown:false,choices:[{kind:'passive',id:passive,level:1}]});h.showReal();const html=h.element('cards').children[0].innerHTML;for(const id of weapons)assert.ok(html.includes(content.weaponTitle(id,6,null)),id+' missing from '+html);
});
for(const pace of [1,2])test(`Vigor card also discloses both already-existing evolution pairings on pace${pace}`,()=>{
 const h=setup({shown:false,choices:[{kind:'passive',id:'vigor',level:1}]});h.sim.pace=pace;h.showReal();const html=h.element('cards').children[0].innerHTML;for(const id of ['axe','greatsword'])assert.ok(html.includes(content.weaponTitle(id,6,null)),id+' missing from '+html);
});
