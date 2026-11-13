import test from 'node:test';import assert from 'node:assert/strict';
import {createCoopRun} from '../src/coop-run.js';
import {snapshot,playerStats} from '../src/sim.js';
import {WEAPON_IDS,PASSIVES} from '../src/content.js';
import{readFileSync}from'node:fs';import{unpackGround,groundHash}from'../src/ground-pack.js';
const start=()=>({protocol:1,epoch:'00112233445566778899aabbccddeeff',build:'test-local',sim:'e2c1419b0907',ground:'0',seed:711,map:'greentown',hard:false,endless:false,players:['p1','p2'].map(id=>({id,loadout:{name:id,adv:'adventurer',meta:{},gear:{},gearLv:{},cleared:[]}}))});
function pair(settings={},now=()=>performance.now()){
 const down=[],up=[],ended=[];const host=createCoopRun({start:{...start(),...settings},localId:'p1',ground:null,now,send:m=>down.push(m),onEnd:reason=>ended.push(['host',reason])});
 const guest=createCoopRun({start:{...start(),...settings},localId:'p2',ground:null,now,send:m=>up.push(m),onEnd:reason=>ended.push(['guest',reason])});
 for(const d of [host,guest]){const s=d.sim;s.spawnAcc=-1e9;s.bossIndex=99;s.eventT=s.shrineT=1e9;}
 host.begin(0);guest.begin(0);
 const deliver=()=>{while(up.length){const message=up.shift();if(message.t==='up')host.accept({hero:1,data:message.data});}while(down.length){const message=down.shift();if(message.t==='down')guest.accept(message.data);}};
 const tick=n=>{for(let i=0;i<n;i++){deliver();host.advance();deliver();}host.flush();deliver();};
 return{host,guest,down,up,ended,deliver,tick};
}
function earn(p){for(const d of [p.host,p.guest]){const s=d.sim,a=s.players[0];s.gems.push({id:s.nextId++,x:a.x,z:a.z,v:s.xpNeed,vx:0,vz:0});}p.tick(2);}
test('movement and actions reach the guest on their frame while quiet frames stay paired',()=>{
 const p=pair();p.host.input(1,0);p.host.advance();
 assert.equal(p.down.length,1,'movement must not wait for another host tick');
 assert.deepEqual([p.down[0].data.from,p.down[0].data.upTo],[1,1]);p.deliver();
 assert.equal(p.guest.frame,1);assert.equal(p.host.hash(),p.guest.hash());
 p.host.advance();assert.equal(p.down.length,0,'one quiet frame stays buffered');
 p.host.advance();assert.equal(p.down.length,1);assert.deepEqual([p.down[0].data.from,p.down[0].data.upTo],[2,3]);p.deliver();
 assert(p.guest.action({kind:'use',index:4}));p.deliver();p.host.advance();
 assert.equal(p.down.length,1,'item use must not wait for another host tick');
 assert.deepEqual([p.down[0].data.from,p.down[0].data.upTo],[4,4]);p.deliver();
 assert.equal(p.guest.frame,4);assert(p.guest.sim.players[1].rollCd>0);assert.equal(p.host.hash(),p.guest.hash());
 p.host.advance();assert.equal(p.down.length,0);p.host.advance();
 assert.deepEqual([p.down[0].data.from,p.down[0].data.upTo],[5,6]);p.deliver();
 assert.equal(p.host.hash(),p.guest.hash());assert.deepEqual(p.ended,[]);
});
test('two independent runs share quantized movement, uses and render-independent hashes',()=>{
 const p=pair();p.host.input(1,0);p.guest.input(0,1);p.tick(120);assert.equal(p.host.frame,120);assert.equal(p.guest.frame,120);
 assert(p.host.sim.players[0].x>p.host.sim.map.cx+10);assert(p.guest.sim.players[1].z>p.guest.sim.map.cz+10);assert.equal(p.host.hash(),p.guest.hash());
 assert(p.guest.action({kind:'use',index:4}));p.tick(2);assert(p.host.sim.players[1].rollCd>0);assert.equal(p.host.hash(),p.guest.hash());
 for(let i=0;i<60;i++){snapshot(p.host.sim);if(i%7===0)snapshot(p.guest.sim);p.tick(2);assert.equal(p.host.hash(),p.guest.hash());}assert.deepEqual(p.ended,[]);
});
test('network frames continue during shared XP choices, with independent player decisions',()=>{
 const p=pair();earn(p);assert(p.host.sim.pending.p1&&p.host.sim.pending.p2);const tick=p.host.sim.tick;
 p.tick(30);assert.equal(p.host.sim.tick,tick);assert.equal(p.host.frame,32);assert.equal(p.host.hash(),p.guest.hash());
 assert(p.host.action({kind:'choose',index:0},p.host.decision('p1')));p.tick(2);assert.equal(p.host.sim.pending.p1,undefined);assert(p.host.sim.pending.p2);assert.equal(p.host.sim.tick,tick);
 assert(p.guest.action({kind:'choose',index:2},p.guest.decision('p2')));p.tick(2);assert.equal(p.host.sim.pending.p2,undefined);assert(p.host.sim.tick>tick);assert.equal(p.host.hash(),p.guest.hash());
});
test('stale decisions, repeated actions and invalid choice indices never select a new reward',()=>{
 const p=pair();earn(p);const before=p.guest.decision('p2');
 assert(p.guest.action({kind:'reroll'},p.guest.decision('p2')));p.tick(2);assert(p.host.decision('p2')>before);
 const pending=structuredClone(p.host.sim.pending.p2.choices);
 assert.equal(p.host.accept({hero:1,data:{action:{kind:'choose',index:0},actionSeq:2,decision:before}}),false);
 assert.equal(p.host.accept({hero:1,data:{action:{kind:'reroll'},actionSeq:1,decision:before}}),false);
 assert.equal(p.guest.action({kind:'choose',index:3},p.guest.decision('p2')),false);assert.equal(p.guest.action({kind:'use',index:4}),false);
 p.tick(2);assert.deepEqual(p.host.sim.pending.p2.choices,pending);assert.equal(p.host.hash(),p.guest.hash());
});
test('missing batches request bounded history and duplicates do not apply twice',()=>{
 const p=pair();p.host.input(1,0);p.host.advance();p.host.advance();const first=p.down.shift();assert(first);
 p.host.advance();p.host.advance();const later=p.down.shift();p.guest.accept(later.data);assert.equal(p.guest.frame,0);assert.equal(p.up[0].data.resend,0);
 p.deliver();p.deliver();assert.equal(p.guest.frame,4);assert.equal(p.host.hash(),p.guest.hash());p.guest.accept(first.data);p.guest.accept(later.data);assert.equal(p.guest.frame,4);assert.equal(p.host.hash(),p.guest.hash());
});
test('old history and mismatched state end visibly without a completion callback',()=>{
 const p=pair();for(let i=0;i<650;i++){p.host.advance();p.down.length=0;}assert.equal(p.host.accept({hero:1,data:{resend:0}}),false);assert.deepEqual(p.ended,[['host','historyExpired']]);
 const q=pair();q.guest.sim.players[1].hp--;q.tick(30);assert.deepEqual(q.ended,[['guest','desync']]);assert.equal(q.guest.closed,true);
});
test('holding flushes the last ordered frame and prevents advancement until both copies catch up',()=>{
 const p=pair();p.host.input(1,0);p.host.advance();p.host.hold();p.guest.hold();p.deliver();assert.equal(p.guest.frame,1);assert.equal(p.host.advance(),false);assert.equal(p.host.frame,1);
 const x=p.host.sim.players[0].x;p.host.begin(1);p.guest.begin(1);p.tick(2);assert.equal(p.host.hash(),p.guest.hash());assert.equal(p.host.sim.players[0].x,x);
});

