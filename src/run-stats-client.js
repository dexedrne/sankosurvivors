import {normalizeRunSummary} from './run-stats.js';
export const RUN_STATS_DB='sq-run-statistics-v1';
const TTL=72*3600000,LIMIT=200;
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
function packet(value){
 if(!object(value)||Object.keys(value).length!==2||typeof value.ticket!=='string'||value.ticket.length>400||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(value.ticket))throw Error('Invalid run statistics.');
 const data=normalizeRunSummary(value.data);if(!data||data.kind==='ranked')throw Error('Invalid run statistics.');return{ticket:value.ticket,data};
}
const identity=p=>p.ticket+'|'+p.data.endless;
function state(raw){
 if(raw===null)return{v:1,pending:[],dropped:0};
 if(!object(raw)||Object.keys(raw).length!==3||raw.v!==1||!Number.isSafeInteger(raw.dropped)||raw.dropped<0||!Array.isArray(raw.pending)||raw.pending.length>LIMIT)throw Error('Run statistics storage is unavailable; saved data is kept.');
 const ids=new Set();
 for(const item of raw.pending){
  if(!object(item)||Object.keys(item).length!==3||!Number.isSafeInteger(item.at)||item.at<0)throw Error('Run statistics storage is unavailable; saved data is kept.');
  const p=packet(item.packet);if(item.id!==identity(p)||ids.has(item.id))throw Error('Run statistics storage is unavailable; saved data is kept.');ids.add(item.id);
 }
 return structuredClone(raw);
}
const addDrops=(s,n)=>s.dropped=Math.min(Number.MAX_SAFE_INTEGER,s.dropped+n);
function expire(s,now){const kept=s.pending.filter(item=>now-item.at<=TTL);addDrops(s,s.pending.length-kept.length);s.pending=kept;}

// IndexedDB transactions serialize tabs without consuming player-save localStorage quota.
export function openRunStatsStore(indexedDB){
 let opening;
 function open(){
  if(!opening)opening=new Promise((resolve,reject)=>{
   if(indexedDB===undefined)indexedDB=globalThis.indexedDB;
   if(!indexedDB){reject(Error('Run statistics storage is unavailable.'));return;}
   const request=indexedDB.open(RUN_STATS_DB,1);let blocked=false;
   request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('outbox'))request.result.createObjectStore('outbox');};
   request.onerror=()=>reject(Error('Run statistics storage is unavailable.'));
   request.onblocked=()=>{blocked=true;reject(Error('Run statistics storage is unavailable.'));};
   request.onsuccess=()=>{const db=request.result;if(blocked){db.close();return;}db.onversionchange=()=>{db.close();opening=null;};resolve(db);};
  }).catch(error=>{opening=null;throw error;});
  return opening;
 }
 return{
  async read(){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('outbox','readonly'),request=tx.objectStore('outbox').get('state');request.onsuccess=()=>resolve(request.result??null);request.onerror=()=>reject(request.error||Error('Run statistics read failed.'));});},
  async update(fn){const db=await open();return new Promise((resolve,reject)=>{
   const tx=db.transaction('outbox','readwrite'),store=tx.objectStore('outbox'),request=store.get('state');let result,error;
   request.onsuccess=()=>{try{const next=fn(request.result??null);result=next.result;store.put(next.value,'state');}catch(failure){error=failure;tx.abort();}};
   tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(error||tx.error||Error('Run statistics save failed.'));
  });}
 };
}
export function createRunStatsOutbox(store,send,clock=Date.now){
 let flushing=null;
 const update=fn=>store.update(raw=>{const next=state(raw),result=fn(next);return{value:next,result};});
 async function enqueue(value){
  const p=packet(value),at=clock();if(!Number.isSafeInteger(at)||at<0)throw Error('Invalid statistics clock.');
  return update(s=>{expire(s,at);const id=identity(p);if(s.pending.some(item=>item.id===id))return true;s.pending.push({id,at,packet:p});if(s.pending.length>LIMIT){s.pending.shift();addDrops(s,1);}return true;});
 }
 async function drain(){
  while(true){
   const current=state(await store.read());if(!current.pending.length)return;
   if(current.pending.some(item=>clock()-item.at>TTL)){await update(s=>expire(s,clock()));continue;}
   const first=current.pending[0];let response;try{response=await send(first.packet);}catch{return;}
   const accepted=response?.ok===true,permanent=[400,410,413,415].includes(response?.status);
   if(!accepted&&!permanent)return;
   await update(s=>{const at=s.pending.findIndex(item=>item.id===first.id);if(at>=0){s.pending.splice(at,1);if(!accepted)addDrops(s,1);}});
  }
 }
 return{enqueue,flush(){if(!flushing)flushing=drain().finally(()=>{flushing=null;});return flushing;},async inspect(){const s=state(await store.read());return{pending:s.pending.length,dropped:s.dropped};}};
}
export async function queueFinishedRunStats(session,summary,outbox){
 const data=normalizeRunSummary(summary);if(!data)return false;
 await session.tickets;if(!session.statsTicket)return false;
 await outbox.enqueue({ticket:session.statsTicket,data});void outbox.flush().catch(()=>{});return true;
}
