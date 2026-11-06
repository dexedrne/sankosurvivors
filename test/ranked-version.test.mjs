import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import * as client from '../src/ranked-client.js';
import {paymentBrowser,storage} from './helpers/payment-browser.mjs';
const CLIENT={build:'test-client',sim:'abcdefabcdef'},address='0x'+'12'.repeat(20),tx='0x'+'ab'.repeat(32);
const nonce={week:0,nonce:'fixture-nonce',message:'fixture',chainId:42161,dmt:'0x8b0e6f19ee57089f7649a455d89d7bc6314d04e8',collect:'0xa1e6e6ee71300c238935b7d59c8983b06e991be0',amountWei:'500000000000000000'};
const response=(d,status=200)=>new Response(JSON.stringify(d),{status});
beforeEach(()=>{paymentBrowser();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:storage()});});
for(const [name,data,status] of [['same sim old UI',{...CLIENT,build:'old'},200],['old sim',{...CLIENT,sim:'123456123456'},200],['missing',{},200],['null',null,200],['unavailable',{},503]])test('new payments refuse '+name+' before wallet prompts',async t=>{
 const methods=[];t.mock.method(globalThis,'fetch',async()=>response(data,status));
 await assert.rejects(client.payEntry({p:{request:async r=>methods.push(r.method)}},'/',()=>{},()=>{},'normal',0,CLIENT));
 assert.deepEqual(methods,[]);assert.equal(client.readRanked('sq-ranked-payment'),null);
});
test('offline metadata fails closed even when static version is available',async t=>{
 const urls=[];t.mock.method(globalThis,'fetch',async url=>{urls.push(url);if(String(url).endsWith('version.json'))return response(CLIENT);throw Error('offline');});
 await assert.rejects(client.requireRankedBuild('/',CLIENT),/verify|version|connect/i);
 assert.deepEqual(urls,['/api/ranked-version']);
});
test('a deployment during free signing refuses send without creating a false recovery reservation',async t=>{
 let build=CLIENT.build,versions=0;const methods=[];
 t.mock.method(globalThis,'fetch',async(url,options)=>{
   if(String(url).endsWith('ranked-version')){versions++;assert.equal(options.cache,'no-store');return response({...CLIENT,build});}
   const q=new URL(url,'https://fixture.test').searchParams;assert.equal(q.get('build'),CLIENT.build);assert.equal(q.get('sim'),CLIENT.sim);return response(nonce);
 });
 const wallet={p:{request:async({method})=>{methods.push(method);if(method==='eth_requestAccounts')return[address];if(method==='eth_chainId')return'0xa4b1';if(method==='personal_sign'){build='new-client';return'fixture-signature';}if(method==='eth_sendTransaction')throw Error('must not send');}}};
 await assert.rejects(client.payEntry(wallet,'/',()=>{},()=>{},'normal',0,CLIENT),e=>e.update===true&&e.status===409);
 assert.equal(versions,2);assert(methods.includes('personal_sign'));assert(!methods.includes('eth_sendTransaction'));assert.equal(client.readRanked('sq-ranked-payment'),null);
});
test('paid recovery never requests admission metadata',async t=>{
 localStorage.setItem('sq-ranked-payment',JSON.stringify({tx,signature:'old-sig',nonce:'old-nonce'}));
 t.mock.method(globalThis,'fetch',async(url,options)=>{assert.equal(url,'/api/ranked-enter');assert.deepEqual(JSON.parse(options.body),{tx,signature:'old-sig',nonce:'old-nonce'});return response({id:7,entry:'paid-entry',week:0});});
 await client.recoverPayment('/',()=>{});assert.equal(client.readRanked('sq-ranked-payment'),null);assert.equal(client.readRanked('sq-ranked-entries')[0].id,7);
});

test('new-start preflight and server refusal preserve the paid ready entry',async()=>{
 const {readFileSync}=await import('node:fs'),main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 const source=main.slice(main.indexOf('async function startRankedEntry('),main.indexOf('async function recoverRankedRun('));
 for(const at of ['preflight','server']) {
  const paid={id:7,entry:'paid-entry',week:0},saved=new Map([['sq-ranked-entries',[paid]]]),calls=[];
  const update=()=>Object.assign(Error('Update the game'),{status:409,update:true});
  const start=Function('rankedAction','rankedLive','SIM_ID','BUILD','BASE','requireRankedBuild','writeRanked','readRanked','$','rankedMessage','mapLoading','pickMap','rankedWeek','rankedApi','RunRecorder','startRun',source+';return startRankedEntry;')(
   fn=>fn(),()=>null,CLIENT.sim,CLIENT.build,'/',async()=>{calls.push('preflight');if(at==='preflight')throw update();},(k,v)=>saved.set(k,v),(k,f)=>saved.get(k)??f,()=>({value:'adventurer'}),()=>{},false,async()=>{calls.push('map');},{map:'greentown'},async(base,route,body)=>{calls.push('start');assert.equal(body.build,CLIENT.build);assert.equal(body.sim,CLIENT.sim);throw update();},class{},()=>{throw Error('must not play');});
  await assert.rejects(start(paid),e=>e.update===true);assert.deepEqual(saved.get('sq-ranked-entries'),[paid]);assert.equal(saved.has('sq-ranked-live'),false);assert.deepEqual(calls,at==='preflight'?['preflight']:['preflight','map','start']);
 }
});

test('a wallet chain change during the final version request refuses broadcast',async t=>{
 let chain='0xa4b1',versions=0;const methods=[];
 t.mock.method(globalThis,'fetch',async(url)=>{
  if(String(url).endsWith('ranked-version')){if(++versions===2)chain='0x1';return response(CLIENT);}
  return response(String(url).includes('nonce')?nonce:{id:7,entry:'paid-entry',week:0});
 });
 const wallet={p:{request:async({method})=>{methods.push(method);if(method==='eth_requestAccounts')return[address];if(method==='eth_chainId')return chain;if(method==='personal_sign')return'fixture-signature';if(method==='eth_sendTransaction')return tx;if(method==='eth_getTransactionReceipt')return{status:'0x1'};}}};
 await assert.rejects(client.payEntry(wallet,'/',()=>{},()=>{},'normal',0,CLIENT),/Arbitrum/);assert(!methods.includes('eth_sendTransaction'));assert.equal(client.readRanked('sq-ranked-payment'),null);
});
