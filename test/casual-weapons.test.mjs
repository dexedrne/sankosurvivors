// The Dagger, Fishing Net and Fishing Rod (15 Nov): casual pace 2 only. Ranked and week-0 runs must never be offered
// them, and must roll their cards exactly as the live simulation did before these weapons existed.
import test from 'node:test';import assert from 'node:assert/strict';
import {createRequire} from 'node:module';import {existsSync} from 'node:fs';
import * as C from '../src/content.js';import * as S from '../src/sim.js';
import {rankedSim,RunRecorder,replay} from '../src/ranked.js';import {rankedStep,rankedChoice} from '../src/ranked-play.js';
import {itemInspection} from '../src/item-inspection.js';import {captureRunBuild} from '../src/run-build.js';
import {botInput,pickCard} from '../qa-kit/simlib.mjs';

const NEW=['dagger','net','rod'],OLD=['katana','bow','axe','shield','staff','pickaxe','greatsword','shortsword','baseball','lighter'];
const close=(a,b,eps=1e-9)=>assert(Math.abs(a-b)<=eps,`${a} != ${b}`);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function scene(opts={}){
 const s=S.createSim({seed:57,...opts});s.spawnAcc=-1e9;s.bossIndex=99;s.eventT=s.shrineT=s.merchantT=1e9;s.rng=()=>.99;
 for(const p of s.players){p.weapons={};p.inv=1e9;}return s;
}
function walled(){
 const n=32,g={n,cell:true,blocked:new Uint8Array(n*n),walls:new Uint8Array(n*n),fences:new Uint8Array(n*n)};
 const s=scene({ground:g,map:{...C.MAPS[0],id:'test',cx:16,cz:16,r:15,length:1e9,bosses:[]}}),p=s.players[0];p.x=12.5;p.z=10.5;return{s,p,g};
}
function foe(s,type,x,z,extra={}){S.spawnEnemy(s,type,x,z);const e=s.enemies.at(-1);Object.assign(e,{hp:1e6,maxHp:1e6,speed:0,atkCd:1e9},extra);return e;}
const run=(s,n,input={mx:0,mz:0})=>{const fx=[];for(let i=0;i<n;i++){S.step(s,{p1:input});fx.push(...s.fx);s.fx.length=0;}return fx;};

test('the three weapons are real casual-only entries after the original ten',()=>{
 assert.deepEqual(C.WEAPON_IDS,[...OLD,...NEW]);
 assert.deepEqual(C.weaponIdsAt(2,false),[...OLD,...NEW]);
 for(const[pace,ranked]of[[1,false],[1,true],[2,true],[undefined,false]])assert.deepEqual(C.weaponIdsAt(pace,ranked),OLD);
 for(const id of NEW){assert.equal(C.WEAPONS[id].pace,2);assert.equal(C.WEAPONS[id].casual,true);assert(C.WEAPONS[id].blurb.length>20);}
});
test('names, icons, models and upgrade notes are real for every level',()=>{
 const names={dagger:'Dagger',net:'Fishing Net',rod:'Fishing Rod'};
 for(const id of NEW)for(let level=1;level<=6;level++){
  for(const step of[null,0,5]){assert.equal(C.weaponItem(id,level,step),names[id]);assert.equal(C.weaponTitle(id,level,step),names[id]);}
  assert(existsSync(new URL('../public/assets/ui/items/'+C.itemIconFile(names[id]),import.meta.url)),'icon for '+id);
  assert(C.WEAPONS[id].next(level)&&C.WEAPONS[id].next(level)!=='max');
  const stats=C.WEAPONS[id].stats(level);for(const[key,value]of Object.entries(stats))assert(Number.isFinite(value)&&value>0,`${id}.${key}`);
  assert.equal(C.weaponStep(id,{[id]:3}),null);assert.deepEqual(C.weaponMetal(id,{[id]:5}),{dmg:1,pierce:0});
 }
 assert.equal(C.weaponModelPath('net',1),null);
 for(const id of['dagger','rod'])assert(existsSync(new URL('../public/assets/models/'+C.weaponModelPath(id,6,'model',0),import.meta.url)));
 for(const[id,name]of[['dagger','Twin Daggers'],['net','Dragnet'],['rod','Longline']]){
  assert.equal(C.EVOLUTIONS[id].name,name);assert.deepEqual(C.weaponDisplay(id,6,true),{name,item:names[id]});
 }
});
test('quality strengthens only continuous values and every value stays bounded',()=>{
 for(const id of NEW){
  const base={weapons:{[id]:6},quality:{weapons:{}}},wild={weapons:{[id]:6},quality:{weapons:{[id]:1e6}}};
  const plain=C.weaponStats(base,id),strong=C.weaponStats(wild,id);
  for(const key of['boostT','hooks','cast','arc','kb'])if(key in plain)assert.equal(strong[key],plain[key],key);
  assert(strong.cd>=.12);assert(strong.dmg>plain.dmg);
  if(id==='dagger')assert(strong.boost<=3);
  if(id==='net'){assert(strong.slow<=.6);assert(strong.slowT<=4);assert(C.evolveStats('net',strong).slow<=.75);}
  if(id==='rod')assert(strong.pull<=9);
 }
});

