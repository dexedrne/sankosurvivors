import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sqlDB} from './helpers/payout-sql-db.mjs';
const sql=f=>readFile(new URL('../tools/supabase/'+f+'.sql',import.meta.url),'utf8');
test('ranked board counts all valid completed runs in the same week and race without changing best score or money',{skip:!process.env.SQS_PGLITE},async()=>{
 const {db,rpc}=await sqlDB();try{
  for(const f of['update2','update3','update5','update7','update8','update9','update10','update14'])await db.exec(await sql(f));
  const wallet='0x'+'1'.repeat(40);let id=0;
  async function row({week=0,mode='normal',t=100,kills=10,verdict='ok',refund=null,who=wallet}={}){
   await db.query("insert into sqs_ranked_entries(week,mode,wallet,tx,paid,ip_hash,seed,name,t,kills,level,won,adv,verdict,finished_at,refund_reason) values($1,$2,$3,$4,500000000000000000,'private-ip',42,'Player',$5,$6,5,false,'adventurer',$7,$8,$9)",[week,mode,who,'0x'+(++id).toString(16).padStart(64,'0'),t,kills,verdict,verdict?'2026-11-06T00:00:00Z':null,refund]);
  }
  await row();await row({t:200});await row({t:150});await row({week:1});await row({week:1,mode:'hard'});await row({verdict:null});await row({verdict:'rejected: unfinished'});await row({refund:'owed'});
  await row({who:'0x'+'2'.repeat(40),t:180});
  const before=await rpc('sqs_ranked_board',{p_week:0}),saved=(await db.query('select * from sqs_ranked_entries order by id')).rows;
  let migration;try{migration=await sql('update15');}catch(e){if(e.code!=='ENOENT')throw e;}
  if(migration){await db.exec(migration);await db.exec(migration);}
  const board=await rpc('sqs_ranked_board',{p_week:0});
  assert.deepEqual(board.rows.map(r=>[r.wallet,r.t,r.runs]),[[wallet,200,3],['0x'+'2'.repeat(40),180,1]]);
  assert.deepEqual({...board,rows:board.rows.map(({runs,...r})=>r)},before,'scores/order/fees/rollover remain exact');
  assert.equal((await rpc('sqs_ranked_board',{p_week:1})).rows[0].runs,1);
  assert.equal((await rpc('sqs_ranked_board',{p_week:1,p_mode:'hard'})).rows[0].runs,1);
  assert.deepEqual((await db.query('select * from sqs_ranked_entries order by id')).rows,saved,'re-running migration does not touch player records');
  const privilege=(await db.query("select has_function_privilege('anon','sqs_ranked_board(int,text)','execute') a,has_function_privilege('authenticated','sqs_ranked_board(int,text)','execute') u,(select proconfig from pg_proc where oid='sqs_ranked_board(int,text)'::regprocedure) config,(select count(*)::int from pg_proc p cross join lateral aclexplode(p.proacl) x where p.oid='sqs_ranked_board(int,text)'::regprocedure and x.grantee=0 and x.privilege_type='EXECUTE') public")).rows[0];
  assert.deepEqual(privilege,{a:true,u:false,config:['search_path=pg_catalog, public, pg_temp'],public:0});
  await db.exec('set role anon');const publicBoard=await rpc('sqs_ranked_board',{p_week:0});assert.deepEqual(publicBoard,board);
  assert.deepEqual(Object.keys(board.rows[0]).sort(),['adv','at','kills','level','name','runs','t','wallet','won']);
  await assert.rejects(db.query('select * from sqs_ranked_entries'),/permission denied/);
 }finally{await db.close();}
});
