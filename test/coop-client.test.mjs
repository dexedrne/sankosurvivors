import test from 'node:test';import assert from 'node:assert/strict';import{createServer}from'node:http';import{once}from'node:events';import WebSocket from'ws';
import{createCoopRelay}from'../tools/coop-relay.mjs';import{createCoopClient}from'../src/coop-client.js';
import{createCoopRun}from'../src/coop-run.js';
const origin='https://sankosurvivors.quest',identity={protocol:1,build:'test-local',sim:'0f890c11956a'},settings={map:'greentown',hard:false,endless:false};
const me=name=>({name,adv:'adventurer',meta:{},gear:{},gearLv:{},cleared:[]});
const wait=async(fn,ms=4000)=>{const end=Date.now()+ms;while(!fn()){if(Date.now()>end)assert.fail('Client condition timed out');await new Promise(r=>setTimeout(r,10));}};
async function fixture(t){
 const server=createServer((_,res)=>res.end()),relay=createCoopRelay({server,origins:[origin]}),clients=[];server.listen(0,'127.0.0.1');await once(server,'listening');const url=`ws://127.0.0.1:${server.address().port}/coop`;
 t.after(async()=>{for(const c of clients)c.client.close();await relay.close();await new Promise(r=>server.close(r));});
 return{url,client(extra={}){const events=new EventTarget(),sockets=[],rooms=[],runs=[],statuses=[],ends=[];const client=createCoopClient({url,identity,load:async()=>null,events,createSocket:url=>{const ws=new WebSocket(url,{origin});ws.on('error',()=>{});sockets.push(ws);return ws;},onRoom:r=>rooms.push(r),onRun:r=>runs.push(r),onStatus:s=>statuses.push(s),onEnd:(reason,run)=>ends.push({reason,run}),...extra});const c={client,events,sockets,rooms,runs,statuses,ends};clients.push(c);return c;}};
}
async function party(f,hostExtra={},guestExtra={}){const host=f.client(hostExtra),guest=f.client(guestExtra);assert(host.client.create(settings,me('Host')));await wait(()=>host.client.room);assert(guest.client.join(host.client.room.code,me('Guest')));await wait(()=>host.client.room.members.length===2&&guest.client.room);return{host,guest};}
async function start(p){p.host.client.ready(true);p.guest.client.ready(true);await wait(()=>p.host.client.room.members.every(m=>m.ready));assert(p.host.client.start({ground:'0',seed:711}));await wait(()=>p.host.client.run&&!p.host.client.run.held&&p.guest.client.run&&!p.guest.client.run.held);}
test('two actual clients wait for both ground loads before starting one shared run',async t=>{
 const f=await fixture(t);let release;const slow=new Promise(r=>release=r),p=await party(f,{}, {load:()=>slow});p.host.client.ready(true);p.guest.client.ready(true);await wait(()=>p.host.client.room.members.every(m=>m.ready));p.host.client.start({ground:'0',seed:711});await wait(()=>p.host.client.run);await new Promise(r=>setTimeout(r,100));assert.equal(p.host.client.run.frame,0);assert(p.host.client.run.held);assert.equal(p.guest.client.run,null);
 release(null);await wait(()=>p.host.client.run.frame>=10&&p.guest.client.run.frame>=10);assert.equal(p.host.runs.length,1);assert.equal(p.guest.runs.length,1);assert.equal(p.host.client.localId,'p1');assert.equal(p.guest.client.localId,'p2');assert.deepEqual(p.guest.client.run.sim.players.map(p=>p.id),['p1','p2']);assert(!JSON.stringify(p.guest.rooms).includes('token'));assert.deepEqual(p.host.ends,[]);
});
test('clients forward separate movement and clear held input on blur',async t=>{
 const f=await fixture(t),p=await party(f);await start(p);const guest=p.guest.client.run,z=guest.sim.players[1].z;p.host.client.run.input(1,0);guest.input(0,1);await wait(()=>guest.sim.players[1].z>z+2);p.guest.events.dispatchEvent(new Event('blur'));await new Promise(r=>setTimeout(r,150));const stopped=guest.sim.players[1].z;await new Promise(r=>setTimeout(r,150));assert.equal(guest.sim.players[1].z,stopped);assert(p.host.client.run.sim.players[0].x>p.host.client.run.sim.map.cx+2);assert.deepEqual(p.guest.ends,[]);
});
test('real guest socket loss resumes the same simulation without another load or onRun',async t=>{
 const f=await fixture(t),p=await party(f);await start(p);const old=p.guest.client.run;await wait(()=>old.frame>=6);p.guest.sockets[0].terminate();await wait(()=>p.host.statuses.includes('waiting')&&p.guest.statuses.includes('reconnecting'));await wait(()=>p.guest.sockets.length===2&&!p.guest.client.run.held&&p.guest.statuses.filter(s=>s==='playing').length===2);assert.equal(p.guest.client.run,old);assert.equal(p.guest.runs.length,1);assert.deepEqual(p.guest.ends,[]);assert(p.guest.statuses.includes('catchingUp'));p.guest.sockets[0].emit('message','{',false);p.guest.sockets[0].emit('close',1006);await wait(()=>old.frame>=12);assert.deepEqual(p.guest.ends,[]);
});
test('host loss and explicit leave end once, without fabricating completed runs',async t=>{
 const f=await fixture(t),p=await party(f);await start(p);p.host.sockets[0].terminate();await wait(()=>p.host.ends.length&&p.guest.ends.length);assert.equal(p.host.ends[0].reason,'connectionLost');assert.equal(p.guest.ends[0].reason,'hostLeft');p.host.client.close();p.guest.client.close();assert.equal(p.host.ends.length,1);assert.equal(p.guest.ends.length,1);assert(!p.guest.ends.some(e=>e.reason==='complete'));
});
test('incompatible client build and ground fail closed before play',async t=>{
 const f=await fixture(t),host=f.client();host.client.create(settings,me('Host'));await wait(()=>host.client.room);const stale=f.client({identity:{...identity,build:'old'}});stale.client.join(host.client.room.code,me('Old'));await wait(()=>stale.statuses.includes('versionMismatch'));assert.equal(stale.client.room,null);assert.equal(stale.client.run,null);stale.client.close();
 const guest=f.client({load:async()=>({n:1,blocked:new Uint8Array([0])})});guest.client.join(host.client.room.code,me('Guest'));await wait(()=>host.client.room.members.length===2);host.client.ready(true);guest.client.ready(true);await wait(()=>host.client.room.members.every(m=>m.ready));host.client.start({ground:'0',seed:711});await wait(()=>guest.ends.length);assert.equal(guest.ends[0].reason,'loadFailed');assert(!guest.runs.length);assert(!host.client.run||host.client.run.frame===0);
});
test('leaving during an outstanding load prevents its late callback from creating a run',async t=>{
 const f=await fixture(t);let release;const slow=new Promise(r=>release=r),p=await party(f,{}, {load:()=>slow});p.host.client.ready(true);p.guest.client.ready(true);await wait(()=>p.host.client.room.members.every(m=>m.ready));p.host.client.start({ground:'0',seed:711});await wait(()=>p.guest.statuses.includes('loading'));p.guest.client.close();release(null);await new Promise(r=>setTimeout(r,80));assert.equal(p.guest.runs.length,0);assert.equal(p.guest.client.run,null);assert.deepEqual(p.guest.ends.map(e=>e.reason),['left']);
});
test('public URL and local request guards reject unsafe endpoints and malformed actions',async t=>{
 for(const url of ['https://sankosurvivors.quest/coop','wss://user:password@sankosurvivors.quest/coop','wss://sankosurvivors.quest/coop?token=x','ws://example.com/coop','wss://sankosurvivors.quest/other'])assert.throws(()=>createCoopClient({url,identity,load:async()=>null}),/relay/i);
 const f=await fixture(t),c=f.client();assert.equal(c.client.join('???',me('Bad')),false);assert.equal(c.sockets.length,0);assert.equal(c.client.create({...settings,map:'not-a-map'},me('Bad')),false);assert.equal(c.sockets.length,0);assert.equal(c.client.ready(true),false);assert.equal(c.client.start({ground:'0',seed:1}),false);for(const value of [undefined,null,[],{ground:'0',seed:1,token:'fixture'}])assert.equal(c.client.start(value),false);c.client.close();assert.equal(c.client.create(settings,me('Late')),false);
});

