// Host-ordered lockstep adapts RunEscape v0.27 CoopRun/lockstep; see licenses/run-escape.txt.
import {createSim,step,choose,reroll,skipLevel,banish,canBanish,TICK} from './sim.js';
import {MAP_BY_ID} from './content.js';
import {groundHash} from './ground-pack.js';
import {COOP_HISTORY,cleanStart,quantizeMove,cleanAction,cleanUp,cleanDown} from './coop-protocol.js';
const decisionKey=p=>p?JSON.stringify([p.casket?.item||'',p.choices,p.more||0]):'';

// Include full future state; immutable map/ground identity is bound in start, FX and wall caches are not authority.
function stateHash(sim,frame,rngCount,moves,versions,sequences){
 let h=2166136261;const number=new DataView(new ArrayBuffer(8));
 const byte=n=>{h=Math.imul(h^(n&255),16777619)>>>0;};
 const string=s=>{byte(115);for(let i=0;i<s.length;i++){const n=s.charCodeAt(i);byte(n);byte(n>>>8);}byte(0);byte(255);};
 function visit(v){
  if(v===null){byte(0);return;}if(v===undefined){byte(1);return;}
  if(typeof v==='number'){if(!Number.isFinite(v))throw Error('Nonfinite co-op state');byte(110);number.setFloat64(0,v,true);for(let i=0;i<8;i++)byte(number.getUint8(i));return;}
  if(typeof v==='string'){string(v);return;}if(typeof v==='boolean'){byte(v?3:2);return;}
  if(Array.isArray(v)||ArrayBuffer.isView(v)){byte(97);if(ArrayBuffer.isView(v))string(v.constructor.name);visit(v.length);for(const x of v)visit(x);return;}
  byte(111);for(const k of Object.keys(v).sort()){string(k);visit(v[k]);}byte(254);
 }
 const state={};for(const k of Object.keys(sim))if(!['rng','fx','map','ground','_W','_wg'].includes(k))state[k]=sim[k];
 visit([frame,rngCount,moves,versions,sequences,state]);return h>>>0;
}

