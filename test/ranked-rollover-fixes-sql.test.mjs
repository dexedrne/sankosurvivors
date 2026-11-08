import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const enabled=!!process.env.SQS_PGLITE, end=Date.UTC(2026,10,9), wallet='0x'+'1'.repeat(40);
async function fixture(){
 const {PGlite}=await import(pathToFileURL(process.env.SQS_PGLITE)),db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create table sqs_fixture_time(ms bigint);insert into sqs_fixture_time values(${end-1800001});create function public.sqs_fixture_now() returns timestamptz language sql volatile as $$select to_timestamp(ms/1000.0) from public.sqs_fixture_time$$;`);
 for(const name of ['schema','update2','update3','ranked','payouts','update4','update5','update6','update7','update8','update9','update10','update14','update15','update16'])await db.exec((await readFile(new URL('../tools/supabase/'+name+'.sql',import.meta.url),'utf8')).replace(/\b(?:now|clock_timestamp)\(\)/g,'sqs_fixture_now()'));
 await db.exec("update sqs_admin set v=encode(sha256(convert_to(case when k='payout_key_sha256' then 'payout-key' when k='reports_key_sha256' then 'reports-key' else 'server-key' end,'UTF8')),'hex');");
 const rpc=async(fn,p)=>(await db.query(`select ${fn}(${Object.keys(p).map((k,i)=>`${k}=>$${i+1}`).join(',')}) r`,Object.values(p))).rows[0].r;
 const time=ms=>db.query('update sqs_fixture_time set ms=$1',[ms]),id=n=>({p_server_key:'server-key',p_id:n,p_wallet:wallet});
 const entry=n=>rpc('sqs_ranked_enter',{p_server_key:'server-key',p_tx:'0x'+String(n).padStart(64,'0'),p_wallet:wallet,p_week:0,p_ip_hash:'fixture',p_paid:'500000000000000000',p_seed:1,p_max:100});
 const start=n=>rpc('sqs_ranked_clock_start',{...id(n),p_adv:'adventurer',p_deadline:end});
 return{db,rpc,time,id,entry,start};
}
test('registered unstarted cutoff liabilities refund idempotently and planner resolves absent players',{skip:!enabled},async()=>{
 const {db,rpc,time,id,entry,start}=await fixture();try{
  for(const n of [1,2,3,4])await entry(n);
  await start(3);await time(end-1800000);
  const blocked=await start(1);assert.equal(blocked.refund,true);assert.equal(blocked.closed,true);
  assert.deepEqual(await start(1),blocked);assert.equal((await entry(1)).refund,true);
  assert.equal((await rpc('sqs_ranked_board',{p_week:0})).entries,3);
  await db.exec("update sqs_ranked_entries set claimed_at=sqs_fixture_now(),finished_at=sqs_fixture_now(),verdict='rejected: fixture' where id=3");
  await time(end+300001);
  const plan={p_key:'payout-key',p_week:0,p_plan:{house:'50000000000000000',pool:'450000000000000000',rollover:'450000000000000000',prizes:[]}};
  assert.equal((await rpc('sqs_payout_plan',plan)).ok,true);
  const snapshot=(await db.query('select * from sqs_ranked_payout_weeks')).rows;
  assert.equal((await rpc('sqs_ranked_board',{p_week:0})).paid,'500000000000000000');
  assert.equal((await db.query('select count(*)::int n from sqs_ranked_entries where refund_reason is not null')).rows[0].n,3);
  assert.equal((await rpc('sqs_payout_refunds',{p_key:'payout-key'})).added,3);
  assert.equal((await rpc('sqs_payout_refunds',{p_key:'payout-key'})).added,0);
  assert.equal((await rpc('sqs_payout_plan',plan)).again,true);assert.deepEqual((await db.query('select * from sqs_ranked_payout_weeks')).rows,snapshot);
  // Returning in the next week gives the existing refund, with no start or signature required.
  assert.equal((await start(2)).refund,true);
  assert.equal((await rpc('sqs_ranked_clock_start',{...id(4),p_adv:'adventurer',p_deadline:null})).refund,true);
 }finally{await db.close();}
});
test('credited active runs outlive9660seconds, bound abandonment and recover with a new clock identity',{skip:!enabled},async()=>{
 const {db,rpc,time,id,entry,start}=await fixture();try{
  const initial=end-86400000;await time(initial);await entry(1);const run=await start(1);
  const clock=p=>rpc('sqs_ranked_clock',{...id(1),p_started:run.started,...p});
  for(let i=0;i<60;i++){
   await time(initial+i*31000);assert.equal((await clock({p_action:'pause',p_seq:2*i+1,p_frame:i})).ok,true);
   await time(initial+i*31000+30000);assert.equal((await clock({p_action:'resume',p_seq:2*i+2,p_frame:i})).ok,true);
  }
  await time(initial+9900000);
  assert.equal((await rpc('sqs_ranked_active',{p_key:'reports-key'})).active,1);
  assert.equal((await rpc('sqs_ranked_active',{p_key:null})).error,'forbidden');
  const restart=p=>rpc('sqs_ranked_restart',{...id(1),p_started:run.started,p_seed:2,p_reason:'fixture update',...p});
  assert.match((await restart({p_started:run.started-1})).error,/already sent/);
  await time(initial+11460001);assert.equal((await rpc('sqs_ranked_active',{p_key:'reports-key'})).active,0);
  assert.match((await restart({})).error,/too long/);
  await time(initial+9900000);assert.equal((await restart({})).ok,true);
  const fresh=await start(1);assert.notEqual(fresh.started,run.started);assert.equal(fresh.clock.creditMs,0);assert.equal(fresh.clock.seq,0);assert.equal(fresh.clock.pausedAt,null);
  assert.equal((await clock({p_action:'state',p_seq:0,p_frame:0})).error,'no run');
  // A continuous abandoned pause contributes only30seconds, never the full day.
  await clock({p_action:'state',p_seq:0,p_frame:0});
  await rpc('sqs_ranked_clock',{...id(1),p_started:fresh.started,p_action:'pause',p_seq:1,p_frame:0});
  await time(fresh.started+9660000+29999);assert.equal((await rpc('sqs_ranked_active',{p_key:'reports-key'})).active,1);
  await time(fresh.started+9660000+30001);assert.equal((await rpc('sqs_ranked_active',{p_key:'reports-key'})).active,0);
  // Legacy retains its old bound regardless of credit columns.
  await db.exec('update sqs_ranked_entries set clock_version=null,clock_credit_ms=999999999 where id=1');
  assert.equal((await rpc('sqs_ranked_active',{p_key:'reports-key'})).active,0);
  await db.exec('update sqs_ranked_entries set clock_version=1 where id=1');await time(end);
  assert.equal((await rpc('sqs_ranked_active',{p_key:'reports-key'})).active,0);
  for(const signature of ['sqs_ranked_active(text)','sqs_ranked_restart(text,bigint,text,bigint,text,bigint)']){
   const acl=(await db.query("select has_function_privilege('anon',$1,'execute') a,has_function_privilege('authenticated',$1,'execute') b",[signature])).rows[0];assert.deepEqual(acl,{a:true,b:false});
   assert.ok((await db.query('select proconfig from pg_proc where oid=$1::regprocedure',[signature])).rows[0].proconfig.includes('search_path=pg_catalog, public, pg_temp'));
  }
 }finally{await db.close();}
});
test('interruption recovery after admission closure records refund instead of an unusable restart',{skip:!enabled},async()=>{
 const {db,rpc,time,id,entry,start}=await fixture();try{
  await time(end-7200000);await entry(1);const run=await start(1);await time(end-1800000);
  const out=await rpc('sqs_ranked_restart',{...id(1),p_started:run.started,p_seed:2,p_reason:'fixture update'});
  assert.equal(out.refund,true);assert.equal((await rpc('sqs_ranked_board',{p_week:0})).paid,'0');
  assert.equal((await start(1)).refund,true);
 }finally{await db.close();}
});
