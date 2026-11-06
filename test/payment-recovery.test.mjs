import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import * as client from '../src/ranked-client.js';
import {paymentBrowser,storage} from './helpers/payment-browser.mjs';
const address='0x'+'12'.repeat(20),tx='0x'+'ab'.repeat(32),otherTx='0x'+'cd'.repeat(32);
const nonce={week:0,nonce:'fixture-nonce',message:'fixture',chainId:42161,dmt:'0x8b0e6f19ee57089f7649a455d89d7bc6314d04e8',collect:'0xa1e6e6ee71300c238935b7d59c8983b06e991be0',amountWei:'500000000000000000'};
const response=d=>new Response(JSON.stringify(d));
beforeEach(()=>{paymentBrowser();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:storage()});});
function wallet(sent,extra={}) {return {p:{request:async({method,params})=>{
  if(extra[method])return extra[method](params);
  if(method==='eth_requestAccounts')return[address];if(method==='eth_chainId')return'0xa4b1';
  if(method==='personal_sign')return'fixture-signature';if(method==='eth_sendTransaction'){sent.push(params[0]);return tx;}
  if(method==='eth_getTransactionReceipt')return{status:'0x1'};
}}};}
function backend(t,registered=[]){t.mock.method(globalThis,'fetch',async(url,options)=>{
 if(String(url).includes('nonce'))return response(nonce);
 registered.push(JSON.parse(options.body));return response({id:7,entry:'fixture-entry',week:0});
});return registered;}
test('overlapping payment requests send only once and recover the operation that paid',async t=>{
 const registered=backend(t),sent=[];let release,started;
 const start=new Promise(resolve=>{started=resolve;});
 const first=client.payEntry(wallet(sent,{eth_sendTransaction:async(params)=>{sent.push(params[0]);started();return new Promise(r=>{release=r;});}}),'/',()=>{});
 await Promise.race([start,first.then(()=>assert.fail('payment never reached the wallet request'))]);
 await assert.rejects(client.payEntry(wallet(sent),'/',()=>{}),/another tab|in progress|Check your saved payment/);
 release(tx);await first;
 assert.equal(sent.length,1);assert.deepEqual(registered.map(x=>x.tx),[tx]);
});
test('payment recovery capacity is reserved before broadcast',async t=>{
 backend(t);const sent=[];const original=localStorage.setItem;
 localStorage.setItem=(k,v)=>{if(k==='sq-ranked-payment')throw new Error('fixture quota');return original(k,v);};
 await assert.rejects(client.payEntry(wallet(sent),'/',()=>{}),/save|storage|quota/i);
 assert.equal(sent.length,0);
});
test('post-broadcast storage failure still shows the transaction and registers its exact payment',async t=>{
 const registered=backend(t),sent=[],links=[];const write=localStorage.setItem;let paid=false;
 localStorage.setItem=(k,v)=>{if(paid&&k==='sq-ranked-payment')throw new Error('fixture quota after payment');return write(k,v);};
 const w=wallet(sent,{eth_sendTransaction:async(params)=>{paid=true;sent.push(params[0]);return tx;}});
 await client.payEntry(w,'/',()=>{},x=>links.push(x));
 assert.deepEqual(links,[tx]);assert.deepEqual(registered.map(x=>x.tx),[tx]);assert.equal(sent.length,1);
});
test('registration never deletes a different pending payment',async t=>{
 const own={tx,signature:'sig-A',nonce:'nonce-A'},other={tx:otherTx,signature:'sig-B',nonce:'nonce-B'};
 localStorage.setItem('sq-ranked-payment',JSON.stringify(own));
 t.mock.method(globalThis,'fetch',async()=>{localStorage.setItem('sq-ranked-payment',JSON.stringify(other));return response({id:1,entry:'entry-A',week:0});});
 await client.recoverPayment('/',()=>{});
 assert.deepEqual(JSON.parse(localStorage.getItem('sq-ranked-payment')),other);
});
test('chain change during signing is refused before transfer',async t=>{
 backend(t);const sent=[];let chain='0xa4b1';
 await assert.rejects(client.payEntry(wallet(sent,{eth_chainId:()=>chain,personal_sign:()=>{chain='0x1';return'fixture-signature';}}),'/',()=>{}),/Arbitrum/);
 assert.equal(sent.length,0);
});
test('payment creation fails closed when cross-tab locking is unavailable',async t=>{
 backend(t);const sent=[];Object.defineProperty(navigator,'locks',{configurable:true,value:undefined});
 await assert.rejects(client.payEntry(wallet(sent),'/',()=>{}),/browser/);
 assert.equal(sent.length,0);
});
test('an invalid successful registration response retains recovery instead of forgetting the payment',async t=>{
 const payment={tx,signature:'fixture-signature',nonce:'fixture-nonce'};
 localStorage.setItem('sq-ranked-payment',JSON.stringify(payment));
 t.mock.method(globalThis,'fetch',async()=>response({}));
 await assert.rejects(client.recoverPayment('/',()=>{}),/entry|answer|server/i);
 assert.deepEqual(client.readRanked('sq-ranked-payment'),payment);
});
test('a reload can recover a broadcast payment from the tab backup when local writes failed',async t=>{
 const registered=backend(t),sent=[],links=[];const write=localStorage.setItem;let paid=false;
 localStorage.setItem=(k,v)=>{if(paid)throw new Error('fixture storage blocked');return write(k,v);};
 const w=wallet(sent,{eth_sendTransaction:async(params)=>{paid=true;sent.push(params[0]);return tx;}});
 await assert.rejects(client.payEntry(w,'/',()=>{},x=>links.push(x)),/registered|saved/i);
 assert.deepEqual(links,[tx]);assert.equal(sent.length,1);
 const reopened=await import('../src/ranked-client.js?payment-reload');
 assert.equal(reopened.readRanked('sq-ranked-payment').tx,tx);
 paid=false;await reopened.recoverPayment('/',()=>{});
 assert.deepEqual(registered.map(x=>x.tx),[tx,tx]);assert.equal(sent.length,1);
 assert.equal(reopened.readRanked('sq-ranked-payment'),null);
});
test('ambiguous wallet failure preserves a reservation and recovers from its transaction hash without paying again',async t=>{
 const registered=backend(t),sent=[];
 await assert.rejects(client.payEntry(wallet(sent,{eth_sendTransaction:async()=>{throw new Error('fixture disconnected after request');}}),'/',()=>{}),/wallet activity/i);
 assert.equal(client.readRanked('sq-ranked-payment').tx,null);
 await assert.rejects(client.payEntry(wallet(sent),'/',()=>{}),/saved payment/i);
 await assert.rejects(client.recoverPayment('/',()=>{},'bad'),/transaction hash/i);
 await client.recoverPayment('/',()=>{},tx);
 assert.deepEqual(registered.map(x=>x.tx),[tx]);assert.equal(sent.length,0);
});
test('explicit wallet rejection releases reservation; known payments cannot be cleared as unsent',async t=>{
 backend(t);const sent=[];
 await assert.rejects(client.payEntry(wallet(sent,{eth_sendTransaction:async()=>{throw Object.assign(new Error('rejected'),{code:4001});}}),'/',()=>{}),/rejected/);
 assert.equal(client.readRanked('sq-ranked-payment'),null);
 localStorage.setItem('sq-ranked-payment',JSON.stringify({tx,signature:'s',nonce:'n'}));
 await assert.rejects(client.clearUnsentPayment(),/saved payment/i);
 assert.equal(client.readRanked('sq-ranked-payment').tx,tx);
});

