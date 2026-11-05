import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { translateText } from '../src/i18n.js';

const source = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const recovery = source.slice(source.indexOf('async function recoverRankedRun()'), source.indexOf('async function submitRanked()'));
const actionStart = source.indexOf('async function rankedAction(');
const action = source.slice(actionStart, source.indexOf('// the wallet the entry', actionStart));
const live = { run: 'saved-run', sim: 'old-sim', week: 1, mode: 'hard', log: { runs: [[60, 0, 0]], picks: [], uses: [] } };
const valid = { ok: true, restart: true, entry: 'replacement-ticket', id: 4, week: 1, mode: 'hard' };
function harness(reply, { failWrite = false, saved = live } = {}) {
  const store = new Map([['sq-ranked-live', JSON.stringify(saved)], ['sq-ranked-entries', JSON.stringify([{ entry: 'other', id: 9, week: 1, mode: 'normal' }])]]);
  const messages = [], calls = [], submissions = [], resumed = [];
  const readRanked = (key, fallback = null) => JSON.parse(store.get(key) ?? 'null') ?? fallback;
  const writeRanked = (key, value) => { if (failWrite) throw new Error('fixture quota'); store.set(key, JSON.stringify(value)); };
  const api = async (base, route, body) => { calls.push({ route, body }); if (reply instanceof Error) throw reply; return reply; };
  const recover = Function('readRanked', 'writeRanked', 'rankedApi', 'messages', 'submissions', 'resumed', 'localStorage', `
    let rankedBusy = false;
    const cancelCloudLoads = () => {};
    const BASE = '/', SIM_ID = 'current-sim', rankedLive = () => readRanked('sq-ranked-live');
    const rankedMessage = message => messages.push(message), renderRanked = () => {};
    const $ = () => ({ querySelectorAll: () => [], replaceChildren() {}, classList: { remove() {} } });
    const why = e => e.message, plain = message => Object.assign(new Error(message), { plain: true });
    const RACE = { hard: { entryDmt: 1.5 } }, liveRace = saved => saved;
    const submitRanked = async () => { submissions.push({ busy: rankedBusy }); };
    const startRun = async saved => resumed.push(saved);
    ${action}
    ${recovery}
    return recoverRankedRun;
  `)(readRanked, writeRanked, api, messages, submissions, resumed, { removeItem: key => store.delete(key) });
  return { recover, readRanked, messages, calls, submissions, resumed };
}

for (const status of [undefined, 400, 409, 429, 500]) test(`restart failure ${status ?? 'offline'} preserves the saved run`, async () => {
  const d = harness(Object.assign(new Error('fixture restart failure'), { status }));
  await d.recover();
  assert.deepEqual(d.readRanked('sq-ranked-live'), live);
  assert.equal(d.readRanked('sq-ranked-entries').length, 1);
  assert.ok(d.messages.some(message => message.includes('fixture restart failure')));
  assert.ok(d.messages.every(message => !/refund|sent back/i.test(message)));
});

for (const [name, reply] of Object.entries({
  empty: {}, null: null, legacyRefund: { refund: true }, restartMissing: { ...valid, restart: undefined },
  restartTruthy: { ...valid, restart: 'yes' }, emptyEntry: { ...valid, entry: '' }, objectEntry: { ...valid, entry: {} },
  badId: { ...valid, id: 0 }, unsafeId: { ...valid, id: Number.MAX_SAFE_INTEGER + 1 },
  badWeek: { ...valid, week: -1 }, wrongWeek: { ...valid, week: 2 }, badMode: { ...valid, mode: 'nightmare' }, wrongMode: { ...valid, mode: 'normal' },
})) test(`malformed restart ${name} preserves the saved run and reports failure`, async () => {
  const d = harness(reply); await d.recover();
  assert.deepEqual(d.readRanked('sq-ranked-live'), live);
  assert.equal(d.readRanked('sq-ranked-entries').length, 1);
  assert.ok(d.messages.some(message => /saved|invalid|usable/i.test(message)));
  assert.ok(d.messages.every(message => !/refund|sent back/i.test(message)));
});

test('a valid restart clears the old log only after saving the replacement entry', async () => {
  const d = harness(valid); await d.recover();
  assert.equal(d.readRanked('sq-ranked-live'), null);
  assert.deepEqual(d.readRanked('sq-ranked-entries'), [{ entry: 'other', id: 9, week: 1, mode: 'normal' }, { entry: 'replacement-ticket', id: 4, week: 1, mode: 'hard' }]);
  assert.deepEqual(d.calls, [{ route: 'void', body: { run: live.run, log: live.log } }]);
});

test('failed replacement storage retains the original saved run', async () => {
  const d = harness(valid, { failWrite: true }); await d.recover();
  assert.deepEqual(d.readRanked('sq-ranked-live'), live);
  assert.equal(d.readRanked('sq-ranked-entries').length, 1);
});

test('send-it-instead fallback submits after the restart action releases its busy guard', async () => {
  const d = harness(Object.assign(new Error('that run ended: send it instead'), { status: 400 }));
  await d.recover();
  assert.deepEqual(d.submissions, [{ busy: false }]);
  assert.deepEqual(d.readRanked('sq-ranked-live'), live);
});

test('a saved run from the current simulation resumes without requesting a restart', async () => {
  const saved = { ...live, sim: 'current-sim' }, d = harness(null, { saved });
  await d.recover();
  assert.deepEqual(d.resumed, [saved]); assert.deepEqual(d.calls, []);
});

test('restart status messages translate in every supported non-English language', () => {
  for (const language of ['tr', 'es', 'fil']) for (const message of [
    'Game updated: restart your run',
    'The game changed during your run. Preparing your entry to start again…',
    'The ranked server did not return a valid restart entry. Your run is saved. Try again.',
  ]) assert.notEqual(translateText(message, language), message);
});
