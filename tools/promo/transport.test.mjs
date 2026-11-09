import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {EventEmitter} from 'node:events';
import {encoderPipe,cdpRequests} from './transport.mjs';
const bounded=p=>Promise.race([p,new Promise((_,reject)=>setTimeout(()=>reject(Error('failure did not unwind')),200))]);
class Socket extends EventTarget{readyState=1;send(data){this.last=JSON.parse(data);}}
test('encoder close releases a backpressured write',async()=>{
 const child=new EventEmitter();child.stdin=new EventEmitter();child.stdin.write=()=>false;child.stdin.end=()=>{};
 const input=encoderPipe(child),writing=input.write(Buffer.alloc(1));child.emit('close',7,null);
 await assert.rejects(bounded(writing),/encoder|exit|closed/i);
});
test('owned encoder child nonzero exit rejects completion',async()=>{
 const child=spawn(process.execPath,['-e','process.exit(7)'],{stdio:['pipe','ignore','ignore']});
 await assert.rejects(bounded(encoderPipe(child).finish()));
});
test('CDP disconnect rejects pending and subsequent requests',async()=>{
 const ws=new Socket(),send=cdpRequests(ws,30),pending=send('Runtime.evaluate');await Promise.resolve();ws.dispatchEvent(new Event('close'));
 await assert.rejects(bounded(pending),/CDP.*closed/i);await assert.rejects(bounded(send('Page.enable')),/CDP.*closed/i);
});
test('CDP socket error rejects pending requests',async()=>{
 const ws=new Socket(),send=cdpRequests(ws,30),pending=send('Runtime.evaluate');await Promise.resolve();ws.dispatchEvent(new Event('error'));
 await assert.rejects(bounded(pending),/CDP.*error/i);
});
test('CDP missing response times out',async()=>{
 const send=cdpRequests(new Socket(),15);await assert.rejects(bounded(send('Runtime.evaluate')),/CDP.*timeout/i);
});
test('CDP normal response remains intact',async()=>{
 const ws=new Socket(),send=cdpRequests(ws,30),pending=send('Runtime.evaluate');await Promise.resolve();
 ws.dispatchEvent(new MessageEvent('message',{data:JSON.stringify({id:ws.last.id,result:{ok:true}})}));
 assert.deepEqual(await pending,{id:1,result:{ok:true}});
});

test('owned missing encoder executable rejects without uncaught error',async()=>{
 const child=spawn('/tmp/promo-owned-missing-executable-1109',[],{stdio:['pipe','ignore','ignore']});
 await assert.rejects(bounded(encoderPipe(child).finish()),/ENOENT|closed|destroyed/);
});
test('stdin failure releases a backpressured encoder write',async()=>{
 const child=new EventEmitter();child.stdin=new EventEmitter();child.stdin.write=()=>false;child.stdin.end=()=>{};
 const input=encoderPipe(child),writing=input.write(Buffer.alloc(1));child.stdin.emit('error',Error('owned disk-full injection'));
 await assert.rejects(bounded(writing),/disk-full/);
});
test('owned working encoder child accepts frames and completes',async()=>{
 const child=spawn(process.execPath,['-e','process.stdin.resume()'],{stdio:['pipe','ignore','ignore']});
 const input=encoderPipe(child);await input.write(Buffer.from('owned frame'));await input.finish();
});
