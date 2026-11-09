import test from 'node:test';
import assert from 'node:assert/strict';
import {COOP_PROTOCOL,COOP_HZ,COOP_PARTY,COOP_HISTORY,cleanLoadout,cleanMove,quantizeMove,cleanAction,cleanStart,cleanFrame} from '../src/coop-protocol.js';
const loadout=()=>({name:'Player',adv:'adventurer',meta:{combat:2},gear:{head:'Bronze Helmet'},gearLv:{'Bronze Helmet':1},cleared:[]});
const start=()=>({protocol:1,epoch:'00112233445566778899aabbccddeeff',build:'test-local',sim:'e2c1419b0907',ground:'165cf2df',seed:711,map:'greentown',hard:false,endless:false,players:[{id:'p1',loadout:loadout()},{id:'p2',loadout:{...loadout(),name:'Other',adv:'ranger'}}]});
test('co-op has two participants and a separate thirty-Hz network frame history',()=>{
 assert.deepEqual([COOP_PROTOCOL,COOP_HZ,COOP_PARTY,COOP_HISTORY],[1,30,2,600]);
});
test('valid loadouts are detached, bounded public run data',()=>{
 const input=loadout(),clean=cleanLoadout(input);assert.deepEqual(clean,input);assert.notEqual(clean,input);assert.notEqual(clean.meta,input.meta);assert.notEqual(clean.gear,input.gear);assert.notEqual(clean.gearLv,input.gearLv);assert.notEqual(clean.cleared,input.cleared);
 input.meta.combat=999;assert.equal(clean.meta.combat,2);
});
for(const [name,change] of [
 ['unknown adventurer',x=>x.adv='constructor'],['unbounded skill',x=>x.meta.combat=6],['fractional skill',x=>x.meta.combat=.5],['coerced skill',x=>x.meta.combat='2'],['nonfinite skill',x=>x.meta.combat=NaN],['unknown skill',x=>x.meta.wallet=1],
 ['wrong equipment slot',x=>x.gear.head='Bronze Boots'],['unknown equipment',x=>x.gear.head='constructor'],['unknown slot',x=>x.gear.wallet='Bronze Helmet'],['reinforcement overflow',x=>x.gearLv['Bronze Helmet']=4],['unworn inventory leak',x=>x.gearLv['Iron Helmet']=1],
 ['duplicate clear',x=>x.cleared=['greentown','greentown']],['unknown map',x=>x.cleared=['constructor']],['profile field',x=>x.coins=999],['credential field',x=>x.ticket='fixture'],['huge name',x=>x.name='x'.repeat(17)],['control character',x=>x.name='a\nb'],['array meta',x=>x.meta=[]],['null gear',x=>x.gear=null],
])test('loadout rejects '+name,()=>{const x=loadout();change(x);assert.equal(cleanLoadout(x),null);});
test('loadouts reject prototype and inherited records',()=>{
 for(const x of [null,[],1,'x',Object.assign(Object.create({polluted:1}),loadout()),{...loadout(),meta:JSON.parse('{"__proto__":1}')},{...loadout(),gear:JSON.parse('{"constructor":"Bronze Helmet"}')}])assert.equal(cleanLoadout(x),null);
 assert.equal({}.polluted,undefined);
});
test('movement is identical for the host and guest and cannot exceed a full stick',()=>{
 assert.deepEqual(quantizeMove(.5,-.5),[64,-63]);assert.deepEqual(cleanMove([64,-63]),[64,-63]);
 for(const input of [[1,1],[10,0],[-3,-4],[0,0]]){const q=quantizeMove(...input);assert(q.every(Number.isInteger));assert(Math.hypot(...q)<=128);assert.deepEqual(cleanMove(q),q);}
 assert(Math.hypot(...cleanMove([127,127]))<=128);
 for(const x of [null,[],[1],[1,2,3],[128,0],[.1,0],['1',0],[NaN,0],[Infinity,0],{}])assert.equal(cleanMove(x),null);
 for(const x of [[NaN,0],[Infinity,0],['1',0]])assert.equal(quantizeMove(...x),null);
});
test('only supported bounded player actions can cross the network',()=>{
 for(const x of [{kind:'choose',index:0},{kind:'choose',index:2},{kind:'banish',index:1},{kind:'reroll'},{kind:'skip'},{kind:'use',index:0},{kind:'use',index:4}])assert.deepEqual(cleanAction(x),x);
 for(const x of [null,[],{kind:'choose',index:-1},{kind:'choose',index:3},{kind:'choose',index:1.5},{kind:'banish',index:3},{kind:'use',index:5},{kind:'give',item:'Gold'},{kind:'skip',index:0},{kind:'choose',index:0,player:'p2'},{kind:'constructor'}])assert.equal(cleanAction(x),null);
});
test('a start binds version and preserves exactly two stable roster slots',()=>{
 const x=start(),clean=cleanStart(x);assert.deepEqual(clean,x);assert.notEqual(clean.players,x.players);assert.notEqual(clean.players[0].loadout,x.players[0].loadout);
});
for(const [name,change]of[
 ['wrong protocol',x=>x.protocol=2],['wrong simulation identity',x=>x.sim='dev'],['malformed build',x=>x.build='<script>'],['missing epoch',x=>delete x.epoch],['invalid ground',x=>x.ground='bad ground'],['negative seed',x=>x.seed=-1],['overflow seed',x=>x.seed=2**32],['unknown map',x=>x.map='constructor'],['locked map',x=>x.map='apache'],['locked hard',x=>x.hard=true],['locked endless',x=>x.endless=true],['missing boolean',x=>delete x.hard],['solo roster',x=>x.players.pop()],['oversized roster',x=>x.players.push(x.players[1])],['duplicate player',x=>x.players[1].id='p1'],['swapped slots',x=>x.players.reverse()],['locked adventurer',x=>x.players[0].loadout.adv='wizard'],['special outside map',x=>x.players[0].loadout.adv='alex'],['owner impersonation field',x=>x.wallet='fixture'],
])test('start rejects '+name,()=>{const x=start();change(x);assert.equal(cleanStart(x),null);});
test('unlocked hard/endless map and map-forced heroes remain supported',()=>{
 const x=start();x.map='apache';x.hard=x.endless=true;for(const p of x.players)p.loadout.cleared=['greentown','apache'];assert.ok(cleanStart(x));
 x.map='tutorial';x.hard=x.endless=false;assert.equal(cleanStart(x),null,'Tutorial requires Alex');for(const p of x.players)p.loadout.adv='alex';const forced=cleanStart(x);assert.ok(forced);assert(forced.players.every(p=>Object.keys(p.loadout.gear).length===0&&Object.keys(p.loadout.gearLv).length===0),'forced map does not carry permanent equipment');
});
test('ordered frame events validate actor, movement and reward identity without sim fallback',()=>{
 for(const x of [{frame:0,hero:0,move:[0,0]},{frame:10,hero:1,action:{kind:'choose',index:2},actionSeq:1,decision:3},{frame:11,hero:1,action:{kind:'use',index:4},actionSeq:2},{frame:12,hero:1,leave:true}])assert.deepEqual(cleanFrame(x,2),x);
 for(const x of [{frame:-1,hero:0,move:[0,0]},{frame:0,hero:2,move:[0,0]},{frame:0,hero:0,move:[999,0]},{frame:0,hero:0,action:{kind:'choose',index:0},actionSeq:1},{frame:0,hero:0,action:{kind:'choose',index:3},actionSeq:1,decision:0},{frame:0,hero:0,action:{kind:'skip'},actionSeq:0,decision:0},{frame:0,hero:0,leave:false},{frame:0,hero:0},{frame:0,hero:0,move:[0,0],leave:true},{frame:0,hero:0,move:[0,0],wallet:'fixture'}])assert.equal(cleanFrame(x,2),null);
});

