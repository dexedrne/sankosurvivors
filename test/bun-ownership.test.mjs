import test from 'node:test';
import assert from 'node:assert/strict';

const module = await import('../src/bun-ownership.js').catch(() => ({}));
const load = (...args) => { assert.equal(typeof module.loadBunOwnership, 'function', 'read-only BUN loader exists'); return module.loadBunOwnership(...args); };
const ADDRESS = '0x1111111111111111111111111111111111111111';
const OTHER = '0x2222222222222222222222222222222222222222';
const COLLECTION = '0xb85ff44289b768ecff58fead92f815b642e3cbb2';
const HASH = '0x' + 'ab'.repeat(32);
const word = (n) => BigInt(n).toString(16).padStart(64, '0');
const tokens = (ids) => '0x' + word(32) + word(ids.length) + ids.map(word).join('');
const metadata = (variety, type = 'Bun') => ({ name: 'Bun', image: 'https://evil.invalid/a.glb', attributes: [{trait_type:'Type',value:type},{trait_type:'Variety',value:variety},{trait_type:'Rarity',value:'Rare'}] });
function fixture({ids = [], chain = '0xa4b1', owner = ADDRESS, info = {}, enumeration, changedBlock = false, fetchHook} = {}) {
  const calls = []; let blockReads = 0;
  const fetchImpl = async (url, options = {}) => {
    calls.push([url,options]);
    if (fetchHook) await fetchHook(url, options);
    if (options.method === 'POST') {
      const req = JSON.parse(options.body); let result;
      if (req.method === 'eth_chainId') result = chain;
      else if (req.method === 'eth_getBlockByNumber') result = { number:'0x123', hash: changedBlock && blockReads++ ? '0x'+'cd'.repeat(32) : HASH };
      else if (req.method === 'eth_call') {
        assert.equal(req.params[0].to,COLLECTION);
        assert.equal(req.params[1],'0x123');
        const data = req.params[0].data;
        if (data.startsWith('0x8462151c')) { assert.equal(data,'0x8462151c'+ADDRESS.slice(2).padStart(64,'0')); result = enumeration ?? tokens(ids); }
        else { assert.match(data,/^0x6352211e[0-9a-f]{64}$/); assert.ok(ids.map(word).includes(data.slice(10))); result = '0x'+owner.slice(2).padStart(64,'0'); }
      } else assert.fail('Unexpected RPC method: '+req.method);
      assert.equal(url,'https://arb1.arbitrum.io/rpc');
      return Response.json({ jsonrpc:'2.0', id:req.id, result });
    }
    assert.equal(options.redirect,'error');
    assert.match(url,/^https:\/\/pet-metadata\.sanko\.xyz\/buns\/\d+$/);
    const id = url.split('/').at(-1);
    return info[id] instanceof Response ? info[id] : Response.json(info[id] ?? metadata('Orange'));
  };
  return {fetchImpl,calls};
}