test('repeated join/create and host-start clicks cannot issue competing requests',async t=>{
 const f=await fixture(t),host=f.client();host.client.create(settings,me('Host'));let repeated;host.sockets[0].addEventListener('message',e=>{if(JSON.parse(e.data).t==='hello')repeated=host.client.create(settings,me('Again'));});await wait(()=>host.client.room);assert.equal(repeated,false);
 const guest=f.client();guest.client.join(host.client.room.code,me('Guest'));await wait(()=>host.client.room.members.length===2);host.client.ready(true);guest.client.ready(true);await wait(()=>host.client.room.members.every(m=>m.ready));assert(host.client.start({ground:'0',seed:711}));assert.equal(host.client.start({ground:'0',seed:712}),false);await wait(()=>host.client.run&&!host.client.run.held);assert.deepEqual(host.ends,[]);
});
test('terminal socket delivery awards complete once only after the guest checksum agrees',async t=>{
 for(const corrupt of [false,true]){const f=await fixture(t),p=await party(f);await start(p);for(const c of [p.host,p.guest])c.client.run.sim.t=c.client.run.sim.map.length-.01;if(corrupt)p.guest.client.run.sim.players[1].hp--;
 await wait(()=>p.host.ends.length&&p.guest.ends.length);assert.deepEqual(p.host.ends.map(e=>e.reason),['complete']);assert.deepEqual(p.guest.ends.map(e=>e.reason),[corrupt?'desync':'complete']);p.host.client.close();p.guest.client.close();assert.equal(p.guest.ends.length,1);}
});
test('failed guest reconnect retries stop at ten seconds and retain no completed result',async t=>{
 const f=await fixture(t);let attempts=0,first;
 const p=await party(f,{}, {createSocket:url=>{const ws=new WebSocket(attempts++?url.replace(/:[0-9]+\/coop$/,':9/coop'):url,{origin});ws.on('error',()=>{});first??=ws;return ws;}});await start(p);const before=Date.now();first.terminate();
 await wait(()=>p.guest.ends.length,13000);assert.deepEqual(p.guest.ends.map(e=>e.reason),['reconnectExpired']);assert(attempts>=3);assert(Date.now()-before>=9900&&Date.now()-before<13000);assert.equal(p.guest.runs.length,1);
});
test('joining Tutorial Island uses the map-forced Alex on both copies without preselecting it',async t=>{
 const f=await fixture(t),host=f.client(),guest=f.client();host.client.create({...settings,map:'tutorial'},me('Host'));await wait(()=>host.client.room);guest.client.join(host.client.room.code,me('Guest'));await wait(()=>host.client.room.members.length===2);host.client.ready(true);guest.client.ready(true);await wait(()=>host.client.room.members.every(m=>m.ready));assert(host.client.start({ground:'0',seed:711}));await wait(()=>host.client.run&&!host.client.run.held&&guest.client.run&&!guest.client.run.held);for(const c of [host,guest])assert.deepEqual(c.client.run.sim.players.map(p=>[p.adv,p.gear]),[['alex',{}],['alex',{}]]);
});
test('a brief blocked render callback catches up shared ticks instead of slowing the whole party',async t=>{
 const f=await fixture(t),p=await party(f);await start(p);const before=p.host.client.run.frame;
 Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,180);await new Promise(r=>setTimeout(r,50));
 const advanced=p.host.client.run.frame-before;assert(advanced>=5&&advanced<=8,'180ms render stall should advance about six shared ticks, got '+advanced);await wait(()=>p.guest.client.run.frame>=before+5);assert.deepEqual(p.guest.ends,[]);
});