test('ranked and week-0 offers never contain them, whatever the seed',()=>{
 for(const opts of[{pace:2,ranked:true},{pace:1,ranked:true},{pace:1}])for(let seed=1;seed<=120;seed++){
  const s=S.createSim({seed,...opts}),p=s.players[0];s.level=12;
  assert(!S.rollChoices(s,p).some(c=>NEW.includes(c.id)));
 }
 // a ranked player holding every original weapon is at the end of the pool: no new weapon and no slot card
 const s=S.createSim({seed:3,ranked:true}),p=s.players[0];s.level=30;p.weapons=Object.fromEntries(OLD.map(id=>[id,6]));p.evo=Object.fromEntries(OLD.map(id=>[id,true]));
 for(let seed=1;seed<=40;seed++){s.rng=S.mulberry32(seed);assert(!S.rollChoices(s,p).some(c=>c.kind==='weapon'||c.kind==='slot'));}
});
const require=createRequire(import.meta.url),LIVE='../tools/vercel-api/sims/f2a94a4f17ba/ranked-bundle.cjs';
for(const[seed,adv,mapId]of[[3115,'wizard','apache'],[2115,'rogue','apache']])test(`a ranked week-1 run played now replays identically on the live archived simulation: ${adv} ${seed}`,()=>{
 const live=require(LIVE),params={seed,week:1,mapId,adv,ground:null},sim=rankedSim(params),rec=new RunRecorder(),p=sim.players[0];let cards=0;
 while(!sim.over&&sim.tick<5400){
  const pend=sim.pending.p1;
  if(pend){cards++;for(const c of pend.choices)assert(!NEW.includes(c.id));assert(rankedChoice(sim,rec,pend.casket?pend.rec:pickCard(pend.choices,p)));}
  else{const input=botInput(sim,p,sim.map,false);rankedStep(sim,rec,input.mx,input.mz,p.rollCd===0&&sim.tick%240===0?4:null);}
  sim.fx.length=0;
 }
 assert(cards>=8,'the run must meet real level-up cards: '+cards);
 const log=JSON.parse(JSON.stringify(rec.log())),now=replay(log,params,{allowPartial:true}),then=live.replay(log,params,{allowPartial:true});
 assert(!now.error,now.error);assert(!then.error,then.error);assert.deepEqual(now,then);assert.equal(now.kills,sim.kills);
});

