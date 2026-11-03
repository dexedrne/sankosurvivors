import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { makePlan } from '../tools/payout/core.mjs';
const w = n => '0x'+n.toString(16).padStart(40,'0');
import { sqlDB } from './helpers/payout-sql-db.mjs';
test('payout SQL: idempotence, canonical plans, refunds, transitions, holds and permissions', {skip:!process.env.SQS_PGLITE}, async t=>{
  const {db,rpc}=await sqlDB(); const call=(fn,p={})=>rpc('sqs_payout_'+fn,{p_key:'payout-key',...p});
  try {
    await db.exec(await readFile(new URL('../tools/supabase/payouts.sql',import.meta.url),'utf8'));
    await t.test('key preserved on reapply; unauthorized and null keys fail closed',async()=>{
      for(const key of ['wrong',null]) assert.equal((await rpc('sqs_payout_read',{p_key:key})).error,'forbidden');
      assert.ok((await call('read')).rows);
    });
    await t.test('canonical SQL matches top-five shares, last winner dust and rollover for 0/1/3/5/10 wallets',async()=>{
      for(const [count,prizes,rollover] of [[0,[],'901'],[1,['361'],'540'],[3,['360','225','136'],'180'],[5,['360','225','135','108','73'],'0'],[10,['360','225','135','108','73'],'0']]){
        await db.exec('truncate sqs_ranked_payouts,sqs_ranked_payout_weeks,sqs_ranked_entries restart identity;');
        for(let n=1;n<=Math.max(1,count);n++){
          const paid=count?Math.floor(1001/count)+(n<=1001%count?1:0):1001;
          await db.exec(`insert into sqs_ranked_entries(week,wallet,tx,paid,ip_hash,seed,verdict,t,kills,won,finished_at) values (0,'${w(n)}','0x${n.toString(16).padStart(64,'0')}',${paid},'${n}',1,${count?"'ok'":'null'},${900-n},1,false,now());`);
        }
        const report=await rpc('sqs_ranked_settle',{p_key:'reports-key',p_week:0});
        assert.equal((await call('plan',{p_week:0,p_plan:makePlan(report)})).ok,true);
        const state=await call('read');
        assert.deepEqual(state.rows.filter(r=>r.kind.startsWith('prize')).map(r=>r.amount),prizes);
        assert.equal(state.weeks[0].rollover,rollover);
        if(count===5){
          const fifth=state.rows.find(r=>r.kind==='prize5');
          await call('hold',{p_week:0,p_wallet:fifth.wallet,p_reason:'fifth place review'});
          assert.equal((await call('read')).rows.find(r=>r.id===fifth.id).status,'held');
          await call('hold',{p_week:0,p_wallet:fifth.wallet,p_reason:null});
        }
      }
      await db.exec('truncate sqs_ranked_payouts,sqs_ranked_payout_weeks,sqs_ranked_entries restart identity;');
    });
    await t.test('the developer wallet plays for no prize in SQL too: its first place passes down and the plan still matches',async()=>{
      const dev='0x9d506ba29843a232409d85e289edece8d6a7b452';
      for(const [n,wallet,time] of [[1,dev,899],[2,w(1),800],[3,w(2),700]]) await db.exec(`insert into sqs_ranked_entries(week,wallet,tx,paid,ip_hash,seed,verdict,t,kills,won,finished_at) values (0,'${wallet}','0x${n.toString(16).padStart(64,'0')}',1000,'${n}',1,'ok',${time},1,false,now());`);
      const report=await rpc('sqs_ranked_settle',{p_key:'reports-key',p_week:0});
      assert.equal(report.top[0].wallet,dev); // still on the board
      assert.equal((await call('plan',{p_week:0,p_plan:makePlan(report)})).ok,true);
      const prizes=(await call('read')).rows.filter(r=>r.kind.startsWith('prize'));
      assert.deepEqual(prizes.map(r=>[r.kind,r.wallet]),[['prize1',w(1)],['prize2',w(2)]]);
      await db.exec('truncate sqs_ranked_payouts,sqs_ranked_payout_weeks,sqs_ranked_entries restart identity;');
    });
    await db.exec(`insert into sqs_ranked_entries (week,wallet,tx,paid,ip_hash,seed,verdict,t,kills,won,finished_at,name) values
      (0,'${w(1)}','0x${'1'.repeat(64)}',1001,'a',1,'ok',100,1,false,now(),'One'),
      (0,'${w(2)}','0x${'2'.repeat(64)}',1000,'b',2,'ok',90,1,false,now(),'Two');`);
    await t.test('out-of-order, active weeks and tampered plans rejected',async()=>{
      assert.ok((await call('plan',{p_week:1,p_plan:{}})).error);
      assert.ok((await call('plan',{p_week:2,p_plan:{}})).error);
      assert.ok((await call('plan',{p_week:0,p_plan:{house:'900000'}})).error);
    });
    const report=await rpc('sqs_ranked_settle',{p_key:'reports-key',p_week:0});
    const plan=makePlan(report);
    await t.test('two winners roll over exactly; plan is immutable and repeat-safe',async()=>{
      assert.equal(plan.rollover,'630');
      assert.equal((await call('plan',{p_week:0,p_plan:plan})).ok,true);
      assert.equal((await call('plan',{p_week:0,p_plan:plan})).again,true);
      const state=await call('read'); assert.equal(state.weeks[0].pool,'1801');
      assert.equal(state.rows.filter(r=>r.kind.startsWith('prize')).length,2);
      assert.equal(state.rows.find(r=>r.kind==='rollover-note').amount,'630');
    });
    await t.test('next week consumes rollover once; empty week rolls it onward',async()=>{
      assert.equal((await call('plan',{p_week:1,p_plan:makePlan({paid:'0',top:[]},'630')})).ok,true);
      assert.equal((await call('read')).weeks[1].rollover,'630');
    });
    await t.test('multiple and late refunds are separate, immediate, and never duplicated',async()=>{
      for(const n of [3,4]) await db.exec(`insert into sqs_ranked_entries(week,wallet,tx,paid,ip_hash,seed,refund_reason) values (0,'${w(1)}','0x${String(n).repeat(64)}',500,'',0,'reset');`);
      await call('refunds'); await call('refunds');
      const refunds=(await call('read')).rows.filter(r=>r.kind==='refund');
      assert.equal(refunds.length,2); assert.equal(refunds[0].amount,'500'); assert.ok(refunds[0].source_entry_id);
    });
    await t.test('hold before claim blocks sending; clear resumes; sent hold does nothing',async()=>{
      const row=(await call('read')).rows.find(r=>r.kind==='prize1');
      assert.equal((await call('hold',{p_week:0,p_wallet:w(1),p_reason:'review'})).ok,true);
      assert.ok((await call('claim',{p_id:row.id,p_pending:'0',p_block:'100'})).error);
      await call('hold',{p_week:0,p_wallet:w(1),p_reason:null});
      const claim=await call('claim',{p_id:row.id,p_pending:'0',p_block:'100'}); assert.equal(claim.row.nonce,'0');
      assert.ok((await call('claim',{p_id:row.id,p_pending:'0',p_block:'100'})).error);
      const held=await call('hold',{p_week:0,p_wallet:w(1),p_reason:'too late'}); assert.equal(held.unchanged,1);
      const hash='0x'+'a'.repeat(64);
      assert.ok((await call('mark',{p_id:row.id,p_status:'confirmed',p_hash:hash})).error);
      assert.equal((await call('mark',{p_id:row.id,p_status:'sent',p_hash:hash})).ok,true);
      assert.ok((await call('mark',{p_id:row.id,p_status:'sent',p_hash:'0x'+'b'.repeat(64)})).error);
      assert.equal((await call('mark',{p_id:row.id,p_status:'confirmed',p_hash:hash})).ok,true);
      assert.ok((await call('mark',{p_id:row.id,p_status:'failed',p_error:'oops'})).error);
    });
    await t.test('global nonce assignment, runner lease and notification claims serialize duplicates',async()=>{
      const row=(await call('read')).rows.find(r=>r.kind==='house');
      assert.equal((await call('claim',{p_id:row.id,p_pending:'0',p_block:'100'})).row.nonce,'1');
      assert.equal((await call('lease',{p_owner:'a'})).ok,true);
      assert.equal((await call('lease',{p_owner:'b'})).ok,false);
      await call('lease',{p_owner:'a',p_release:true});
      assert.equal((await call('lease',{p_owner:'b'})).ok,true);
      assert.equal((await call('notice',{p_name:'week:0'})).ok,true);
      assert.equal((await call('notice',{p_name:'week:0'})).ok,false);
    });
    await t.test('nonce input, signed-byte immutability, failed state and table constraints fail closed',async()=>{
      const row=(await call('read')).rows.find(r=>r.kind==='prize2');
      assert.ok((await call('claim',{p_id:row.id,p_pending:'-1',p_block:'100'})).error);
      const house=(await call('read')).rows.find(r=>r.kind==='house');
      const hash='0x'+'d'.repeat(64);
      assert.ok((await call('mark',{p_id:house.id,p_status:'sent',p_hash:'bad'})).error);
      assert.equal((await call('mark',{p_id:house.id,p_status:'sending',p_hash:hash,p_raw:'0x02aa'})).ok,true);
      assert.ok((await call('mark',{p_id:house.id,p_status:'sending',p_hash:hash,p_raw:'0x02bb'})).error);
      assert.equal((await call('mark',{p_id:house.id,p_status:'sent',p_hash:hash})).ok,true);
      assert.equal((await call('mark',{p_id:house.id,p_status:'failed',p_hash:hash,p_error:'reverted'})).ok,true);
      assert.ok((await call('mark',{p_id:house.id,p_status:'planned',p_hash:hash})).error);
      for(const change of ["amount=-1","amount=0.5","wallet='bad'","status='unknown'"])await assert.rejects(db.exec(`update sqs_ranked_payouts set ${change} where id=${row.id}`),/check constraint/);
    });
    await t.test('anon can only call authenticated RPCs; tables and helpers inaccessible',async()=>{
      for(const table of ['sqs_ranked_payouts','sqs_ranked_payout_weeks','sqs_ranked_holds','sqs_ranked_payout_notices','sqs_ranked_payout_runner']) assert.equal((await db.query(`select relrowsecurity from pg_class where oid='${table}'::regclass`)).rows[0].relrowsecurity,true);
      await db.exec('set role anon');
      for(const table of ['sqs_ranked_payouts','sqs_ranked_payout_weeks','sqs_ranked_holds','sqs_ranked_payout_notices','sqs_ranked_payout_runner'])await assert.rejects(db.query(`select * from ${table}`),/permission denied/);
      await assert.rejects(db.query("update sqs_ranked_payouts set status='planned'"),/permission denied/);
      await assert.rejects(db.query("select sqs_key_ok('payout_key_sha256','payout-key')"),/permission denied/);
      assert.ok((await call('read')).rows);
      await db.exec("reset role; delete from sqs_admin where k='payout_key_sha256'; set role anon;");
      for(const [fn,p] of [['read',{}],['plan',{p_week:0,p_plan:{}}],['refunds',{}],['hold',{p_week:0,p_wallet:w(1),p_reason:'x'}],['claim',{p_id:1,p_pending:'0',p_block:'1'}],['mark',{p_id:1,p_status:'failed'}],['lease',{p_owner:'a'}],['notice',{p_name:'x'}]]) assert.equal((await call(fn,p)).error,'forbidden',fn);
      await db.exec('reset role');
    });
  } finally {await db.close();}
});
