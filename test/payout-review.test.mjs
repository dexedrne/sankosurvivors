import test from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';
import { stats, main } from '../tools/payout/review.mjs';
import { HOUSE } from '../tools/payout/core.mjs';

// Before a week's prizes are paid (security pass 3): tools/payout/review.mjs lists each race's top 5 with input
// statistics so bot or tool-assisted runs can be held. Read-only, reports key, no wallet key.
const wallet = (n) => '0x' + n.toString(16).padStart(40, '0');
const packed = (log) => gzipSync(JSON.stringify(log)).toString('base64');
// a keyboard player: 8 directions, each held for a while
function keyboard(n = 120) {
  const dirs = [[100, 0], [71, 71], [0, 100], [-71, 71], [-100, 0], [-71, -71], [0, -100], [71, -71]];
  return { v: 1, runs: Array.from({ length: n }, (_, i) => [12 + ((i * 37) % 50), ...dirs[i % 8]]), uses: [], picks: [] };
}
// the reproduced bot: 68 input changes in 100 ticks, a new analog direction each time
function bot(blocks = 20) {
  const runs = [];
  for (let b = 0; b < blocks; b++) for (let i = 0; i < 68; i++) {
    const a = (b * 68 + i) * 0.7;
    runs.push([i < 36 ? 1 : 2, Math.round(Math.cos(a) * 100), Math.round(Math.sin(a) * 100)]);
  }
  return { v: 1, runs, uses: [], picks: [] };
}

test('stats flags a bot-like log (0.68 input changes a tick) and passes an 8-direction keyboard log', () => {
  const b = stats(bot());
  assert.equal(b.ticks, 2000);
  assert.ok(Math.abs(b.rate - 0.68) < 1e-9, String(b.rate));
  assert.equal(b.flag, true);
  const k = stats(keyboard());
  assert.equal(k.dirs, 8);
  assert.ok(k.rate < 0.1, String(k.rate));
  assert.equal(k.short, 0);
  assert.equal(k.flag, false);
  // many short taps or a huge spread of directions also earn a look
  assert.equal(stats({ runs: Array.from({ length: 100 }, (_, i) => [i % 2 ? 1 : 9, i % 2 ? 100 : -100, 0]) }).flag, false, 'half short: not more than half');
  assert.equal(stats({ runs: Array.from({ length: 100 }, (_, i) => [i % 3 ? 1 : 9, i % 2 ? 100 : -100, 0]) }).flag, true, 'two thirds short');
  assert.equal(stats({ runs: Array.from({ length: 201 }, (_, i) => [10, i - 100, 0]) }).flag, true, '201 directions');
  assert.deepEqual(stats({ runs: [] }), { ticks: 0, rate: 0, dirs: 0, short: 0, flag: false });
});

function fakeDb({ normal, hard, logs }) {
  const calls = [];
  const db = async (fn, p) => {
    calls.push([fn, p]);
    if (p.p_key !== 'reports-key') return { error: 'forbidden' };
    if (fn === 'sqs_ranked_settle') return { week: p.p_week, mode: p.p_mode, activity_runs:[], top: p.p_mode === 'hard' ? hard : normal };
    if (fn === 'sqs_ranked_log') return { id: p.p_id, log: logs.has(p.p_id) ? logs.get(p.p_id) : packed(keyboard()) };
    throw Error('unexpected rpc ' + fn);
  };
  return { db, calls };
}
const row = (id, w, extra = {}) => ({ id: String(id), wallet: wallet(w), name: 'Player ' + id, t: 900 - id, kills: 400 - id, ...extra });