test('casual offers include them and respect slots, the level cap, banishing and the extra-slot card',()=>{
 const seen=new Set();
 for(let seed=1;seed<=200;seed++){const s=S.createSim({seed}),p=s.players[0];for(const c of S.rollChoices(s,p))if(c.kind==='weapon'){seen.add(c.id);if(NEW.includes(c.id)){assert.equal(c.level,1);assert.equal(c.from,0);assert(C.CARD_RARITIES.includes(c.rarity));}}}
 for(const id of NEW)assert(seen.has(id),id+' is offered in casual');
 for(const id of NEW){
  const s=S.createSim({seed:9}),p=s.players[0];
  p.weapons={katana:6,bow:6,axe:6,shield:6};p.evo={katana:true,bow:true,axe:true,shield:true};p.passives={};
  for(let seed=1;seed<=40;seed++){s.rng=S.mulberry32(seed);assert(!S.rollChoices(s,p).some(c=>c.kind==='weapon'),'full slots admit no new weapon');}
  p.weapons={[id]:6};p.evo={};for(let seed=1;seed<=40;seed++){s.rng=S.mulberry32(seed);assert(!S.rollChoices(s,p).some(c=>c.kind==='weapon'&&c.id===id),'level cap');}
  S.applyChoice(s,p,{kind:'weapon',id,level:7,rarity:'epic'});assert.equal(p.weapons[id],6);
  p.weapons={katana:1};s.pending[p.id]={left:20,choices:[{kind:'weapon',id,level:1},{kind:'heal',id:'fish',level:1}]};assert(S.banish(s,p.id,0));
  for(let seed=1;seed<=60;seed++){s.rng=S.mulberry32(seed);assert(!S.rollChoices(s,p).some(c=>c.kind==='weapon'&&c.id===id),'banished');}
  const before=JSON.stringify(p),after=S.previewChoice(s,p,{kind:'weapon',id,level:1,rarity:'rare'});assert.equal(JSON.stringify(p),before);assert.equal(after.weapons[id],1);
 }
 // every original weapon held: only the casual three keep the extra weapon slot worth offering
 const s=S.createSim({seed:5}),p=s.players[0];s.level=10;p.weapons=Object.fromEntries(OLD.slice(0,4).map(id=>[id,1]));p.passives={};p.banished=OLD.slice(4).map(id=>'weapon:'+id);
 let slot=false;for(let seed=1;seed<=400&&!slot;seed++){s.rng=S.mulberry32(seed);slot=S.rollChoices(s,p).some(c=>c.kind==='slot'&&c.id==='weapon');}assert(slot);
 p.banished.push(...NEW.map(id=>'weapon:'+id));for(let seed=1;seed<=400;seed++){s.rng=S.mulberry32(seed);assert(!S.rollChoices(s,p).some(c=>c.kind==='slot'&&c.id==='weapon'));}
});
for(const[weapon,original,alternative]of[['dagger','boots','evasion'],['net','area','water'],['rod','magnet','greed']])test(`${weapon} evolves at level 6 with ${original} or ${alternative}, once`,()=>{
 const offers=(passives,level=6,evolved=false)=>{const s=S.createSim({seed:71}),p=s.players[0];p.weapons={[weapon]:level};p.passives=passives;p.evo=evolved?{[weapon]:true}:{};return S.rollChoices(s,p).filter(c=>c.kind==='evolve').map(c=>c.id);};
 assert.deepEqual(C.evolutionPassives(weapon,2),[original,alternative]);
 assert.deepEqual(offers({[original]:1}),[weapon]);assert.deepEqual(offers({[alternative]:1}),[weapon]);
 assert.deepEqual(offers({}),[]);assert.deepEqual(offers({[original]:1},5),[]);assert.deepEqual(offers({[original]:1},6,true),[]);
 const s=S.createSim({seed:71}),p=s.players[0];p.weapons={[weapon]:6};p.passives={[original]:1};S.applyChoice(s,p,{kind:'evolve',id:weapon,level:1});assert.equal(p.evo[weapon],true);assert.equal(s.evolves,1);
});

