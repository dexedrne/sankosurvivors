import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import WebSocket from 'ws';
import {createCoopRelay} from '../tools/coop-relay.mjs';
const origin='https://sankosurvivors.quest';
const settings={protocol:1,build:'test-local',sim:'e2c1419b0907',map:'greentown',hard:false,endless:false};
const identity={protocol:1,build:settings.build,sim:settings.sim};
const loadout=name=>({name,adv:'adventurer',meta:{},gear:{},gearLv:{},cleared:[]});
async function fixture(t,options={}){
 const server=createServer((req,res)=>{res.writeHead(404);res.end();}),relay=createCoopRelay({server,origins:[origin],...options}),clients=[];
 server.listen(0,'127.0.0.1');await once(server,'listening');const url=`ws://127.0.0.1:${server.address().port}/coop`;
 t.after(async()=>{for(const c of clients)c.ws.terminate();await relay.close();await new Promise(resolve=>server.close(resolve));});
 return {url,async client(headers={}){
  const ws=new WebSocket(url,{origin,headers}),queue=[],waiters=[];ws.on('error',()=>{});
  const closed=new Promise(resolve=>ws.once('close',code=>resolve(code)));
  ws.on('message',data=>{const message=JSON.parse(String(data)),i=waiters.findIndex(w=>w.type===message.t&&w.predicate(message));if(i<0)queue.push(message);else{const w=waiters.splice(i,1)[0];clearTimeout(w.timer);w.resolve(message);}});
  const c={ws,closed,send:message=>ws.send(JSON.stringify(message)),next(type,predicate=()=>true,timeout=3000){const i=queue.findIndex(m=>m.t===type&&predicate(m));if(i>=0)return Promise.resolve(queue.splice(i,1)[0]);return new Promise((resolve,reject)=>{const w={type,predicate,resolve,timer:setTimeout(()=>{const i=waiters.indexOf(w);if(i>=0)waiters.splice(i,1);reject(Error('Relay did not send '+type));},timeout)};waiters.push(w);});}};
  clients.push(c);await once(ws,'open');await c.next('hello');return c;
 }};
}
async function party(f){
 const host=await f.client();host.send({t:'create',settings,me:loadout('Host')});const room=await host.next('room'),hostSession=await host.next('session');
 const guest=await f.client();guest.send({t:'join',code:room.code,identity,me:loadout('Guest')});const guestRoom=await guest.next('room'),guestSession=await guest.next('session');
 assert.equal(room.you,'p1');assert.equal(guestRoom.you,'p2');assert.deepEqual(guestRoom.members.map(p=>p.id),['p1','p2']);
 return {host,guest,room:guestRoom,hostSession,guestSession};
}
async function start(p,ground='165cf2df'){
 p.host.send({t:'ready',ready:true});p.guest.send({t:'ready',ready:true});
 const room=await p.host.next('room',m=>m.members.length===2&&m.members.every(p=>p.ready));
 const game={...room.settings,epoch:room.epoch,ground,seed:711,players:room.members.map(({id,loadout})=>({id,loadout}))};
 p.host.send({t:'start',game});assert.deepEqual((await p.guest.next('start')).game,game);await p.host.next('start');
 p.host.send({t:'loaded',epoch:game.epoch,frame:0});p.guest.send({t:'loaded',epoch:game.epoch,frame:0});
 await p.host.next('begin');await p.guest.next('begin');return game;
}
async function refusal(url,requestOrigin,options={}){
 return new Promise((resolve,reject)=>{
  const ws=new WebSocket(url,{...(requestOrigin===undefined?{}:{origin:requestOrigin}),...options});ws.on('error',()=>{});
  ws.on('unexpected-response',(_,res)=>{res.resume();resolve(res.statusCode);ws.terminate();});ws.on('open',()=>{ws.terminate();reject(Error('Disallowed handshake accepted'));});
 });
}

