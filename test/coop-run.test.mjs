import test from 'node:test';import assert from 'node:assert/strict';
import {createCoopRun} from '../src/coop-run.js';
import {snapshot} from '../src/sim.js';
import{readFileSync}from'node:fs';import{unpackGround,groundHash}from'../src/ground-pack.js';
const start=()=>({protocol:1,epoch:'00112233445566778899aabbccddeeff',build:'test-local',sim:'e2c1419b0907',ground:'0',seed:711,map:'greentown',hard:false,endless:false,players:['p1','p2'].map(id=>({id,loadout:{name:id,adv:'adventurer',meta:{},gear:{},gearLv:{},cleared:[]}}))});
function pair(){
 const down=[],up=[],ended=[];const host=createCoopRun({start:start(),localId:'p1',ground:null,send:m=>down.push(m),onEnd:reason=>ended.push(['host',reason])});
 const guest=createCoopRun({start:start(),localId:'p2',ground:null,send:m=>up.push(m),onEnd:reason=>ended.push(['guest',reason])});
 for(const d of [host,guest]){const s=d.sim;s.spawnAcc=-1e9;s.bossIndex=99;s.eventT=s.shrineT=1e9;}
 host.begin(0);guest.begin(0);
 const deliver=()=>{while(up.length){const message=up.shift();if(message.t==='up')host.accept({hero:1,data:message.data});}while(down.length){const message=down.shift();if(message.t==='down')guest.accept(message.data);}};
 const tick=n=>{for(let i=0;i<n;i++){deliver();host.advance();deliver();}};
 return{host,guest,down,up,ended,deliver,tick};
}
function earn(p){for(const d of [p.host,p.guest]){const s=d.sim,a=s.players[0];s.gems.push({id:s.nextId++,x:a.x,z:a.z,v:s.xpNeed,vx:0,vz:0});}p.tick(2);}
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
