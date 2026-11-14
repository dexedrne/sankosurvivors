import test from 'node:test';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {fixture,wallet} from './helpers/payout.mjs';
import {decimal} from '../tools/payout/core.mjs';
import {run} from '../tools/payout/runner.mjs';
import {sqlDB} from './helpers/payout-sql-db.mjs';

function active({normal='5',hard='0',balance='10'}={}) {
  const f=fixture(5);f.db.refunds=[];f.chain.dmt=decimal(balance);
  f.db.reports.set(1,{week:1,paid:normal==='0'?'0':decimal(normal).toString(),top:[],refunds:[]});
  f.db.reports.set('1:hard',{week:1,mode:'hard',paid:hard==='0'?'0':decimal(hard).toString(),top:[],refunds:[]});
  return f;
}

for(const [normal,hard]of[['5','0'],['0','5'],['2','3']])test(`active Normal ${normal}/Hard ${hard} fees cannot back an older short pot`,async()=>{
  const f=active({normal,hard});f.config.live=false;
  await run(f.config,f.ports);
  assert.ok(f.logs.some(s=>s.includes('DMT balance')));
  assert.ok(!f.logs.some(s=>s.startsWith('WOULD SEND')));assert.equal(f.chain.broadcasts.length,0);
  assert.ok(f.db.rows.every(r=>r.nonce==null));
});

for(const now of [Date.UTC(2026,10,4),Date.UTC(2026,10,9,0,55)])test(`unplanned fees remain reserved at ${now} while refunds are considered`,async()=>{
  const f=fixture(5);f.config.live=false;f.db.now=now;f.chain.dmt=decimal('10');
  await run(f.config,f.ports);
  assert.equal(f.db.weeks.length,0);assert.ok(f.logs.some(s=>s.includes('DMT balance')));
  assert.ok(!f.logs.some(s=>s.startsWith('WOULD SEND')));assert.equal(f.chain.broadcasts.length,0);
});

test('exactly funded old awards leave both current races fully covered',async()=>{
  const f=active({normal:'2',hard:'3',balance:'15'});
  await run(f.config,f.ports);await run(f.config,f.ports);
  assert.equal(f.chain.broadcasts.length,6);assert.equal(f.chain.dmt,decimal('5'));
  assert.ok(!f.logs.some(s=>s.includes('DMT balance')));
});

test('grace-week fees remain after an exactly funded refund',async()=>{
  const f=fixture(5);f.db.now=Date.UTC(2026,10,9,0,55);f.chain.dmt=decimal('10.5');
  await run(f.config,f.ports);
  assert.equal(f.db.weeks.length,0);assert.equal(f.chain.broadcasts.length,1);assert.equal(f.chain.dmt,decimal('10'));
});

test('settlement converts active fees into awards/rollover without counting either twice',async()=>{
  const f=active({normal:'2',hard:'3',balance:'15'});
  f.db.reports.get(0).top=[{wallet:wallet(1),name:'First',t:900,kills:100}];
  await run(f.config,f.ports);assert.equal(f.chain.dmt,decimal('10.4'));
  f.db.now=Date.UTC(2026,10,17,1);
  f.db.reports.get(1).top=[{wallet:wallet(2),t:900,kills:100}];
  f.db.reports.get('1:hard').top=[{wallet:wallet(3),t:900,kills:100}];
  await run(f.config,f.ports);await run(f.config,f.ports);
  assert.equal(f.chain.dmt,decimal('6.732'));assert.equal(f.chain.broadcasts.length,6);
});

for(const [week,mode]of[[0,'normal'],[0,'hard'],[1,'normal'],[1,'hard']])test(`late ${week}/${mode} refund is reserved before its payout row exists`,async()=>{
  const f=active({normal:'0'});f.config.live=false;const original=f.ports.rpc;
  f.ports.rpc=async(fn,p)=>{
    const r=await original(fn,p);
    return fn==='sqs_ranked_settle'&&p.p_week===week&&(p.p_mode??'normal')===mode?{...r,refunds:[{tx:'0x'+'a'.repeat(64),wallet:wallet(9),paid:decimal('5').toString(),why:'fixture late registration'}]}:r;
  };
  await run(f.config,f.ports);
  assert.ok(f.logs.some(s=>s.includes('DMT balance')));assert.ok(!f.logs.some(s=>s.startsWith('WOULD SEND')));
});

