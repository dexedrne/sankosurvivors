import test from 'node:test';
import assert from 'node:assert/strict';
import { compareRuns } from '../src/ranked.js';

const epoch = Date.UTC(2026, 10, 3);
const row = (id, finished_at, extra = {}) => ({ id, t: 180, kills: 180, finished_at, ...extra });
const ordered = (week, rows) => [...rows].sort(compareRuns(week)).map(r => r.id);

for (const week of [0, 1]) {
  test(`week ${week}: ISO finishes precede ID on a score tie`, () => {
    assert.deepEqual(ordered(week, [row(2, '2026-11-03T00:00:00Z'), row(1, '2026-11-03T00:01:00Z')]), [2, 1]);
  });

  test(`week ${week}: PostgreSQL fractions from zero to six digits keep their order`, () => {
    const fractions = ['', '.1', '.12', '.123', '.1234', '.12345', '.123456'];
    const rows = fractions.map((fraction, i) => row(7 - i, `2026-11-03 00:00:00${fraction}+00`));
    assert.deepEqual(ordered(week, rows.reverse()), [7, 6, 5, 4, 3, 2, 1]);
  });

  test(`week ${week}: the final three PostgreSQL fraction digits are not discarded`, () => {
    assert.deepEqual(ordered(week, [row(1, '2026-11-03T00:00:00.123456Z'), row(2, '2026-11-03T00:00:00.123455Z')]), [2, 1]);
  });

  test(`week ${week}: offsets and numeric epoch milliseconds share one timestamp order`, () => {
    const rows = [
      row(1, '2026-11-03T05:30:00.123001+05:30'),
      row(2, epoch + 123),
      row(3, '2026-11-02T19:00:00.122999-05:00'),
      row(4, '2026-11-03 00:00:00.122998+0000'),
    ];
    assert.deepEqual(ordered(week, rows), [4, 3, 2, 1]);
  });

  test(`week ${week}: equivalent ISO spellings use ID only after the exact timestamp ties`, () => {
    assert.deepEqual(ordered(week, [
      row(3, '2026-11-03T00:00:00.123400Z'),
      row(2, '2026-11-03 05:30:00.1234+05:30'),
      row(1, '2026-11-02T19:00:00.123400-0500'),
    ]), [1, 2, 3]);
  });

  test(`week ${week}: existing numeric fixtures, numeric strings and at precedence remain compatible`, () => {
    assert.deepEqual(ordered(week, [
      row(1, 10), row(2, '9'), row(3, epoch, { at: 0 }), row(4, -1),
    ]), [4, 3, 2, 1]);
    assert.deepEqual(ordered(week, [row(2, epoch), row(1, epoch)]), [1, 2]);
  });

  test(`week ${week}: missing or invalid timestamps retain the zero fallback`, () => {
    assert.deepEqual(ordered(week, [
      row(4, 'not-a-date'), row(2, undefined), row(3, '2026-13-03T00:00:00Z'), row(1, 1),
    ]), [2, 3, 4, 1]);
  });

  test(`week ${week}: impossible calendar dates use zero while a real leap day stays valid`, () => {
    assert.deepEqual(ordered(week, [
      row(1, '2024-02-29T00:00:00.000001Z'),
      row(2, '2026-02-30T00:00:00Z'),
      row(3, '2026-02-29T00:00:00Z'),
      row(4, undefined),
    ]), [2, 3, 4, 1]);
  });

  test(`week ${week}: score still takes precedence over timestamp and ID`, () => {
    assert.deepEqual(ordered(week, [
      row(1, '2026-11-03T00:00:00Z'), row(2, '2026-11-04T00:00:00Z', { kills: 181 }),
    ]), [2, 1]);
  });
}