test('changing high-refresh guest movement stays bounded and blur sends immediate neutral',async t=>{
 const f=await fixture(t),p=await party(f);await start(p);const run=p.guest.client.run,ws=p.guest.sockets[0],sent=[],native=ws.send.bind(ws);ws.send=(text,...args)=>{const m=JSON.parse(text);if(m.t==='up'&&m.data.move)sent.push(m.data.move);return native(text,...args);};
 let i=0;const timer=setInterval(()=>{i++;run.input(Math.cos(i*.11),Math.sin(i*.11));},6);t.after(()=>clearInterval(timer));await new Promise(r=>setTimeout(r,3300));clearInterval(timer);assert(i>=250,'exercise changing high-refresh samples');assert.deepEqual(p.guest.ends,[]);assert.equal(p.guest.sockets.length,1,'no rate-limit reconnect');assert(sent.length<=115,'movement is coalesced at network cadence, got '+sent.length);
 p.guest.events.dispatchEvent(new Event('blur'));assert.deepEqual(sent.at(-1),[0,0]);await new Promise(r=>setTimeout(r,180));const position=[run.sim.players[1].x,run.sim.players[1].z];await new Promise(r=>setTimeout(r,120));assert.deepEqual([run.sim.players[1].x,run.sim.players[1].z],position);assert.deepEqual(p.guest.ends,[]);
});

