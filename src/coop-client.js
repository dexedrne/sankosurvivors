import {COOP_PROTOCOL,COOP_HZ,cleanLoadout,cleanRoomSettings,roomSettings,cleanStart,prepareStart,cleanUp,cleanDown} from './coop-protocol.js';
import {createCoopRun} from './coop-run.js';
const keys=(v,list)=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(k=>list.includes(k));
const uint=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
const invite=v=>typeof v==='string'&&/^[A-HJ-NP-Z2-9]{6}$/.test(v);
const epoch=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{16,64}$/.test(v);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const errors=['invalidMessage','alreadyJoined','serverFull','roomMissing','versionMismatch','alreadyStarted','roomFull','invalidSession','notJoined','notHost','notReady','invalidStart','rosterMismatch','staleRun','invalidFrame','notRunning','waiting'];
const endings=['hostLeft','playerLeft','reconnectExpired','historyExpired','loadTimeout','idle','ended','serverClosed','left'];

// Socket authority is visit-only; no token, peer profile or credentials enter storage or callbacks.
export function createCoopClient({url,identity,load,onRoom=()=>{},onRun=()=>{},onStatus=()=>{},onEnd=()=>{},createSocket=url=>new WebSocket(url),events=globalThis}){
 let endpoint;try{endpoint=new URL(url);}catch{throw Error('Invalid co-op relay');}
 if(!['ws:','wss:'].includes(endpoint.protocol)||endpoint.username||endpoint.password||endpoint.search||endpoint.hash||endpoint.pathname!=='/coop'||endpoint.protocol==='ws:'&&!['127.0.0.1','localhost','[::1]'].includes(endpoint.hostname))throw Error('Invalid co-op relay');
 if(!keys(identity,['protocol','build','sim'])||!cleanRoomSettings({...identity,map:'greentown',hard:false,endless:false})||typeof load!=='function')throw Error('Invalid co-op identity or loader');
 identity={...identity};
 let socket=null,generation=0,hello=false,stopped=false,intent=null,room=null,session=null,game=null,run=null,loading=false,recovering=false,request=null;
 let retryTimer=null,handshakeTimer=null,recoveryTimer=null,tick=null,worker=null,lastProgress=0,lastTick=0,carry=0,stallGrace=false;
 const status=value=>{if(!stopped)onStatus(value);};
 function send(value){
  if(stopped||!socket||socket.readyState!==1||!hello)return false;
  if(socket.bufferedAmount>131072){finish('connectionSlow');return false;}
  try{socket.send(JSON.stringify(value));return true;}catch{finish('connectionLost');return false;}
 }
 function neutral(){run?.resetInput();}
 function stopTick(){clearInterval(tick);tick=null;if(worker){worker.onmessage=worker.onerror=null;worker.terminate();worker=null;}}
 function startTick(callback){
  if(stopped)return;
  const fallback=()=>{stopTick();tick=setInterval(callback,1000/COOP_HZ);tick?.unref?.();};
  try{
   const current=worker=new Worker(new URL('./coop-ticker-worker.js',import.meta.url),{type:'module'});
   current.onmessage=()=>{if(worker===current&&!stopped)callback();};
   current.onerror=event=>{event.preventDefault?.();if(worker===current&&!stopped)fallback();};
   current.postMessage(1000/COOP_HZ);
  }catch{fallback();}
 }
 function finish(reason){
  if(stopped)return;stopped=true;clearTimeout(retryTimer);clearTimeout(handshakeTimer);clearTimeout(recoveryTimer);stopTick();
  events.removeEventListener?.('blur',neutral,true);events.removeEventListener?.('visibilitychange',neutral,true);
  if(socket?.readyState===1)try{socket.send(JSON.stringify(run?.host&&reason==='complete'?{t:'end',epoch:game.epoch}:{t:'leave'}));}catch{}
  generation++;socket?.close();socket=null;session=null;intent=null;run?.close(reason);onEnd(reason,run);
 }
 function readRoom(value){
  if(!keys(value,['t','code','epoch','you','hostId','settings','started','members'])||!session||value.code!==session.code||value.epoch!==session.epoch||value.you!==session.you||value.hostId!=='p1'||typeof value.started!=='boolean'||!Array.isArray(value.members)||value.members.length<1||value.members.length>2)return null;
  const settings=cleanRoomSettings(value.settings);if(!settings||!['protocol','build','sim'].every(k=>settings[k]===identity[k]))return null;
  const members=[];for(let i=0;i<value.members.length;i++){const m=value.members[i],loadout=cleanLoadout(m?.loadout);if(!keys(m,['id','loadout','ready','connected'])||m.id!==`p${i+1}`||!loadout||typeof m.ready!=='boolean'||typeof m.connected!=='boolean')return null;members.push({id:m.id,loadout,ready:m.ready,connected:m.connected});}
  if(!members.some(m=>m.id===value.you))return null;
  return {code:value.code,epoch:value.epoch,you:value.you,hostId:'p1',settings,started:value.started,members};
 }
 async function startGame(value){
  const next=cleanStart(value),expected=room&&next&&prepareStart({...next,players:room.members.map(({id,loadout})=>({id,loadout}))});
  if(!next||!expected||!session||next.epoch!==session.epoch||!same(next.players,expected.players)||!same(roomSettings(next),room.settings)){finish('invalidStart');return;}
  if(game){if(!same(game,next))finish('invalidStart');return;}
  game=next;request=null;loading=true;status('loading');
  try{
   const ground=await load(structuredClone(game));if(stopped||game!==next)return;
   run=createCoopRun({start:game,localId:session.you,ground,send,onEnd:finish});loading=false;
   onRun(run,structuredClone(game),session.you);if(stopped)return;
   send({t:'loaded',epoch:game.epoch,frame:0});lastProgress=performance.now();lastTick=performance.now();
   startTick(()=>{
    const now=performance.now(),elapsed=now-lastTick;lastTick=now;
    if(stopped||!run||run.held){carry=0;return;}
    try{if(run.host){
     // Catch short render stalls without fast-forwarding long background gaps or reward timers.
     carry+=Math.max(0,Math.min(250,elapsed));let steps=0;
     while(carry>=1000/COOP_HZ&&steps++<8&&!run.closed){run.advance();carry-=1000/COOP_HZ;}
    }else{run.flushInput();
     // A resumed timer can precede queued socket events; grant grace once per real progress.
     if(elapsed>1000&&!stallGrace){lastProgress=now;stallGrace=true;}if(now-lastProgress>15000)finish('hostStalled');}}catch{finish('invalidState');}
   });
  }catch{finish('loadFailed');}
 }
 function message(text,current){
  if(stopped||current!==generation)return;
  if(typeof text!=='string'||text.length>32768){finish('invalidMessage');return;}
  let v;try{v=JSON.parse(text);}catch{finish('invalidMessage');return;}
  if(!v||typeof v.t!=='string'){finish('invalidMessage');return;}
  if(v.t==='hello'){
   if(hello||!keys(v,['t','protocol'])||v.protocol!==COOP_PROTOCOL){finish('versionMismatch');return;}
   hello=true;clearTimeout(handshakeTimer);
   if(recovering)send({t:'resume',code:session.code,token:session.token,identity});
   else if(intent){send(intent);intent=null;}return;
  }
  if(!hello){finish('invalidMessage');return;}
  if(v.t==='session'){
   if(!keys(v,['t','code','epoch','you','token'])||!invite(v.code)||!epoch(v.epoch)||!['p1','p2'].includes(v.you)||typeof v.token!=='string'||!/^[0-9a-f]{64}$/.test(v.token)||session&&(v.code!==session.code||v.epoch!==session.epoch||v.you!==session.you)){finish('invalidMessage');return;}
   session={code:v.code,epoch:v.epoch,you:v.you,token:v.token};return;
  }
  if(v.t==='room'){
   const clean=readRoom(v);if(!clean){finish('invalidMessage');return;}room=clean;if(request==='enter')request=null;onRoom(structuredClone(room));if(!game&&!recovering)status('lobby');return;
  }
  if(v.t==='error'){
   if(!keys(v,['t','code','message'])||!errors.includes(v.code)||typeof v.message!=='string'||v.message.length>180){finish('invalidMessage');return;}
   if(game||recovering){if(!['waiting','staleRun'].includes(v.code))finish(v.code==='invalidSession'?'reconnectExpired':v.code);}else{request=null;status(v.code);}return;
  }
  if(v.t==='start'){if(!keys(v,['t','game']))finish('invalidMessage');else void startGame(v.game);return;}
  if(!session||v.epoch!==session.epoch)return;
  if(v.t==='gone'){
   if(!keys(v,['t','epoch','reason'])||!endings.includes(v.reason)){finish('invalidMessage');return;}finish(v.reason);return;
  }
  if(!run){finish('invalidMessage');return;}
  if(v.t==='begin'){
   if(!keys(v,['t','epoch','frame'])||!uint(v.frame)){finish('invalidMessage');return;}
   if(run.begin(v.frame)){lastTick=performance.now();carry=0;recovering=false;clearTimeout(recoveryTimer);lastProgress=performance.now();stallGrace=false;status('playing');}return;
  }
  if(v.t==='hold'){
   if(!keys(v,['t','epoch','held','frame'])||v.held!==true||!uint(v.frame)){finish('invalidMessage');return;}run.hold();status('waiting');return;
  }
  if(v.t==='resumed'){
   if(!keys(v,['t','epoch','frame'])||!recovering||run.host||!uint(v.frame)){finish('invalidMessage');return;}status('catchingUp');run.recover(v.frame);return;
  }
  if(v.t==='up'){
   if(!keys(v,['t','epoch','hero','data'])||!run.host||v.hero!==1||!cleanUp(v.data)){finish('invalidMessage');return;}run.accept({hero:1,data:v.data});return;
  }
  if(v.t==='down'){
   if(!keys(v,['t','epoch','data'])||run.host||!cleanDown(v.data)){finish('invalidMessage');return;}const before=run.frame;if(run.accept(v.data)&&run.frame>before){lastProgress=performance.now();stallGrace=false;}return;
  }
  finish('invalidMessage');
 }
 function connect(){
  if(stopped)return;const current=++generation;hello=false;status(recovering?'reconnecting':'connecting');
  let ws;try{socket=ws=createSocket(endpoint.href);}catch{finish('connectionFailed');return;}
  handshakeTimer=setTimeout(()=>{if(current===generation)finish('connectionFailed');},10000);handshakeTimer.unref?.();
  ws.addEventListener('message',e=>{try{message(e.data,current);}catch{finish('invalidMessage');}});
  ws.addEventListener('error',()=>{});
  ws.addEventListener('close',()=>{
   if(stopped||current!==generation)return;socket=null;clearTimeout(handshakeTimer);
   if(run&&!run.host&&!run.closed&&session){
    run.hold();if(!recovering){recovering=true;recoveryTimer=setTimeout(()=>finish('reconnectExpired'),10000);recoveryTimer.unref?.();}status('reconnecting');retryTimer=setTimeout(connect,250);retryTimer.unref?.();
   }else finish('connectionLost');
  });
 }
 function enter(value){if(stopped||room||run||loading||request)return false;request='enter';if(socket?.readyState===1&&hello){if(send(value))return true;request=null;return false;}intent=value;connect();return true;}
 events.addEventListener?.('blur',neutral,true);events.addEventListener?.('visibilitychange',neutral,true);
 return {
  get room(){return room?structuredClone(room):null;},get run(){return run;},get localId(){return session?.you||null;},get closed(){return stopped;},
  create(settings,me){const clean=cleanRoomSettings({...settings,...identity}),loadout=cleanLoadout(me);if(!clean||!loadout)return false;return enter({t:'create',settings:clean,me:loadout});},
  join(code,me){code=typeof code==='string'?code.trim().toUpperCase():'';const loadout=cleanLoadout(me);if(!invite(code)||!loadout)return false;return enter({t:'join',code,identity,me:loadout});},
  ready(ready){return typeof ready==='boolean'&&!!room&&!game&&!request&&send({t:'ready',ready});},
  start(value){if(!keys(value,['ground','seed']))return false;const {ground,seed}=value;if(stopped||!room||room.you!=='p1'||game||request||!room.members.every(m=>m.ready&&m.connected)||room.members.length!==2)return false;const next=prepareStart({...room.settings,epoch:room.epoch,ground,seed,players:room.members.map(({id,loadout})=>({id,loadout}))});if(!next)return false;request='start';if(send({t:'start',game:next})){status('starting');return true;}request=null;return false;},
  close(){finish('left');},
 };
}
