import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { unpackGround } from '../src/ground-pack.js';
import * as game from '../src/sim.js';
import { GEAR, alchValue, casketWeights, MAPS } from '../src/content.js';
import { DUPLICATE_GEAR_COINS } from '../src/profile-milestones.js';
import { phaseCoins, captureRewardBaseline, continueCasual } from '../src/casual-continuation.js';
import { prepareRunRewards } from '../src/run-rewards.js';
import { saveRunProgress } from '../src/progress-import.js';
const quiet = (opts = {}) => { const s = game.createSim({seed:71,...opts}); Object.assign(s,{spawnAcc:-1e9,bossIndex:99,eventT:1e9,shrineT:1e9}); s.players.forEach(p=>p.hp=1e9); return s; };
const run = (s,seconds) => { for(let i=0;i<Math.ceil(seconds/game.TICK);i++) game.step(s); };
const shop = () => { const s=quiet(),p=s.players[0]; s.kills=6000; s.merchant={id:81,x:p.x,z:p.z,life:75,offers:[{item:'Iron Helmet',price:90,sold:false},{item:'Bronze Helmet',price:60,sold:false}]}; return s; };
const db = (bank=[]) => ({getItem:k=>k==='sq-bank'?JSON.stringify(bank):null});
const state = s => JSON.stringify(s, (k,v)=>typeof v==='function'?undefined:v);
const reject = (s,id,index,opts) => { const before=state(s); assert.equal(game.buyMerchant(s,'p1',id,index,opts),false); assert.equal(state(s),before); };
test('merchant API exists and initial stock state is limited to solo casual pace2',()=>{
 assert.equal(typeof game.buyMerchant,'function'); assert.equal(typeof game.merchantNear,'function');
 const s=quiet(); assert.equal(s.merchant,null); assert.equal(s.merchantSpent,0); assert.deepEqual(s.merchantLootIndices,[]); assert.equal(Object.hasOwn(s,'merchantT'),false);
 for(const opts of [{ranked:true},{pace:1},{players:[{id:'p1'},{id:'p2'}]},{coop:true,players:[{id:'p1'},{id:'p2'}]}]){
  const s=quiet(opts);run(s,1);for(const k of ['merchant','merchantSpent','merchantLootIndices','merchantT'])assert.equal(Object.hasOwn(s,k),false,k);
  assert.equal(Object.hasOwn(game.snapshot(s),'merchant'),false); s.rng=()=>{throw Error('excluded RNG');}; assert.equal(game.merchantNear(s,'p1'),false);reject(s,1,0);
 }
});
test('seeded encounters have fixed unique weighted gear offers, bounded arrival and lifetime',()=>{
 const a=quiet(),b=quiet();run(a,179);assert.equal(a.merchant,null);run(a,62);run(b,241);
 assert.ok(a.merchant);assert.deepEqual(a.merchant,b.merchant);assert.equal(a.merchant.offers.length,3);assert.equal(new Set(a.merchant.offers.map(o=>o.item)).size,3);
 const pool=new Set(casketWeights(a.casketRank,a.hard,a.t,{pace:2}).map(([n])=>n));
 for(const o of a.merchant.offers){assert.ok(Object.hasOwn(GEAR,o.item));assert.ok(pool.has(o.item));assert.equal(o.price,Math.max(60,2*alchValue(o.item)+20));assert.ok(o.price>alchValue(o.item)+DUPLICATE_GEAR_COINS);assert.equal(o.sold,false);}
 const m=a.merchant,view=game.snapshot(a).merchant;assert.deepEqual(view.offers,m.offers);view.offers[0].sold=true;assert.equal(m.offers[0].sold,false);
 run(a,76);assert.equal(a.merchant,null);assert.ok(a.merchantT>0 && a.merchantT<=360);a.merchantT=0;game.step(a);assert.ok(a.merchant);assert.notEqual(a.merchant.id,m.id);
});
test('real spawn respects bounded reachable clear ground and cannot appear in isolated wall pockets',()=>{
 for(const map of MAPS){const s=quiet({map});s.merchantT=0;game.step(s);assert.ok(s.merchant,map.id);assert.ok(Math.hypot(s.merchant.x-map.cx,s.merchant.z-map.cz)+1<=map.r);}
 const n=80,blocked=new Uint8Array(n*n),walls=new Uint8Array(n*n);for(let z=0;z<n;z++)walls[z*n+39]=2;
 const map={...MAPS[0],cx:40,cz:40,r:35},ground={n,cell:true,blocked,walls};const s=quiet({map,ground});s.players[0].x=36;s.players[0].z=40;
 for(let i=0;i<20;i++){s.merchant=null;s.merchantT=0;game.step(s);if(s.merchant){assert.ok(s.merchant.x<39);for(let z=Math.floor(s.merchant.z-1);z<=Math.floor(s.merchant.z+1);z++)for(let x=Math.floor(s.merchant.x-1);x<=Math.floor(s.merchant.x+1);x++)assert.equal(blocked[z*n+x],0);}}
 blocked.fill(1);for(let z=38;z<=42;z++)for(let x=34;x<=38;x++)blocked[z*n+x]=0;s.flow=null;s.merchant=null;s.merchantT=0;game.step(s);assert.equal(s.merchant,null,'tiny reachable island cannot fit distant shop');
});
test('stale double distant blocked invalid and unaffordable purchases leave the whole state and RNG unchanged',()=>{
 const s=shop();s.rng=()=>{throw Error('purchase RNG');};
 for(const index of [-1,2,0.5,'0',NaN])reject(s,81,index);
 reject(s,80,0);for(const multiplier of [0,0.9,3.1,Infinity,NaN,'2',null])reject(s,81,0,{multiplier});reject(s,81,0,{baseline:{sim:quiet()}});
 const p=s.players[0];p.x+=4;reject(s,81,0);p.x-=4;s.kills=0;reject(s,81,0);s.kills=6000;
 s.pending.p1={choices:[]};reject(s,81,0);delete s.pending.p1;p.casketQ=['Iron Helmet'];reject(s,81,0);p.casketQ=[];p.levelQ=1;reject(s,81,0);delete p.levelQ;
 p.alive=false;reject(s,81,0);p.alive=true;s.over='win';reject(s,81,0);s.over=null;
 s.merchant.life=0;reject(s,81,0);s.merchant.life=75;s.merchant.offers[0].item='missing';reject(s,81,0);s.merchant.offers[0].item='Iron Helmet';s.merchant.offers[0].price=-1;reject(s,81,0);s.merchant.offers[0].price=90;
 assert.equal(game.buyMerchant(s,'p1',81,0),true);reject(s,81,0);
 const w=shop(),n=512;w.ground={n,cell:true,blocked:new Uint8Array(n*n),walls:new Uint8Array(n*n)};w.merchant.x=w.players[0].x+1;w.ground.walls[Math.floor(w.players[0].z)*n+Math.floor(w.players[0].x)]=2;reject(w,81,0);
});
test('purchase debits once and reuses wear/alch, with bought loot saved but no casket achievement',()=>{
 const s=shop(),p=s.players[0],before=phaseCoins(s,{multiplier:2});assert.equal(game.buyMerchant(s,'p1',81,0,{multiplier:2}),true);
 assert.equal(s.merchantSpent,90);assert.equal(phaseCoins(s,{multiplier:2}),before-90);assert.equal(p.gear.head,'Iron Helmet');assert.deepEqual(s.loot,['Iron Helmet']);assert.deepEqual(s.merchantLootIndices,[0]);
 assert.equal(game.buyMerchant(s,'p1',81,1),true);assert.equal(s.pending.p1.lootIndex,1);assert.equal(game.choose(s,'p1',1),true);assert.equal(p.alch,alchValue('Bronze Helmet'));assert.equal(phaseCoins(s),1000-150+p.alch);
 s.over='dead';const r=prepareRunRewards(db(),s,{earned:phaseCoins(s)});assert.ok(JSON.parse(r.data['sq-bank']).includes('Iron Helmet'));assert.equal(JSON.parse(r.data['sq-stats']).caskets,0);assert.equal(r.loot.length,2);
 for(const multiplier of [1,1.25,1.9,3])assert.equal(phaseCoins(s,{multiplier}),Math.round(1000*multiplier)+p.alch-150);
});
test('normal victory spending baseline prevents banked GP reuse and charges only new Endless spending',()=>{
 const s=shop(),p=s.players[0];assert.equal(game.buyMerchant(s,'p1',81,0),true);s.over='win';s.t=s.map.length;
 const normal=prepareRunRewards(db(),s,{earned:phaseCoins(s,{won:true})}),b=captureRewardBaseline(s,normal);assert.equal(b.merchantSpent,90);continueCasual(s,b);
 assert.equal(phaseCoins(s,{baseline:b}),0);reject(s,81,1);reject(s,81,1,{baseline:b});
 s.kills+=600;assert.equal(game.buyMerchant(s,'p1',81,1,{baseline:b}),true);assert.equal(phaseCoins(s,{baseline:b}),40);assert.equal(phaseCoins(s,{baseline:b,multiplier:2}),140);
 game.choose(s,'p1',0);s.over='dead';const endless=prepareRunRewards(db(['Iron Helmet']),s,{earned:40,baseline:b});assert.equal(JSON.parse(endless.data['sq-stats']).caskets,0);assert.equal(endless.loot.length,1);
});
test('purchased filled slots explicitly keep their Wear/High alch choice and snapshot marker',()=>{
 const s=shop();s.players[0].gear.head='Iron Helmet';assert.equal(game.buyMerchant(s,'p1',81,0),true);
 assert.equal(s.pending.p1.merchantPurchase,true);assert.equal(game.snapshot(s).pending.p1.merchantPurchase,true);assert.equal(s.pending.p1.casket.item,'Iron Helmet');assert.equal(game.choose(s,'p1',0),true);assert.equal(s.players[0].gear.head,'Iron Helmet');
});
test('receipt errors fail closed and cannot create empty pending or free loot',()=>{
 const s=shop();s.players[0].casketLootIndices=null;reject(s,81,0);assert.equal(s.loot.length,0);assert.deepEqual(s.pending,{});
});
test('earned normal caskets and levels retain precedence, and only merchant loot is excluded from achievements',()=>{
 const s=shop(),p=s.players[0];s.pickups.push({id:20,kind:'casket',x:p.x,z:p.z});game.step(s);if(s.pending.p1)game.choose(s,'p1',0);
 const normalCount=s.loot.length;assert.equal(normalCount,1);assert.equal(game.buyMerchant(s,'p1',81,0),true);if(s.pending.p1)game.choose(s,'p1',0);
 s.over='win';const r=prepareRunRewards(db(),s,{earned:phaseCoins(s,{won:true})});assert.equal(JSON.parse(r.data['sq-stats']).caskets,normalCount);const b=captureRewardBaseline(s,r);continueCasual(s,b);
 s.kills+=600;s.pickups.push({id:21,kind:'casket',x:p.x,z:p.z});game.step(s);if(s.pending.p1)game.choose(s,'p1',0);assert.equal(game.buyMerchant(s,'p1',81,1,{baseline:b}),true);if(s.pending.p1)game.choose(s,'p1',0);
 s.over='dead';const next=prepareRunRewards(db(),s,{earned:phaseCoins(s,{baseline:b}),baseline:b});assert.equal(JSON.parse(next.data['sq-stats']).caskets,1);assert.equal(next.loot.length,2);
});

