// Offline SQL double. Keep this in step with ranked.sql; the optional PGlite
// conformance runner executes the same lifecycle against real PostgreSQL.
export class RankedDB {
  constructor() { this.rows = []; this.next = 1; this.finishError = null; }
  async rpc(fn, p) {
    const error = (error) => ({ error });
    const refund = (why) => ({ error: why + '. Your 0.5 DMT will be sent back.', refund: true });
    const wallet = p.p_wallet?.toLowerCase(), tx = p.p_tx?.toLowerCase(), week = p.p_week;
    const active = (w = week) => this.rows.filter(e => e.week === w && e.refund_reason == null);
    const used = (w = week) => active(w).filter(e => e.wallet === wallet).length;
    const sameIP = () => active().some(e => e.ip_hash === p.p_ip_hash && e.wallet !== wallet);
    const e = this.rows.find(e => e.id === p.p_id && (!wallet || e.wallet === wallet));
    const best = (w) => {
      const byScore = (a, b) => Number(b.won) - Number(a.won) || b.t - a.t || b.kills - a.kills || a.finished_at - b.finished_at || a.id - b.id;
      const rows = this.rows.filter(e => e.week === w && e.verdict === 'ok').sort(byScore);
      return rows.filter((e, i) => rows.findIndex(x => x.wallet === e.wallet) === i);
    };
    if (!['sqs_ranked_board', 'sqs_ranked_settle', 'sqs_ranked_log'].includes(fn) && p.p_server_key !== 'server-key') return error('forbidden');
    switch (fn) {
      case 'sqs_ranked_can_enter':
        if (sameIP()) return error('one wallet per player each week: this connection already entered with another wallet');
        if (used() >= p.p_max) return error(`you have used all ${p.p_max} ranked entries this week`);
        return { ok: true, left: p.p_max - used() };
      case 'sqs_ranked_enter': {
        if (!/^0x[0-9a-f]{64}$/.test(tx) || !/^0x[0-9a-f]{40}$/.test(wallet) || p.p_paid == null || BigInt(p.p_paid) <= 0n) return error('bad entry');
        const prev = this.rows.find(e => e.tx === tx);
        if (prev) {
          if (prev.wallet !== wallet) return error('that payment was already used for an entry');
          if (prev.refund_reason != null) return refund(prev.refund_reason);
          return { ok: true, id: prev.id, week: prev.week, again: true, left: p.p_max - used(prev.week) };
        }
        const why = sameIP() ? 'one wallet per player each week' : used() >= p.p_max ? `all ${p.p_max} entries used this week` : null;
        const left = p.p_max - used() - 1;
        const row = { id: this.next++, week, wallet, tx, paid: p.p_paid, ip_hash: p.p_ip_hash, seed: p.p_seed, refund_reason: why, created_at: Date.now() };
        this.rows.push(row);
        return why ? refund(why) : { ok: true, id: row.id, left };
      }
      case 'sqs_ranked_owe':
        if (!/^0x[0-9a-f]{64}$/.test(tx) || !/^0x[0-9a-f]{40}$/.test(wallet)) return error('bad entry');
        if (this.rows.some(e => e.tx === tx && (e.wallet !== wallet || e.refund_reason == null))) return error('that payment was already used for an entry');
        if (!this.rows.some(e => e.tx === tx)) this.rows.push({ id: this.next++, week, wallet, tx, paid: p.p_paid, ip_hash: '', seed: 0, refund_reason: p.p_reason.slice(0, 120) });
        return { ok: true };
      case 'sqs_ranked_start':
        if (!/^[a-z]{2,16}$/.test(p.p_adv)) return error('bad adventurer');
        if (!e || e.refund_reason != null) return error('that entry was already used');
        if (e.started_at != null) { // a repeat before the run is sent: the same run (its first answer got lost)
          if (e.claimed_at != null) return error('that entry was already used');
          return { ok: true, seed: e.seed, adv: e.adv, started: e.started_at, again: true };
        }
        Object.assign(e, { started_at: Date.now(), adv: p.p_adv });
        return { ok: true, seed: e.seed, adv: e.adv, started: e.started_at };
      case 'sqs_ranked_claim':
        if (!e || e.started_at == null || e.claimed_at != null) return error('that run was already sent');
        e.claimed_at = Date.now(); return { ok: true };
      case 'sqs_ranked_finish': {
        if (this.finishError) return error(this.finishError);
        if (!e || e.claimed_at == null || e.finished_at != null) return error('that run was already sent');
        Object.assign(e, { finished_at: Date.now(), name: p.p_name.replace(/[\x00-\x1f<>]/g, '').trim().slice(0, 16) || 'Adventurer', t: p.p_t, kills: p.p_kills, level: p.p_level, won: p.p_won ?? false, verdict: p.p_verdict.slice(0, 120), log_sha: p.p_log_sha, log: p.p_verdict === 'ok' ? p.p_log : null });
        const rank = best(e.week).findIndex(b => b.wallet === e.wallet) + 1 || null;
        const keep = new Set([e.week - 1, e.week].flatMap(w => best(w).slice(0, 10).map(x => x.id)));
        this.rows.filter(x => x.week <= e.week && !keep.has(x.id)).forEach(x => { x.log = null; });
        return { ok: true, rank };
      }
      case 'sqs_ranked_void':
        if (!e || e.started_at == null || e.claimed_at != null) return error('that run was already sent');
        Object.assign(e, { claimed_at: Date.now(), finished_at: Date.now(), verdict: 'void', refund_reason: p.p_reason.slice(0, 120) });
        return { ok: true };
      case 'sqs_ranked_board':
        return { entries: active().length, rows: best(week).slice(0, 25).map(({ name, wallet, t, kills, level, won, adv, finished_at }) => ({ name, wallet, t, kills, level, won, adv, at: finished_at })) };
      case 'sqs_ranked_settle':
        if (p.p_key !== 'reports-key') return error('forbidden');
        return { week, entries: active().length, paid: active().reduce((n, e) => n + BigInt(e.paid), 0n).toString(), top: best(week).slice(0, 10).map(({ id, name, wallet, t, kills, level, won, adv, log_sha }) => ({ id, name, wallet, t, kills, level, won, adv, log_sha })), refunds: this.rows.filter(e => e.week === week && e.refund_reason != null).map(e => ({ wallet: e.wallet, tx: e.tx, paid: e.paid, why: e.refund_reason })), rejected: this.rows.filter(e => e.week === week && e.verdict?.startsWith('rejected')).length, wallets: new Set(active().map(e => e.wallet)).size };
      case 'sqs_ranked_log':
        if (p.p_key !== 'reports-key') return error('forbidden');
        return e ? Object.fromEntries(['id', 'week', 'wallet', 'seed', 'adv', 'name', 't', 'kills', 'level', 'won', 'log_sha', 'log'].map(k => [k, e[k] ?? null])) : null;
      default: throw new Error(`unimplemented RPC ${fn}`);
    }
  }
}
