import test from 'node:test';
import assert from 'node:assert/strict';
const { RankedClock }=await import('../src/ranked-clock-client.js').catch(()=>({}));
test('ranked clock exposes its server-backed client',()=>assert.equal(typeof RankedClock,'function'));
function fixture(initial={}) {
  let now=100000, snapshot={ok:true,seq:0,creditMs:0,pausedAt:null,serverNow:now,frame:0,...initial};
  let action=snapshot.seq?(snapshot.pausedAt===null?'resume':'pause'):null;
  const calls=[];let fail=false,lose=false;
  const clock=new RankedClock({run:'signed-run',now:()=>now,request:async body=>{
    calls.push({...body});if(fail)throw Error('offline');
    // Match SQL16 sequence/idempotency, frame advancement and frozen-resume guards.
    if(!['state','pause','resume'].includes(body.action)||!Number.isInteger(body.seq)||body.seq<0||body.seq>500000||!Number.isInteger(body.frame)||body.frame<0||body.frame>219600)return {error:'bad clock transition'};
    const duplicate=body.seq===snapshot.seq&&body.action===action&&body.frame===snapshot.frame;
    if(body.action!=='state'&&!duplicate){
      if(body.seq!==snapshot.seq+1||body.frame>Math.floor(now*30/1000))return {error:'bad clock transition'};
      if(body.action==='pause'&&(snapshot.pausedAt!==null||body.frame<snapshot.frame||(action!==null&&body.frame===snapshot.frame)))return {error:'bad clock transition'};
      if(body.action==='resume'&&(snapshot.pausedAt===null||body.frame!==snapshot.frame))return {error:'bad clock transition'};
      if(body.action==='pause')snapshot={...snapshot,pausedAt:now,frame:body.frame};
      else snapshot={...snapshot,creditMs:snapshot.creditMs+Math.min(30000,now-snapshot.pausedAt),pausedAt:null};
      snapshot.seq=body.seq;action=body.action;
    }
    snapshot.serverNow=now;
    if(lose&&body.action!=='state'){lose=false;throw Error('lost response');}
    return {...snapshot};
  }});
  return {clock,calls,advance:ms=>now+=ms,offline:v=>fail=v,lose:()=>lose=true};
}
test('brief choices after a long bathroom pause do not consume more pause budget',async()=>{
  const f=fixture();await f.clock.sync(false,100);
  await f.clock.sync(true,100);f.advance(600000);assert.equal(f.clock.creditMs(100),30000);
  await f.clock.sync(false,100);assert.equal(f.clock.creditMs(100),30000);
  await f.clock.sync(true,101);f.advance(3000);await f.clock.sync(false,101);
  assert.equal(f.clock.creditMs(101),33000);
});
test('switching pause screens does not start another grace period',async()=>{
 const f=fixture();await f.clock.sync(true,100);f.advance(20000);await f.clock.sync(true,100);f.advance(20000);await f.clock.sync(true,100);
 assert.equal(f.calls.filter(x=>x.action==='pause').length,1);assert.equal(f.clock.creditMs(100),30000);
});
test('recovery of a lost response does not replay a credit transition',async()=>{
 const f=fixture();await f.clock.sync(true,100);f.advance(3000);f.lose();await f.clock.sync(false,100);
 await f.clock.sync(false,100);assert.equal(f.clock.creditMs(100),3000);
 assert.equal(f.calls.filter(x=>x.action==='resume').length,1);
});
test('network failure never invents pause credit and later retry preserves the request',async()=>{
 const f=fixture();await f.clock.sync(false,100);f.offline(true);await f.clock.sync(true,100);f.advance(60000);
 assert.equal(f.clock.creditMs(100),0);assert.equal(f.clock.syncing,true);
 f.offline(false);await f.clock.sync(true,100);f.advance(3000);await f.clock.sync(false,100);assert.equal(f.clock.creditMs(100),3000);
});
test('an invalid server snapshot cannot grant arbitrary credit',async()=>{
 const c=new RankedClock({run:'run',request:async()=>({seq:0,creditMs:Infinity,pausedAt:null,serverNow:1,frame:0})});
 await c.sync(true,0);assert.equal(c.creditMs(0),0);assert.equal(c.syncing,true);
});
test('same-frame re-pause cannot block play or grant another grace period',async()=>{
 const f=fixture();await f.clock.sync(true,100);f.advance(3000);await f.clock.sync(false,100);
 await f.clock.sync(true,100);f.advance(60000);await f.clock.sync(true,100);
 assert.equal(f.clock.syncing,false);assert.equal(f.clock.creditMs(100),3000);
 await f.clock.sync(false,100);await f.clock.sync(true,101);f.advance(2000);await f.clock.sync(false,101);
 assert.equal(f.clock.syncing,false);assert.equal(f.clock.creditMs(101),5000);
 assert.deepEqual(f.calls.filter(x=>x.action!=='state').map(({action,frame,seq})=>[action,frame,seq]),[['pause',100,1],['resume',100,2],['pause',101,3],['resume',101,4]]);
});
test('restored older frames can run and later pause after the acknowledged frame',async()=>{
 const f=fixture({seq:2,frame:100,creditMs:3000});
 await f.clock.sync(true,80);assert.equal(f.clock.syncing,false);
 await f.clock.sync(false,80);await f.clock.sync(true,100);await f.clock.sync(false,100);
 assert.equal(f.clock.syncing,false);assert.equal(f.clock.creditMs(100),3000);
 await f.clock.sync(true,101);f.advance(2000);await f.clock.sync(false,101);
 assert.equal(f.clock.syncing,false);assert.equal(f.clock.creditMs(101),5000);
});
test('restored open pause closes at frozen frame before stale pause reconciliation',async()=>{
 const f=fixture({seq:1,frame:100,pausedAt:97000});
 await f.clock.sync(false,80);await f.clock.sync(true,80);await f.clock.sync(false,80);
 assert.equal(f.clock.syncing,false);assert.equal(f.clock.creditMs(80),3000);
 assert.deepEqual(f.calls.filter(x=>x.action!=='state').map(({action,frame,seq})=>[action,frame,seq]),[['resume',100,2]]);
});
test('lost resume response reconciles stale queued pause without blocking later transitions',async()=>{
 const f=fixture();await f.clock.sync(true,100);f.advance(3000);f.lose();await f.clock.sync(false,100);
 assert.equal(f.clock.syncing,true);
 await f.clock.sync(true,100);await f.clock.sync(false,100);await f.clock.sync(true,101);
 f.advance(2000);await f.clock.sync(false,101);
 assert.equal(f.clock.syncing,false);assert.equal(f.clock.creditMs(101),5000);
 assert.equal(f.calls.filter(x=>x.action==='resume'&&x.frame===100).length,1);
});
test('queued transitions retain FIFO across lost pause response and discard only stale pauses',async()=>{
 const f=fixture();await f.clock.sync(false,100);f.lose();await f.clock.sync(true,100);f.advance(3000);
 await Promise.all([f.clock.sync(false,100),f.clock.sync(true,100),f.clock.sync(false,100),f.clock.sync(true,101)]);
 assert.equal(f.clock.syncing,false);assert.equal(f.clock.snapshot.pausedAt,103000);
 f.advance(2000);await f.clock.sync(false,101);assert.equal(f.clock.creditMs(101),5000);
 assert.deepEqual(f.calls.filter(x=>x.action!=='state').map(({action,frame,seq})=>[action,frame,seq]),[['pause',100,1],['resume',100,2],['pause',101,3],['resume',101,4]]);
});
test('first pause at frame zero remains eligible for server credit',async()=>{
 const f=fixture();await f.clock.sync(true,0);f.advance(2000);await f.clock.sync(false,0);
 assert.equal(f.clock.syncing,false);assert.equal(f.clock.creditMs(0),2000);
});
test('still-paused sync can earn credit once its real frame passes a discarded stale pause',async()=>{
 const f=fixture({seq:2,frame:100,creditMs:3000});
 await f.clock.sync(true,80);f.advance(2000);await f.clock.sync(true,100);
 assert.equal(f.clock.syncing,false);assert.equal(f.clock.creditMs(100),3000);
 await f.clock.sync(true,101);f.advance(2000);
 assert.equal(f.clock.creditMs(101),5000);
 await f.clock.sync(false,101);assert.equal(f.clock.syncing,false);assert.equal(f.clock.creditMs(101),5000);
 assert.deepEqual(f.calls.filter(x=>x.action==='pause').map(({frame,seq})=>[frame,seq]),[[101,3]]);
});
