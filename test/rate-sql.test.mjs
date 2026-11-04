import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

test('rate SQL: boundaries, independent keys, migration replay and private helper', { skip: !process.env.SQS_PGLITE }, async () => {
  const { PGlite } = await import(pathToFileURL(process.env.SQS_PGLITE));
  const db = new PGlite();
  try {
    await db.exec('create role anon; create role authenticated;');
    await db.exec(await readFile(new URL('../tools/supabase/schema.sql', import.meta.url), 'utf8'));
    const body = async () => (await db.query("select prosrc from pg_proc where oid='sqs_rate_ok(text,text,integer)'::regprocedure")).rows[0].prosrc;
    const original = await body();
    await db.exec("insert into sqs_rate values ('keep','score',now()-interval '1 day');");
    await db.exec('grant execute on function sqs_rate_ok(text,text,int) to public,anon,authenticated;');
    const migration = await readFile(new URL('../tools/supabase/update12.sql', import.meta.url), 'utf8');
    await db.exec(migration); await db.exec(migration);
    assert.equal(await body(), original, 'fresh install and migration use the same function');
    assert.equal((await db.query('select count(*)::int n from sqs_rate')).rows[0].n, 1, 'migration preserves rows');
    await db.exec('begin;');
    await db.exec("insert into sqs_rate values ('edge','report',now()-interval '60 seconds');");
    const allow = async (ip, kind = 'report', secs = 60) => (await db.query('select sqs_rate_ok($1,$2,$3) ok', [ip, kind, secs])).rows[0].ok;
    assert.equal(await allow('edge'), true, 'exact window boundary is allowed');
    assert.equal(await allow('edge'), false, 'another request in the same transaction is refused');
    assert.equal(await allow('edge', 'score'), true);
    assert.equal(await allow('other'), true);
    assert.equal(await allow('other'), false);
    assert.equal(await allow('keep', 'score'), true, 'expired key is allowed');
    assert.equal(await allow('zero', 'report', 0), true);
    assert.equal(await allow('zero', 'report', 0), true, 'legacy zero interval is unchanged');
    assert.equal(await allow('edge', 'report', null), true, 'legacy null interval is unchanged');
    const grants = (await db.query("select grantee from information_schema.routine_privileges where routine_name='sqs_rate_ok' and grantee in ('PUBLIC','anon','authenticated')")).rows;
    assert.deepEqual(grants, []);
    assert.deepEqual((await db.query("select proconfig from pg_proc where oid='sqs_rate_ok(text,text,integer)'::regprocedure")).rows[0].proconfig, ['search_path=pg_catalog, public, pg_temp']);
    await db.exec('rollback;');
  } finally { await db.close(); }
});

test('rate SQL: concurrent first requests admit one, rollback permits one retry', { skip: !process.env.SQS_PG_SANDBOX }, () => {
  const result = JSON.parse(execFileSync('python3', [fileURLToPath(new URL('../qa-kit/rate-concurrency.py', import.meta.url)), process.env.SQS_PG_SANDBOX], { encoding: 'utf8', timeout: 90000 }));
  assert.equal(result.concurrency.length, 7);
  assert.equal(result.productionWrites, 0);
});
