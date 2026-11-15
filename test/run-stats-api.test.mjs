import test,{beforeEach,after} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {Readable} from 'node:stream';
import {mkdtempSync,mkdirSync,copyFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHmac} from 'node:crypto';
import {createSim} from '../src/sim.js';
import {startRunStats,captureRunStats} from '../src/run-stats.js';
const dir=mkdtempSync(path.join(tmpdir(),'sqs-stats-api-')),id='abcdefabcdef';mkdirSync(path.join(dir,id));
execFileSync(fileURLToPath(new URL('../node_modules/esbuild/bin/esbuild',import.meta.url)),[fileURLToPath(new URL('../tools/vercel-api/ranked-entry.mjs',import.meta.url)),'--bundle','--platform=node','--format=cjs','--target=node22','--log-level=error','--outfile='+path.join(dir,id,'ranked-bundle.cjs')]);
copyFileSync(new URL('../tools/vercel-api/ground.bin',import.meta.url),path.join(dir,id,'ground.bin'));writeFileSync(path.join(dir,'current.txt'),id);
Object.assign(process.env,{SUPABASE_URL:'https://db.test',SUPABASE_KEY:'dummy',SQS_TICKET_SECRET:'ticket-secret',SQS_SERVER_KEY:'server-key',SQS_SIMS_DIR:dir});
const require=createRequire(import.meta.url),handler=require('../tools/vercel-api/index.js');
const originalNow=Date.now,originalFetch=globalThis.fetch;let now,calls,reply;
Date.now=()=>now;
globalThis.fetch=async(url,options)=>{calls.push({url:String(url),body:JSON.parse(options.body)});return new Response(JSON.stringify(reply),{status:200});};
beforeEach(()=>{now=Date.UTC(2026,10,14,12);calls=[];reply={ok:true};});
after(()=>{Date.now=originalNow;globalThis.fetch=originalFetch;rmSync(dir,{recursive:true,force:true});});
async function call(route,body){const req=Readable.from(body===undefined?[]:[JSON.stringify(body)]);Object.assign(req,{method:body===undefined?'GET':'POST',url:'/api/'+route,headers:{'content-type':'application/json','x-forwarded-for':'192.0.2.99'}});return new Promise((resolve,reject)=>handler(req,{statusCode:200,setHeader(){},end(text){resolve({code:this.statusCode,data:JSON.parse(text)});}}).catch(reject));}
const getTicket=async(kind='casual',adv='adventurer')=>{const out=await call('run?map=greentown&adv='+adv+'&hard=0&endless=0&stats=1&kind='+kind);assert.equal(out.code,200);assert(out.data.statsTicket,'Scoped analytics ticket returned');return out.data;};
function data(kind='casual',adv='adventurer'){const sim=createSim(),p=sim.players[0];startRunStats(p);return{kind,map:'greentown',adv,hard:false,endless:false,t:900,kills:100,level:7,won:kind==='casual',build:'test-stats',sim:id,week:null,stats:captureRunStats(sim,p)};}
test('nameless casual run statistics use a distinct keyed private RPC and keep score tickets separate',async()=>{
 const tickets=await getTicket();assert(tickets.ticket&&tickets.endlessTicket);now+=900000;
 const packet={ticket:tickets.statsTicket,data:data()},out=await call('run-stats',packet);assert.equal(out.code,200);assert.equal(out.data.ok,true);assert.equal(calls.length,1);assert(calls[0].url.endsWith('/sqs_record_run_stats'));assert.equal(calls[0].body.p_source,'client');assert.match(calls[0].body.p_run_key,/^c:[0-9a-f]{64}$/);assert.match(calls[0].body.p_ip,/^[0-9a-f]{64}$/);assert.deepEqual(calls[0].body.p_data,packet.data);assert(!JSON.stringify(calls[0].body.p_data).includes('192.0.2.99'));
 const key=calls[0].body.p_run_key;await call('run-stats',packet);assert.equal(calls[1].body.p_run_key,key);
 const score=await call('score',{...packet.data,name:'fixture',ticket:tickets.statsTicket});assert.equal(score.code,400,'analytics ticket cannot submit a leaderboard score');
});
test('co-op and fun use scoped analytics-only tickets and cannot impersonate ranked',async()=>{
 for(const [kind,adv]of[['coop','ranger'],['fun','adventurer'],['wizard','wise-old-man']]){const tickets=await getTicket(kind,adv);assert.equal(tickets.ticket,undefined);now+=900000;const packet={ticket:tickets.statsTicket,data:data(kind,adv)};assert.equal((await call('run-stats',packet)).code,200);assert.equal((await call('run-stats',{...packet,data:{...packet.data,kind:'ranked',week:1}})).code,400);}
});
test('statistics reject mismatched scope, identities, bad items, forged tokens and unreal elapsed time before SQL',async()=>{
 const tickets=await getTicket(),packet={ticket:tickets.statsTicket,data:data()};assert.equal((await call('run-stats',packet)).code,400);now+=900000;
 for(const change of [d=>d.wallet='0x123',d=>d.map='apache',d=>d.adv='ranger',d=>d.hard=true,d=>d.stats.weapons.unknown=1,d=>d.stats.gear.head='secret']){const d=structuredClone(packet.data);change(d);assert.equal((await call('run-stats',{ticket:packet.ticket,data:d})).code,400);}
 assert.equal((await call('run-stats',{...packet,ticket:packet.ticket+'x'})).code,400);now+=73*3600000;assert.equal((await call('run-stats',packet)).code,400);assert.equal(calls.length,0);
});
test('normal-to-endless uses the same run identity, while retryable storage failures are not acknowledged',async()=>{
 const tickets=await getTicket();now+=1200000;const first=data(),normal=await call('run-stats',{ticket:tickets.statsTicket,data:first});assert.equal(normal.code,200);const key=calls[0].body.p_run_key;
 const end={...first,endless:true,won:false,t:1200};assert.equal((await call('run-stats',{ticket:tickets.statsTicket,data:end})).code,200);assert.equal(calls[1].body.p_run_key,key);
 reply={error:'slow down'};assert.equal((await call('run-stats',{ticket:tickets.statsTicket,data:end})).code,429);reply={error:'database unavailable'};assert.equal((await call('run-stats',{ticket:tickets.statsTicket,data:end})).code,503);
});
test('statistics refuse other ticket purposes and invalid signed claims before database access',async()=>{
 const tickets=await getTicket(),nonce=await call('nonce');now+=900000;
 const signFixture=value=>{const body=Buffer.from(JSON.stringify(value)).toString('base64url');return body+'.'+createHmac('sha256','ticket-secret').update(body).digest('base64url');};
 const claims=JSON.parse(Buffer.from(tickets.statsTicket.split('.')[0],'base64url'));
 const tokens=[tickets.ticket,tickets.endlessTicket,nonce.data.nonce,
  ...[c=>c.k='dmt',c=>c.s=now+1,c=>c.s=now-73*3600000,c=>c.s='1',c=>c.s=null,c=>c.n='',c=>c.n='a'.repeat(13),c=>c.n='../bad-nonce',c=>c.j='ranked',c=>c.m='apache',c=>c.a='ranger',c=>c.h=true,c=>c.e=true].map(change=>{const c={...claims};change(c);return signFixture(c);}),
  tickets.statsTicket.slice(0,-1)+(tickets.statsTicket.endsWith('a')?'b':'a')];
 for(const ticket of tokens)assert.equal((await call('run-stats',{ticket,data:data()})).code,400);
 assert.equal(calls.length,0,'Rejected tickets cannot reach the keyed database RPC');
});
test('statistics reject malformed envelopes, identity fields and oversized input before database access',async()=>{
 const tickets=await getTicket();now+=900000;const packet={ticket:tickets.statsTicket,data:data()};
 const malformed=[null,[],true,'report',{},[packet],{...packet,name:'private'},
  {...packet,data:{...packet.data,name:'private'}},
  {...packet,data:JSON.parse(JSON.stringify(packet.data).slice(0,-1)+',"__proto__":{"polluted":true}}')},
  ...[d=>d.t=0,d=>d.t=14401,d=>d.t=900.5,d=>d.kills=-1,d=>d.kills=1000001,d=>d.level=0,d=>d.level=10001,d=>d.week=1,d=>d.endless=true,d=>d.sim='../bad',d=>d.build='x'.repeat(81),d=>d.stats.chosen.weapon.katana=20001,d=>d.stats.quality.weapons.unknown=1,d=>d.stats.gear.head='x'.repeat(21000)].map(change=>{const d=structuredClone(packet.data);change(d);return{ticket:packet.ticket,data:d};})];
 for(const value of malformed)assert.equal((await call('run-stats',value)).code,400);
 assert.equal(calls.length,0,'Malformed reports cannot consume database writes');
 assert.equal({}.polluted,undefined);
});
test('statistics never acknowledge incomplete database responses and rotate the daily network rate key',async()=>{
 const tickets=await getTicket();now+=900000;const packet={ticket:tickets.statsTicket,data:data()};
 for(const response of [null,[],false,{}, {ok:false},{ok:'true'},{ok:true,error:'not saved'}]){reply=response;const out=await call('run-stats',packet);assert.equal(out.code,503);assert.notEqual(out.data.ok,true);}
 reply={ok:true};assert.equal((await call('run-stats',packet)).code,200);const previous=calls.at(-1).body;
 now+=24*3600000;assert.equal((await call('run-stats',packet)).code,200);const current=calls.at(-1).body;
 assert.equal(previous.p_run_key,current.p_run_key,'A retry retains the run identity');
 assert.notEqual(previous.p_ip,current.p_ip,'The network rate key rotates each UTC day');
 assert.equal(current.p_data.wallet,undefined);assert.equal(current.p_data.name,undefined);
});
