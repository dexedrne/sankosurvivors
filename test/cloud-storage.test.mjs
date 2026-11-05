import test from 'node:test';
import assert from 'node:assert/strict';
import { createCloud } from '../src/cloud.js';
import { recoverProgressImport, IMPORT_BACKUP_KEY } from '../src/progress-import.js';
import { connect, current, disconnect } from '../src/wallet.js';
const A='0x'+'1'.repeat(40),B='0x'+'2'.repeat(40),J=JSON.stringify;
const response=(body,status=200)=>new Response(J(body),{status});
function setup(t,{choice='cloud'}={}){
 const previous=globalThis.localStorage,store=new Map([['sq-coins','500'],['sq-stats',J({runs:2})],['sq-cloud',J({a:A,key:'fixture-a',rev:1})],['sq-cloud-base',J({'sq-coins':'100','sq-stats':J({runs:0})})]]),calls=[],notes=[],responses=[],writes=[];let fail=()=>false,blocked=false,recoveries=0;
 const storage={getItem(k){if(fail('get',k))throw Error('fixture storage denied');return store.get(k)??null;},setItem(k,v){if(blocked||fail('set',k,v))throw Error('fixture storage denied');writes.push(k);store.set(k,String(v));},removeItem(k){if(blocked||fail('remove',k))throw Error('fixture storage denied');writes.push(k);store.delete(k);}};
 globalThis.localStorage=storage;t.mock.timers.enable({apis:['setTimeout']});
 t.mock.method(globalThis,'fetch',async(url,options={})=>{const route=url.split('/').pop(),body=options.body?JSON.parse(options.body):null;calls.push({route,body});const next=responses.shift();if(next instanceof Error)throw next;if(typeof next==='function')return next(route,body);return next||response({ok:true,rev:(body?.rev||0)+1});});
 const cloud=createCloud('./',{choose:async()=> choice,note:n=>notes.push(n),reload:()=>calls.push({route:'reload'}),recover:()=>{recoveries++;}});
 t.after(async()=>{blocked=false;fail=()=>false;await cloud.signOut();disconnect();globalThis.localStorage=previous;});
 return{cloud,store,storage,calls,notes,responses,writes,recoveries:()=>recoveries,fail:fn=>fail=fn,block:()=>blocked=true,allow:()=>{blocked=false;fail=()=>false;},flush:async()=>{for(let i=0;i<100;i++)await Promise.resolve();}};
}
test('an upload cannot leave the device unless its interrupted-upload record is durable',async t=>{
 const f=setup(t);f.fail((op,k)=>op==='set'&&k==='sq-cloud-upload');assert.equal(await f.cloud.push(true),false);assert.equal(f.calls.length,0);assert.equal(f.store.get('sq-coins'),'500');
});
test('a failed acknowledgment baseline write cannot report the save as acknowledged',async t=>{
 const f=setup(t);f.fail((op,k)=>op==='set'&&k==='sq-cloud-base');assert.equal(await f.cloud.push(true),false);assert.equal(f.cloud.state().rev,1);assert.ok(f.store.has('sq-cloud-upload'));
});
test('a failed acknowledgment revision write cannot report the save as acknowledged',async t=>{
 const f=setup(t);f.fail((op,k)=>op==='set'&&k==='sq-cloud');assert.equal(await f.cloud.push(true),false);assert.equal(f.cloud.state().rev,1);assert.ok(f.store.has('sq-cloud-upload'));
});
test('lost local acknowledgment cannot inflate coins on the next conflicting save',async t=>{
 const f=setup(t);let failed=false;f.fail((op,k)=>{if(!failed&&op==='set'&&k==='sq-cloud-base'){failed=true;return true;}return false;});
 f.responses.push(response({ok:true,rev:2}),response({conflict:true,rev:3,data:{'sq-coins':'600','sq-stats':J({runs:2})}},409));
 await f.cloud.push(true);f.store.set('sq-coins','550');await f.cloud.push(true);
 assert.equal(f.store.get('sq-coins'),'550');assert.equal(f.cloud.state(),null);
});
test('failed conflict merge rolls all progress back before advancing the revision',async t=>{
 const f=setup(t);let failed=false;f.fail((op,k,v)=>{if(!failed&&op==='set'&&k==='sq-stats'&&v===J({runs:3})){failed=true;return true;}return false;});
 f.responses.push(response({conflict:true,rev:2,data:{'sq-coins':'200','sq-stats':J({runs:1})}},409));
 assert.equal(await f.cloud.push(true),false);assert.equal(f.store.get('sq-coins'),'500');assert.equal(f.store.get('sq-stats'),J({runs:2}));assert.equal(f.cloud.state(),null);
});
test('a failed pull restores original local earnings and counters instead of reporting a partial load',async t=>{
 const f=setup(t);let failed=false;f.fail((op,k,v)=>{if(!failed&&op==='set'&&k==='sq-stats'&&v===J({runs:3})){failed=true;return true;}return false;});f.responses.push(response({rev:2,data:{'sq-coins':'200','sq-stats':J({runs:1})}}));
 assert.equal(await f.cloud.pull(),false);assert.equal(f.store.get('sq-coins'),'500');assert.equal(f.store.get('sq-stats'),J({runs:2}));assert.equal(f.cloud.state(),null);
});
test('a failed chosen cloud adoption cannot replace part of the device save',async t=>{
 const f=setup(t);await connect({p:{request:async({method})=>method==='personal_sign'?'fixture-signature':[A]}});let failed=false;f.fail((op,k,v)=>{if(!failed&&op==='set'&&k==='sq-stats'&&v===J({runs:1})){failed=true;return true;}return false;});
 f.responses.push(response({message:'fixture message',nonce:'fixture nonce'}),response({address:A,key:'fixture-new',rev:2,data:{'sq-coins':'200','sq-stats':J({runs:1})}}));
 const result=await f.cloud.signIn(current()).then(value=>({value}),error=>({error}));assert.ok(result.error);assert.equal(f.store.get('sq-coins'),'500');assert.equal(f.store.get('sq-stats'),J({runs:2}));assert.equal(f.calls.some(c=>c.route==='reload'),false);
});
test('unrecoverable cloud merge retains only old progress in a durable journal and can recover after restart',async t=>{
 const f=setup(t);f.fail((op,k,v)=>{if(op==='set'&&k==='sq-stats'&&v===J({runs:3})){f.block();return true;}return false;});f.responses.push(response({conflict:true,rev:2,data:{'sq-coins':'200','sq-stats':J({runs:1})}},409));
 await f.cloud.push(true);const raw=f.store.get(IMPORT_BACKUP_KEY);assert.ok(raw);assert.equal(JSON.parse(raw).before['sq-coins'],'500');assert.equal(JSON.parse(raw).before['sq-stats'],J({runs:2}));assert.equal(raw.includes('fixture-a'),false);assert.equal(f.recoveries(),1);
 f.allow();recoverProgressImport(f.storage);assert.equal(f.store.get('sq-coins'),'500');assert.equal(f.store.get('sq-stats'),J({runs:2}));assert.equal(f.store.has(IMPORT_BACKUP_KEY),false);assert.equal(f.store.has('sq-cloud'),false);assert.equal(f.store.has('sq-cloud-base'),false);assert.equal(f.store.has('sq-cloud-upload'),false);
});
for(const kind of ['success','conflict'])test(`old ${kind} upload response cannot roll back a newer revision of the same session`,async t=>{
 const f=setup(t);let finish;f.responses.push(()=>new Promise(resolve=>{finish=resolve;}));const saving=f.cloud.push(true);await f.flush();f.store.set('sq-cloud',J({a:A,key:'fixture-a',rev:3}));f.store.set('sq-cloud-base',J({'sq-coins':'600','sq-stats':J({runs:2})}));f.store.set('sq-coins','650');
 finish(response(kind==='success'?{ok:true,rev:2}:{conflict:true,rev:3,data:{'sq-coins':'600','sq-stats':J({runs:2})}},kind==='success'?200:409));assert.equal(await saving,false);assert.equal(f.cloud.state().rev,3);assert.equal(f.store.get('sq-coins'),'650');assert.equal(JSON.parse(f.store.get('sq-cloud-base'))['sq-coins'],'600');
});
test('a replaced cloud session rejects an old conflicting response',async t=>{
 const f=setup(t);let finish;f.responses.push(()=>new Promise(resolve=>{finish=resolve;}));const saving=f.cloud.push(true);await f.flush();f.store.set('sq-cloud',J({a:B,key:'fixture-b',rev:1}));f.store.set('sq-coins','650');finish(response({conflict:true,rev:2,data:{'sq-coins':'200'}},409));assert.equal(await saving,false);assert.equal(f.cloud.state().key,'fixture-b');assert.equal(f.store.get('sq-coins'),'650');
});