test('actual relay sockets create/join/ready/start and forward assigned guest identity',async t=>{
 const f=await fixture(t),p=await party(f),game=await start(p);
 p.guest.send({t:'up',epoch:game.epoch,data:{move:[127,0],moveSeq:1}});
 assert.deepEqual(await p.host.next('up'),{t:'up',epoch:game.epoch,hero:1,data:{move:[127,0],moveSeq:1}});
 const data={from:1,upTo:2,events:[{frame:1,hero:0,move:[127,0]},{frame:1,hero:1,move:[0,-127]}],hash:[2,123]};
 p.host.send({t:'down',epoch:game.epoch,data});assert.deepEqual(await p.guest.next('down'),{t:'down',epoch:game.epoch,data});
 p.guest.send({t:'down',epoch:game.epoch,data});assert.equal((await p.guest.next('error')).code,'notHost');
});
test('room/build/ready/roster boundaries refuse starts and do not alter another loadout',async t=>{
 const f=await fixture(t),p=await party(f),third=await f.client();
 third.send({t:'join',code:p.room.code,identity:{...identity,build:'another-build'},me:loadout('Other')});assert.equal((await third.next('error')).code,'versionMismatch');
 third.send({t:'join',code:p.room.code,identity,me:loadout('Other')});assert.equal((await third.next('error')).code,'roomFull');
 const game={...settings,epoch:p.room.epoch,ground:'165cf2df',seed:711,players:p.room.members.map(({id,loadout})=>({id,loadout}))};
 p.guest.send({t:'start',game});assert.equal((await p.guest.next('error')).code,'notHost');
 p.host.send({t:'start',game});assert.equal((await p.host.next('error')).code,'notReady');
 p.host.send({t:'ready',ready:true});p.guest.send({t:'ready',ready:true});await p.host.next('room',m=>m.members.length===2&&m.members.every(p=>p.ready));
 const altered=structuredClone(game);altered.players[1].loadout.meta.combat=5;
 p.host.send({t:'start',game:altered});assert.equal((await p.host.next('error')).code,'rosterMismatch');
 p.host.send({t:'start',game});await p.guest.next('start');
 p.guest.send({t:'loaded',epoch:game.epoch,frame:1});assert.equal((await p.guest.next('error')).code,'invalidFrame');
 p.host.send({t:'down',epoch:game.epoch,data:{from:1,upTo:1,events:[]}});assert.equal((await p.host.next('error')).code,'notRunning');
});
test('upgrade admits only the configured origin and exact relay path',async t=>{
 const f=await fixture(t);
 assert.equal(await refusal(f.url,'https://untrusted.example'),403);assert.equal(await refusal(f.url),403);assert.equal(await refusal(f.url.replace('/coop','/other'),origin),404);
});
test('oversized, binary and malformed messages are closed by the actual transport',async t=>{
 const f=await fixture(t);
 for(const [data,code]of[['x'.repeat(17000),1009],[Buffer.from('{}'),1008],['{',1008],[JSON.stringify({t:'create',settings,me:{...loadout('Bad'),ticket:'fixture'}}),1008]]){
  const c=await f.client();c.ws.send(data);assert.equal(await c.closed,code);
 }
});
test('the relay bounds message rate and deletes explicitly closed rooms',async t=>{
 const f=await fixture(t,{maxRooms:1}),host=await f.client(),other=await f.client();
 host.send({t:'create',settings,me:loadout('Host')});await host.next('room');
 other.send({t:'create',settings,me:loadout('Other')});assert.equal((await other.next('error')).code,'serverFull');
 host.send({t:'leave'});await host.next('gone');other.send({t:'create',settings,me:loadout('Other')});await other.next('room');
 const spam=await f.client();for(let i=0;i<400;i++)spam.send({t:'ping'});assert.equal(await spam.closed,1008);
});
test('guest reconnect catches up before the host may advance the shared run',async t=>{
 const f=await fixture(t),p=await party(f),game=await start(p);
 p.host.send({t:'down',epoch:game.epoch,data:{from:1,upTo:2,events:[]}});await p.guest.next('down');p.guest.ws.terminate();
 await p.host.next('hold',m=>m.held===true);
 p.host.send({t:'down',epoch:game.epoch,data:{from:3,upTo:4,events:[]}});p.host.send({t:'loaded',epoch:game.epoch,frame:4});
 const guest=await f.client();guest.send({t:'resume',code:p.room.code,token:p.guestSession.token,identity});
 const session=await guest.next('session');assert(session.token!==p.guestSession.token,'resume authority rotates');
 await guest.next('start');assert.equal((await guest.next('resumed')).frame,4);
 guest.send({t:'up',epoch:game.epoch,data:{resend:2}});assert.equal((await p.host.next('up')).data.resend,2);
 p.host.send({t:'down',epoch:game.epoch,data:{from:3,upTo:4,events:[]}});await guest.next('down');
 guest.send({t:'loaded',epoch:game.epoch,frame:4});assert.equal((await p.host.next('begin')).frame,4);await guest.next('begin');
 const stale=await f.client();stale.send({t:'resume',code:p.room.code,token:p.guestSession.token,identity});assert.equal((await stale.next('error')).code,'invalidSession');
 p.host.send({t:'down',epoch:game.epoch,data:{from:5,upTo:6,events:[]}});assert.equal((await guest.next('down')).data.upTo,6);
 guest.send({t:'leave'});assert.equal((await p.host.next('gone')).reason,'playerLeft');
});
test('host loss ends the room rather than silently migrating authority',async t=>{
 const f=await fixture(t),p=await party(f);await start(p);p.host.ws.terminate();assert.equal((await p.guest.next('gone')).reason,'hostLeft');
});
test('a guest missing beyond fifteen seconds releases the room safely',{timeout:22000},async t=>{
 const f=await fixture(t),p=await party(f);await start(p);p.guest.ws.terminate();await p.host.next('hold');
 assert.equal((await p.host.next('gone',()=>true,18000)).reason,'reconnectExpired');
 p.host.send({t:'create',settings,me:loadout('Host')});assert.equal((await p.host.next('room',m=>m.epoch!==p.room.epoch)).members.length,1);
});

