// Real PostgreSQL (PGlite) checks for the week 1 rules: the migration from the week 0 install (pasted again and again),
// week 0 still settling by its old rules, kills-per-minute boards from week 1, and the Hard race's own pot and rollover.
// Optional like the other SQL tests: SQS_PGLITE=/path/to/@electric-sql/pglite/dist/index.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { makePlan, HOUSE, COLLECT } from '../tools/payout/core.mjs';
import { compareRuns, prizePlaces } from '../src/ranked.js';

const enabled = !!process.env.SQS_PGLITE;
const sql = (f) => readFile(new URL(f, import.meta.url), 'utf8');
const w = (n) => '0x' + n.toString(16).padStart(40, '0');
const tx = (n) => '0x' + n.toString(16).padStart(64, '0');
const E18 = 10n ** 18n, e18 = (dmt) => (BigInt(Math.round(dmt * 10000)) * E18 / 10000n).toString();
const DEV = HOUSE;

// A database with the week 0 install (the SQL that is live now), its clock under the test's control.
async function week0DB() {
  const { PGlite } = await import(pathToFileURL(process.env.SQS_PGLITE));
  const db = new PGlite();
  await db.exec('create role anon; create role authenticated;');
  await db.exec(await sql('../tools/supabase/schema.sql'));
  await db.exec(await sql('./fixtures/week0-ranked.sql'));
  await db.exec(await sql('./fixtures/week0-payouts.sql'));
  // the clock is a session setting (PGlite keeps calling the built-in now() if the override reads a table)
  await db.exec(`set sqs.now = '2026-11-05T12:00:00Z';
    create or replace function pg_catalog.now() returns timestamptz language sql stable as $$ select current_setting('sqs.now')::timestamptz $$;`);
  await db.exec("update sqs_admin set v=encode(sha256(convert_to(case when k='payout_key_sha256' then 'payout-key' when k='reports_key_sha256' then 'reports-key' else 'server-key' end,'UTF8')),'hex');");
  const rpc = async (fn, args = {}) => (await db.query(`select ${fn}(${Object.keys(args).map((k, i) => `${k} => $${i + 1}`).join(',')}) as r`, Object.values(args).map((v) => (typeof v === 'object' && v !== null ? JSON.stringify(v) : v)))).rows[0].r;
  const clock = (iso) => db.exec(`set sqs.now = '${iso}'`);
  const upgrade = async () => { await db.exec(await sql('../tools/supabase/ranked.sql')); await db.exec(await sql('../tools/supabase/payouts.sql')); };
  const pay = (fn, p = {}) => rpc('sqs_payout_' + fn, { p_key: 'payout-key', ...p });
  // a finished, checked run straight into the table (the replay is tested elsewhere)
  let serial = 1000;
  const run = (week, wallet, t, kills, { won = false, mode = 'normal', paid = mode === 'hard' ? e18(1.5) : e18(0.5), name = 'P' + serial } = {}) => {
    const n = ++serial;
    return db.exec(`insert into sqs_ranked_entries(week,wallet,tx,paid,ip_hash,seed,verdict,t,kills,level,won,adv,name,started_at,claimed_at,finished_at${mode === 'normal' ? '' : ',mode'})
      values (${week},'${wallet}','${tx(n)}',${paid},'ip${n}',1,'ok',${t},${kills},5,${won},'adventurer','${name}',now(),now(),now() + interval '${n} milliseconds'${mode === 'normal' ? '' : `,'${mode}'`})`);
  };
  return { db, rpc, clock, upgrade, pay, run };
}
const fnCount = async (db, name) => (await db.query(`select count(*)::int as n from pg_proc where proname=$1`, [name])).rows[0].n;

