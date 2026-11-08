import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {paymentBrowser,CLIENT,mockRankedFetch,storage} from './helpers/payment-browser.mjs';
import {payEntry} from '../src/ranked-client.js';
import {weekOf,weekStart} from '../src/ranked.js';
const wallet='0x'+'12'.repeat(20),collect='0xa1e6e6ee71300c238935b7d59c8983b06e991be0',token='0x8b0e6f19ee57089f7649a455d89d7bc6314d04e8';
beforeEach(()=>{paymentBrowser();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:storage()});});
for(const missingConsent of [false,true])test('new-policy payment '+(missingConsent?'requires cutoff consent':'rechecks closing after wallet signing'),async t=>{
 const week=weekOf(),deadline=weekStart(week+1),closesAt=deadline-1800000,methods=[];
 mockRankedFetch(t,async url=>new Response(JSON.stringify(String(url).includes('nonce?')?{
  nonce:'signed',message:'Deadline warning',week,chainId:42161,dmt:token,collect,amountWei:week>=1?'1000000000000000000':'500000000000000000',clockVersion:1,deadline,closesAt,serverNow:closesAt-60000
 }:{week,deadline,closesAt,endsAt:deadline,serverNow:closesAt,open:true})));
 const w={p:{request:async({method})=>{methods.push(method);if(method==='eth_requestAccounts')return[wallet];if(method==='eth_chainId')return'0xa4b1';if(method==='personal_sign')return'signature';if(method==='eth_sendTransaction')throw Error('must not broadcast');}}};
 await assert.rejects(payEntry(w,'/',()=>{},()=>{},'normal',week,{...CLIENT,...(missingConsent?{}:{deadline})}),missingConsent?/acknowledge|consent|cutoff/i:/closed|reset/i);
 assert(!methods.includes('eth_sendTransaction'));assert.equal(localStorage.getItem('sq-ranked-payment'),null);
 if(missingConsent)assert(!methods.includes('personal_sign'));
});