for(const key of ['sq-stats','sq-cloud-base','sq-cloud-upload'])test(`unreadable ${key} stops upload before any request`,async t=>{
 const f=setup(t);f.fail((op,k)=>op==='get'&&k===key);assert.equal(await f.cloud.push(true),false);assert.equal(f.calls.length,0);assert.equal(f.store.get('sq-coins'),'500');
});
test('failed cloud journal reservation leaves profile and previous session untouched',async t=>{
 const f=setup(t);f.fail((op,k)=>op==='set'&&k===IMPORT_BACKUP_KEY);f.responses.push(response({conflict:true,rev:2,data:{'sq-coins':'200','sq-stats':J({runs:1})}},409));await f.cloud.push(true);
 assert.equal(f.store.get('sq-coins'),'500');assert.equal(f.store.get('sq-stats'),J({runs:2}));assert.equal(f.cloud.state().rev,1);
});
test('failure deactivating cloud before a local merge writes no new profile',async t=>{
 const f=setup(t);let failed=false;f.fail((op,k)=>{if(!failed&&op==='remove'&&k==='sq-cloud'){failed=true;return true;}return false;});f.responses.push(response({conflict:true,rev:2,data:{'sq-coins':'200','sq-stats':J({runs:1})}},409));await f.cloud.push(true);
 assert.equal(f.store.get('sq-coins'),'500');assert.equal(f.store.get('sq-stats'),J({runs:2}));assert.equal(f.cloud.state(),null);
});
test('a failed conflict baseline commit restores the original profile with cloud off',async t=>{
 const f=setup(t);let failed=false;f.fail((op,k)=>{if(!failed&&op==='set'&&k==='sq-cloud-base'){failed=true;return true;}return false;});f.responses.push(response({conflict:true,rev:2,data:{'sq-coins':'200','sq-stats':J({runs:1})}},409));await f.cloud.push(true);
 assert.equal(f.store.get('sq-coins'),'500');assert.equal(f.store.get('sq-stats'),J({runs:2}));assert.equal(f.cloud.state(),null);
});
test('session activation failure keeps a fully committed merged profile with cloud off',async t=>{
 const f=setup(t);f.fail((op,k)=>op==='set'&&k==='sq-cloud');f.responses.push(response({conflict:true,rev:2,data:{'sq-coins':'200','sq-stats':J({runs:1})}},409));await f.cloud.push(true);
 assert.equal(f.store.get('sq-coins'),'600');assert.equal(f.store.get('sq-stats'),J({runs:3}));assert.equal(f.cloud.state(),null);assert.equal(f.store.has(IMPORT_BACKUP_KEY),false);
});
test('chosen device progress cannot activate a new session before durable local commit',async t=>{
 const f=setup(t,{choice:'device'});await connect({p:{request:async({method})=>method==='personal_sign'?'fixture-signature':[A]}});f.fail((op,k)=>op==='set'&&k===IMPORT_BACKUP_KEY);
 f.responses.push(response({message:'fixture message',nonce:'fixture nonce'}),response({address:A,key:'fixture-new',rev:2,data:{'sq-coins':'200','sq-stats':J({runs:1})}}));
 const result=await f.cloud.signIn(current()).then(value=>({value}),error=>({error}));assert.ok(result.error);assert.equal(f.cloud.state().key,'fixture-a');assert.equal(f.cloud.state().rev,1);assert.equal(JSON.parse(f.store.get('sq-cloud-base'))['sq-coins'],'100');assert.equal(f.store.get('sq-coins'),'500');
});
test('an old network failure cannot overwrite a newer revision pending upload',async t=>{
 const f=setup(t);let reject;f.responses.push(()=>new Promise((resolve,fail)=>{reject=fail;}));const saving=f.cloud.push(true);await f.flush();f.store.set('sq-cloud',J({a:A,key:'fixture-a',rev:3}));const pending=J({a:A,rev:3,data:{'sq-coins':'650'},uncertain:false});f.store.set('sq-cloud-upload',pending);reject(Error('fixture offline'));assert.equal(await saving,false);assert.equal(f.store.get('sq-cloud-upload'),pending);
});
test('native local lock waits recheck cloud session authority before sending',async t=>{
 const f=setup(t),descriptor=Object.getOwnPropertyDescriptor(globalThis,'navigator');let release;const waiting=new Promise(r=>{release=r;});Object.defineProperty(globalThis,'navigator',{configurable:true,value:{locks:{request:async(name,fn)=>{await waiting;return fn();}}}});t.after(()=>{release();if(descriptor)Object.defineProperty(globalThis,'navigator',descriptor);else delete globalThis.navigator;});
 const saving=f.cloud.push(true);await f.flush();const before=f.calls.length;f.store.set('sq-cloud',J({a:A,key:'fixture-a',rev:3}));f.store.set('sq-coins','650');release();assert.equal(await saving,false);assert.equal(before,0);assert.equal(f.calls.length,0);assert.equal(f.store.get('sq-coins'),'650');
});
test('an existing progress recovery journal blocks cloud upload of a mixed profile',async t=>{
 const f=setup(t);f.store.set(IMPORT_BACKUP_KEY,J({v:1,before:{'sq-coins':'500'}}));f.store.set('sq-coins','100');assert.equal(await f.cloud.push(true),false);assert.equal(f.calls.length,0);assert.equal(f.recoveries(),1);assert.equal(f.store.get('sq-coins'),'100');assert.ok(f.store.has(IMPORT_BACKUP_KEY));
});
test('an upload response arriving during progress recovery cannot acknowledge or rewrite metadata',async t=>{
 const f=setup(t);let finish;f.responses.push(()=>new Promise(resolve=>{finish=resolve;}));const saving=f.cloud.push(true);await f.flush();f.store.set(IMPORT_BACKUP_KEY,J({v:1,before:{'sq-coins':'500'}}));f.store.set('sq-coins','100');const baseline=f.store.get('sq-cloud-base');finish(response({ok:true,rev:2}));assert.equal(await saving,false);assert.equal(f.cloud.state().rev,1);assert.equal(f.store.get('sq-cloud-base'),baseline);assert.equal(f.recoveries(),1);
});
for(const baseline of [null,'[1]'])test(`a conflicting save with an unconfirmed previous baseline pauses without adding coins: ${baseline}`,async t=>{
 const f=setup(t);if(baseline===null)f.store.delete('sq-cloud-base');else f.store.set('sq-cloud-base',baseline);f.responses.push(response({conflict:true,rev:2,data:{'sq-coins':'200','sq-stats':J({runs:1})}},409));assert.equal(await f.cloud.push(true),false);assert.equal(f.store.get('sq-coins'),'500');assert.equal(f.store.get('sq-stats'),J({runs:2}));assert.equal(f.cloud.state(),null);
});
test('Turn off waits behind a local commit and cannot be undone by its session activation',async t=>{
 const f=setup(t),descriptor=Object.getOwnPropertyDescriptor(globalThis,'navigator');let run;Object.defineProperty(globalThis,'navigator',{configurable:true,value:{locks:{request:(name,fn)=>{if(!run)return new Promise(resolve=>{run=()=>resolve(fn());});return Promise.resolve(fn());}}}});t.after(()=>{if(descriptor)Object.defineProperty(globalThis,'navigator',descriptor);else delete globalThis.navigator;});
 const turningOff=f.cloud.signOut(),immediate=f.cloud.state();f.store.set('sq-cloud',J({a:A,key:'fixture-a',rev:2}));if(run)run();await turningOff;assert.equal(immediate,null);assert.equal(f.store.has('sq-cloud'),false);
});
test('a new cloud sign-in waits for the previous Turn off to finish',async t=>{
 const f=setup(t),descriptor=Object.getOwnPropertyDescriptor(globalThis,'navigator');let run;Object.defineProperty(globalThis,'navigator',{configurable:true,value:{locks:{request:(name,fn)=>{if(!run)return new Promise(resolve=>{run=()=>resolve(fn());});return Promise.resolve(fn());}}}});t.after(()=>{if(descriptor)Object.defineProperty(globalThis,'navigator',descriptor);else delete globalThis.navigator;});
 const turningOff=f.cloud.signOut();await connect({p:{request:async({method})=>method==='personal_sign'?'fixture-signature':[A]}});f.responses.push(response({message:'fixture message',nonce:'fixture nonce'}),response({address:A,key:'fixture-new',rev:2,data:{'sq-coins':'200','sq-stats':J({runs:1})}}));
 const signing=f.cloud.signIn(current());await f.flush();const before=f.calls.length;if(run)run();await turningOff;const result=await signing;assert.equal(before,0);assert.equal(result,'loaded');assert.equal(f.cloud.state().key,'fixture-new');
});

