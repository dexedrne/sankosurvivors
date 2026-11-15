import test from 'node:test';
import assert from 'node:assert/strict';
import * as Q from '../src/run-stats-client.js';
import {createSim} from '../src/sim.js';
import {startRunStats,captureRunStats} from '../src/run-stats.js';
function packet(n=1,endless=false){const s=createSim(),p=s.players[0];startRunStats(p);return{ticket:'run'+n+'.'+'a'.repeat(43),data:{kind:'casual',map:'greentown',adv:'adventurer',hard:false,endless,t:900,kills:100,level:5,won:!endless,build:'test',sim:'a'.repeat(12),week:null,stats:captureRunStats(s,p)}};}
function memory(){let state=null,tail=Promise.resolve();return{fail:false,read:async()=>structuredClone(state),update(fn){const run=tail.then(()=>{const {value,result}=fn(structuredClone(state));if(this.fail)throw Error('Disk full');state=structuredClone(value);return result;});tail=run.catch(()=>{});return run;},set(raw){state=structuredClone(raw);}};}
const create=(s,send,clock=()=>1000)=>{assert.equal(typeof Q.createRunStatsOutbox,'function','Durable stats outbox exists');return Q.createRunStatsOutbox(s,send,clock);};
test('a denied IndexedDB getter rejects optional storage access without throwing during game initialization',async()=>{
 const before=Object.getOwnPropertyDescriptor(globalThis,'indexedDB');Object.defineProperty(globalThis,'indexedDB',{configurable:true,get(){throw Error('SecurityError');}});
 try{let store;assert.doesNotThrow(()=>{store=Q.openRunStatsStore();});await assert.rejects(store.read(),/SecurityError|unavailable/);await assert.rejects(store.read(),/SecurityError|unavailable/);}
 finally{if(before)Object.defineProperty(globalThis,'indexedDB',before);else delete globalThis.indexedDB;}
});
test('nameless reports persist, transient failures retain them, and normal/endless phases are distinct pending deliveries',async()=>{
 const store=memory(),sent=[];let fail=true;const q=create(store,async p=>{sent.push(p);return{ok:!fail,status:fail?503:200};});await q.enqueue(packet());await q.enqueue(packet());await q.enqueue(packet(1,true));assert.equal((await q.inspect()).pending,2);await q.flush();assert.equal((await q.inspect()).pending,2);fail=false;await q.flush();assert.equal((await q.inspect()).pending,0);assert.equal(sent.length,3);assert.equal(sent[1].data.endless,false);assert.equal(sent[2].data.endless,true);
});
test('a record appended while another uploads is preserved across both writers',async()=>{
 const store=memory();let release,first=true;const a=create(store,()=>{if(first){first=false;return new Promise(r=>release=r);}return Promise.resolve({ok:true,status:200});}),b=create(store,async()=>({ok:true,status:200}));await a.enqueue(packet(1));const flushing=a.flush();while(!release)await new Promise(r=>setTimeout(r,0));await b.enqueue(packet(2));release({ok:true,status:200});await flushing;await b.flush();assert.equal((await b.inspect()).pending,0);
});
test('failed clearing after server acceptance retries the same report instead of losing a newer one',async()=>{
 const store=memory(),ids=[],q=create(store,async p=>{ids.push(p.ticket);store.fail=true;return{ok:true,status:200};});await q.enqueue(packet());await assert.rejects(q.flush(),/Disk full/);store.fail=false;assert.equal((await q.inspect()).pending,1);const next=create(store,async p=>{ids.push(p.ticket);return{ok:true,status:200};});await next.flush();assert.equal(ids[0],ids[1]);assert.equal((await next.inspect()).pending,0);
});
test('bounded storage counts expired, permanent and overflow drops and preserves malformed state',async()=>{
 const store=memory();let now=1000;const q=create(store,async()=>({ok:false,status:400}),()=>now);for(let n=0;n<201;n++)await q.enqueue(packet(n));assert.deepEqual(await q.inspect(),{pending:200,dropped:1});now+=73*3600000;await q.flush();assert.deepEqual(await q.inspect(),{pending:0,dropped:201});await q.enqueue(packet(202));await q.flush();assert.deepEqual(await q.inspect(),{pending:0,dropped:202});store.set({v:2,private:'keep'});await assert.rejects(q.enqueue(packet(203)),/unavailable/);assert.deepEqual(await store.read(),{v:2,private:'keep'});
});
test('bad payloads and storage failures never overwrite the stored outbox',async()=>{
 const store=memory(),q=create(store,async()=>({ok:true,status:200}));const bad=packet();bad.data.wallet='not retained';await assert.rejects(q.enqueue(bad),/statistics/);assert.equal(await store.read(),null);store.fail=true;await assert.rejects(q.enqueue(packet()),/Disk full/);assert.equal(await store.read(),null);
});
test('a completed run owns its detached report while its initial ticket request is pending',async()=>{
 assert.equal(typeof Q.queueFinishedRunStats,'function');let release,stored,flushed=false;const session={tickets:new Promise(r=>release=r)},summary=packet().data;
 const task=Q.queueFinishedRunStats(session,summary,{enqueue:async value=>{stored=value;},flush:async()=>{flushed=true;}});summary.stats.weapons.katana=6;session.statsTicket=packet().ticket;release();assert.equal(await task,true);assert.equal(stored.data.stats.weapons.katana,1);assert.equal(stored.ticket,session.statsTicket);assert(flushed);
 assert.equal(await Q.queueFinishedRunStats({tickets:Promise.resolve()},packet().data,{enqueue(){throw Error('No ticket means no upload');}}),false);
});
