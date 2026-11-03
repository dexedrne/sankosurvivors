// Ranked weekly DMT runs, server side. Off until SQS_RANKED=on. From week 1 there are two races each week, each with its
// own entry price, pot and board: Normal (0.5 DMT) and Hard (1.5 DMT, the same map on hard rules).
//   GET  /api/ranked-week                       this week's map, both races' pools and standings (public)
//   GET  /api/ranked-nonce?wallet=&mode=        a message for the wallet to sign before it pays (mode: normal | hard)
//   POST /api/ranked-enter {tx, signature, nonce}  checks the race's payment on Arbitrum, returns an entry ticket
//   POST /api/ranked-start {entry, adv}         reveals the run's seed and starts the clock (asking again, before the run
//                                               is sent, returns the same run: a lost answer never costs the entry)
//   POST /api/ranked-submit {run, name, log}    replays the run on the server; only what the inputs earned counts
//   POST /api/ranked-void {run}                 a run cut off by a game update (reloaded into a newer version) is refunded
// The entry fee goes to the ranked entry wallet. Per race: 10% is the house fee (sent on to the dev's wallet); 90% is the
// race's prize pool for the week, paid to its top 5 wallets (40/25/15/12/8) by the payout bot. The database serializes
// eligibility and run state changes.
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

// the ranked entry wallet: receives every entry fee; the house fee (10%) and the prizes (90%) are paid out from it by hand
const COLLECT = '0xa1e6E6EE71300C238935B7d59c8983B06e991Be0'.toLowerCase();
const DMT = '0x8B0E6f19Ee57089F7649A455D89D7bC6314D04e8'.toLowerCase();
const TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const ARB_RPCS = ['https://arb1.arbitrum.io/rpc', 'https://arbitrum-one-rpc.publicnode.com'];
const ENTRY_WEI = 500000000000000000n; // 0.5 DMT (18 decimals): the Normal race
// what each race's entry costs (18 decimals); the game checks the same amounts (src/ranked.js RANKED.races)
const RACES = { normal: { wei: ENTRY_WEI, dmt: '0.5', name: 'Normal' }, hard: { wei: 1500000000000000000n, dmt: '1.5', name: 'Hard' } };
const LEGACY_RUN_SECONDS = 960;        // week 0: 15-minute runs plus a little slack for the end screen
const LATE_SECONDS = 40 * 60;          // a run must be sent within its longest length + 40 minutes of its start (pauses, reloads)
const MAX_BODY = 4400000;              // a 2-hour run's input log (a bot's is 1.3 MB; Vercel's own request limit is 4.5 MB)
const MAX_PICKS = 4000;                // level-up choices, rerolls, skips and casket cards in one run (a bot's 2:00:00 run: 1148)

// Each game version's rules are kept (sims/<id>/: the bundled simulation + the world's walk data), and a run is checked
// with the version it was played on, so an update during the week never voids a paid run. sims/current.txt names the
// version new runs start on; the game sends its own id and is asked to update when it differs.
const SIMS = process.env.SQS_SIMS_DIR || path.join(__dirname, 'sims'), loaded = new Map(); // tests point SQS_SIMS_DIR at a build of the current code
const SIM_ID = /^[0-9a-f]{12}$/;
function currentSim() { try { return fs.readFileSync(path.join(SIMS, 'current.txt'), 'utf8').trim(); } catch { return null; } }
function load(id = currentSim()) {
  if (!id || !SIM_ID.test(id)) return null;
  if (!loaded.has(id)) {
    const dir = path.join(SIMS, id);
    if (!fs.existsSync(path.join(dir, 'ranked-bundle.cjs'))) return null;
    const game = require(path.join(dir, 'ranked-bundle.cjs'));
    loaded.set(id, { game, ground: game.unpackGround(fs.readFileSync(path.join(dir, 'ground.bin'))) });
  }
  return loaded.get(id);
}

// The Normal text is unchanged from before the Hard race, so payments signed then still check out on retry.
const enterMessage = (nonce, week, mode = 'normal') => mode === 'hard'
  ? `SankoQuest Survivors ranked\n\nSign to enter this week's Hard ranked race (week ${week}). Signing is free. Your wallet asks separately before sending the 1.5 DMT entry.\n\nNonce: ${nonce}`
  : `SankoQuest Survivors ranked\n\nSign to enter this week's ranked runs (week ${week}). Signing is free. Your wallet asks separately before sending the 0.5 DMT entry.\n\nNonce: ${nonce}`;
