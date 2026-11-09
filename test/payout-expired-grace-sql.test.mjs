import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

test('expired legacy settlement grace preserves accepted claims and exact settlement',{skip:!process.env.SQS_PGLITE},async t=>{
 const {PGlite}=await import(pathToFileURL(process.env.SQS_PGLITE)),db=new PGlite();
 const raw=f=>readFile(new URL('../tools/supabase/'+f+'.sql',import.meta.url),'utf8');
 const sql=async f=>(await raw(f)).replace(/\b(?:clock_timestamp|now)\(\)/g,'sqs_fixture_now()');
 const end=Date.UTC(2026,10,9),wallet=i=>'0x'+String(i).repeat(40),owner='0x9d506ba29843a232409d85e289edece8d6a7b452';
 const plan={house:'100',pool:'900',rollover:'900',prizes:[]};
 const rpc=async(p=plan,key='payout-key')=>(await db.query('select sqs_payout_plan($1,0,$2::jsonb) r',[key,p])).rows[0].r;
 const time=ms=>db.query('update sqs_fixture_time set ms=$1',[ms]);
 const entry=async({id=1,started=end-5*86400000,claimed=null,finished=null,version=null,paid='1000',who=wallet(1),verdict=null,ticks=0}={})=>db.query(`insert into sqs_ranked_entries(id,week,wallet,tx,paid,ip_hash,seed,started_at,claimed_at,finished_at,clock_version,submit_until,verdict,t,kills,level,won,name,log_sha) values($1,0,$2,$3,$4,'fixture',1,to_timestamp($5::double precision/1000),to_timestamp($6::double precision/1000),to_timestamp($7::double precision/1000),$8,to_timestamp($6::double precision/1000)+interval '15 minutes',$9,$10,1,1,false,'fixture','fixture')`,[id,who,'0x'+String(id).padStart(64,'0'),paid,started,claimed,finished,version,verdict,ticks]);
 try{
  await db.exec(`create role anon;create role authenticated;create table sqs_fixture_time(ms bigint);insert into sqs_fixture_time values(${end+480000});create function sqs_fixture_now() returns timestamptz language sql volatile as $$select to_timestamp(ms/1000.0) from sqs_fixture_time$$;`);
  for(const f of ['schema','update2','update3','ranked','payouts','update4','update5','update6','update7','update8','update9','update10','update14','update15','update16'])await db.exec(await sql(f));
  await db.exec("update sqs_admin set v=encode(sha256(convert_to(case when k='payout_key_sha256' then 'payout-key' else 'server-key' end,'UTF8')),'hex');");
  await db.exec('alter default privileges grant execute on functions to authenticated;');
  if(!process.env.SQS_GRACE_BASELINE){await db.exec(await sql('update17'));await db.exec(await sql('update17'));}
  const check=async(name,fn)=>t.test(name,async()=>{await db.exec('delete from sqs_ranked_payouts;delete from sqs_ranked_payout_weeks;delete from sqs_ranked_entries');await time(end+480000);await fn();});
  await check('five-day unclaimed run stops blocking, stays paid and unchanged',async()=>{
   await entry();const before=(await db.query('select * from sqs_ranked_entries')).rows;
   assert.deepEqual(await rpc(),{ok:true});assert.deepEqual((await db.query('select * from sqs_ranked_entries')).rows,before);
   assert.equal((await db.query('select paid::text from sqs_ranked_payout_weeks')).rows[0].paid,'1000');
  });
  await check('recent legacy run remains protected until its own 180-minute limit',async()=>{
   await entry({started:end-3600000});await time(end+7199999);assert.equal((await rpc()).error,'submission grace');
   await time(end+7200000);assert.deepEqual(await rpc(),{ok:true});
  });
  await check('week-end 180-minute limit still expires a later legacy run',async()=>{
   await entry({started:end-1});await time(end+10800000);assert.deepEqual(await rpc(),{ok:true});
  });
  await check('claimed unfinished replay blocks after its worker lease expires',async()=>{
   await entry({claimed:end-86400000});await time(end+10800001);assert.equal((await rpc()).error,'replay in progress');
  });
  await check('new clock policy protects the inclusive five-minute upload boundary',async()=>{
   await entry({version:1});await time(end+300000);assert.equal((await rpc()).error,'submission grace');
   await time(end+300001);assert.deepEqual(await rpc(),{ok:true});
  });
  await check('unstarted refund excludes only that liability from pool',async()=>{
   await entry();await entry({id:2,started:null,paid:'200'});assert.deepEqual(await rpc(),{ok:true});
   const rows=(await db.query('select id,paid::text,refund_reason from sqs_ranked_entries order by id')).rows;
   assert.equal(rows[0].refund_reason,null);assert.equal(rows[1].refund_reason,'ranked admission closed before this entry started');
   assert.equal((await db.query('select paid::text from sqs_ranked_payout_weeks')).rows[0].paid,'1000');
  });
  await check('five fixed shares, dust, owner exclusion and idempotency stay exact',async()=>{
   await entry({paid:'1'});
   for(let i=2;i<=6;i++)await entry({id:i,paid:'200',who:wallet(i),finished:end-1000,verdict:'ok',ticks:1000-i});
   await entry({id:7,paid:'1',who:owner,finished:end-1000,verdict:'ok',ticks:9999});
   const expected={house:'100',pool:'902',rollover:'0',prizes:[{wallet:wallet(2),amount:'360'},{wallet:wallet(3),amount:'225'},{wallet:wallet(4),amount:'135'},{wallet:wallet(5),amount:'108'},{wallet:wallet(6),amount:'74'}]};
   assert.equal((await rpc(plan)).error,'plan differs from settlement');assert.deepEqual(await rpc(expected),{ok:true});
   const before=(await db.query('select * from sqs_ranked_payouts order by id')).rows;
   assert.deepEqual(await rpc(expected),{ok:true,again:true});assert.deepEqual((await db.query('select * from sqs_ranked_payouts order by id')).rows,before);
  });
  await check('key guard, ACL, search path and row privacy stay closed',async()=>{
   assert.equal((await rpc(plan,null)).error,'forbidden');assert.equal((await rpc(plan,'wrong')).error,'forbidden');
   const fn='sqs_payout_plan(text,int,jsonb,text)';
   assert.deepEqual((await db.query("select has_function_privilege('anon',$1,'execute') a,has_function_privilege('authenticated',$1,'execute') b",[fn])).rows[0],{a:true,b:false});
   const meta=(await db.query('select proconfig,prosecdef from pg_proc where oid=$1::regprocedure',[fn])).rows[0];
   assert.equal(meta.prosecdef,true);assert.ok(meta.proconfig.includes('search_path=pg_catalog, public, pg_temp'));
   assert.equal((await db.query("select count(*)::int n from pg_proc p, lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where p.oid=$1::regprocedure and a.grantee=0 and a.privilege_type='EXECUTE'",[fn])).rows[0].n,0);
   await db.exec('set role anon');await assert.rejects(db.query('select * from sqs_ranked_entries'));await db.exec('reset role');
  });
 }finally{await db.close();}
});
