import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as W from '../src/wallet.js';
import { why } from '../src/dmt.js';

const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const globals=main.slice(main.indexOf('let buyWant ='),main.indexOf('function bindBuy('));
const bind=main.slice(main.indexOf('function bindBuy('),main.indexOf('function openWallet()'));
const walletView=main.slice(main.indexOf('function renderWallet()'),main.indexOf('// ---- cloud save on the wallet'));
const A='0x'+'1'.repeat(40),B='0x'+'2'.repeat(40),TX='0x'+'ab'.repeat(32);
const q1={dmtOut:1,minOut:'0.9',ethIn:0.001,usdIn:0,loss:null},q2={dmtOut:2,minOut:'1.8',ethIn:0.005,usdIn:0,loss:null};
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};}
async function fixture(onBuy=async()=>({tx:TX})){
  const store=new Map(),nodes=new Map(),quotes=[],buys=[];
  globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
  W.disconnect();
  const provider=address=>({name:'Fixture',p:{request:async({method})=>method==='wallet_revokePermissions'?null:[address]}});
  await W.connect(provider(A));
  let buttons=[],orderButtons=[],app;
  const $=id=>nodes.get(id)||null;
  const doc={querySelectorAll:s=>s==='.wlbuyorder'?orderButtons:buttons,querySelector:s=>buttons.find(b=>s.includes('"'+b.dataset.dmt+'"'))};
  const msg=text=>{$('walletmsg').textContent=text;};
  function panel(){
    const box={className:'',html:'',textContent:'',get innerHTML(){return this.html;},set innerHTML(value){this.html=value;if($('wlbuyq')===this){nodes.delete('wlbuygo');if(value.includes('id="wlbuygo"'))nodes.set('wlbuygo',{disabled:false});}}};
    Object.defineProperty(box,'textContent',{get(){return this.html;},set(value){this.html=value;if($('wlbuyq')===this)nodes.delete('wlbuygo');}});
    nodes.set('wlbuyq',box);nodes.delete('wlbuygo');
    const plan={html:'',get innerHTML(){return this.html;},set innerHTML(value){this.html=value;orderButtons=Array.from(value.matchAll(/data-order="(\d+)"/g),m=>({dataset:{order:m[1]},click(){return this.onclick?.();}}));},textContent:''};
    nodes.set('wlbuyplan',plan);
    for(const id of ['wlbuycustom','wlbuybudget'])nodes.set(id,{value:id==='wlbuybudget'?'1':'100'});
    for(const id of ['wlbuycustomquote','wlbuycompare'])nodes.set(id,{});
    buttons=[1,2].map(dmt=>({dataset:{dmt:String(dmt)},classList:{toggle(){}},click(){return this.onclick?.();}}));
    if(!nodes.has('walletmsg'))nodes.set('walletmsg',{textContent:''});
    app?.bind(W.current(),{eth:1},msg);return box;
  }
  app=Function('$','document','walletNow','walletRevision','quoteDmt','quoteEth','compareEthBuys','buyDmt','why','arbiscanTx','esc','short','renderWallet',`
    const MIN_BUY_DMT=1,MAX_BUY_DMT=10000,cancelPendingLoads=()=>{},ETH_FOR_GAS=0.000005,BRIDGE='fixture',refreshBalances=()=>{},walletChoices=()=>({html:'Connect fixture',bind(){}});
    ${globals}
    ${bind}
    const view=(${walletView});
    return {bind:bindBuy,want:v=>{buyWant=v;},quote:()=>buyQuote?.q||buyQuote,busy:()=>typeof buyBusy!=='undefined'&&!!buyBusy,
      disconnected(){ $('walletmsg').textContent='';view();return $('walletbody').innerHTML; }};
  `)($,doc,W.current,W.walletRevision,amount=>{const d=deferred();quotes.push({amount,kind:'dmt',...d});return d.promise;},amount=>{const d=deferred();quotes.push({amount,kind:'eth',...d});return d.promise;},amount=>{const d=deferred();quotes.push({amount,kind:'compare',...d});return d.promise;},async(w,address,q,step)=>{buys.push({w,address,q});return await onBuy(step);},why,tx=>'https://arbiscan.io/tx/'+tx,s=>String(s).replace(/[<>"&]/g,''),a=>a.slice(0,6)+'…'+a.slice(-4),panel);
  panel();
  nodes.set('walletbody',{innerHTML:''});
  return{app,$,quotes,buys,msg,box:()=>$('wlbuyq'),go:()=>$('wlbuygo'),message:()=>$('walletmsg').textContent,
    quote:async(i=0,q=q1)=>{const pending=buttons[i].click();quotes.at(-1).resolve(q);await pending;},
    beginQuote:i=>buttons[i].click(),compare:()=>$('wlbuycompare').onclick(),custom:()=>$('wlbuycustomquote').onclick(),order:i=>orderButtons[i].click(),row:i=>orderButtons[i].onclick,
    async switchWallet(){await W.connect(provider(B));panel();},
    rerender:panel,async flushQuotes(){for(const pending of quotes)pending.resolve(q2);for(let i=0;i<4;i++)await Promise.resolve();}};
}
test('out-of-order quotes keep the latest amount and Buy action',async()=>{
  const f=await fixture(),one=f.beginQuote(0),two=f.beginQuote(1);
  f.quotes[1].resolve(q2);await two;f.quotes[0].resolve(q1);await one;
  assert.equal(f.app.quote(),q2);await f.go().onclick();assert.equal(f.buys[0].q,q2);
});
test('old quote error cannot replace a newer successful quote',async()=>{
  const f=await fixture(),one=f.beginQuote(0),two=f.beginQuote(1);
  f.quotes[1].resolve(q2);await two;f.quotes[0].reject(new Error('old quote error'));await one;
  assert.ok(f.go());assert.doesNotMatch(f.box().innerHTML,/old quote error/);
});
test('detached old quote cannot bind the newer wallet Buy button',async()=>{
  const f=await fixture(),old=f.beginQuote(0);
  await f.switchWallet();await f.quote(1,q2);
  f.quotes[0].resolve(q1);await old;
  assert.equal(f.app.quote(),q2);await f.go().onclick();
  assert.equal(f.buys[0].address,B);assert.equal(f.buys[0].q,q2);
});
test('old Buy button cannot start after a different connection intent',async()=>{
  const f=await fixture();await f.quote();const go=f.go().onclick;
  await assert.rejects(W.connect({p:{request:async()=>{throw new Error('fixture rejected new choice');}}}));
  await go();assert.equal(f.buys.length,0);assert.match(f.message(),/wallet|quote/i);
});
test('a queued old Buy callback cannot send after a newer quote replaced its button',async()=>{
  const f=await fixture();await f.quote();const old=f.go().onclick;
  await f.quote(1,q2);await old();
  assert.equal(f.buys.length,0);assert.equal(f.go().disabled,false);
});
test('one pending buy survives rerenders and repeated events',async()=>{
  const pending=deferred(),f=await fixture(()=>pending.promise);await f.quote();f.app.want(1);
  const oldGo=f.go().onclick,first=oldGo();f.rerender();
  const repeat=oldGo(),newGo=f.go()?.onclick;
  const newest=newGo?newGo():undefined;
  const requests=f.buys.length;
  pending.resolve({tx:TX});await Promise.all([first,repeat,newest]);
  assert.equal(requests,1);assert.equal(f.app.busy(),false);
});
test('quote clicks during a pending buy cannot overwrite its financial status',async()=>{
  const pending=deferred(),f=await fixture(()=>pending.promise);await f.quote();
  const buying=f.go().onclick(),quote=f.beginQuote(1),requests=f.quotes.length;
  if(f.quotes.length>1)f.quotes[1].resolve(q2);
  pending.resolve({tx:TX});await Promise.all([buying,quote]);
  assert.equal(requests,1);assert.ok(f.box().innerHTML.includes(TX));
});
for(const change of ['wallet','intent'])test(`cached ranked quote is not reauthorized by rerender after new ${change}`,async()=>{
  const f=await fixture();await f.quote();f.app.want(1);
  if(change==='wallet')await f.switchWallet();else{await assert.rejects(W.connect({p:{request:async()=>{throw new Error('new intent');}}}));f.rerender();}
  const restored=!!f.go(),cache=f.app.quote();await f.flushQuotes();
  assert.equal(restored,false);assert.equal(cache,null);
});
test('a price request clears the previous cached Buy before a balance rerender',async()=>{
  const f=await fixture();await f.quote();f.app.want(1);
  const waiting=f.beginQuote(1);f.rerender();const restored=!!f.go();
  await f.flushQuotes();await waiting;
  assert.equal(restored,false);assert.equal(f.app.quote(),q2);
});
for(const hash of [null,TX])test(`uncertain submitted ${hash?'known':'unknown'} hash does not restore consumed quote on rerender`,async()=>{
  const f=await fixture(async()=>{throw Object.assign(new Error('Check wallet activity'),{uncertain:true,...(hash?{tx:hash}:{})});});
  await f.quote();f.app.want(1);await f.go().onclick();f.rerender();
  const restored=!!f.go(),cache=f.app.quote();await f.flushQuotes();
  assert.equal(restored,false);assert.equal(cache,null);
});
test('uncertain send without hash does not recreate an enabled retry button',async()=>{
  const f=await fixture(async()=>{throw Object.assign(new Error('Check wallet activity'),{uncertain:true});});
  await f.quote();await f.go().onclick();
  assert.equal(f.go(),null);assert.match(f.message(),/wallet activity/i);
});
test('an uncertain submitted outcome is never labelled as a failed transaction',async()=>{
  const f=await fixture(async()=>{throw Object.assign(new Error('Swap outcome is not confirmed. Check your wallet activity before buying again.'),{uncertain:true,tx:TX});});
  await f.quote();await f.go().onclick();
  assert.doesNotMatch(f.message(),/didn't work|failed/i);assert.match(f.message(),/not confirmed/);
});
test('untrusted error hash is never inserted into a transaction link',async()=>{
  const f=await fixture(async()=>{throw Object.assign(new Error('fixture failure'),{tx:'" onclick="unsafe'});});
  await f.quote();await f.go().onclick();
  assert.doesNotMatch(f.box().innerHTML,/onclick=|https:\/\/arbiscan.io\/tx\/"/);
});
for(const outcome of ['success','uncertain'])test(`submitted ${outcome} after a wallet switch keeps original wallet identity and hash`,async()=>{
  const pending=deferred(),f=await fixture(()=>pending.promise);await f.quote();const buying=f.go().onclick();
  await f.switchWallet();
  if(outcome==='success')pending.resolve({tx:TX});else pending.reject(Object.assign(new Error('Check wallet activity'),{tx:TX,uncertain:true}));
  await buying;
  assert.match(f.message(),/0x1111/);assert.ok(f.box().innerHTML.includes(TX));
  assert.doesNotMatch(f.message(),/^Bought\. Your DMT is in your wallet\.$/);
  assert.equal(f.buys.length,1);
});
for(const outcome of ['success','uncertain'])test(`disconnected view retains submitted ${outcome} hash after clearing status on reopen`,async()=>{
  const pending=deferred(),f=await fixture(()=>pending.promise);await f.quote();const buying=f.go().onclick();
  W.disconnect();if(outcome==='success')pending.resolve({tx:TX});else pending.reject(Object.assign(new Error('Check activity'),{uncertain:true,tx:TX}));
  await buying;const html=f.app.disconnected();
  assert.ok(html.includes(TX));assert.match(html,/0x1111/);assert.ok(html.includes('Connect fixture'));
});

const plan=()=>({orders:[1,2,4,10].map((parts,i)=>({parts,quote:{...q1,requestedEth:String(1/parts),amountIn:String(10n**18n/BigInt(parts)),summary:{route:[[{exchange:'Fixture pool'}]]}},gasWei:2000000000000n,netRate:100+i})),bestIndex:3});
test('custom DMT accepts larger quantities through the existing confirmation flow',async()=>{
  const f=await fixture();f.$('wlbuycustom').value='250';const quoting=f.custom();
  assert.equal(f.quotes.at(-1).amount,250);f.quotes.at(-1).resolve(q2);await quoting;
  await f.go().onclick();assert.equal(f.buys[0].q,q2);assert.match(f.box().innerHTML,/0x/);
});
test('calculator compares a budget and selecting a row requests a fresh single-order quote',async()=>{
  const f=await fixture();const comparing=f.compare();assert.equal(f.quotes.at(-1).kind,'compare');
  f.quotes.at(-1).resolve(plan());await comparing;
  assert.match(f.$('wlbuyplan').innerHTML,/one order|single order/i);assert.match(f.$('wlbuyplan').innerHTML,/gas|fresh|pool/i);
  const selecting=f.order(3);assert.equal(f.quotes.at(-1).kind,'eth');assert.equal(f.quotes.at(-1).amount,'0.1');
  assert.equal(f.buys.length,0);f.quotes.at(-1).resolve(q2);await selecting;await f.go().onclick();assert.equal(f.buys[0].q,q2);
});
test('a detached comparison result and its old row cannot replace or authorize a newer price',async()=>{
  const f=await fixture();const comparing=f.compare();f.quotes.at(-1).resolve(plan());await comparing;
  const old=f.$('wlbuyplan'),oldRow=f.row(0);f.rerender();assert.equal(old===f.$('wlbuyplan'),false);
  await f.quote(1,q2);await oldRow();assert.equal(f.app.quote(),q2);assert.equal(f.buys.length,0);
});
test('changing a budget invalidates the cached Buy and ignores a pending comparison',async()=>{
  const f=await fixture();await f.quote();const old=f.go().onclick;
  const comparing=f.compare();f.$('wlbuybudget').value='.5';f.$('wlbuybudget').oninput();
  f.quotes.at(-1).resolve(plan());await comparing;await old();
  assert.equal(f.app.quote(),null);assert.equal(f.go(),null);assert.equal(f.$('wlbuyplan').innerHTML,'');assert.equal(f.buys.length,0);
});

test('the calculator works while disconnected and cannot create a Buy action',async()=>{
  const f=await fixture();W.disconnect();const html=f.app.disconnected();assert.match(html,/Compare order sizes/);
  const comparing=f.compare();f.quotes.at(-1).resolve(plan());await comparing;
  const selecting=f.order(0);f.quotes.at(-1).resolve(q2);await selecting;
  assert.equal(f.go(),null);assert.equal(f.buys.length,0);assert.match(f.box().innerHTML,/Connect a wallet/);
});

test('an expired visible price refreshes without sending or automatically confirming',async()=>{
  const f=await fixture();await f.quote(1,{...q2,requestedDmt:2,quotedAt:Date.now()-61000});
  const refresh=f.go().onclick();assert.equal(f.quotes.at(-1).amount,2);assert.equal(f.buys.length,0);
  f.quotes.at(-1).resolve(q1);await refresh;assert.equal(f.app.quote(),q1);assert.equal(f.buys.length,0);
  await f.go().onclick();assert.equal(f.buys.length,1);
});
test('ETH quote presentation preserves the exact budget instead of rounding away the amount',async()=>{
  const f=await fixture();const q={...q1,requestedEth:'0.000001234567890123',ethIn:.000001234567890123};
  await f.quote(0,q);assert.match(f.box().innerHTML,/0\.000001234567890123 ETH/);
});
test('reordered comparisons only expose the newest requested budget',async()=>{
  const f=await fixture(),old=f.compare();f.$('wlbuybudget').value='.5';const newer=f.compare();
  const smaller=plan();smaller.orders.forEach(o=>{o.quote={...o.quote,requestedEth:String(Number(o.quote.requestedEth)/2)};});
  f.quotes[1].resolve(smaller);await newer;f.quotes[0].resolve(plan());await old;
  const row=f.order(0);assert.equal(f.quotes.at(-1).amount,'0.5');f.quotes.at(-1).resolve(q1);await row;
});
for(const pending of [false,true])test(`a DMT quote clears a ${pending?'pending':'completed'} comparison`,async()=>{
  const f=await fixture(),comparing=f.compare(),comparison=f.quotes.at(-1);
  if(!pending){comparison.resolve(plan());await comparing;assert.match(f.$('wlbuyplan').innerHTML,/Best estimated rate/);}
  const quoting=f.beginQuote(1);f.quotes.at(-1).resolve(q2);await quoting;
  if(pending){comparison.resolve(plan());await comparing;}
  assert.equal(f.$('wlbuyplan').innerHTML,'');assert.equal(f.app.quote(),q2);
});
