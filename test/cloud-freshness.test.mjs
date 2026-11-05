import test from 'node:test';
import assert from 'node:assert/strict';
import { createCloud, isFresh } from '../src/cloud.js';
import { createSim } from '../src/sim.js';
import { prepareRunRewards } from '../src/run-rewards.js';
import { connect, current, disconnect } from '../src/wallet.js';

const J=JSON.stringify, address='0x'+'1'.repeat(40);
function coinlessRun() {
  const sim=createSim();Object.assign(sim,{over:'dead',t:12,kills:0,bossKills:0,evolves:0,loot:[],killsByType:{}});
  return prepareRunRewards({getItem:()=>null},sim,{earned:0}).data;
}
test('an actual coinless completed-run batch is existing progress',()=>{
  const data=coinlessRun();assert.equal(data['sq-coins'],'0');assert.equal(JSON.parse(data['sq-best']).t,12);assert.equal(JSON.parse(data['sq-stats']).bestTime,12);
  assert.equal(isFresh(data),false);
});
for(const [key,value] of Object.entries({
  'sq-stats':{bestTime:12},'sq-gearlv':{'Bronze Helmet':1},'sq-best':{t:12,kills:0,won:false},'sq-bests':{'greentown:n:r':{t:12,kills:0,won:false}},'sq-quests':['survivor'],
}))test(`${key} alone prevents silent wallet adoption`,()=>assert.equal(isFresh({[key]:J(value)}),false));
for(const key of ['sq-stats','sq-gearlv','sq-best','sq-bests'])test(`nonempty legacy/future ${key} metadata is kept behind a choice`,()=>assert.equal(isFresh({[key]:J({future:{keep:true}})}),false));
test('zero-valued legacy stats still require a deliberate save choice',()=>assert.equal(isFresh({'sq-stats':J({kills:0,bestTime:0})}),false));
test('empty/default progress and presentation preferences stay fresh',()=>{
  assert.equal(isFresh({}),true);
  assert.equal(isFresh({'sq-coins':'0','sq-skills':'{}','sq-bank':'[]','sq-cleared':'[]','sq-quests':'[]','sq-stats':'{}','sq-gearlv':'{}','sq-best':'null','sq-bests':'{}','sq-gear':'{}','sq-name':J('Fixture'),'sq-map':J('apache'),'sq-adv':J('ranger'),'sq-autoalch':'false'}),true);
});
for(const [key,value] of Object.entries({'sq-coins':1,'sq-skills':{might:1},'sq-bank':['Bronze Helmet'],'sq-cleared':['greentown']}))test(`existing ${key} freshness indicator remains protected`,()=>assert.equal(isFresh({[key]:J(value)}),false));
for(const key of ['sq-stats','sq-gearlv','sq-best','sq-bests','sq-quests'])test(`malformed ${key} shape does not crash the save decision`,()=>{
  for(const value of ['broken','null','true','3','"legacy"'])assert.equal(typeof isFresh({[key]:value}),'boolean');
});

async function fixture(t,{data=coinlessRun(),remote={'sq-coins':'100'},choice=null,held=false,oldSession=false}={}) {
  const previous=globalThis.localStorage,store=new Map(Object.entries(data));
  globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
  t.mock.timers.enable({apis:['setTimeout']});
  await connect({p:{request:async({method})=>method==='personal_sign'?'fixture-signature':[address]}});
  if(oldSession){store.set('sq-cloud',J({a:address,key:'fixture-old',rev:7}));store.set('sq-cloud-base',J({'sq-coins':'0'}));}
  const before=new Map(store),puts=[];let choices=0,reloads=0,release,requested;
  const gate=new Promise(resolve=>{release=resolve;}),choosing=new Promise(resolve=>{requested=resolve;});
  const cloud=createCloud('./',{choose:async()=>{choices++;requested();return held?gate:choice;},note(){},reload(){reloads++;}});
  t.mock.method(globalThis,'fetch',async(url,options={})=>{
    if(url.endsWith('save-nonce'))return new Response(J({message:'fixture',nonce:'fixture-nonce'}));
    if(url.endsWith('save-login'))return new Response(J({address,key:'fixture-new',rev:remote===null?0:1,...(remote===null?{}:{data:remote})}));
    assert.ok(url.endsWith('save-put'),'unexpected route');const body=JSON.parse(options.body);puts.push(body.data);return new Response(J({ok:true,rev:body.rev+1}));
  });
  t.after(()=>{release(null);disconnect();globalThis.localStorage=previous;});
  return{cloud,store,before,puts,choosing,release,choices:()=>choices,reloads:()=>reloads,sign:()=>cloud.signIn(current())};
}
test('coinless sign-in waits for a choice without changing progress or an old session',async t=>{
  const f=await fixture(t,{held:true,oldSession:true}),signing=f.sign();
  try{await Promise.race([f.choosing,signing]);assert.equal(f.choices(),1);assert.deepEqual(f.store,f.before);assert.equal(f.puts.length,0);assert.equal(f.reloads(),0);}
  finally{f.release(null);await signing.catch(()=>{});}
});
test('canceling a coinless save choice retains records/stats and the old session',async t=>{
  const f=await fixture(t,{oldSession:true});await assert.rejects(f.sign(),/cancelled|selected/i);assert.equal(f.choices(),1);assert.deepEqual(f.store,f.before);assert.equal(f.puts.length,0);assert.equal(f.reloads(),0);
});
test('explicit keep-device uploads the complete coinless history',async t=>{
  const data=coinlessRun(),f=await fixture(t,{data,choice:'device'});assert.equal(await f.sign(),'saved');assert.equal(f.choices(),1);assert.deepEqual(f.puts,[data]);for(const [key,value]of Object.entries(data))assert.equal(f.store.get(key),value);assert.equal(f.reloads(),0);
});
test('explicit use-wallet keeps its existing replacement semantics',async t=>{
  const f=await fixture(t,{choice:'cloud'});assert.equal(await f.sign(),'loaded');assert.equal(f.choices(),1);assert.equal(f.store.get('sq-coins'),'100');assert.equal(f.store.has('sq-best'),false);assert.equal(f.store.has('sq-stats'),false);assert.equal(f.reloads(),1);
});
test('an identical history save needs no replacement choice or reload',async t=>{
  const data=coinlessRun(),f=await fixture(t,{data,remote:data});assert.equal(await f.sign(),'same');assert.equal(f.choices(),0);assert.equal(f.puts.length,0);assert.equal(f.reloads(),0);for(const [key,value]of Object.entries(data))assert.equal(f.store.get(key),value);
});
test('no wallet save uploads coinless local history without a replacement choice',async t=>{
  const data=coinlessRun(),f=await fixture(t,{data,remote:null});assert.equal(await f.sign(),'saved');assert.equal(f.choices(),0);assert.deepEqual(f.puts,[data]);
});
test('a truly empty device still loads wallet progress automatically',async t=>{
  const f=await fixture(t,{data:{'sq-name':J('Fixture'),'sq-map':J('greentown'),'sq-adv':J('adventurer'),'sq-autoalch':'true'}});assert.equal(await f.sign(),'loaded');assert.equal(f.choices(),0);assert.equal(f.store.get('sq-coins'),'100');assert.equal(f.reloads(),1);
});
