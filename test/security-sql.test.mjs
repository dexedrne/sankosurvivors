import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// update6.sql, update7.sql and update8.sql (security passes, 3 Nov) on a real PostgreSQL, loaded the way the live database was built
const enabled = !!process.env.SQS_PGLITE;
const sql = (f) => readFile(new URL(`../tools/supabase/${f}`, import.meta.url), 'utf8');
test('security SQL: keys fail closed, refunds owed are real, settled weeks cannot be voided, saves are bounded', { skip: !enabled }, async () => {
  const { PGlite } = await import(pathToFileURL(process.env.SQS_PGLITE));
  const db = new PGlite();
  try {
    await db.exec('create role anon; create role authenticated;');
    for (const f of ['schema.sql', 'ranked.sql', 'payouts.sql', 'update4.sql']) await db.exec(await sql(f));
    const six = await sql('update6.sql'); await db.exec(six); await db.exec(six); // safe to paste again
    const seven = await sql('update7.sql'); await db.exec(seven); await db.exec(seven);
    const eight = await sql('update8.sql'); await db.exec(eight); await db.exec(eight); // safe to paste again
    await db.exec("update sqs_admin set v = encode(sha256(convert_to('server-key', 'UTF8')), 'hex') where k = 'server_key_sha256';");
    const call = async (fn, args) => (await db.query(`select ${fn}(${Object.keys(args).map((k, i) => `${k} => $${i + 1}`).join(',')}) as r`, Object.values(args))).rows[0].r;
    const W = '0x' + 'ab'.repeat(20), tx = (n) => '0x' + n.toString(16).padStart(64, '0');
    const cur = Math.floor((Date.now() - Date.UTC(2026, 10, 2)) / 604800000);
    const unrate = () => db.exec("update sqs_rate set at = now() - interval '1 hour'");

    // 2: a refund owed must be a real payment for this week or the last (update 8: a whole number of base units, any size)
    const owe = (o) => call('sqs_ranked_owe', { p_server_key: 'server-key', p_tx: tx(1), p_wallet: W, p_week: cur, p_paid: '500000000000000000', p_reason: 'late', p_mode: 'normal', ...o });
    for (const bad of [{ p_paid: '0' }, { p_paid: '-1' }, { p_paid: '0.5' }, { p_paid: (2n ** 256n).toString() }, { p_week: cur + 1 }, { p_week: cur + 30 }, { p_week: -1 }])
      assert.deepEqual(await owe({ ...bad, p_tx: tx(9) }), { error: 'bad entry' }, JSON.stringify(bad));
    assert.deepEqual(await owe({}), { ok: true, review: false });
    assert.deepEqual(await owe({}), { ok: true, review: false }, 'a retry');
    assert.deepEqual(await owe({ p_server_key: 'wrong', p_tx: tx(2) }), { error: 'forbidden' });

    // 3: a started run can be voided in its week, never once the week is settled or over
    const entryAt = async (n, week) => { await db.exec(`insert into sqs_ranked_entries (week, wallet, tx, paid, ip_hash, seed, mode, started_at) values (${week}, '${W}', '${tx(n)}', 500000000000000000, 'ip', 1, 'normal', now())`);
      return Number((await db.query(`select id from sqs_ranked_entries where tx = '${tx(n)}'`)).rows[0].id); };
    const voidRun = (id) => call('sqs_ranked_void', { p_server_key: 'server-key', p_id: id, p_wallet: W, p_reason: 'game updated' });
    assert.deepEqual(await voidRun(await entryAt(10, cur)), { ok: true });
    assert.match((await voidRun(await entryAt(11, cur - 2))).error, /week is over/);
    await db.exec(`insert into sqs_ranked_payout_weeks (week, mode) values (${cur}, 'normal') on conflict do nothing`).catch(() => {});
    const settled = (await db.query(`select count(*)::int n from sqs_ranked_payout_weeks where week = ${cur}`)).rows[0].n;
    if (settled) assert.match((await voidRun(await entryAt(12, cur))).error, /week is over/, 'settled this week');

    // update 7: a started run restarts (new seed, not started) up to 3 times, never once the week is over; active runs counted
    await db.exec("update sqs_admin set v = encode(sha256(convert_to('reports-key', 'UTF8')), 'hex') where k = 'reports_key_sha256';");
    const restart = (id) => call('sqs_ranked_restart', { p_server_key: 'server-key', p_id: id, p_wallet: W, p_seed: 777, p_reason: 'game updated' });
    const live = await entryAt(20, cur);
    assert.equal((await call('sqs_ranked_active', { p_key: 'reports-key' })).active >= 1, true);
    assert.deepEqual((await call('sqs_ranked_active', { p_key: 'wrong' })), { error: 'forbidden' });
    for (let i = 0; i < 3; i++) { assert.equal((await restart(live)).ok, true); await db.exec(`update sqs_ranked_entries set started_at = now() where id = ${live}`); }
    assert.match((await restart(live)).error, /restarted 3 times/);
    const row = (await db.query(`select seed, restarts from sqs_ranked_entries where id = ${live}`)).rows[0];
    assert.equal(Number(row.seed), 777); assert.equal(row.restarts, 3);
    assert.match((await restart(await entryAt(21, cur - 2))).error, /week is over/);

    // update 8 A: a restart is bound to the entry's current start (p_started); null (the API before update 8) still works
    const startedOf = async (id) => (await db.query(`select (extract(epoch from started_at) * 1000)::bigint::text s from sqs_ranked_entries where id = ${id}`)).rows[0].s;
    const restartAt = (id, started) => call('sqs_ranked_restart', { p_server_key: 'server-key', p_id: id, p_wallet: W, p_seed: 778, p_reason: 'game updated', p_started: started });
    const bound = await entryAt(22, cur), s0 = await startedOf(bound);
    assert.deepEqual(await restartAt(bound, String(BigInt(s0) - 60000n)), { error: 'that run was already sent' }, 'an older start of the same entry');
    assert.deepEqual(await restartAt(bound, String(BigInt(s0) + 1n)), { error: 'that run was already sent' });
    assert.equal((await db.query(`select restarts from sqs_ranked_entries where id = ${bound}`)).rows[0].restarts, 0, 'untouched');
    assert.equal((await restartAt(bound, s0)).ok, true, 'its own start');
    await db.exec(`update sqs_ranked_entries set started_at = now() + interval '1 second' where id = ${bound}`);
    assert.deepEqual(await restartAt(bound, s0), { error: 'that run was already sent' }, 'the old token cannot restart the newer run');
    assert.equal((await restart(bound)).ok, true, 'without p_started (the live API before update 8)');
    assert.equal((await db.query("select to_regprocedure('public.sqs_ranked_restart(text,bigint,text,bigint,text)') is null as gone")).rows[0].gone, true, 'only one restart function');
    const can = async (role, fn) => (await db.query(`select has_function_privilege('${role}', '${fn}', 'execute') as ok`)).rows[0].ok;
    assert.equal(await can('anon', 'public.sqs_ranked_void(text,bigint,text,text)'), false, 'nothing refunds a run any more');
    assert.equal(await can('authenticated', 'public.sqs_ranked_void(text,bigint,text,text)'), false);
    assert.equal(await can('anon', 'public.sqs_ranked_restart(text,bigint,text,bigint,text,bigint)'), true);
    assert.equal(await can('anon', 'public.sqs_ranked_owe(text,text,text,int,numeric,text,text)'), true);

    // update 8 B: a payment over 100 DMT is recorded for review, and its refund is held (100 DMT exactly is not)
    assert.deepEqual(await owe({ p_tx: tx(30), p_paid: '150000000000000000000' }), { ok: true, review: true });
    assert.deepEqual(await owe({ p_tx: tx(30), p_paid: '150000000000000000000' }), { ok: true, review: true }, 'a retry');
    assert.deepEqual(await owe({ p_tx: tx(31), p_paid: '100000000000000000000' }), { ok: true, review: false });
    await db.exec("update sqs_admin set v = encode(sha256(convert_to('payout-key', 'UTF8')), 'hex') where k = 'payout_key_sha256';");
    assert.deepEqual(await call('sqs_payout_refunds', { p_key: 'wrong' }), { error: 'forbidden' });
    assert.equal((await call('sqs_payout_refunds', { p_key: 'payout-key' })).ok, true);
    const refundOf = async (n) => (await db.query(`select p.id::text, p.status, p.amount::text from sqs_ranked_payouts p join sqs_ranked_entries e on e.id = p.source_entry_id where e.tx = '${tx(n)}'`)).rows[0];
    const held = await refundOf(30);
    assert.deepEqual([held.status, held.amount], ['held', '150000000000000000000']);
    assert.deepEqual([(await refundOf(31)).status, (await refundOf(1)).status], ['planned', 'planned']);
    assert.deepEqual(await call('sqs_payout_refunds', { p_key: 'payout-key' }), { ok: true, added: 0 }, 'once per payment');
    assert.deepEqual(await call('sqs_payout_claim', { p_key: 'payout-key', p_id: held.id, p_pending: '0', p_block: '1' }), { error: 'not claimable' }, 'a held refund is never sent');

    // 1: with the server key's row gone, guarded functions refuse everyone (they used to open)
    const put = (w, data, rev = 0, ip = 'ip-a', key = 'server-key') => call('sqs_save_put', { p_server_key: key, p_wallet: w, p_data: JSON.stringify(data), p_rev: rev, p_ip: ip });
    assert.deepEqual(await put(W, { 'sq-coins': '1' }), { ok: true, rev: 1 });
    assert.deepEqual(await put('0x' + 'cd'.repeat(20), { 'sq-coins': '1' }), { error: 'slow down' }, 'a second new wallet from the same IP within 10 minutes');
    await db.exec("delete from sqs_rate where ip not like 'new:%'"); // past the per-wallet 2 s limit, the IP limit still holds
    assert.deepEqual(await put('0x' + 'cd'.repeat(20), { 'sq-coins': '1' }), { error: 'slow down' }, 'still the same IP');
    await db.exec("delete from sqs_rate where ip not like 'new:%'");
    assert.deepEqual(await put('0x' + 'cd'.repeat(20), { 'sq-coins': '1' }, 0, 'ip-b'), { ok: true, rev: 1 }, 'another IP');
    await unrate(); assert.deepEqual(await put(W, { big: 'x'.repeat(45000) }, 1), { error: 'that save is too big' });
    await db.exec("delete from sqs_admin where k = 'server_key_sha256'");
    await unrate(); assert.deepEqual(await put(W, { 'sq-coins': '2' }, 1, 'ip-c', 'guess'), { error: 'forbidden' });
    assert.deepEqual(await call('sqs_save_get', { p_server_key: 'guess', p_wallet: W }), { error: 'forbidden' });
    assert.equal((await db.query("select sqs_key_ok('server_key_sha256', 'anything') as ok")).rows[0].ok, false);
  } finally { await db.close(); }
});
