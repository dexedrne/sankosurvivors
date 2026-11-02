import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../tools/payout/vercel.mjs';
import { loadVercelConfig } from '../tools/payout/config.mjs';
import { fixture, key } from './helpers/payout.mjs';
const env={SUPABASE_URL:'https://payout-db.test',SUPABASE_KEY:'fixture-public',SQS_PAYOUT_REPORTS_KEY:'reports-key',SQS_PAYOUT_KEY:'payout-key',TG_BOT_TOKEN:'fixture-bot',TG_CHAT_ID:'fixture-chat',CRON_SECRET:'fixture-cron-secret'};
const names=[...Object.keys(env),'PAYOUT_LIVE','PAYOUT_WALLET_PRIVATE_KEY','REPORTS_KEY','PAYOUT_KEY','WALLET_PRIVATE_KEY','KEYSTORE_PATH','KEYSTORE_PASSPHRASE_FILE','WEEK_DMT_CAP','TRANSFER_DMT_CAP','ETH_RUN_CAP','MAX_FEE_GWEI'];
const originalFetch=globalThis.fetch,originalNow=Date.now,originalLog=console.log,originalError=console.error;
let f,requests,logs;
beforeEach(()=>{
  for(const name of names)delete process.env[name];
  Object.assign(process.env,env);f=fixture(5);requests=[];logs=[];
  Date.now=()=>f.db.now;console.log=console.error=(...args)=>logs.push(args.join(' '));
  globalThis.fetch=async(url,opts)=>{
    requests.push(String(url));const body=JSON.parse(opts.body);
    if(String(url).startsWith(env.SUPABASE_URL+'/rest/v1/rpc/'))return {ok:true,json:async()=>f.db.rpc(String(url).split('/').at(-1),body)};
    if(String(url)==='https://api.telegram.org/botfixture-bot/sendMessage'){f.messages.push(body.text);return {ok:true,json:async()=>({ok:true})};}
    if(String(url)==='https://arb1.arbitrum.io/rpc'||String(url)==='https://arbitrum-one-rpc.publicnode.com')return f.chain.fetch(url,opts);
    throw Error('unexpected outbound request');
  };
});
afterEach(()=>{globalThis.fetch=originalFetch;Date.now=originalNow;console.log=originalLog;console.error=originalError;for(const name of names)delete process.env[name];});
function response(){return {statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},end(body){this.body=JSON.parse(body);}};}
function request(authorization='Bearer fixture-cron-secret',method='GET'){return {method,headers:{authorization},get body(){throw Error('must never inspect request body');}};}
for(const condition of ['missing secret','missing header','wrong header','different length','nonstring header'])test('cron returns 401 for '+condition,async()=>{
  if(condition==='missing secret')delete process.env.CRON_SECRET;
  const header=condition==='missing header'?undefined:condition==='wrong header'?'Bearer not-the-secret':condition==='different length'?'x':condition==='nonstring header'?['Bearer fixture-cron-secret']:'Bearer fixture-cron-secret';
  const res=response();await handler({method:'GET',headers:{authorization:header},get body(){throw Error('body accessed');}},res);
  assert.equal(res.statusCode,401);assert.equal(requests.length,0);assert.equal(logs.length,0);
});
test('cron default is dry: real planner runs, top five preview sent, zero signatures and broadcasts',async()=>{
  const res=response();await handler(request(),res);await handler(request(),response());
  assert.equal(res.statusCode,200);assert.equal(res.body.live,false);assert.equal(f.chain.broadcasts.length,0);
  assert.ok(f.db.rows.filter(r=>r.kind!=='rollover-note').every(r=>r.status==='planned'&&r.nonce===null));
  assert.ok(f.messages[0].includes('Player 5'));assert.ok(f.messages[0].includes('DRY RUN'));assert.equal(f.messages.length,1);
  assert.ok(logs.some(s=>s.includes('WOULD SEND')));assert.ok(logs.some(s=>s.includes('DRY RUN')));
  assert.ok(requests.filter(s=>s.includes('api.telegram.org')).every(s=>s.endsWith('/sendMessage')));
  assert.equal(res.headers['Cache-Control'],'no-store');
});
test('Vercel loader reads only the Vercel names from process.env and preserves caps',()=>{
  process.env.REPORTS_KEY='wrong legacy name';process.env.PAYOUT_KEY='wrong legacy name';process.env.WALLET_PRIVATE_KEY=key;process.env.KEYSTORE_PATH='/must/not/read';
  process.env.WEEK_DMT_CAP='12.5';process.env.TRANSFER_DMT_CAP='4';process.env.ETH_RUN_CAP='0.001';process.env.MAX_FEE_GWEI='1';
  const c=loadVercelConfig();assert.equal(c.reportsKey,'reports-key');assert.equal(c.payoutKey,'payout-key');assert.equal(c.privateKey,undefined);assert.equal(c.keystore,undefined);
  assert.equal(c.weekCap,12500000000000000000n);assert.equal(c.transferCap,4000000000000000000n);assert.equal(c.ethCap,1000000000000000n);assert.equal(c.maxFee,1000000000n);assert.equal(c.live,false);
  process.env.PAYOUT_LIVE='1';process.env.PAYOUT_WALLET_PRIVATE_KEY=key;assert.equal(loadVercelConfig().privateKey,key);
});
test('missing configuration refuses clearly and does not reveal values or body',async()=>{
  delete process.env.SQS_PAYOUT_REPORTS_KEY;process.env.REPORTS_KEY='must-not-fallback';
  const res=response();await handler(request(),res);
  assert.equal(res.statusCode,503);assert.equal(requests.length,0);assert.match(logs.join('\n'),/configuration/i);
  for(const value of ['fixture-cron-secret','fixture-bot','payout-key','must-not-fallback'])assert.ok(!logs.join('\n').includes(value));
});
test('live mode without a private key refuses rather than reading a local keystore',async()=>{
  process.env.PAYOUT_LIVE='1';process.env.KEYSTORE_PATH='/must/not/read';
  const res=response();await handler(request(),res);assert.equal(res.statusCode,503);assert.equal(requests.length,0);
});
test('live mode with a public fixture key for the wrong wallet never claims or broadcasts',async()=>{
  process.env.PAYOUT_LIVE='1';process.env.PAYOUT_WALLET_PRIVATE_KEY=key;
  const res=response();await handler(request(),res);
  assert.equal(res.statusCode,500);assert.equal(f.chain.broadcasts.length,0);assert.ok(f.db.rows.every(r=>r.nonce===null));assert.ok(!logs.join('\n').includes(key));
});
test('only GET is accepted after authentication',async()=>{
  const res=response();await handler(request('Bearer fixture-cron-secret','POST'),res);assert.equal(res.statusCode,405);assert.equal(requests.length,0);
});
test('the invocation budget aborts outbound work before the 300-second runtime limit',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  let started,startedRequest=new Promise(resolve=>{started=resolve;});
  globalThis.fetch=(_url,opts)=>new Promise((_resolve,reject)=>{opts.signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true});started();});
  const res=response(),pending=handler(request(),res);await startedRequest;t.mock.timers.tick(240000);await pending;
  assert.equal(res.statusCode,503);assert.ok(logs.some(s=>s.includes('budget')));assert.equal(f.chain.broadcasts.length,0);
});
