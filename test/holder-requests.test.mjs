import test from 'node:test';
import assert from 'node:assert/strict';
import { prove } from '../src/dmt.js';
const A='0x'+'1'.repeat(40),reply=body=>new Response(JSON.stringify(body));
function fixture(t){
 const previous=globalThis.localStorage;let writes=0;globalThis.localStorage={getItem:()=>null,setItem(){writes++;},removeItem(){}};t.after(()=>globalThis.localStorage=previous);
 const network=[];t.mock.method(globalThis,'fetch',async url=>{network.push(url);return reply(url.endsWith('/nonce')?{nonce:'fixture',message:'fixture sign-in'}:{holder:false,address:A,balance:'0'});});
 return{network,writes:()=>writes};
}
for(const method of ['eth_requestAccounts','personal_sign'])for(const kind of ['reject','throw'])test(`holder ${method} ${kind} balances the actual request callback`,async t=>{
 const f=fixture(t),events=[],failure=Error('fixture rejected'),wallet={p:{request(args){if(args.method===method){if(kind==='throw')throw failure;return Promise.reject(failure);}return Promise.resolve([A]);}}};
 await assert.rejects(prove(wallet,'./',()=>{},()=>{},active=>events.push(active)),failure);
 assert.deepEqual(events,method==='personal_sign'?[true,false,true,false]:[true,false]);assert.equal(f.network.includes('./api/holder'),false);assert.equal(f.writes(),0);
});
test('holder prompt lifetime ends before HTTP verification and keeps signature params unchanged',async t=>{
 const f=fixture(t),events=[],requests=[],steps=[],wallet={p:{async request(args){requests.push(args);return args.method==='eth_requestAccounts'?[A]:'fixture-signature';}}};
 const result=await prove(wallet,'./',text=>steps.push([text,events.at(-1)]),()=>{},active=>events.push(active));
 assert.deepEqual(events,[true,false,true,false]);assert.equal(steps.at(-1)[1],false);assert.equal(requests[1].method,'personal_sign');assert.deepEqual(requests[1].params,['0x'+Buffer.from('fixture sign-in').toString('hex'),A]);assert.equal(result.holder,false);assert.equal(f.network.at(-1),'./api/holder');
});
test('legacy holder callers without a request callback retain the same flow',async t=>{
 const f=fixture(t),wallet={p:{async request(args){return args.method==='eth_requestAccounts'?[A]:'fixture-signature';}}};const result=await prove(wallet,'./',()=>{});assert.equal(result.address,A);assert.deepEqual(f.network,['./api/nonce','./api/holder']);
});
