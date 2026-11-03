import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

test('casual best per name: deduplicate before limit, return best place, retain ties and permissions', { skip: !process.env.SQS_PGLITE }, async () => {
  const { PGlite } = await import(pathToFileURL(process.env.SQS_PGLITE));
  const db = new PGlite();
  const sql = f => readFile(new URL(`../tools/supabase/${f}.sql`, import.meta.url), 'utf8');
  try {
    await db.exec('create role anon; create role authenticated;');
    for (const f of ['schema', 'update2', 'update3', 'ranked', 'payouts', 'update4', 'update5', 'update6', 'update7', 'update8']) await db.exec(await sql(f));
    // Match Supabase's default execute grants: recreating a signature must remove authenticated explicitly.
    await db.exec('alter default privileges grant execute on functions to authenticated; grant execute on function sqs_ranked_restart(text,bigint,text,bigint,text,bigint) to authenticated;');
    await db.exec("update sqs_admin set v=encode(sha256(convert_to('server-key','UTF8')),'hex') where k='server_key_sha256'");
    let n = 0;
    const submit = async (name, kills, endless = false) => (await db.query(`select sqs_submit_score($1,'greentown',$2,900,$3,30,'ranger',$4,false,$5,'server-key',false,$6) as r`, ['ip'+ ++n, name, kills, !endless, 'ticket'+n, endless])).rows[0].r;
    const board = async (endless = false) => (await db.query('select * from sqs_top($1,$2)', ['greentown', endless])).rows;
    await submit('Alice', 100);
    await submit('ALICE', 200);
    await submit('Bob', 150);
    const before = (await db.query('select count(*)::int n from sqs_scores')).rows[0].n;
    const nine = await sql('update9'); await db.exec(nine); await db.exec(nine);
    assert.equal((await db.query('select count(*)::int n from sqs_scores')).rows[0].n, before, 'migration preserves history');
    assert.deepEqual((await board()).map(r => [r.name,r.kills]), [['ALICE',200],['Bob',150]]);
    assert.deepEqual(await submit(' alice ', 50), { ok: true, rank: 1 }, 'worse run returns the name best place');
    assert.deepEqual(await submit('Carol', 200), { ok: true, rank: 2 }, 'old equal score stays ahead');
    assert.deepEqual(await submit('alice', 200), { ok: true, rank: 1 }, 'equal retry keeps original name best');
    assert.deepEqual((await board()).map(r => r.name), ['ALICE','Carol','Bob']);
    await submit('Alice', 300, true);
    assert.deepEqual((await board(true)).map(r => [r.name,r.kills]), [['Alice',300]], 'endless remains separate');
    // Equal timestamps are resolved by id, including when both rows are the same name.
    await db.exec("update sqs_scores set at='2026-11-01T00:00:00Z' where kills=200");
    assert.deepEqual((await board()).map(r => r.name), ['ALICE','Carol','Bob']);
    // More than 25 duplicate rows must not crowd a different name out of the top 25.
    for (let j = 0; j < 28; j++) await submit('Alice', 200+j);
    assert.deepEqual((await board()).map(r => r.name.toLowerCase()), ['alice','carol','bob']);
    assert.deepEqual(await submit('Bob', 10), { ok: true, rank: 3 });
    for (let j = 0; j < 26; j++) await submit('Player'+j, 140-j);
    assert.equal((await board()).length, 25);
    assert.deepEqual(await submit('Outside', 1), { ok: true, rank: 30 });
    await db.exec("insert into sqs_scores(map,name,t,kills,level,adv,won,hard,score,ticket,holder,endless) select 'greentown','ALICE',900,1000+i,30,'ranger',true,false,100900001000+i,'stress'||i,false,false from generate_series(1,220) i");
    assert.deepEqual(await submit('Bob', 10), { ok: true, rank: 3 }, 'repeated high runs cannot evict other names');
    assert.deepEqual((await board()).slice(0,3).map(r => r.name.toLowerCase()), ['alice','carol','bob']);
    assert.ok((await db.query("select count(*)::int n from sqs_scores where not endless")).rows[0].n <= 400);
    const can = async (role, fn) => (await db.query('select has_function_privilege($1,$2,\'execute\') as ok', [role,fn])).rows[0].ok;
    for (const fn of ['sqs_top(text,boolean)','sqs_submit_score(text,text,text,integer,integer,integer,text,boolean,boolean,text,text,boolean,boolean)','sqs_ranked_restart(text,bigint,text,bigint,text,bigint)']) {
      assert.equal(await can('anon',fn), true);
      assert.equal(await can('authenticated',fn), false, fn);
    }
    assert.equal(await can('anon','sqs_casual_best(text,boolean)'), false, 'helper does not expose private row columns');
    assert.equal(await can('authenticated','sqs_casual_best(text,boolean)'), false);
    await db.exec('set role anon');
    await assert.rejects(db.query('select * from sqs_scores'), /permission denied/);
    await assert.rejects(db.query("select * from sqs_casual_best('greentown',false)"), /permission denied/);
    assert.equal((await board()).length, 25);
  } finally { await db.close(); }
});