export function createCoopRun({start,localId,ground,send,onEnd=()=>{}}){
 const game=cleanStart(start);if(!game||!game.players.some(p=>p.id===localId)||(ground?groundHash(ground):'0')!==game.ground)throw Error('Incompatible co-op start');
 const local=game.players.findIndex(p=>p.id===localId),host=local===0;
 const sim=createSim({seed:game.seed,map:MAP_BY_ID[game.map],hard:game.hard,endless:game.endless,ground,coop:true,players:game.players.map(({id,loadout:p})=>({id,name:p.name,adv:p.adv,meta:p.meta,gear:p.gear,gearLv:p.gearLv}))});
 let frame=0,rngCount=0,held=true,closed=false,localSeq=0,moveSeq=0,lastSent=0,gapRequested=-1,recoveryTarget=null,localMove=[0,0];
 const rng=sim.rng;sim.rng=()=>{rngCount++;return rng();};
 const moves=[[0,0],[0,0]],versions=[0,0],sequences=[0,0],moveSequences=[0,0],desired=[null,null],queues=[[],[]],pending=game.players.map(()=>({value:null,key:''})),history=new Map(),checks=new Map();
 const emit=message=>{if(!closed)send({...message,epoch:game.epoch});};
 function close(reason){if(closed)return;closed=true;held=true;for(const q of queues)q.length=0;onEnd(reason);}
 const hash=()=>stateHash(sim,frame,rngCount,moves,versions,sequences);
 function capture(i,bump=true){const p=sim.pending[game.players[i].id]||null,key=decisionKey(p);if(bump&&(p!==pending[i].value||key!==pending[i].key))versions[i]++;pending[i]={value:p,key};}
 function valid(i,action,decision){
  const p=sim.players[i],pend=sim.pending[p.id];if(!p.alive||sim.over)return false;
  if(action.kind==='use')return !Object.keys(sim.pending).length&&(action.index===4?!(p.rollCd>0):action.index<p.belt.length);
  if(!pend||decision!==versions[i])return false;
  if(action.kind==='choose')return !!pend.choices[action.index]&&!pend.choices[action.index].banished;
  if(action.kind==='reroll')return !pend.casket&&p.rerolls>0;
  if(action.kind==='skip')return !pend.casket;
  return action.kind==='banish'&&canBanish(sim,p.id,action.index);
 }
 function apply(event,uses){
  const i=event.hero,p=sim.players[i];
  if(event.move){moves[i]=[...event.move];return true;}
  if(event.leave){p.alive=false;delete sim.pending[p.id];capture(i);return true;}
  if(event.actionSeq<=sequences[i]||!valid(i,event.action,event.decision))return false;
  const a=event.action;let accepted=true;
  if(a.kind==='use')uses[i]=a.index;
  else if(a.kind==='choose')accepted=choose(sim,p.id,a.index);
  else if(a.kind==='reroll')accepted=reroll(sim,p.id);
  else if(a.kind==='skip')accepted=skipLevel(sim,p.id);
  else accepted=banish(sim,p.id,a.index);
  if(!accepted)return false;
  sequences[i]=event.actionSeq;if(i===local)localSeq=Math.max(localSeq,event.actionSeq);if(a.kind!=='use'){versions[i]++;capture(i,false);}return true;
 }
 function simulate(events){
  const uses=[null,null];for(const event of events)if(!apply(event,uses))return false;
  step(sim,Object.fromEntries(game.players.map((p,i)=>[p.id,{mx:moves[i][0]/127,mz:moves[i][1]/127,use:uses[i]}])),TICK);frame++;
  for(let i=0;i<2;i++)capture(i);return true;
 }
 function batch(from,upTo){
  const events=[];for(let f=from;f<=upTo;f++){const entry=history.get(f);if(!entry)return null;events.push(...entry.events);}
  const value={from,upTo,events},sum=history.get(upTo)?.hash;if(sum!==undefined)value.hash=[upTo,sum];return value;
 }
 function flush(){if(!host||frame===lastSent)return;const data=batch(lastSent+1,frame);if(!data){close('historyExpired');return;}emit({t:'down',data});lastSent=frame;}
 function resend(after){
  if(after>frame||after<frame-COOP_HISTORY){close('historyExpired');return false;}
  if(after===frame){if(frame)emit({t:'down',data:batch(frame,frame)});return true;}
  for(let from=after+1;from<=frame;){const upTo=Math.min(frame,from+29,Math.ceil(from/30)*30),data=batch(from,upTo);if(!data){close('historyExpired');return false;}emit({t:'down',data});from=upTo+1;}
  return true;
 }
 function enqueue(i,data){
  if(Object.hasOwn(data,'resend'))return resend(data.resend);
  if(held||closed)return false;
  if(data.move){if(data.moveSeq<=moveSequences[i])return false;moveSequences[i]=data.moveSeq;desired[i]=data.move;return true;}
  if(data.actionSeq<=sequences[i]||queues[i].some(a=>a.actionSeq===data.actionSeq)||queues[i].length>=8||!valid(i,data.action,data.decision))return false;
  queues[i].push(data);return true;
 }
 function accept(value){
  if(closed)return false;
  if(host){if(!value||value.hero!==1)return false;const data=cleanUp(value.data);return data?enqueue(1,data):false;}
  try{
  const down=cleanDown(value);if(!down){close('invalidFrame');return false;}
  if(down.upTo<=frame){
   if(down.hash){const actual=down.upTo===frame?hash():checks.get(down.upTo);if(actual!==undefined&&actual!==down.hash[1]){close('desync');return false;}}
  }else{
   if(down.upTo-frame>COOP_HISTORY){close('historyExpired');return false;}
   if(down.from>frame+1){if(gapRequested!==frame){gapRequested=frame;emit({t:'up',data:{resend:frame}});}return false;}
   let cursor=0;while(cursor<down.events.length&&down.events[cursor].frame<=frame)cursor++;
   while(frame<down.upTo){const events=[];while(cursor<down.events.length&&down.events[cursor].frame===frame+1)events.push(down.events[cursor++]);if(!simulate(events)){close('invalidAction');return false;}if(sim.over&&frame<down.upTo){close('invalidFrame');return false;}}
   gapRequested=-1;
   if(down.hash){const actual=hash();if(actual!==down.hash[1]){close('desync');return false;}checks.set(frame,actual);}
  }
  while(checks.size&&checks.keys().next().value<frame-COOP_HISTORY)checks.delete(checks.keys().next().value);
  if(recoveryTarget!==null&&frame>=recoveryTarget&&down.hash)emit({t:'loaded',frame});
  if(sim.over)close('complete');return true;
  }catch{close('invalidState');return false;}
 }
 function advance(){
  if(!host||closed||held||sim.over)return false;
  const events=[];
  for(let i=0;i<2;i++){
   const move=desired[i];if(move&&(move[0]!==moves[i][0]||move[1]!==moves[i][1]))events.push({frame:frame+1,hero:i,move:[...move]});desired[i]=null;
   while(queues[i].length){const data=queues[i].shift();if(valid(i,data.action,data.decision)&&data.actionSeq>sequences[i]){events.push({frame:frame+1,hero:i,...data});break;}}
  }
  if(!simulate(events)){close('invalidAction');return false;}
  const entry={events};try{if(frame%30===0||sim.over)entry.hash=hash();}catch{close('invalidState');return false;}
  history.set(frame,entry);while(history.size>COOP_HISTORY)history.delete(history.keys().next().value);
  if(frame-lastSent>=2||entry.hash!==undefined||sim.over)flush();if(sim.over)close('complete');return true;
 }
 return {
  sim,accept,advance,hash,close,flush,
  get frame(){return frame;},get closed(){return closed;},get held(){return held;},get host(){return host;},
  decision(id){const i=game.players.findIndex(p=>p.id===id);return i<0?null:versions[i];},
  begin(at){if(closed)return false;if(!held&&at<=frame)return true;if(at!==frame){close('invalidFrame');return false;}held=false;recoveryTarget=null;return true;},
  input(x,z){const move=quantizeMove(x,z);if(!move||held||closed||localMove&&move[0]===localMove[0]&&move[1]===localMove[1])return false;localMove=move;const data={move,moveSeq:++moveSeq};if(host)return enqueue(local,data);emit({t:'up',data});return true;},
  action(value,decision){const action=cleanAction(value);if(!action||held||closed||!valid(local,action,decision))return false;const data={action,actionSeq:++localSeq,...(action.kind==='use'?{}:{decision})};if(host)return enqueue(local,data);emit({t:'up',data});return true;},
  hold(){if(closed)return;held=true;localMove=null;for(let i=0;i<2;i++){queues[i].length=0;desired[i]=[0,0];}if(host){try{if(frame)history.get(frame).hash=hash();}catch{close('invalidState');return;}flush();emit({t:'loaded',frame});}},
  recover(target){if(host||closed||!Number.isInteger(target)||target<frame||target-frame>COOP_HISTORY){close('historyExpired');return false;}held=true;recoveryTarget=target;if(target===0)emit({t:'loaded',frame:0});else emit({t:'up',data:{resend:frame}});return true;},
 };
}