test('imported and confirmed refunds are not reserved a second time',async()=>{
  const f=active({normal:'0',balance:'10.5'});
  f.db.refunds.push({id:'100',week:0,wallet:wallet(9),paid:'500000000000000000'});
  await run(f.config,f.ports);assert.equal(f.chain.broadcasts.length,7);assert.equal(f.chain.dmt,0n);
  f.db.refunds.push({id:'101',week:1,wallet:wallet(9),paid:'500000000000000000'});f.chain.dmt+=500000000000000000n;
  await run(f.config,f.ports);await run(f.config,f.ports);
  assert.equal(f.chain.broadcasts.length,8);assert.equal(f.chain.dmt,0n);
});

for(const condition of ['missing week','wrong week','missing mode','wrong mode','missing paid','numeric paid','negative paid','overflow paid','missing refunds','invalid refunds','missing refund tx','invalid refund amount','zero refund','duplicate refund','report error','report unavailable'])test(`reserve ${condition} cannot silently become zero`,async()=>{
  const f=active({normal:'0'}),original=f.ports.rpc;f.config.live=false;
  f.ports.rpc=async(fn,p)=>{
    const r=await original(fn,p);
    if(fn!=='sqs_ranked_settle'||p.p_week!==1||p.p_mode!=='normal')return r;
    const copy=structuredClone(r),refund={tx:'0x'+'a'.repeat(64),paid:'1'};
    if(condition==='missing week')delete copy.week;
    if(condition==='wrong week')copy.week=999;
    if(condition==='missing mode')delete copy.mode;
    if(condition==='wrong mode')copy.mode='hard';
    if(condition==='missing paid')delete copy.paid;
    if(condition==='numeric paid')copy.paid=0;
    if(condition==='negative paid')copy.paid='-1';
    if(condition==='overflow paid')copy.paid=String(1n<<256n);
    if(condition==='missing refunds')delete copy.refunds;
    if(condition==='invalid refunds')copy.refunds={};
    if(condition==='missing refund tx')copy.refunds=[{paid:'1'}];
    if(condition==='invalid refund amount')copy.refunds=[{...refund,paid:'1.5'}];
    if(condition==='zero refund')copy.refunds=[{...refund,paid:'0'}];
    if(condition==='duplicate refund')copy.refunds=[refund,{...refund}];
    if(condition==='report error')return {error:'fixture unavailable'};
    if(condition==='report unavailable')throw Error('fixture disconnected');
    return copy;
  };
  await run(f.config,f.ports);
  assert.ok(!f.logs.some(s=>s.startsWith('WOULD SEND')));assert.ok(f.logs.some(s=>s.startsWith('PAUSED:')));
  assert.equal(f.chain.broadcasts.length,0);assert.ok(f.db.rows.every(r=>r.nonce==null));
});

test('a known refund amount conflicting with the report pauses instead of hiding the difference',async()=>{
  const f=active({normal:'0',balance:'10.5'});f.config.live=false;
  f.db.refunds.push({id:'100',week:0,wallet:wallet(9),paid:'500000000000000000'});
  const original=f.ports.rpc;
  f.ports.rpc=async(fn,p)=>{const r=await original(fn,p);if(fn==='sqs_ranked_settle'&&p.p_week===0)r.refunds[0].paid=decimal('5').toString();return r;};
  await run(f.config,f.ports);assert.ok(f.logs.some(s=>s.startsWith('PAUSED:')));assert.ok(!f.logs.some(s=>s.startsWith('WOULD SEND')));
});

test('first-week reserve reads retain conservative compatibility with legacy negative-week refunds',async()=>{
  const f=fixture(5);f.config.live=false;f.db.now=Date.UTC(2026,10,4);f.chain.dmt=decimal('10.5');
  const original=f.ports.rpc;
  f.ports.rpc=async(fn,p)=>{const r=await original(fn,p);return fn==='sqs_ranked_settle'&&p.p_week===-1&&p.p_mode==='normal'?{...r,refunds:[{tx:'0x'+'a'.repeat(64),paid:decimal('5').toString()}]}:r;};
  await run(f.config,f.ports);assert.ok(f.logs.some(s=>s.includes('DMT balance')));assert.ok(!f.logs.some(s=>s.startsWith('WOULD SEND')));
});

test('unexpected gross fees in a race that was never open pause instead of being ignored',async()=>{
  const f=active({normal:'0'});f.config.live=false;const original=f.ports.rpc;
  f.ports.rpc=async(fn,p)=>{const r=await original(fn,p);return fn==='sqs_ranked_settle'&&p.p_week===0&&p.p_mode==='hard'?{...r,paid:decimal('5').toString()}:r;};
  await run(f.config,f.ports);assert.ok(f.logs.some(s=>s.startsWith('PAUSED:')));assert.ok(!f.logs.some(s=>s.startsWith('WOULD SEND')));
});