test('excluded modes retain pre-merchant snapshot fields and consume no additional RNG through six minutes',()=>{
 const modes=[
  [{ranked:true},'d4e23795a945ba75f506f2771fb8ef53f6f76c1100e5b2bc968d606b9445b6d2'],
  [{pace:1},'aa6851f011cddb424a065640e737b2c0244b192212287b1dd9e340e23a3811a4'],
  [{coop:true,players:[{id:'p1'},{id:'p2'}]},'6c0f16e0de93b0b4fea83e305dfe21b5500d81fd765e0597dc798090f3b30f2e'],
  [{players:[{id:'p1'},{id:'p2'}]},'6c0f16e0de93b0b4fea83e305dfe21b5500d81fd765e0597dc798090f3b30f2e'],
 ];
 // Keep the exact 2dc9e40 fields and RNG; the new empty food counts are checked separately.
 for(const [opts,hash] of modes){
  const s=quiet({...opts,seed:99});let calls=0;const rng=s.rng;s.rng=()=>{calls++;return rng();};
  for(let i=0;i<10801;i++)game.step(s);assert.equal(calls,0);assert.equal(s.rng(),0.2604658124037087);
  const snapshot=game.snapshot(s);
  for(const [i,p] of snapshot.players.entries()){
   if(s.pace>=2){assert.deepEqual(s.players[i].foodStacks,{});assert.deepEqual(p.beltCounts,[]);delete p.beltCounts;}
   else {assert.equal(Object.hasOwn(s.players[i],'foodStacks'),false);assert.equal(Object.hasOwn(p,'beltCounts'),false);}
  }
  assert.equal(createHash('sha256').update(JSON.stringify(snapshot)).digest('hex'),hash);
 }
});
test('retained native ground places at least one clear reachable merchant on each map',()=>{
 const ground=unpackGround(readFileSync(new URL('../tools/vercel-api/ground.bin',import.meta.url)));
 for(const map of MAPS){let count=0;for(let seed=1;seed<=12;seed++){const s=quiet({map,ground,seed});s.merchantT=0;game.step(s);const m=s.merchant;if(!m)continue;count++;const p=s.players[0];assert.ok(Math.hypot(m.x-map.cx,m.z-map.cz)+1<=map.r);assert.ok(s.flow.dist[(Math.floor(m.z)-s.flow.z0)*121+Math.floor(m.x)-s.flow.x0]<65535);p.x=m.x;p.z=m.z;assert.equal(game.merchantNear(s,p.id),true);for(let z=Math.floor(m.z-1);z<=Math.floor(m.z+1);z++)for(let x=Math.floor(m.x-1);x<=Math.floor(m.x+1);x++)assert.equal(game.walkable(s,x+.5,z+.5),true);}assert.ok(count>0,map.id);}
});
test('a purchased choice queued at normal victory alchs only its unbanked top-up in Endless',()=>{
 const s=shop(),p=s.players[0];p.gear.head='Iron Helmet';assert.equal(game.buyMerchant(s,'p1',81,0),true);
 s.over='win';s.t=s.map.length;const r=prepareRunRewards(db(['Iron Helmet']),s,{earned:phaseCoins(s,{won:true})});assert.equal(r.loot[0].soldCoins,25);const b=captureRewardBaseline(s,r);continueCasual(s,b);
 assert.equal(game.choose(s,p.id,1),true);assert.deepEqual(s.alchedLootIndices,[0]);assert.equal(phaseCoins(s,{baseline:b}),alchValue('Iron Helmet')-25);
 s.kills+=600;reject(s,81,1,{baseline:{...b}});assert.equal(game.buyMerchant(s,p.id,81,1,{baseline:b}),true);
});
test('a run started directly in Endless accepts its unbanked earnings without a continuation baseline',()=>{
 const s=shop();s.endless=true;assert.equal(game.buyMerchant(s,'p1',81,0),true);assert.equal(s.merchantSpent,90);
});