test('unchanged controller input does not flood the relay on high-refresh displays',()=>{
 const p=pair();assert(p.guest.input(1,0));for(let i=0;i<300;i++)assert.equal(p.guest.input(1,0),false);assert.equal(p.up.length,1);assert(p.guest.input(0,0));assert.equal(p.up.length,2);
});

test('the drift checksum covers RNG consumption, choices, cooldowns and personal loot',()=>{
 for(const mutate of [s=>s.rng(),s=>s.players[1].cd.staff=1,s=>s.players[1].loot.push('Iron Helmet'),s=>s.pending.p2={choices:[{kind:'heal',level:1}],left:20}]){const p=pair();mutate(p.guest.sim);assert.notEqual(p.host.hash(),p.guest.hash());}
});
test('the drift checksum catches food quantity divergence with identical belt strings',()=>{
 const p=pair();for(const run of[p.host,p.guest]){run.sim.players[1].belt=['cheese'];run.sim.players[1].foodStacks.cheese=1;}
 assert.equal(p.host.hash(),p.guest.hash());p.guest.sim.players[1].foodStacks.cheese=2;assert.notEqual(p.host.hash(),p.guest.hash());
});
test('real ground and flow fields agree independently of rendering',()=>{
 const bytes=readFileSync(new URL('../tools/vercel-api/sims/e2c1419b0907/ground.bin',import.meta.url)),game=start();game.ground=groundHash(unpackGround(bytes));
 const down=[],host=createCoopRun({start:game,localId:'p1',ground:unpackGround(bytes),send:m=>down.push(m)}),guest=createCoopRun({start:game,localId:'p2',ground:unpackGround(bytes),send(){}});host.begin(0);guest.begin(0);host.input(1,0);
 for(let i=0;i<30;i++){host.advance();snapshot(host.sim);while(down.length)guest.accept(down.shift().data);}
 assert.equal(host.frame,guest.frame);assert.equal(host.hash(),guest.hash());assert(guest.sim.flow?.dist);guest.sim.flow.dist[0]^=1;assert.notEqual(host.hash(),guest.hash());
});
test('a final frame must pass its checksum before a guest can complete, exactly once',()=>{
 const p=pair();for(const d of [p.host,p.guest])d.sim.t=d.sim.map.length-.01;p.host.advance();p.deliver();assert.deepEqual(p.ended,[['host','complete'],['guest','complete']]);p.guest.close('complete');assert.equal(p.ended.length,2);
 const q=pair();for(const d of [q.host,q.guest])d.sim.t=d.sim.map.length-.01;q.guest.sim.players[1].hp--;q.host.advance();q.deliver();assert.deepEqual(q.ended,[['host','complete'],['guest','desync']]);
});
test('an invalid guest state ends safely instead of throwing from an incoming frame',()=>{
 const p=pair();p.guest.sim.players[1].hp=NaN;
 assert.doesNotThrow(()=>p.tick(30));assert.deepEqual(p.ended,[['guest','invalidState']]);assert.equal(p.guest.closed,true);
});

