#!/usr/bin/env node
// Before a week's prizes are paid: each race's top 5 with input statistics, so bot or tool-assisted runs can be held with hold.mjs.
// Read-only (reports key): node tools/payout/review.mjs <week> [--env /path/payout.env]
import { gunzipSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';
import { loadConfig, DEFAULT_ENV } from './config.mjs';
import { database } from './ports.mjs';
import { NO_PRIZE } from './core.mjs';
import { address } from './crypto.mjs';
import { placeable } from '../../src/ranked.js';
// log.runs is [ticks, x, z] per held stick/key input (src/ranked.js RunRecorder). A flag means watch the run, never an
// automatic reject: gamepads also produce many input changes.
export function stats(log) {
  const ticks = log.runs.reduce((n, r) => n + r[0], 0), n = log.runs.length;
  const dirs = new Set(log.runs.map((r) => r[1] + ',' + r[2])).size, short = log.runs.filter((r) => r[0] <= 2).length;
  const rate = ticks ? n / ticks : 0;
  return { ticks, rate, dirs, short: n ? short / n : 0, flag: rate > 0.3 || dirs > 200 || short > n / 2 };
}
// player names reach the owner's terminal: no control characters (C0 or C1, which some terminals act on)
const safe = (v) => String(v ?? '').replace(/[\x00-\x1f\x7f-\x9f]/g, '?').slice(0, 42);
export async function main(args = process.argv.slice(2), deps = {}) {
  const [week, opt, envPath, ...rest] = args;
  if (!/^\d+$/.test(week ?? '') || (opt && (opt !== '--env' || !envPath)) || rest.length) throw Error('usage: review.mjs <week> [--env /path/payout.env]');
  const config = deps.config ?? await loadConfig(envPath ?? DEFAULT_ENV), db = deps.db ?? database(config), out = [];
  for (const mode of ['normal', 'hard']) {
    const s = await db('sqs_ranked_settle', { p_key: config.reportsKey, p_week: Number(week), p_mode: mode });
    if (s.error) throw Error('settle refused');
    // the five who would be paid, as makePlan picks them: the developer's wallet and (from week 1) runs under 3:00 never win
    const winners = (s.top || []).filter((w) => !NO_PRIZE.has(address(w.wallet)) && placeable(Number(week), w));
    const review=winners.slice(0,5);
    if(Number(week)>=1){
      if(!Array.isArray(s.activity_runs))throw Error('participation review unavailable');
      for(const row of s.activity_runs)if(!review.some(r=>String(r.id)===String(row.id)))review.push(row);
    }
    for (const [i, row] of review.entries()) {
      const e = await db('sqs_ranked_log', { p_key: config.reportsKey, p_id: Number(row.id) });
      if (!e || !e.log) { out.push(`${mode} #${i + 1} id ${safe(row.id)} ${safe(row.wallet)}: no log  << REVIEW`); continue; }
      const st = stats(JSON.parse(gunzipSync(Buffer.from(e.log, 'base64'))));
      out.push(`${mode} #${i + 1} id ${safe(row.id)} ${safe(row.wallet)} "${safe(row.name)}": ${safe(row.t)}s ${safe(row.kills)} kills | ${st.rate.toFixed(3)} input changes/tick, ${st.dirs} directions, ${(st.short * 100).toFixed(0)}% 1-2 tick inputs${st.flag ? '  << REVIEW' : ''}`);
    }
  }
  for (const l of out) console.log(l);
  return out;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((e) => { console.error('Review failed: ' + e.message); process.exitCode = 1; });