test('a registered credit after balance read can defer safely and succeeds on retry',async()=>{
  const f=active({balance:'15'}),original=f.ports.chain.balances.bind(f.ports.chain);let credit=true;
  f.ports.chain.balances=async(...args)=>{
    const b=await original(...args);
    if(credit){credit=false;f.db.reports.get(1).paid=decimal('6').toString();f.chain.dmt+=decimal('1');}
    return b;
  };
  await run(f.config,f.ports);assert.equal(f.chain.broadcasts.length,0);
  await run(f.config,f.ports);assert.equal(f.chain.broadcasts.length,6);assert.equal(f.chain.dmt,decimal('6'));
});

test('real SQL reserve reports keep active fees and exclude refunds from gross paid', {skip:!process.env.SQS_PGLITE},async()=>{
  const f=fixture(5),pg=await sqlDB({current:true});await pg.db.exec(await readFile(new URL('../tools/supabase/update19.sql',import.meta.url),'utf8'));f.db.now=Date.UTC(2026,10,17,1);f.config.live=false;f.chain.dmt=decimal('10.5');
  try{
    for(let n=1;n<=5;n++)await pg.db.exec(`insert into sqs_ranked_entries(week,wallet,tx,paid,ip_hash,seed,verdict,t,kills,won,finished_at,name) values(0,'${wallet(n)}','0x${String(n).repeat(64)}',2000000000000000000,'fixture',1,'ok',${900-n},100,false,now(),'Fixture');`);
    await pg.db.exec(`insert into sqs_ranked_entries(week,wallet,tx,paid,ip_hash,seed) values(2,'${wallet(9)}','0x${'9'.repeat(64)}',5000000000000000000,'fixture',1);`);
    await pg.db.exec(`insert into sqs_ranked_entries(week,wallet,tx,paid,ip_hash,seed,refund_reason) values(2,'${wallet(8)}','0x${'8'.repeat(64)}',500000000000000000,'fixture',1,'fixture refused entry');`);
    f.db.onRefund({source_tx:'0x'+'8'.repeat(64),wallet:wallet(8),amount:'500000000000000000'});
    f.ports.rpc=pg.rpc;await run(f.config,f.ports);
    assert.ok(f.logs.some(s=>s.includes('DMT balance')));assert.ok(!f.logs.some(s=>s.startsWith('WOULD SEND')));
    const state=await pg.rpc('sqs_payout_read',{p_key:'payout-key'});assert.ok(state.rows.every(r=>r.nonce==null));
    const report=await pg.rpc('sqs_ranked_settle',{p_key:'reports-key',p_week:2,p_mode:'normal'});
    assert.equal(report.paid,decimal('5').toString());assert.equal(report.refunds.length,1);assert.equal(report.refunds[0].paid,'500000000000000000');
    f.config.live=true;f.chain.dmt=decimal('15.5');await run(f.config,f.ports);await run(f.config,f.ports);
    assert.equal(f.chain.broadcasts.length,7);assert.equal(f.chain.dmt,decimal('5'));
  }finally{await pg.db.close();}
});

test('real SQL exposes a late week-zero Hard refund even though that race never opened', {skip:!process.env.SQS_PGLITE},async()=>{
  const f=fixture(5),pg=await sqlDB();f.config.live=false;f.chain.dmt=decimal('10');let late=true;
  try{
    for(let n=1;n<=5;n++)await pg.db.exec(`insert into sqs_ranked_entries(week,wallet,tx,paid,ip_hash,seed,verdict,t,kills,won,finished_at,name) values(0,'${wallet(n)}','0x${String(n).repeat(64)}',2000000000000000000,'fixture',1,'ok',${900-n},100,false,now(),'Fixture');`);
    f.ports.rpc=async(fn,p)=>{
      const r=await pg.rpc(fn,p);
      if(fn==='sqs_payout_read'&&late){
        late=false;
        await pg.db.exec(`insert into sqs_ranked_entries(week,mode,wallet,tx,paid,ip_hash,seed,refund_reason) values(0,'hard','${wallet(9)}','0x${'9'.repeat(64)}',5000000000000000000,'fixture',1,'fixture reset refund');`);
      }
      return r;
    };
    await run(f.config,f.ports);
    assert.ok(f.logs.some(s=>s.includes('DMT balance')));assert.ok(!f.logs.some(s=>s.startsWith('WOULD SEND')));
    const r=await pg.rpc('sqs_ranked_settle',{p_key:'reports-key',p_week:0,p_mode:'hard'});
    assert.equal(r.paid,'0');assert.equal(r.refunds[0].paid,decimal('5').toString());
    const state=await pg.rpc('sqs_payout_read',{p_key:'payout-key'});
    assert.ok(state.rows.every(r=>r.nonce==null));assert.ok(!state.weeks.some(w=>w.week===0&&w.mode==='hard'));
  }finally{await pg.db.close();}
});