test('failed session removal preserves the baseline and pending-upload evidence',async t=>{
 const f=setup(t);const baseline=f.store.get('sq-cloud-base'),pending=J({a:A,rev:1,data:{'sq-coins':'500'},uncertain:true});f.store.set('sq-cloud-upload',pending);f.fail((op,k)=>op==='remove'&&k==='sq-cloud');await f.cloud.signOut();assert.equal(f.store.get('sq-cloud-base'),baseline);assert.equal(f.store.get('sq-cloud-upload'),pending);assert.equal(f.cloud.state(),null);
});
test('a fresh client after failed Off keeps unsynced earnings when pulling a newer save',async t=>{
 const f=setup(t);f.fail((op,k)=>op==='remove'&&k==='sq-cloud');await f.cloud.signOut();f.allow();const reopened=createCloud('./',{note:n=>f.notes.push(n)});f.responses.push(response({rev:2,data:{'sq-coins':'200','sq-stats':J({runs:1})}}));assert.equal(await reopened.pull(),true);assert.equal(f.store.get('sq-coins'),'600');assert.equal(f.store.get('sq-stats'),J({runs:3}));
});
for(const baseline of [null,'[1]'])test(`pull pauses an unconfirmed previous baseline without replacing local progress: ${baseline}`,async t=>{
 const f=setup(t);if(baseline===null)f.store.delete('sq-cloud-base');else f.store.set('sq-cloud-base',baseline);f.responses.push(response({rev:2,data:{'sq-coins':'200','sq-stats':J({runs:1})}}));assert.equal(await f.cloud.pull(),false);assert.equal(f.store.get('sq-coins'),'500');assert.equal(f.store.get('sq-stats'),J({runs:2}));assert.equal(f.cloud.state(),null);
});
test('network-error evidence cleanup waits for the shared lock and preserves newer overwrite intent',async t=>{
 const f=setup(t),descriptor=Object.getOwnPropertyDescriptor(globalThis,'navigator'),pending=J({a:A,rev:3,data:{'sq-coins':'650'},overwrite:true,uncertain:false});let locks=0,held=false,errorPhase=false,reject;
 const newer=()=>{f.store.set('sq-cloud',J({a:A,key:'fixture-a',rev:3}));f.store.set('sq-cloud-upload',pending);};
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{locks:{request:(name,fn)=>{locks++;if(locks===2)newer();held=true;try{return Promise.resolve(fn());}finally{held=false;}}}}});t.after(()=>{if(descriptor)Object.defineProperty(globalThis,'navigator',descriptor);else delete globalThis.navigator;});
 f.fail((op,k)=>{if(errorPhase&&!held&&op==='set'&&k==='sq-cloud-upload')newer();return false;});f.responses.push(()=>new Promise((resolve,fail)=>{reject=fail;}));const saving=f.cloud.push(true);await f.flush();errorPhase=true;reject(Error('fixture offline'));assert.equal(await saving,false);assert.equal(f.store.get('sq-cloud-upload'),pending);
});
