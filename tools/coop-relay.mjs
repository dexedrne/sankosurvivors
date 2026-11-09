// Invite-room transport only. No wallet, save, database or game simulation access.
import {createServer} from 'node:http';
import {isIP} from 'node:net';
import {randomBytes,randomInt,timingSafeEqual} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {realpathSync} from 'node:fs';
import WebSocket from 'ws';
import {COOP_PROTOCOL,COOP_HISTORY,cleanLoadout,cleanRoomSettings,roomSettings,cleanStart,prepareStart,cleanUp,cleanDown} from '../src/coop-protocol.js';
const own=(value,names)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(k=>names.includes(k));
const uint=value=>Number.isInteger(value)&&value>=0&&value<=0xffffffff;
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const code=()=>Array.from({length:6},()=>alphabet[randomInt(alphabet.length)]).join('');
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

export function createCoopRelay({server,origins,maxRooms=64,loopbackProxy=false}){
 if(typeof loopbackProxy!=='boolean'||!server?.on||!Array.isArray(origins)||!origins.length||origins.some(o=>typeof o!=='string'||new URL(o).origin!==o)||!Number.isInteger(maxRooms)||maxRooms<1||maxRooms>256)throw Error('Invalid relay configuration');
 const allowed=new Set(origins),rooms=new Map(),clients=new Set(),attempts=new Map();let closing=false;
 const wss=new WebSocket.Server({noServer:true,maxPayload:16384,perMessageDeflate:false,maxFragments:128,maxBufferedChunks:256});
 const globalBytes={n:2097152,at:Date.now()};
 function take(bucket,cost,capacity,perSecond){const now=Date.now();bucket.n=Math.min(capacity,bucket.n+(now-bucket.at)*perSecond/1000);bucket.at=now;if(bucket.n<cost)return false;bucket.n-=cost;return true;}
 function send(c,message){
  if(!c||c.ws.readyState!==WebSocket.OPEN)return;
  if(c.ws.bufferedAmount>131072){c.ws.close(1013,'Connection too slow');return;}
  c.ws.send(JSON.stringify(message),error=>{if(error)c.ws.terminate();});
 }
 const fail=(c,code,message)=>send(c,{t:'error',code,message});
 const bad=c=>{fail(c,'invalidMessage','Invalid co-op message.');c.ws.close(1008,'Invalid message');};
 function view(r,c){return {t:'room',code:r.code,epoch:r.epoch,you:c.member.id,hostId:'p1',settings:r.settings,started:!!r.game,members:r.members.map(m=>({id:m.id,loadout:m.loadout,ready:m.ready,connected:!!m.c}))};}
 const broadcast=(r,message)=>{for(const m of r.members)send(m.c,message);};
 const roomView=r=>{for(const m of r.members)if(m.c)send(m.c,view(r,m.c));};
 function session(r,m){send(m.c,{t:'session',code:r.code,epoch:r.epoch,you:m.id,token:m.pendingToken||m.token});}
 function closeRoom(r,reason){
  if(!rooms.delete(r.code))return;
  clearTimeout(r.loading);
  for(const m of r.members){clearTimeout(m.timer);const c=m.c;if(c){c.room=null;c.member=null;send(c,{t:'gone',epoch:r.epoch,reason});}}
 }
 function joined(r,c,loadout){
  const m={id:`p${r.members.length+1}`,loadout,ready:false,loaded:false,c,token:randomBytes(32).toString('hex')};
  r.members.push(m);c.room=r;c.member=m;session(r,m);roomView(r);
 }
 function begin(r){
  if(!r.game||r.running&&!r.held||!r.members.every(m=>m.c&&m.loaded))return;
  clearTimeout(r.loading);for(const m of r.members){clearTimeout(m.timer);m.timer=null;}r.running=true;r.held=false;broadcast(r,{t:'begin',epoch:r.epoch,frame:r.frame});
 }
 function left(c,explicit=false){
  const r=c.room,m=c.member;if(!r||!m)return;
  c.room=null;c.member=null;m.c=null;m.loaded=false;
  if(m.id==='p1'){closeRoom(r,'hostLeft');return;}
  if(explicit&&r.game){closeRoom(r,'playerLeft');return;}
  if(!r.game){r.members.splice(r.members.indexOf(m),1);for(const p of r.members)p.ready=false;roomView(r);return;}
  r.held=true;r.holdFrom=r.frame;for(const p of r.members)p.loaded=false;
  broadcast(r,{t:'hold',epoch:r.epoch,held:true,frame:r.frame});roomView(r);
  if(!m.timer){m.timer=setTimeout(()=>closeRoom(r,'reconnectExpired'),15000);m.timer.unref();}
 }
 function identity(value,r){return own(value,['protocol','build','sim'])&&['protocol','build','sim'].every(k=>value[k]===r.settings[k]);}
 function message(c,data){
  if(typeof data!=='string'){bad(c);return;}
  const bytes=Buffer.byteLength(data);
  if(!take(c.messages,1,120,60)||!take(c.bytes,bytes,131072,65536)||!take(globalBytes,bytes,2097152,2097152)){c.ws.close(1008,'Rate limit');return;}
  let v;try{v=JSON.parse(data);}catch{bad(c);return;}
  if(!own(v,['t','settings','me','code','identity','token','ready','game','epoch','frame','data'])||typeof v.t!=='string'){bad(c);return;}
  c.active=Date.now();const r=c.room,m=c.member;
  if(v.t==='ping'&&own(v,['t'])){send(c,{t:'pong'});return;}
  if(v.t==='create'){
   if(!own(v,['t','settings','me'])){bad(c);return;}
   const settings=cleanRoomSettings(v.settings),me=cleanLoadout(v.me);if(!settings||!me){bad(c);return;}
   if(r){fail(c,'alreadyJoined','Leave the current room first.');return;}
   if(rooms.size>=maxRooms){fail(c,'serverFull','The relay is full. Try again shortly.');return;}
   let invite;do{invite=code();}while(rooms.has(invite));
   const room={code:invite,epoch:randomBytes(16).toString('hex'),settings,members:[],game:null,frame:0,running:false,held:false,active:Date.now()};rooms.set(invite,room);joined(room,c,me);return;
  }
  if(v.t==='join'){
   if(!own(v,['t','code','identity','me'])||typeof v.code!=='string'||!/^[A-HJ-NP-Z2-9]{6}$/.test(v.code)){bad(c);return;}
   const me=cleanLoadout(v.me);if(!me){bad(c);return;}
   if(r){fail(c,'alreadyJoined','Leave the current room first.');return;}
   const room=rooms.get(v.code);if(!room){fail(c,'roomMissing','Room not found. Check the invite code.');return;}
   if(!identity(v.identity,room)){fail(c,'versionMismatch','Both players need the same game version.');return;}
   if(room.game){fail(c,'alreadyStarted','This run has already started.');return;}
   if(room.members.length>=2){fail(c,'roomFull','This room already has two players.');return;}
   joined(room,c,me);return;
  }
  if(v.t==='resume'){
   if(!own(v,['t','code','token','identity'])||r||typeof v.code!=='string'||typeof v.token!=='string'||!/^[0-9a-f]{64}$/.test(v.token)){bad(c);return;}
   const room=rooms.get(v.code),member=room?.members.find(p=>[p.token,room.held&&p.pendingToken].some(token=>token&&timingSafeEqual(Buffer.from(token,'hex'),Buffer.from(v.token,'hex'))));
   if(!room?.game||!member||member.c){fail(c,'invalidSession','This connection can no longer resume.');return;}
   if(!identity(v.identity,room)){fail(c,'versionMismatch','Both players need the same game version.');return;}
   // Keep one pending rotation until loaded acknowledges receipt, within the original recovery deadline.
   member.c=c;member.loaded=false;member.pendingToken||=randomBytes(32).toString('hex');c.room=room;c.member=member;
   session(room,member);roomView(room);send(c,{t:'start',game:room.game});send(c,{t:'resumed',epoch:room.epoch,frame:room.frame});return;
  }
  if(!r||!m){fail(c,'notJoined','Create or join a room first.');return;}
  r.active=Date.now();
  if(v.t==='leave'&&own(v,['t'])){send(c,{t:'gone',epoch:r.epoch,reason:'left'});left(c,true);return;}
  if(v.t==='ready'&&own(v,['t','ready'])&&typeof v.ready==='boolean'){
   if(r.game){fail(c,'alreadyStarted','This run has already started.');return;}
   m.ready=v.ready;roomView(r);return;
  }
  if(v.t==='start'&&own(v,['t','game'])){
   if(m.id!=='p1'){fail(c,'notHost','Only the host can start the run.');return;}
   if(r.game){fail(c,'alreadyStarted','This run has already started.');return;}
   if(r.members.length!==2||!r.members.every(p=>p.c&&p.ready)){fail(c,'notReady','Both players must be ready.');return;}
   const game=cleanStart(v.game);if(!game){fail(c,'invalidStart','The map, loadouts or game version could not be verified.');return;}
   if(game.epoch!==r.epoch||!same(roomSettings(game),r.settings)){fail(c,'versionMismatch','Room settings changed. Create a new room.');return;}
   const roster=r.members.map(({id,loadout})=>({id,loadout}));
   // Forced-map gear is stripped on every participant's copy before comparing the roster.
   const expected=prepareStart({...game,players:roster});
   if(!expected||!same(game.players,expected.players)){fail(c,'rosterMismatch','Each player must use their own selected loadout.');return;}
   r.game=game;for(const p of r.members)p.loaded=false;broadcast(r,{t:'start',game});
   r.loading=setTimeout(()=>closeRoom(r,'loadTimeout'),30000);r.loading.unref();return;
  }
  if(typeof v.epoch!=='string'||v.epoch!==r.epoch){fail(c,'staleRun','This message belongs to another run.');return;}
  if(v.t==='loaded'&&own(v,['t','epoch','frame'])){
   if(!r.game||!uint(v.frame)||v.frame>r.frame){fail(c,'invalidFrame','The run is still catching up.');return;}
   // Catch-up checksums may acknowledge a frame before the host's final hold flush.
   if(v.frame<r.frame)return;
   if(m.pendingToken){m.token=m.pendingToken;m.pendingToken=null;}
   m.loaded=true;begin(r);return;
  }
  if(v.t==='up'&&own(v,['t','epoch','data'])){
   if(!r.running||m.id==='p1'){fail(c,'notRunning','Guest input is not available yet.');return;}
   const up=cleanUp(v.data);if(!up){bad(c);return;}
   if(Object.hasOwn(up,'resend')){
    if(up.resend>r.frame){fail(c,'invalidFrame','Invalid recovery frame.');return;}
    if(r.frame-up.resend>COOP_HISTORY){closeRoom(r,'historyExpired');return;}
   }else if(r.held){fail(c,'waiting','Waiting for the other player to reconnect.');return;}
   send(r.members[0].c,{t:'up',epoch:r.epoch,hero:r.members.indexOf(m),data:up});return;
  }
  if(v.t==='down'&&own(v,['t','epoch','data'])){
   if(m.id!=='p1'){fail(c,'notHost','Only the host can send shared frames.');return;}
   if(!r.running){fail(c,'notRunning','Both players must finish loading.');return;}
   const down=cleanDown(v.data);if(!down){bad(c);return;}
   const fresh=down.upTo>r.frame;
   if(fresh&&down.from!==r.frame+1||!fresh&&down.from<Math.max(1,r.frame-COOP_HISTORY+1)){fail(c,'invalidFrame','Shared frames must remain in order.');return;}
   if(fresh&&r.held&&(m.loaded||down.upTo>r.holdFrom+30)){fail(c,'waiting','Waiting for the other player to reconnect.');return;}
   if(fresh){r.frame=down.upTo;if(r.held)for(const p of r.members)if(p!==m)p.loaded=false;}
   for(const p of r.members)if(p!==m)send(p.c,{t:'down',epoch:r.epoch,data:down});return;
  }
  if(v.t==='end'&&own(v,['t','epoch'])&&m.id==='p1'){closeRoom(r,'ended');return;}
  bad(c);
 }
 function upgrade(req,socket,head){
  const reject=status=>{socket.end(`HTTP/1.1 ${status}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);};
  if(closing||req.url!=='/coop'){reject('404 Not Found');return;}
  if(!allowed.has(req.headers.origin)){reject('403 Forbidden');return;}
  let address=req.socket.remoteAddress||'';
  if(loopbackProxy){
   if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(address)){reject('403 Forbidden');return;}
   const forwarded=req.headers['x-real-ip'];
   if(typeof forwarded!=='string'||!isIP(forwarded)){reject('400 Bad Request');return;}
   address=forwarded;
  }
  const now=Date.now(),sameAddress=[...clients].filter(c=>c.address===address).length;
  if(clients.size>=128||sameAddress>=16){reject('429 Too Many Requests');return;}
  let bucket=attempts.get(address);
  if(!bucket){if(attempts.size>=1024){reject('429 Too Many Requests');return;}bucket={n:20,at:now};attempts.set(address,bucket);}
  if(!take(bucket,1,20,1/3)){reject('429 Too Many Requests');return;}
  wss.handleUpgrade(req,socket,head,ws=>{
   const c={ws,address,room:null,member:null,active:now,pong:now,messages:{n:120,at:now},bytes:{n:131072,at:now}};clients.add(c);
   ws.on('error',()=>{});ws.on('pong',()=>{c.pong=Date.now();});
   ws.on('message',data=>message(c,data));ws.on('close',()=>{clients.delete(c);left(c);});send(c,{t:'hello',protocol:COOP_PROTOCOL});
  });
 }
 server.on('upgrade',upgrade);
 const timer=setInterval(()=>{
  const now=Date.now();for(const [address,bucket]of attempts)if(now-bucket.at>120000)attempts.delete(address);
  for(const c of clients){if(now-c.pong>30000||!c.room&&now-c.active>30000)c.ws.terminate();else if(c.ws.readyState===WebSocket.OPEN)c.ws.ping();}
  for(const r of rooms.values())if(!r.game&&now-r.active>600000)closeRoom(r,'idle');
 },10000);timer.unref();
 return {async close(){if(closing)return;closing=true;clearInterval(timer);server.off('upgrade',upgrade);for(const r of [...rooms.values()])closeRoom(r,'serverClosed');for(const c of clients)c.ws.terminate();await new Promise(resolve=>wss.close(resolve));}};
}

// Node resolves the entry module through the deployment current-directory symlink.
let entryUrl;
try{if(process.argv[1])entryUrl=pathToFileURL(realpathSync(process.argv[1])).href;}catch{}
if(import.meta.url===entryUrl){
 const port=Number(process.argv.find(a=>a.startsWith('--port='))?.slice(7)||8787);
 const origin=process.argv.find(a=>a.startsWith('--origin='))?.slice(9)||'https://sankosurvivors.quest';
 if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid relay port');
 const server=createServer({maxHeaderSize:8192,headersTimeout:5000,requestTimeout:10000,connectionsCheckingInterval:1000,keepAliveTimeout:5000},(req,res)=>{
  const health=req.url==='/health',read=req.method==='GET'||req.method==='HEAD',ok=health&&read;
  res.writeHead(health?(read?200:405):404,{'Content-Type':'application/json','Cache-Control':'no-store',...(health&&!read?{'Allow':'GET, HEAD'}:{})});res.end(JSON.stringify({ok,protocol:COOP_PROTOCOL}));
 });
 server.maxConnections=256;
 const relay=createCoopRelay({server,origins:[origin],loopbackProxy:process.argv.includes('--loopback-proxy')});server.listen(port,'127.0.0.1',()=>console.log('Co-op relay listening on loopback port '+port));
 const stop=async()=>{await relay.close();server.close();};process.once('SIGTERM',stop);process.once('SIGINT',stop);
}
