import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sqlDB} from './helpers/payout-sql-db.mjs';
test('public board exposes only confirmed same-race rollover and retains private tables/grants', {skip:!process.env.SQS_PGLITE},async()=>{
  const pg=await sqlDB();
  try {
    for(const name of ['update2','update3','update5','update7','update8','update9','update10']) await pg.db.exec(await readFile(new URL(`../tools/supabase/${name}.sql`,import.meta.url),'utf8'));
    const migration=await readFile(new URL('../tools/supabase/update11.sql',import.meta.url),'utf8');
    await pg.db.exec(migration);await pg.db.exec(migration);
    const board=(week,mode='normal')=>pg.rpc('sqs_ranked_board',{p_week:week,p_mode:mode});
    assert.deepEqual([ (await board(0)).incoming,(await board(0)).incoming_ready],['0',true]);
    assert.deepEqual([ (await board(1,'hard')).incoming,(await board(1,'hard')).incoming_ready],['0',true]);
    assert.deepEqual([ (await board(1)).incoming,(await board(1)).incoming_ready],[null,false]);
    await pg.db.exec("insert into sqs_ranked_payout_weeks(week,mode,paid,house,pool,incoming,rollover,top,pay_at) values (0,'normal',15500000000000000000,1550000000000000000,13950000000000000000,0,1116000000000000000,'[]',now()),(1,'normal',0,0,1116000000000000000,1116000000000000000,1116000000000000001,'[]',now()),(1,'hard',0,0,0,0,7,'[]',now());");
    assert.equal((await board(1)).incoming,'1116000000000000000');
    assert.equal((await board(2)).incoming,'1116000000000000001');
    assert.equal((await board(2,'hard')).incoming,'7');
    assert.equal((await board(3)).incoming_ready,false,'only the immediate preceding week counts');
    const privileges=(await pg.db.query("select has_function_privilege('anon','sqs_ranked_board(integer,text)','execute') a,has_function_privilege('authenticated','sqs_ranked_board(integer,text)','execute') u,has_function_privilege('authenticated','sqs_ranked_finish_v2(text,bigint,text,bigint,text,uuid,text,integer,integer,integer,boolean,text,text)','execute') r,(select count(*)::int from pg_proc p cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) x where p.oid='sqs_ranked_board(integer,text)'::regprocedure and x.grantee=0 and x.privilege_type='EXECUTE') g")).rows[0];
    assert.deepEqual(privileges,{a:true,u:false,r:false,g:0});
    await pg.db.exec('set role anon');
    assert.equal((await board(2)).incoming,'1116000000000000001');
    for(const table of ['sqs_ranked_payout_weeks','sqs_ranked_payouts','sqs_ranked_entries']) await assert.rejects(pg.db.query(`select * from public.${table}`),/permission denied/);
    assert.deepEqual(Object.keys(await board(2)).sort(),['entries','incoming','incoming_ready','mode','paid','rows']);
    await pg.db.exec('reset role');
  } finally {await pg.db.close();}
});
