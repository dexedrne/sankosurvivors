import test from 'node:test';import assert from 'node:assert/strict';
import{createCoopRun}from'../src/coop-run.js';import{choose}from'../src/sim.js';
function pair(){const start={protocol:1,epoch:'00112233445566778899aabbccddeeff',build:'test-local',sim:'e2c1419b0907',ground:'0',seed:711,map:'greentown',hard:false,endless:false,players:['p1','p2'].map(id=>({id,loadout:{name:id,adv:'adventurer',meta:{},gear:{},gearLv:{},cleared:[]}}))};
 const down=[],up=[],ended=[],host=createCoopRun({start,localId:'p1',ground:null,send:m=>down.push(m),onEnd:r=>ended.push(r)}),guest=createCoopRun({start,localId:'p2',ground:null,send:m=>up.push(m),onEnd:r=>ended.push(r)});
 for(const run of[host,guest]){const s=run.sim;s.spawnAcc=-1e9;s.bossIndex=99;s.eventT=s.shrineT=1e9;for(const p of s.players){p.weapons={staff:6};p.passives={air:1,water:1,earth:1,fire:1,void:1};s.pending[p.id]={left:20,choices:[{kind:'evolve',id:'staff',level:1}]};assert(choose(s,p.id,0));}}
 host.begin(0);guest.begin(0);const deliver=()=>{while(up.length){const m=up.shift();if(m.t==='up')host.accept({hero:1,data:m.data});}while(down.length){const m=down.shift();if(m.t==='down')guest.accept(m.data);}};const tick=()=>{deliver();host.advance();host.flush();deliver();assert.equal(host.hash(),guest.hash());assert.deepEqual(ended,[]);};tick();return{host,guest,deliver,tick,ended};
}
test('co-op refuses reroll/skip/banish while choosing a Blast instead of queuing an invalid authoritative action',()=>{
 for(const action of[{kind:'reroll'},{kind:'skip'},{kind:'banish',index:0}]){const p=pair();assert.equal(p.host.action(action,p.host.decision('p1')),false);assert.equal(p.guest.action(action,p.guest.decision('p2')),false);p.tick();}
});
test('two independent co-op runs page and commit different elements with exact canonical hashes',()=>{
 const p=pair(),initial=p.host.decision('p1');assert(p.host.action({kind:'choose',index:2},initial));p.tick();assert(p.host.decision('p1')>initial);assert.equal(p.host.action({kind:'choose',index:0},initial),false);
 assert(p.guest.action({kind:'choose',index:1},p.guest.decision('p2')));p.tick();assert.equal(p.host.sim.players[1].spellElement,'water');assert.equal(p.host.sim.players[0].evo.staff,undefined);
 assert(p.host.action({kind:'choose',index:1},p.host.decision('p1')));p.tick();assert.equal(p.host.sim.players[0].spellElement,'fire');assert.equal(p.host.sim.players[0].evolves,1);assert.equal(p.host.sim.players[1].evolves,1);assert.equal(p.host.sim.evolves,2);assert(!p.host.sim.pending.p1&&!p.host.sim.pending.p2);for(let i=0;i<35;i++)p.tick();
});
