// Ranked weekly DMT runs, server side. Off until SQS_RANKED=on. From week 1 there are two races each week, each with its
// own entry price, pot and board. New entries are Standard only:0.5DMT in week0, then optional1/10DMT into the same pool.
//   GET  /api/ranked-week                       this week's map, both races' pools and standings (public)
//   GET  /api/ranked-nonce?wallet=&mode=        a message for the wallet to sign before it pays (mode: normal | hard)
//   POST /api/ranked-enter {tx, signature, nonce}  checks the race's payment on Arbitrum, returns an entry ticket
//   POST /api/ranked-start {entry, adv}         reveals the run's seed and starts the clock (asking again, before the run
//                                               is sent, returns the same run: a lost answer never costs the entry)
//   POST /api/ranked-submit {run, name, log}    replays the run on the server; only what the inputs earned counts
//   POST /api/ranked-void {run}                 an interrupted run restarts; closed admission records an owed refund
// The entry fee goes to the ranked entry wallet. Per race: 10% is the house fee (sent on to the dev's wallet); 90% is the
// race's prize pool. Week0 pays top5; current week1+ policy pays80%placing,10%eligible DMT and10%active seconds. The database serializes
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
// Legacy prices for old bundles; current prices come from the shared game's raceForWeek.
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
function currentClient(sim) {
  try {
    const client = JSON.parse(fs.readFileSync(path.join(SIMS, 'client.json'), 'utf8'));
    if (typeof client?.build === 'string' && /^[A-Za-z0-9+._-]{1,80}$/.test(client.build) && client.build !== 'dev' && SIM_ID.test(client.sim) && client.sim === sim) return {build:client.build, sim:client.sim};
  } catch {}
  return null;
}
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

function raceIn(g, week, mode, tier = 'standard') {
  const race = typeof g?.entryForWeek === 'function' ? g.entryForWeek(week,mode,tier) : tier === 'standard' ? g?.raceForWeek?.(week, mode) : null;
  if(tier!=='standard'&&!race)return null;
  return race ? { ...race, wei: BigInt(race.entryWei), dmt: race.entryDmt } : RACES[mode];
}
const dmtAmount = wei => load().game.dmtText(String(wei));
// Week0 text stays byte-identical so saved signatures keep checking out.
const enterMessage = (nonce, week, mode = 'normal', deadline, tier = 'standard') => {
  const game=load()?.game;
  if(typeof game?.entryMessage==='function')return game.entryMessage(nonce,week,mode,deadline,tier);
  if(tier!=='standard')return null;
  const price = raceIn(load()?.game, week, mode).dmt;
  const message = mode === 'hard'
    ? `SankoQuest Survivors ranked\n\nSign to enter this week's Hard ranked race (week ${week}). Signing is free. Your wallet asks separately before sending the ${price} DMT entry.\n\nNonce: ${nonce}`
    : `SankoQuest Survivors ranked\n\nSign to enter this week's ranked runs (week ${week}). Signing is free. Your wallet asks separately before sending the ${price} DMT entry.\n\nNonce: ${nonce}`;
  return Number.isSafeInteger(deadline) ? message + `\n\nI acknowledge this run stops at ${new Date(deadline).toISOString()} and keeps the score earned by then.` : message;
};
const tierOf = x => x?.h===1?'high':'standard';
const modeOf = (x) => (x && x.m === 'hard' ? 'hard' : 'normal'); // tickets from before the Hard race are Normal
// the game version's rules for a week (older versions: one 15-minute Normal race)
const racesIn = (g, w) => (typeof g.entryRacesOf === 'function' ? g.entryRacesOf(w) : ['normal']);
const runSecondsIn = (g, w) => (typeof g.runSeconds === 'function' ? g.runSeconds(w) : LEGACY_RUN_SECONDS);

async function arb(method, params) {
  for (const url of ARB_RPCS) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(10000), method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'sankosurvivors/1.0' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
      const j = await r.json(); if (j && 'result' in j) return j.result;
    } catch { /* next */ }
  }
  throw new Error('arbitrum unavailable');
}