test('confirmed empty is ready and makes no metadata requests', async () => {
  const f=fixture(); const r=await load(ADDRESS,{...f,identity:7});
  assert.equal(r.status,'ready'); assert.deepEqual(r.pets,[]); assert.equal(r.identity,7); assert.equal(r.address,ADDRESS);
  assert.deepEqual(r.block,{number:'0x123',hash:HASH}); assert.equal(f.calls.length,4);
});
test('verifies both captured owner tokens and maps real Mini/Orange metadata',async()=>{
  const f=fixture({ids:[3351,3969],info:{3351:metadata('Mini'),3969:metadata('Orange')}});
  const r=await load(ADDRESS,{...f}); assert.equal(r.status,'ready');
  assert.deepEqual(r.pets.map(p=>[p.tokenId,p.variety,p.eligible,p.appearance.model.path]),[['3351','Mini',true,'sanko/buns/Mini.glb'],['3969','Orange',true,'sanko/buns/Orange.glb']]);
  assert.equal(r.pets[0].rarity,'Rare'); assert.equal(r.pets[0].type,'Bun');
});
test('accepts other token IDs and native variants but refuses eggs and unknown appearance',async()=>{
  const f=fixture({ids:[0,17,99,100],info:{0:metadata('Angel'),17:metadata('Yeti'),99:metadata('Green','Egg'),100:metadata('milady')}});
  const r=await load(ADDRESS,{...f}); assert.equal(r.status,'ready');
  assert.deepEqual(r.pets.map(p=>[p.tokenId,p.eligible,p.reason]),[['0',true,null],['17',true,null],['99',false,'unhatched'],['100',false,'unsupported-appearance']]);
  assert.equal(r.pets[2].appearance,null); assert.equal(r.pets[3].appearance,null);
});
for (const [name,config,code] of [
  ['wrong RPC chain',{chain:'0x1'},'wrong-chain'],
  ['owner mismatch',{ids:[1],owner:OTHER},'owner-changed'],
  ['reorganized pinned block',{changedBlock:true},'block-changed'],
  ['duplicate token IDs',{enumeration:tokens([1,1])},'invalid-tokens'],
  ['oversized token count',{enumeration:tokens(Array.from({length:33},(_,i)=>i))},'invalid-tokens'],
  ['truncated token array',{enumeration:'0x'+word(32)+word(2)+word(1)},'invalid-tokens'],
  ['malformed ABI offset',{enumeration:'0x'+word(64)+word(0)},'invalid-tokens'],
  ['malformed metadata',{ids:[1],info:{1:{attributes:[]}}},'invalid-metadata'],
  ['duplicated traits',{ids:[1],info:{1:{attributes:[...metadata('Mini').attributes,{trait_type:'Type',value:'Bun'}]}}},'invalid-metadata'],
  ['oversized metadata',{ids:[1],info:{1:{...metadata('Mini'),description:'a'.repeat(16384)}}},'response-too-large'],
  ['non-JSON metadata',{ids:[1],info:{1:new Response('not json')}},'invalid-response']
]) test(name+' fails closed with explicit unavailable',async()=>{const r=await load(ADDRESS,{...fixture(config)});assert.equal(r.status,'unavailable');assert.equal(r.error,code);assert.deepEqual(r.pets,[]);});
test('RPC outage is unavailable rather than confirmed empty',async()=>{
  const r=await load(ADDRESS,{fetchImpl:async()=>{throw Error('private upstream message');}}); assert.equal(r.status,'unavailable'); assert.deepEqual(r.pets,[]); assert.equal(r.error,'unavailable');
});
test('HTTP failures and RPC errors never grant pets',async()=>{
  for(const response of [new Response('down',{status:503}),Response.json({jsonrpc:'2.0',id:1,error:{message:'down'}})]) {
    const r=await load(ADDRESS,{fetchImpl:async()=>response.clone()});assert.equal(r.status,'unavailable'); assert.deepEqual(r.pets,[]);
  }
});
test('invalid and zero addresses make no network requests',async()=>{
  for(const address of ['no','0x'+'0'.repeat(40),'0x'+ '1'.repeat(40)+'?to=evil']) {
    const r=await load(address,{fetchImpl:()=>assert.fail('network for invalid address')});assert.equal(r.status,'unavailable');assert.equal(r.error,'invalid-address');
  }
});
test('already aborted and stale wallet identity make no network requests',async()=>{
  const controller=new AbortController();controller.abort();
  assert.equal((await load(ADDRESS,{signal:controller.signal,fetchImpl:()=>assert.fail('request after abort')})).status,'aborted');
  assert.equal((await load(ADDRESS,{isCurrent:()=>false,fetchImpl:()=>assert.fail('request for stale wallet')})).status,'stale');
});
test('abort settles even if an injected transport ignores AbortSignal',async()=>{
  const controller=new AbortController(); const pending=load(ADDRESS,{signal:controller.signal,fetchImpl:()=>new Promise(()=>{})});controller.abort();
  const r=await pending;assert.equal(r.status,'aborted');assert.deepEqual(r.pets,[]);
});
test('account A to B to A revision change rejects late metadata',async()=>{
  let revision=3;const f=fixture({ids:[1],fetchHook:async(url)=>{if(url.includes('pet-metadata'))revision=5;}});
  const r=await load(ADDRESS,{...f,identity:3,isCurrent:()=>revision===3});assert.equal(r.status,'stale');assert.equal(r.identity,3);assert.deepEqual(r.pets,[]);
});
test('RPC and metadata request boundary permits only public read operations',async()=>{
  const f=fixture({ids:[7]});assert.equal((await load(ADDRESS,{...f})).status,'ready');
  for(const [url,options] of f.calls){assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');if(options.method==='POST') assert.ok(['eth_chainId','eth_getBlockByNumber','eth_call'].includes(JSON.parse(options.body).method));else assert.equal(options.method,'GET');}
});
test('streamed response limit cancels metadata without trusting Content-Length',async()=>{
  let cancelled=false;
  const stream=new ReadableStream({pull(controller){controller.enqueue(new Uint8Array(9000));},cancel(){cancelled=true;}});
  const r=await load(ADDRESS,{...fixture({ids:[1],info:{1:new Response(stream)}})});
  assert.equal(r.status,'unavailable');assert.equal(r.error,'response-too-large');assert.equal(cancelled,true);assert.deepEqual(r.pets,[]);
});
test('wrong response identity and malformed owner words fail closed',async()=>{
  const r=await load(ADDRESS,{fetchImpl:async()=>Response.json({jsonrpc:'2.0',id:999,result:'0xa4b1'})});
  assert.equal(r.status,'unavailable');assert.equal(r.error,'invalid-response');
  const f=fixture({ids:[1]}); const fetchImpl=async(url,options)=>{
    const response=await f.fetchImpl(url,options);
    if(options.method==='POST' && JSON.parse(options.body).params?.[0]?.data?.startsWith('0x6352211e')) {const data=await response.json();data.result='0x'+ADDRESS.slice(2);return Response.json(data);}return response;
  };
  const malformed=await load(ADDRESS,{fetchImpl});assert.equal(malformed.status,'unavailable');assert.equal(malformed.error,'owner-changed');
});
test('metadata cannot select prototype keys or smuggle asset URLs',async()=>{
  for(const variety of ['constructor','__proto__','https://evil.invalid/Orange.glb','orange']) {
    const r=await load(ADDRESS,{...fixture({ids:[1],info:{1:metadata(variety)}})});
    assert.equal(r.status,'ready');assert.equal(r.pets[0].eligible,false);assert.equal(r.pets[0].appearance,null);
  }
});
test('slow transport times out without granting ownership',async(t)=>{
  t.mock.timers.enable({apis:['setTimeout']});
  const pending=load(ADDRESS,{fetchImpl:()=>new Promise(()=>{})}); t.mock.timers.tick(20000);
  const r=await pending;assert.equal(r.status,'unavailable');assert.equal(r.error,'timeout');assert.deepEqual(r.pets,[]);
});