function suspendedGuest(t){
 let now=0,tick;const sent=[],ends=[],listeners={},epoch='00112233445566778899aabbccddeeff',roomSettings={...settings,...identity};
 t.mock.method(Date,'now',()=>now);t.mock.method(performance,'now',()=>now);t.mock.method(globalThis,'setInterval',fn=>{tick=fn;return{unref(){}};});t.mock.method(globalThis,'clearInterval',()=>{});
 const ws={readyState:1,bufferedAmount:0,addEventListener:(kind,fn)=>listeners[kind]=fn,send:text=>sent.push(JSON.parse(text)),close(){this.readyState=3;}},emit=m=>listeners.message({data:JSON.stringify(m)});
 const client=createCoopClient({url:'ws://127.0.0.1/coop',identity,load:async()=>null,events:new EventTarget(),createSocket:()=>ws,onEnd:reason=>ends.push(reason)});t.after(()=>client.close());
 const game={...roomSettings,epoch,ground:'0',seed:711,players:['p1','p2'].map(id=>({id,loadout:me(id)}))};
 client.join('ABCDEF',me('p2'));emit({t:'hello',protocol:1});emit({t:'session',code:'ABCDEF',epoch,you:'p2',token:'1'.repeat(64)});emit({t:'room',code:'ABCDEF',epoch,you:'p2',hostId:'p1',settings:roomSettings,started:false,members:game.players.map(p=>({...p,ready:true,connected:true}))});emit({t:'start',game});
 return{client,game,ends,emit,at:n=>{now=n;tick();},async begin(){await Promise.resolve();emit({t:'begin',epoch,frame:0});assert(client.run&&!client.run.held);}};
}
test('a suspended guest can consume queued host progress before the stall watchdog ends the run',async t=>{
 const f=suspendedGuest(t);await f.begin();const down=[],host=createCoopRun({start:f.game,localId:'p1',ground:null,send:m=>down.push(m)});host.begin(0);host.advance();host.advance();
 f.at(20000);assert.equal(f.client.closed,false,'first resumed timer must allow queued network callbacks');f.emit(down[0]);assert.equal(f.client.run.frame,2);
 for(let at=20033;at<=34982;at+=33)f.at(at);assert.equal(f.client.closed,false);f.at(35015);assert.deepEqual(f.ends,['hostStalled'],'ordinary fifteen-second silence still ends');
});
test('repeated callback suspensions cannot renew guest stall grace without host progress',async t=>{
 const f=suspendedGuest(t);await f.begin();f.at(20000);assert.equal(f.client.closed,false);f.at(40000);assert.deepEqual(f.ends,['hostStalled']);
});

test('duplicate old frame packets cannot keep a stalled guest alive without simulation progress',async t=>{
 const f=suspendedGuest(t);await f.begin();const down=[],host=createCoopRun({start:f.game,localId:'p1',ground:null,send:m=>down.push(m)});host.begin(0);host.advance();host.advance();f.emit(down[0]);assert.equal(f.client.run.frame,2);
 for(let at=33;at<=14982;at+=33){f.at(at);if(at===9999||at===13992)f.emit(down[0]);}
 f.at(15015);assert.deepEqual(f.ends,['hostStalled'],'valid but duplicate packets are not forward progress');
});
