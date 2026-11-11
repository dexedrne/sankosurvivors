import test from 'node:test';
import assert from 'node:assert/strict';
import {quoteEth,MAX_BUY_WEI} from '../src/swap.js';
import {compareEthBuys} from '../src/swap-planner.js';

const price=async url=>{
 const input=new URL(url).searchParams.get('amountIn');
 return new Response(JSON.stringify({code:0,data:{routeSummary:{amountIn:input,amountOut:String(BigInt(input)*3000n),gas:'100000',gasPrice:'20000000',gasUsd:'.004',route:[[]]}}}));
};
test('ETH-budget quotes preserve decimal input exactly and enforce the supported budget',async()=>{
 const q=await quoteEth('0.123456789012345678',price);
 assert.equal(q.amountIn,'123456789012345678');assert.equal(q.requestedEth,'0.123456789012345678');
 assert.equal(q.dmtOut,370.370367);assert.equal(MAX_BUY_WEI,10n**18n);
 for(const input of ['0','-1','1.000000000000000001','1e-3','Infinity','.','0.1234567890123456789'])
  await assert.rejects(quoteEth(input,price),/ETH|amount/i);
});
test('a budget quote rejects a response for a different ETH input',async()=>{
 await assert.rejects(quoteEth('0.1',async()=>new Response(JSON.stringify({code:0,data:{routeSummary:{amountIn:'1000000000000000000',amountOut:'100000000000000000000'}}}))),/price|amount|quote/i);
});
test('comparison returns one quote per order size and ranks rates including estimated gas',async()=>{
 const plan=await compareEthBuys('1',price);
 assert.deepEqual(plan.orders.map(o=>o.parts),[1,2,4,10]);
 assert.deepEqual(plan.orders.map(o=>o.quote.amountIn),['1000000000000000000','500000000000000000','250000000000000000','100000000000000000']);
 assert.equal(plan.bestIndex,0,'equal pool prices favour one order with less gas per ETH');
 for(const order of plan.orders){assert(order.gasWei>0n);assert(order.netRate>0);assert(!Object.hasOwn(order,'totalDmt'),'a snapshot must not promise output for later orders');}
});
test('unavailable gas stays unknown instead of creating a best-rate claim',async()=>{
 const f=async url=>{
  const r=await price(url),d=await r.json();delete d.data.routeSummary.gasPrice;return new Response(JSON.stringify(d));
 };
 const plan=await compareEthBuys('1',f);
 assert.equal(plan.bestIndex,null);assert(plan.orders.every(o=>o.gasWei===null));
});

test('a failed full-size quote still leaves smaller order sizes available',async()=>{
 const f=async url=>new URL(url).searchParams.get('amountIn')==='1000000000000000000'?new Response('{}',{status:503}):price(url);
 const plan=await compareEthBuys('1',f);assert(plan.orders[0].error);assert.equal(plan.orders[1].quote.requestedEth,'0.5');assert.equal(plan.bestIndex,null);
});
test('a zero or unavailable gas estimate never claims a best rate',async()=>{
 const f=async url=>{const d=await(await price(url)).json();d.data.routeSummary.gas='0';return new Response(JSON.stringify(d));};
 assert.equal((await compareEthBuys('1',f)).bestIndex,null);
});
test('an ETH budget with no representable guaranteed DMT output is refused',async()=>{
 const f=async url=>new Response(JSON.stringify({code:0,data:{routeSummary:{amountIn:new URL(url).searchParams.get('amountIn'),amountOut:'1'}}}));
 await assert.rejects(quoteEth('0.1',f),/minimum|small|output/i);
});
