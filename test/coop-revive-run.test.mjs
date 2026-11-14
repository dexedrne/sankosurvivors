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
import {cleanUp,cleanDown,cleanFrame} from '../src/coop-protocol.js';
function fallen(p,id='p2'){for(const run of [p.host,p.guest]){for(const [i,hero]of run.sim.players.entries()){hero.x=365.5+i;hero.z=300.5;hero.weapons={};}const hero=run.sim.players.find(h=>h.id===id);hero.hp=0;hero.alive=false;}}
test('host held assistance with unchanged zero movement revives at exactly90ordered active ticks',()=>{const p=pair();fallen(p);assert(p.host.input(0,0,false,true),'held assistance must queue even without moving');p.tick(89);assert.equal(p.host.sim.players[1].alive,false);assert.equal(p.host.sim.coopRevive.ticks,89);p.tick(1);assert.equal(p.host.sim.players[1].alive,true);assert.equal(p.guest.sim.players[1].hp,30);assert.equal(p.host.hash(),p.guest.hash());assert.deepEqual(p.ended,[]);});
test('a living guest can revive the fallen host and held-zero input gets bounded keepalives',()=>{let now=0;const p=pair({},()=>now);fallen(p,'p1');assert(p.guest.input(0,0,false,true));let packets=p.up.length;for(let i=0;i<90;i++){now+=1000/30;p.guest.flushInput();packets+=p.up.length;p.tick(1);}assert(p.host.sim.players[0].alive);assert.equal(p.host.hash(),p.guest.hash());assert(packets<=25,'stationary assist must not flood the relay');assert.deepEqual(p.ended,[]);});
test('release and transport hold reset the channel through ordered neutral movement',()=>{const p=pair();fallen(p);p.host.input(0,0,false,true);p.tick(40);p.host.resetInput();p.tick(1);assert.equal(p.host.sim.coopRevive.ticks,0);p.host.input(0,0,false,true);p.tick(40);p.host.hold();p.guest.hold();p.deliver();assert.equal(p.host.hash(),p.guest.hash());p.host.begin(p.host.frame);p.guest.begin(p.guest.frame);p.tick(1);assert.equal(p.host.sim.coopRevive.ticks,0);assert(!p.host.sim.players[1].alive);assert.equal(p.host.hash(),p.guest.hash());});
test('a stale stationary guest assist is stopped by the existing host input watchdog',()=>{let now=0;const p=pair({},()=>now);fallen(p,'p1');p.guest.input(0,0,false,true);p.tick(1);assert.equal(p.host.sim.coopRevive.ticks,1);now=1100;p.tick(1);assert.equal(p.host.sim.coopRevive.ticks,0);assert.equal(p.host.sim.coopRevive.held[1],false);assert.equal(p.host.hash(),p.guest.hash());});
test('revive input and progress are part of canonical co-op state',()=>{const p=pair();fallen(p);p.host.input(0,0,false,true);p.tick(10);assert.equal(p.host.hash(),p.guest.hash());p.guest.sim.coopRevive.ticks--;assert.notEqual(p.host.hash(),p.guest.hash());});
test('only optional boolean assistance on ordered movement is accepted across schemas',()=>{for(const assist of [true,false]){const data={move:[0,0],moveSeq:1,assist};assert.deepEqual(cleanUp(data),data);const event={frame:1,hero:1,...data};assert.deepEqual(cleanFrame(event,2),event);assert.deepEqual(cleanDown({from:1,upTo:1,events:[event]}).events,[event]);}for(const assist of [0,1,null,'true',{},[]])assert.equal(cleanUp({move:[0,0],moveSeq:1,assist}),null);assert.equal(cleanUp({action:{kind:'use',index:0},actionSeq:1,assist:true}),null);assert.equal(cleanFrame({frame:1,hero:1,leave:true,assist:true},2),null);});
