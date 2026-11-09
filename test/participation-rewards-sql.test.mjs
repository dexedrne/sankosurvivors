import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {makePlan,HOUSE} from '../tools/payout/core.mjs';
import {gzipSync} from 'node:zlib';
import {main as reviewMain} from '../tools/payout/review.mjs';
import {validateState} from '../tools/payout/runner.mjs';
const wallet=n=>'0x'+n.toString(16).padStart(40,'0');
test('SQL18 matches exact JS allocation, eligibility, holds, snapshots and week0 preservation',{skip:!process.env.SQS_PGLITE},async t=>{
 const {PGlite}=await import(pathToFileURL(process.env.SQS_PGLITE)),db=new PGlite();
 const raw=n=>readFile(new URL('../tools/supabase/'+n+'.sql',import.meta.url),'utf8');
 const sql=async n=>(await raw(n)).replace(/\b(?:now|clock_timestamp)\(\)/g,'sqs_fixture_now()');
 const rpc=async(fn,p)=>(await db.query(`select ${fn}(${Object.keys(p).map((k,i)=>`${k}=>$${i+1}`).join(',')}) r`,Object.values(p))).rows[0].r;
 const pay=(op,p={})=>rpc('sqs_payout_'+op,{p_key:'payout-key',...p});
 let id=0;
 const entry=async({who=wallet(++id),week=1,paid='1000',t=180,verdict='ok',finished=true,refund=null,kills=1}={})=>{
  id++;
  await db.query(`insert into sqs_ranked_entries(id,week,mode,wallet,tx,paid,ip_hash,seed,started_at,claimed_at,finished_at,verdict,t,kills,level,won,name,refund_reason)
   values($1,$2,'hard',$3,$4,$5,'fixture',1,'2026-11-10',case when $6 then '2026-11-10'::timestamptz else null end,case when $6 then '2026-11-10'::timestamptz else null end,$7,$8,$9,1,false,'fixture',$10)`,[id,week,who,'0x'+String(id).padStart(64,'0'),paid,finished,verdict,t,kills,refund]);
 };
 const reset=async()=>{await db.exec('delete from sqs_ranked_payouts;delete from sqs_ranked_payout_weeks;delete from sqs_ranked_holds;delete from sqs_ranked_entries;');id=0;};
 const settle=()=>rpc('sqs_ranked_settle',{p_key:'reports-key',p_week:1,p_mode:'hard'});
 const plan=async()=>{const report=await settle(),p=makePlan(report,'0',1);assert.deepEqual(await pay('plan',{p_week:1,p_mode:'hard',p_plan:p}),{ok:true});return p;};
 try{
  await db.exec("create role anon;create role authenticated;create function sqs_fixture_now() returns timestamptz language sql stable as $$select '2026-11-16T03:01:00Z'::timestamptz$$;");
  for(const n of ['schema','update2','update3','ranked','payouts','update4','update5','update6','update7','update8','update9','update10','update14','update15','update16','update17'])await db.exec(await sql(n));
  await db.exec("update sqs_admin set v=encode(sha256(convert_to(case when k='payout_key_sha256' then 'payout-key' when k='reports_key_sha256' then 'reports-key' else 'server-key' end,'UTF8')),'hex');");
  const old={house:'100',pool:'900',rollover:'900',prizes:[]};
  await db.exec("insert into sqs_ranked_payout_weeks(week,mode,paid,house,pool,incoming,rollover,top,pay_at) values(0,'normal',1000,100,900,0,900,'[]','2026-11-10');insert into sqs_ranked_payouts(week,mode,kind,wallet,amount,status) values(0,'normal','house','"+HOUSE+"',100,'confirmed');");
  const before=await pay('read');
  await db.exec(await sql('update18'));await db.exec(await sql('update18'));
  const after=await pay('read');assert.deepEqual(after.rows,before.rows);assert.deepEqual(after.weeks.map(({activity,...w})=>w),before.weeks);assert.equal(after.weeks[0].activity,null);validateState(after);
  await reset();
  await t.test('all qualifying activity, owner/short/rejected/unsubmitted/refunded exclusion, uncapped repeat play',async()=>{
   await entry({who:HOUSE,t:10000});await entry({who:wallet(20),t:179});await entry({who:wallet(21),t:1000,verdict:'rejected: fixture'});await entry({who:wallet(22),finished:false,verdict:null,t:0});await entry({who:wallet(23),t:1000,refund:'fixture'});
   for(let i=1;i<=12;i++)await entry({who:wallet(i),t:180+i,kills:100-i});
   for(let i=0;i<25;i++)await entry({who:wallet(12),t:1800});
   const report=await settle();assert.equal(report.top.length,10);assert.equal(report.activity.length,12);
   assert.deepEqual(report.activity.at(-1),{wallet:wallet(12),runs:'26',seconds:'45192'});
   const board=await rpc('sqs_ranked_board',{p_week:1,p_mode:'hard'});assert.deepEqual(board.activity,report.activity);
   const p=await plan();assert.equal(p.participation.length,12);assert(!p.participation.some(r=>r.wallet===HOUSE));
   const state=await pay('read');validateState(state);const snap=structuredClone(state);
   snap.weeks[0].activity[0].seconds='179';assert.throws(()=>validateState(snap),/invalid reward activity|row differs|invalid weekly/);
   const dup=structuredClone(state);dup.rows.push({...dup.rows.find(r=>r.kind==='participation'),id:'999999'});assert.throws(()=>validateState(dup),/duplicate payout/);
   const bad=structuredClone(state);bad.rows.find(r=>r.kind==='participation').wallet=wallet(999);assert.throws(()=>validateState(bad),/row differs/);
  });
  await t.test('small pools, ties, unfilled places and empty activity conserve with SQL independently',async()=>{
   for(const paid of ['0','1','2','10','10001','11001'])for(const count of [0,1,3,5,7]){
    await reset();if(!count)await entry({paid,t:179});
    for(let i=1;i<=count;i++)await entry({who:wallet(i),paid:i===1?paid:'0',t:180,kills:10-i});
    const p=await plan();assert.equal(BigInt(p.house)+BigInt(p.rollover)+[...p.prizes,...p.participation].reduce((n,r)=>n+BigInt(r.amount),0n),BigInt(paid));validateState(await pay('read'));
   }
  });
  await t.test('holds cover rank and participation before/after planning and claim',async()=>{
   await reset();await entry({who:wallet(1)});await entry({who:wallet(2)});
   await pay('hold',{p_week:1,p_wallet:wallet(1),p_reason:'review'});await plan();
   let state=await pay('read');assert(state.rows.filter(r=>r.wallet===wallet(1)).every(r=>r.status==='held'));
   await pay('hold',{p_week:1,p_wallet:wallet(2),p_reason:'review'});state=await pay('read');assert(state.rows.filter(r=>r.wallet===wallet(2)).every(r=>r.status==='held'));
   await pay('hold',{p_week:1,p_wallet:wallet(2),p_reason:null});state=await pay('read');const row=state.rows.find(r=>r.wallet===wallet(2)&&r.kind==='participation');
   await db.query('update sqs_ranked_payouts set status=$1 where id=$2',['planned',row.id]);
   await db.query("insert into sqs_ranked_holds(week,wallet,reason) values(1,$1,'race')",[wallet(2)]);
   assert.equal((await pay('claim',{p_id:row.id,p_pending:'0',p_block:'0'})).error,'held');
  });
  await t.test('actual claim/finish lifecycle retains repeat and outside-top10 participation logs while week0 pruning stays exact',async t=>{
   t.mock.method(console,'log',()=>{});
   const submit=async(week,who,t,kills)=>{
    id++;const started=week===0?Date.UTC(2026,10,3):Date.UTC(2026,10,10);
    await db.query("insert into sqs_ranked_entries(id,week,mode,wallet,tx,paid,ip_hash,seed,started_at) values($1,$2,'normal',$3,$4,1000,'fixture',1,to_timestamp($5/1000.0))",[id,week,who,'0x'+String(id).padStart(64,'0'),started]);
    const identity={p_server_key:'server-key',p_id:id,p_wallet:who,p_started:started,p_log_sha:id.toString(16).padStart(64,'0'),p_attempt:'00000000-0000-4000-8000-'+String(id).padStart(12,'0')};
    assert.equal((await rpc('sqs_ranked_claim_v2',{...identity,p_allow_claim:true})).ok,true);
    const log=gzipSync(JSON.stringify({runs:[[6000,100,0]],uses:[],picks:[]})).toString('base64');
    const result=await rpc('sqs_ranked_finish_v2',{...identity,p_name:'fixture',p_t:t,p_kills:kills,p_level:2,p_won:false,p_verdict:'ok',p_log:log});
    assert.equal(result.ok,true);assert.equal(result.verdict,'ok');
    return {id,log};
   };
   for(const week of [0,1]){
    await reset();
    await db.exec("create or replace function sqs_fixture_now() returns timestamptz language sql stable as $$select '"+(week===0?'2026-11-08':'2026-11-15')+"T12:00:00Z'::timestamptz$$;");
    const first=await submit(week,wallet(1),180,1),second=await submit(week,wallet(1),181,2);
    assert.deepEqual((await db.query('select id,log from sqs_ranked_entries where id in ($1,$2) order by id',[first.id,second.id])).rows,[{id:first.id,log:week===0?null:first.log},{id:second.id,log:second.log}]);
    for(let n=2;n<=11;n++)await submit(week,wallet(n),300+n,100+n);
    const repeated=(await db.query('select id,log from sqs_ranked_entries where wallet=$1 order by id',[wallet(1)])).rows;
    assert.deepEqual(repeated,[{id:first.id,log:week===0?null:first.log},{id:second.id,log:week===0?null:second.log}]);
    assert.equal((await db.query('select count(*)::int n from sqs_ranked_entries where log is not null')).rows[0].n,week===0?10:12);
    if(week===1){
     const report=await rpc('sqs_ranked_settle',{p_key:'reports-key',p_week:1,p_mode:'normal'});
     assert.equal(report.activity_runs.length,12);assert.equal(report.top.length,10);
     for(const row of report.activity_runs)assert((await rpc('sqs_ranked_log',{p_key:'reports-key',p_id:Number(row.id)})).log);
     const reviewed=await reviewMain(['1'],{config:{reportsKey:'reports-key'},db:rpc});assert.equal(reviewed.length,12);assert(reviewed.every(line=>!line.includes('<< REVIEW')));
    }
   }
   await db.exec("create or replace function sqs_fixture_now() returns timestamptz language sql stable as $$select '2026-11-16T03:01:00Z'::timestamptz$$;");
  });
  await t.test('ACL and private snapshot remain closed',async()=>{
   assert.equal((await pay('plan',{p_week:1,p_mode:'hard',p_plan:{},p_key:null})).error,'forbidden');
   for(const fn of ['sqs_payout_plan(text,int,jsonb,text)','sqs_reward_activity(int,text)']){
    assert.equal((await db.query("select has_function_privilege('authenticated',$1,'execute') a",[fn])).rows[0].a,false);
   }
   assert.equal((await db.query("select has_function_privilege('anon','sqs_reward_activity(int,text)','execute') a")).rows[0].a,false);
   await db.exec('set role anon');await assert.rejects(db.query('select activity from sqs_ranked_payout_weeks'));await db.exec('reset role');
  });
 }finally{await db.close();}
});
