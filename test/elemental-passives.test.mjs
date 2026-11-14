import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../src/content.js';
import * as S from '../src/sim.js';
const close=(a,b)=>assert(Math.abs(a-b)<1e-9,`${a} != ${b}`),ids=['air','water','earth','fire','void'];
function fresh(options={}){const sim=S.createSim({seed:1106,pace:2,...options});sim.spawnAcc=-1e9;sim.bossIndex=99;sim.eventT=sim.shrineT=1e9;return{sim,p:sim.players[0]};}
test('five original shards are selectable pace2 passives without changing existing Spirit/Warp or pace1 offers',()=>{
 for(const id of ids){assert.equal(C.PASSIVES[id]?.item,id[0].toUpperCase()+id.slice(1)+' Shard');assert.equal(C.PASSIVES[id].pace,2);for(const ranked of [true,false])assert(C.passiveIdsAt(2,ranked).includes(id));assert(!C.passiveIdsAt(1).includes(id));}
 assert.equal(C.PASSIVES.haste.item,'Spirit Shard');assert.equal(C.PASSIVES.magnet.item,'Warp Shard');assert.equal(C.gemItem(),'Air Shard');assert.equal(C.PASSIVE_IDS.length,18);
});
for(const [id,key,base,gain]of [['air','projectileSpeed',1,.05],['water','heal',1,.1],['earth','knockback',1,.1],['fire','magic',1,.06],['void','critM',1.8,.2]])for(const rank of [1,5])test(`${id} rank${rank} affects only its documented stat`,()=>{
 const{p}=fresh();const before=S.playerStats(p);p.passives={[id]:rank};const after=S.playerStats(p);close(after[key],base+gain*rank);
 for(const k of Object.keys(before))if(k!==key)assert.equal(after[k],before[k],k);
 p.quality.passives[id]=rank*50;close(S.playerStats(p)[key],base+gain*rank*1.5);
});
test('pace1 ignores forced new shard ownership and retains its original stats',()=>{const{p}=fresh({pace:1});const before=S.playerStats(p);p.passives=Object.fromEntries(ids.map(id=>[id,5]));assert.deepEqual(S.playerStats(p),before);});
test('Air affects actual fired arrows while Water affects actual belt food and restoration choices',()=>{
 const shot=air=>{const{sim,p}=fresh({startWeapon:'bow'});p.passives=air?{air:5}:{};p.cd.bow=0;S.spawnEnemy(sim,'goblin',p.x+8,p.z);sim.enemies[0].hp=1000;sim.rng=()=>.99;S.step(sim,{},S.TICK);const pr=sim.proj.find(x=>x.art==='arrow');assert(pr);return Math.hypot(pr.vx,pr.vz);};close(shot(true)/shot(false),1.25);
 const{sim,p}=fresh();p.passives={water:5};p.hp=1;p.belt=['cheese'];assert(S.useBelt(sim,p.id,0));close(p.hp,23.5);assert.equal(p.belt.length,0);
 p.hp=1;p.belt=['beer'];assert(S.useBelt(sim,p.id,0));close(p.hp,31);assert.equal(p.buffs.speed,8);
 p.hp=1;S.applyChoice(sim,p,{kind:'heal',id:'heal',level:1,rarity:'common'});close(p.hp,61);
});
test('Fire scales actual spell damage and Void reaches the cached critical damage path',()=>{
 const{sim,p}=fresh({startWeapon:'staff'});p.passives={fire:5,void:5};p.cd.staff=0;S.spawnEnemy(sim,'goblin',p.x+8,p.z);sim.enemies[0].hp=1000;sim.rng=()=>.99;S.step(sim,{},S.TICK);const pr=sim.proj.find(x=>x.art==='bolt');assert(pr);close(pr.dmg,C.weaponStats(p,'staff').dmg*1.3);close(sim.crit[p.id][1],2.8);
 const e=sim.enemies[0],hp=e.hp;sim.rng=()=>0;S.damageEnemy(sim,e,10,p.id);assert.equal(hp-e.hp,28);
});
test('Earth multiplies existing knockback for its owner only; bosses and zero knockback stay unchanged',()=>{
 const{sim,p}=fresh({coop:true,players:[{id:'p1'},{id:'p2'}]});p.passives={earth:5};sim.rng=()=>.99;
 const hit=(owner,type='goblin',kb=3)=>{const e={type,hp:1000,x:4,z:0,kx:0,kz:0};S.damageEnemy(sim,e,1,owner,kb,0,0);return e.kx;};close(hit('p1'),4.5);close(hit('p2'),3);assert.equal(hit('p1','giant'),0);assert.equal(hit('p1','goblin',0),0);
});
for(const id of ids)test(`${id} obeys max level, preview ownership, full slots and banishes`,()=>{
 const{sim,p}=fresh();p.passives[id]=4;p.quality.passives[id]=100;const before=JSON.stringify(p),preview=S.previewChoice(sim,p,{kind:'passive',id,level:5,rarity:'epic'});assert.equal(JSON.stringify(p),before);assert.equal(preview.passives[id],5);assert.equal(preview.quality.passives[id],150);
 S.applyChoice(sim,p,{kind:'passive',id,level:5,rarity:'epic'});const quality=p.quality.passives[id];p.hp=1;S.applyChoice(sim,p,{kind:'passive',id,level:6,rarity:'epic'});assert.equal(p.passives[id],5);assert.equal(p.quality.passives[id],quality);assert.equal(p.hp,1);
 p.passives={might:1,haste:1,vigor:1,boots:1};for(let seed=1;seed<=32;seed++){sim.rng=S.mulberry32(seed);assert(!S.rollChoices(sim,p).some(c=>c.kind==='passive'&&ids.includes(c.id)));}
 p.passives={};sim.pending[p.id]={left:20,choices:[{kind:'passive',id,level:1},{kind:'heal',id:'heal',level:1}]};assert(S.banish(sim,p.id,0));for(let seed=1;seed<=32;seed++){sim.rng=S.mulberry32(seed);assert(!S.rollChoices(sim,p).some(c=>c.kind==='passive'&&c.id===id));}
});
test('ground Air Shard experience still gives XP without granting a passive',()=>{
 const{sim,p}=fresh();sim.gems.push({id:sim.nextId++,x:p.x,z:p.z,v:1,vx:0,vz:0});S.step(sim,{},S.TICK);assert.equal(sim.xp,1);assert.deepEqual(p.passives,{});
});
test('Water belongs to its co-op owner, not their teammate',()=>{
 const{sim,p}=fresh({coop:true,players:[{id:'p1'},{id:'p2'}]});p.passives={water:5};for(const member of sim.players){member.hp=1;member.belt=['cheese'];assert(S.useBelt(sim,member.id,0));}close(p.hp,23.5);close(sim.players[1].hp,16);
});
test('Fire also scales the actual continuous Lighter hit',()=>{
 const{sim,p}=fresh({startWeapon:'lighter'});p.passives={fire:5};S.spawnEnemy(sim,'goblin',p.x+1,p.z);const e=sim.enemies[0];e.hp=1000;sim.rng=()=>.99;S.step(sim,{},S.TICK);assert.equal(1000-e.hp,Math.round(C.weaponStats(p,'lighter').dmg*1.3));
});
test('Earth-amplified fast knockback still stops at a thin wall',()=>{
 const n=64,ground={n,cell:true,blocked:new Uint8Array(n*n),walls:new Uint8Array(n*n)};for(let z=0;z<n;z++)ground.walls[z*n+20]=8;
 const{sim,p}=fresh({ground});p.x=4;p.z=16;p.weapons={};p.passives={earth:5};S.spawnEnemy(sim,'goblin',5,16);const e=sim.enemies[0];e.hp=1000;e.rise=0;sim.rng=()=>.99;S.damageEnemy(sim,e,1,p.id,600,4,16);close(e.kx,900);S.step(sim,{},S.TICK);assert(e.x<20,`Enemy crossed wall to${e.x}`);
});
