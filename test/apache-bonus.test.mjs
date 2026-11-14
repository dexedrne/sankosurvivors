import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sqlDB} from './helpers/payout-sql-db.mjs';
import {makePlan} from '../tools/payout/core.mjs';
import {FIRST_BONUS,firstBonusFor} from '../src/first-bonus.js';
const a='0x'+'1'.repeat(40),b='0x'+'2'.repeat(40);
test('the funded bonus belongs only to Apacheweek1Normal and is immutable',()=>{
 assert.equal(FIRST_BONUS.amountWei,'20000000000000000000');assert(Object.isFrozen(FIRST_BONUS));assert.equal(firstBonusFor(1,'normal'),FIRST_BONUS);
 for(const [w,m] of [[0,'normal'],[2,'normal'],[1,'hard'],['1','normal'],[1,null]])assert.equal(firstBonusFor(w,m),null);
 assert.equal(FIRST_BONUS.tx,'0x008748b63201e11cc463d08aa6f1bdd1ac0bc48845894cdd330119da875de425');
});
async function fixture(){
 const f=await sqlDB({current:true});await f.db.exec(await readFile(new URL('../tools/supabase/update19.sql',import.meta.url),'utf8'));await f.db.exec(await readFile(new URL('../tools/supabase/update20.sql',import.meta.url),'utf8'));
 await f.db.exec("insert into sqs_ranked_payout_weeks(week,mode,paid,house,pool,incoming,rollover,top,pay_at) values(0,'normal',0,0,0,0,0,'[]',now());");return f;
}
async function seed(f,{eligible=true}={}){
 for(const [i,w,t,paid,kills] of [[1,a,eligible?600:29,'10000000000000000000',600],[2,b,eligible?300:29,'1000000000000000000',300]])await f.db.query("insert into sqs_ranked_entries(week,mode,wallet,tx,paid,ip_hash,seed,verdict,t,kills,level,finished_at,name,log,log_sha) values(1,'normal',$1,$2,$3,'fixture',1,'ok',$4,$5,1,now(),'fixture','log','sha')",[w,'0x'+String(i).repeat(64),paid,t,kills]);
 const report=await f.rpc('sqs_ranked_settle_v2',{p_key:'reports-key',p_week:1,p_mode:'normal'});assert.deepEqual(await f.rpc('sqs_payout_plan_v2',{p_key:'payout-key',p_week:1,p_mode:'normal',p_plan:makePlan(report,'0',1)}),{ok:true});return f.rpc('sqs_payout_read',{p_key:'payout-key',p_week:1});
}
test('real SQL adds20only for the immutable first-place wallet, leaving pool and house unchanged',{skip:!process.env.SQS_PGLITE},async()=>{
 const f=await fixture();try{
  assert.equal((await f.rpc('sqs_payout_first_bonus',{p_key:'bad'})).error,'forbidden');assert.equal((await f.rpc('sqs_payout_first_bonus',{p_key:'payout-key'})).waiting,true);
  const before=await seed(f);assert.deepEqual(await f.rpc('sqs_payout_first_bonus',{p_key:'payout-key'}),{ok:true});
  const after=await f.rpc('sqs_payout_read',{p_key:'payout-key',p_week:1});assert.deepEqual(after.weeks,before.weeks);assert.deepEqual(after.rows.filter(r=>r.kind!=='prize-bonus'),before.rows);
  const row=after.rows.find(r=>r.kind==='prize-bonus');assert.equal(row.wallet,a);assert.equal(row.amount,FIRST_BONUS.amountWei);assert.equal(row.status,'planned');
  assert.equal((await f.rpc('sqs_payout_first_bonus',{p_key:'payout-key'})).again,true);assert.deepEqual(await f.rpc('sqs_payout_read',{p_key:'payout-key',p_week:1}),after);
  await f.rpc('sqs_payout_hold',{p_key:'payout-key',p_week:1,p_wallet:a,p_reason:'review'});assert.equal((await f.rpc('sqs_payout_read',{p_key:'payout-key',p_week:1})).rows.find(r=>r.kind==='prize-bonus').status,'held');
  assert.equal((await f.rpc('sqs_payout_claim',{p_key:'payout-key',p_id:row.id,p_pending:'0',p_block:'100'})).error,'not claimable');
  await f.rpc('sqs_payout_hold',{p_key:'payout-key',p_week:1,p_wallet:a,p_reason:null});assert.equal((await f.rpc('sqs_payout_claim',{p_key:'payout-key',p_id:row.id,p_pending:'0',p_block:'100'})).ok,true);
  const schema=await readFile(new URL('../tools/supabase/update20.sql',import.meta.url),'utf8');await f.db.exec(schema);assert.equal((await f.rpc('sqs_payout_read',{p_key:'payout-key',p_week:1})).rows.filter(r=>r.kind==='prize-bonus').length,1);
 }finally{await f.db.close();}
});
test('real SQL keeps a held winner bonus held at creation and an empty eligible board unallocated',{skip:!process.env.SQS_PGLITE},async()=>{
 for(const eligible of [true,false]){const f=await fixture();try{
  await seed(f,{eligible});await f.rpc('sqs_payout_hold',{p_key:'payout-key',p_week:1,p_wallet:a,p_reason:'review'});
  const result=await f.rpc('sqs_payout_first_bonus',{p_key:'payout-key'}),state=await f.rpc('sqs_payout_read',{p_key:'payout-key',p_week:1});
  if(eligible)assert.equal(state.rows.find(r=>r.kind==='prize-bonus').status,'held');else{assert.equal(result.waiting,true);assert.equal(state.rows.some(r=>r.kind==='prize-bonus'),false);}
 }finally{await f.db.close();}}
});
test('public bonusmetadata is fixed and its new functions retain keyed/private grants',{skip:!process.env.SQS_PGLITE},async()=>{
 const f=await fixture();try{
  assert.deepEqual(await f.rpc('sqs_ranked_bonus',{p_week:1,p_mode:'normal'}),{amountWei:FIRST_BONUS.amountWei,tx:FIRST_BONUS.tx});
  for(const [w,m] of [[0,'normal'],[2,'normal'],[1,'hard']])assert.deepEqual(await f.rpc('sqs_ranked_bonus',{p_week:w,p_mode:m}),{amountWei:'0',tx:null});
  const p=(await f.db.query("select has_function_privilege('anon','sqs_payout_first_bonus(text)','execute') keyed,has_function_privilege('authenticated','sqs_payout_first_bonus(text)','execute') auth,exists(select 1 from pg_proc p, lateral aclexplode(p.proacl) a where p.oid='sqs_payout_first_bonus(text)'::regprocedure and a.grantee=0 and a.privilege_type='EXECUTE') public_execute")).rows[0];assert.deepEqual(p,{keyed:true,auth:false,public_execute:false});
 }finally{await f.db.close();}
});

test('the pledged funding transaction can never also become an entry or refund source',{skip:!process.env.SQS_PGLITE},async()=>{
 const f=await fixture();try{await assert.rejects(f.db.query("insert into sqs_ranked_entries(week,wallet,tx,paid,ip_hash,seed) values(1,$1,$2,20000000000000000000,'fixture',1)",[a,FIRST_BONUS.tx]),/sqs_bonus_funding_not_entry/);}finally{await f.db.close();}
});
