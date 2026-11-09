import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../src/sim.js';
function scene(opts={}){
 const s=S.createSim({seed:8,...opts});s.spawnAcc=-1e9;s.bossIndex=99;s.eventT=s.shrineT=s.merchantT=1e9;
 for(const p of s.players){p.weapons={};p.hp=20;}return s;
}
function pickup(s,kind,p=s.players[0]){s.pickups.push({id:s.nextId++,x:p.x,z:p.z,kind});S.step(s);}
for(const kind of Object.keys(S.FOOD))test(`${kind} stores, stacks and consumes one with healing bonuses`,()=>{
 const s=scene({meta:{fishing:2}}),p=s.players[0],hp=p.hp;
 pickup(s,kind);pickup(s,kind);assert.equal(p.hp,hp);assert(!s.fx.some(f=>f.k==='use'&&f.kind===kind));assert.deepEqual(p.belt,[kind]);assert.equal(p.foodStacks[kind],2);assert.equal(S.beltCount(p,0),2);
 assert.equal(S.useBelt(s,p.id,0),true);assert.equal(p.hp,Math.min(p.maxHp,hp+S.FOOD[kind].heal*S.playerStats(p).heal));assert.deepEqual(p.belt,[kind]);assert.equal(p.foodStacks[kind],1);
 p.hp=p.maxHp;assert.equal(S.useBelt(s,p.id,0),true);assert.equal(p.hp,p.maxHp);assert.deepEqual(p.belt,[]);assert.equal(Object.hasOwn(p.foodStacks,kind),false);assert.equal(S.beltCount(p,0),0);
});
test('matching food stacks on a full belt; different food is still eaten',()=>{
 const s=scene(),p=s.players[0];for(const k of['beer','cheese','warp','pumpkin'])pickup(s,k);
 const hp=p.hp;pickup(s,'cheese');assert.deepEqual(p.belt,['beer','cheese','warp','pumpkin']);assert.equal(S.beltCount(p,1),2);assert.equal(p.hp,hp);
 pickup(s,'trout');assert.equal(p.hp,hp+25);assert.deepEqual(p.belt,['beer','cheese','warp','pumpkin']);assert.equal(s.fx.findLast(f=>f.k==='get'&&f.kind==='trout').heal,25);
});
test('utility consumption shifts slots without losing the held food count',()=>{
 const s=scene(),p=s.players[0];for(const k of['beer','cheese','cheese','warp'])pickup(s,k);
 assert(S.useBelt(s,p.id,0));assert.deepEqual(p.belt,['cheese','warp']);assert.deepEqual(S.snapshot(s).players[0].beltCounts,[2,1]);
 assert(S.useBelt(s,p.id,0));assert.deepEqual(S.snapshot(s).players[0].beltCounts,[1,1]);assert(S.useBelt(s,p.id,1));assert.deepEqual(p.belt,['cheese']);
});
test('food stacks start only on pace2 and snapshots retain their existing belt strings',()=>{
 const s=scene(),p=s.players[0];assert.deepEqual(p.foodStacks,{});pickup(s,'catfish');
 const snap=S.snapshot(s).players[0];assert.deepEqual(snap.belt,['catfish']);assert.deepEqual(snap.beltCounts,[1]);
 const old=scene({pace:1}),q=old.players[0];pickup(old,'crawdad');assert.equal(q.hp,35);assert.deepEqual(q.belt,[]);assert(!Object.hasOwn(q,'foodStacks'));assert(!Object.hasOwn(S.snapshot(old).players[0],'beltCounts'));
});
test('legacy prepared food counts default to one; invalid counts cannot poison consumption or stacking',()=>{
 for(const value of[undefined,0,-1,NaN,Infinity,1.5,Number.MAX_SAFE_INTEGER+1]){
  const s=scene(),p=s.players[0];p.belt=['cheese'];p.foodStacks={cheese:value};assert.equal(S.beltCount(p,0),1);
  pickup(s,'cheese');assert.equal(p.foodStacks.cheese,2);assert(S.useBelt(s,p.id,0));assert.equal(p.foodStacks.cheese,1);assert(S.useBelt(s,p.id,0));assert.deepEqual(p.belt,[]);
 }
 const s=scene(),p=s.players[0];delete p.foodStacks;p.belt=['cheese'];assert.equal(S.beltCount(p,0),1);assert(S.useBelt(s,p.id,0));assert.deepEqual(p.belt,[]);
});
test('the safe-integer limit preserves the stack and auto-eats only the incoming food',()=>{
 const s=scene(),p=s.players[0];p.belt=['cheese'];p.foodStacks.cheese=Number.MAX_SAFE_INTEGER;pickup(s,'cheese');
 assert.equal(p.foodStacks.cheese,Number.MAX_SAFE_INTEGER);assert.equal(p.hp,35);assert(S.useBelt(s,p.id,0));assert.equal(p.foodStacks.cheese,Number.MAX_SAFE_INTEGER-1);
});
test('missing and invalid slots cannot consume a food stack',()=>{
 const s=scene(),p=s.players[0];pickup(s,'cheese');
 for(const slot of[-1,4,NaN,1.5,undefined]){assert.equal(S.beltCount(p,slot),0);assert.equal(S.useBelt(s,p.id,slot),false);}
 assert.equal(S.beltCount(p,0),1);assert.equal(S.useBelt(s,'missing',0),false);p.alive=false;assert.equal(S.useBelt(s,p.id,0),false);
 p.alive=true;p.belt=new Array(1);assert.equal(S.beltCount(p,0),0);assert.equal(S.useBelt(s,p.id,0),false);
});
test('co-op pickup and use change only their owner food stack',()=>{
 const s=scene({coop:true,players:[{id:'p1'},{id:'p2'}]}),[a,b]=s.players;b.x+=20;
 pickup(s,'bass',b);pickup(s,'bass',b);assert.deepEqual(a.belt,[]);assert.deepEqual(a.foodStacks,{});assert.deepEqual(b.belt,['bass']);assert.equal(b.foodStacks.bass,2);
 S.step(s,{p2:{use:0}});assert.equal(b.foodStacks.bass,1);assert.equal(b.hp,70);assert.equal(a.hp,20);assert.equal(s.fx.findLast(f=>f.k==='use').player,'p2');
});
function drops(pace,r,t=0){
 const s=scene({pace}),p=s.players[0];s.t=t;S.spawnEnemy(s,'chicken',p.x+8,p.z);const e=s.enemies[0];e.elite=false;
 let calls=0;const draws=[1,r,1,1];s.rng=()=>{assert(calls<4);return draws[calls++];};S.damageEnemy(s,e,1e9,p.id);assert.equal(calls,4);return s.pickups.map(k=>k.kind);
}
test('pace2 halves ordinary food frequency while utility bands, pace1 and RNG counts stay exact',()=>{
 let p1=0,p2=0;for(let i=0;i<1000;i++){const r=(i+.5)/1000,a=drops(1,r),b=drops(2,r);if(a.some(k=>S.FOOD[k]))p1++;if(b.some(k=>S.FOOD[k]))p2++;if(r<.022||r>=.034)assert.deepEqual(b,a);}
 assert.equal(p1,12);assert.equal(p2,6);assert.deepEqual(drops(2,.028),[]);assert.deepEqual(drops(1,.028),[S.foodDrop(0,(.028-.022)/.012,false,1)]);
 assert.deepEqual(drops(2,.025,200),['trout'],'food tier uses the narrowed band normalized to [0,1)');
});
test('boss bass quantity and RNG draw count stay unchanged on both paces',()=>{
 for(const pace of[1,2]){const s=scene({pace}),p=s.players[0];S.spawnEnemy(s,'giant',p.x+8,p.z);let calls=0;s.rng=()=>{calls++;return .5;};S.damageEnemy(s,s.enemies[0],1e9,p.id);assert.equal(calls,9);assert.equal(s.pickups.filter(k=>k.kind==='bass').length,1);}
});