// The entry payment: a successful DMT Transfer from the player to the entry wallet, at least the race's price (the
// caller then needs exactly the price; more is owed back). Returns
// when it was mined; payments older than last week's start are not entries (or refunds) at all.
async function checkPayment(tx, from, sinceMs, mode = 'normal', race = RACES[mode]) {
  const r = await arb('eth_getTransactionReceipt', [tx]);
  if (!r) return { error: 'that payment is not on Arbitrum yet. Wait a few seconds and try again', retry: true };
  const pending = { error: 'could not verify that payment on Arbitrum yet. Wait a few seconds and try again', retry: true };
  const hash = value => typeof value === 'string' && TXH.test(value.toLowerCase()) ? value.toLowerCase() : null;
  const quantity = value => typeof value === 'string' && /^0x(?:0|[1-9a-f][0-9a-f]{0,63})$/i.test(value);
  if (hash(r.transactionHash) !== tx || !hash(r.blockHash) || !quantity(r.blockNumber) || !['0x0', '0x1'].includes(r.status) || !Array.isArray(r.logs) || r.logs.some(l => !l || typeof l !== 'object' || l.removed === true)) return pending;
  const block = await arb('eth_getBlockByNumber', [r.blockNumber, false]);
  if (!block || hash(block.hash) !== hash(r.blockHash) || !quantity(block.number) || BigInt(block.number) !== BigInt(r.blockNumber) || !quantity(block.timestamp)) return pending;
  const at = Number(BigInt(block.timestamp)) * 1000;
  if (!Number.isSafeInteger(at) || at <= 0) return pending;
  const pad = (a) => '0x' + a.replace(/^0x/, '').toLowerCase().padStart(64, '0');
  let paid = 0n; const indices = new Set();
  for (const l of r.logs) {
    if (typeof l.address !== 'string' || !/^0x[0-9a-f]{40}$/i.test(l.address) || !Array.isArray(l.topics) || l.topics.length > 4 || !l.topics.every(hash) || typeof l.data !== 'string' || !/^0x(?:[0-9a-f]{2})*$/i.test(l.data)) return pending;
    if (r.status === '0x0' && l.address.toLowerCase() === DMT) return pending;
    if (l.address.toLowerCase() !== DMT || hash(l.topics[0]) !== TRANSFER) continue;
    if (l.topics.length !== 3 || !l.topics.slice(1).every(hash) || typeof l.data !== 'string' || !/^0x[0-9a-f]{64}$/i.test(l.data) || hash(l.transactionHash) !== tx || hash(l.blockHash) !== hash(r.blockHash) || !quantity(l.blockNumber) || BigInt(l.blockNumber) !== BigInt(r.blockNumber) || !quantity(l.logIndex)) return pending;
    const index = BigInt(l.logIndex);
    if (indices.has(index)) return pending;
    indices.add(index);
    if (hash(l.topics[1]) !== pad(from) || hash(l.topics[2]) !== pad(COLLECT)) continue;
    paid += BigInt(l.data);
  }
  // An unrelated or contradictory reverted receipt must not erase payment recovery.
  if (r.status === '0x0') return { error: 'that payment failed on-chain' };
  if (paid < race.wei) return { error: `that transaction did not send ${race.dmt} DMT from your wallet to the entry address` };
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
  for (const p of picks) if (![0, 1, 2, 'a', 'r', 's', 'b0', 'b1', 'b2'].includes(p)) return 'bad choice';
  return null;
}

