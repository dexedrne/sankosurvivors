import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// the casual boards on a real PostgreSQL (PGlite, installed outside the repo: SQS_PGLITE=.../pglite/dist/index.js), as live:
// schema.sql, then updates 2, 3 and 5
const enabled = !!process.env.SQS_PGLITE;
const sql = (f) => readFile(new URL(`../tools/supabase/${f}`, import.meta.url), 'utf8');
test('casual boards: every kill counts, and the end screen place matches the board', { skip: !enabled }, async () => {
  const { PGlite } = await import(pathToFileURL(process.env.SQS_PGLITE));
  const db = new PGlite();
  try {
    await db.exec('create role anon; create role authenticated;');
    for (const f of ['schema.sql', 'update2.sql', 'update3.sql']) await db.exec(await sql(f));
    await db.exec("update sqs_admin set v = encode(sha256(convert_to('server-key', 'UTF8')), 'hex') where k = 'server_key_sha256';");
    // a run already on the board under the old score (kills capped at 999)
    await db.exec("insert into sqs_scores (map, name, t, kills, level, adv, won, hard, score, ticket, holder, endless, at) values ('greentown', 'gooner', 900, 5828, 40, 'adventurer', true, false, 10900999, 'old-1', false, false, now() - interval '1 day');");
    const five = await sql('update5.sql');
    await db.exec(five); await db.exec(five); // safe to paste again
    assert.equal(Number((await db.query("select score from sqs_scores where ticket = 'old-1'")).rows[0].score), 100000000000 + 900 * 1000000 + 5828, 'old runs rescored');

    let n = 0;
    const submit = async (name, t, kills, won, endless = false) => (await db.query(
      `select sqs_submit_score(p_ip => $1, p_map => 'greentown', p_name => $2, p_t => $3, p_kills => $4, p_level => 30, p_adv => 'adventurer',
        p_won => $5, p_hard => false, p_ticket => $6, p_server_key => 'server-key', p_holder => false, p_endless => $7) as r`,
      [`ip-${++n}`, name, t, kills, won, `ticket-${n}`, endless])).rows[0].r;
    const board = async (endless = false) => (await db.query('select name, kills from sqs_top($1, $2)', ['greentown', endless])).rows.map((r) => `${r.name}:${r.kills}`);

    assert.deepEqual(await submit('ArkRide', 900, 5302, true), { ok: true, rank: 2 });
    assert.deepEqual(await submit('ArkRide', 900, 5870, true), { ok: true, rank: 1 });
    assert.deepEqual(await submit('c3nt3n0', 900, 7477, true), { ok: true, rank: 1 }, 'the most kills at 15:00 is first');
    assert.deepEqual(await board(), ['c3nt3n0:7477', 'ArkRide:5870', 'gooner:5828', 'ArkRide:5302']);
    assert.deepEqual(await submit('tied', 900, 5870, true), { ok: true, rank: 3 }, 'a tie places after the older run, as the board lists it');
    assert.deepEqual((await board()).slice(0, 4), ['c3nt3n0:7477', 'ArkRide:5870', 'tied:5870', 'gooner:5828']);
    assert.deepEqual(await submit('close', 899, 20000, false), { ok: true, rank: 6 }, 'a win beats any number of kills');
    assert.equal((await submit('nope', 900, 900 * 30 + 1, true)).error, 'bad score', 'no more than 30 kills a second');
    // endless boards stay separate: time first, then kills
    assert.deepEqual(await submit('long', 3000, 9000, false, true), { ok: true, rank: 1 });
    assert.deepEqual(await submit('longer', 3000, 12000, false, true), { ok: true, rank: 1 });
    assert.deepEqual(await board(true), ['longer:12000', 'long:9000']);
  } finally { await db.close(); }
});
