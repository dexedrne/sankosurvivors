import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

test('rollover SQL: guarded clock, immutable credit, admission and settlement',{skip:!process.env.SQS_PGLITE},async t=>{
 const {PGlite}=await import(pathToFileURL(process.env.SQS_PGLITE)),db=new PGlite();
 const sql=f=>readFile(new URL('../tools/supabase/'+f+'.sql',import.meta.url),'utf8');
 try {
  await db.exec('create role anon;create role authenticated;');
  for(const f of ['schema','update2','update3','ranked','payouts','update4','update5','update6','update7','update8','update9','update10','update14','update15']) await db.exec(await sql(f));
  await db.exec('alter default privileges grant execute on functions to authenticated;');
  await db.exec(await sql('update16'));await db.exec(await sql('update16'));
  await db.exec("update sqs_admin set v=encode(sha256(convert_to(case when k='payout_key_sha256' then 'payout-key' else 'server-key' end,'UTF8')),'hex');");
  const rpc=async(fn,p)=>(await db.query(`select ${fn}(${Object.keys(p).map((k,i)=>`${k}=>$${i+1}`).join(',')}) r`,Object.values(p))).rows[0].r;
  const ms=Number((await db.query('select (extract(epoch from now())*1000)::bigint ms')).rows[0].ms),epoch=Date.UTC(2026,10,2),week=Math.floor((ms-epoch)/604800000),deadline=epoch+(week+1)*604800000;
  const wallet='0x'+'1'.repeat(40),identity={p_server_key:'server-key',p_id:1,p_wallet:wallet};
  await db.query("insert into sqs_ranked_entries(week,wallet,tx,paid,ip_hash,seed) values($1,$2,$3,500000000000000000,'fixture',1)",[week,wallet,'0x'+'1'.repeat(64)]);
  const start=p=>rpc('sqs_ranked_clock_start',{...identity,p_adv:'adventurer',p_deadline:deadline,...p});
  assert.match((await start({p_deadline:null})).error,/acknowledge/);
  assert.equal((await start({p_server_key:null})).error,'forbidden');
  const run=await start({});assert.equal(run.clockVersion,1);assert.equal(run.deadline,deadline);
  assert.equal((await rpc('sqs_ranked_claim',identity)).error,'that run was already sent');
  assert.equal((await start({})).started,run.started);
  const clock=p=>rpc('sqs_ranked_clock',{...identity,p_started:run.started,p_action:'state',p_seq:0,p_frame:0,...p});
  assert.equal((await clock({p_started:run.started-1})).error,'no run');
  assert.equal((await clock({p_action:'reset'})).error,'bad clock transition');
  assert.equal((await clock({p_action:'pause',p_seq:1})).seq,1);
  for(const duration of [3000,30000,90000]){
   await db.query('update sqs_ranked_entries set clock_paused_at=(extract(epoch from clock_timestamp())*1000)::bigint-$1 where id=1',[duration]);
   const pause=await clock({p_action:'pause',p_seq:1});assert.equal(pause.seq,1);
   const resumed=await clock({p_action:'resume',p_seq:2});assert.ok(resumed.creditMs>=Math.min(duration,30000));assert.ok(resumed.creditMs<=Math.min(duration,30000)+100);
   assert.equal((await clock({p_action:'resume',p_seq:2})).creditMs,resumed.creditMs);
   assert.equal((await clock({p_action:'pause',p_seq:3})).error,'bad clock transition');
   await db.exec('update sqs_ranked_entries set clock_seq=1,clock_action=\'pause\',clock_credit_ms=0 where id=1');
  }
  await db.exec("update sqs_ranked_entries set clock_paused_at=(extract(epoch from clock_timestamp())*1000)::bigint-3000 where id=1");
  assert.equal((await clock({p_action:'resume',p_seq:2,p_frame:1})).error,'bad clock transition');
  const claimArgs={...identity,p_started:run.started,p_log_sha:'a'.repeat(64),p_attempt:'00000000-0000-4000-8000-000000000001',p_allow_claim:true};
  const claim=await rpc('sqs_ranked_claim_v2',claimArgs);assert.ok(claim.creditMs>=3000&&claim.creditMs<3200);
  await rpc('sqs_ranked_release_v2',Object.fromEntries(Object.entries(claimArgs).filter(([k])=>k!=='p_allow_claim')));
  await db.exec('update sqs_ranked_entries set clock_paused_at=clock_paused_at-90000 where id=1');
  const retry=await rpc('sqs_ranked_claim_v2',claimArgs);assert.equal(retry.creditMs,claim.creditMs);assert.equal(retry.received,claim.received);
  assert.equal((await clock({p_action:'resume',p_seq:2})).error,'bad clock transition');
  const plan={p_key:'payout-key',p_week:0,p_plan:{house:'50000000000000000',pool:'450000000000000000',rollover:'450000000000000000',prizes:[]}};
  // Shift only the disposable fixture's week origin so reset is in the past, no system clock change.
  let migration=await sql('update16');migration=migration.replaceAll('2026-11-02T00:00:00Z','2020-01-01T00:00:00Z');await db.exec(migration);
  await db.exec('update sqs_ranked_entries set week=0,submit_until=now()-interval \'1 day\' where id=1');
  assert.equal((await rpc('sqs_payout_plan',plan)).error,'replay in progress');
  await db.exec("update sqs_ranked_entries set finished_at=now(),verdict='rejected: fixture' where id=1");
  assert.equal((await rpc('sqs_payout_plan',plan)).ok,true);
  const payAt=(await db.query('select pay_at from sqs_ranked_payout_weeks where week=0')).rows[0].pay_at;
  assert.ok(Math.abs(new Date(payAt).getTime()-ms)<30000);
  assert.equal((await rpc('sqs_payout_plan',plan)).again,true);
  const entry={p_server_key:'server-key',p_tx:'0x'+'2'.repeat(64),p_wallet:wallet,p_week:0,p_ip_hash:'fixture',p_paid:'500000000000000000',p_seed:1,p_max:100};
  assert.equal((await rpc('sqs_ranked_enter',entry)).refund,true);
  assert.equal((await rpc('sqs_ranked_enter',{...entry,p_tx:'0x'+'1'.repeat(64)})).id,1);
  // Pin both DB clocks for exact admission/upload/legacy grace boundaries.
  await db.exec(await sql('update16'));
  await db.exec("delete from sqs_ranked_payouts;delete from sqs_ranked_payout_weeks;delete from sqs_ranked_entries;create table sqs_fixture_time(ms bigint);insert into sqs_fixture_time values(1794180599999);create function public.sqs_fixture_now() returns timestamptz language sql volatile as $$select to_timestamp(ms/1000.0) from public.sqs_fixture_time$$;");
  await db.exec((await sql('update16')).replace(/\b(?:clock_timestamp|now)\(\)/g, 'sqs_fixture_now()'));
  const legacyStart=(await sql('ranked')).match(/create or replace function public\.sqs_ranked_start\([\s\S]*?end \$\$;/)[0];await db.exec(legacyStart.replaceAll('now()', 'sqs_fixture_now()'));
  const boundary=Date.UTC(2026,10,9),setTime=ms=>db.query('update sqs_fixture_time set ms=$1',[ms]);
  await setTime(boundary-1800001);
  await db.query("insert into sqs_ranked_entries(id,week,wallet,tx,paid,ip_hash,seed) values(1,0,$1,$2,500000000000000000,'fixture',1),(2,0,$1,$3,500000000000000000,'fixture',1)",[wallet,'0x'+'3'.repeat(64),'0x'+'4'.repeat(64)]);
  const before=await start({p_deadline:boundary});assert.equal(before.clockVersion,1);
  await setTime(boundary-1800000);assert.equal((await start({p_id:2,p_deadline:boundary})).closed,true);
  assert.equal((await start({p_deadline:boundary})).started,before.started);
  const gracePlan=plan;
  await setTime(boundary+300000);assert.equal((await rpc('sqs_payout_plan',gracePlan)).error,'submission grace');
  const accepted=await rpc('sqs_ranked_claim_v2',{...claimArgs,p_started:before.started});assert.equal(accepted.ok,true);
  await setTime(boundary+300001);assert.equal((await rpc('sqs_payout_plan',gracePlan)).error,'replay in progress');
  await db.exec('update sqs_ranked_entries set claimed_at=null,submit_sha=null,submit_until=null where id=1');
  assert.match((await rpc('sqs_ranked_claim_v2',{...claimArgs,p_started:before.started})).error,/too late/);
  await db.query("update sqs_ranked_entries set clock_version=null,clock_deadline=null where id=1");
  assert.equal((await rpc('sqs_payout_plan',gracePlan)).error,'submission grace');
  await setTime(boundary+10800000-1);assert.equal((await rpc('sqs_payout_plan',gracePlan)).error,'submission grace');
  await setTime(boundary+10800000);assert.match((await rpc('sqs_ranked_claim_v2',{...claimArgs,p_started:before.started})).error,/too late/);
  assert.equal((await rpc('sqs_payout_plan',gracePlan)).ok,true);
  for(const fn of ['sqs_ranked_clock_start(text,bigint,text,text,bigint)','sqs_ranked_clock(text,bigint,text,bigint,text,int,int)']){
   const acl=(await db.query("select has_function_privilege('anon',$1,'execute') a,has_function_privilege('authenticated',$1,'execute') b",[fn])).rows[0];assert.deepEqual(acl,{a:true,b:false});
   assert.ok((await db.query('select proconfig from pg_proc where oid=$1::regprocedure',[fn])).rows[0].proconfig.includes('search_path=pg_catalog, public, pg_temp'));
  }
  await db.exec('set role anon');await assert.rejects(db.query('select clock_credit_ms from sqs_ranked_entries'));await db.exec('reset role');
 }finally{await db.close();}
});
