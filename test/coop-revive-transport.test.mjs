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
test('actual private relay carries stationary guest assistance and revives the host without reconnecting',async t=>{
 const f=await fixture(t),p=await party(f);await start(p);const host=p.host.client.run,guest=p.guest.client.run;await wait(()=>host.frame===guest.frame);
 for(const run of [host,guest]){const sim=run.sim;sim.spawnAcc=-1e9;sim.bossIndex=99;sim.eventT=sim.shrineT=1e9;sim.enemies=[];for(const [i,hero]of sim.players.entries()){hero.x=365.5+i;hero.z=300.5;hero.weapons={};}sim.players[0].hp=0;sim.players[0].alive=false;}
 const ws=p.guest.sockets[0],send=ws.send.bind(ws);let assists=0;ws.send=(text,...rest)=>{const m=JSON.parse(text);if(m.t==='up'&&m.data?.assist){assists++;assert.deepEqual(m.data.move,[0,0]);}return send(text,...rest);};
 assert(guest.input(0,0,false,true));await wait(()=>host.sim.players[0].alive&&guest.sim.players[0].alive,5000);guest.resetInput();await wait(()=>host.frame===guest.frame);assert.equal(host.hash(),guest.hash());assert.equal(host.sim.players[0].revives,0);assert(host.sim.players[0].hp>=30&&host.sim.players[0].hp<=31);assert(assists>=10&&assists<=25,'bounded stationary assist keepalives');assert.equal(p.host.runs.length,1);assert.equal(p.guest.runs.length,1);assert.equal(p.host.sockets.length,1);assert.equal(p.guest.sockets.length,1);assert.deepEqual(p.host.ends,[]);assert.deepEqual(p.guest.ends,[]);t.diagnostic(JSON.stringify({assists,matchingFrame:host.frame,privateLoopback:true,syntheticFatalState:true}));
});
