import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import * as game from '../src/sim.js';
import { GEAR, WEAPON_IDS } from '../src/content.js';
import { rankedSim, RunRecorder, replay } from '../src/ranked.js';
import { rankedChoice, rankedStep, resumeRanked } from '../src/ranked-play.js';
let canAutoEquip;
try { ({ canAutoEquip } = await import('../src/auto-equip.js')); } catch(e) { if(e.code!=='ERR_MODULE_NOT_FOUND')throw e; }
const require=createRequire(import.meta.url), { logShape }=require('../tools/vercel-api/ranked.js');
const equip=(gear={},gearLv={})=>({gear,gearLv});
test('auto equip accepts clear armour improvements and empty slots without changing the player',()=>{
 assert.equal(typeof canAutoEquip,'function');const p=equip({offhand:'Bronze Kiteshield'}),before=JSON.stringify(p);
 assert.equal(canAutoEquip(p,'Iron Kiteshield',2),true);assert.equal(JSON.stringify(p),before);
 assert.equal(canAutoEquip(equip(),'Wooden Shield',2),true);assert.equal(canAutoEquip(p,'Bronze Kiteshield',2),false);
});
test('auto equip rejects stat trades and reinforced downgrades',()=>{
 assert.equal(typeof canAutoEquip,'function');assert.equal(canAutoEquip(equip({offhand:'Bronze Shield'}),'Iron Kiteshield',2),false);
 assert.equal(canAutoEquip(equip({offhand:'Bronze Kiteshield'},{'Bronze Kiteshield':3}),'Iron Kiteshield',2),false);
});
test('auto equip protects incomplete and complete sets but allows same-set trimmed upgrades',()=>{
 assert.equal(typeof canAutoEquip,'function');assert.equal(canAutoEquip(equip({head:'Bronze Helmet'}),'Iron Helmet',2),false);
 const gear=Object.fromEntries(['Helmet','Chestplate','Gauntlets','Leggings','Boots'].map((n,i)=>[['head','chest','hands','legs','feet'][i],'Bronze '+n]));
 assert.equal(canAutoEquip(equip(gear),'Iron Helmet',2),false);assert.equal(canAutoEquip(equip(gear),'Bronze Helmet (t)',2),true);
});
test('auto equip rejects weapon items, unknown/prototype names and pace-ineligible armour',()=>{
 assert.equal(typeof canAutoEquip,'function');for(const n of ['Bronze Bow','constructor','__proto__','missing'])assert.equal(canAutoEquip(equip(),n,2),false,n);
 assert.equal(canAutoEquip(equip(),'Minion Robe',1),false);
});
test('auto equip compares unrounded bonuses so tiny losses still prevent wearing',t=>{
 assert.equal(typeof canAutoEquip,'function');GEAR.testOld={slot:'offhand',bonus:{armor:1,speed:0.0001}};GEAR.testNew={slot:'offhand',bonus:{armor:2,speed:0.0000999}};
 t.after(()=>{delete GEAR.testOld;delete GEAR.testNew;});assert.equal(canAutoEquip(equip({offhand:'testOld'}),'testNew',2),false);
});
function offer(pace=2){
 const s=game.createSim({pace}),p=s.players[0],ids=WEAPON_IDS.filter(id=>!p.weapons[id]);
 s.pending.p1={choices:[{kind:'weapon',id:ids[0],level:1},{kind:'weapon',id:ids[1],level:1},{kind:'passive',id:'boots',level:1}],left:20};return{s,p,ids};
}
const hasBanish=()=>{assert.equal(typeof game.canBanish,'function');assert.equal(typeof game.banish,'function');};
test('banishing a new skill keeps indices/rarities, consumes no RNG and spends one of three',()=>{
 hasBanish();const{s,p,ids}=offer();let calls=0;s.rng=()=>{calls++;return .5;};const other=s.pending.p1.choices[1];
 assert.equal(game.banish(s,'p1',0),true);assert.equal(calls,0);assert.deepEqual(p.banished,['weapon:'+ids[0]]);assert.equal(s.pending.p1.choices.length,3);assert.equal(s.pending.p1.choices[0].banished,true);assert.equal(s.pending.p1.choices[1],other);
 assert.equal(game.banish(s,'p1',0),false);assert.equal(p.banished.length,1);assert.equal(game.choose(s,'p1',0),false);assert.ok(s.pending.p1);
});
test('a banish never removes the last usable choice and auto picks the next usable one',()=>{
 hasBanish();const{s,p,ids}=offer();assert.equal(game.banish(s,'p1',0),true);assert.equal(game.banish(s,'p1',1),true);assert.equal(game.banish(s,'p1',2),false);assert.equal(game.autoChoice(s.pending.p1),2);
 s.pending.p1.left=.001;game.step(s,{},game.TICK);assert.equal(p.passives.boots,1);assert.equal(p.weapons[ids[0]],undefined);assert.equal(p.weapons[ids[1]],undefined);
});
test('banish budget is bounded per run and resets for another run',()=>{
 hasBanish();const{s,p}=offer();for(let n=0;n<3;n++){s.pending.p1={choices:[{kind:'weapon',id:WEAPON_IDS.filter(id=>!p.weapons[id])[n],level:1},{kind:'heal',id:'fish',level:1}],left:20};assert.equal(game.banish(s,'p1',0),true);}
 s.pending.p1={choices:[{kind:'passive',id:'boots',level:1},{kind:'heal',id:'fish',level:1}],left:20};assert.equal(game.banish(s,'p1',0),false);assert.equal(p.banished.length,3);assert.deepEqual(game.createSim().players[0].banished,[]);
});
test('banished skills stay out of later rolls and rerolls for that player',()=>{
 hasBanish();const{s,p,ids}=offer();game.banish(s,'p1',0);game.banish(s,'p1',2);
 for(let n=0;n<50;n++)assert.ok(game.rollChoices(s,p).every(c=>!(c.kind==='weapon'&&c.id===ids[0])&&!(c.kind==='passive'&&c.id==='boots')));
 assert.equal(game.reroll(s,'p1'),true);assert.ok(s.pending.p1.choices.every(c=>c.id!==ids[0]&&c.id!=='boots'));
});
test('owned upgrades, evolution, heal, casket, dead/end/no-player and bad indices cannot be banished',()=>{
 hasBanish();for(const card of [{kind:'weapon',id:'katana',level:2},{kind:'evolve',id:'katana',level:1},{kind:'heal',id:'fish',level:1}]){const{s}=offer();s.pending.p1.choices[0]=card;assert.equal(game.banish(s,'p1',0),false);}
 for(const setup of [s=>s.pending.p1.casket={},s=>s.players[0].alive=false,s=>s.over='dead',s=>delete s.pending.p1]){const{s}=offer();setup(s);assert.equal(game.banish(s,'p1',0),false);}
 const{s}=offer();for(const i of [-1,3,NaN,0.5,'0',null])assert.equal(game.banish(s,'p1',i),false);assert.equal(game.banish(s,'absent',0),false);
 const passive=offer();passive.p.passives.boots=1;assert.equal(game.banish(passive.s,'p1',2),false);
});
test('a player banishes only their own offers',()=>{
 hasBanish();const s=game.createSim({players:[{id:'p1'},{id:'p2'}]}),p=s.players[0],id=WEAPON_IDS.find(id=>!p.weapons[id]);
 s.pending.p1={choices:[{kind:'weapon',id,level:1},{kind:'heal',id:'fish',level:1}],left:20};assert.equal(game.banish(s,'p1',0),true);assert.deepEqual(s.players[1].banished,[]);
 let offered=false;for(let i=0;i<50;i++)if(game.rollChoices(s,s.players[1]).some(c=>c.id===id))offered=true;assert.equal(offered,true);
});
test('pace1 neither gains banish state nor permits banish actions',()=>{
 hasBanish();const{s,p}=offer(1),before=JSON.stringify(s);assert.equal(Object.hasOwn(p,'banished'),false);assert.equal(game.banish(s,'p1',0),false);assert.equal(JSON.stringify(s),before);
 const r=new RunRecorder();assert.equal(rankedChoice(s,r,'b0'),false);assert.deepEqual(r.log().picks,[]);
});
test('server accepts only exact bounded banish action grammar',()=>{
 for(const action of ['b0','b1','b2'])assert.equal(logShape({v:1,runs:[],uses:[],picks:[action]},100),null,action);
 for(const action of ['b','b3','b-1','b01','b0x',{},['b0'],null])assert.equal(logShape({v:1,runs:[],uses:[],picks:[action]},100),'bad choice');
});
test('an earned banish survives ranked prefix recovery and complete replay',()=>{
 hasBanish();const params={seed:14,mapId:'apache',adv:'knight',week:1,mode:'normal',ground:null};let s=rankedSim(params),r=new RunRecorder(),cut=false;
 const state=q=>JSON.stringify([q.tick,q.pending,q.players[0].banished,q.players[0].weapons,q.players[0].passives]);
 for(let n=0;n<50000&&!s.over;n++){
  if(s.pending.p1){const i=s.pending.p1.choices.findIndex((c,i)=>game.canBanish(s,'p1',i));if(!cut&&i>=0){assert.equal(rankedChoice(s,r,'b'+i),true);const before=state(s),log=JSON.parse(JSON.stringify(r.log())),back=resumeRanked(log,params);assert.equal(state(back.sim),before);assert.deepEqual(back.rec.log(),log);s=back.sim;r=back.rec;cut=true;}assert.equal(rankedChoice(s,r,'a'),true);}
  rankedStep(s,r,.137,-.289,null);s.fx.length=0;
 }
 assert.equal(cut,true,'actual earned offer');assert.ok(s.over,'genuine run ends');assert.ok(r.log().picks.some(p=>/^b[0-2]$/.test(p)));
 const back=replay(r.log(),params);assert.equal(back.error,undefined);assert.deepEqual([back.t,back.kills,back.level],[Math.floor(s.t),s.kills,s.level]);
});
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
test('actual casket UI uses the existing recorded Wear path only for safe enabled upgrades',()=>{
 const start=main.indexOf('function showCasket()'),end=main.indexOf('function markCasket()',start);
 const show=Function('canAutoEquip','player','card','enabled','alch',`const picks=[],PLAYER='p1',sim={pace:2,pending:{p1:{casket:card}},players:[player]},autoEquipOn=()=>enabled,autoAlchOn=()=>alch,imgTag=()=>'',toast=()=>{},pickCasket=(...a)=>picks.push(a),audio={duck(){}},$=()=>{throw Error('manual');};let shownPending=false,rewardWasShown=false,mode='play',selCard=0,waitingForMove=false;${main.slice(start,end)};try{showCasket();}catch(e){if(e.message!=='manual')throw e;}return{picks,mode};`);
 const card={item:'Iron Kiteshield',anyUp:true},p=equip({offhand:'Bronze Kiteshield'});
 assert.deepEqual(show(canAutoEquip,p,card,true,true).picks,[[0,true]]);
 assert.deepEqual(show(canAutoEquip,p,card,false,true).picks,[]);
 assert.deepEqual(show(canAutoEquip,equip({offhand:'Bronze Shield'}),card,true,true).picks,[]);
 assert.deepEqual(show(canAutoEquip,p,{item:'Bronze Kiteshield',anyUp:false},true,true).picks,[[1,true]]);
});
test('actual skill picking routes banish mode and never resumes after a refused disabled pick',()=>{
 const start=main.indexOf('function pick(i) {'),end=main.indexOf('// ---- reward casket card:',start);
 const pick=Function('banishMode',`const sim={pending:{p1:{choices:[{banished:true}]}}},PLAYER='p1',rankedRec=null,choose=()=>false,banishes=[],doBanish=i=>banishes.push(i),audio={duck(){}},$=()=>({classList:{add(){}}}),resumeAfterReward=()=>{};let shownPending=true,mode='levelup';${main.slice(start,end)};pick(0);return{mode,shownPending,banishes};`);
 assert.deepEqual(pick(true),{mode:'levelup',shownPending:true,banishes:[0]});
 assert.deepEqual(pick(false),{mode:'levelup',shownPending:true,banishes:[]});
});
test('settings expose an Off-by-default device-only automation preference and actual banish controls',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.match(html,/id="banishlv"/);assert.match(html,/id="banishhint"/);
 assert.ok(main.includes("load('sq-autoequip', false) === true"));assert.ok(main.includes("id: 'autoequip'"));
});
test('build controls have real text in all supported languages',async()=>{
 const {translateText}=await import('../src/i18n.js');const messages=['Choose your build','Auto equip safe armour upgrades (this device)','Keeps every stat and any set you have started. Weapons stay manual.','Banish','Banished','Choose a NEW skill to banish for this run. No replacement.','Optional auto-equip wears only clear armour upgrades and keeps your stats and started sets. Enable it in Settings on this device.','Up to 3 banishes remove unwanted NEW weapons or passives for the rest of this run. Banishing does not replace the card.'];
 for(const lang of ['tr','es','fil'])for(const m of messages)assert.notEqual(translateText(m,lang),m,lang+': '+m);
});

test('Banish exposes its irreversible next-card mode to assistive controls',()=>{
 const a=main.indexOf('function toggleBanish()'),b=main.indexOf('function doBanish(',a),attrs=new Map();
 const node={setAttribute:(k,v)=>attrs.set(k,v),classList:{toggle(){}}};
 const toggle=Function('$',`const mode='levelup',sim={pending:{p1:{choices:[{}]}}},PLAYER='p1',canBanish=()=>true;let banishMode=false;${main.slice(a,b)};return toggleBanish;`)(()=>node);
 toggle();assert.equal(attrs.get('aria-pressed'),'true');toggle();assert.equal(attrs.get('aria-pressed'),'false');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8'),button=html.match(/<button[^>]*id="banishlv"[^>]*>/)[0];assert.match(button,/aria-pressed="false"/);assert.match(button,/aria-describedby="banishhint"/);
});