test('Dagger stabs only the narrow front, quickly, and credits its own damage',()=>{
 const s=scene(),p=s.players[0];p.weapons={dagger:1};
 const front=foe(s,'goblin',p.x,p.z+1.4),behind=foe(s,'goblin',p.x,p.z-2.6),side=foe(s,'goblin',p.x+2.6,p.z+.2),far=foe(s,'goblin',p.x,p.z+4.5);
 const fx=run(s,60),stabs=fx.filter(f=>f.k==='slash');
 assert(stabs.length>=5&&stabs.length<=6,'about one stab every 0.4 s: '+stabs.length);
 for(const f of stabs){assert.equal(f.stab,1);close(f.a,0);assert.equal(f.arc,50);}
 close(1e6-front.hp,5*stabs.length);assert.equal(behind.hp,1e6);assert.equal(side.hp,1e6);assert.equal(far.hp,1e6);
 assert.equal(s.dmgBy.dagger,5*stabs.length);assert.equal(p.face,0);
});
test('Dagger hits harder only for its bounded window after a real Tumble',()=>{
 const s=scene(),p=s.players[0];p.weapons={dagger:1};p.face=p.moveFace=0;
 const e=foe(s,'goblin',p.x,p.z+C.TUMBLE.speed*C.TUMBLE.duration+1.4);
 assert.equal(run(s,30).filter(f=>f.k==='slash').length,0,'out of reach before the Tumble');
 S.step(s,{p1:{mx:0,mz:0,use:4}});s.fx.length=0;assert.equal(p.rollCd,C.TUMBLE.cooldown);
 const hits=[];let hp=e.hp;
 for(let tick=1;tick<150;tick++){const fx=run(s,1);for(const f of fx)if(f.k==='slash'){hits.push({t:tick/30,stab:f.stab,dmg:hp-e.hp});hp=e.hp;}}
 const window=C.TUMBLE.duration+1.5,boosted=hits.filter(h=>h.stab===2),plain=hits.filter(h=>h.stab===1);
 assert(boosted.length>=3&&plain.length>=3,JSON.stringify(hits));
 for(const h of boosted){assert.equal(h.dmg,8);assert(h.t<=window+1/30);}
 for(const h of plain){assert.equal(h.dmg,5);assert(h.t>window-2/30);}
 // the boost reads the Tumble's own cooldown: nothing new is stored on the player
 for(const key of Object.keys(p))assert(!/boost|dagger/i.test(key),key);
 const longer=scene(),q=longer.players[0];q.weapons={dagger:4};assert.equal(C.weaponStats(q,'dagger').boostT,2);
});
test('Twin Daggers also stabs behind and doubles the boost window',()=>{
 const s=scene(),p=s.players[0];p.weapons={dagger:6};p.evo={dagger:true};
 const front=foe(s,'goblin',p.x,p.z+1.4),behind=foe(s,'goblin',p.x,p.z-1.7);
 const fx=run(s,20).filter(f=>f.k==='slash');assert(fx.length>=2&&fx.length%2===0);
 assert(front.hp<1e6);assert(behind.hp<1e6);close(1e6-front.hp,1e6-behind.hp);
 assert.equal(C.evolveStats('dagger',C.weaponStats(p,'dagger')).boostT,4);
});

test('Fishing Net damages and slows the nearest group for a bounded time without touching base speed',()=>{
 const s=scene(),p=s.players[0];p.weapons={net:1};
 const mid=foe(s,'goblin',p.x,p.z+6,{speed:2}),near=foe(s,'goblin',p.x+1.6,p.z+6.4,{speed:2}),out=foe(s,'goblin',p.x+8,p.z+6,{speed:2});
 let cast=null;for(let i=0;i<12&&!cast;i++)cast=run(s,1).find(f=>f.k==='net');
 assert(cast);close(cast.r,2.2);close(cast.t,2);assert.equal(cast.evo,0);
 p.weapons={};
 for(const e of[mid,near]){assert.equal(1e6-e.hp,6);close(e.slow,.35);assert(e.slowT>1.9&&e.slowT<=2);assert.equal(e.speed,2);}
 assert.equal(out.hp,1e6);assert(!(out.slowT>0));assert.equal(s.dmgBy.net,12);
 const step=e=>{const before=dist(e,p);run(s,1);return before-dist(e,p);};
 const slowed=step(mid),free=step(out);close(slowed/free,.65,.02);
 run(s,62);assert.equal(mid.slowT,0);assert.equal(mid.slow,0);assert.equal(mid.speed,2);
 close(step(mid)/step(out),1,.02);
});
test('a second net refreshes the slow instead of stacking it, and a boss is hurt but never slowed',()=>{
 const s=scene(),p=s.players[0];p.weapons={net:6};p.evo={net:true};
 const e=foe(s,'goblin',p.x,p.z+5),boss=foe(s,'giant',p.x+1,p.z+6);boss.atkCd=1e9;
 const stats=C.evolveStats('net',C.weaponStats(p,'net'));
 for(let cast=0;cast<4;cast++){p.cd.net=0;run(s,1);assert(e.slow<=stats.slow+1e-9);assert(e.slowT<=stats.slowT+1e-9);}
 close(e.slow,Math.min(.75,stats.slow));assert(boss.hp<1e6);assert(!(boss.slowT>0));assert(!(boss.slow>0));
 // a weaker net never shortens or weakens a stronger slow already in place
 p.weapons={net:1};p.evo={};const strong=e.slow,left=e.slowT;p.cd.net=0;run(s,1);close(e.slow,strong);assert(e.slowT>=left-1/30-1e-9);
});
test('a slowed monster still serialises as plain numbers and continues identically after a copy',()=>{
 const s=scene(),p=s.players[0];p.weapons={net:2};foe(s,'goblin',p.x,p.z+5,{speed:2});run(s,10);
 const copy=JSON.parse(JSON.stringify({...s,rng:undefined,flow:null}));copy.rng=()=>.99;copy.ground=null;s.fx.length=0;copy.fx.length=0;
 assert(copy.enemies[0].slowT>0);
 for(let i=0;i<90;i++){S.step(s,{p1:{mx:0,mz:0}});S.step(copy,{p1:{mx:0,mz:0}});}
 assert.deepEqual(JSON.parse(JSON.stringify(copy.enemies)),JSON.parse(JSON.stringify(s.enemies)));
});

