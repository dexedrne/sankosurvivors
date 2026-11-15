import test,{beforeEach,after} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {Readable} from 'node:stream';
import {mkdtempSync,mkdirSync,copyFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
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
