import test from'node:test';import assert from'node:assert/strict';
import{spawn,spawnSync}from'node:child_process';import{mkdtempSync,rmSync,readFileSync,symlinkSync}from'node:fs';import{tmpdir}from'node:os';import{join}from'node:path';import{createServer,request}from'node:http';import{once}from'node:events';import WebSocket from'ws';import{pathToFileURL}from'node:url';
const origin='https://sankosurvivors.quest',sleep=ms=>new Promise(r=>setTimeout(r,ms));
function build(t){
 const dir=mkdtempSync(join(tmpdir(),'sqs-coop-artifact-')),release=join(dir,'release'),bundle={dir,file:join(release,'relay.mjs'),children:[]};
 t.after(async()=>{
  for(const p of bundle.children)if(p.child.exitCode===null&&p.child.signalCode===null)p.child.kill('SIGTERM');
  await Promise.race([Promise.all(bundle.children.map(p=>p.exit)),sleep(2000)]);
  for(const p of bundle.children)if(p.child.exitCode===null&&p.child.signalCode===null)p.child.kill('SIGKILL');
  await Promise.all(bundle.children.map(p=>p.exit));rmSync(dir,{recursive:true,force:true});
 });
 const result=spawnSync('bash',['tools/build-coop.sh',release],{encoding:'utf8',timeout:15000});assert.equal(result.status,0,result.stderr);for(const file of ['ws-LICENSE.txt','run-escape-LICENSE.txt'])assert(readFileSync(join(release,file),'utf8').length>500);return bundle;
}
async function port(){const s=createServer();s.listen(0,'127.0.0.1');await once(s,'listening');const n=s.address().port;await new Promise(r=>s.close(r));return n;}
function get(n,path='/health',options={}){return new Promise((resolve,reject)=>{const q=request({host:'127.0.0.1',port:n,path,agent:false,...options},res=>{let body='';res.setEncoding('utf8');res.on('data',x=>body+=x);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body}));});q.on('error',reject);q.end();});}
async function launch(t,bundle,n){const child=spawn(process.execPath,[bundle.file,'--port='+n,'--origin='+origin,'--loopback-proxy'],{stdio:['ignore','pipe','pipe']});let logs='';child.stdout.on('data',s=>logs+=s);child.stderr.on('data',s=>logs+=s);const exit=once(child,'exit');bundle.children.push({child,exit});const end=Date.now()+5000;while(!logs.includes('listening on loopback')){assert.equal(child.exitCode,null,logs);assert(Date.now()<end,logs||'artifact did not listen');await sleep(20);}return{child,exit};}
async function client(t,n,headers={'X-Real-IP':'192.0.2.1'}){const ws=new WebSocket(`ws://127.0.0.1:${n}/coop`,{origin,headers}),queue=[],waiters=[];ws.on('error',()=>{});ws.on('message',raw=>{const value=JSON.parse(String(raw)),i=waiters.findIndex(w=>w.type===value.t);if(i<0)queue.push(value);else{const w=waiters.splice(i,1)[0];clearTimeout(w.timer);w.resolve(value);}});const closed=once(ws,'close');t.after(()=>ws.terminate());await once(ws,'open');const next=type=>{const i=queue.findIndex(m=>m.t===type);if(i>=0)return Promise.resolve(queue.splice(i,1)[0]);return new Promise((resolve,reject)=>{const w={type,resolve,timer:setTimeout(()=>reject(Error('missing '+type)),2000)};waiters.push(w);});};assert.equal((await next('hello')).protocol,1);return{ws,next,closed,send:m=>ws.send(JSON.stringify(m))};}
function refuse(n,options){return new Promise((resolve,reject)=>{const ws=new WebSocket(`ws://127.0.0.1:${n}/coop`,{origin,...options});ws.on('error',()=>{});ws.on('unexpected-response',(_,res)=>{res.resume();resolve(res.statusCode);ws.terminate();});ws.on('open',()=>{ws.terminate();reject(Error('invalid handshake accepted'));});});}

test('built relay runs independently, binds loopback and enforces configured proxy/origin boundaries',async t=>{
 const bundle=build(t),n=await port();await launch(t,bundle,n);const health=await get(n);assert.equal(health.status,200);assert.deepEqual(JSON.parse(health.body),{ok:true,protocol:1});assert.equal(health.headers['cache-control'],'no-store');assert.equal((await get(n,'/api/run')).status,404);assert.equal((await get(n,'/health?extra=1')).status,404);assert.equal(await refuse(n,{}),400);assert.equal(await refuse(n,{origin:'https://untrusted.invalid',headers:{'X-Real-IP':'192.0.2.1'}}),403);await client(t,n);
});
test('built HTTP front door refuses large headers and non-read health methods',async t=>{
 const bundle=build(t),n=await port();await launch(t,bundle,n);assert.equal((await get(n,'/health',{headers:{'X-Pad':'x'.repeat(9000)}})).status,431);const post=await get(n,'/health',{method:'POST'});assert.equal(post.status,405);assert.equal(post.headers.allow,'GET, HEAD');
});
test('actual artifact shutdown tells rooms and restart loses old invite authority',async t=>{
 const bundle=build(t),n=await port(),first=await launch(t,bundle,n),host=await client(t,n);const settings={protocol:1,build:'test-local',sim:'71740c2711a0',map:'greentown',hard:false,endless:false},me={name:'fixture',adv:'adventurer',meta:{},gear:{},gearLv:{},cleared:[]};host.send({t:'create',settings,me});const room=await host.next('room');first.child.kill('SIGTERM');assert.equal((await host.next('gone')).reason,'serverClosed');await host.closed;assert.equal((await first.exit)[0],0);await launch(t,bundle,n);const guest=await client(t,n);guest.send({t:'join',code:room.code,identity:{protocol:1,build:settings.build,sim:settings.sim},me});assert.equal((await guest.next('error')).code,'roomMissing');
});
test('artifact configuration errors exit without opening a listener',t=>{
 const bundle=build(t);for(const arg of ['--port=not-a-port','--port=65536','--origin=not-an-origin']){const r=spawnSync(process.execPath,[bundle.file,arg],{encoding:'utf8',timeout:3000});assert.notEqual(r.status,0);assert(!r.stdout.includes('listening'));}
});


test('the packaged entry listens through the deployment current-directory symlink',async t=>{
 const bundle=build(t),n=await port();symlinkSync('release',join(bundle.dir,'current'),'dir');bundle.file=join(bundle.dir,'current','relay.mjs');await launch(t,bundle,n);assert.equal((await get(n)).status,200);await client(t,n);
});


test('importing the relay with a non-file eval argument does not run or reject the library',t=>{
 const bundle=build(t),code=`await import(${JSON.stringify(pathToFileURL(bundle.file).href)});console.log('imported');`,r=spawnSync(process.execPath,['--input-type=module','-e',code,'not-an-entry-file'],{encoding:'utf8',timeout:3000});assert.equal(r.status,0,r.stderr);assert.equal(r.stdout.trim(),'imported');
});