const modeOf = (x) => (x && x.m === 'hard' ? 'hard' : 'normal'); // tickets from before the Hard race are Normal
// the game version's rules for a week (older versions: one 15-minute Normal race)
const racesIn = (g, w) => (typeof g.racesOf === 'function' ? g.racesOf(w) : ['normal']);
const runSecondsIn = (g, w) => (typeof g.runSeconds === 'function' ? g.runSeconds(w) : LEGACY_RUN_SECONDS);

async function arb(method, params) {
  for (const url of ARB_RPCS) {
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'sankosurvivors/1.0' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
      const j = await r.json(); if (j && 'result' in j) return j.result;
    } catch { /* next */ }
  }
  throw new Error('arbitrum unavailable');
}

// The entry payment: a successful DMT Transfer from the player to the entry wallet, at least the race's price (the
// caller then needs exactly the price; more is owed back). Returns
// when it was mined; payments older than last week's start are not entries (or refunds) at all.
async function checkPayment(tx, from, sinceMs, mode = 'normal') {
  const race = RACES[mode];
  const r = await arb('eth_getTransactionReceipt', [tx]);
  if (!r) return { error: 'that payment is not on Arbitrum yet. Wait a few seconds and try again', retry: true };
  if (r.status !== '0x1') return { error: 'that payment failed on-chain' };
  const pad = (a) => '0x' + a.replace(/^0x/, '').toLowerCase().padStart(64, '0');
  let paid = 0n;
  for (const l of r.logs || []) {
    if (String(l.address).toLowerCase() !== DMT || !l.topics || l.topics[0] !== TRANSFER) continue;
    if (String(l.topics[1]).toLowerCase() !== pad(from) || String(l.topics[2]).toLowerCase() !== pad(COLLECT)) continue;
    paid += BigInt(l.data === '0x' ? 0 : l.data);
  }
  if (paid < race.wei) return { error: `that transaction did not send ${race.dmt} DMT from your wallet to the entry address` };
  const block = await arb('eth_getBlockByNumber', [r.blockNumber, false]);
  const at = block ? Number(BigInt(block.timestamp)) * 1000 : 0;
  if (!at) return { error: 'could not read when that payment was made, try again in a minute', retry: true };
  if (at < sinceMs) return { error: 'that payment is too old to be an entry' };
  return { paid, at };
}

function readBody(req) {
  return new Promise((ok) => {
    const parts = []; let n = 0, over = false;
    req.on('data', (c) => { if (over) return; n += c.length; if (n > MAX_BODY) { over = true; ok({ tooBig: true }); req.destroy(); } else parts.push(c); });
    req.on('end', () => { if (over) return; try { const b = JSON.parse(Buffer.concat(parts).toString('utf8') || '{}'); ok(b && typeof b === 'object' && !Array.isArray(b) ? b : {}); } catch { ok({}); } });
    req.on('error', () => { if (!over) ok({}); });
  });
}

const ADDR = /^0x[0-9a-f]{40}$/, TXH = /^0x[0-9a-f]{64}$/;
const ipHash = (ip, week, key) => crypto.createHmac('sha256', key).update(`ip|${week}|${ip}`).digest('hex').slice(0, 32);

// a sane log before spending CPU on it
function logShape(log, maxTicks) {
  if (!log || typeof log !== 'object' || log.v !== 1 || Object.keys(log).some(k => !['v', 'runs', 'uses', 'picks'].includes(k))) return 'bad log';
  const { runs, uses, picks } = log;
  if (!Array.isArray(runs) || !Array.isArray(uses) || !Array.isArray(picks)) return 'bad log';
  if (runs.length > maxTicks || uses.length > 20000 || picks.length > MAX_PICKS) return 'log too long';
  let ticks = 0;
  for (const r of runs) { if (!Array.isArray(r) || r.length !== 3 || !Number.isInteger(r[0]) || r[0] < 1 || !Number.isInteger(r[1]) || Math.abs(r[1]) > 100 || !Number.isInteger(r[2]) || Math.abs(r[2]) > 100) return 'bad input'; ticks += r[0]; }
  if (ticks > maxTicks) return 'run too long';
  let lastUse = -1;
  for (const u of uses) {
    if (!Array.isArray(u) || u.length !== 2 || !Number.isInteger(u[0]) || u[0] <= lastUse || u[0] >= ticks || !Number.isInteger(u[1]) || u[1] < 0 || u[1] > 4) return 'bad item use';
    lastUse = u[0];
  }
  for (const p of picks) if (![0, 1, 2, 'a', 'r', 's'].includes(p)) return 'bad choice';
  return null;
}

