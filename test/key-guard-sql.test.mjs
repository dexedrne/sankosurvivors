import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const enabled=!!process.env.SQS_PGLITE,sql=name=>readFile(new URL(`../tools/supabase/${name}.sql`,import.meta.url),'utf8');
async function fresh(){const {PGlite}=await import(pathToFileURL(process.env.SQS_PGLITE));const db=new PGlite();await db.exec('create role anon; create role authenticated;');await db.exec(await sql('schema'));return db;}
test('fresh schema key guard returns false when configured key row is absent', {skip:!enabled},async()=>{
 const db=await fresh();try{
  await db.exec("delete from public.sqs_admin where k='server_key_sha256'");
  assert.equal((await db.query("select public.sqs_key_ok('server_key_sha256','fixture-guess') ok")).rows[0].ok,false);
 }finally{await db.close();}
});
test('missing configured key cannot admit the legacy report caller or create report/rate rows', {skip:!enabled},async()=>{
 const db=await fresh();try{
  await db.exec("delete from public.sqs_admin where k='server_key_sha256'; set role anon;");
  const result=(await db.query("select public.sqs_submit_report('fixture-ip','{\"text\":\"fixture unauthorized report\"}'::jsonb,'fixture-guess') r")).rows[0].r;
  assert.deepEqual(result,{error:'forbidden'});await db.exec('reset role;');
  assert.equal((await db.query('select count(*)::int n from public.sqs_reports')).rows[0].n,0);assert.equal((await db.query('select count(*)::int n from public.sqs_rate')).rows[0].n,0);
 }finally{await db.close();}
});
test('reapplying schema preserves already configured key hashes', {skip:!enabled},async()=>{
 const db=await fresh();try{
  await db.exec("update public.sqs_admin set v=encode(sha256(convert_to('fixture-preserved-key','UTF8')),'hex')");
  const before=(await db.query('select k,v from public.sqs_admin order by k')).rows;await db.exec(await sql('schema'));
  assert.deepEqual((await db.query('select k,v from public.sqs_admin order by k')).rows,before);
 }finally{await db.close();}
});
test('fixed helper accepts only the configured fixture key and ignores temporary admin shadowing', {skip:!enabled},async()=>{
 const db=await fresh();try{
  await db.exec("update public.sqs_admin set v=encode(sha256(convert_to('fixture-server-key','UTF8')),'hex') where k='server_key_sha256'");
  const check=async(name,key)=>(await db.query('select public.sqs_key_ok($1,$2) ok',[name,key])).rows[0].ok;
  assert.equal(await check('server_key_sha256','fixture-server-key'),true);
  await db.exec("insert into public.sqs_admin values ('server_key_sha256:next',encode(sha256(convert_to('fixture-next-key','UTF8')),'hex'))");
  assert.equal(await check('server_key_sha256','fixture-next-key'),true);
  await db.exec("delete from public.sqs_admin where k='server_key_sha256'");assert.equal(await check('server_key_sha256','fixture-next-key'),true);
  await db.exec("insert into public.sqs_admin values ('server_key_sha256',encode(sha256(convert_to('fixture-server-key','UTF8')),'hex'))");
  for(const [name,key] of [['server_key_sha256','wrong'],['server_key_sha256',''],['server_key_sha256',null],['missing','fixture-server-key'],[null,'fixture-server-key']])assert.equal(await check(name,key),false);
  await db.exec("create temp table sqs_admin(k text primary key,v text);insert into pg_temp.sqs_admin values ('server_key_sha256',encode(sha256(convert_to('fixture-guess','UTF8')),'hex'));");
  assert.equal(await check('server_key_sha256','fixture-guess'),false);assert.equal(await check('server_key_sha256','fixture-server-key'),true);
  await db.exec('set role anon;');await assert.rejects(db.query("select public.sqs_key_ok('server_key_sha256','fixture-server-key')"),/permission denied/);
 }finally{await db.close();}
});
test('owner update13 hardens the live-shaped rotation helper, preserves rows and bundles exact updates11/12', {skip:!enabled},async()=>{
 const db=await fresh();try{
  for(const name of ['ranked','payouts','update2','update3','update4','update5','update6','update7','update8','update9','update10'])await db.exec(await sql(name));
  assert.equal((await db.query("select md5(prosrc) h from pg_proc where oid='public.sqs_mod_delete(text,bigint)'::regprocedure")).rows[0].h,'7967d23d428e325bb7362a4042201ffd');
  await db.exec(`create or replace function public.sqs_key_ok(p_name text,p_key text)
returns boolean language sql stable security definer set search_path=public as $$
  select coalesce(p_key is not null and encode(sha256(convert_to(p_key, 'UTF8')), 'hex') in
    (select a.v from sqs_admin a where a.k = p_name or a.k = p_name || ':next'), false)
$$;`);
  assert.equal((await db.query("select md5(prosrc) h from pg_proc where oid='public.sqs_key_ok(text,text)'::regprocedure")).rows[0].h,'643fe8a8ed8a64fc7cf5f10941614aec');
  await db.exec("grant execute on function public.sqs_key_ok(text,text) to public,anon,authenticated;grant execute on function public.sqs_rate_ok(text,text,int) to public,anon,authenticated;grant execute on function public.sqs_ranked_board(int,text) to public,authenticated;");
  await db.exec("update public.sqs_admin set v=encode(sha256(convert_to('fixture-preserved','UTF8')),'hex');insert into public.sqs_reports(text) values ('fixture kept');insert into public.sqs_rate values ('fixture-keep','report',now()-interval '1 day');insert into public.sqs_saves(wallet,data,rev) values ('0x1111111111111111111111111111111111111111','{\"sq-coins\":\"250\"}',1);insert into public.sqs_ranked_entries(week,wallet,tx,paid,ip_hash,seed) values (0,'0x1111111111111111111111111111111111111111','0x' || repeat('1',64),500000000000000000,'fixture',1);");
  await db.exec("insert into public.sqs_scores(map,name,t,kills,level,adv,score,ticket) values ('greentown','Fixture',60,1,1,'adventurer',60000000,'fixture-ticket');insert into public.sqs_admin values ('server_key_sha256:next',encode(sha256(convert_to('fixture-next-preserved','UTF8')),'hex'))");
  const tables=['sqs_admin','sqs_scores','sqs_reports','sqs_rate','sqs_saves','sqs_ranked_entries'],snapshot=async()=>Promise.all(tables.map(async table=>(await db.query(`select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) rows from public.${table} t`)).rows[0].rows));
  const before=await snapshot(),migration=await sql('update13');await db.exec(migration);await db.exec(migration);assert.deepEqual(await snapshot(),before);
  const meta=async()=>(await db.query("select proname,md5(prosrc) body,proconfig from pg_proc where oid in ('public.sqs_key_ok(text,text)'::regprocedure,'public.sqs_rate_ok(text,text,int)'::regprocedure,'public.sqs_ranked_board(int,text)'::regprocedure) order by proname")).rows;
  const bundled=await meta();for(const f of bundled)assert.deepEqual(f.proconfig,['search_path=pg_catalog, public, pg_temp']);
  await db.exec(await sql('update11'));await db.exec(await sql('update12'));assert.deepEqual(await meta(),bundled,'bundle uses the exact separately prepared board and rate definitions');
  await db.exec(await sql('update6'));assert.deepEqual((await meta()).find(f=>f.proname==='sqs_key_ok'),bundled.find(f=>f.proname==='sqs_key_ok'),'ordinary security rollout cannot restore the weaker helper');await db.exec(migration);
  assert.deepEqual((await db.query("select grantee,routine_name from information_schema.routine_privileges where routine_name in ('sqs_key_ok','sqs_rate_ok') and grantee in ('PUBLIC','anon','authenticated')")).rows,[]);
  const boardGrant=(await db.query("select has_function_privilege('anon','public.sqs_ranked_board(int,text)','EXECUTE') a,has_function_privilege('authenticated','public.sqs_ranked_board(int,text)','EXECUTE') u")).rows[0];assert.deepEqual(boardGrant,{a:true,u:false});
  const board=async(w,m='normal')=>(await db.query('select public.sqs_ranked_board($1,$2) r',[w,m])).rows[0].r;
  assert.deepEqual([(await board(0)).incoming,(await board(0)).incoming_ready],['0',true]);assert.deepEqual([(await board(1,'hard')).incoming,(await board(1,'hard')).incoming_ready],['0',true]);assert.deepEqual([(await board(1)).incoming,(await board(1)).incoming_ready],[null,false]);
  await db.exec("begin;");assert.equal((await db.query("select public.sqs_rate_ok('fixture-new','report',60) ok")).rows[0].ok,true);assert.equal((await db.query("select public.sqs_rate_ok('fixture-new','report',60) ok")).rows[0].ok,false);await db.exec('rollback;');
  await db.exec("delete from public.sqs_admin where k='server_key_sha256';create temp table sqs_admin(k text,v text);insert into pg_temp.sqs_admin values ('server_key_sha256',encode(sha256(convert_to('fixture-guess','UTF8')),'hex'));set role anon;");
  assert.deepEqual((await db.query("select public.sqs_submit_report('fixture-new-ip','{\"text\":\"fixture unauthorized\"}'::jsonb,'fixture-guess') r")).rows[0].r,{error:'forbidden'});
  await db.exec("reset role;delete from public.sqs_admin where k='reports_key_sha256';set role anon;");await db.query("select public.sqs_mod_delete('fixture-guess',1)");await db.exec('reset role;');assert.equal((await db.query("select count(*)::int n from public.sqs_scores where ticket='fixture-ticket'")).rows[0].n,1);
 }finally{await db.close();}
});
