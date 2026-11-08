import test from 'node:test';
import assert from 'node:assert/strict';
import {importProgress,recoverProgressImport,IMPORT_BACKUP_KEY} from '../src/progress-import.js';
let purchases;
try { purchases=await import('../src/skill-purchases.js'); }
catch(e) { if(e.code!=='ERR_MODULE_NOT_FOUND'||!e.message.includes('/src/skill-purchases.js'))throw e; }
const J=JSON.stringify;
function fixture(data={}) {
 const values=new Map(Object.entries({'sq-coins':'1000','sq-skills':'{}','sq-bank':'["Bronze Helmet"]','sq-gear':'{"head":"Bronze Helmet"}',...data})),writes=[];
 const storage={getItem:k=>values.get(k)??null,setItem(k,v){writes.push(['set',k]);values.set(k,v)},removeItem(k){writes.push(['remove',k]);values.delete(k)}};
 return {values,writes,storage,get:k=>JSON.parse(values.get(k)??'null')};
}
const required=()=>assert(purchases,'skill preparation module must exist');
const quote=f=>{required();return purchases.skillQuote(f.storage)};
const prepare=(f,a)=>{required();return purchases.prepareSkills(f.storage,a)};
const commit=(f,a)=>{const next=prepare(f,a);importProgress(f.storage,next.data);return next};
test('existing transaction journal can atomically restore skill and coin values',()=>{
 const f=fixture(),before=[...f.values],put=f.storage.setItem;let once=true;
 f.storage.setItem=(k,v)=>{if(once&&k==='sq-skills'){once=false;throw Error('denied')}put(k,v)};
 assert.throws(()=>importProgress(f.storage,{'sq-coins':'940','sq-skills':'{"combat":1}'}));assert.deepEqual([...f.values].sort(),before.sort());
});
test('quote/preparation are read-only and carry just the two required values',()=>{
 const f=fixture({'sq-skills':J({combat:1,FutureCraft:'7'})}),before=[...f.values];assert.equal(quote(f).amount,60);
 const next=prepare(f,{kind:'train',id:'combat'});assert.deepEqual(Object.keys(next.data).sort(),['sq-coins','sq-skills']);assert.deepEqual([...f.values],before);assert.deepEqual(f.writes,[]);
});
test('Train60/Undo60 cycles preserve GP, future keys and unrelated progress',()=>{
 const f=fixture({'sq-skills':J({FutureCraft:'7'})});
 for(let i=0;i<3;i++){commit(f,{kind:'train',id:'combat'});assert.equal(f.get('sq-coins'),940);assert.equal(f.get('sq-skills').combat,1);commit(f,{kind:'undo',id:'combat'});assert.equal(f.get('sq-coins'),1000);assert.equal(f.get('sq-skills').combat||0,0)}
 assert.equal(f.get('sq-skills').FutureCraft,'7');assert.deepEqual(f.get('sq-bank'),['Bronze Helmet']);assert.deepEqual(f.get('sq-gear'),{head:'Bronze Helmet'});
});
test('Combat2 refunds255 once without crediting future ranks',()=>{
 required();const f=fixture({'sq-skills':J({combat:2,FutureCraft:99})});assert.equal(quote(f).amount,255);commit(f,{kind:'refund'});assert.equal(f.get('sq-coins'),1255);assert.deepEqual(f.get('sq-skills'),{FutureCraft:99});assert.throws(()=>commit(f,{kind:'refund'}));assert.equal(f.get('sq-coins'),1255);
});
test('special prices remain Strength1500 and ProjectileSpeed300',()=>{
 const f=fixture({'sq-coins':'5000'});commit(f,{kind:'train',id:'strength'});assert.equal(f.get('sq-coins'),3500);commit(f,{kind:'train',id:'projectileSpeed'});assert.equal(f.get('sq-coins'),3200);assert.equal(quote(f).amount,1800);commit(f,{kind:'refund'});assert.equal(f.get('sq-coins'),5000);
});
test('legacy coercible and fractional ranks use existing bounded rank rules',()=>{
 const f=fixture({'sq-skills':J({combat:'3.9',magic:-4,FutureCraft:900})});assert.equal(quote(f).amount,643);commit(f,{kind:'undo',id:'combat'});assert.equal(f.get('sq-coins'),1388);assert.equal(f.get('sq-skills').combat,2);assert.equal(f.get('sq-skills').FutureCraft,900);
});
test('ranks above the maximum cannot inflate a refund',()=>{
 const f=fixture({'sq-skills':'{"combat":999}'});assert.equal(quote(f).amount,2202);commit(f,{kind:'refund'});assert.equal(f.get('sq-coins'),3202);
});
for(const action of[{kind:'train',id:'__proto__'},{kind:'train',id:'constructor'},{kind:'train',id:'future'},{kind:'undo',id:'combat'},{kind:'refund'},{kind:'unknown'}])test('unavailable action has no writes: '+J(action),()=>{
 required();const f=fixture(),before=[...f.values];assert.throws(()=>prepare(f,action));assert.deepEqual([...f.values],before);assert.deepEqual(f.writes,[]);
});
for(const coins of['49','-1','12.5','9007199254740992','[]','"not a number"'])test('insufficient/invalid funds block the whole purchase: '+coins,()=>{
 required();const f=fixture({'sq-coins':coins}),before=[...f.values];assert.throws(()=>prepare(f,{kind:'train',id:'combat'}));assert.deepEqual([...f.values],before);assert.deepEqual(f.writes,[]);
});
for(const skills of['[]','null','{"combat":{}}','not-json'])test('unreadable skill data cannot be overwritten: '+skills,()=>{
 required();const f=fixture({'sq-skills':skills}),before=[...f.values];assert.throws(()=>quote(f));assert.throws(()=>prepare(f,{kind:'train',id:'combat'}));assert.deepEqual([...f.values],before);
});
test('a maximum rank cannot be trained or silently charged',()=>{
 required();const f=fixture({'sq-skills':'{"combat":5}'});assert.throws(()=>prepare(f,{kind:'train',id:'combat'}));assert.equal(f.get('sq-coins'),1000);assert.deepEqual(f.writes,[]);
});
test('a refund cannot overflow the safe integer balance',()=>{
 required();const f=fixture({'sq-coins':String(Number.MAX_SAFE_INTEGER),'sq-skills':'{"combat":1}'});assert.throws(()=>prepare(f,{kind:'refund'}));assert.equal(f.get('sq-coins'),Number.MAX_SAFE_INTEGER);assert.deepEqual(f.writes,[]);
});
test('current funds are reread rather than captured by an earlier quote',()=>{
 const f=fixture({'sq-skills':'{"combat":1}'}),q=quote(f);f.values.set('sq-coins','1020');assert.equal(quote(f).identity,q.identity);commit(f,{kind:'refund'});assert.equal(f.get('sq-coins'),1080);
});
for(const key of['sq-coins','sq-skills'])test('denied read prevents all mutation: '+key,()=>{
 required();const f=fixture(),get=f.storage.getItem;f.storage.getItem=k=>{if(k===key)throw Error('read denied');return get(k)};assert.throws(()=>quote(f));assert.throws(()=>prepare(f,{kind:'train',id:'combat'}));assert.deepEqual(f.writes,[]);
});
for(const key of['sq-coins','sq-skills',IMPORT_BACKUP_KEY])test('denied data/reservation/cleanup restores the full profile: '+key,()=>{
 required();const f=fixture(),next=prepare(f,{kind:'train',id:'combat'}),before=[...f.values],put=f.storage.setItem,remove=f.storage.removeItem;let fired=false;
 f.storage.setItem=(k,v)=>{if(!fired&&key!==IMPORT_BACKUP_KEY&&k===key){fired=true;throw Error('write denied')}put(k,v)};
 f.storage.removeItem=k=>{if(!fired&&key===IMPORT_BACKUP_KEY&&k===key){fired=true;throw Error('cleanup denied')}remove(k)};
 assert.throws(()=>importProgress(f.storage,next.data));assert.deepEqual([...f.values].sort(),before.sort());assert.equal(f.values.has(IMPORT_BACKUP_KEY),false);
});
test('backup reservation failure cannot begin a purchase',()=>{
 required();const f=fixture(),next=prepare(f,{kind:'train',id:'combat'}),before=[...f.values];f.storage.setItem=()=>{throw Error('quota')};assert.throws(()=>importProgress(f.storage,next.data));assert.deepEqual([...f.values],before);
});
test('failed rollback survives reload/Restore and cannot refund twice',()=>{
 required();const f=fixture({'sq-skills':'{"combat":1}'}),next=prepare(f,{kind:'refund'}),before=[...f.values],put=f.storage.setItem;let blocked=false;
 f.storage.setItem=(k,v)=>{if(k==='sq-skills')blocked=true;if(blocked)throw Error('rollback denied');put(k,v)};
 assert.throws(()=>importProgress(f.storage,next.data),e=>e.recovery===true);assert(f.values.has(IMPORT_BACKUP_KEY));f.storage.setItem=put;assert.equal(recoverProgressImport(f.storage),true);assert.deepEqual([...f.values].sort(),before.sort());commit(f,{kind:'refund'});assert.equal(f.get('sq-coins'),1060);assert.throws(()=>commit(f,{kind:'refund'}));assert.equal(f.get('sq-coins'),1060);
});
