import test from 'node:test';
import assert from 'node:assert/strict';
import { createCloud } from '../src/cloud.js';
import { connect, current, disconnect } from '../src/wallet.js';

const A='0x'+'1'.repeat(40), B='0x'+'2'.repeat(40), OLD='0x'+'3'.repeat(40);
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
const response=data=>new Response(JSON.stringify(data));
async function setup(t,{pause=null,oldSession=false,fresh=false,choice='cloud'}={}) {
  const previous=globalThis.localStorage,store=new Map(fresh?[]:[['sq-coins','500']]);
  globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
  t.mock.timers.enable({apis:['setTimeout']});
  const calls=[],stages=Object.fromEntries(['nonce','signature','login','choice'].map(k=>[k,{hit:deferred(),gate:deferred()}]));
  let reloads=0;
  const wait=async phase=>{stages[phase].hit.resolve();if(pause===phase)await stages[phase].gate.promise;};
  const events=new Map(),w={name:'Fixture A',p:{on:(name,fn)=>events.set(name,fn),request:async({method})=>{
    if(method==='eth_requestAccounts'||method==='eth_accounts')return[A];
    if(method==='personal_sign'){calls.push({kind:'signature'});await wait('signature');return'fixture-signature';}
    if(method==='wallet_revokePermissions')return null;
    throw Error('unexpected provider method '+method);
  }}};
  await connect(w);
  const cloud=createCloud('./',{choose:async()=>{await wait('choice');return choice;},note(){},reload(){reloads++;}});
  if(oldSession){
    store.set('sq-cloud',JSON.stringify({a:OLD,key:'old-fixture-key',rev:7}));
    store.set('sq-cloud-base',JSON.stringify({'sq-coins':'100'}));
    store.set('sq-cloud-upload',JSON.stringify({a:OLD,rev:7,data:{'sq-coins':'500'},uncertain:true}));
  }
  t.mock.method(globalThis,'fetch',async(url,options={})=>{
    const kind=url.split('/').pop(),body=options.body?JSON.parse(options.body):null;
    calls.push({kind,body});
    if(kind==='save-nonce'){await wait('nonce');return response({message:'fixture message',nonce:'fixture-nonce'});}
    if(kind==='save-login'){await wait('login');return response({address:A,key:'new-fixture-key',rev:1,data:{'sq-coins':'100'}});}
    if(kind==='save-put')return response({ok:true,rev:body.rev+1});
    throw Error('unexpected fixture route '+kind);
  });
  t.after(()=>{for(const phase of Object.values(stages))phase.gate.resolve();disconnect();globalThis.localStorage=previous;});
  return{cloud,store,w,stages,calls,conn:current(),reloads:()=>reloads,announce:a=>events.get('accountsChanged')(a)};
}
const selectB=()=>connect({name:'Fixture B',p:{request:async({method})=>method==='eth_requestAccounts'||method==='eth_accounts'?[B]:null}});
const changes={
  disconnect:async d=>disconnect(),
  provider:async d=>selectB(),
  account:async d=>d.announce([B]),
  'account away and back':async d=>{d.announce([B]);d.announce([A]);},
  'rejected connection intent':async d=>assert.rejects(connect({p:{request:async()=>{throw Error('fixture rejected');}}}),/fixture rejected/),
};
for(const [name,change]of Object.entries(changes))test(`cloud sign-in stops after ${name} during nonce lookup`,async t=>{
  const d=await setup(t,{pause:'nonce'}),signing=d.cloud.signIn(d.conn);
  await d.stages.nonce.hit.promise;await change(d);d.stages.nonce.gate.resolve();
  await assert.rejects(signing,/cancelled|changed/i);
  assert.equal(d.calls.filter(c=>c.kind==='signature').length,0);
  assert.equal(d.cloud.state(),null);assert.equal(d.store.get('sq-coins'),'500');
});
test('an already stale cloud button cannot request a nonce or signature',async t=>{
  const d=await setup(t);await selectB();
  await assert.rejects(d.cloud.signIn(d.conn),/cancelled|changed/i);
  assert.equal(d.calls.length,0);assert.equal(d.cloud.state(),null);
});
test('a signature resolved after wallet change cannot open a save session',async t=>{
  const d=await setup(t,{pause:'signature'}),signing=d.cloud.signIn(d.conn);
  await d.stages.signature.hit.promise;await selectB();d.stages.signature.gate.resolve();
  await assert.rejects(signing,/cancelled|changed/i);
  assert.equal(d.calls.filter(c=>c.kind==='save-login').length,0);assert.equal(d.cloud.state(),null);
});
test('a delayed login after Disconnect cannot install a cloud save',async t=>{
  const d=await setup(t,{pause:'login',fresh:true}),signing=d.cloud.signIn(d.conn);
  await d.stages.login.hit.promise;disconnect();d.stages.login.gate.resolve();
  await assert.rejects(signing,/cancelled|changed/i);
  assert.equal(d.cloud.state(),null);assert.equal(d.store.has('sq-coins'),false);assert.equal(d.reloads(),0);
});
test('an unchosen session cannot replace an established session or its interrupted upload',async t=>{
  const d=await setup(t,{pause:'choice',oldSession:true}),before=new Map(d.store),signing=d.cloud.signIn(d.conn);
  await d.stages.choice.hit.promise;
  const pending=new Map(d.store);await selectB();d.stages.choice.gate.resolve();
  const outcome=await signing.then(value=>({value}),error=>({error}));
  for(const key of ['sq-cloud','sq-cloud-base','sq-cloud-upload','sq-coins'])assert.equal(pending.get(key),before.get(key),key+' stays intact before choosing');
  assert.match(outcome.error?.message||'',/cancelled|changed/i);
  assert.equal(d.store.get('sq-cloud'),before.get('sq-cloud'));assert.equal(d.store.get('sq-cloud-upload'),before.get('sq-cloud-upload'));assert.equal(d.reloads(),0);
});
test('autosave cannot upload to a new wallet before its progress choice',async t=>{
  const d=await setup(t,{pause:'choice'}),signing=d.cloud.signIn(d.conn);
  await d.stages.choice.hit.promise;const saved=await d.cloud.push(true),before=d.calls.filter(c=>c.kind==='save-put').length;
  d.stages.choice.gate.resolve();await signing;
  assert.equal(saved,false);assert.equal(before,0);assert.equal(d.store.get('sq-coins'),'100');
});
test('a save choice cannot replace local progress changed while the prompt was open',async t=>{
  const d=await setup(t,{pause:'choice'}),signing=d.cloud.signIn(d.conn);
  await d.stages.choice.hit.promise;d.store.set('sq-coins','650');d.stages.choice.gate.resolve();
  await assert.rejects(signing,/progress.*changed|changed.*progress/i);
  assert.equal(d.store.get('sq-coins'),'650');assert.equal(d.cloud.state(),null);assert.equal(d.reloads(),0);
});
test('a cancelled choice does not select device progress implicitly',async t=>{
  const d=await setup(t,{choice:null});
  await assert.rejects(d.cloud.signIn(d.conn),/cancelled|changed/i);
  assert.equal(d.cloud.state(),null);assert.equal(d.calls.filter(c=>c.kind==='save-put').length,0);assert.equal(d.store.get('sq-coins'),'500');
});
test('matching account announcements allow a healthy cloud sign-in',async t=>{
  const d=await setup(t,{pause:'signature'}),signing=d.cloud.signIn(d.conn);
  await d.stages.signature.hit.promise;d.announce([A.toUpperCase().replace('0X','0x')]);d.stages.signature.gate.resolve();
  assert.equal(await signing,'loaded');assert.equal(d.store.get('sq-coins'),'100');assert.equal(d.cloud.state().a,A);assert.equal(d.reloads(),1);
});
test('Disconnect does not revoke an established cloud session or disable its autosave',async t=>{
  const d=await setup(t,{choice:'device'});assert.equal(await d.cloud.signIn(d.conn),'saved');
  disconnect();d.store.set('sq-coins','650');assert.equal(await d.cloud.push(true),true);
  assert.equal(d.cloud.state().a,A);assert.equal(d.cloud.state().rev,3);assert.equal(d.store.get('sq-coins'),'650');
});