test('odd-frame recovery still transmits every periodic drift checksum',()=>{
 const p=pair();p.tick(105);p.host.hold();p.guest.hold();p.deliver();assert.equal(p.guest.frame,105);p.host.begin(105);p.guest.begin(105);
 for(let i=0;i<15;i++)p.host.advance();assert(p.down.some(m=>m.t==='down'&&m.data.hash?.[0]===120),'frame120 checksum must not be stranded in an odd-ended batch');p.deliver();assert.equal(p.host.hash(),p.guest.hash());
 p.guest.sim.players[1].hp--;p.tick(30);assert.deepEqual(p.ended,[['guest','desync']],'drift after odd-frame recovery must fail closed at the next checksum');
});

test('Endless growth remains deterministic across peers and enters the canonical drift check',()=>{
 const p=pair({endless:true,players:start().players.map(hero=>({...hero,loadout:{...hero.loadout,cleared:['greentown']}}))});
 for(const run of [p.host,p.guest])for(const hero of run.sim.players){hero.weapons={katana:6,bow:6,shield:6,axe:6};hero.passives={might:5,boots:5,area:5,vigor:5};hero.evo={katana:true,bow:true,shield:true,axe:true};hero.hp=hero.maxHp=200;}
 earn(p);
 for(let i=0;i<2;i++){const a=p.host.sim.players[i],b=p.guest.sim.players[i];assert(a.endlessGrowth);assert.deepEqual(a.endlessGrowth,b.endlessGrowth);assert.equal(Object.values(a.endlessGrowth).reduce((n,v)=>n+v,0),1);}
 snapshot(p.host.sim);assert.equal(p.host.hash(),p.guest.hash());
 assert(p.host.action({kind:'choose',index:0},p.host.decision('p1')));assert(p.guest.action({kind:'choose',index:0},p.guest.decision('p2')));
 p.tick(30);assert.equal(p.host.hash(),p.guest.hash());assert.deepEqual(p.ended,[]);
 p.guest.sim.players[1].endlessGrowth.might++;p.tick(30);assert.deepEqual(p.ended,[['guest','desync']]);
});

