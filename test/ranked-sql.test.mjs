import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { RankedDB } from './helpers/ranked-db.mjs';

// Optional, installed outside this repo: SQS_PGLITE=/scratch/node_modules/@electric-sql/pglite/dist/index.js
// npm test stays offline and dependency-free without it.
const enabled = !!process.env.SQS_PGLITE;
test('ranked SQL: real PostgreSQL lifecycle, permissions, ranking, retention and refunds', { skip: !enabled }, async t => {
  const { PGlite } = await import(pathToFileURL(process.env.SQS_PGLITE));
  const db = new PGlite();
  try {
    await db.exec('create role anon; create role authenticated;');
    await db.exec(await readFile(new URL('../tools/supabase/schema.sql', import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('../tools/supabase/ranked.sql', import.meta.url), 'utf8'));
    await db.exec("update sqs_admin set v = encode(sha256(convert_to(case when k = 'server_key_sha256' then 'server-key' else 'reports-key' end, 'UTF8')), 'hex');");
    const invoke = async (fn, args) => (await db.query(`select ${fn}(${Object.keys(args).map((k, i) => `${k} => $${i + 1}`).join(',')}) as result`, Object.values(args))).rows[0].result;
    const fake = new RankedDB();
    const both = async (fn, args) => {
      const actual = await invoke(fn, args), expected = await fake.rpc(fn, args);
      // start times come from two different clocks: both must be there, their values cannot match
      const clockless = (o) => (o && typeof o === 'object' && 'started' in o ? (assert.ok(Number(o.started) > 0, fn + ' start time'), { ...o, started: 'time' }) : o);
      assert.deepEqual(clockless(actual), clockless(expected), fn); return actual;
    };
    const w = '0x' + '1'.repeat(40), b = '0x' + '2'.repeat(40), tx = n => '0x' + n.toString(16).padStart(64, '0');
    const entry = (n, wallet = w, week = 0, ip = 'ip') => ({ p_server_key: 'server-key', p_tx: tx(n), p_wallet: wallet, p_week: week, p_ip_hash: ip, p_paid: '500000000000000000', p_seed: 11, p_max: 20 });
    const ident = (id, wallet = w) => ({ p_server_key: 'server-key', p_id: id, p_wallet: wallet });
    const finish = (id, time = 100, won = false) => ({ p_server_key: 'server-key', p_id: id, p_name: 'Tester', p_t: time, p_kills: 12, p_level: 3, p_won: won, p_verdict: 'ok', p_log_sha: 'a'.repeat(64), p_log: 'compressed' });
    await t.test('fake and SQL agree on eligibility, retries, starts, claims, voids and refunds', async () => {
      await both('sqs_ranked_can_enter', { p_server_key: 'wrong', p_wallet: w, p_week: 0, p_ip_hash: 'ip', p_max: 20 });
      await both('sqs_ranked_enter', entry(1));
      await both('sqs_ranked_enter', entry(1));
      await both('sqs_ranked_enter', entry(1, b));
      await both('sqs_ranked_can_enter', { p_server_key: 'server-key', p_wallet: b, p_week: 0, p_ip_hash: 'ip', p_max: 20 });
      await both('sqs_ranked_enter', entry(2, b));
      await both('sqs_ranked_start', { ...ident(1, b), p_adv: 'adventurer' });
      await both('sqs_ranked_start', { ...ident(1), p_adv: 'adventurer' });
      await both('sqs_ranked_start', { ...ident(1), p_adv: 'adventurer' });
      await both('sqs_ranked_claim', ident(1));
      await both('sqs_ranked_claim', ident(1));
      await both('sqs_ranked_finish', finish(1));
      await both('sqs_ranked_finish', finish(1));
      await both('sqs_ranked_void', { ...ident(1), p_reason: 'updated' });
      await both('sqs_ranked_enter', entry(3));
      await both('sqs_ranked_start', { ...ident(3), p_adv: 'adventurer' });
      await both('sqs_ranked_void', { ...ident(3), p_reason: 'updated' });
      await both('sqs_ranked_claim', ident(3));
      await both('sqs_ranked_void', { ...ident(3), p_reason: 'updated' });
      assert.equal((await invoke('sqs_ranked_settle', { p_key: 'reports-key', p_week: 0 })).refunds.length, 2);
      const owe = { p_server_key: 'server-key', p_tx: tx(100), p_wallet: w, p_week: -1, p_paid: '500000000000000000', p_reason: 'weekly reset' };
      await both('sqs_ranked_owe', owe);
      await both('sqs_ranked_owe', owe);
      await both('sqs_ranked_owe', { ...owe, p_wallet: b });
      // The same tx cannot be inserted again in a different week's lock domain.
      await both('sqs_ranked_enter', { ...entry(1), p_week: 1 });

    });
    await t.test('already consumed payment is never promised a refund at reset', async () => {
      const p = { p_server_key: 'server-key', p_tx: tx(1), p_wallet: w, p_week: 0, p_paid: '500000000000000000', p_reason: 'paid just before the weekly reset' };
      assert.deepEqual(await invoke('sqs_ranked_owe', p), { error: 'that payment was already used for an entry' });
      assert.equal((await db.query('select refund_reason from sqs_ranked_entries where id=1')).rows[0].refund_reason, null);
    });
    await t.test('ranking selects one best run per wallet and orders by time survived (a win no longer counts, runs are endless), with stable ties', async () => {
      for (const [n, wallet, time, won] of [[4, w, 200, false], [5, b, 10, true], [6, '0x' + '3'.repeat(40), 200, false]]) {
        const { id } = await invoke('sqs_ranked_enter', entry(n, wallet, 0, 'ip' + n));
        await invoke('sqs_ranked_start', { ...ident(id, wallet), p_adv: 'adventurer' });
        await invoke('sqs_ranked_claim', ident(id, wallet));
        await invoke('sqs_ranked_finish', finish(id, time, won));
      }
      const board = await invoke('sqs_ranked_board', { p_week: 0 });
      assert.deepEqual(board.rows.map(e => e.wallet), [w, '0x' + '3'.repeat(40), b]);
      // A weaker repeat must return the wallet's actual board rank.
      const { id } = await invoke('sqs_ranked_enter', entry(7, w));
      await invoke('sqs_ranked_start', { ...ident(id), p_adv: 'adventurer' });
      await invoke('sqs_ranked_claim', ident(id));
      assert.equal((await invoke('sqs_ranked_finish', finish(id, 50))).rank, 1);
    });
    await t.test('logs retain only the best ten wallets per week for the current and previous week', async () => {
      for (let n = 8; n <= 20; n++) {
        const wallet = '0x' + n.toString(16).padStart(40, '0');
        const { id } = await invoke('sqs_ranked_enter', entry(n, wallet, 0, 'ip' + n));
        await invoke('sqs_ranked_start', { ...ident(id, wallet), p_adv: 'adventurer' });
        await invoke('sqs_ranked_claim', ident(id, wallet));
        await invoke('sqs_ranked_finish', finish(id, n));
      }
      assert.equal((await db.query('select count(*)::int as n from sqs_ranked_entries where week=0 and log is not null')).rows[0].n, 10);
      const { id } = await invoke('sqs_ranked_enter', entry(21, w, 2));
      await invoke('sqs_ranked_start', { ...ident(id), p_adv: 'adventurer' });
      await invoke('sqs_ranked_claim', ident(id));
      await invoke('sqs_ranked_finish', finish(id));
      assert.equal((await db.query('select count(*)::int as n from sqs_ranked_entries where week=0 and log is not null')).rows[0].n, 0);
    });
    await t.test('SQL and double agree on the twenty-entry cap and paid refund retries', async () => {
      await db.exec('truncate sqs_ranked_entries restart identity;');
      fake.rows.length = 0; fake.next = 1;
      const limited = '0x' + '4'.repeat(40);
      for (let n = 30; n < 50; n++) assert.equal((await both('sqs_ranked_enter', entry(n, limited, 3, 'cap-ip'))).ok, true);
      const rejected = await both('sqs_ranked_enter', entry(50, limited, 3, 'cap-ip'));
      assert.deepEqual(rejected, { error: 'all 20 entries used this week. Your 0.5 DMT will be sent back.', refund: true });
      await both('sqs_ranked_enter', entry(50, limited, 3, 'cap-ip'));
      await both('sqs_ranked_can_enter', { p_server_key: 'server-key', p_wallet: limited, p_week: 3, p_ip_hash: 'cap-ip', p_max: 20 });
    });
    await t.test('RLS and grants block tables and private helpers; missing configured key fails closed', async () => {
      assert.equal((await db.query("select relrowsecurity from pg_class where oid='sqs_ranked_entries'::regclass")).rows[0].relrowsecurity, true);
      await db.exec('set role anon;');
      await assert.rejects(db.query('select * from sqs_ranked_entries'), /permission denied/);
      await assert.rejects(db.query("select sqs_key_ok('server_key_sha256','server-key')"), /permission denied/);
      assert.deepEqual(await invoke('sqs_ranked_settle', { p_key: 'wrong', p_week: 0 }), { error: 'forbidden' });
      await db.exec('reset role; delete from sqs_admin; set role anon;');
      for (const [fn, args] of [
        ['sqs_ranked_enter', entry(22)],
        ['sqs_ranked_can_enter', { p_server_key: 'server-key', p_wallet: w, p_week: 0, p_ip_hash: 'ip', p_max: 20 }],
        ['sqs_ranked_owe', { p_server_key: 'server-key', p_tx: tx(23), p_wallet: w, p_week: 0, p_paid: '500000000000000000', p_reason: 'reset' }],
        ['sqs_ranked_start', { ...ident(1), p_adv: 'adventurer' }],
        ['sqs_ranked_claim', ident(1)],
        ['sqs_ranked_finish', finish(1)],
        ['sqs_ranked_void', { ...ident(1), p_reason: 'updated' }],
        ['sqs_ranked_settle', { p_key: 'reports-key', p_week: 0 }],
        ['sqs_ranked_log', { p_key: 'reports-key', p_id: 1 }],
      ]) assert.deepEqual(await invoke(fn, args), { error: 'forbidden' }, fn);
      await db.exec('reset role;');
    });
  } finally { await db.close(); }
});
