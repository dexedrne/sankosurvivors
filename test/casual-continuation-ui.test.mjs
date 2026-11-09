import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformMain} from '../tools/wavedash/edition.mjs';
import {createSim} from '../src/sim.js';
import {canContinueCasual,captureRewardBaseline,continueCasual} from '../src/casual-continuation.js';
const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
function setup(send=async()=>({ok:true}),code=source) {
 const start=code.indexOf('async function continueAfterScore('),end=code.indexOf('function toMenu()',start);assert.ok(start>=0&&end>start,'actual continuation controller exists');
 const sim=createSim({pace:2});sim.over='win';sim.players[0].hp=17;
 const elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,{disabled:false,textContent:'',classList:{add(){},remove(){},toggle(){}},focus(){}});return elements.get(id);};
 const ctx={sim,casualRun:{sim,baseline:captureRewardBaseline(sim,{loot:[]}),normalCommitted:true,normalResult:{},endlessTicket:'child',phase:'normal-end'},mode:'end',PLAYER:'p1',runTicket:'normal',canContinueCasual,continueCasual,$:el,keys:new Set(['w']),clearTouch(){ctx.cleared=true;},pendingUse:2,slowmo:1,acc:1,shownPending:true,rewardWasShown:false,waitingForMove:false,audio:{duck(){}},submitScore:send,runBest:null,passedBest:true,profileBest:x=>x,getBests:()=>({}),bestKey:()=>'',showLevelUp(){ctx.openedChoice=true;},resumeAfterReward(){ctx.waited=true;},navFocus(){},banner(){},lastRun:null};
 vm.createContext(ctx);vm.runInContext(code.slice(start,end),ctx);return ctx;
}
test('actual continue controller preserves same world and uses pending-choice and mobile wait flows',async()=>{
 const c=setup(),s=c.sim,p=s.players[0];s.pending.p1={choices:[]};await c.continueAfterScore();assert.equal(c.sim,s);assert.equal(s.players[0],p);assert.equal(p.hp,17);assert.equal(s.endless,true);assert.equal(c.runTicket,'child');assert.equal(c.openedChoice,true);assert.equal(c.acc,0);assert.equal(c.keys.size,0);
 const plain=setup();await plain.continueAfterScore();assert.equal(plain.waited,true);assert.equal(plain.rewardWasShown,true);
});
test('continuation cannot bypass uncommitted rewards, duplicates, or changed world after score await',async()=>{
 let release;const c=setup(()=>new Promise(r=>release=r));c.casualRun.normalCommitted=false;await c.continueAfterScore();assert.equal(c.sim.endless,false);
 c.casualRun.normalCommitted=true;const a=c.continueAfterScore();await c.continueAfterScore();const old=c.sim;c.sim=createSim();c.casualRun=null;release({ok:true});await a;assert.equal(old.endless,false);assert.equal(c.sim.endless,false);
});
test('unconfirmed normal score requires explicit fallback and never claims submission success',async()=>{
 const c=setup(async()=>({ok:false}));await c.continueAfterScore(true);assert.equal(c.sim.endless,false);
 await c.continueAfterScore();assert.equal(c.sim.endless,false);assert.equal(c.casualRun.unconfirmed,true);assert.equal(c.casualRun.normalResult.sent,undefined);
 await c.continueAfterScore(true);assert.equal(c.sim.endless,true);assert.equal(c.casualRun.normalResult.sent,undefined);
});