test('Fishing Rod reels one distant monster in by its pull distance and never onto the player',()=>{
 const s=scene(),p=s.players[0];p.weapons={rod:1};
 const e=foe(s,'goblin',p.x,p.z+8);
 let hook=null;for(let i=0;i<12&&!hook;i++)hook=run(s,1).find(f=>f.k==='hook');
 assert(hook);assert.equal(hook.pull,1);close(hook.tx,e.x);close(hook.tz,p.z+8);assert.equal(1e6-e.hp,14);assert.equal(s.dmgBy.rod,14);
 p.weapons={};run(s,60);close(dist(e,p),4,.1);assert(Math.hypot(e.kx,e.kz)<.01);
 const t=scene(),q=t.players[0];q.weapons={rod:6};const closeBy=foe(t,'goblin',q.x,q.z+1.7);
 run(t,40);assert(dist(closeBy,q)>=(C.ENEMIES.goblin.r+C.PLAYER_BASE.radius)*.95-1e-6,'never pulled inside contact distance');
});
test('Fishing Rod prefers a treasure goblin, then an elite, then the farthest monster',()=>{
 const pick=make=>{const s=scene(),p=s.players[0];p.weapons={rod:1};const want=make(s,p),z=want.z;let hook=null;for(let i=0;i<12&&!hook;i++)hook=run(s,1).find(f=>f.k==='hook');assert(hook);close(hook.tz,z);};
 pick((s,p)=>{foe(s,'goblin',p.x,p.z+3);return foe(s,'goblin',p.x,p.z-7);});
 pick((s,p)=>{foe(s,'goblin',p.x,p.z+8);return foe(s,'goblin',p.x,p.z-3,{elite:true});});
 pick((s,p)=>{foe(s,'goblin',p.x,p.z+8,{elite:true});return foe(s,'goblin',p.x,p.z-3,{treasure:true});});
 pick((s,p)=>{foe(s,'giant',p.x,p.z+8);return foe(s,'goblin',p.x,p.z-3);});
});
test('a boss is hooked for damage but holds its ground; a monster behind a wall is not dragged through it',()=>{
 const s=scene(),p=s.players[0];p.weapons={rod:6};const boss=foe(s,'giant',p.x,p.z+8);
 let hook=null;for(let i=0;i<12&&!hook;i++)hook=run(s,1).find(f=>f.k==='hook');
 assert.equal(hook.pull,0);assert(boss.hp<1e6);assert.equal(boss.kx,0);assert.equal(boss.kz,0);close(dist(boss,p),8,1e-6);
 for(const layer of['walls','fences']){
  const{s:w,p:q,g}=walled();for(let z=3;z<25;z++)g[layer][z*g.n+14]=8;q.weapons={rod:6};const e=foe(w,'goblin',18.5,10.5);
  let snag=null;for(let i=0;i<12&&!snag;i++)snag=run(w,1).find(f=>f.k==='hook');
  assert(snag,layer);assert.equal(snag.pull,0);assert(e.hp<1e6);run(w,40);assert.equal(e.x,18.5);assert.equal(e.z,10.5);
  // even a forced impulse goes through the walking mover and stops at the wall
  e.kx=-200;e.kz=0;run(w,40);assert(e.x>14&&e.x<15,`${layer}: stopped at ${e.x}`);
 }
 const{s:open,p:o}=walled();o.weapons={rod:6};const e=foe(open,'goblin',18.5,10.5);run(open,50);assert(e.x<16,'an open line reels in: '+e.x);
});
test('Longline hooks three, and stacked hooks on one monster stay bounded',()=>{
 const s=scene(),p=s.players[0];p.weapons={rod:6};p.evo={rod:true};
 for(const z of[4,6,8,9])foe(s,'goblin',p.x,p.z+z);
 let hooks=[];for(let i=0;i<12&&!hooks.length;i++)hooks=run(s,1).filter(f=>f.k==='hook');
 assert.equal(hooks.length,3);assert.deepEqual(hooks.map(h=>Math.round(h.tz-p.z)).sort(),[6,8,9]);for(const h of hooks)assert.equal(h.evo,1);
 const duo=scene({coop:true,players:[{id:'p1'},{id:'p2'}]}),[a,b]=duo.players;b.x=a.x+.5;b.z=a.z;for(const q of duo.players)q.weapons={rod:6};
 const e=foe(duo,'goblin',a.x,a.z+11);let peak=0;const start=dist(e,a);
 for(let i=0;i<30;i++){for(const q of duo.players)q.cd.rod=0;S.step(duo,{});duo.fx.length=0;peak=Math.max(peak,Math.hypot(e.kx,e.kz));}
 assert(peak<=9*(1-.86)/S.TICK+1e-6,'impulse cap: '+peak);assert(dist(e,a)<start);
});