test('room settings, guest inputs and host batches have bounded runtime schemas',async()=>{
 const {cleanRoomSettings,cleanUp,cleanDown}=await import('../src/coop-protocol.js');
 assert.equal(typeof cleanRoomSettings,'function');assert.equal(typeof cleanUp,'function');assert.equal(typeof cleanDown,'function');
 const settings={protocol:1,build:'test-local',sim:'e2c1419b0907',map:'greentown',hard:false,endless:false};
 assert.deepEqual(cleanRoomSettings(settings),settings);
 for(const extra of [{...settings,protocol:2},{...settings,map:'constructor'},{...settings,build:'<script>'},{...settings,hard:0},{...settings,token:'fixture'}])assert.equal(cleanRoomSettings(extra),null);
 for(const up of [{move:[127,0],moveSeq:1},{action:{kind:'choose',index:0},actionSeq:1,decision:0},{action:{kind:'use',index:4},actionSeq:2},{resend:0}])assert.deepEqual(cleanUp(up),up);
 for(const up of [null,{move:[0,0]},{move:[0,0],moveSeq:0},{move:[0,0],moveSeq:1,hero:1},{action:{kind:'choose',index:0},actionSeq:1},{action:{kind:'use',index:4},actionSeq:1,decision:0},{resend:-1},{resend:0,move:[0,0],moveSeq:1}])assert.equal(cleanUp(up),null);
 const batch={from:1,upTo:2,events:[{frame:1,hero:0,move:[127,0]},{frame:2,hero:1,action:{kind:'skip'},actionSeq:1,decision:0}],hash:[2,123]};
 assert.deepEqual(cleanDown(batch),batch);assert.notEqual(cleanDown(batch).events,batch.events);
 for(const down of [{...batch,from:0},{...batch,upTo:0},{...batch,upTo:62},{...batch,hash:[1,123]},{...batch,hash:[2,Infinity]},{...batch,events:[batch.events[1],batch.events[0]]},{...batch,events:[{frame:3,hero:0,move:[0,0]}]},{...batch,events:Array(241).fill(batch.events[0])},{...batch,events:[{frame:1,hero:2,move:[0,0]}]},{...batch,credential:'fixture'}])assert.equal(cleanDown(down),null);
});

test('optional movement echoes retain protocol1 old frames and reject invalid or misplaced sequences',async()=>{
 const {cleanDown}=await import('../src/coop-protocol.js');const event={frame:1,hero:1,move:[127,0],moveSeq:17};
 assert.deepEqual(cleanFrame(event,2),event);assert.deepEqual(cleanDown({from:1,upTo:1,events:[event]}).events,[event]);
 for(const moveSeq of [0,-1,.5,2**32,NaN,Infinity,'1',null])assert.equal(cleanFrame({...event,moveSeq},2),null);
 for(const extra of [{leave:true},{action:{kind:'use',index:0},actionSeq:1}])assert.equal(cleanFrame({frame:1,hero:1,moveSeq:1,...extra},2),null);
 assert.deepEqual(cleanFrame({frame:1,hero:1,move:[0,0]},2),{frame:1,hero:1,move:[0,0]});
});
