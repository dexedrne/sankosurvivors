// Offline SQL double. Keep this in step with ranked.sql; the optional PGlite
// conformance runner executes the same lifecycle against real PostgreSQL.
// Its ranking is src/ranked.js compareRuns (the game's own rule); test/ranked-sql.test.mjs checks SQL agrees.
import { compareRuns } from '../../src/ranked.js';
import { dmtText } from '../../src/prize-display.js';
const MODES = ['normal', 'hard'];
export class RankedDB {
  constructor() { this.rows = []; this.next = 1; this.finishError = null; }
  async rpc(fn, p) {
    const error = (error) => ({ error });
    const mode = p.p_mode ?? 'normal';
    const refund = (why, paid = p.p_paid) => ({ error: why + `. Your ${dmtText(String(paid))} DMT will be sent back.`, refund: true });
    const wallet = p.p_wallet?.toLowerCase(), tx = p.p_tx?.toLowerCase(), week = p.p_week;
    const active = (w = week, m = null) => this.rows.filter(e => e.week === w && e.refund_reason == null && (m == null || e.mode === m));
    const used = (w = week, m = mode) => active(w, m).filter(e => e.wallet === wallet).length;
    const sameIP = () => active().some(e => e.ip_hash === p.p_ip_hash && e.wallet !== wallet); // across both races
    const e = this.rows.find(e => e.id === p.p_id && (!wallet || e.wallet === wallet));
    const raceOk = (m, w) => MODES.includes(m) && !(m === 'hard' && w < 1);
    const best = (w, m = mode) => {
      const rows = this.rows.filter(e => e.week === w && e.mode === m && e.verdict === 'ok').sort(compareRuns(w));
      return rows.filter((e, i) => rows.findIndex(x => x.wallet === e.wallet) === i);
    };
    const hard = (m) => (m === 'hard' ? 'Hard ' : '');
    if (!['sqs_ranked_board', 'sqs_ranked_settle', 'sqs_ranked_log'].includes(fn) && p.p_server_key !== 'server-key') return error('forbidden');
    switch (fn) {
      // Rate windows are exercised against real PostgreSQL; API fixtures can inject a blocked connection.
      case 'sqs_ranked_receipt_gate': return this.receiptBlocked ? error('slow down') : {ok:true};
      case 'sqs_ranked_can_enter':
        if (!raceOk(mode, week)) return error('no such race this week');
        if (sameIP()) return error('one wallet per player each week: this connection already entered with another wallet');
        if (used() >= p.p_max) return error(`you have used all ${p.p_max} ${hard(mode)}ranked entries this week`);
        return { ok: true, left: p.p_max - used() };
      case 'sqs_ranked_enter': {
        if (!/^0x[0-9a-f]{64}$/.test(tx) || !/^0x[0-9a-f]{40}$/.test(wallet) || p.p_paid == null || BigInt(p.p_paid) <= 0n || !raceOk(mode, week)) return error('bad entry');
        const prev = this.rows.find(e => e.tx === tx);
        if (prev) {
          if (prev.wallet !== wallet) return error('that payment was already used for an entry');
          if (prev.refund_reason != null) return refund(prev.refund_reason, prev.paid);
          return { ok: true, id: prev.id, week: prev.week, mode: prev.mode, again: true, left: p.p_max - used(prev.week, prev.mode) };
        }
        const why = sameIP() ? 'one wallet per player each week' : used() >= p.p_max ? `all ${p.p_max} ${hard(mode)}entries used this week` : null;
        const left = p.p_max - used() - 1;
        const row = { id: this.next++, week, mode, wallet, tx, paid: p.p_paid, ip_hash: p.p_ip_hash, seed: p.p_seed, refund_reason: why, created_at: Date.now() };
        this.rows.push(row);
        return why ? refund(why) : { ok: true, id: row.id, mode, left };
      }
      case 'sqs_ranked_owe':
        if (!/^0x[0-9a-f]{64}$/.test(tx) || !/^0x[0-9a-f]{40}$/.test(wallet) || !MODES.includes(mode)) return error('bad entry');
        if (this.rows.some(e => e.tx === tx && (e.wallet !== wallet || e.refund_reason == null))) return error('that payment was already used for an entry');
        if (!this.rows.some(e => e.tx === tx)) this.rows.push({ id: this.next++, week, mode, wallet, tx, paid: p.p_paid, ip_hash: '', seed: 0, refund_reason: p.p_reason.slice(0, 120) });
        // update8.sql: a payment over 100 DMT is recorded too, for the owner to review (the SQL also says review: false)
        return BigInt(p.p_paid) > 10n ** 20n ? { ok: true, review: true } : { ok: true };
      case 'sqs_ranked_start':
        if (!/^[a-z]{2,16}$/.test(p.p_adv)) return error('bad adventurer');
        if (!e || e.refund_reason != null) return error('that entry was already used');
        if (e.started_at != null) { // a repeat before the run is sent: the same run (its first answer got lost)
          if (e.claimed_at != null) return error('that entry was already used');
          return { ok: true, seed: e.seed, adv: e.adv, mode: e.mode, started: e.started_at, again: true };
        }
        Object.assign(e, { started_at: Date.now(), adv: p.p_adv });
        return { ok: true, seed: e.seed, adv: e.adv, mode: e.mode, started: e.started_at };
      case 'sqs_ranked_claim':
        if (!e || e.started_at == null || e.claimed_at != null) return error('that run was already sent');
        e.claimed_at = Date.now(); return { ok: true };
      case 'sqs_ranked_claim_v2':
        if (!e || e.started_at == null || e.started_at !== p.p_started || e.refund_reason != null || !/^[a-f0-9]{64}$/.test(p.p_log_sha || '') || !p.p_attempt || (e.submit_sha != null && e.submit_sha !== p.p_log_sha)) return error('that run was already sent');
        if (e.finished_at != null) return e.submit_result && e.submit_sha === p.p_log_sha ? { result:e.submit_result } : error('that run was already sent');
        if (e.claimed_at != null && e.submit_sha == null) return error('an older submission is in progress: tell the dev if it does not finish');
        if (e.submit_sha == null && p.p_allow_claim !== true) return error('that run was sent too late');
        if (e.submit_until > Date.now()) return { busy:true };
        Object.assign(e,{claimed_at:e.claimed_at ?? Date.now(),submit_sha:p.p_log_sha,submit_attempt:p.p_attempt,submit_until:Date.now()+900000});
        return {ok:true,received:Math.round(e.claimed_at)};
      case 'sqs_ranked_release_v2':
        if (e && e.started_at === p.p_started && e.submit_sha === p.p_log_sha && e.submit_attempt === p.p_attempt && e.finished_at == null) e.submit_until=Date.now();
        return {ok:true};
      case 'sqs_ranked_finish_v2': {
        if (!e || e.started_at !== p.p_started || e.submit_sha !== p.p_log_sha || e.submit_attempt !== p.p_attempt) return error('that run was already sent');
        if (e.submit_result) return e.submit_result;
        const out = await this.rpc('sqs_ranked_finish',p);
        if (!out || out.error) return out;
        e.submit_result={ok:true,t:e.t,kills:e.kills,level:e.level,won:e.won,mode:e.mode,rank:out.rank,verdict:e.verdict}; e.submit_until=null;
        return e.submit_result;
      }
      case 'sqs_ranked_finish': {
        if (this.finishError) return error(this.finishError);
        if (!e || e.claimed_at == null || e.finished_at != null) return error('that run was already sent');
        Object.assign(e, { finished_at: Date.now(), name: p.p_name.replace(/[\x00-\x1f<>]/g, '').trim().slice(0, 16) || 'Adventurer', t: p.p_t, kills: p.p_kills, level: p.p_level, won: p.p_won ?? false, verdict: p.p_verdict.slice(0, 120), log_sha: p.p_log_sha, log: p.p_verdict === 'ok' ? p.p_log : null });
        const rank = best(e.week, e.mode).findIndex(b => b.wallet === e.wallet) + 1 || null;
        const keep = new Set([e.week - 1, e.week].flatMap(w => MODES.flatMap(m => best(w, m).slice(0, 10).map(x => x.id))));
        this.rows.filter(x => x.week <= e.week && !keep.has(x.id)).forEach(x => { x.log = null; });
        return { ok: true, rank };
      }
      case 'sqs_ranked_restart': // update7.sql, bound to the entry's current start by update8.sql (p_started)
        if (!e) return error('that run was already sent');
        if ((e.restarts || 0) >= 3) return error('this entry was restarted 3 times already: tell the dev');
        if (e.started_at == null || e.claimed_at != null || e.refund_reason != null) return error('that run was already sent');
        if (p.p_started != null && e.started_at !== Number(p.p_started)) return error('that run was already sent');
        Object.assign(e, { started_at: null, seed: Number(p.p_seed), restarts: (e.restarts || 0) + 1 });
        return { ok: true, week: e.week, mode: e.mode };
      case 'sqs_ranked_void':
        if (!e || e.started_at == null || e.claimed_at != null) return error('that run was already sent');
        Object.assign(e, { claimed_at: Date.now(), finished_at: Date.now(), verdict: 'void', refund_reason: p.p_reason.slice(0, 120) });
        return { ok: true };
      case 'sqs_ranked_board':
        return { mode, entries: active(week, mode).length, paid: active(week, mode).reduce((n, e) => n + BigInt(e.paid), 0n).toString(), rows: best(week).slice(0, 25).map(({ name, wallet, t, kills, level, won, adv, finished_at }) => ({ name, wallet, t, kills, level, won, adv, at: finished_at })) };
      case 'sqs_ranked_settle':
        if (p.p_key !== 'reports-key') return error('forbidden');
        return { week, mode, rules: week >= 1 ? 'kpm' : 'classic', entries: active(week, mode).length, paid: active(week, mode).reduce((n, e) => n + BigInt(e.paid), 0n).toString(), top: best(week).slice(0, 10).map(({ id, name, wallet, t, kills, level, won, adv, log_sha }) => ({ id, name, wallet, t, kills, level, won, adv, log_sha })), refunds: this.rows.filter(e => e.week === week && e.mode === mode && e.refund_reason != null).map(e => ({ wallet: e.wallet, tx: e.tx, paid: e.paid, why: e.refund_reason })), rejected: this.rows.filter(e => e.week === week && e.mode === mode && e.verdict?.startsWith('rejected')).length, wallets: new Set(active(week, mode).map(e => e.wallet)).size };
      case 'sqs_ranked_log':
        if (p.p_key !== 'reports-key') return error('forbidden');
        return e ? Object.fromEntries(['id', 'week', 'mode', 'wallet', 'seed', 'adv', 'name', 't', 'kills', 'level', 'won', 'log_sha', 'log'].map(k => [k, e[k] ?? null])) : null;
      default: throw new Error(`unimplemented RPC ${fn}`);
    }
  }
}
