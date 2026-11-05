import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as W from '../src/wallet.js';
import { why } from '../src/dmt.js';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const bind=main.slice(main.indexOf('function bindCloud('),main.indexOf('// open the game or come back'));
const globals=main.includes('let cloudConnecting =')?main.slice(main.indexOf('let cloudConnecting ='),main.indexOf('\n',main.indexOf('let cloudConnecting ='))):'';
const choose=main.slice(main.indexOf('choose: (wal, dev)'),main.indexOf('  note: (t) => banner',main.indexOf('choose: (wal, dev)')));
const A='0x'+'1'.repeat(40),B='0x'+'2'.repeat(40);
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
async function setup(t,{signedIn=false}={}){
  const previous=globalThis.localStorage,store=new Map(),nodes=new Map(),calls=[];
  globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
  W.disconnect();t.after(()=>{W.disconnect();globalThis.localStorage=previous;});
  const provider=address=>({p:{request:async({method})=>method==='wallet_revokePermissions'?null:[address]}});
  await W.connect(provider(A));
  let state=signedIn?{a:A,key:'fixture-a'}:null,offs=0,app;
  const $=id=>nodes.get(id)||null,msg=text=>{$('walletmsg').textContent=text;};
  nodes.set('walletmsg',{textContent:''});nodes.set('wallet',{classList:{contains:()=>false}});
  const cloud={state:()=>state,signIn:async(c,step)=>{const d=deferred();calls.push({kind:'signin',c,step,...d});return d.promise;},push:async()=>{const d=deferred();calls.push({kind:'push',...d});return d.promise;},signOut:()=>{offs++;state=null;}};
  function panel(){for(const k of ['wlcloud','wlcloudnow','wlcloudoff'])nodes.delete(k);for(const id of state?.a===W.current()?.address?['wlcloudnow','wlcloudoff']:['wlcloud'])nodes.set(id,{disabled:false});app?.bind(W.current(),msg);}
  app=Function('$','cloud','walletNow','walletRevision','renderWallet','why',`${globals}\nconst cancelPendingLoads=()=>{};const cloudFor=c=>{const s=cloud.state();return s&&c&&s.a.toLowerCase()===c.address.toLowerCase()?s:null;};${bind};return{bind:bindCloud};`)($,cloud,W.current,W.walletRevision,panel,why);
  panel();return{$,cloud,calls,msg,message:()=>$('walletmsg').textContent,rerender:panel,offs:()=>offs,
    async switchWallet(){await W.connect(provider(B));panel();},setSession:s=>state=s};
}
test('pending cloud sign-in stays single across balance rerenders and repeated events',async t=>{
  const f=await setup(t),old=f.$('wlcloud').onclick,first=old();f.rerender();
  const disabled=f.$('wlcloud').disabled,repeat=old(),second=f.$('wlcloud').onclick();
  const count=f.calls.length;for(const c of f.calls)c.resolve('same');await Promise.all([first,repeat,second]);
  assert.equal(count,1);assert.equal(disabled,true);
});
test('a stale cloud button cannot sign in after another wallet is selected',async t=>{
  const f=await setup(t),old=f.$('wlcloud').onclick;await f.switchWallet();
  const pending=old();for(const c of f.calls)c.resolve('same');await pending;assert.equal(f.calls.length,0);
});
test('old cloud errors and progress cannot overwrite a newer wallet request',async t=>{
  const f=await setup(t),first=f.$('wlcloud').onclick();await f.switchWallet();const second=f.$('wlcloud').onclick();
  f.msg('new wallet signing');f.calls[0].step('old signature progress');f.calls[0].reject(Error('old signature error'));await first;
  const message=f.message(),disabled=f.$('wlcloud').disabled;
  f.calls[1].resolve('same');await second;
  assert.equal(message,'new wallet signing');assert.equal(disabled,true);
});
test('an old sign-in error remains harmless if the replacement view has no sign-in button',async t=>{
  const f=await setup(t),first=f.$('wlcloud').onclick();await f.switchWallet();f.setSession({a:B,key:'fixture-b'});f.rerender();
  f.msg('new cloud session');f.calls[0].reject(Error('old failure'));
  await assert.doesNotReject(first);assert.equal(f.message(),'new cloud session');assert.ok(f.$('wlcloudoff'));
});
test('Save now feedback cannot claim a different wallet was saved',async t=>{
  const f=await setup(t,{signedIn:true}),saving=f.$('wlcloudnow').onclick();await f.switchWallet();f.msg('wallet B');f.calls[0].resolve(true);await saving;assert.equal(f.message(),'wallet B');
});
test('Save now reports a session expiry from its own upload',async t=>{
  const f=await setup(t,{signedIn:true}),saving=f.$('wlcloudnow').onclick();f.setSession(null);f.calls[0].resolve(false);await saving;
  assert.match(f.message(),/signed out/i);
});
test('an upload finishing after Turn off cannot replace the explicit off message',async t=>{
  const f=await setup(t,{signedIn:true}),saving=f.$('wlcloudnow').onclick();f.$('wlcloudoff').onclick();const off=f.message();f.calls[0].resolve(false);await saving;assert.equal(f.message(),off);
});
test('a queued old Turn off callback cannot sign out a replacement session',async t=>{
  const f=await setup(t,{signedIn:true}),off=f.$('wlcloudoff').onclick;await f.switchWallet();f.setSession({a:B,key:'fixture-b'});f.rerender();off();assert.equal(f.offs(),0);assert.equal(f.cloud.state().key,'fixture-b');
});
test('a cloud choice closes without choosing progress when the wallet changes',async t=>{
  const f=await setup(t),els=new Map();
  for(const id of ['cloudwal','clouddev','cloudusewal','cloudusedev','cloudpick']){const classes=new Set(['hidden']);els.set(id,{textContent:'',focus(){},classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)}});}
  const ui=Function('$','onWallet','walletRevision',`let cloudChoice=null;return{${choose}};`)(id=>els.get(id),W.onWallet,W.walletRevision);
  const selection=ui.choose({coins:100,maps:0,ranks:0,gear:0},{coins:500,maps:0,ranks:0,gear:0});
  await f.switchWallet();const closed=els.get('cloudpick').classList.contains('hidden');
  if(!closed)els.get('cloudusewal').onclick();
  const result=await selection;assert.equal(closed,true);assert.ok(result!=='cloud'&&result!=='device');
});
test('a settled old choice cannot hide a newer wallet choice',async t=>{
  const f=await setup(t),els=new Map();
  for(const id of ['cloudwal','clouddev','cloudusewal','cloudusedev','cloudpick']){const classes=new Set(['hidden']);els.set(id,{textContent:'',focus(){},classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)}});}
  const ui=Function('$','onWallet','walletRevision',`let cloudChoice=null;return{${choose}};`)(id=>els.get(id),W.onWallet,W.walletRevision);
  const summary={coins:100,maps:0,ranks:0,gear:0},first=ui.choose(summary,summary),old=els.get('cloudusewal').onclick;
  await f.switchWallet();await first;
  const second=ui.choose(summary,summary);old();const hidden=els.get('cloudpick').classList.contains('hidden');els.get('cloudusedev').onclick();await second;
  assert.equal(hidden,false);
});

test('initial sign-in upload completion cannot replace a subsequent Turn off message',async t=>{
  const f=await setup(t),signing=f.$('wlcloud').onclick();f.setSession({a:A,key:'fixture-a'});f.rerender();
  f.$('wlcloudoff').onclick();const off=f.message();f.calls[0].resolve('pending');await signing;
  assert.equal(f.message(),off);assert.equal(f.cloud.state(),null);assert.doesNotMatch(f.message(),/retry automatically/);
});
test('initial sign-in expiry redraws the signed-out controls',async t=>{
  const f=await setup(t),signing=f.$('wlcloud').onclick();f.setSession({a:A,key:'fixture-a'});f.rerender();
  f.setSession(null);f.calls[0].reject(Error('Cloud save is signed out. Sign in again to upload your progress.'));await signing;
  assert.match(f.message(),/signed out/);assert.ok(f.$('wlcloud'));assert.equal(f.$('wlcloudnow'),null);
});