test('ranked2 SQL: migration, week 0 old rules, kills per minute, the Hard pot', { skip: !enabled }, async (t) => {
  const { db, rpc, clock, upgrade, pay, run } = await week0DB();
  try {
    // ---- week 0 is played on the live install: old functions, old signatures ----
    const old = { p_server_key: 'server-key', p_week: 0, p_paid: e18(0.5), p_seed: 5, p_max: 20 };
    assert.equal((await rpc('sqs_ranked_enter', { ...old, p_tx: tx(1), p_wallet: w(1), p_ip_hash: 'a' })).ok, true);
    assert.equal((await rpc('sqs_ranked_owe', { p_server_key: 'server-key', p_tx: tx(2), p_wallet: w(2), p_week: 0, p_paid: e18(0.5), p_reason: 'paid just before the weekly reset' })).ok, true);
    // the week 0 board: winners at 15:00 first, then the longest survivors; a fast killer who fell early is last
    await run(0, w(11), 900, 500, { won: true, name: 'Winner' });
    await run(0, w(12), 600, 900, { name: 'FastFell' });   // 90 kills/min, but fell at 10:00
    await run(0, w(13), 899, 100, { name: 'Almost' });
    await run(0, DEV, 900, 999, { won: true, name: 'Dev' });
    assert.equal((await pay('refunds')).added, 1);

    await t.test('the migration keeps every week 0 row, and pasting it again (any number of times) is safe', async () => {
      const before = (await db.query('select id, week, wallet, tx, paid::text, t, kills, won, refund_reason from sqs_ranked_entries order by id')).rows;
      await upgrade(); await upgrade(); await upgrade();
      const after = (await db.query('select id, week, wallet, tx, paid::text, t, kills, won, refund_reason, mode from sqs_ranked_entries order by id')).rows;
      assert.deepEqual(after.map(({ mode, ...r }) => r), before);
      assert.ok(after.every((r) => r.mode === 'normal'), 'older entries are all Normal');
      const refunds = (await pay('read')).rows.filter((r) => r.kind === 'refund');
      assert.deepEqual(refunds.map((r) => [r.mode, r.amount]), [['normal', e18(0.5)]]);
      assert.equal((await pay('refunds')).added, 0, 'the refund is not added twice after the upgrade');
      // one function per name: the old signatures are gone (PostgREST would otherwise see two candidates)
      for (const fn of ['sqs_ranked_can_enter', 'sqs_ranked_enter', 'sqs_ranked_owe', 'sqs_ranked_board', 'sqs_ranked_settle', 'sqs_payout_plan']) assert.equal(await fnCount(db, fn), 1, fn);
      const pk = (await db.query("select pg_get_constraintdef(oid) as d from pg_constraint where conrelid='sqs_ranked_payout_weeks'::regclass and contype='p'")).rows[0].d;
      assert.equal(pk, 'PRIMARY KEY (week, mode)');
      const idx = (await db.query("select indexname from pg_indexes where tablename='sqs_ranked_payouts' and indexname like 'sqs_payout_unique%'")).rows.map((r) => r.indexname);
      assert.deepEqual(idx, ['sqs_payout_unique_transfer_mode']);
    });

    await t.test('week 0 boards and settlement rank by time survived, then kills (endless now); the same runs in week 1 rank by kills per minute', async () => {
      const board = await rpc('sqs_ranked_board', { p_week: 0 });
      assert.deepEqual(board.rows.map((r) => r.name), ['Dev', 'Winner', 'Almost', 'FastFell']);
      // the site's order (src/ranked.js) is the same
      const js = [...board.rows].reverse().sort(compareRuns(0)).map((r) => r.name);
      assert.deepEqual(js, ['Dev', 'Winner', 'Almost', 'FastFell']);
      const settle = await rpc('sqs_ranked_settle', { p_key: 'reports-key', p_week: 0 });
      assert.deepEqual([settle.mode, settle.rules, settle.entries, settle.paid], ['normal', 'classic', 5, e18(2.5)]);
      // a Hard race does not exist in week 0, before or after paying
      assert.equal((await rpc('sqs_ranked_can_enter', { p_server_key: 'server-key', p_wallet: w(1), p_week: 0, p_ip_hash: 'a', p_max: 20, p_mode: 'hard' })).error, 'no such race this week');
      assert.equal((await rpc('sqs_ranked_enter', { ...old, p_tx: tx(3), p_wallet: w(1), p_ip_hash: 'a', p_mode: 'hard' })).error, 'bad entry');
      // the very same runs in week 1: kills per minute, so FastFell (90/min) leads
      for (const r of board.rows) await run(1, r.wallet, r.t, r.kills, { name: r.name });
      const b1 = await rpc('sqs_ranked_board', { p_week: 1 });
      assert.deepEqual(b1.rows.map((r) => r.name), ['FastFell', 'Dev', 'Winner', 'Almost']);
      assert.deepEqual([...b1.rows].reverse().sort(compareRuns(1)).map((r) => r.name), ['FastFell', 'Dev', 'Winner', 'Almost']);
      await db.exec('delete from sqs_ranked_entries where week=1');
    });

    await t.test('week 0 settles by its rules: the bot plan matches SQL; the developer wallet wins nothing; no Hard pot', async () => {
      await clock('2026-11-09T02:00:00Z');
      assert.equal((await pay('plan', { p_week: 0, p_plan: {} })).error, 'submission grace', 'runs of up to 2:00:00: 3 hours of grace');
      await clock('2026-11-09T02:59:00Z');
      assert.equal((await pay('plan', { p_week: 0, p_plan: {} })).error, 'submission grace');
      await clock('2026-11-09T03:01:00Z');
      const report = await rpc('sqs_ranked_settle', { p_key: 'reports-key', p_week: 0 });
      const plan = makePlan(report, '0', 0);
      assert.deepEqual(plan.prizes.map((p) => p.wallet), [w(11), w(13), w(12)]);
      assert.deepEqual(await pay('plan', { p_week: 0, p_plan: plan }), { ok: true });
      assert.equal((await pay('plan', { p_week: 0, p_plan: plan })).again, true);
      assert.equal((await pay('plan', { p_week: 0, p_plan: plan, p_mode: 'hard' })).error, 'no such race that week');
      // 5 counted entries (4 runs and one entry never started: 2.5 DMT): 0.25 house, 2.25 pool; 3 winners take 40+25+15,
      // 20% rolls over
      const st = await pay('read', { p_week: 0 });
      assert.deepEqual([st.weeks[0].mode, st.weeks[0].house, st.weeks[0].pool, st.weeks[0].rollover], ['normal', e18(0.25), e18(2.25), e18(0.45)]);
    });

    await t.test('week 1: two races, each with its own board, entry cap and kills-per-minute order; one wallet per connection across both', async () => {
      await clock('2026-11-10T12:00:00Z');
      const e = (n, wallet, mode, ip = 'net') => rpc('sqs_ranked_enter', { p_server_key: 'server-key', p_tx: tx(n), p_wallet: wallet, p_week: 1, p_ip_hash: ip, p_paid: mode === 'hard' ? e18(1.5) : e18(0.5), p_seed: 9, p_max: 20, p_mode: mode });
      for (let n = 0; n < 20; n++) assert.equal((await e(100 + n, w(50), 'normal')).ok, true);
      assert.equal((await e(120, w(50), 'normal')).error, 'all 20 entries used this week. Your 0.5 DMT will be sent back.');
      assert.equal((await rpc('sqs_ranked_can_enter', { p_server_key: 'server-key', p_wallet: w(50), p_week: 1, p_ip_hash: 'net', p_max: 20, p_mode: 'normal' })).error, 'you have used all 20 ranked entries this week');
      assert.deepEqual(await rpc('sqs_ranked_can_enter', { p_server_key: 'server-key', p_wallet: w(50), p_week: 1, p_ip_hash: 'net', p_max: 20, p_mode: 'hard' }), { ok: true, left: 20 });
      const h = await e(121, w(50), 'hard');
      assert.deepEqual([h.ok, h.mode, h.left], [true, 'hard', 19]);
      assert.deepEqual(await e(121, w(50), 'hard'), { ok: true, id: h.id, week: 1, mode: 'hard', again: true, left: 19 }, 'retry-safe');
      const other = await e(122, w(51), 'hard');
      assert.equal(other.error, 'one wallet per player each week. Your 1.5 DMT will be sent back.');
      assert.equal((await rpc('sqs_ranked_can_enter', { p_server_key: 'server-key', p_wallet: w(51), p_week: 1, p_ip_hash: 'net', p_max: 20, p_mode: 'normal' })).error, 'one wallet per player each week: this connection already entered with another wallet');
      assert.equal((await rpc('sqs_ranked_enter', { p_server_key: 'server-key', p_tx: tx(123), p_wallet: w(52), p_week: 1, p_ip_hash: 'x', p_paid: e18(1.5), p_seed: 9, p_max: 20, p_mode: 'nightmare' })).error, 'bad entry');
      // the start answer carries the race
      assert.equal((await rpc('sqs_ranked_start', { p_server_key: 'server-key', p_id: h.id, p_wallet: w(50), p_adv: 'adventurer' })).mode, 'hard');
      await db.exec('delete from sqs_ranked_entries where week=1');
    });

    // the week 1 races: the same map, each its own pot
    await run(1, w(21), 120, 400, { name: 'TooShort' });  // 200/min but under 3:00: listed, never wins
    await run(1, w(22), 600, 300, { name: 'Steady' });    // 30/min
    await run(1, w(23), 900, 200, { name: 'Slow' });      // 13.33/min
    await run(1, DEV, 1000, 2000, { name: 'Dev' });       // 120/min, no prize
    await run(1, DEV, 1200, 2000, { name: 'DevHard', mode: 'hard' });   // 100/min, no prize
    await run(1, w(31), 400, 200, { name: 'Brave', mode: 'hard' });     // 30/min, 200 kills
    await run(1, w(32), 300, 150, { name: 'Tied', mode: 'hard' });      // 30/min, fewer kills: after Brave
    await run(1, w(33), 180, 60, { name: 'JustEnough', mode: 'hard' }); // 20/min at exactly 3:00: counts
    await run(1, w(34), 179, 100, { name: 'Blink', mode: 'hard' });     // under 3:00
    await run(1, w(31), 100, 10, { name: 'BraveAgain', mode: 'hard' }); // a weaker second run: only the best counts
    await db.exec(`insert into sqs_ranked_entries(week,wallet,tx,paid,ip_hash,seed,refund_reason,mode) values (1,'${w(35)}','${tx(9000)}',${e18(1.5)},'',0,'game updated','hard')`);

    await t.test('week 1 boards: kills per minute, too-short runs last, ties to more kills; the same order as the site', async () => {
      const n = await rpc('sqs_ranked_board', { p_week: 1, p_mode: 'normal' }), h = await rpc('sqs_ranked_board', { p_week: 1, p_mode: 'hard' });
      assert.deepEqual(n.rows.map((r) => r.name), ['Dev', 'Steady', 'Slow', 'TooShort']);
      assert.deepEqual(h.rows.map((r) => r.name), ['DevHard', 'Brave', 'Tied', 'JustEnough', 'Blink']);
      assert.deepEqual([n.entries, n.paid, h.entries, h.paid], [4, e18(2), 6, e18(9)]);
      for (const b of [n, h]) assert.deepEqual([...b.rows].reverse().sort(compareRuns(1)).map((r) => r.name), b.rows.map((r) => r.name));
      const noPrize = (x) => x === DEV;
      assert.deepEqual(prizePlaces(h.rows, 1, noPrize), [-1, 0, 1, 2, -1]);
      const s = await rpc('sqs_ranked_settle', { p_key: 'reports-key', p_week: 1, p_mode: 'hard' });
      assert.deepEqual([s.mode, s.rules, s.entries, s.paid, s.refunds.length], ['hard', 'kpm', 6, e18(9), 1]);
    });

    await t.test('week 1 settles two pots: Normal carries week 0 rollover, Hard starts from nothing; both house fees to the same wallet', async () => {
      await clock('2026-11-16T03:05:00Z');
      const plans = {};
      for (const mode of ['normal', 'hard']) {
        const report = await rpc('sqs_ranked_settle', { p_key: 'reports-key', p_week: 1, p_mode: mode });
        const incoming = mode === 'normal' ? (await pay('read', { p_week: 0 })).weeks[0].rollover : '0';
        plans[mode] = makePlan(report, incoming, 1);
        // a plan built by the wrong rules (week 0 order, or without the 3:00 minimum) is refused
        const wrong = makePlan(report, incoming, 0);
        if (JSON.stringify(wrong) !== JSON.stringify(plans[mode])) assert.equal((await pay('plan', { p_week: 1, p_mode: mode, p_plan: wrong })).error, 'plan differs from settlement');
        assert.deepEqual(await pay('plan', { p_week: 1, p_mode: mode, p_plan: plans[mode] }), { ok: true }, mode);
      }
      assert.deepEqual(plans.normal.prizes.map((p) => p.wallet), [w(22), w(23)]);
      assert.deepEqual(plans.hard.prizes.map((p) => p.wallet), [w(31), w(32), w(33)]);
      const st = await pay('read', { p_week: 1 });
      const wk = (m) => st.weeks.find((x) => x.mode === m), rows = (m) => st.rows.filter((r) => r.mode === m);
      // Normal: 2 DMT → 0.2 house; 1.8 + 0.45 rolled from week 0 = 2.25 pool
      assert.deepEqual([wk('normal').house, wk('normal').incoming, wk('normal').pool], [e18(0.2), e18(0.45), e18(2.25)]);
      // Hard: 6 entries × 1.5 = 9 DMT → 0.9 house; 8.1 pool; 40/25/15 to three winners (3.24, 2.025, 1.215), 20% rolls over
      assert.deepEqual([wk('hard').house, wk('hard').incoming, wk('hard').pool, wk('hard').rollover], [e18(0.9), '0', e18(8.1), e18(1.62)]);
      assert.deepEqual(rows('hard').filter((r) => r.kind.startsWith('prize')).map((r) => [r.kind, r.wallet, r.amount]),
        [['prize1', w(31), e18(3.24)], ['prize2', w(32), e18(2.025)], ['prize3', w(33), e18(1.215)]]);
      assert.deepEqual(st.rows.filter((r) => r.kind === 'house').map((r) => [r.mode, r.wallet, r.amount]).sort(), [['hard', DEV, e18(0.9)], ['normal', DEV, e18(0.2)]]);
      assert.deepEqual(rows('hard').filter((r) => r.kind === 'rollover-note').map((r) => [r.wallet, r.amount]), [[COLLECT, e18(1.62)]]);
      assert.ok(!st.rows.some((r) => r.wallet === DEV && r.kind.startsWith('prize')), 'the developer wallet wins nothing in either race');
      // the Hard refund is paid from the Hard pot's records
      await pay('refunds');
      assert.deepEqual((await pay('read', { p_week: 1 })).rows.filter((r) => r.kind === 'refund').map((r) => [r.mode, r.amount]), [['hard', e18(1.5)]]);
    });

    await t.test('prizes of each pot are due 24 hours after the week; a hold covers the wallet in both races', async () => {
      const rows = (await pay('read', { p_week: 1 })).rows, hardPrize = rows.find((r) => r.mode === 'hard' && r.kind === 'prize1');
      assert.equal((await pay('claim', { p_id: hardPrize.id, p_pending: '0', p_block: '1' })).error, 'not due');
      await clock('2026-11-17T00:30:00Z');
      assert.equal((await pay('hold', { p_week: 1, p_wallet: w(31), p_reason: 'review' })).ok, true);
      assert.equal((await pay('read', { p_week: 1 })).rows.find((r) => r.id === hardPrize.id).status, 'held');
      assert.equal((await pay('claim', { p_id: hardPrize.id, p_pending: '0', p_block: '1' })).error, 'not claimable');
      await pay('hold', { p_week: 1, p_wallet: w(31), p_reason: null });
      assert.ok((await pay('claim', { p_id: hardPrize.id, p_pending: '0', p_block: '1' })).row.nonce);
    });

    await t.test('the Hard rollover chain is its own: week 2 Hard gets week 1 Hard rollover, Normal its own', async () => {
      await clock('2026-11-23T03:05:00Z');
      await run(2, w(41), 600, 600, { mode: 'hard' });
      for (const mode of ['normal', 'hard']) {
        const report = await rpc('sqs_ranked_settle', { p_key: 'reports-key', p_week: 2, p_mode: mode });
        const prev = (await pay('read', { p_week: 1 })).weeks.find((x) => x.mode === mode);
        assert.equal((await pay('plan', { p_week: 2, p_mode: mode, p_plan: makePlan(report, '1', 2) })).error, 'plan differs from settlement', 'a wrong rollover is refused');
        assert.deepEqual(await pay('plan', { p_week: 2, p_mode: mode, p_plan: makePlan(report, prev.rollover, 2) }), { ok: true });
      }
      const st = await pay('read', { p_week: 2 }), wk = (m) => st.weeks.find((x) => x.mode === m);
      assert.deepEqual([wk('hard').incoming, wk('hard').pool], [e18(1.62), e18(1.35 + 1.62)]);
      assert.equal(wk('normal').incoming, (await pay('read', { p_week: 1 })).weeks.find((x) => x.mode === 'normal').rollover);
      assert.equal(wk('normal').pool, wk('normal').incoming, 'an empty Normal week rolls its whole pool on');
      // re-pasting the migration with plans of both pots in place changes nothing
      const before = JSON.stringify(await pay('read'));
      await upgrade();
      assert.equal(JSON.stringify(await pay('read')), before);
    });
  } finally { await db.close(); }
});