test('runs without the Fishing Net never put slow fields on monsters',()=>{
 for(const opts of[{ranked:true},{pace:1}]){
  const s=scene(opts),p=s.players[0];p.weapons={katana:1};const e=foe(s,'goblin',p.x,p.z+6,{speed:2});
  run(s,30);assert(!Object.hasOwn(e,'slowT'));assert(!Object.hasOwn(e,'slow'));
 }
});
test('inspection, upgrade values and the finished build show real names, icons and the new stats',()=>{
 const s=scene(),p=s.players[0];p.weapons={dagger:2,net:3,rod:4};
 const dagger=itemInspection(p,'weapon','dagger'),net=itemInspection(p,'weapon','net'),rod=itemInspection(p,'weapon','rod');
 assert.equal(dagger.title,'Dagger');assert(dagger.details.includes('Tumble boost: ×1.68'));assert(dagger.details.includes('Tumble boost time: 1.5 s'));assert(dagger.details.includes('Evolves with Winged Boots or Beret.'));
 assert.equal(net.title,'Fishing Net');assert(net.details.includes('Slow: 41%'));assert(net.details.includes('Slow time: 2.4 s'));assert(net.details.includes('Radius: 2.6'));assert(net.details.includes('Evolves with Cape or Water Shard.'));
 assert.equal(rod.title,'Fishing Rod');assert(rod.details.includes('Pull distance: 5.2'));assert(rod.details.includes('Hooks: 1'));assert(rod.details.includes('Evolves with Warp Shard or Rusty Key.'));
 p.evo={rod:true};assert.equal(itemInspection(p,'weapon','rod').title,'Longline');assert(itemInspection(p,'weapon','rod').details.includes('Hooks: 3'));
 const build=captureRunBuild(s,p),rows=build.sections.find(x=>x.title==='Weapons').rows;
 assert.deepEqual(rows.map(r=>r.name),['Dagger','Fishing Net','Longline']);
 assert.deepEqual(rows.map(r=>r.icon),['ui/items/item_Dagger.png','ui/items/item_Fishing_Net.png','ui/items/item_Fishing_Rod.png']);
 const view=S.snapshot(s).players[0];assert.deepEqual(view.w,{dagger:2,net:3,rod:4});
 for(const pace of[1,2])assert.equal(itemInspection({weapons:{katana:1},passives:{}},'weapon','dagger',pace),null);
 // passive text names a casual-only weapon only in casual runs
 const q={weapons:{},passives:{boots:1,area:1,magnet:1,greed:1}};
 assert(itemInspection(q,'passive','boots',2).details.includes('Evolves Bow, Short Swords, Dagger.'));
 assert(itemInspection(q,'passive','boots',2,true).details.includes('Evolves Bow, Short Swords.'));
 assert(itemInspection(q,'passive','boots',1).details.includes('Evolves Bow.'));
 for(const id of['area','magnet','greed'])for(const[pace,ranked]of[[1,false],[2,true]])assert(!itemInspection(q,'passive',id,pace,ranked).details.join(' ').match(/Dagger|Fishing/),id);
 assert.deepEqual(C.evolvedBy('area',2),['staff','pickaxe','net']);assert.deepEqual(C.evolvedBy('magnet',1),['shortsword']);
});