test('repeated loaded acknowledgements cannot restart an already running room',async t=>{
 const f=await fixture(t),p=await party(f),game=await start(p);
 p.guest.send({t:'loaded',epoch:game.epoch,frame:0});
 await assert.rejects(p.host.next('begin',()=>true,60),/Relay did not send begin/);
});

test('two actual socket clients keep shared simulations equal through choices and reconnect',async t=>{
 const {createCoopRun}=await import('../src/coop-run.js');
 const f=await fixture(t),p=await party(f),game=await start(p,'0'),ended=[];let guestSocket=p.guest;
 const host=createCoopRun({start:game,localId:'p1',ground:null,send:m=>p.host.send(m),onEnd:r=>ended.push(r)}),guest=createCoopRun({start:game,localId:'p2',ground:null,send:m=>guestSocket.send(m),onEnd:r=>ended.push(r)});
 host.begin(0);guest.begin(0);const initial=host.sim.players.map(p=>({x:p.x,z:p.z}));host.input(1,0);guest.input(0,1);host.accept(await p.host.next('up'));
 const batch=async()=>{host.advance();host.advance();guest.accept((await guestSocket.next('down')).data);assert.equal(host.hash(),guest.hash());};
 for(let i=0;i<30;i++)await batch();assert.equal(guest.frame,60);assert(host.sim.players[0].x-initial[0].x>5);assert(guest.sim.players[1].z-initial[1].z>5);
 for(const d of [host,guest]){const s=d.sim,a=s.players[0];s.gems.push({id:s.nextId++,x:a.x,z:a.z,v:s.xpNeed,vx:0,vz:0});}
 await batch();assert(host.sim.pending.p1&&host.sim.pending.p2);
 const choices=[host.sim.pending.p1.choices[0],host.sim.pending.p2.choices[2]];host.action({kind:'choose',index:0},host.decision('p1'));guest.action({kind:'choose',index:2},guest.decision('p2'));host.accept(await p.host.next('up'));await batch();assert.equal(Object.keys(host.sim.pending).length,0);for(const[i,c]of choices.entries())assert.equal(host.sim.players[i][c.kind==='weapon'?'weapons':'passives'][c.id],c.level);
 guestSocket.ws.terminate();await p.host.next('hold');host.hold();guest.hold();const at=host.frame;assert.equal(host.advance(),false);
 guestSocket=await f.client();guestSocket.send({t:'resume',code:p.room.code,token:p.guestSession.token,identity});await guestSocket.next('session');await guestSocket.next('start');
 const resumed=await guestSocket.next('resumed');guest.recover(resumed.frame);host.accept(await p.host.next('up'));guest.accept((await guestSocket.next('down')).data);
 host.begin((await p.host.next('begin')).frame);guest.begin((await guestSocket.next('begin')).frame);await batch();assert.equal(guest.frame,at+2);assert.deepEqual(ended,[]);
});


