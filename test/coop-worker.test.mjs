import test from 'node:test';
import assert from 'node:assert/strict';
import {createCoopClient} from '../src/coop-client.js';
import {createCoopRun} from '../src/coop-run.js';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

function fixture(t,{blocked=false,loadedFailure=false}={}) {
 let now=0,next=0;const timers=new Map(),workers=[],sent=[],ends=[],listeners={};
 const prior=Object.getOwnPropertyDescriptor(globalThis,'Worker');
 class Worker {
  constructor(url,options){if(blocked)throw Error('Worker unavailable');this.url=url;this.options=options;workers.push(this);}
  postMessage(value){this.interval=value;}
  terminate(){this.terminated=true;}
 }
 Object.defineProperty(globalThis,'Worker',{value:Worker,configurable:true,writable:true});
 t.after(()=>{if(prior)Object.defineProperty(globalThis,'Worker',prior);else delete globalThis.Worker;});
 t.mock.method(performance,'now',()=>now);
 t.mock.method(globalThis,'setInterval',(fn,ms)=>{const id=++next;timers.set(id,{fn,ms});return id;});
 t.mock.method(globalThis,'clearInterval',id=>timers.delete(id));
 const identity={protocol:1,build:'test-local',sim:'0f890c11956a'},epoch='00112233445566778899aabbccddeeff';
 const settings={...identity,map:'greentown',hard:false,endless:false};
 const loadout={name:'Tester',adv:'adventurer',meta:{},gear:{},gearLv:{},cleared:[]};
 const game={...settings,epoch,ground:'0',seed:711,players:['p1','p2'].map(id=>({id,loadout}))};
 const ws={readyState:1,bufferedAmount:0,addEventListener:(kind,fn)=>listeners[kind]=fn,send:text=>{const value=JSON.parse(text);if(loadedFailure&&value.t==='loaded')throw Error('Loaded send failed');sent.push(value);},close(){this.readyState=3;}};
 const emit=value=>listeners.message({data:JSON.stringify(value)});
 const client=createCoopClient({url:'ws://127.0.0.1/coop',identity,load:async()=>null,events:new EventTarget(),createSocket:()=>ws,onEnd:reason=>ends.push(reason)});
 t.after(()=>client.close());
 client.create(settings,loadout);emit({t:'hello',protocol:1});emit({t:'session',code:'ABCDEF',epoch,you:'p1',token:'1'.repeat(64)});
 emit({t:'room',code:'ABCDEF',epoch,you:'p1',hostId:'p1',settings,started:false,members:game.players.map(p=>({...p,ready:true,connected:true}))});
 emit({t:'start',game});
 return {client,game,workers,timers,sent,ends,emit,setTime:value=>now=value,
  async begin(){await Promise.resolve();emit({t:'begin',epoch,frame:0});assert(client.run&&!client.run.held);},
  timer(at){now=at;for(const timer of [...timers.values()])timer.fn();},
  wake(at){now=at;for(const worker of workers)if(!worker.terminated)worker.onmessage?.({data:0});}
 };
}

test('worker wakeups keep host and guest at full speed when ordinary timers only fire once a second',async t=>{
 const f=fixture(t);await f.begin();const guest=createCoopRun({start:f.game,localId:'p2',ground:null,send:()=>{}});guest.begin(0);
 for(let at=40;at<=10000;at+=40){f.wake(at);if(at%1000===0)f.timer(at);}
 f.client.run.flush();
 assert(f.client.run.frame>=299&&f.client.run.frame<=300,'ten seconds should advance about 300 frames, got '+f.client.run.frame);
 for(const m of f.sent)if(m.t==='down')assert(guest.accept(m.data));
 assert.equal(guest.frame,f.client.run.frame);assert.equal(guest.hash(),f.client.run.hash());assert.deepEqual(f.ends,[]);
});

test('worker creation failure preserves the existing ordinary timer and stops it on close',async t=>{
 const f=fixture(t,{blocked:true});await f.begin();assert.equal(f.timers.size,1);
 for(let at=40;at<=1000;at+=40)f.timer(at);
 assert(f.client.run.frame>=29&&f.client.run.frame<=30);f.client.close();assert.equal(f.timers.size,0);assert.deepEqual(f.ends,['left']);
});

test('a terminal loaded-send failure cannot start a worker after cleanup',async t=>{
 const f=fixture(t,{loadedFailure:true});await Promise.resolve();
 assert.equal(f.client.closed,true);assert.deepEqual(f.ends,['connectionLost']);
 assert.equal(f.workers.length,0,'no worker starts after terminal loaded-send failure');assert.equal(f.timers.size,0);
});

test('worker failure switches once to the ordinary timer and ignores queued worker callbacks',async t=>{
 const f=fixture(t);await f.begin();assert.equal(f.workers.length,1);const worker=f.workers[0],late=worker.onmessage;
 f.wake(40);const before=f.client.run.frame;worker.onerror({preventDefault(){}});worker.onerror?.({preventDefault(){}});
 assert.equal(worker.terminated,true);assert.equal(f.timers.size,1);
 f.setTime(1040);late({data:0});assert.equal(f.client.run.frame,before,'late failed-worker wakeup is ignored');
 f.timer(1040);assert(f.client.run.frame>before);f.client.close();assert.equal(f.timers.size,0);
});

test('holds, genuine suspension and close retain the existing bounded behavior with a worker',async t=>{
 const f=fixture(t);await f.begin();assert.equal(f.workers.length,1);const worker=f.workers[0],late=worker.onmessage;
 f.wake(40);const before=f.client.run.frame;
 f.wake(30040);assert(f.client.run.frame-before<=8,'worker must not fast-forward a suspended page');
 f.emit({t:'hold',epoch:f.game.epoch,held:true,frame:f.client.run.frame});const held=f.client.run.frame;
 f.wake(31040);assert.equal(f.client.run.frame,held);
 f.emit({t:'begin',epoch:f.game.epoch,frame:held});f.wake(31080);assert(f.client.run.frame<=held+2);
 f.client.close();const stopped=f.client.run.frame;assert.equal(worker.terminated,true);f.setTime(32000);late({data:0});assert.equal(f.client.run.frame,stopped);assert.deepEqual(f.ends,['left']);
});

test('the shipped worker accepts one finite interval and posts wakeups without simulation or player data',()=>{
 const intervals=[],messages=[],self={postMessage:value=>messages.push(value)};
 runInNewContext(readFileSync(new URL('../src/coop-ticker-worker.js',import.meta.url),'utf8'),{self,setInterval:(fn,ms)=>intervals.push({fn,ms})});
 for(const data of [null,'33',0,-1,Infinity,NaN,{},1001])self.onmessage({data});
 assert.equal(intervals.length,0);self.onmessage({data:1000/30});assert.equal(self.onmessage,null);assert.equal(intervals.length,1);assert.equal(intervals[0].ms,1000/30);
 intervals[0].fn();intervals[0].fn();assert.deepEqual(messages,[0,0]);
});