async function handle(route, req, res, ctx) {
  const { rpc, send, signed, unsign, recoverSigner, clean, ip, SERVER_KEY, TICKET_KEY } = ctx;
  const cur = currentSim(), sim = load(cur);
  if (!sim) return send(res, 503, { error: 'ranked runs open soon' });
  const g = sim.game, week = g.weekOf(), mapId = g.weekMap(week);
  if (route === 'ranked-week' && req.method === 'GET') {
    // each race's pot: 90% of what its entries paid this week (the previous week's unclaimed places roll over on top)
    const races = {};
    await Promise.all(racesIn(g, week).map(async (mode) => {
      const board = await rpc('sqs_ranked_board', { p_week: week, p_mode: mode }).catch(() => null);
      const entries = board && board.entries ? Number(board.entries) : 0;
      const paid = board && /^\d+$/.test(String(board.paid)) ? Number(BigInt(board.paid) / 1000000000000000n) / 1000 : entries * Number(RACES[mode].dmt);
      races[mode] = { mode, name: RACES[mode].name, entryDmt: RACES[mode].dmt, entries, poolDmt: Math.round(paid * (1 - g.RANKED.houseShare) * 1000) / 1000, rows: (board && board.rows) || [] };
    }));
    const kpm = typeof g.kpmWeek === 'function' && g.kpmWeek(week);
    // week 0 on an endless build: runs are endless and rank by time survived ('time'); 'classic' = the old 15:00 runs
    const timed = !kpm && typeof g.runSeconds === 'function' && g.runSeconds(week) > LEGACY_RUN_SECONDS;
    // the top-level fields are the Normal race, as before the Hard race (older pages read them)
    return send(res, 200, { open: process.env.SQS_RANKED === 'on', sim: cur, week, map: mapId, endsAt: g.weekStart(week + 1), entryDmt: races.normal.entryDmt, entries: races.normal.entries, poolDmt: races.normal.poolDmt, payouts: g.RANKED.payouts, maxEntries: g.RANKED.maxEntriesPerWallet, collect: COLLECT, rows: races.normal.rows,
      rules: kpm ? 'kpm' : timed ? 'time' : 'classic', minSeconds: kpm ? g.RANKED.minSeconds : 0, timeLimit: kpm || timed ? g.RANKED.timeLimit : 0, races }, 'public, s-maxage=15, stale-while-revalidate=30');
  }
  if (process.env.SQS_RANKED !== 'on') return send(res, 503, { error: 'ranked runs open soon' });

  if (route === 'ranked-nonce' && req.method === 'GET') {
    // checked before the player pays: entries left this week, and one wallet per player
    const q = new URL(req.url, 'http://x').searchParams;
    const wallet = String(q.get('wallet') || '').toLowerCase(), mode = String(q.get('mode') || 'normal');
    if (!ADDR.test(wallet)) return send(res, 400, { error: 'connect a wallet first' });
    if (!racesIn(g, week).includes(mode)) return send(res, 400, { error: 'that race is not open this week' });
    const can = await rpc('sqs_ranked_can_enter', { p_server_key: SERVER_KEY, p_wallet: wallet, p_week: week, p_ip_hash: ipHash(ip, week, TICKET_KEY), p_max: g.RANKED.maxEntriesPerWallet, p_mode: mode });
    if (!can || can.error) return send(res, 400, can || { error: 'could not check your entries' });
    // the race is part of the signed nonce: the payment is checked against that race's price and enters that race
    const nonce = signed({ k: 'rnonce', w: week, s: Date.now(), n: crypto.randomBytes(9).toString('base64url'), ...(mode === 'normal' ? {} : { m: mode }) });
    return send(res, 200, { nonce, message: enterMessage(nonce, week, mode), week, mode, left: can.left, collect: COLLECT, dmt: DMT, amountWei: RACES[mode].wei.toString(), chainId: 42161 });
  }

  if (route === 'ranked-enter' && req.method === 'POST') {
    // The game keeps {tx, nonce, signature} from the moment the wallet returns the payment and retries until this answers,
    // so a sign-in stays good for 8 days, a repeat of the same payment returns the same entry, and a valid payment that
    // cannot become an entry is written down as a refund the house owes.
    const b = await readBody(req); if (b.tooBig) return send(res, 413, { error: 'too big' });
    const n = unsign(b.nonce);
    if (!n || n.k !== 'rnonce' || (n.w !== week && n.w !== week - 1) || Date.now() - n.s > 8 * 24 * 3600 * 1000) return send(res, 400, { error: 'that sign-in expired, start again' });
    const mode = modeOf(n);
    const wallet = typeof b.signature === 'string' ? recoverSigner(enterMessage(b.nonce, n.w, mode), b.signature) : null;
    if (!wallet) return send(res, 400, { error: 'the signature did not check out' });
    const tx = typeof b.tx === 'string' ? b.tx.toLowerCase() : ''; if (!TXH.test(tx)) return send(res, 400, { error: 'bad transaction id' });
    const pay = await checkPayment(tx, wallet, g.weekStart(week - 1), mode);
    if (pay.error) return send(res, pay.retry ? 503 : 400, pay);
    if (pay.at < g.weekStart(week)) {
      const owe = await rpc('sqs_ranked_owe', { p_server_key: SERVER_KEY, p_tx: tx, p_wallet: wallet, p_week: week - 1, p_paid: pay.paid.toString(), p_reason: 'paid just before the weekly reset', p_mode: mode });
      if (!owe || owe.error) return send(res, 400, owe || { error: 'could not record that' });
      return send(res, 400, { error: `Your payment landed just before the weekly reset, so it could not count. Your ${RACES[mode].dmt} DMT will be sent back.`, refund: true });
    }
    // an entry costs exactly its race's price: more than that is not an entry, and the whole payment is owed back. (A
    // payment that already became an entry before this rule, answered 'already used', goes on to return that entry.)
    const over = pay.paid !== RACES[mode].wei
      ? await rpc('sqs_ranked_owe', { p_server_key: SERVER_KEY, p_tx: tx, p_wallet: wallet, p_week: week, p_paid: pay.paid.toString(), p_reason: `sent more than the ${RACES[mode].dmt} DMT entry`, p_mode: mode })
      : null;
    if (over && !(over.error === 'that payment was already used for an entry')) {
      if (over.error) return send(res, 400, over);
      return send(res, 400, { error: `That payment sent more than the ${RACES[mode].dmt} DMT ${RACES[mode].name} entry, so it could not count. All of it will be sent back.`, refund: true });
    }
    if (!racesIn(g, week).includes(mode)) {
      // a valid payment for a race that is not running (cannot happen with nonces from the game): owed back, never lost
      const owe = await rpc('sqs_ranked_owe', { p_server_key: SERVER_KEY, p_tx: tx, p_wallet: wallet, p_week: week, p_paid: pay.paid.toString(), p_reason: 'that race is not open this week', p_mode: mode });
      if (!owe || owe.error) return send(res, 400, owe || { error: 'could not record that' });
      return send(res, 400, { error: `That race is not open this week. Your ${RACES[mode].dmt} DMT will be sent back.`, refund: true });
    }
    const seed = crypto.randomInt(1, 2 ** 31 - 1);
    const out = await rpc('sqs_ranked_enter', { p_server_key: SERVER_KEY, p_tx: tx, p_wallet: wallet, p_week: week, p_ip_hash: ipHash(ip, week, TICKET_KEY), p_paid: pay.paid.toString(), p_seed: seed, p_max: g.RANKED.maxEntriesPerWallet, p_mode: mode });
    if (!out || out.error) return send(res, 400, out || { error: 'could not save the entry' });
    // a retried payment answers with the race it was first entered in
    const entryMode = out.mode === 'hard' ? 'hard' : out.mode === 'normal' ? 'normal' : mode;
    return send(res, 200, { entry: signed({ k: 'rentry', id: out.id, a: wallet, w: out.week || week, ...(entryMode === 'normal' ? {} : { m: entryMode }) }), id: out.id, wallet, week: out.week || week, mode: entryMode, left: out.left, again: !!out.again });
  }

  if (route === 'ranked-start' && req.method === 'POST') {
    const b = await readBody(req); if (b.tooBig) return send(res, 413, { error: 'too big' });
    const e = unsign(b.entry); if (!e || e.k !== 'rentry') return send(res, 400, { error: 'no entry' });
    if (e.w !== week) return send(res, 400, { error: 'that entry was for last week' });
    if (b.sim !== cur) return send(res, 409, { error: 'a new version of the game is out: tap Update, then start your run', sim: cur });
    const adv = typeof b.adv === 'string' ? b.adv : ''; if (!g.RANKED.advs.includes(adv)) return send(res, 400, { error: 'pick an adventurer' });
    const mode = modeOf(e);
    if (!racesIn(g, week).includes(mode)) return send(res, 400, { error: 'that race is not open this week' });
    const out = await rpc('sqs_ranked_start', { p_server_key: SERVER_KEY, p_id: e.id, p_wallet: e.a, p_adv: adv });
    if (!out || out.error) return send(res, 400, out || { error: 'could not start' });
    if (out.mode && out.mode !== mode) return send(res, 500, { error: 'server error: that entry is in another race. Your run was not used up; tell the dev' });
    const runAdv = typeof out.adv === 'string' ? out.adv : adv, started = Number(out.started) || Date.now(); // a repeat keeps the first start
    const run = signed({ k: 'rrun', id: e.id, a: e.a, w: week, seed: out.seed, adv: runAdv, v: cur, s: started, ...(mode === 'normal' ? {} : { m: mode }) });
    return send(res, 200, { run, seed: out.seed, map: mapId, adv: runAdv, week, mode, again: !!out.again });
  }

  if (route === 'ranked-submit' && req.method === 'POST') {
    const b = await readBody(req); if (b.tooBig) return send(res, 413, { error: 'that run log is too big' });
    const r = unsign(b.run); if (!r || r.k !== 'rrun') return send(res, 400, { error: 'no run' });
    const played = typeof r.v === 'string' ? load(r.v) : null; // the version this run was played on
    // the run's longest length comes from its own version and week: 15 minutes in week 0, the time limit from week 1
    const runMax = played ? runSecondsIn(played.game, r.w) : LEGACY_RUN_SECONDS;
    const real = (Date.now() - r.s) / 1000;
    if (real > runMax + LATE_SECONDS) return send(res, 400, { error: 'that run was sent too late' });
    const maxTicks = Math.ceil(runMax * 30);
    const shape = logShape(b.log, maxTicks); if (shape) return send(res, 400, { error: shape });
    if (!played) return send(res, 500, { error: 'server error: that game version is missing. Your run was not used up; tell the dev' });
    // claim the entry first, so a run is only ever replayed (and counted) once
    const claim = await rpc('sqs_ranked_claim', { p_server_key: SERVER_KEY, p_id: r.id, p_wallet: r.a });
    if (!claim || claim.error) return send(res, 400, claim || { error: 'that run was already sent' });
    // a log longer than the time since its start is refused before the (long, for endless runs) replay
    const logTicks = b.log.runs.reduce((n, x) => n + x[0], 0), early = real < (logTicks / 30) * 0.97 - 5;
    const result = early ? { t: 0, kills: 0, level: 0 } : played.game.replay(b.log, { seed: r.seed, mapId: played.game.weekMap(r.w), adv: r.adv, ground: played.ground, week: r.w, mode: modeOf(r) }, { maxTicks });
    let verdict = 'ok';
    if (early) verdict = 'rejected: faster than real time';
    else if (result.error) verdict = 'rejected: ' + result.error;
    else if (real < result.t * 0.97 - 5) verdict = 'rejected: faster than real time';
    const sha = crypto.createHash('sha256').update(JSON.stringify(b.log)).digest('hex');
    const ok = verdict === 'ok';
    const out = await rpc('sqs_ranked_finish', { p_server_key: SERVER_KEY, p_id: r.id, p_name: (typeof b.name === 'string' && clean(b.name, 16)) || 'Adventurer', p_t: ok ? result.t : 0, p_kills: ok ? result.kills : 0, p_level: ok ? result.level : 0, p_won: ok && result.won, p_verdict: verdict, p_log_sha: sha, p_log: ok ? zlib.gzipSync(JSON.stringify(b.log)).toString('base64') : null });
    if (!out || out.error) return send(res, 400, out || { error: 'could not save the run' });
    if (!ok) return send(res, 400, { error: 'this run did not check out (' + verdict.slice(10) + ')' });
    return send(res, 200, { ok: true, t: result.t, kills: result.kills, level: result.level, won: result.won, mode: modeOf(r), rank: out && out.rank });
  }
  if (route === 'ranked-void' && req.method === 'POST') {
    // only when the game really changed since this run started: a reload into the new version cannot finish it faithfully
    const b = await readBody(req); if (b.tooBig) return send(res, 413, { error: 'too big' });
    const r = unsign(b.run); if (!r || r.k !== 'rrun') return send(res, 400, { error: 'no run' });
    if (r.v === cur) return send(res, 400, { error: 'the game has not changed since this run started: resume it instead' });
    const out = await rpc('sqs_ranked_void', { p_server_key: SERVER_KEY, p_id: r.id, p_wallet: r.a, p_reason: `game updated during the run (${r.v} -> ${cur})` });
    if (!out || out.error) return send(res, 400, out || { error: 'could not record that' });
    return send(res, 200, { ok: true, refund: true });
  }
  return send(res, 404, { error: 'not found' });
}

module.exports = { handle, checkPayment, logShape, enterMessage, load, currentSim, COLLECT, ENTRY_WEI, RACES, LATE_SECONDS };
