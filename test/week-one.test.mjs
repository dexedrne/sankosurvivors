import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as rules from '../src/ranked.js';
import {createSim,spawnEnemy,step,TICK} from '../src/sim.js';
import {MAP_BY_ID} from '../src/content.js';
import {quoteDmt,checkBuilt,buyDmt} from '../src/swap.js';
import {connect,disconnect} from '../src/wallet.js';
const E18=10n**18n,me='0x'+'1'.repeat(40);
test('week-one prices preserve week0 and agree in exact DMT base units',()=>{
 assert.equal(typeof rules.raceForWeek,'function');
 for(const[w,mode,dmt]of[[0,'normal','0.5'],[0,'hard','1.5'],[1,'normal','1'],[1,'hard','2'],[2,'normal','1'],[2,'hard','2']]){
  const r=rules.raceForWeek(w,mode);assert.equal(r.entryDmt,dmt);assert.equal(BigInt(r.entryWei),BigInt(Number(dmt)*2)*E18/2n);
 }
 assert.equal(rules.raceForWeek(1,'constructor'),null);
});
test('Apache Desert is a week1 override while other weeks retain their rotation',()=>{
 assert.equal(rules.weekMap(0),'greentown');assert.equal(rules.weekMap(1),'apache');
 for(const w of[2,3,4,5,6])assert.equal(rules.weekMap(w),rules.RANKED.maps[w%rules.RANKED.maps.length]);
});
test('Tutorial ranked retains regular adventurers, endless KPM and equal starts',()=>{
 const s=rules.rankedSim({week:1,mapId:rules.weekMap(1),adv:'wizard',seed:1106});
 assert.equal(s.map.id,'apache');assert.equal(s.players[0].adv,'wizard');assert.equal(s.endless,true);assert.equal(s.endAt,7200);assert.equal(s.pace,2);assert.equal(rules.RANKED.minSeconds,180);assert.deepEqual(s.players[0].gear,{});
});
for(const ranked of[false,true])for(const hard of[false,true])for(const seconds of[0,60,239+29/30,240,300])test(`first four minutes movement: ranked=${ranked} hard=${hard} t=${seconds}`,()=>{
 const s=createSim({seed:1106,pace:2,ranked,hard});s.t=seconds;s.tick=Math.round(seconds/TICK);s.spawnAcc=-1e9;s.bossIndex=99;s.eventT=s.shrineT=1e9;
 const p=s.players[0];p.x=p.z=0;p.weapons={};p.godMode=true;p.hp=p.maxHp=1e6;spawnEnemy(s,'goblin',10,0);const e=s.enemies[0];e.rise=0;const x=e.x,speed=e.speed;
 step(s,{p1:{}},TICK);assert.ok(Math.abs((x-e.x)/(speed*TICK)-(seconds<240?1.05:1))<1e-10);
});
test('pace1 movement retains its original opening speed',()=>{
 const s=createSim({seed:1106,pace:1,ranked:true});s.spawnAcc=-1e9;s.bossIndex=99;s.eventT=s.shrineT=1e9;const p=s.players[0];p.x=p.z=0;p.weapons={};spawnEnemy(s,'goblin',10,0);const e=s.enemies[0];e.rise=0;const x=e.x;step(s,{p1:{}},TICK);assert.ok(Math.abs((x-e.x)/(e.speed*TICK)-1)<1e-10);
});
for(const amount of[0,.5,.999999,10000.000001,10001,NaN,Infinity,'1'])test(`buy target ${String(amount)} is rejected before any quote request`,async()=>{
 let calls=0;await assert.rejects(quoteDmt(amount,async()=>{calls++;return new Response('{}');}));assert.equal(calls,0);
});
for(const amount of[1,10,10000])test(`buy target boundary ${amount} is retained on the quote`,async()=>{
 const q=await quoteDmt(amount,async url=>{const amountIn=BigInt(new URL(url).searchParams.get('amountIn'));return new Response(JSON.stringify({code:0,data:{routeSummary:{amountIn:String(amountIn),amountOut:String(amountIn*18000n)}}}));});assert.equal(q.requestedDmt,amount);
});
const captured=JSON.parse(readFileSync(new URL('./fixtures/kyber-build.json',import.meta.url),'utf8'));
for(const requestedDmt of[.5,10001,undefined])test(`a swap build cannot bypass requested target bounds (${requestedDmt})`,()=>{
 const q={amountIn:captured.summary.amountIn,summary:captured.summary,requestedDmt};assert.throws(()=>checkBuilt(captured.build,q,me),/1.*10|amount/i);
});
test('an invalid buy target stops before wallet prompts or route building',async()=>{
 const requests=[],w={p:{request:async({method})=>{requests.push(method);return method==='eth_chainId'?'0xa4b1':[me];}}};globalThis.localStorage={getItem:()=>null,setItem(){},removeItem(){}};await connect(w);requests.length=0;let calls=0;
 await assert.rejects(buyDmt(w,me,{requestedDmt:.5},()=>{},async()=>{calls++;return new Response('{}');}),/1.*10|amount/i);assert.deepEqual(requests,[]);assert.equal(calls,0);disconnect();
});