test('main prints the five prize places of each race and marks the bot run and a run without a log', async (t) => {
  const lines = [];
  t.mock.method(console, 'log', (l) => lines.push(l));
  // the developer's wallet is on the board but wins nothing, so place 5 is the sixth row (as makePlan pays it)
  const normal = [row(1, 1), row(2, 2, { wallet: HOUSE }), row(3, 3), row(4, 4, { name: 'x\x1b[2J\u009b31my' }), row(5, 5), row(6, 6), row(7, 7)];
  const hard = [row(11, 11), row(12, 12), row(13, 13), row(14, 14), row(15, 15)];
  const { db, calls } = fakeDb({ normal, hard, logs: new Map([[3, packed(bot())], [12, null]]) });
  const out = await main(['0'], { config: { reportsKey: 'reports-key' }, db });
  assert.deepEqual(lines, out);
  assert.equal(out.length, 10);
  const normalLines = out.filter((l) => l.startsWith('normal ')), hardLines = out.filter((l) => l.startsWith('hard '));
  assert.equal(normalLines.length, 5); assert.equal(hardLines.length, 5);
  assert.deepEqual(normalLines.map((l) => l.split(' ')[3]), ['1', '3', '4', '5', '6'], 'the developer wallet is skipped, the sixth row is place 5');
  assert.ok(!out.some((l) => l.includes(HOUSE)));
  assert.deepEqual(out.filter((l) => l.includes('<< REVIEW')).map((l) => l.split(' ').slice(0, 4).join(' ')), ['normal #2 id 3', 'hard #2 id 12']);
  assert.match(out[1], /^normal #2 id 3 0x0+3 "Player 3": 897s 397 kills \| 0\.680 input changes\/tick, \d+ directions, 100% 1-2 tick inputs {2}<< REVIEW$/);
  assert.match(out[0], /^normal #1 id 1 0x0+1 "Player 1": 899s 399 kills \| 0\.0\d\d input changes\/tick, 8 directions, 0% 1-2 tick inputs$/);
  assert.equal(hardLines[1], `hard #2 id 12 ${wallet(12)}: no log  << REVIEW`);
  assert.ok(out[2].includes('"x?[2J?31my"'), 'no control characters from a player name reach the terminal');
  assert.ok(!out.some((l) => /[\x00-\x1f\x7f-\x9f]/.test(l)));
  assert.deepEqual(calls.filter(([fn]) => fn === 'sqs_ranked_settle').map(([, p]) => p), [{ p_key: 'reports-key', p_week: 0, p_mode: 'normal' }, { p_key: 'reports-key', p_week: 0, p_mode: 'hard' }]);
  assert.equal(calls.filter(([fn]) => fn === 'sqs_ranked_log').length, 10, 'only the ten reviewed runs are fetched');
  assert.ok(calls.every(([, p]) => !('p_payout_key' in p) && p.p_key === 'reports-key'), 'read-only reports key only');
});

test('from week 1 a run under 3:00 cannot win, so it is not reviewed either', async (t) => {
  t.mock.method(console, 'log', () => {});
  const normal = [row(1, 1, { t: 120 }), row(2, 2), row(3, 3)];
  const { db } = fakeDb({ normal, hard: [], logs: new Map() });
  const out = await main(['1'], { config: { reportsKey: 'reports-key' }, db });
  assert.deepEqual(out.map((l) => l.split(' ').slice(0, 4).join(' ')), ['normal #1 id 2', 'normal #2 id 3']);
});

test('a refused settlement or bad arguments stop the review', async (t) => {
  t.mock.method(console, 'log', () => {});
  const { db } = fakeDb({ normal: [], hard: [], logs: new Map() });
  await assert.rejects(main(['0'], { config: { reportsKey: 'wrong' }, db }), /settle refused/);
  let used = false;
  const spy = async () => { used = true; return {}; };
  for (const args of [[], ['x'], ['-1'], ['0', '--env'], ['0', '--nope', 'x'], ['0', '--env', 'a', 'b']]) await assert.rejects(main(args, { config: { reportsKey: 'reports-key' }, db: spy }), /usage/, JSON.stringify(args));
  assert.equal(used, false);
});

test('the ranked rules say runs must be played live by a person (all three rules texts)', async () => {
  const src = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  const rules = [...src.matchAll(/The server checks every input\.([^'`]*)/g)].map((m) => m[1]);
  assert.equal(rules.length, 3);
  for (const r of rules) {
    assert.ok(r.includes('tool-assisted'), r);
    assert.ok(r.includes('disqualified and their prizes held'), r);
    assert.ok(r.includes('resuming after a reload is fine'), r);
  }
  const ranked = await readFile(new URL('../src/ranked.js', import.meta.url), 'utf8');
  assert.ok(!ranked.includes('tool-assisted'), 'client text only: the ranked game (sim id) is unchanged');
});
test('week1 review includes every qualifying participation run once, including outside the top5',async t=>{
 t.mock.method(console,'log',()=>{});
 const first=row(1,1),outside=row(20,20),repeat=row(21,20),short=row(22,21,{t:30});
 const f=fakeDb({normal:[first],hard:[],logs:new Map()});
 const db=async(fn,p)=>{const r=await f.db(fn,p);return fn==='sqs_ranked_settle'?{...r,activity_runs:p.p_mode==='normal'?[first,outside,repeat,short]:[]}:r;};
 const result=await main(['1'],{config:{reportsKey:'reports-key'},db});
 assert.equal(result.length,4);assert.deepEqual(f.calls.filter(([fn])=>fn==='sqs_ranked_log').map(([,p])=>p.p_id),[1,20,21,22]);
 await assert.rejects(main(['1'],{config:{reportsKey:'reports-key'},db:async()=>({top:[]})}),/participation review unavailable/);
});
