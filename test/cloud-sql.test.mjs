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

// update8.sql C (security pass 3): saves of at most 24000 octets, and new wallets stop at a ceiling on the table's disk size
// (1 GB live; here 3 MB, so the test can fill it), while wallets that already have a save keep saving
test('cloud save SQL, update 8: 24000-octet saves, a disk-size ceiling for new wallets, one new wallet per IP per 10 minutes', { skip: !enabled }, async () => {
  const { PGlite } = await import(pathToFileURL(process.env.SQS_PGLITE));
  const db = new PGlite();
  const sql = (f) => readFile(new URL(`../tools/supabase/${f}`, import.meta.url), 'utf8');
  try {
    await db.exec('create role anon; create role authenticated;');
    for (const f of ['schema.sql', 'ranked.sql', 'payouts.sql', 'update4.sql', 'update6.sql', 'update7.sql']) await db.exec(await sql(f));
    const eight = await sql('update8.sql');
    const CEIL = "pg_total_relation_size('public.sqs_saves') > 1000000000";
    assert.equal(eight.split(CEIL).length, 3, 'two ceiling checks to scale down: new wallets, and saves that grow');
    const small = eight.replaceAll(CEIL, "pg_total_relation_size('public.sqs_saves') > 3000000");
    await db.exec(small); await db.exec(small); // safe to paste again
    await db.exec("update sqs_admin set v = encode(sha256(convert_to('server-key', 'UTF8')), 'hex') where k = 'server_key_sha256';");
    const call = async (fn, args) => (await db.query(`select ${fn}(${Object.keys(args).map((k, i) => `${k} => $${i + 1}`).join(',')}) as r`, Object.values(args))).rows[0].r;
    const wallet = (n) => '0x' + n.toString(16).padStart(40, '0');
    const put = (w, data, rev = 0, ip = 'ip-' + w) => call('sqs_save_put', { p_server_key: 'server-key', p_wallet: w, p_data: JSON.stringify(data), p_rev: rev, p_ip: ip });
    const unrate = () => db.exec("update sqs_rate set at = now() - interval '1 hour'");
    // a save of exactly n octets as the database stores it
    const octets = async (data) => (await db.query('select octet_length($1::jsonb::text) as n', [JSON.stringify(data)])).rows[0].n;
    const sized = async (n) => { const d = { 'sq-coins': 'x'.repeat(n) }; d['sq-coins'] = 'x'.repeat(n - (await octets(d) - n)); assert.equal(await octets(d), n); return d; };
    const W = wallet(1);
    assert.deepEqual(await put(W, await sized(24001)), { error: 'that save is too big' });
    assert.deepEqual(await put(W, await sized(23999)), { ok: true, rev: 1 });
    await unrate(); assert.deepEqual(await put(W, await sized(24000), 1), { ok: true, rev: 2 }, '24000 octets is the limit');
    await unrate(); assert.deepEqual(await put(W, await sized(24001), 2), { error: 'that save is too big' }, 'an existing wallet too');
    // one IP: one new wallet per 10 minutes
    assert.deepEqual(await put(wallet(2), { 'sq-coins': '1' }, 0, 'ip-same'), { ok: true, rev: 1 });
    await db.exec("delete from sqs_rate where ip not like 'new:%'");
    assert.deepEqual(await put(wallet(3), { 'sq-coins': '1' }, 0, 'ip-same'), { error: 'slow down' });
    // fill the table past its (test) ceiling with saves that do not compress
    const size = async () => Number((await db.query("select pg_total_relation_size('public.sqs_saves') as n")).rows[0].n);
    await db.exec(`insert into sqs_saves (wallet, data, rev) select '0x' || lpad(to_hex(1000 + g), 40, '0'), jsonb_build_object('sq-coins', (select string_agg(md5(random()::text || g || i), '') from generate_series(1, 300) i)), 1 from generate_series(1, 800) g`);
    assert.ok(await size() > 3000000, 'past the ceiling: ' + await size());
    assert.deepEqual(await put(wallet(4), { 'sq-coins': '1' }), { error: 'cloud saves are full' }, 'a new wallet');
    await unrate(); assert.deepEqual(await put(W, { 'sq-coins': '2' }, 2), { ok: true, rev: 3 }, 'an existing wallet keeps saving');
    await unrate(); assert.deepEqual(await put(wallet(2), { 'sq-coins': '2' }, 1, 'ip-same'), { ok: true, rev: 2 });
    // past the ceiling an existing save may not grow (tiny saves made early, grown later, would get round the ceiling)
    await unrate(); assert.deepEqual(await put(wallet(2), await sized(5000), 2, 'ip-same'), { error: 'cloud saves are full' }, 'no growing past the ceiling');
    await unrate(); assert.deepEqual(await put(W, { 'sq-coins': '3' }, 3), { ok: true, rev: 4 }, 'the same size or smaller still saves');
  } finally { await db.close(); }
});
