import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {Readable} from 'node:stream';
import {pathToFileURL} from 'node:url';

Object.assign(process.env,{SUPABASE_URL:'https://db.test',SUPABASE_KEY:'fixture-public',SQS_TICKET_SECRET:'fixture-ticket',SQS_SERVER_KEY:'fixture-server'});
const handler=createRequire(import.meta.url)('../tools/vercel-api/index.js');
let calls=[],pg=null,fail=false;
globalThis.fetch=async(url,opts)=>{
  assert.equal(String(url),'https://db.test/rest/v1/rpc/sqs_submit_report');
  const body=JSON.parse(opts.body);calls.push(body);
  if(fail)return new Response('{"message":"fixture database unavailable"}',{status:503});
  if(pg)await pg.query('select $1::jsonb',[opts.body]);
  return new Response('{"ok":true}');
};
function call(settings,raw) {
  calls=[];
  const req=Readable.from([raw??JSON.stringify({text:'Cannot move after a card 🧀',settings})]);
  Object.assign(req,{method:'POST',url:'/api/report',headers:{'content-type':'application/json','x-forwarded-for':'192.0.2.1'}});
  return new Promise((resolve,reject)=>handler(req,{statusCode:200,setHeader(){},end(text){resolve({status:this.statusCode,body:JSON.parse(text)});}}).catch(reject));
}
const invalid=[{debug:{label:'x\u0000y'}},{debug:{label:'x\ud800y'}},{debug:{label:'x\udfffy'}},{debug:{['x\u0000']:true}},{debug:{['x\ud800']:true}}];
const deep='{"text":"Cannot move after a card 🧀","settings":{"debug":'+'['.repeat(8000)+'0'+']'.repeat(8000)+'}}';
test('invalid nested settings drop only optional metadata and preserve the report text',async()=>{
  for(const settings of invalid){
    assert.equal((await call(settings)).status,200);
    assert.equal(calls.length,1);assert.equal(calls[0].p_report.settings,null);
    assert.equal(calls[0].p_report.text,'Cannot move after a card 🧀');
  }
});
test('deep metadata within the request limit cannot lose the report to a serialization exception',async()=>{
  assert.ok(deep.length<20000);
  assert.equal((await call(null,deep)).status,200);
  assert.equal(calls.length,1);assert.equal(calls[0].p_report.settings,null);
});
test('safe nested settings preserve Unicode, literal escapes and false/zero/null values',async()=>{
  const settings={fx:'reduced',shadows:false,fps:60,debug:{label:'🧀 Türkçe',nulLiteral:'\\u0000',surrogateLiteral:'\\ud800',zero:0,empty:'',nothing:null,list:[false,0,null,'🧀'],toString:1}};
  assert.equal((await call(settings)).status,200);assert.deepEqual(calls[0].p_report.settings,settings);
});
test('existing settings size and object-shape limits remain enforced',async()=>{
  for(const settings of [null,undefined,true,42,'text',[],{debug:{text:'x'.repeat(3001)}}]){
    assert.equal((await call(settings)).status,200);assert.equal(calls[0].p_report.settings,null);
  }
});
test('settings sanitation never acknowledges an actual upstream failure',async()=>{
  fail=true;
  try{assert.equal((await call({fx:'reduced'})).status,500);assert.equal(calls.length,1);}
  finally{fail=false;}
});
test('cleaned report RPC JSON is accepted by real PostgreSQL JSONB', {skip:!process.env.SQS_PGLITE},async()=>{
  const {PGlite}=await import(pathToFileURL(process.env.SQS_PGLITE));pg=new PGlite();
  try{
    for(const settings of [...invalid,{debug:{label:'🧀',literal:'\\ud800'}}])assert.equal((await call(settings)).status,200);
    assert.equal((await call(null,deep)).status,200);
  }finally{await pg.close();pg=null;}
});
