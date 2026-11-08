import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/payout.mjs';
import {run} from '../tools/payout/runner.mjs';
const scheduled=await import('../tools/payout/scheduled.mjs').catch(()=>({}));
test('approved payout schedule has an explicit bounded entry point',()=>assert.equal(typeof scheduled.runApprovedWeek,'function'));
test('approved week sends prizes and house only, preserving refund liability',async()=>{
 const f=fixture(3);await run(f.config,{...f.ports,approvedWeek:0});
 assert.equal(f.chain.broadcasts.length,4);assert.equal(f.db.rows.find(r=>r.kind==='refund').status,'planned');
});
test('an unapproved in-flight refund cannot be rebroadcast by the prize schedule',async()=>{
 const f=fixture(3);f.db.crashPrepared=true;await assert.rejects(run(f.config,f.ports));f.db.crashPrepared=false;
 let keys=0;await run(f.config,{...f.ports,approvedWeek:0,key:async()=>{keys++;throw Error('not approved');}});
 assert.equal(f.chain.broadcasts.length,0);assert.equal(keys,0);assert(f.logs.some(s=>s.includes('outside approved scope')));
});
test('scoped prizes still reserve unpaid refunds',async()=>{
 const f=fixture(3);f.chain.dmt=10000000000000000000n;await run(f.config,{...f.ports,approvedWeek:0});
 assert.equal(f.chain.broadcasts.length,0);assert(f.logs.some(s=>s.includes('DMT balance')));
});
test('scoped dry preview identifies the exact rows later eligible to send',async()=>{
 const f=fixture(3);const preview=await run({...f.config,live:false},{...f.ports,approvedWeek:0});
 assert.equal(preview.rows.length,4);assert(preview.rows.every(r=>r.week===0&&r.kind!=='refund'));
 const bad=structuredClone(preview.rows);bad[0].amount='1';
 await run(f.config,{...f.ports,approvedWeek:0,expectedRows:bad});assert.equal(f.chain.broadcasts.length,0);
 await run(f.config,{...f.ports,approvedWeek:0,expectedRows:preview.rows});assert.equal(f.chain.broadcasts.length,4);
});
test('schedule never loads configuration before reset or outside the approved window',async()=>{
 let loads=0;const load=async()=>{loads++;throw Error('must not load');};
 for(const now of [Date.UTC(2026,10,8,23,59),Date.UTC(2026,10,11)])await scheduled.runApprovedWeek({week:0,now:()=>now,load,log:()=>{}});
 assert.equal(loads,0);await assert.rejects(scheduled.runApprovedWeek({week:1,load,log:()=>{}}),/approved/);assert.equal(loads,0);
});
test('schedule freezes its dry preview before review and then sends only the same scoped live rows',async()=>{
 const f=fixture(3),phases=[];
 await scheduled.runApprovedWeek({week:0,now:()=>f.db.now,load:async()=>f.config,log:()=>{},review:async()=>{phases.push('review');return [];},ports:f.ports,execute:async(config,ports)=>{phases.push(config.live?'live':'dry');assert.equal(ports.approvedWeek,0);if(config.live)assert.deepEqual(ports.expectedRows,[{id:'preview'}]);return config.live?undefined:{rows:[{id:'preview'}]};}});
 assert.deepEqual(phases,['dry','review','live']);
});
test('accepted replay grace waits without signing in reset mode',async()=>{
 const f=fixture(3);f.db.now=Date.UTC(2026,10,9,0,1);let keys=0;
 await run(f.config,{...f.ports,approvedWeek:0,atReset:true,key:async()=>{keys++;throw Error('must wait');}});
 assert.equal(keys,0);assert.equal(f.chain.broadcasts.length,0);assert(f.logs.some(s=>s.includes('submission grace')));
});
test('completion marker stops future schedule invocations before configuration reads',async()=>{
 let loads=0;await scheduled.runApprovedWeek({week:0,now:()=>Date.UTC(2026,10,9,1),isComplete:async()=>true,load:async()=>{loads++;},log:()=>{}});
 assert.equal(loads,0);
});
test('all confirmed scoped rows are detected despite an unpaid refund',async()=>{
 const f=fixture(3);await run(f.config,{...f.ports,approvedWeek:0});
 const result=await run({...f.config,live:false},{...f.ports,approvedWeek:0});assert.equal(result.complete,true);
 assert.equal(f.db.rows.find(r=>r.kind==='refund').status,'planned');
});
test('missing SQL16 stops the schedule before review, ledger mutation or key loading',async()=>{
 let reviewed=0,executed=0;const calls=[];
 for(const response of [null,{ok:true},new Error('missing function')]){
  await assert.rejects(scheduled.runApprovedWeek({week:0,now:()=>Date.UTC(2026,10,9,0,1),load:async()=>({}),log:()=>{},ports:{rpc:async(name,args)=>{calls.push({name,args});if(response instanceof Error)throw response;return response;}},review:async()=>{reviewed++;return [];},execute:async()=>{executed++;}}));
 }
 assert.equal(reviewed,0);assert.equal(executed,0);assert.equal(calls.length,3);
 assert(calls.every(c=>c.name==='sqs_ranked_clock'&&c.args.p_server_key===null&&c.args.p_action==='state'));
});

for(const [label,reviewResult] of [
 ['flagged candidate',['normal #1 id 7: input statistics  << REVIEW']],
 ['missing replay log',['normal #1 id 7: no log  << REVIEW']],
 ['missing result',undefined],['null result',null],['object result',{}],['string result','clear'],
 ['null line',[null]],['numeric line',[1]],['empty line',['']],['blank line',['  ']],['sparse array',Array(1)],
])test(`schedule pauses for owner review before any live or key phase: ${label}`,async()=>{
 const f=fixture(3),phases=[],logs=[];let keys=0,completed=0;
 await scheduled.runApprovedWeek({week:0,now:()=>f.db.now,load:async()=>f.config,log:text=>logs.push(text),ports:{...f.ports,key:async()=>{keys++;return null;}},markComplete:async()=>{completed++;},
  review:async()=>{phases.push('review');return reviewResult;},execute:async(config,ports)=>{phases.push(config.live?'live':'dry');if(config.live)await ports.key();return {rows:[{id:'frozen-prize'}]};}});
 assert.deepEqual(phases,['dry','review']);assert.equal(keys,0);assert.equal(completed,0);assert.equal(f.chain.broadcasts.length,0);assert(logs.some(line=>/owner review/i.test(line)));
});
for(const [label,preview,complete]of[['waiting',undefined,false],['empty',{rows:[]},false],['already complete',{complete:true},true]])test(`schedule does not review or enter live phase after ${label} preview`,async()=>{
 const f=fixture(3);let reviews=0,executions=0,completed=0;
 await scheduled.runApprovedWeek({week:0,now:()=>f.db.now,load:async()=>f.config,ports:f.ports,log:()=>{},review:async()=>{reviews++;return [];},execute:async config=>{assert.equal(config.live,false);executions++;return preview;},markComplete:async()=>{completed++;}});
 assert.equal(reviews,0);assert.equal(executions,1);assert.equal(completed,Number(complete));
});