test('ranked2 SQL: a week 0 ledger already in use (planned and half sent) upgrades in place and keeps working', { skip: !enabled }, async () => {
  const { db, rpc, clock, upgrade, pay, run } = await week0DB();
  try {
    await run(0, w(1), 900, 300, { won: true }); await run(0, w(2), 800, 300); await run(0, DEV, 900, 900, { won: true });
    await clock('2026-11-10T02:00:00Z');
    const report = await rpc('sqs_ranked_settle', { p_key: 'reports-key', p_week: 0 });
    // the old 3-argument plan function, with the plan the new bot computes for week 0: identical
    assert.deepEqual(await pay('plan', { p_week: 0, p_plan: makePlan(report, '0', 0) }), { ok: true });
    const prize1 = (await pay('read')).rows.find((r) => r.kind === 'prize1');
    const claim = await pay('claim', { p_id: prize1.id, p_pending: '0', p_block: '7' });
    assert.equal(claim.row.nonce, '0');
    assert.equal((await pay('notice', { p_name: 'week:0' })).ok, true);
    const before = await pay('read');
    await upgrade(); await upgrade();
    const after = await pay('read');
    assert.deepEqual(after.rows.map(({ mode, updated_at, ...r }) => r), before.rows.map(({ updated_at, ...r }) => r));
    assert.ok(after.rows.every((r) => r.mode === 'normal') && after.weeks.every((x) => x.mode === 'normal'));
    // the half-sent row finishes; the plan stays put; the notice stays claimed
    const hash = '0x' + 'a'.repeat(64);
    assert.equal((await pay('mark', { p_id: prize1.id, p_status: 'sent', p_hash: hash })).ok, true);
    assert.equal((await pay('mark', { p_id: prize1.id, p_status: 'confirmed', p_hash: hash })).ok, true);
    assert.equal((await pay('plan', { p_week: 0, p_plan: makePlan(report, '0', 0) })).again, true);
    assert.equal((await pay('notice', { p_name: 'week:0' })).ok, false);
    // the next week plans both pots on top of it
    await clock('2026-11-16T03:05:00Z');
    for (const mode of ['normal', 'hard']) {
      const r = await rpc('sqs_ranked_settle', { p_key: 'reports-key', p_week: 1, p_mode: mode });
      assert.deepEqual(await pay('plan', { p_week: 1, p_mode: mode, p_plan: makePlan(r, mode === 'normal' ? after.weeks[0].rollover : '0', 1) }), { ok: true }, mode);
    }
  } finally { await db.close(); }
});

