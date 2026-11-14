import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../src/content.js';
import * as S from '../src/sim.js';
import {itemInspection} from '../src/item-inspection.js';
import {captureRunBuild} from '../src/run-build.js';
const near=(a,b)=>assert(Math.abs(a-b)<1e-10,`${a} != ${b}`);
const fresh=options=>{const s=S.createSim({seed:46,pace:2,...options});return{s,p:s.players[0]};};
test('Gold is a native casual passive, excluded from both ranked offer pools',()=>{
 assert.equal(C.PASSIVES.fortune?.item,'Gold');assert.equal(C.PASSIVES.fortune?.casual,true);
 assert(C.passiveIdsAt(2,false).includes('fortune'));
 for(const pace of [1,2])assert(!C.passiveIdsAt(pace,true).includes('fortune'));
 assert(!C.passiveIdsAt(1,false).includes('fortune'));
});
test('Gold scales only damage from this player coin pickups and high alch, with quality and a hard cap',()=>{
 const{p}=fresh(),base=S.playerStats(p);p.passives.fortune=2;p.coins=25;p.alch=25;
 near(S.playerStats(p).might,base.might*1.08);
 for(const k of Object.keys(base))if(k!=='might')assert.equal(S.playerStats(p)[k],base[k],k);
 p.quality.passives.fortune=100;near(S.playerStats(p).might,base.might*1.12);
 p.coins=1000000;p.alch=1000000;p.passives.fortune=5;near(S.playerStats(p).might,base.might*1.5);
 p.coins=0;p.alch=0;near(S.playerStats(p).might,base.might);
 p.meta={coins:5};p.gb={coin:3};near(S.playerStats(p).might,base.might);
});
test('original pace ignores forced Gold and a teammate does not borrow its owner haul',()=>{
 const{p}=fresh({pace:1}),base=S.playerStats(p);p.passives.fortune=5;p.coins=10000;assert.deepEqual(S.playerStats(p),base);
 const{s}=fresh({coop:true,players:[{id:'p1'},{id:'p2'}]});for(const p of s.players)p.passives.fortune=1;s.players[0].alch=250;
 near(S.playerStats(s.players[0]).might,1.1);near(S.playerStats(s.players[1]).might,1);
});
test('Gold raises actual fired damage, and inspection and final build show the same earned bonus',()=>{
 const{s,p}=fresh({startWeapon:'bow'});p.passives.fortune=2;p.coins=25;p.alch=25;p.cd.bow=0;
 s.spawnAcc=-1e9;s.bossIndex=99;s.eventT=s.shrineT=1e9;s.rng=()=>.99;
 S.spawnEnemy(s,'goblin',p.x+8,p.z);s.enemies[0].hp=10000;S.step(s,{},S.TICK);
 near(s.proj.find(p=>p.art==='arrow').dmg,C.weaponStats(p,'bow').dmg*1.08);
 assert(itemInspection(p,'passive','fortune').details.includes('Current damage bonus: +8%'));
 const b=captureRunBuild(s,p);assert(b.sections.find(s=>s.title==='Passives').rows.find(r=>r.name==='Gold').details.includes('Current damage bonus: +8%'));
});
test('Gold preview is pure and follows existing max-level and rare upgrade rules',()=>{
 const{s,p}=fresh();p.coins=100;p.passives.fortune=4;const before=JSON.stringify(p);
 const preview=S.previewChoice(s,p,{kind:'passive',id:'fortune',level:5,rarity:'epic'});assert.equal(JSON.stringify(p),before);assert.equal(preview.passives.fortune,5);near(S.playerStats(preview).might,1.5);
 S.applyChoice(s,p,{kind:'passive',id:'fortune',level:5,rarity:'epic'});const max=JSON.stringify(p);S.applyChoice(s,p,{kind:'passive',id:'fortune',level:6,rarity:'epic'});assert.equal(JSON.stringify(p),max);
});