test('proxied clients retain per-client capacity rather than sharing the proxy socket address',async t=>{
 const f=await fixture(t,{loopbackProxy:true});for(let i=0;i<16;i++)await f.client({'X-Real-IP':'192.0.2.1'});assert.equal(await refusal(f.url,origin,{headers:{'X-Real-IP':'192.0.2.1'}}),429);const another=await f.client({'X-Real-IP':'192.0.2.2'});another.send({t:'create',settings,me:loadout('Other address')});assert.equal((await another.next('room')).you,'p1');
});
test('direct clients cannot bypass socket-address limits with forwarded headers',async t=>{
 const f=await fixture(t);for(let i=0;i<16;i++)await f.client({'X-Real-IP':`192.0.2.${i+1}`});assert.equal(await refusal(f.url,origin,{headers:{'X-Real-IP':'198.51.100.1','X-Forwarded-For':'198.51.100.1'}}),429);
});
test('proxy mode refuses missing or malformed client identity and non-proxy peers',async t=>{
 const f=await fixture(t,{loopbackProxy:true});for(const ip of [undefined,'not-an-ip','192.0.2.1, 192.0.2.2',['192.0.2.1','192.0.2.2']])assert.equal(await refusal(f.url,origin,{headers:ip===undefined?{}:{'X-Real-IP':ip}}),400);assert.equal(await refusal(f.url,origin,{localAddress:'127.0.0.2',headers:{'X-Real-IP':'192.0.2.1'}}),403);
});
test('proxy mode still bounds total socket capacity across many client addresses',async t=>{
 const f=await fixture(t,{loopbackProxy:true});for(let i=0;i<128;i++)await f.client({'X-Real-IP':`192.0.2.${1+Math.floor(i/16)}`});assert.equal(await refusal(f.url,origin,{headers:{'X-Real-IP':'198.51.100.1'}}),429);
});

test('the configured fragment limit closes a fragmented message before JSON handling',async t=>{
 const f=await fixture(t),c=await f.client(),result=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('fragment boundary did not respond')),2000);c.ws.once('message',raw=>{clearTimeout(timer);resolve({reply:JSON.parse(String(raw)).t});});c.ws.once('close',code=>{clearTimeout(timer);resolve({close:code});});});const text=' '.repeat(130)+'{"t":"ping"}';for(let i=0;i<text.length;i++)c.ws.send(text[i],{fin:i===text.length-1});assert.deepEqual(await result,{close:1008});
});


test('partial guest resume keeps the original recovery deadline through repeated socket loss',{timeout:24000},async t=>{
 await Promise.all([false,true].map(async repeat=>{
  const f=await fixture(t),p=await party(f),game=await start(p);const began=Date.now();p.guest.ws.terminate();await p.host.next('hold');p.host.send({t:'loaded',epoch:game.epoch,frame:0});await new Promise(r=>setTimeout(r,1000));let guest=await f.client();guest.send({t:'resume',code:p.room.code,token:p.guestSession.token,identity});let session=await guest.next('session');await guest.next('resumed');
  if(repeat){await new Promise(r=>setTimeout(r,3500));guest.ws.terminate();await p.host.next('hold');p.host.send({t:'loaded',epoch:game.epoch,frame:0});guest=await f.client();guest.send({t:'resume',code:p.room.code,token:session.token,identity});await guest.next('session');await guest.next('resumed');}
  const gone=await p.host.next('gone',()=>true,16500-(Date.now()-began));assert.equal(gone.reason,'reconnectExpired');assert(Date.now()-began>=14800&&Date.now()-began<16500,'one original grace window');
 }));
});

test('successful catch-up clears the old deadline and a later loss gets its own grace',{timeout:27000},async t=>{
 const f=await fixture(t),p=await party(f),game=await start(p);p.guest.ws.terminate();await p.host.next('hold');p.host.send({t:'loaded',epoch:game.epoch,frame:0});await new Promise(r=>setTimeout(r,4000));let guest=await f.client();guest.send({t:'resume',code:p.room.code,token:p.guestSession.token,identity});await guest.next('session');await guest.next('resumed');guest.send({t:'loaded',epoch:game.epoch,frame:0});await guest.next('begin');await p.host.next('begin');const began=Date.now();guest.ws.terminate();await p.host.next('hold');const gone=await p.host.next('gone',()=>true,17500);assert.equal(gone.reason,'reconnectExpired');assert(Date.now()-began>=14800,'old cleared timer must not end a new recovery early');
});