test('ticket response from an abandoned run cannot overwrite the next live run',async()=>{
 const start=source.indexOf('function loadCasualTickets('),end=source.indexOf('function runGround()',start);assert.ok(start>=0&&end>start);
 const requests=[],s=createSim({pace:2}),session={sim:s};const c={sim:s,casualRun:session,runTicket:null,BASE:'/',URLSearchParams,fetch:url=>new Promise(resolve=>requests.push({url,resolve}))};vm.createContext(c);vm.runInContext(source.slice(start,end),c);
 c.loadCasualTickets(session);assert.match(requests[0].url,/map=greentown&adv=adventurer&hard=0&endless=0/);
 const next={sim:createSim({pace:2})};c.sim=next.sim;c.casualRun=next;c.loadCasualTickets(next);
 requests[1].resolve({ok:true,json:async()=>({ticket:'next',endlessTicket:'next-child'})});await next.tickets;
 requests[0].resolve({ok:true,json:async()=>({ticket:'old',endlessTicket:'old-child'})});await session.tickets;
 assert.equal(c.runTicket,'next');assert.equal(next.endlessTicket,'next-child');assert.equal(session.ticket,undefined);
});

test('actual captured submit response cannot mark the next result sent or overwrite its status',async()=>{
 const {submitCasualResult}=await import('../src/casual-continuation.js');const start=source.indexOf('async function submitScore('),end=source.indexOf("$('lbsubmit').onclick",start);
 let release;const original={map:'greentown',ticket:'normal'},newer={map:'greentown',ticket:'child'};
 const nodes={lbname:{value:'First'},lbmsg:{textContent:''},lbsubmit:{disabled:false}};
 const c={lastRun:original,casualRun:null,sim:null,$:id=>nodes[id],save(){},savedPass:()=>null,BASE:'/',MAP_BY_ID:{greentown:{name:'Greentown'}},submitCasualResult,fetch:()=>new Promise(r=>release=r)};vm.createContext(c);vm.runInContext(source.slice(start,end),c);
 const pending=c.submitScore(original);c.lastRun=newer;nodes.lbmsg.textContent='New result';release({ok:true,status:200,json:async()=>({rank:2})});await pending;
 assert.equal(original.sent,true);assert.equal(newer.sent,undefined);assert.equal(nodes.lbmsg.textContent,'New result');
});

test('wallet-free actual continuation uses only the committed local record',async()=>{
 const c=setup(()=>{throw Error('network score called');},transformMain(source));await c.continueAfterScore();assert.equal(c.sim.endless,true);assert.equal(c.waited,true);
});

for(const variant of ['normal','wizard'])test(`actual ${variant} startup preserves gear and scopes tickets to eligible casual worlds`,async()=>{
 const {MAP_BY_ID}=await import('../src/content.js');const requests=[],nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,{disabled:false,textContent:'',classList:{add(){},remove(){}}});return nodes.get(id);};
 const c={coop:null,mode:'title',runStarting:false,coopLoading:false,rankedLive:()=>false,rankedPlaying:()=>false,titleProgressPending:false,cancelPendingLoads(){},rankedRun:null,rankedRec:null,runTicket:null,casualRun:null,WEAPONS:{},PASSIVES:{},preloadIcons(){},mapLoading:false,MAP_BY_ID,loadedMapId:'greentown',selMap:'greentown',audio:{music(){},init:async()=>{}},params:new URLSearchParams(),runAdv:()=>variant==='wizard'?{id:'wise-old-man',weapon:'staff'}:{id:'adventurer',weapon:'sword'},selAdv:'adventurer',selVariant:variant,VARIANTS:(await import('../src/game-modes.js')).VARIANTS,trialBoss:'giant',getGear:()=>({head:'Iron Helmet'}),renderer:{preloadGear:async()=>{},reset(){},setZoom(){},setShift(){},setYaw(){}},createSim,hardOn:variant==='normal',endlessOn:false,getSkills:()=>({}),runGround:()=>null,PLAYER:'p1',getGearLv:()=>({'Iron Helmet':2}),sim:null,URLSearchParams,BASE:'/',fetch:url=>{requests.push(url);return Promise.resolve({ok:true,json:async()=>({ticket:'normal',endlessTicket:'child'})});},acc:1,selCard:1,slotCache:{},$,shownPending:true,waitingForMove:true,rewardWasShown:true,clearTouch(){},pendingUse:1,slowmo:1,runBest:null,profileBest:x=>x,getBests:()=>({}),bestKey:()=>'',passedBest:true,chase:{},fmtT:String,slayName:()=>'',banner(){}};
 const a=source.indexOf('function loadCasualTickets('),b=source.indexOf('function runGround()',a),x=source.indexOf('async function startRun('),y=source.indexOf('let bannerT =',x);vm.createContext(c);vm.runInContext(source.slice(a,b)+source.slice(x,y),c);
 await c.startRun();await c.casualRun.tickets;assert.equal(c.casualRun.sim,c.sim);assert.equal(c.mode,'play');assert.equal(c.runStarting,false);assert.deepEqual(c.sim.players[0].gear,{head:'Iron Helmet'});assert.deepEqual(c.sim.players[0].gearLv,{'Iron Helmet':2});
 if(variant==='wizard'){assert.equal(c.sim.players[0].adv,'wise-old-man');assert.deepEqual(c.sim.players[0].weapons,{staff:1});assert.equal(c.runTicket,null);assert.equal(requests.length,0);}
 else{assert.equal(c.runTicket,'normal');assert.equal(c.casualRun.endlessTicket,'child');assert.equal(requests.length,1);assert.match(requests[0],/hard=1&endless=0/);}
});

