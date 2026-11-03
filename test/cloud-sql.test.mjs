import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// tools/supabase/update4.sql on a real PostgreSQL (PGlite, installed outside the repo: SQS_PGLITE=.../pglite/dist/index.js)
const enabled = !!process.env.SQS_PGLITE;
test('cloud save SQL: revisions, conflicts, limits, keys and permissions', { skip: !enabled }, async () => {
  const { PGlite } = await import(pathToFileURL(process.env.SQS_PGLITE));
  const db = new PGlite();
  try {
    await db.exec('create role anon; create role authenticated;');
    await db.exec(await readFile(new URL('../tools/supabase/schema.sql', import.meta.url), 'utf8'));
    const sql = await readFile(new URL('../tools/supabase/update4.sql', import.meta.url), 'utf8');
    await db.exec(sql); await db.exec(sql); // safe to paste again
    await db.exec("update sqs_admin set v = encode(sha256(convert_to('server-key', 'UTF8')), 'hex') where k = 'server_key_sha256';");
    const call = async (fn, args) => (await db.query(`select ${fn}(${Object.keys(args).map((k, i) => `${k} => $${i + 1}`).join(',')}) as r`, Object.values(args))).rows[0].r;
    const W = '0x' + 'ab'.repeat(20), get = (w = W, key = 'server-key') => call('sqs_save_get', { p_server_key: key, p_wallet: w });
    const put = (rev, data, w = W, key = 'server-key') => call('sqs_save_put', { p_server_key: key, p_wallet: w, p_data: JSON.stringify(data), p_rev: rev });
    const wait = () => db.exec("update sqs_rate set at = now() - interval '1 minute'"); // past the two-second save limit

    assert.deepEqual(await get(), { rev: 0 });
    assert.deepEqual(await get(W, 'wrong'), { error: 'forbidden' });
    assert.deepEqual(await put(0, { 'sq-coins': '1' }, W, 'wrong'), { error: 'forbidden' });
    assert.deepEqual(await put(3, { 'sq-coins': '1' }), { conflict: true, rev: 0 }, 'a save on top of one that does not exist');
    await wait(); assert.deepEqual(await put(0, { 'sq-coins': '500' }), { ok: true, rev: 1 });
    assert.deepEqual(await put(1, { 'sq-coins': '501' }), { error: 'slow down' });
    await wait(); const c = await put(0, { 'sq-coins': '9' });
    assert.deepEqual([c.conflict, c.rev, c.data], [true, 1, { 'sq-coins': '500' }]); assert.ok(c.at > 0);
    await wait(); assert.deepEqual(await put(1, { 'sq-coins': '650' }), { ok: true, rev: 2 });
    const g = await get(W.toUpperCase().replace('0X', '0x')); assert.deepEqual([g.rev, g.data], [2, { 'sq-coins': '650' }], 'any letter case of the wallet');
    await wait(); assert.deepEqual(await put(2, { big: 'x'.repeat(130000) }), { error: 'that save is too big' });
    for (const [w, data, rev] of [['nope', {}, 0], [W, [1], 2], [W, '"x"', 2], [W, {}, -1]]) {
      await wait(); assert.deepEqual(await call('sqs_save_put', { p_server_key: 'server-key', p_wallet: w, p_data: typeof data === 'string' ? data : JSON.stringify(data), p_rev: rev }), { error: 'bad save' });
    }
    // only the game server's key gets in: the table itself is closed to the public roles
    const grants = (await db.query("select grantee, privilege_type from information_schema.role_table_grants where table_name = 'sqs_saves' and grantee in ('anon', 'authenticated', 'PUBLIC')")).rows;
    assert.deepEqual(grants, []);
    const rls = (await db.query("select relrowsecurity from pg_class where relname = 'sqs_saves'")).rows[0].relrowsecurity;
    assert.equal(rls, true);
  } finally { await db.close(); }
});