test('catch-up acknowledgements behind the final host flush cannot end or begin a room',async t=>{
 const f=await fixture(t),p=await party(f),game=await start(p,'0');p.host.send({t:'down',epoch:game.epoch,data:{from:1,upTo:30,events:[]}});await p.guest.next('down');p.guest.ws.terminate();await p.host.next('hold');
 const guest=await f.client();guest.send({t:'resume',code:p.room.code,token:p.guestSession.token,identity});await guest.next('session');assert.equal((await guest.next('resumed')).frame,30);
 p.host.send({t:'down',epoch:game.epoch,data:{from:31,upTo:31,events:[]}});p.host.send({t:'loaded',epoch:game.epoch,frame:31});await guest.next('down');guest.send({t:'loaded',epoch:game.epoch,frame:30});
 await assert.rejects(guest.next('error',()=>true,60),/Relay did not send error/);await assert.rejects(p.host.next('begin',()=>true,60),/Relay did not send begin/);
 for(const frame of [32,-1,1.5,4294967296,null]){guest.send({t:'loaded',epoch:game.epoch,frame});assert.equal((await guest.next('error')).code,'invalidFrame');}
 await assert.rejects(p.host.next('begin',()=>true,60),/Relay did not send begin/);guest.send({t:'loaded',epoch:game.epoch,frame:31});assert.equal((await p.host.next('begin')).frame,31);await guest.next('begin');
 p.host.send({t:'down',epoch:game.epoch,data:{from:32,upTo:33,events:[]}});await guest.next('down');guest.send({t:'loaded',epoch:game.epoch,frame:31});await assert.rejects(guest.next('error',()=>true,60),/Relay did not send error/);await assert.rejects(p.host.next('begin',()=>true,60),/Relay did not send begin/);
});

for(const retained of ['original','pending'])test('interrupted resume can retry the '+retained+' token until an acknowledged recovery',async t=>{
 const f=await fixture(t),p=await party(f),game=await start(p,'0');p.host.send({t:'down',epoch:game.epoch,data:{from:1,upTo:2,events:[]}});await p.guest.next('down');p.guest.ws.terminate();await p.host.next('hold');p.host.send({t:'loaded',epoch:game.epoch,frame:2});
 let guest=await f.client();guest.send({t:'resume',code:p.room.code,token:p.guestSession.token,identity});const pending=await guest.next('session');await guest.next('resumed');assert.notEqual(pending.token,p.guestSession.token);
 const competing=await f.client();for(const token of [p.guestSession.token,pending.token]){competing.send({t:'resume',code:p.room.code,token,identity});assert.equal((await competing.next('error')).code,'invalidSession');}competing.ws.terminate();
 guest.send({t:'loaded',epoch:game.epoch,frame:3});assert.equal((await guest.next('error')).code,'invalidFrame');guest.send({t:'loaded',epoch:game.epoch,frame:1});await assert.rejects(guest.next('error',()=>true,60),/Relay did not send error/);guest.ws.terminate();await p.host.next('hold');p.host.send({t:'loaded',epoch:game.epoch,frame:2});
 const incompatible=await f.client();incompatible.send({t:'resume',code:p.room.code,token:pending.token,identity:{...identity,build:'old'}});assert.equal((await incompatible.next('error')).code,'versionMismatch');incompatible.ws.terminate();
 guest=await f.client();guest.send({t:'resume',code:p.room.code,token:retained==='original'?p.guestSession.token:pending.token,identity});const retry=await guest.next('session');await guest.next('resumed');assert.equal(retry.token,pending.token,'only one pending token survives incomplete recovery');guest.send({t:'loaded',epoch:game.epoch,frame:2});await guest.next('begin');await p.host.next('begin');
 guest.ws.terminate();await p.host.next('hold');p.host.send({t:'loaded',epoch:game.epoch,frame:2});const stale=await f.client();stale.send({t:'resume',code:p.room.code,token:p.guestSession.token,identity});assert.equal((await stale.next('error')).code,'invalidSession');stale.ws.terminate();
 const next=await f.client();next.send({t:'resume',code:p.room.code,token:pending.token,identity});const rotated=await next.next('session');assert.notEqual(rotated.token,pending.token);await next.next('resumed');next.send({t:'loaded',epoch:game.epoch,frame:2});await next.next('begin');await p.host.next('begin');
});