test('actual score retry keeps the displayed submitted name after an uncertain response',async()=>{
 const {submitCasualResult}=await import('../src/casual-continuation.js');const a=source.indexOf('async function submitScore('),b=source.indexOf("$('lbsubmit').onclick",a),bodies=[];
 const target={map:'greentown',ticket:'normal'},nodes={lbname:{value:'First',disabled:false},lbmsg:{},lbsubmit:{}};
 const c={lastRun:target,casualRun:null,sim:null,$:id=>nodes[id],save(){},savedPass:()=>null,BASE:'/',MAP_BY_ID:{greentown:{name:'Greentown'}},submitCasualResult,fetch:async(url,options)=>{bodies.push(JSON.parse(options.body));throw Error('lost response');}};vm.createContext(c);vm.runInContext(source.slice(a,b),c);
 await c.submitScore(target);assert.equal(nodes.lbname.disabled,true);nodes.lbname.value='Changed';await c.submitScore(target);assert.equal(nodes.lbname.value,'First');assert.equal(bodies[1].name,'First');
});

async function delayedTicketFixture({endless=false}={}) {
 const {submitCasualResult}=await import('../src/casual-continuation.js'),c=setup(),requests=[];
 Object.assign(c,{BASE:'/',URLSearchParams,submitCasualResult,save(){},savedPass:()=>null,MAP_BY_ID:{greentown:{name:'Greentown'}},LATEST:'fixture',rankedRun:null,coopResult:null});
 c.sim.endless=endless;c.casualRun.phase='playing';c.casualRun.normalResult=null;c.casualRun.endlessTicket=null;c.runTicket=null;c.$('lbname').value='';
 let deliver;
 c.fetch=async(url,options)=>{
  if(url.includes('api/run?'))return new Promise(resolve=>{deliver=()=>resolve({ok:true,json:async()=>({ticket:endless?'direct-endless':'normal',endlessTicket:endless?undefined:'child'})});});
  const body=JSON.parse(options.body);requests.push(body);const valid=body.ticket===(body.endless?(endless?'direct-endless':'child'):'normal');
  return {ok:valid,status:valid?200:400,json:async()=>valid?{ok:true,rank:2}:{error:'bad ticket'}};
 };
 const section=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
 vm.runInContext(section('function loadCasualTickets(', 'function runGround()')+section('async function submitScore(', "$('lbsubmit').onclick")+section('function endRun()', "  $('continueendless').classList.add('hidden');")+'}\n',c);
 c.loadCasualTickets(c.casualRun);
 return {c,requests,deliver:()=>deliver()};
}
for(const responseBeforeDeath of [true,false])test(`held initial ticket selects the child after unnamed explicit continuation; response before death=${responseBeforeDeath}`,async()=>{
 const {c,requests,deliver}=await delayedTicketFixture();c.endRun();const normal=c.lastRun;
 await c.continueAfterScore();assert.equal(c.casualRun.unconfirmed,true);assert.equal(c.sim.endless,false);
 await c.continueAfterScore(true);assert.equal(c.sim.endless,true);assert.equal(normal.sent,false);
 if(responseBeforeDeath){deliver();await c.casualRun.tickets;assert.equal(c.runTicket,'child');}
 c.sim.over='dead';c.sim.t=1100;c.sim.kills=700;c.endRun();const final=c.lastRun;c.$('lbname').value='Runner';const pending=c.submitScore(final);
 if(!responseBeforeDeath){assert.equal(final.ticket,null);deliver();}
 const out=await pending;assert.equal(out.ok,true);assert.equal(final.ticket,'child');assert.equal(final.sent,true);assert.equal(normal.sent,false);
 assert.equal(requests.length,1);assert.equal(requests[0].ticket,'child');assert.equal(requests[0].endless,true);assert.equal(requests[0].t,1100);
});
for(const endless of [false,true])test(`captured ${endless?'direct Endless':'ordinary normal'} loss backfills its own delayed initial ticket`,async()=>{
 const {c,requests,deliver}=await delayedTicketFixture({endless});c.sim.over='dead';c.sim.t=300;c.endRun();const result=c.lastRun;assert.equal(result.ticket,null);assert.equal(c.casualRun.normalResult,null);
 c.$('lbname').value='Runner';const pending=c.submitScore(result);deliver();const out=await pending;
 assert.equal(out.ok,true);assert.equal(result.ticket,endless?'direct-endless':'normal');assert.equal(requests.length,1);assert.equal(requests[0].endless,endless);
});