test('storms retain canonical time across hold and retained-frame recovery',()=>{
 const p=pair();for(const d of[p.host,p.guest])d.sim.event={kind:'rainstorm',t:20};p.tick(60);
 const before=snapshot(p.host.sim);assert(before.storm,'storm snapshot missing');assert.equal(before.storm.left,18);
 p.host.hold();p.guest.hold();p.deliver();for(let i=0;i<30;i++)assert.equal(p.host.advance(),false);assert.deepEqual(snapshot(p.host.sim).storm,before.storm);assert.deepEqual(snapshot(p.guest.sim).storm,before.storm);
 const frame=p.host.frame;p.host.begin(frame);p.guest.begin(frame);for(let i=0;i<60;i++)p.host.advance();assert(p.guest.recover(p.host.frame));p.deliver();assert.equal(p.guest.frame,p.host.frame);assert.equal(p.host.hash(),p.guest.hash());
 p.host.hold();p.deliver();p.host.begin(p.host.frame);p.guest.begin(p.guest.frame);p.tick(30);assert.equal(p.host.hash(),p.guest.hash());assert.deepEqual(snapshot(p.host.sim).storm,snapshot(p.guest.sim).storm);assert.equal(snapshot(p.host.sim).storm.left,15);assert.deepEqual(p.ended,[]);
});
test('co-op gold mining produces one reward and matching host/guest state through collection',()=>{
 const p=pair();
 for(const d of [p.host,p.guest]){
  const s=d.sim,a=s.players[0];
  s.shrines.push({id:s.nextId++,kind:'gold',x:a.x,z:a.z,charge:0,life:75});
  for(const member of s.players){member.x=a.x;member.z=a.z;member.weapons={};}
 }
 p.tick(150);
 assert.equal(p.host.hash(),p.guest.hash());
 assert.equal(p.host.sim.shrines.length,0);
 assert.equal(p.host.sim.pickups.filter(k=>k.kind==='coin').length+p.host.sim.players.reduce((sum,a)=>sum+a.coins,0),24);
 assert.deepEqual(p.ended,[]);
});

test('host stops stale remote movement when the guest stops refreshing input without disconnecting',()=>{
 let time=0;const p=pair({},()=>time);assert(p.guest.input(1,0));p.deliver();const start=p.host.sim.players[1].x;let held;
 for(let tick=1;tick<=300;tick++){time=tick*1000/30;p.tick(1);if(tick===60)held=p.host.sim.players[1].x;}
 assert.equal(p.host.sim.players[1].x,held,'stale remote input must not keep walking for ten seconds');assert(p.host.sim.players[1].x-start<10);assert.equal(p.host.hash(),p.guest.hash());assert.deepEqual(p.ended,[]);
});

test('healthy remote movement refreshes within budget and resumes with its real sequence after expiry',()=>{
 let time=0;const p=pair({},()=>time);p.host.input(0,1);assert(p.guest.input(1,0));let moving;
 for(let tick=1;tick<=120;tick++){time=tick*1000/30;p.guest.flushInput();p.tick(1);if(tick===60)moving=p.host.sim.players[1].x;}
 assert(p.host.sim.players[1].x>moving+10);const hostZ=p.host.sim.players[0].z;
 for(let tick=121;tick<=210;tick++){time=tick*1000/30;p.tick(1);}
 assert(p.host.sim.players[0].z>hostZ+10,'host controls do not need remote heartbeats');const stopped=p.host.sim.players[1].x;
 time+=210;p.guest.flushInput();p.tick(2);assert(p.host.sim.players[1].x>stopped,'the next genuine movement sequence resumes normally');assert.equal(p.host.hash(),p.guest.hash());assert.deepEqual(p.ended,[]);
});