test('queued device choice survives an old-session upload and repeated new-session conflicts',async t=>{
  const d=await setup(t,{oldSession:true,choice:'device'}),original=globalThis.fetch,old=deferred(),started=deferred();
  let writes=0;
  globalThis.fetch=async(url,options={})=>{
    if(!url.endsWith('save-put'))return original(url,options);
    const body=JSON.parse(options.body);
    if(body.key==='old-fixture-key'){started.resolve();return old.promise;}
    writes++;
    if(writes===1)return new Response(JSON.stringify({conflict:true,rev:2,data:{'sq-coins':'0'}}),{status:409});
    if(writes===2)return new Response(JSON.stringify({conflict:true,rev:3,data:{'sq-coins':'50'}}),{status:409});
    assert.equal(body.data['sq-coins'],'500');return response({ok:true,rev:4});
  };
  const saving=d.cloud.push(true);await started.promise;
  assert.equal(await d.cloud.signIn(d.conn),'pending');
  old.resolve(response({ok:true,rev:8}));await saving;
  await d.cloud.push(true);const first=d.store.get('sq-coins');
  await d.cloud.push(true);const second=d.store.get('sq-coins');
  assert.equal(await d.cloud.push(true),true);
  assert.equal(first,'500');assert.equal(second,'500');assert.equal(d.store.get('sq-coins'),'500');assert.equal(d.cloud.state().rev,4);
});
test('initial upload expiry cannot report a pending retry after its session was signed out',async t=>{
  const d=await setup(t,{choice:'device'}),original=globalThis.fetch;
  globalThis.fetch=(url,options)=>url.endsWith('save-put')?Promise.resolve(new Response(JSON.stringify({error:'expired'}),{status:401})):original(url,options);
  await assert.rejects(d.cloud.signIn(d.conn),/signed out/i);assert.equal(d.cloud.state(),null);assert.equal(d.store.get('sq-coins'),'500');
});
