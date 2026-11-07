import test from 'node:test';
import assert from 'node:assert/strict';
const buns = await import('../src/bun-companions.js').catch(error => { if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error; return {}; });
const A = '0x' + '1'.repeat(40), B = '0x' + '2'.repeat(40);
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return { promise, resolve, reject }; };
const pets = [
  { tokenId:'3351', variety:'Mini', type:'Bun', eligible:true },
  { tokenId:'3969', variety:'Orange', type:'Bun', eligible:true },
  { tokenId:'9', variety:'Mini', type:'Egg', eligible:false },
  { tokenId:'10', variety:'unknown', type:'Bun', eligible:false },
];
function setup() {
  assert.equal(typeof buns.createBunCompanions, 'function');
  let wallet={address:A}, revision=1, clock=1000; const requests=[], changes=[];
  const companion = buns.createBunCompanions({ walletNow:()=>wallet, walletRevision:()=>revision, now:()=>clock,
    load:(address, options)=>{ const d=deferred(); requests.push({address,options,...d}); return d.promise; },
    onChange:()=>changes.push(companion.state()),
  });
  function finish(i, patch={}) { const req=requests[i]; req.resolve({status:'ready',address:req.address,identity:req.options.identity,block:{number:'0x123',hash:'0x'+'a'.repeat(64)},pets,...patch}); }
  return {companion, requests, changes, finish, wallet:(address, rev=revision+1)=>{wallet=address?{address}:null;revision=rev;}, tick:ms=>{clock+=ms;}};
}

test('a saved Bun token choice is bounded canonical preference, never an asset URL or ownership proof', () => {
  assert.equal(typeof buns.bunChoice,'function');
  for(const id of ['0','3351',((1n<<256n)-1n).toString()]) assert.equal(buns.bunChoice('bun:'+id),'bun:'+id);
  for(const value of [null,{},'chicken','bun:Mini','bun:03351','bun:-1','bun:1e3','bun:'+((1n<<256n)).toString(),'https://bad/model.glb','bun:3351\"']) assert.equal(buns.bunChoice(value),null);
  const s=setup(); assert.equal(s.companion.resolve('bun:3351'),null); assert.deepEqual(s.companion.state().pets,[]);
});
test('only ready current pinned ownership resolves hatched allowlisted Mini and Orange companions', async () => {
  const s=setup(), pending=s.companion.refresh();
  assert.equal(s.companion.state().status,'loading'); assert.equal(s.companion.resolve('bun:3351'),null);
  s.finish(0); assert.equal(await pending,true); assert.equal(s.companion.state().status,'ready');
  assert.equal(s.companion.resolve('bun:3351'),'bun:Mini'); assert.equal(s.companion.resolve('bun:3969'),'bun:Orange');
  for(const value of ['bun:9','bun:10','bun:999','bun:Mini','fox']) assert.equal(s.companion.resolve(value),null);
  s.wallet(B); assert.equal(s.companion.resolve('bun:3351'),null); assert.deepEqual(s.companion.state().pets,[]);
});
test('A to B to A aborts both previous reads and rejects their late responses', async () => {
  const s=setup(), a1=s.companion.refresh(); s.wallet(B); const b=s.companion.refresh(); s.wallet(A); const a2=s.companion.refresh();
  assert.equal(s.requests[0].options.signal.aborted,true); assert.equal(s.requests[1].options.signal.aborted,true);
  assert.equal(s.requests[0].options.isCurrent(),false); assert.equal(s.requests[1].options.isCurrent(),false);
  s.finish(2,{pets:[pets[1]]}); assert.equal(await a2,true);
  s.finish(0);s.finish(1); assert.equal(await a1,false);assert.equal(await b,false);
  assert.equal(s.companion.resolve('bun:3351'),null);assert.equal(s.companion.resolve('bun:3969'),'bun:Orange');
});
test('foreground clear and refresh revoke authority synchronously; outages never retain entitlement', async () => {
  const s=setup();let pending=s.companion.refresh();s.finish(0);await pending;
  s.companion.clear();assert.equal(s.companion.resolve('bun:3351'),null);
  pending=s.companion.refresh();s.finish(1);await pending;
  const count=s.changes.length;pending=s.companion.refresh();
  assert.equal(s.changes.length,count+1);assert.equal(s.companion.resolve('bun:3351'),null);
  s.requests[2].reject(Error('offline'));assert.equal(await pending,false);assert.equal(s.companion.state().status,'unavailable');assert.equal(s.companion.resolve('bun:3351'),null);
  pending=s.companion.refresh();s.wallet(null);s.companion.clear();s.finish(3);assert.equal(await pending,false);
  assert.equal(s.companion.state().status,'idle');assert.equal(s.companion.resolve('bun:3351'),null);
});
test('active Bun choices recheck at sixty seconds and revision changes are caught without a wallet event', async () => {
  const s=setup();let pending=s.companion.refresh();s.finish(0);await pending;
  s.tick(60000);s.companion.sync(false);assert.equal(s.requests.length,1);
  pending=s.companion.sync(true);assert.equal(s.requests.length,2);assert.equal(s.companion.resolve('bun:3351'),null);
  s.companion.sync(true);assert.equal(s.requests.length,2);s.finish(1);await pending;
  s.wallet(A);assert.equal(s.companion.resolve('bun:3351'),null);
  pending=s.companion.sync(true);assert.equal(s.requests.length,3);s.finish(2);await pending;
  assert.equal(s.companion.resolve('bun:3351'),'bun:Mini');
});
test('mismatched result identity/address and malformed ready results cannot grant a companion', async () => {
  for(const patch of [{address:B},{identity:0},{block:null},{status:'stale'},{pets:null}]) {
    const s=setup(), pending=s.companion.refresh();s.finish(0,patch);assert.equal(await pending,false);assert.equal(s.companion.resolve('bun:3351'),null);assert.equal(s.companion.state().status,'unavailable');
  }
});
