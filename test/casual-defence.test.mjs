import test from 'node:test';import assert from 'node:assert/strict';
import * as C from '../src/content.js';import * as S from '../src/sim.js';
import {itemInspection} from '../src/item-inspection.js';import {captureRunBuild} from '../src/run-build.js';import {pauseBuild} from '../src/pause-build.js';
const close=(a,b)=>assert(Math.abs(a-b)<1e-9,`${a} != ${b}`);
function scene(opts={}){const s=S.createSim({seed:49,...opts});s.spawnAcc=-1e9;s.bossIndex=99;s.eventT=s.shrineT=s.merchantT=1e9;for(const p of s.players){p.weapons={};p.hp=40;p.inv=0;}return s;}
function hit(s,dmg=25,route='slam'){const p=s.players[0];if(route==='volley')s.eproj.push({id:s.nextId++,x:p.x,z:p.z,vx:0,vz:0,life:1,r:.2,dmg,art:'air'});else s.hazards.push({x:p.x,z:p.z,r:5,t:0,max:.1,dmg,meteor:route==='meteor'});S.step(s);return p;}
test('Cheese and Beret are distinct native casual-only passives, excluded from all ranked pools',()=>{
 for(const[id,item]of[['cheese','Cheese'],['evasion','Beret']]){assert.equal(C.PASSIVES[id]?.item,item);assert.equal(C.PASSIVES[id]?.casual,true);assert(C.passiveIdsAt(2,false).includes(id));for(const pace of[1,2])assert(!C.passiveIdsAt(pace,true).includes(id));assert(!C.passiveIdsAt(1,false).includes(id));}
});
test('defence stats use effective rank with bounded duration and evasion; old pace is unchanged',()=>{
 const s=scene(),p=s.players[0];p.passives={cheese:1,evasion:1};close(S.playerStats(p).cheeseShield,2);close(S.playerStats(p).evasion,.02);
 p.passives={cheese:5,evasion:5};p.quality.passives={cheese:100,evasion:100};close(S.playerStats(p).cheeseShield,4.5);close(S.playerStats(p).evasion,.12);
 p.quality.passives={cheese:10000,evasion:10000};assert.equal(S.playerStats(p).cheeseShield,5);assert.equal(S.playerStats(p).evasion,.2);
 const old=scene({pace:1}),q=old.players[0],before=S.playerStats(q);q.passives={cheese:5,evasion:5};assert.deepEqual(S.playerStats(q),before);
});
test('Cheese charges on simulation time, expires and freezes during an upgrade pause',()=>{
 const s=scene(),p=s.players[0];p.passives.cheese=1;
 for(let i=0;i<597;i++)S.step(s);assert(!(p.buffs.cheeseShield>0));
 for(let i=0;i<4;i++)S.step(s);assert(p.buffs.cheeseShield>1.9);assert(p.cheeseCd>19.9);
 const before=JSON.stringify([p.buffs,p.cheeseCd]);s.pending[p.id]={left:100,choices:[{kind:'heal',id:'heal',level:1}]};S.step(s);assert.equal(JSON.stringify([p.buffs,p.cheeseCd]),before);delete s.pending[p.id];
 for(let i=0;i<62;i++)S.step(s);assert.equal(p.buffs.cheeseShield,0);
});
test('one shield blocks before evasion, gives ordinary hit grace and does not spend food or revives',()=>{
 const s=scene(),p=s.players[0];p.passives={cheese:1,evasion:5};p.buffs.cheeseShield=2;p.revives=1;p.belt=['cheese'];p.foodStacks.cheese=2;let rolls=0;s.rng=()=>{rolls++;return 0;};
 hit(s,90);assert.equal(p.hp,40);assert.equal(p.buffs.cheeseShield,0);assert.equal(p.inv,.75);assert.equal(p.revives,1);assert.equal(p.foodStacks.cheese,2);assert.equal(rolls,0);assert(!s.hurtBy.slam);assert(s.fx.some(f=>f.k==='blocked'));
 p.inv=0;p.passives.evasion=0;hit(s,25);assert.equal(p.hp,15);assert.equal(s.hurtBy.slam,25);
});
test('evasion samples once per incoming hit and records only actual damage',()=>{
 const s=scene(),p=s.players[0];p.passives.evasion=1;let rolls=0;s.rng=()=>{rolls++;return .019;};hit(s);assert.equal(p.hp,40);assert.equal(rolls,1);assert.equal(p.inv,.75);assert(!s.hurtBy.slam);assert(s.fx.some(f=>f.k==='evaded'));
 p.inv=0;s.rng=()=>{rolls++;return .99;};hit(s);assert.equal(p.hp,15);assert.equal(rolls,2);assert.equal(s.hurtBy.slam,25);
});
test('an evaded contact does not retaliate with Scorpion Carapace damage',()=>{
 const s=scene(),p=s.players[0];p.passives={evasion:5,thorns:1};s.rng=()=>0;S.spawnEnemy(s,'chicken',p.x+.2,p.z);const e=s.enemies[0];e.hp=1000;e.atkCd=1e9;
 S.step(s);assert(s.fx.some(f=>f.k==='evaded'));assert.equal(p.hp,40);assert.equal(e.hp,1000);assert(!s.dmgBy.thorns);
});
for(const route of ['slam','meteor','volley'])for(const defence of ['cheese','evasion'])test(defence+' handles '+route+' through the same damage boundary',()=>{
 const s=scene(),p=s.players[0];p.passives[defence]=1;if(defence==='cheese')p.buffs.cheeseShield=2;s.rng=()=>0;
 hit(s,90,route);assert.equal(p.hp,40);assert.equal(p.alive,true);assert.equal(p.inv,.75);assert(!s.hurtBy[route]);assert(s.fx.some(f=>f.k===(defence==='cheese'?'blocked':'evaded')));
});
test('ranked and original pace ignore forced defensive passives without drawing evade RNG',()=>{
 for(const opts of[{ranked:true},{pace:1}]){const s=scene(opts),p=s.players[0];p.passives={cheese:5,evasion:5};p.buffs.cheeseShield=2;let rolls=0;s.rng=()=>{rolls++;return 0;};hit(s);assert.equal(p.hp,15);assert.equal(rolls,0);assert(!s.fx.some(f=>f.k==='blocked'||f.k==='evaded'));assert(!Object.hasOwn(p,'cheeseCd'));}
});
test('co-op shield protects only its owner and snapshot/pause/build/inspection agree',()=>{
 const s=scene({coop:true,players:[{id:'p1'},{id:'p2'}]}),p=s.players[0];p.passives={cheese:1,evasion:5};p.buffs.cheeseShield=2;s.players[1].x=p.x+1;s.players[1].z=p.z;
 assert.equal(S.snapshot(s).players[0].guard,2);assert(!Object.hasOwn(S.snapshot(s).players[1],'guard'));
 assert(itemInspection(p,'passive','evasion').details.includes('Current evasion chance: 10%'));
 assert(itemInspection(p,'passive','cheese').details.includes('Shield duration: 2 s'));
 const build=captureRunBuild(s,p);assert(build.stats.some(x=>x.id==='evasion'&&x.value===10));assert(build.sections.find(x=>x.title==='Active effects').rows.some(x=>x.icon==='ui/items/item_Cheese.png'));
 assert(pauseBuild(s,p).effects.some(x=>x.id==='cheeseShield'&&x.seconds===2));hit(s);assert.equal(p.hp,40);assert.equal(s.players[1].hp,15);
});
test('defensive offers obey existing max-level, preview purity and banish behavior',()=>{
 for(const id of['cheese','evasion']){const s=scene(),p=s.players[0];p.passives[id]=4;const before=JSON.stringify(p),after=S.previewChoice(s,p,{kind:'passive',id,level:5,rarity:'epic'});assert.equal(JSON.stringify(p),before);assert.equal(after.passives[id],5);
 S.applyChoice(s,p,{kind:'passive',id,level:5,rarity:'epic'});const max=JSON.stringify(p);S.applyChoice(s,p,{kind:'passive',id,level:6,rarity:'epic'});assert.equal(JSON.stringify(p),max);
 p.passives={};s.pending[p.id]={left:20,choices:[{kind:'passive',id,level:1},{kind:'heal',id:'heal',level:1}]};assert(S.banish(s,p.id,0));for(let seed=1;seed<32;seed++){s.rng=S.mulberry32(seed);assert(!S.rollChoices(s,p).some(c=>c.kind==='passive'&&c.id===id));}}
});