for(const failure of ['wrong transfer','reverted','refund','network','invalid response'])test(`a manual ${failure} candidate retains the reservation and accepts a corrected hash after reload`,async t=>{
 const reservation={tx:null,signature:'sig-A',nonce:'nonce-A',reserve:'0'.repeat(66)};
 for(const store of [localStorage,sessionStorage])store.setItem('sq-ranked-payment',JSON.stringify(reservation));
 const attempted=[];
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  const payment=JSON.parse(options.body);attempted.push(payment.tx);
  if(payment.tx===tx)return response({id:1,entry:'entry-A',week:0});
  if(failure==='network')throw new Error('fixture disconnected');
  if(failure==='invalid response')return response({});
  return new Response(JSON.stringify({error:failure==='reverted'?'that payment failed on-chain':'that transaction did not send the entry',...(failure==='refund'?{refund:true}:{})}),{status:400});
 });
 await assert.rejects(client.recoverPayment('/',()=>{},otherTx));
 for(const store of [localStorage,sessionStorage])assert.deepEqual(JSON.parse(store.getItem('sq-ranked-payment')),reservation);
 const reopened=await import(`../src/ranked-client.js?corrected-${encodeURIComponent(failure)}`);
 assert.deepEqual(reopened.readRanked('sq-ranked-payment'),reservation);
 await reopened.recoverPayment('/',()=>{},tx);
 assert.deepEqual(attempted,[otherTx,tx]);
 assert.equal(reopened.readRanked('sq-ranked-payment'),null);
});

test('recovering a stale tab reservation preserves a different shared pending payment',async t=>{
 const reservation={tx:null,signature:'sig-A',nonce:'nonce-A'},other={tx:otherTx,signature:'sig-B',nonce:'nonce-B'};
 sessionStorage.setItem('sq-ranked-payment',JSON.stringify(reservation));
 localStorage.setItem('sq-ranked-payment',JSON.stringify(other));
 backend(t);
 await client.recoverPayment('/',()=>{},tx);
 assert.deepEqual(JSON.parse(localStorage.getItem('sq-ranked-payment')),other);
 assert.equal(sessionStorage.getItem('sq-ranked-payment'),null);
 assert.deepEqual(client.readRanked('sq-ranked-payment'),other);
});

for(const target of ['localStorage','sessionStorage'])test(`broadcast persistence preserves a different ${target} payment`,async t=>{
 backend(t);const sent=[],other={tx:otherTx,signature:'sig-B',nonce:'nonce-B'};
 await client.payEntry(wallet(sent,{eth_sendTransaction:async(params)=>{
  sent.push(params[0]);globalThis[target].setItem('sq-ranked-payment',JSON.stringify(other));return tx;
 }}),'/',()=>{});
 assert.equal(sent.length,1);
 assert.deepEqual(JSON.parse(globalThis[target].getItem('sq-ranked-payment')),other);
});

test('a payment appearing during signing prevents a new broadcast without replacing its recovery',async t=>{
 backend(t);const sent=[],other={tx:otherTx,signature:'sig-B',nonce:'nonce-B'};
 await assert.rejects(client.payEntry(wallet(sent,{personal_sign:()=>{
  localStorage.setItem('sq-ranked-payment',JSON.stringify(other));return'fixture-signature';
 }}),'/',()=>{}),/saved|recovery/i);
 assert.equal(sent.length,0);
 assert.deepEqual(JSON.parse(localStorage.getItem('sq-ranked-payment')),other);
});