test('ranked2 SQL: a hold still stops a wallet\'s other race prize when one race\'s prize is already on its way', { skip: !enabled }, async () => {
  const { db, rpc, clock, upgrade, pay, run } = await week0DB();
  try {
    await upgrade();
    await run(1, w(1), 600, 600); await run(1, w(1), 600, 500, { mode: 'hard' }); await run(1, w(2), 600, 300, { mode: 'hard', name: 'Other' });
    await clock('2026-11-16T03:05:00Z');
    assert.deepEqual(await pay('plan', { p_week: 0, p_plan: makePlan(await rpc('sqs_ranked_settle', { p_key: 'reports-key', p_week: 0 }), '0', 0) }), { ok: true }); // an empty week 0
    for (const mode of ['normal', 'hard']) {
      const r = await rpc('sqs_ranked_settle', { p_key: 'reports-key', p_week: 1, p_mode: mode });
      assert.deepEqual(await pay('plan', { p_week: 1, p_mode: mode, p_plan: makePlan(r, '0', 1) }), { ok: true });
    }
    await clock('2026-11-17T01:00:00Z');
    const rows = (await pay('read', { p_week: 1 })).rows, normal = rows.find((r) => r.mode === 'normal' && r.kind === 'prize1'), hard = rows.find((r) => r.mode === 'hard' && r.kind === 'prize1');
    assert.deepEqual([normal.wallet, hard.wallet], [w(1), w(1)]);
    assert.ok((await pay('claim', { p_id: normal.id, p_pending: '0', p_block: '1' })).row);
    assert.equal((await pay('mark', { p_id: normal.id, p_status: 'sent', p_hash: '0x' + 'c'.repeat(64) })).ok, true);
    const held = await pay('hold', { p_week: 1, p_wallet: w(1), p_reason: 'review' });
    assert.deepEqual([held.ok, held.unchanged], [true, 1]);
    const after = (await pay('read', { p_week: 1 })).rows;
    assert.equal(after.find((r) => r.id === hard.id).status, 'held', 'the Hard prize is held');
    assert.equal(after.find((r) => r.id === normal.id).status, 'sent', 'the sent Normal prize is untouched');
    assert.equal((await pay('claim', { p_id: hard.id, p_pending: '0', p_block: '1' })).error, 'not claimable');
    await pay('hold', { p_week: 1, p_wallet: w(1), p_reason: null });
    assert.equal((await pay('read', { p_week: 1 })).rows.find((r) => r.id === hard.id).status, 'planned', 'clearing works too');
  } finally { await db.close(); }
});
