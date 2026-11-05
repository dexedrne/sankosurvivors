import test from 'node:test';
import assert from 'node:assert/strict';
import {createWalletConnect,walletConnectLinks} from '../src/wallet-connect.js';
const A='0x'+'1'.repeat(40),B='0x'+'2'.repeat(40),ID='a'.repeat(32),TOPIC='b'.repeat(64),CHAIN='eip155:42161';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
const session=()=>({topic:TOPIC,namespaces:{eip155:{accounts:[CHAIN+':'+A]}}});
function setup({restored=false}={}){
 const handlers=new Map(),calls=[],configs=[],connections=[];let imports=0,disconnections=0;
 const sdk={session:restored?session():null,on:(event,fn)=>handlers.set(event,fn),abortPairingAttempt(){},
  connect:async options=>{connections.push(options);handlers.get('display_uri')?.('wc:fixture-pairing@2?fixture-only');sdk.session=session();return sdk.session;},
  disconnect:async()=>{disconnections++;sdk.session=null;},request:async(args,chain)=>{calls.push({args,chain});return'fixture-result';}};
 const load=async()=>{imports++;return{UniversalProvider:{init:async options=>{configs.push(options);return sdk;}}};};
 return{w:createWalletConnect(ID,'https://sankosurvivors.quest/path?private=never',load),sdk,calls,configs,connections,handlers,imports:()=>imports,disconnections:()=>disconnections};
}
test('discovery is lazy; missing or malformed public project IDs do not initialize',()=>{
 const f=setup();assert.equal(f.imports(),0);assert.equal(createWalletConnect('', ''),null);assert.equal(createWalletConnect('not-a-project','https://fixture.test'),null);
});
test('passive restore never pairs or prompts, but restores a previously approved session',async()=>{
 const empty=setup();assert.deepEqual(await empty.w.p.request({method:'eth_accounts'}),[]);assert.equal(empty.connections.length,0);
 const f=setup({restored:true});assert.deepEqual(await f.w.p.request({method:'eth_accounts'}),[A]);assert.equal(f.connections.length,0);assert.equal(f.w.p.ui,null);
});
test('connection pins Arbitrum, own origin/icon and minimal signing methods',async()=>{
 const f=setup();assert.deepEqual(await f.w.p.request({method:'eth_requestAccounts'}),[A]);const c=f.configs[0],ns=f.connections[0].namespaces.eip155;
 assert.deepEqual(ns.chains,[CHAIN]);assert.deepEqual(ns.methods,['personal_sign','eth_sendTransaction']);assert.equal(c.metadata.url,'https://sankosurvivors.quest');assert.equal(c.metadata.icons[0],'https://sankosurvivors.quest/icons/air-shard-512.png');assert.equal(c.metadata.redirect,undefined);assert.equal(c.telemetryEnabled,false);assert.match(c.customStoragePrefix,/^sankosurvivors-[\da-f-]{36}$/);assert.equal(f.w.p.ui,null);
});
test('simultaneous connection requests share one pairing',async()=>{
 const f=setup(),gate=deferred();f.sdk.connect=async options=>{f.connections.push(options);await gate.promise;f.sdk.session=session();};
 const a=f.w.p.request({method:'eth_requestAccounts'}),b=f.w.p.request({method:'eth_requestAccounts'});await Promise.resolve();await Promise.resolve();gate.resolve();assert.deepEqual(await a,[A]);assert.deepEqual(await b,[A]);assert.equal(f.connections.length,1);
});
test('only the active session and Arbitrum account changes affect the selected wallet',async()=>{
 const f=setup({restored:true}),seen=[];f.w.p.on('accountsChanged',a=>seen.push(a));await f.w.p.request({method:'eth_accounts'});
 const event=(topic,chainId,data)=>f.handlers.get('session_event')({topic,params:{chainId,event:{name:'accountsChanged',data}}});
 event('c'.repeat(64),CHAIN,[B]);event(TOPIC,'eip155:1',[B]);assert.equal(seen.length,0);
 event(TOPIC,CHAIN,[CHAIN+':'+B]);assert.deepEqual(seen,[[B]]);assert.deepEqual(await f.w.p.request({method:'eth_accounts'}),[B]);f.handlers.get('disconnect')();assert.deepEqual(seen,[[B],[]]);
});
test('existing payloads/results/errors pass through unchanged on the bound chain',async()=>{
 const f=setup({restored:true}),args={method:'personal_sign',params:['0x66697874757265',A]};assert.equal(await f.w.p.request(args),'fixture-result');assert.equal(f.calls[0].args,args);assert.equal(f.calls[0].chain,CHAIN);assert.equal(f.w.p.ui,null);
 const error=Object.assign(Error('fixture rejected'),{code:4001});f.sdk.request=async()=>{throw error;};await assert.rejects(f.w.p.request(args),e=>e===error);
});
test('only Arbitrum switching is acknowledged; a foreign session cannot send',async()=>{
 const f=setup({restored:true});assert.equal(await f.w.p.request({method:'eth_chainId'}),'0xa4b1');assert.equal(await f.w.p.request({method:'wallet_switchEthereumChain',params:[{chainId:'0xa4b1'}]}),null);
 await assert.rejects(f.w.p.request({method:'wallet_switchEthereumChain',params:[{chainId:'0x1'}]}),e=>e.code===4902);f.sdk.session={...session(),topic:'c'.repeat(64)};
 await assert.rejects(f.w.p.request({method:'eth_sendTransaction',params:[{}]}),e=>e.code===4100);assert.equal(f.calls.length,0);
});
test('cancelled pairing rejects promptly and cannot emit an adopted account after late approval',async()=>{
 const f=setup(),gate=deferred();f.sdk.connect=async()=>{f.handlers.get('display_uri')('wc:fixture@2?fixture-only');await gate.promise;f.sdk.session=session();};
 const connecting=f.w.p.request({method:'eth_requestAccounts'});for(let i=0;i<5;i++)await Promise.resolve();assert.equal(f.w.p.ui.phase,'pair');f.w.p.cancelConnect();await assert.rejects(connecting,e=>e.code===4001);gate.resolve();for(let i=0;i<5;i++)await Promise.resolve();assert.deepEqual(await f.w.p.request({method:'eth_accounts'}),[]);assert.equal(f.w.p.ui,null);
});
test('Back during an approval hides UI but never cancels or retries a submitted request',async()=>{
 const f=setup({restored:true}),gate=deferred();f.sdk.request=async()=>gate.promise;const sending=f.w.p.request({method:'eth_sendTransaction',params:[{}]});for(let i=0;i<5;i++)await Promise.resolve();assert.equal(f.w.p.ui.phase,'request');f.w.p.dismiss();gate.resolve('0x'+'d'.repeat(64));assert.equal(await sending,'0x'+'d'.repeat(64));assert.equal(f.w.p.ui,null);
});
test('Disconnect clears an approved session and account selection',async()=>{
 const f=setup({restored:true});await f.w.p.request({method:'wallet_revokePermissions'});assert.equal(f.disconnections(),1);assert.deepEqual(await f.w.p.request({method:'eth_accounts'}),[]);
});
test('failed initialization can retry',async()=>{
 const f=setup();let n=0;const w=createWalletConnect(ID,'https://sankosurvivors.quest',async()=>{if(++n===1)throw Error('fixture offline');return{UniversalProvider:{init:async()=>f.sdk}};});await assert.rejects(w.p.request({method:'eth_accounts'}),/fixture offline/);assert.deepEqual(await w.p.request({method:'eth_accounts'}),[]);
});
test('mobile links carry WalletConnect pairing, never game browser navigation',()=>{
 for(const [name,url]of walletConnectLinks('wc:fixture@2?secret=fixture-only')){assert.ok(['MetaMask','Rabby'].includes(name));assert.match(url,/uri=wc%3Afixture/);assert.doesNotMatch(url,/sankosurvivors|open-dapp|\/dapp\//);}
 for(const [,url]of walletConnectLinks())assert.doesNotMatch(url,/uri=|open-dapp|\/dapp\//);
});

function lifecycle(t) {
 const old=Object.getOwnPropertyDescriptor(globalThis,'localStorage'),values=new Map(),sessions=new Map(),clients=[];
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}});
 t.after(()=>{if(old)Object.defineProperty(globalThis,'localStorage',old);else delete globalThis.localStorage;});
 const load=async()=>({UniversalProvider:{init:async options=>{
  const handlers=new Map(),gate=deferred(),prefix=options.customStoragePrefix;
  const sdk={session:sessions.get(prefix)||null,handlers,gate,closed:false,on:(e,f)=>handlers.set(e,f),abortPairingAttempt(){},
   client:{core:{relayer:{transportClose:async()=>{sdk.closed=true;}}}},
   connect:async()=>{handlers.get('display_uri')?.('wc:fixture-'+clients.length+'@2?fixture-only');sdk.session=await gate.promise;sessions.set(prefix,sdk.session);return sdk.session;},
   disconnect:async()=>{sdk.session=null;sessions.delete(prefix);},request:async()=> 'fixture-result'};
  clients.push(sdk);return sdk;
 }}});
 return{clients,make:()=>createWalletConnect(ID,'https://sankosurvivors.quest',load)};
}
const tick=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
test('cancel A, approve B, then late A cannot replace B or survive as the restored session',async t=>{
 const f=lifecycle(t),w=f.make(),a=w.p.request({method:'eth_requestAccounts'});await tick();
 w.p.cancelConnect();await assert.rejects(a,e=>e.code===4001);
 const b=w.p.request({method:'eth_requestAccounts'});await tick();
 assert.equal(f.clients.length,2,'cancelled attempts must not share mutable SDK state');
 const screen=w.p.ui;f.clients[0].handlers.get('display_uri')('wc:old-fixture@2?fixture-only');assert.equal(w.p.ui,screen);
 const next={topic:'c'.repeat(64),namespaces:{eip155:{accounts:[CHAIN+':'+B]}}};
 f.clients[1].gate.resolve(next);assert.deepEqual(await b,[B]);f.clients[0].gate.resolve(session());await tick();
 assert.deepEqual(await w.p.request({method:'eth_accounts'}),[B]);assert.deepEqual(await f.make().p.request({method:'eth_accounts'}),[B]);
 assert.equal(f.clients[0].closed,true);
});
test('late cancelled approval alone is never restored on a new visit',async t=>{
 const f=lifecycle(t),w=f.make(),a=w.p.request({method:'eth_requestAccounts'});await tick();w.p.cancelConnect();await assert.rejects(a,e=>e.code===4001);
 f.clients[0].gate.resolve(session());await tick();assert.deepEqual(await f.make().p.request({method:'eth_accounts'}),[]);
});
test('selected granted account survives reload and a namespace removal never restores it',async t=>{
 const f=lifecycle(t),w=f.make(),connecting=w.p.request({method:'eth_requestAccounts'});await tick();
 const both=session();both.namespaces.eip155.accounts.push(CHAIN+':'+B);f.clients[0].gate.resolve(both);await connecting;
 f.clients[0].handlers.get('session_event')({topic:TOPIC,params:{chainId:CHAIN,event:{name:'accountsChanged',data:[B]}}});
 assert.deepEqual(await f.make().p.request({method:'eth_accounts'}),[B]);
 const seen=[];w.p.on('accountsChanged',a=>seen.push(a));
 f.clients[0].session={...both,namespaces:{eip155:{accounts:[]}}};f.clients[0].handlers.get('session_update')?.({topic:TOPIC,params:{namespaces:f.clients[0].session.namespaces}});
 assert.deepEqual(seen,[[]]);assert.deepEqual(await w.p.request({method:'eth_accounts'}),[]);
 await assert.rejects(w.p.request({method:'personal_sign',params:[]}),e=>e.code===4100);
});
test('active namespace replacement emits account revision, ignoring another session update',async()=>{
 const f=setup({restored:true}),seen=[];f.w.p.on('accountsChanged',a=>seen.push(a));await f.w.p.request({method:'eth_accounts'});
 f.handlers.get('session_update')?.({topic:'c'.repeat(64),params:{namespaces:{eip155:{accounts:[CHAIN+':'+B]}}}});assert.deepEqual(seen,[]);
 f.sdk.session={...session(),namespaces:{eip155:{accounts:[CHAIN+':'+B]}}};f.handlers.get('session_update')?.({topic:TOPIC,params:{namespaces:f.sdk.session.namespaces}});
 assert.deepEqual(seen,[[B]]);assert.deepEqual(await f.w.p.request({method:'eth_accounts'}),[B]);
});
