import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as W from '../src/wallet.js';
import { buyDmt, KYBER_ROUTER } from '../src/swap.js';
import { swapReceipt } from './fixtures/swap-receipt.mjs';

const captured = JSON.parse(readFileSync(new URL('./fixtures/kyber-build.json', import.meta.url), 'utf8'));
const A = '0x' + '1'.repeat(40), B = '0x' + '2'.repeat(40), TX = '0x' + 'ab'.repeat(32);
async function fixture() {
  const storage = new Map(), handlers = new Map(), calls = [];
  globalThis.localStorage = { getItem: k => storage.get(k) ?? null, setItem: (k,v) => storage.set(k,v), removeItem: k => storage.delete(k) };
  W.disconnect();
  const state = { accounts:[A], chain:'0xa4b1', send:async()=>TX, receipt:async()=>swapReceipt(), beforeAccounts:()=>{}, switch:async()=>null, add:async()=>null };
  const wallet = { name:'Fixture', p:{
    on:(name,fn)=>handlers.set(name,fn),
    async request({method,params}) {
      calls.push({method,params});
      if(method==='eth_requestAccounts')return state.accounts;
      if(method==='eth_accounts'){state.beforeAccounts();return state.accounts;}
      if(method==='eth_chainId')return state.chain;
      if(method==='eth_sendTransaction')return await state.send(params[0]);
      if(method==='eth_getTransactionReceipt')return await state.receipt();
      if(method==='wallet_switchEthereumChain')return await state.switch();
      if(method==='wallet_addEthereumChain')return await state.add();
      if(method==='wallet_revokePermissions')return null;
      throw new Error('Unexpected fixture method '+method);
    }
  } };
  await W.connect(wallet); calls.length=0;
  const q={quotedAt:Date.now(),requestedDmt:1,amountIn:captured.summary.amountIn,summary:captured.summary,ethIn:Number(captured.summary.amountIn)/1e18,minOut:1};
  const build=async()=>new Response(JSON.stringify({code:0,data:captured.build}));
  return {wallet,state,calls,q,build,accounts(a){state.accounts=a;handlers.get('accountsChanged')(a);},sends:()=>calls.filter(c=>c.method==='eth_sendTransaction').length,
    buy:(f=build,step=()=>{})=>buyDmt(wallet,A,q,step,f)};
}
for (const change of ['disconnect','other provider','account away/back','rejected new intent']) test(`buy stops before send after ${change} during build`,async()=>{
  const f=await fixture();
  const result=f.buy(async()=>{
    if(change==='disconnect')W.disconnect();
    if(change==='other provider')await W.connect({name:'Other',p:{request:async()=>[B]}});
    if(change==='account away/back'){f.accounts([B]);f.accounts([A]);}
    if(change==='rejected new intent')await assert.rejects(W.connect({p:{request:async()=>{throw new Error('fixture rejection');}}}));
    return f.build();
  });
  await assert.rejects(result,/wallet|account|connect/i); assert.equal(f.sends(),0);
});
test('stale wallet parameters are refused before any chain request',async()=>{
  const f=await fixture(); await W.connect({p:{request:async()=>[B]}});
  await assert.rejects(f.buy(),/wallet|account|connect/i);
  assert.deepEqual(f.calls,[]);
});
test('passive provider account disagreement refuses send without asking to reconnect',async()=>{
  const f=await fixture(); f.state.accounts=[B];
  await assert.rejects(f.buy(),/wallet|account|connect/i);
  assert.equal(f.sends(),0); assert.ok(f.calls.some(c=>c.method==='eth_accounts'));
  assert.equal(f.calls.some(c=>c.method==='eth_requestAccounts'),false);
});
test('chain is rechecked after the passive account response',async()=>{
  const f=await fixture(); f.state.beforeAccounts=()=>{f.state.chain='0x1';};
  await assert.rejects(f.buy(),/Arbitrum|chain/i); assert.equal(f.sends(),0);
});
test('identical account announcements keep a healthy buy valid',async()=>{
  const f=await fixture();
  const result=await f.buy(async()=>{f.accounts([A]);return f.build();});
  assert.equal(result.tx,TX); assert.equal(f.sends(),1);
  const sent=f.calls.find(c=>c.method==='eth_sendTransaction').params[0];
  assert.equal(sent.from,A); assert.equal(sent.to,KYBER_ROUTER); assert.equal(sent.chainId,'0xa4b1');
});
test('adding Arbitrum keeps its existing two-switch flow and sends only once',async()=>{
  const f=await fixture();let switches=0;
  f.state.switch=async()=>{if(++switches===1)throw Object.assign(new Error('unknown chain'),{code:4902});};
  assert.deepEqual(await f.buy(),{tx:TX});assert.equal(switches,2);
  assert.equal(f.calls.filter(c=>c.method==='wallet_addEthereumChain').length,1);assert.equal(f.sends(),1);
});
test('wallet changes during add-chain stop before a second switch or send',async()=>{
  const f=await fixture();f.state.switch=async()=>{throw Object.assign(new Error('unknown chain'),{code:4902});};
  f.state.add=async()=>W.disconnect();
  await assert.rejects(f.buy(),/wallet|connect/i);
  assert.equal(f.calls.filter(c=>c.method==='wallet_switchEthereumChain').length,1);assert.equal(f.sends(),0);
});
test('receipt-query failure retains the known hash and uncertain outcome',async()=>{
  const f=await fixture(); f.state.receipt=async()=>{throw new Error('fixture RPC outage');};
  await assert.rejects(f.buy(),e=>{assert.equal(e.tx,TX);assert.equal(e.uncertain,true);return true;});
  assert.equal(f.sends(),1);
});
test('notification failure after send still retains the known hash',async()=>{
  const f=await fixture();
  await assert.rejects(f.buy(f.build,text=>{if(text.startsWith('Swap sent.'))throw new Error('fixture UI redraw');}),e=>{assert.equal(e.tx,TX);return true;});
  assert.equal(f.sends(),1);
});
for (const bad of ['fixture-tx','0x1234','" onclick="unsafe',null,{}]) test(`malformed send hash ${JSON.stringify(bad)} is uncertain and never used for receipt lookup`,async()=>{
  const f=await fixture(); f.state.send=async()=>bad;
  await assert.rejects(f.buy(),e=>{assert.equal(e.tx,undefined);assert.equal(e.uncertain,true);return true;});
  assert.equal(f.sends(),1); assert.equal(f.calls.some(c=>c.method==='eth_getTransactionReceipt'),false);
});
test('non-cancellation send errors are not presented as a safe retry',async()=>{
  const f=await fixture(); f.state.send=async()=>{throw new Error('fixture transport failed');};
  await assert.rejects(f.buy(),e=>{assert.equal(e.uncertain,true);assert.match(e.message,/wallet|activity|sent|unknown/i);return true;});
  assert.equal(f.sends(),1);
});
test('provider error fields cannot forge a known hash or a definitive failed outcome',async()=>{
  const f=await fixture();
  f.state.send=async()=>{throw Object.assign(new Error('fixture provider fields'),{tx:'" onclick="unsafe',uncertain:false});};
  await assert.rejects(f.buy(),e=>{assert.equal(e.tx,undefined);assert.equal(e.uncertain,true);return true;});
});
test('pre-send provider error fields cannot pretend a swap was submitted',async()=>{
  const f=await fixture(); f.state.switch=async()=>{throw Object.assign(new Error('fixture chain error'),{tx:TX,uncertain:true});};
  await assert.rejects(f.buy(),e=>{assert.equal(e.tx,undefined);assert.notEqual(e.uncertain,true);return true;});
  assert.equal(f.sends(),0);
});
test('wallet rejection strips untrusted transaction fields',async()=>{
  const f=await fixture(); f.state.send=async()=>{throw Object.assign(new Error('rejected'),{code:4001,tx:'" onclick="unsafe'});};
  await assert.rejects(f.buy(),e=>{assert.equal(e.code,4001);assert.equal(e.tx,undefined);assert.notEqual(e.uncertain,true);return true;});
});
test('receipt permission rejection after a send remains uncertain with its known hash',async()=>{
  const f=await fixture(); f.state.receipt=async()=>{throw Object.assign(new Error('rejected'),{code:4001});};
  await assert.rejects(f.buy(),e=>{assert.equal(e.tx,TX);assert.equal(e.uncertain,true);assert.notEqual(e.code,4001);return true;});
});
test('explicit wallet rejection remains a cancelled, unsent buy',async()=>{
  const f=await fixture(); f.state.send=async()=>{throw Object.assign(new Error('rejected'),{code:4001});};
  await assert.rejects(f.buy(),e=>{assert.equal(e.code,4001);assert.notEqual(e.uncertain,true);return true;});
});
for (const patch of [{status:null},{status:'0x2'},{transactionHash:'0x'+'cd'.repeat(32)},{from:B},{to:B},{blockHash:null},{blockHash:'0x12'},{blockNumber:null},{transactionIndex:'0xno'}]) test(`inconsistent receipt ${JSON.stringify(patch)} stays uncertain with the original hash`,async()=>{
  const f=await fixture(); f.state.receipt=async()=>swapReceipt(patch);
  await assert.rejects(f.buy(),e=>{assert.equal(e.tx,TX);assert.equal(e.uncertain,true);return true;});
  assert.equal(f.sends(),1);
});
test('a genuine reverted receipt preserves its hash without claiming an unknown result',async()=>{
  const f=await fixture(); f.state.receipt=async()=>swapReceipt({status:'0x0'});
  await assert.rejects(f.buy(),e=>{assert.equal(e.tx,TX);assert.notEqual(e.uncertain,true);assert.match(e.message,/gas/);return true;});
});
test('a send already submitted keeps its original hash when the selected wallet changes',async()=>{
  const f=await fixture(); f.state.receipt=async()=>{
    W.disconnect(); await W.connect({p:{request:async()=>[B]}});
    return swapReceipt();
  };
  assert.deepEqual(await f.buy(),{tx:TX}); assert.equal(f.sends(),1); assert.equal(W.current().address,B);
});

test('expired quotes stop before requesting a wallet action',async()=>{
 const f=await fixture();f.q.quotedAt=Date.now()-61000;await assert.rejects(f.buy(),/expired|fresh|new quote/i);assert.deepEqual(f.calls,[]);
});
test('a quote that expires during the build cannot reach send',async()=>{
 const f=await fixture();await assert.rejects(f.buy(async()=>{f.q.quotedAt=Date.now()-61000;return f.build();}),/expired|fresh|new quote/i);assert.equal(f.sends(),0);
});

test('ETH budget buys bind the exact amount and refuse a changed budget before any wallet action',async()=>{
 const f=await fixture();delete f.q.requestedDmt;f.q.requestedEth='0.002';assert.equal((await f.buy()).tx,TX);assert.equal(f.sends(),1);
 const g=await fixture();delete g.q.requestedDmt;g.q.requestedEth='0.003';await assert.rejects(g.buy(),/ETH|amount|budget/i);assert.deepEqual(g.calls,[]);
});