test('a queued remote move expires before a delayed first host frame',()=>{
 let time=0;const p=pair({},()=>time);assert(p.guest.input(1,0));p.deliver();const x=p.host.sim.players[1].x;time=1500;p.tick(2);assert.equal(p.host.sim.players[1].x,x);assert.equal(p.host.hash(),p.guest.hash());
});

test('duplicate movement cannot refresh expiry and queued neutral keeps its real acknowledgement',()=>{
 let time=0;const p=pair({},()=>time);assert(p.guest.input(1,0));p.tick(1);time=800;assert.equal(p.host.accept({hero:1,data:{move:[127,0],moveSeq:1}}),false);time=1100;const stopped=p.host.sim.players[1].x;p.tick(2);assert.equal(p.host.sim.players[1].x,stopped);assert.equal(p.host.hash(),p.guest.hash());
 let clock=0;const q=pair({},()=>clock);q.guest.input(1,0);q.tick(1);clock=500;q.guest.input(0,0);q.deliver();clock=1600;q.host.advance();assert(q.down.flatMap(m=>m.data?.events||[]).some(e=>e.hero===1&&e.moveSeq===2&&e.move[0]===0));q.deliver();assert.equal(q.host.hash(),q.guest.hash());
});

test('an expired remote direction holds the guest picture until a genuine movement echo returns',()=>{
 let time=0;const p=pair({},()=>time);p.guest.input(1,0);p.tick(1);
 for(let tick=1;tick<=90;tick++){time=tick*1000/30;p.guest.flushInput();p.up.length=0;p.tick(1);p.guest.pose();}
 let pose=p.guest.pose();assert.equal(pose.mv,false);assert.equal(pose.x,p.host.sim.players[1].x);assert.equal(pose.z,p.host.sim.players[1].z);
 p.guest.resetInput();p.up.length=0;p.guest.input(0,1);p.up.length=0;time+=100;p.tick(2);pose=p.guest.pose();assert.equal(pose.mv,false,'new local direction alone is not an acknowledgement');
 time+=210;p.guest.flushInput();p.tick(2);pose=p.guest.pose();assert.equal(pose.mv,true);assert.equal(p.host.hash(),p.guest.hash());
});

test('seeded rare slot decisions stay personal, survive held recovery and enter canonical co-op checksums',()=>{
 const p=pair({seed:26});
 // A shared full-row fixture reaches the ordinary XP/choice path; no RNG overrides.
 for(const run of [p.host,p.guest]){run.sim.level=10;for(const hero of run.sim.players){hero.weapons=Object.fromEntries(WEAPON_IDS.slice(0,4).map(id=>[id,1]));hero.passives=Object.fromEntries(Object.keys(PASSIVES).slice(0,4).map(id=>[id,1]));}}
 earn(p);const before=p.host.decision('p1'),index=p.host.sim.pending.p1.choices.findIndex(c=>c.kind==='slot');assert.equal(index,2);assert.equal(p.host.sim.pending.p1.choices[index].id,'passive');assert(p.host.action({kind:'choose',index},before));p.tick(2);
 assert.equal(p.host.sim.players[0].slotUpgrade,'passive');assert.equal(p.guest.sim.players[0].slotUpgrade,'passive');assert.equal(playerStats(p.guest.sim.players[0]).passiveSlots,5);assert.equal(p.guest.sim.players[1].slotUpgrade,undefined);assert.equal(p.host.action({kind:'choose',index},before),false);
 assert(p.guest.action({kind:'choose',index:0},p.guest.decision('p2')));p.tick(5);assert.equal(p.host.hash(),p.guest.hash());
 p.host.hold();p.guest.hold();p.deliver();assert(p.guest.recover(p.host.frame));p.deliver();assert(p.host.begin(p.host.frame));assert(p.guest.begin(p.guest.frame));p.tick(35);assert.equal(p.host.hash(),p.guest.hash());assert.equal(p.guest.sim.players[0].slotUpgrade,'passive');assert.deepEqual(p.ended,[]);
 p.guest.sim.players[0].slotUpgrade='weapon';p.tick(30);assert.deepEqual(p.ended,[['guest','desync']]);
});
