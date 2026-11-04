import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

test('ranked recovery SQL binds starts/logs, leases workers and atomically caches results', { skip: !process.env.SQS_PGLITE }, async t => {
  const { PGlite } = await import(pathToFileURL(process.env.SQS_PGLITE));
  const db = new PGlite();
  try {
    await db.exec('create role anon; create role authenticated;');
    for (const f of ['schema.sql','update2.sql','update3.sql','ranked.sql','payouts.sql','update4.sql','update5.sql','update6.sql','update7.sql','update8.sql','update9.sql'])
      await db.exec(await readFile(new URL('../tools/supabase/' + f, import.meta.url), 'utf8'));
    await db.exec('alter default privileges grant execute on functions to authenticated;');
    const migration = await readFile(new URL('../tools/supabase/update10.sql', import.meta.url), 'utf8');
    await db.exec(migration); await db.exec(migration);
    await db.exec("update sqs_admin set v=encode(sha256(convert_to('server-key','UTF8')),'hex') where k='server_key_sha256';");
    const call = async (fn, p) => (await db.query(`select ${fn}(${Object.keys(p).map((k,i) => `${k}=>$${i+1}`).join(',')}) r`, Object.values(p))).rows[0].r;
    const wallet = '0x'+'1'.repeat(40), sha = 'a'.repeat(64), attempt = '00000000-0000-4000-8000-000000000001', second = '00000000-0000-4000-8000-000000000002';
    await db.exec(`insert into sqs_ranked_entries (week,wallet,tx,paid,ip_hash,seed,started_at,adv) values (0,'${wallet}','0x${'1'.repeat(64)}',500000000000000000,'ip',1,'2026-11-03T12:00:00.1236Z','adventurer')`);
    const started = Number((await db.query('select (extract(epoch from started_at)*1000)::bigint s from sqs_ranked_entries where id=1')).rows[0].s);
    const id = { p_server_key:'server-key',p_id:1,p_wallet:wallet,p_started:started,p_log_sha:sha,p_attempt:attempt };
    const claim = p => call('sqs_ranked_claim_v2',{ ...id,p_allow_claim:true,...p });
    const release = p => call('sqs_ranked_release_v2',{...id,...p});
    const finish = p => call('sqs_ranked_finish_v2',{...id,p_name:'Tester',p_t:200,p_kills:42,p_level:5,p_won:false,p_verdict:'ok',p_log:'compressed',...p});
    await t.test('receipt gate limits a connection before chain requests, then admits a retry',async()=>{
      const p={p_server_key:'server-key',p_ip_hash:'a'.repeat(32)};
      assert.deepEqual(await call('sqs_ranked_receipt_gate',{...p,p_server_key:null}),{error:'forbidden'});
      assert.deepEqual(await call('sqs_ranked_receipt_gate',{...p,p_ip_hash:null}),{error:'bad connection'});
      assert.deepEqual(await call('sqs_ranked_receipt_gate',p),{ok:true});
      assert.deepEqual(await call('sqs_ranked_receipt_gate',p),{error:'slow down'});
      await db.exec("update sqs_rate set at=now()-interval '3 seconds' where kind='ranked-receipt'");
      assert.deepEqual(await call('sqs_ranked_receipt_gate',p),{ok:true});
    });
    await t.test('wrong start, wallet, key, missing hash/attempt and late first submissions never consume a run', async () => {
      for (const p of [{p_started:started-1},{p_started:null},{p_wallet:'0x'+'2'.repeat(40)},{p_log_sha:null},{p_log_sha:'x'},{p_attempt:null},{p_allow_claim:false}])
        assert.ok((await claim(p)).error, JSON.stringify(p));
      assert.deepEqual(await claim({p_server_key:'wrong'}),{error:'forbidden'});
      assert.equal((await db.query('select claimed_at from sqs_ranked_entries where id=1')).rows[0].claimed_at,null);
      const first = await claim({}); assert.equal(first.ok,true); assert.ok(first.received>0);
    });
    await t.test('active lease is busy; only same hash recovers; wrong worker cannot release or finish', async () => {
      assert.equal((await claim({p_attempt:second})).busy,true);
      assert.ok((await claim({p_log_sha:'b'.repeat(64)})).error);
      await release({p_attempt:second});
      assert.equal((await claim({p_attempt:second})).busy,true);
      assert.ok((await finish({p_attempt:second})).error);
      await release({});
      assert.ok((await claim({p_log_sha:'b'.repeat(64)})).error);
      assert.equal((await claim({p_attempt:second,p_allow_claim:false})).ok,true,'an admitted log can recover after its send window');
      assert.ok((await finish({})).error,'old worker cannot finish after lease handoff');
      await release({});
      assert.equal((await claim({p_attempt:attempt})).busy,true,'old release cannot unlock the new worker');
      await db.exec("update sqs_ranked_entries set submit_until=now()-interval '1 second' where id=1");
      assert.equal((await claim({})).ok,true,'worker death recovers after lease expiry');
    });
    await t.test('score and receipt cache commit together; retries never rewrite the score or finish time', async () => {
      await db.exec("create function fail_receipt() returns trigger language plpgsql as $$ begin if new.submit_result is not null then raise exception 'fixture receipt failure'; end if; return new; end $$; create trigger fail_receipt before update on sqs_ranked_entries for each row execute function fail_receipt();");
      await assert.rejects(finish({}),/fixture receipt failure/);
      assert.equal((await db.query('select finished_at from sqs_ranked_entries where id=1')).rows[0].finished_at,null);
      await db.exec('drop trigger fail_receipt on sqs_ranked_entries; drop function fail_receipt();');
      const result = await finish({}); assert.equal(result.t,200); assert.equal(result.rank,1);
      const at = (await db.query('select finished_at from sqs_ranked_entries where id=1')).rows[0].finished_at;
      assert.deepEqual((await claim({p_attempt:second,p_allow_claim:false})).result,result);
      assert.deepEqual(await finish({p_t:9999}),result);
      assert.deepEqual((await db.query('select finished_at,t from sqs_ranked_entries where id=1')).rows[0],{finished_at:at,t:200});
      assert.ok((await claim({p_started:started+1})).error);
      assert.ok((await claim({p_log_sha:'b'.repeat(64)})).error);
    });
    await t.test('an old in-flight worker can finish, but v2 never guesses its unknown log hash',async()=>{
      await db.exec(`insert into sqs_ranked_entries (week,wallet,tx,paid,ip_hash,seed,started_at,adv) values (0,'${wallet}','0x${'2'.repeat(64)}',500000000000000000,'ip',1,now(),'adventurer')`);
      const row=(await db.query('select id,(extract(epoch from started_at)*1000)::bigint started from sqs_ranked_entries where id=2')).rows[0];
      const legacy={p_server_key:'server-key',p_id:2,p_wallet:wallet};
      assert.equal((await call('sqs_ranked_claim',legacy)).ok,true);
      assert.match((await claim({p_id:2,p_started:Number(row.started)})).error,/older submission/);
      assert.equal((await call('sqs_ranked_finish',{p_server_key:'server-key',p_id:2,p_name:'Legacy',p_t:100,p_kills:5,p_level:2,p_won:false,p_verdict:'ok',p_log_sha:sha,p_log:'compressed'})).ok,true);
      assert.equal((await db.query('select submit_sha,submit_result from sqs_ranked_entries where id=2')).rows[0].submit_result,null);
    });
    await t.test('settled prizes cannot gain a late score, but completed receipts remain readable',async()=>{
      await db.exec(`insert into sqs_ranked_entries (week,wallet,tx,paid,ip_hash,seed,started_at,adv) values (0,'${wallet}','0x${'3'.repeat(64)}',500000000000000000,'ip',1,now(),'adventurer')`);
      const started3=Number((await db.query('select (extract(epoch from started_at)*1000)::bigint s from sqs_ranked_entries where id=3')).rows[0].s);
      const p={p_id:3,p_started:started3};
      assert.equal((await claim(p)).ok,true);
      await db.exec("insert into sqs_ranked_payout_weeks (week,mode,paid,house,pool,incoming,rollover,top,pay_at) values (0,'normal',0,0,0,0,0,'[]',now())");
      await release(p);
      assert.match((await claim(p)).error,/already settled/);
      assert.match((await finish(p)).error,/already settled/);
      assert.equal((await db.query('select finished_at from sqs_ranked_entries where id=3')).rows[0].finished_at,null);
      assert.ok((await claim({p_allow_claim:false})).result,'cached acceptance does not alter the settled board');
    });
    await t.test('default grants, private columns and server key guards remain closed', async () => {
      assert.equal((await db.query("select count(*)::int n from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and (p.proname like 'sqs_ranked_%v2' or p.proname='sqs_ranked_receipt_gate') and has_function_privilege('authenticated',p.oid,'execute')")).rows[0].n,0);
      await db.exec('set role anon;');
      await assert.rejects(db.query('select submit_result from sqs_ranked_entries'),/permission denied/);
      assert.deepEqual(await claim({p_server_key:null}),{error:'forbidden'});
      assert.deepEqual(await release({p_server_key:null}),{error:'forbidden'});
      assert.deepEqual(await finish({p_server_key:null}),{error:'forbidden'});
      await db.exec('reset role;');
    });
  } finally { await db.close(); }
});
