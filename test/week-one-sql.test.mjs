import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sqlDB} from './helpers/payout-sql-db.mjs';
const sql=f=>readFile(new URL('../tools/supabase/'+f+'.sql',import.meta.url),'utf8');
test('owner update14 includes pending13 atomically and keeps week-aware refunds exact and private',{skip:!process.env.SQS_PGLITE},async()=>{
 const {db,rpc}=await sqlDB();try{
  for(const f of['update2','update3','update5','update7','update8','update9','update10'])await db.exec(await sql(f));
  await db.exec(`create or replace function public.sqs_ranked_fee(p_mode text) returns text language sql immutable as $$select case when p_mode='hard' then '1.5' else '0.5' end$$;grant execute on function public.sqs_ranked_fee(text) to public,anon,authenticated;`);
  const current=await sql('ranked'),start=current.indexOf('create or replace function public.sqs_ranked_enter('),end=current.indexOf('\nend $$;',start)+'\nend $$;'.length;
  await db.exec(current.slice(start,end).replace('sqs_ranked_fee(prev.paid)','sqs_ranked_fee(prev.mode)').replace('sqs_ranked_fee(p_paid)','sqs_ranked_fee(p_mode)'));
  const migration=await sql('update14');assert.equal((migration.match(/^begin;/gmi)||[]).length,1);assert.equal((migration.match(/^commit;/gmi)||[]).length,1);
  await db.exec(migration);await db.exec(migration);
  for(const[i,[week,mode,dmt,paid]]of[[0,'normal','0.5','500000000000000000'],[1,'normal','1','1000000000000000000'],[1,'hard','2','2000000000000000000']].entries()){
   assert.equal(await rpc('sqs_ranked_fee',{p_paid:paid}),dmt);
   const args={p_server_key:'server-key',p_tx:'0x'+String(i+1).padStart(64,'0'),p_wallet:'0x'+String(i+1).padStart(40,'0'),p_week:week,p_ip_hash:'fixture-'+i,p_paid:paid,p_seed:1,p_max:0,p_mode:mode};
   const first=await rpc('sqs_ranked_enter',args);assert.equal(first.refund,true);assert.ok(first.error.endsWith('Your '+dmt+' DMT will be sent back.'));
   const retry=await rpc('sqs_ranked_enter',{...args,p_week:2,p_max:100});assert.equal(retry.error,first.error);
  }
  const rows=(await db.query('select id,week,mode,paid::text,refund_reason from sqs_ranked_entries order by id')).rows;await db.exec(migration);assert.deepEqual((await db.query('select id,week,mode,paid::text,refund_reason from sqs_ranked_entries order by id')).rows,rows);
  for(const paid of ['1','999999999999999999',String((1n<<256n)-1n)]){const {dmtText}=await import('../src/prize-display.js');assert.equal(await rpc('sqs_ranked_fee',{p_paid:paid}),dmtText(paid));}
  const guards=(await db.query("select has_function_privilege('anon','sqs_ranked_fee(numeric)','execute') anon,has_function_privilege('authenticated','sqs_ranked_fee(numeric)','execute') auth,to_regprocedure('sqs_ranked_fee(text)') old")).rows[0];assert.deepEqual(guards,{anon:false,auth:false,old:null});
  for(const f of['sqs_key_ok(text,text)','sqs_rate_ok(text,text,int)','sqs_ranked_board(int,text)'])assert.ok((await db.query('select proconfig from pg_proc where oid=$1::regprocedure',[f])).rows[0].proconfig.includes('search_path=pg_catalog, public, pg_temp'));
 }finally{await db.close();}
});