test('losing the coin multiplier after a purchase cannot debit saved profile GP',()=>{
 const values=new Map([['sq-coins','700']]),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const s=shop();s.kills=330;assert.equal(phaseCoins(s,{multiplier:1.1}),61);assert.equal(game.buyMerchant(s,'p1',81,1,{multiplier:1.1}),true);
 assert.equal(phaseCoins(s,{multiplier:1.1}),1);assert.equal(phaseCoins(s,{multiplier:1}),0);reject(s,81,0,{multiplier:1});
 s.over='dead';const r=prepareRunRewards(storage,s,{earned:phaseCoins(s,{multiplier:1})});saveRunProgress(storage,r.data);assert.equal(Number(storage.getItem('sq-coins')),700);
 assert.equal(phaseCoins(s,{multiplier:1.1}),1,'restoring the multiplier does not erase the original debit');
});
test('holder bonus loss in Endless caps only new merchant spending and preserves banked normal rewards',()=>{
 const values=new Map([['sq-coins','700']]),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const s=shop();assert.equal(game.buyMerchant(s,'p1',81,0),true);s.over='win';s.t=s.map.length;
 const normal=prepareRunRewards(storage,s,{earned:phaseCoins(s,{won:true})});saveRunProgress(storage,normal.data);const saved=Number(storage.getItem('sq-coins')),b=captureRewardBaseline(s,normal);continueCasual(s,b);
 assert.equal(b.merchantSpent,90);assert.equal(phaseCoins(s,{baseline:b,multiplier:1.1}),0);s.kills+=330;
 assert.equal(game.buyMerchant(s,'p1',81,1,{baseline:b,multiplier:1.1}),true);game.choose(s,'p1',0);assert.equal(phaseCoins(s,{baseline:b,multiplier:1.1}),1);
 assert.equal(phaseCoins(s,{baseline:b,multiplier:1}),0);s.over='dead';const next=prepareRunRewards(storage,s,{earned:phaseCoins(s,{baseline:b}),baseline:b});saveRunProgress(storage,next.data);assert.equal(Number(storage.getItem('sq-coins')),saved);assert.ok(saved>=700);
});
test('without merchant spending the existing negative phase alch adjustment remains exact',()=>{
 const s=quiet();s.over='win';s.loot=['Iron Helmet'];const r=prepareRunRewards(db(['Iron Helmet']),s,{earned:120}),b=captureRewardBaseline(s,r);continueCasual(s,b);
 s.alched=['Iron Helmet'];s.alchedLootIndices=[0];assert.equal(s.merchantSpent,0);assert.equal(phaseCoins(s,{baseline:b}),-25);
});
