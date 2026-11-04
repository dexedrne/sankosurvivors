import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { fixture, wallet } from './helpers/payout.mjs';
import { sqlDB } from './helpers/payout-sql-db.mjs';
import { database, Arbitrum, telegram } from '../tools/payout/ports.mjs';
import { run } from '../tools/payout/runner.mjs';

async function server(f,rpc=f.ports.rpc) {
  const http=createServer(async(req,res)=>{
    const chunks=[];for await(const chunk of req)chunks.push(chunk);
    try{
      const body=JSON.parse(Buffer.concat(chunks));let result;
      if(req.url.startsWith('/rest/v1/rpc/')){
        assert.equal(req.headers.apikey,'fixture-public');assert.equal(req.headers.authorization,'Bearer fixture-public');
        result=await rpc(req.url.split('/').at(-1),body);
      }else if(req.url==='/arb'){
        assert.equal(req.headers['user-agent'],'sankosurvivors-payout/1.0');
        result={jsonrpc:'2.0',id:body.id,result:await f.chain.request(body.method,body.params)};
      }else if(req.url==='/telegram'){f.messages.push(body.text);result={ok:true};}
      else throw Error('unexpected route');
      res.setHeader('Content-Type','application/json');res.end(JSON.stringify(result,(_,v)=>typeof v==='bigint'?'0x'+v.toString(16):v));
    }catch{res.statusCode=500;res.end('{}');}
  });
  http.listen(0,'127.0.0.1');await once(http,'listening');
  const url='http://127.0.0.1:'+http.address().port;
  return {url,close:()=>new Promise(resolve=>http.close(resolve))};
}
function worker(url,{onSpawn=()=>{},killed=false}={}) {
  const child=spawn(process.execPath,[fileURLToPath(new URL('./helpers/payout-worker.mjs',import.meta.url)),url],{env:{PATH:process.env.PATH},stdio:['ignore','pipe','pipe']});
  onSpawn(child);let output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
  return once(child,'exit').then(([code,signal])=>{if(killed)assert.equal(signal,'SIGKILL');else assert.equal(code,0,output);return output;});
}
test('two actual Node processes through HTTP cannot pay the same row twice',async()=>{
  const f=fixture(3),s=await server(f);
  try{
    await Promise.all([worker(s.url),worker(s.url)]);await worker(s.url);
    assert.equal(f.chain.broadcasts.length,5);assert.equal(f.db.rows.filter(r=>r.status==='confirmed'&&r.kind!=='rollover-note').length,5);
    assert.equal(f.messages.filter(m=>m.includes('Winners')).length,1);
  }finally{await s.close();}
});
test('the full runner uses real SQL over fake Supabase and fake Arbitrum HTTP', {skip:!process.env.SQS_PGLITE},async()=>{
  const f=fixture(3),pg=await sqlDB();f.db.now=Date.UTC(2026,10,17,1);
  for(const n of [1,2,3,4]) await pg.db.exec(`insert into sqs_ranked_entries(week,wallet,tx,paid,ip_hash,seed,verdict,t,kills,won,finished_at,refund_reason,name) values (0,'${wallet(n)}','0x${String(n).repeat(64)}',1000000000000000000,'${n}',1,${n===4?'null':"'ok'"},${900-n},1,false,now(),${n===4?"'reset'":'null'},'Player');`);
  f.db.onRefund({source_tx:'0x'+'4'.repeat(64),wallet:wallet(4),amount:'1000000000000000000'}); // entry 4's payment, which its refund repays
  const s=await server(f,pg.rpc);
  try{
    const config={...f.config,url:s.url,supabaseKey:'fixture-public',telegramToken:'fixture-bot',telegramChat:'fixture-chat'};
    const ports={...f.ports,rpc:database(config),chain:new Arbitrum(fetch,[s.url+'/arb']),notify:telegram(config,(_,opts)=>fetch(s.url+'/telegram',opts))};
    await run(config,ports);assert.equal(f.chain.broadcasts.length,5,'the first invocation must complete refunds too');await run(config,ports);
    assert.equal(f.chain.broadcasts.length,5);
    const state=await pg.rpc('sqs_payout_read',{p_key:'payout-key'});
    assert.equal(state.rows.filter(r=>r.kind!=='rollover-note'&&r.status==='confirmed').length,5);
  }finally{await s.close();await pg.db.close();}
});
test('RPC fallback rejects wrong-chain endpoints and uses a User-Agent',async()=>{
  const calls=[];const fetcher=async(url,opts)=>{
    const body=JSON.parse(opts.body);calls.push([url,body.method]);assert.equal(opts.headers['User-Agent'],'sankosurvivors-payout/1.0');
    return {ok:true,json:async()=>({result:body.method==='eth_chainId'?(url==='first'?'0x1':'0xa4b1'):'0x10'})};
  };
  assert.equal(await new Arbitrum(fetcher,['first','second']).rpc('eth_getBalance',[wallet(1),'pending']),'0x10');
  assert.deepEqual(calls,[['first','eth_chainId'],['second','eth_chainId'],['second','eth_getBalance']]);
});
test('feeHistory failure falls back to gasPrice; fee cap still applies',async()=>{
  const f=fixture(3),original=f.chain.request.bind(f.chain);
  f.chain.request=async(method,args)=>{if(method==='eth_feeHistory')throw Error('unsupported');return original(method,args);};
  assert.deepEqual(await f.ports.chain.fees(100000000n),{maxFee:10000000n,priority:0n});
  await assert.rejects(f.ports.chain.fees(1n),/cap/);
});
test('SQL and the fake agree on the full RPC lifecycle', {skip:!process.env.SQS_PGLITE},async()=>{
  const {FakePayoutDB}=await import('./helpers/payout.mjs');const pg=await sqlDB(),fake=new FakePayoutDB();fake.now=Date.UTC(2026,10,17,1);
  try {
    await pg.db.exec(`insert into sqs_ranked_entries(week,wallet,tx,paid,ip_hash,seed,verdict,t,kills,won,finished_at,name) values (0,'${wallet(1)}','0x${'1'.repeat(64)}',1001,'a',1,'ok',100,1,false,now(),'One');`);
    fake.reports.set(0,await pg.rpc('sqs_ranked_settle',{p_key:'reports-key',p_week:0}));
    const both=async(name,p={})=>{
      const args={p_key:'payout-key',...p};const actual=await pg.rpc('sqs_payout_'+name,args),expected=await fake.rpc('sqs_payout_'+name,args);
      if(name!=='read'&&name!=='claim')assert.deepEqual(actual,expected,name);
      if(name==='claim'&&actual.row){
        for(const key of ['id','week','mode','kind','wallet','amount','status','nonce','scan_block','source_entry_id','raw_tx','tx_hash'])assert.deepEqual(actual.row[key],expected.row[key],key);
        assert.equal(Object.hasOwn(actual.row,'source_tx'),false);assert.equal(Object.hasOwn(expected.row,'source_tx'),false);
      }
      const real=await pg.rpc('sqs_payout_read',{p_key:'payout-key'});
      const cols=['id','week','kind','wallet','amount','status','nonce','tx_hash','raw_tx','source_entry_id'];
      const project=rows=>rows.map(r=>Object.fromEntries(cols.map(k=>[k,r[k]??null])));
      assert.deepEqual(project(real.rows),project(fake.rows),name+' ledger');return actual;
    };
    const {makePlan}=await import('../tools/payout/core.mjs');
    await both('plan',{p_week:0,p_plan:makePlan(fake.reports.get(0))});await both('plan',{p_week:0,p_plan:{}});
    await both('hold',{p_week:0,p_wallet:wallet(1),p_reason:'review'});
    await both('claim',{p_id:'1',p_pending:'0',p_block:'100'});
    await both('hold',{p_week:0,p_wallet:wallet(1),p_reason:null});
    await both('claim',{p_id:'1',p_pending:'0',p_block:'100'});
    await both('claim',{p_id:'1',p_pending:'0',p_block:'100'});
    await both('mark',{p_id:'1',p_status:'sending',p_hash:'0x'+'a'.repeat(64),p_raw:'0x02aa'});
    await both('mark',{p_id:'1',p_status:'sent',p_hash:'0x'+'a'.repeat(64)});
    await both('hold',{p_week:0,p_wallet:wallet(1),p_reason:'late'});
    await both('mark',{p_id:'1',p_status:'confirmed',p_hash:'0x'+'a'.repeat(64)});
    await both('mark',{p_id:'1',p_status:'failed',p_hash:'0x'+'a'.repeat(64),p_error:'wrong'});
    await both('notice',{p_name:'announce'});await both('notice',{p_name:'announce'});
    await both('lease',{p_owner:'one'});await both('lease',{p_owner:'two'});await both('lease',{p_owner:'one',p_release:true});
  }finally{await pg.db.close();}
});
test('an actual killed process leaves a nonce claim; the next process resumes after lease expiry',async()=>{
  const f=fixture(3);let crashed,killOnce=true;
  const rpc=async(fn,args)=>{
    const result=await f.ports.rpc(fn,args);
    if(fn==='sqs_payout_claim'&&result.ok&&killOnce){killOnce=false;crashed.kill('SIGKILL');}
    return result;
  };
  const s=await server(f,rpc);
  try{
    await worker(s.url,{killed:true,onSpawn:child=>{crashed=child;}});
    assert.equal(f.db.rows.filter(r=>r.status==='sending'&&!r.tx_hash).length,1);
    assert.equal(f.chain.broadcasts.length,0);
    await worker(s.url);assert.equal(f.chain.broadcasts.length,0); // lease still owned by the dead process
    f.db.until=0;await worker(s.url);await worker(s.url);
    assert.equal(f.chain.broadcasts.length,5);
  }finally{await s.close();}
});
test('historical nonce recovery binary-searches the consuming block',async()=>{
  const f=fixture(3),tx={from:f.config.wallet,nonce:'0x7',hash:'0x'+'a'.repeat(64)},asked=[];
  f.chain.request=async(method,p=[])=>{
    if(method==='eth_chainId')return '0xa4b1';
    if(method==='eth_blockNumber')return '0x44c'; // 1100
    if(method==='eth_getTransactionCount')return p[1]==='pending'||p[1]==='latest'||BigInt(p[1])>=1050n?'0x8':'0x7';
    if(method==='eth_getBlockByNumber'){asked.push(p[0]);return {transactions:p[0]==='0x41a'?[tx]:[]};}
    throw Error('unexpected');
  };
  assert.equal((await f.ports.chain.findNonce(f.config.wallet,'7','1000')).hash,tx.hash);
  assert.deepEqual(asked,['pending','0x41a']);
});