async function handle(route, req, res, ctx) {
  const { rpc, send, signed, unsign, recoverSigner, clean, ip, SERVER_KEY, TICKET_KEY } = ctx;
  const cur = currentSim(), sim = load(cur);
  if (!sim) return send(res, 503, { error: 'ranked runs open soon' });
  const g = sim.game, week = g.weekOf(), mapId = g.weekMap(week);
  const policy = g.clockPolicy(week), serverNow = Date.now();
  const unavailable = {error:'Could not verify the latest game version. Reconnect and try again before entering ranked.'};
  function admit(claim) {
    const client = currentClient(cur);
    if (!client) { send(res, 503, unavailable); return false; }
    if (claim.build !== client.build || claim.sim !== client.sim) {
      send(res, 409, {error:'Update the game before entering or starting ranked. Your saved payments and runs are kept.', update:true, ...client}); return false;
    }
    return true;
  }
  if (route === 'ranked-version' && req.method === 'GET') {
    const client = currentClient(cur);
    return send(res, client ? 200 : 503, client || unavailable, 'no-store');
  }
  if (route === 'ranked-week' && req.method === 'GET') {
    const races = {};
    try {
      await Promise.all(racesIn(g, week).map(async (mode) => {
        const price = raceIn(g, week, mode);
        const board = await rpc('sqs_ranked_board_v2', { p_week: week, p_mode: mode });
        const units = value => typeof value === 'string' && /^(0|[1-9]\d{0,77})$/.test(value) && BigInt(value) < 1n << 256n;
        if (!board || board.error || !units(board.paid) || !Number.isSafeInteger(board.entries) || board.entries < 0 || !Array.isArray(board.rows)) throw Error('pool unavailable');
        const activity=[] , seenActivity=new Set();
        if (week >= 1) {
          if (board.reward_version!==2 || !Array.isArray(board.activity)) throw Error('activity unavailable');
          for (const row of board.activity) {
            if (!row || !/^0x[0-9a-f]{40}$/.test(row.wallet) || /^0x0{40}$/.test(row.wallet) || row.wallet==='0x9d506ba29843a232409d85e289edece8d6a7b452' || seenActivity.has(row.wallet) || !units(row.runs) || !units(row.seconds) || BigInt(row.runs)<=0n || BigInt(row.seconds)<30n*BigInt(row.runs) || !units(row.paid) || BigInt(row.paid)<=0n) throw Error('invalid activity');
            seenActivity.add(row.wallet);activity.push({wallet:row.wallet,runs:row.runs,seconds:row.seconds,paid:row.paid});
          }
        }
        const bonus=g.firstBonusFor?.(week,mode);
        if(week===1&&mode==='normal'&&!bonus)throw Error('bonus rules unavailable');
        const bonusQuote=bonus?await rpc('sqs_ranked_bonus',{p_week:week,p_mode:mode}):{amountWei:'0',tx:null};
        if(!bonusQuote||bonusQuote.amountWei!==(bonus?.amountWei??'0')||bonusQuote.tx!==(bonus?.tx??null))throw Error('bonus unavailable');
        const paid = BigInt(board.paid), house = paid / 10n, entryPool = paid - house;
        if(activity.reduce((n,r)=>n+BigInt(r.paid),0n)>paid || activity.reduce((n,r)=>n+BigInt(r.runs),0n)>BigInt(board.entries))throw Error('activity exceeds paid entries');
        const first = week === (mode === 'hard' ? g.RANKED.kpmWeek : 0);
        const rolloverReady = first || board.incoming_ready === true;
        if (rolloverReady && !first && !units(board.incoming)) throw Error('rollover unavailable');
        const incoming = first ? 0n : rolloverReady ? BigInt(board.incoming) : null;
        const pool = incoming === null ? null : entryPool + incoming;
        if (pool !== null && pool >= 1n << 256n) throw Error('pool overflow');
        races[mode] = { mode, week, firstBonusWei:bonusQuote.amountWei, firstBonusTx:bonusQuote.tx, ...(week>=1?{rewardActivity:activity}:{activity}), rewards: week>=1?{version:2,placing:80,paid:10,seconds:10,minSeconds:30,placeMinSeconds:180,capped:false}:{version:0,placing:100,runs:0,seconds:0,minSeconds:0,capped:false}, entryOptions: g.entryOptions?.(week,mode)||[{tier:'standard',entryDmt:price.dmt,entryWei:String(price.wei)}], name: price.name, entryDmt: price.dmt, entries: board.entries, rows: board.rows,
          paidWei: String(paid), houseWei: String(house), entryPoolWei: String(entryPool), incomingWei: incoming === null ? null : String(incoming), poolWei: pool === null ? null : String(pool), rolloverReady,
          // Compatibility estimate for older pages; new displays use the exact base-unit fields above.
          poolDmt: Number(pool ?? entryPool) / 1e18 };
      }));
    } catch { return send(res, 503, { error: 'Could not read ranked pools. Try again shortly.' }); }
    const kpm = typeof g.kpmWeek === 'function' && g.kpmWeek(week);
    // week 0 on an endless build: runs are endless and rank by time survived ('time'); 'classic' = the old 15:00 runs
    const timed = !kpm && typeof g.runSeconds === 'function' && g.runSeconds(week) > LEGACY_RUN_SECONDS;
    // the top-level fields are the Normal race, as before the Hard race (older pages read them)
    return send(res, 200, { open: process.env.SQS_RANKED === 'on' && policy.admissionOpen, serverNow, closesAt: policy.closesAt, deadline: policy.deadline, sim: cur, week, map: mapId, endsAt: g.weekStart(week + 1), entryDmt: races.normal.entryDmt, entries: races.normal.entries, poolDmt: races.normal.poolDmt, payouts: g.RANKED.payouts, rewards: races.normal.rewards, maxEntries: g.RANKED.maxEntriesPerWallet, collect: COLLECT, rows: races.normal.rows,
      rules: kpm ? 'combined' : timed ? 'time' : 'classic', minSeconds: kpm ? g.RANKED.minSeconds : 0, timeLimit: kpm || timed ? g.RANKED.timeLimit : 0, races }, 'no-store');
  }
  if (process.env.SQS_RANKED !== 'on') return send(res, 503, { error: 'ranked runs open soon' });

  if (route === 'ranked-nonce' && req.method === 'GET') {
    // checked before the player pays: entries left this week, and one wallet per player
    const q = new URL(req.url, 'http://x').searchParams;
    const wallet = String(q.get('wallet') || '').toLowerCase(), mode = String(q.get('mode') || 'normal');
    if (!ADDR.test(wallet)) return send(res, 400, { error: 'connect a wallet first' });
    if (!racesIn(g, week).includes(mode)) return send(res, 400, { error: 'that race is not open this week' });
    if (!admit({build:q.get('build'), sim:q.get('sim')})) return;
    if (!policy.admissionOpen) return send(res, 400, {error:'ranked admission is closed', closed:true, ...policy});
    if (q.get('deadline') !== String(policy.deadline)) return send(res, 400, {error:'acknowledge the ranked deadline before entering'});
    const tier=q.get('tier')??'standard',price=raceIn(g,week,mode,tier);
    if(!['standard','high'].includes(tier)||!price)return send(res,400,{error:'that entry wager is not available'});
    const can = await rpc('sqs_ranked_can_enter_v2', { p_server_key: SERVER_KEY, p_wallet: wallet, p_week: week, p_ip_hash: ipHash(ip, week, TICKET_KEY), p_max: g.RANKED.maxEntriesPerWallet, p_mode: mode });
    if (!can || can.error || can.reward_version!==2 || can.ok!==true || !Number.isSafeInteger(can.left) || can.left<=0) return send(res, 400, can?.error?can:{error:'could not verify the current reward policy; no payment was requested'});
    // the race is part of the signed nonce: the payment is checked against that race's price and enters that race
    const nonce = signed({ k: 'rnonce', w: week, d: policy.deadline, c: 1, s: Date.now(), n: crypto.randomBytes(9).toString('base64url'), ...(mode === 'normal' ? {} : { m: mode }),...(tier==='high'?{h:1}:{}) });
    return send(res, 200, { nonce, tier, message: enterMessage(nonce, week, mode, policy.deadline,tier), deadline: policy.deadline, closesAt: policy.closesAt, serverNow: Date.now(), clockVersion: 1, week, mode, left: can.left, collect: COLLECT, dmt: DMT, amountWei: price.wei.toString(), chainId: 42161 });
  }

  if (route === 'ranked-enter' && req.method === 'POST') {
    // The game keeps {tx, nonce, signature} from the moment the wallet returns the payment and retries until this answers,
    // so a sign-in stays good for 8 days, a repeat of the same payment returns the same entry, and a valid payment that
    // cannot become an entry is written down as a refund the house owes.
    const b = await readBody(req); if (b.tooBig) return send(res, 413, { error: 'too big' });
    const n = unsign(b.nonce);
    if (!n || n.k !== 'rnonce' || (n.h!==undefined&&n.h!==1) || (n.w !== week && n.w !== week - 1) || Date.now() - n.s > 8 * 24 * 3600 * 1000) return send(res, 400, { error: 'that sign-in expired, start again' });
    const mode = modeOf(n),tier=tierOf(n);
    const price = raceIn(g, week, mode,tier), signedPrice = raceIn(g, n.w, mode,tier);
    if(!price||!signedPrice)return send(res,400,{error:'that entry wager is not available'});
    const wallet = typeof b.signature === 'string' ? recoverSigner(enterMessage(b.nonce, n.w, mode, n.c === 1 ? n.d : undefined,tier), b.signature) : null;
    if (!wallet) return send(res, 400, { error: 'the signature did not check out' });
    const tx = typeof b.tx === 'string' ? b.tx.toLowerCase() : ''; if (!TXH.test(tx)) return send(res, 400, { error: 'bad transaction id' });
    const gate = await rpc('sqs_ranked_receipt_gate', { p_server_key: SERVER_KEY, p_ip_hash: ipHash(ip, week, TICKET_KEY) });
    if (!gate?.ok) return send(res, gate?.error === 'slow down' ? 429 : 503, { error: gate?.error || 'could not check payment yet', retry: true });
    const pay = await checkPayment(tx, wallet, g.weekStart(week - 1), mode, signedPrice);
    if (pay.error) return send(res, pay.retry ? 503 : 400, pay);
    if (pay.at < g.weekStart(week) || (week >= 1 && n.w !== week)) {
      const beforeReset = pay.at < g.weekStart(week);
      const owe = await rpc('sqs_ranked_owe', { p_server_key: SERVER_KEY, p_tx: tx, p_wallet: wallet, p_week: beforeReset ? week - 1 : week, p_paid: pay.paid.toString(), p_reason: beforeReset ? 'paid just before the weekly reset' : 'signed for the previous week', p_mode: mode });
      if (!owe || (owe.error && owe.error !== 'that payment was already used for an entry')) return send(res, 400, owe || { error: 'could not record that' });
      if (!owe.error) return send(res, 400, { error: `${beforeReset ? 'Your payment landed just before the weekly reset' : 'Your sign-in was for the previous week'}, so it could not count. Your ${dmtAmount(pay.paid)} DMT will be sent back.`, refund: true });
    }
    // an entry costs exactly its race's price: more than that is not an entry, and the whole payment is owed back. (A
    // payment that already became an entry before this rule, answered 'already used', goes on to return that entry.)
    const over = pay.paid !== price.wei
      ? await rpc('sqs_ranked_owe', { p_server_key: SERVER_KEY, p_tx: tx, p_wallet: wallet, p_week: week, p_paid: pay.paid.toString(), p_reason: `sent more than the ${price.dmt} DMT entry`, p_mode: mode })
      : null;
    if (over && !(over.error === 'that payment was already used for an entry')) {
      if (over.error) return send(res, 400, over);
      // update8.sql: a payment over 100 DMT is recorded too, and its refund waits for the dev (held in the payout ledger)
      if (over.review) return send(res, 400, { error: `That payment sent more than the ${price.dmt} DMT ${price.name} entry, so it could not count. It will be sent back after the dev checks it.`, refund: true });
      return send(res, 400, { error: `That payment sent more than the ${price.dmt} DMT ${price.name} entry, so it could not count. All of it will be sent back.`, refund: true });
    }
    if (!racesIn(g, week).includes(mode)) {
      // a valid payment for a race that is not running (cannot happen with nonces from the game): owed back, never lost
      const owe = await rpc('sqs_ranked_owe', { p_server_key: SERVER_KEY, p_tx: tx, p_wallet: wallet, p_week: week, p_paid: pay.paid.toString(), p_reason: 'that race is not open this week', p_mode: mode });
      if (!owe || (owe.error && owe.error !== 'that payment was already used for an entry')) return send(res, 400, owe || { error: 'could not record that' });
      if (!owe.error) return send(res, 400, { error: `That race is not open this week. Your ${price.dmt} DMT will be sent back.`, refund: true });
    }
    const seed = crypto.randomInt(1, 2 ** 31 - 1);
    const out = await rpc('sqs_ranked_enter_v2', { p_server_key: SERVER_KEY, p_tx: tx, p_wallet: wallet, p_week: week, p_ip_hash: ipHash(ip, week, TICKET_KEY), p_paid: pay.paid.toString(), p_seed: seed, p_max: g.RANKED.maxEntriesPerWallet, p_mode: mode });
    if (out?.refund && typeof out.error === 'string') out.error = out.error.replace(/Your [0-9]+(?:\.[0-9]+)? DMT will be sent back\.$/, `Your ${dmtAmount(pay.paid)} DMT will be sent back.`);
    if (!out || out.error) return send(res, 400, out || { error: 'could not save the entry' });
    // a retried payment answers with the race it was first entered in
    const entryMode = out.mode === 'hard' ? 'hard' : out.mode === 'normal' ? 'normal' : mode;
    return send(res, 200, { entry: signed({ k: 'rentry', id: out.id, a: wallet, w: out.week ?? week, ...(entryMode === 'normal' ? {} : { m: entryMode }) }), id: out.id, wallet, week: out.week ?? week, mode: entryMode, left: out.left, again: !!out.again });
  }

  if (route === 'ranked-start' && req.method === 'POST') {
    const b = await readBody(req); if (b.tooBig) return send(res, 413, { error: 'too big' });
    const e = unsign(b.entry); if (!e || e.k !== 'rentry') return send(res, 400, { error: 'no entry' });
    if (e.w !== week) {
      const previous = await rpc('sqs_ranked_clock_start', {p_server_key:SERVER_KEY,p_id:e.id,p_wallet:e.a,p_adv:'adventurer',p_deadline:null});
      return send(res, 400, previous?.refund ? previous : {error:'that entry was for last week'});
    }
    if (!admit(b)) return;
    const adv = typeof b.adv === 'string' ? b.adv : ''; if (!g.RANKED.advs.includes(adv)) return send(res, 400, { error: 'pick an adventurer' });
    const mode = modeOf(e);
    if (!racesIn(g, week).includes(mode)) return send(res, 400, { error: 'that race is not open this week' });
    const out = await rpc('sqs_ranked_clock_start', { p_server_key: SERVER_KEY, p_id: e.id, p_wallet: e.a, p_adv: adv, p_deadline: Number.isSafeInteger(b.deadline) ? b.deadline : null });
    if (!out || out.error) return send(res, 400, out || { error: 'could not start' });
    if (out.mode && out.mode !== mode) return send(res, 500, { error: 'server error: that entry is in another race. Your run was not used up; tell the dev' });
    if (![0, 1].includes(out.clockVersion) || (out.clockVersion === 1 && (out.deadline !== policy.deadline || !out.clock?.ok))) return send(res, 503, {error:'ranked clock is unavailable'});
    const runAdv = typeof out.adv === 'string' ? out.adv : adv, started = Number(out.started) || Date.now(); // a repeat keeps the first start
    const run = signed({ k: 'rrun', id: e.id, a: e.a, w: week, seed: out.seed, adv: runAdv, v: cur, s: started, ...(out.clockVersion === 1 ? {d:out.deadline,c:1} : {}), ...(mode === 'normal' ? {} : { m: mode }) });
    return send(res, 200, { run, seed: out.seed, map: mapId, adv: runAdv, week, mode, started, serverNow: Date.now(), again: !!out.again, deadline: out.deadline, clockVersion: out.clockVersion, clock: out.clock });
  }

  if (route === 'ranked-clock' && req.method === 'POST') {
    const b = await readBody(req); if (b.tooBig) return send(res, 413, {error:'too big'});
    const r = unsign(b.run);
    if (!r || r.k !== 'rrun' || r.c !== 1 || !Number.isSafeInteger(r.s) || !Number.isSafeInteger(r.id) || !ADDR.test(r.a)) return send(res, 400, {error:'no run'});
    if (!['state','pause','resume'].includes(b.action) || !Number.isSafeInteger(b.seq) || b.seq < 0 || b.seq > 500000 || !Number.isSafeInteger(b.frame) || b.frame < 0 || b.frame > 219600) return send(res, 400, {error:'bad clock transition'});
    const out = await rpc('sqs_ranked_clock', {p_server_key:SERVER_KEY,p_id:r.id,p_wallet:r.a,p_started:r.s,p_action:b.action,p_seq:b.seq,p_frame:b.frame});
    return send(res, out?.ok ? 200 : out?.error ? 400 : 503, out || {error:'ranked clock is unavailable'});
  }

  if (route === 'ranked-submit' && req.method === 'POST') {
    const b = await readBody(req); if (b.tooBig) return send(res, 413, { error: 'that run log is too big' });
    const r = unsign(b.run); if (!r || r.k !== 'rrun' || !Number.isSafeInteger(r.s) || r.s <= 0) return send(res, 400, { error: 'no run' });
    const played = typeof r.v === 'string' ? load(r.v) : null; // the version this run was played on
    // the run's longest length comes from its own version and week: 15 minutes in week 0, the time limit from week 1
    const runMax = played ? runSecondsIn(played.game, r.w) : LEGACY_RUN_SECONDS;
    const sentReal = (Date.now() - r.s) / 1000;
    const cutoff = r.c === 1;
    if (cutoff && (!Number.isSafeInteger(r.d) || r.d !== g.weekStart(r.w + 1) || r.d <= r.s)) return send(res, 400, {error:'no run'});
    const maxTicks = Math.min(Math.ceil(runMax * 30), cutoff ? Math.floor((r.d-r.s)*30/1000) : Infinity);
    const shape = logShape(b.log, maxTicks); if (shape) return send(res, 400, { error: shape });
    if (!played) return send(res, 500, { error: 'server error: that game version is missing. Your run was not used up; tell the dev' });
    const sha = crypto.createHash('sha256').update(JSON.stringify(b.log)).digest('hex');
    const ident = { p_server_key: SERVER_KEY, p_id: r.id, p_wallet: r.a, p_started: r.s, p_log_sha: sha, p_attempt: crypto.randomUUID() };
    const reply = (out) => {
      if (out.verdict !== 'ok') return send(res, 400, { error: 'this run did not check out (' + out.verdict.slice(10) + ')' });
      const { verdict, ...score } = out;
      return send(res, 200, score);
    };
    let release = true; // a lost claim response may still have acquired our UUID's lease
    try {
      const claim = await rpc('sqs_ranked_claim_v2', { ...ident, p_allow_claim: cutoff ? Date.now() <= r.d + g.UPLOAD_MS : sentReal <= runMax + LATE_SECONDS });
      if (claim && (claim.error || claim.busy || claim.result)) {
        release = false;
        if (claim.error) return /older submission|already settled/.test(claim.error) ? send(res, 409, { ...claim, retry: true }) : send(res, 400, claim);
        if (claim.busy) return send(res, 409, { error: 'that run is still being checked. Retry shortly; after a server interruption recovery can take up to 15 minutes.', retry: true });
        return reply(claim.result);
      }
      if (!claim || !claim.ok || !Number.isSafeInteger(claim.received)) throw new Error('ranked claim was not acknowledged');
      // Retries use the original receipt time: a recovery wait cannot invalidate an honest run or cure a too-fast log.
      if (cutoff && (!Number.isSafeInteger(claim.creditMs) || claim.creditMs < 0)) throw new Error('ranked clock credit unavailable');
      const real = ((cutoff ? Math.min(claim.received, r.d) : claim.received) - r.s) / 1000;
      const credit = cutoff ? claim.creditMs / 1000 : 0;
      const logTicks = b.log.runs.reduce((n, x) => n + x[0], 0), early = real < (logTicks / 30) * 0.97 - 5;
      const result = early ? { t: 0, kills: 0, level: 0 } : played.game.replay(b.log, { seed: r.seed, mapId: played.game.weekMap(r.w), adv: r.adv, ground: played.ground, week: r.w, mode: modeOf(r) }, { maxTicks, allowPartial: cutoff && claim.received >= r.d });
      let verdict = 'ok';
      if (early) verdict = 'rejected: faster than real time';
      else if (result.error) verdict = 'rejected: ' + result.error;
      else if (real < result.t * 0.97 - 5) verdict = 'rejected: faster than real time';
      else if (real - credit > result.t + (g.RANKED.pauseSeconds ?? 1800)) verdict = 'rejected: 30-minute total pause allowance exceeded';
      const ok = verdict === 'ok';
      const out = await rpc('sqs_ranked_finish_v2', { ...ident, p_name: (typeof b.name === 'string' && clean(b.name, 16)) || 'Adventurer', p_t: ok ? result.t : 0, p_kills: ok ? result.kills : 0, p_level: ok ? result.level : 0, p_won: ok && result.won, p_verdict: verdict, p_log: ok ? zlib.gzipSync(JSON.stringify(b.log)).toString('base64') : null });
      if (!out || out.error) return send(res, 503, { error: out?.error || 'could not save the run', retry: true });
      release = false;
      return reply(out);
    } finally {
      if (release) await rpc('sqs_ranked_release_v2', ident).catch(() => {}); // otherwise the 15-minute lease expires safely
    }
  }
  if (route === 'ranked-void' && req.method === 'POST') {
    // only when the game really changed since this run started: a reload into the new version cannot finish it faithfully
    const b = await readBody(req); if (b.tooBig) return send(res, 413, { error: 'too big' });
    const r = unsign(b.run); if (!r || r.k !== 'rrun') return send(res, 400, { error: 'no run' });
    if (r.v === cur) return send(res, 400, { error: 'the game has not changed since this run started: resume it instead' });
    // The same entry restarts with a new seed, at most3times. SQL16 records an owed refund if admission has
    // closed and a valid interrupted run can no longer receive a replacement start.
    if (r.w !== week) return send(res, 400, { error: 'that run can no longer be restarted: its week is over' });
    // security pass 3: only a run that could still have been sent (an old unsent run kept back is not a free retry), and
    // only the entry's current start. SQL16 checks new-policy age with verified pause credit and refunds a valid
    // interruption when admission has closed; legacy age remains bounded here without loading an archived bundle.
    if (!Number.isFinite(r.s) || (r.c !== 1 && Date.now() - r.s > (runSecondsIn(g, r.w) + LATE_SECONDS) * 1000)) return send(res, 400, { error: 'that run can no longer be restarted: it started too long ago' });
    const again = await rpc('sqs_ranked_restart', { p_server_key: SERVER_KEY, p_id: r.id, p_wallet: r.a, p_seed: crypto.randomInt(1, 2 ** 31 - 1), p_reason: `game updated during the run (${r.v} -> ${cur})`, p_started: r.s });
    if (!again || again.error) return send(res, 400, again || { error: 'could not restart that run' });
    const mode = again.mode === 'hard' ? 'hard' : 'normal';
    return send(res, 200, { ok: true, restart: true, entry: signed({ k: 'rentry', id: r.id, a: r.a, w: r.w, ...(mode === 'normal' ? {} : { m: mode }) }), id: r.id, week: r.w, mode });
  }
  return send(res, 404, { error: 'not found' });
}

module.exports = { handle, checkPayment, logShape, enterMessage, load, currentSim, COLLECT, ENTRY_WEI, RACES, LATE_SECONDS };