test('native casketOf fixture preserves exact occurrence alch top-ups and legacy mode guards',async()=>{
 const {GEAR,isWeaponItem}=await import('../src/content.js'),{openCasket,choose}=await import('../src/sim.js'),{prepareRunRewards}=await import('../src/run-rewards.js'),{phaseAlch}=await import('../src/casual-continuation.js');
 const line=source.split('\n').find(line=>line.trim().startsWith('casketOf(...names)')).split('//')[0].trim();
 const make=(sim,rankedRun=null,coop=null)=>Function('sim','rankedRun','coop','GEAR','isWeaponItem','openCasket',`return ({${line}}).casketOf;`)(sim,rankedRun,coop,GEAR,isWeaponItem,openCasket);
 const sim=createSim({pace:2}),p=sim.players[0];p.gear.head='Iron Helmet';make(sim)('Iron Helmet','Iron Helmet');assert.equal(sim.pending.p1.lootIndex,0);assert.deepEqual(p.casketLootIndices,[1]);
 sim.over='win';const r=prepareRunRewards({getItem:key=>key==='sq-bank'?'["Iron Helmet"]':null},sim,{earned:120}),b=captureRewardBaseline(sim,r);continueCasual(sim,b);choose(sim,'p1',0);choose(sim,'p1',1);assert.deepEqual(sim.alchedLootIndices,[1]);assert.equal(phaseAlch(sim,b),10);
 const old=createSim({pace:1});old.players[0].gear.head='Iron Helmet';make(old)('Iron Helmet');assert.equal(Object.hasOwn(old.players[0],'casketLootIndices'),false);assert.equal(Object.hasOwn(old.pending.p1,'lootIndex'),false);
 for(const [ranked,coop]of[[{},null],[null,{}]]){const s=createSim({pace:2});make(s,ranked,coop)('Iron Helmet');assert.equal(s.loot.length,0);}
});
