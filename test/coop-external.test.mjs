import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn,spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {once} from 'node:events';
import {createCoopRelay} from '../tools/coop-relay.mjs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

test('external verifier requires trusted WSS for the current owned relay hostname',()=>{
 const source=readFileSync(new URL('../qa-kit/coop-external.mjs',import.meta.url),'utf8');
 const start=source.indexOf('const endpoint=new URL(url)'),end=source.indexOf('const ground=',start);
 assert(start>=0&&end>start);
 const validate=Function('url','role','invite','assert',source.slice(start,end)+';return publicEndpoint;');
 assert.equal(validate('wss://sankosurvivors-coop.spidertag.app/coop','host',null,assert),true);
 assert.throws(()=>validate('ws://sankosurvivors-coop.spidertag.app/coop','host',null,assert));
 assert.throws(()=>validate('wss://unowned.example/coop','host',null,assert));
 assert.equal(validate('ws://127.0.0.1:8787/coop','host',null,assert),false);
});

test('two standalone probes earn individual choices on real ground, reconnect and verify restart',{timeout:100000},async t=>{
 const out=mkdtempSync(join(tmpdir(),'sqs-external-probe-')),children=[];
 const server=createServer((_,res)=>{res.writeHead(404);res.end();});let relay=createCoopRelay({server,origins:['https://sankosurvivors.quest']});server.listen(0,'127.0.0.1');await once(server,'listening');
 t.after(async()=>{
  for(const p of children)if(p.child.exitCode===null)p.child.kill('SIGTERM');
  await Promise.race([Promise.all(children.map(p=>p.done)),new Promise(r=>setTimeout(r,2000).unref())]);
  for(const p of children)if(p.child.exitCode===null)p.child.kill('SIGKILL');
  await Promise.all(children.map(p=>p.done));await relay.close();await new Promise(r=>server.close(r));rmSync(out,{recursive:true,force:true});
 });
 const artifact=join(out,'probe.mjs'),built=spawnSync('node_modules/.bin/esbuild',['qa-kit/coop-external.mjs','--bundle','--platform=node','--target=node22','--format=esm','--banner:js=import {createRequire} from "node:module";const require=createRequire(import.meta.url);','--outfile='+artifact],{encoding:'utf8',timeout:15000});assert.equal(built.status,0,built.stderr);
 const endpoint=`ws://127.0.0.1:${server.address().port}/coop`,ground=resolve('tools/vercel-api/sims/e2c1419b0907/ground.bin');
 function launch(role,invite=''){
  const child=spawn(process.execPath,[artifact,role,endpoint,ground,'external-fixture','71740c2711a0',join(out,role),invite],{stdio:['ignore','pipe','pipe']});let log='';child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);const p={child,done:once(child,'exit'),log:()=>log};children.push(p);return p;
 }
 async function until(fn,ms=65000){const end=Date.now()+ms;while(!fn()){for(const p of children)assert.equal(p.child.exitCode,null,p.log());assert(Date.now()<end,children.map(p=>p.log()).join('\n'));await sleep(25);}}
 const host=launch('host');await until(()=>/INVITE [A-HJ-NP-Z2-9]{6}/.test(host.log()));const invite=host.log().match(/INVITE ([A-HJ-NP-Z2-9]{6})/)[1],guest=launch('guest',invite);
 await until(()=>host.log().includes('READY host')&&guest.log().includes('READY guest'));
 await relay.close();relay=createCoopRelay({server,origins:['https://sankosurvivors.quest']});
 const exits=await Promise.all(children.map(p=>p.done));for(let i=0;i<exits.length;i++)assert.equal(exits[i][0],0,children[i].log());
 const a=JSON.parse(readFileSync(join(out,'host','RESULT.json'))),b=JSON.parse(readFileSync(join(out,'guest','RESULT.json')));
 assert.equal(a.role,'host');assert.equal(b.role,'guest');assert.equal(a.localId,'p1');assert.equal(b.localId,'p2');
 for(const result of [a,b]){assert.equal(result.public,false);assert.equal(result.ground,'165cf2df');assert(result.readyFrame>=960);assert.equal(result.loads,1);assert.equal(result.runCallbacks,1);assert(result.upgrades.length>=1);assert.notEqual(result.end,'complete');assert.equal(result.issues.length,0);assert(!/"(?:token|session|credentials)"/.test(JSON.stringify(result)));}
 assert.equal(a.versionMismatch,true);assert.equal(a.oldInviteMissing,true);assert.equal(b.reconnected,true);
 const common=Object.keys(a.hashes).filter(f=>Object.hasOwn(b.hashes,f));t.diagnostic(JSON.stringify({hostHashes:Object.keys(a.hashes).length,guestHashes:Object.keys(b.hashes).length,matchingFrames:common.length}));assert(common.length>=30,'meaningful matching-frame comparison');for(const f of common)assert.equal(a.hashes[f],b.hashes[f],`shared frame ${f}`);
 const selections=result=>result.upgrades.map(({kind,id,level})=>({kind,id,level}));assert.notDeepEqual(selections(a),selections(b),'different individually acknowledged upgrades');
 t.diagnostic(JSON.stringify({matchingFrames:common.length,host:selections(a),guest:selections(b),reconnected:b.reconnected,ends:[a.end,b.end],oldInviteMissing:a.oldInviteMissing,public:false}));
});
