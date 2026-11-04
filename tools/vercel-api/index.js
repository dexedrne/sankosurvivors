// Leaderboard and bug reports, stored in Supabase (tools/supabase/schema.sql).
// Env: SUPABASE_URL + SUPABASE_KEY (publishable/anon key; the tables are locked and only
// the sqs_* functions are callable, which validate and rate-limit).
//   GET  /api/scores?map=greentown      top 25 runs on a map
//   POST /api/score   {map,name,t,kills,level,adv,won,hard,v}
//   POST /api/report  {text,map,adv,settings,errors,ua,v}
const crypto = require('node:crypto');
const SB = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
// Run tickets: a run gets a signed, timestamped ticket when it starts; a score needs one, the run cannot claim more
// time than has really passed since, and each ticket counts once. (Stops instant fake scores; a patient cheat can
// still wait it out, so bad entries can also be removed by hand.)
const TICKET_KEY = process.env.SQS_TICKET_SECRET || '';
const SERVER_KEY = process.env.SQS_SERVER_KEY || ''; // proves to the database that a save came through this server

// DMT holders (Arbitrum): the player signs a free message, we recover the signer, read its DMT balance, and hand back a
// signed holder pass for a day. Nothing is sent from the wallet; only the public balance is read.
const { secp256k1, keccak_256 } = require('./noble-crypto.cjs');
const DMT = '0x8B0E6f19Ee57089F7649A455D89D7bC6314D04e8', ARB_RPCS = ['https://arb1.arbitrum.io/rpc', 'https://arbitrum-one-rpc.publicnode.com'];
const holderMessage = (nonce) => `SankoQuest Survivors\n\nSign to show you hold DMT. This is free: no transaction, no gas, nothing leaves your wallet.\n\nNonce: ${nonce}`;
function signed(obj) { const body = b64u(JSON.stringify(obj)); return body + '.' + sign(body); }
function unsign(t) {
  if (!TICKET_KEY || typeof t !== 'string' || t.length > 400 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(t)) return null;
  const [body, sig] = t.split('.'); if (!body || !sig) return null;
  const want = sign(body); if (want.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(want), Buffer.from(sig))) return null;
  try { return JSON.parse(Buffer.from(body, 'base64url').toString()); } catch { return null; }
}
function recoverSigner(message, sigHex) {
  if (typeof sigHex !== 'string' || !/^(?:0x)?[0-9a-fA-F]{130}$/.test(sigHex)) return null;
  const sig = Buffer.from(sigHex.replace(/^0x/, ''), 'hex');
  const msg = Buffer.from(message, 'utf8');
  const hash = keccak_256(Buffer.concat([Buffer.from(`\x19Ethereum Signed Message:\n${msg.length}`, 'utf8'), msg]));
  let v = sig[64]; if (v >= 27) v -= 27; if (v !== 0 && v !== 1) return null;
  try {
    const pub = secp256k1.Signature.fromBytes(sig.subarray(0, 64), 'compact').addRecoveryBit(v).recoverPublicKey(hash).toBytes(false);
    return '0x' + Buffer.from(keccak_256(pub.subarray(1))).subarray(-20).toString('hex');
  } catch { return null; }
}
async function dmtBalance(addr) {
  const data = '0x70a08231' + addr.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  for (const rpc of ARB_RPCS) {
    try {
      const r = await fetch(rpc, { signal: AbortSignal.timeout(10000), method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'sankosurvivors/1.0' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to: DMT, data }, 'latest'] }) });
      const j = await r.json(); if (j && typeof j.result === 'string' && /^0x[0-9a-f]*$/i.test(j.result)) return BigInt(j.result === '0x' ? 0 : j.result);
    } catch { /* try the next one */ }
  }
  return null;
}
const fmtDmt = (wei) => { const s = wei.toString().padStart(19, '0'); const whole = s.slice(0, -18).replace(/^0+(?=\d)/, ''); const frac = s.slice(-18).replace(/0+$/, '').slice(0, 4); return whole + (frac ? '.' + frac : ''); };
function holderFromPass(pass) { const p = unsign(pass); return p && p.k === 'dmt' && p.exp > Date.now() && p.b && p.b !== '0' ? p : null; }
const b64u = (b) => Buffer.from(b).toString('base64url');
const sign = (body) => crypto.createHmac('sha256', TICKET_KEY).update(body).digest('base64url');
function makeTicket() { const body = b64u(JSON.stringify({ s: Date.now(), n: crypto.randomBytes(9).toString('base64url') })); return body + '.' + sign(body); }
function readTicket(t) {
  if (!TICKET_KEY || typeof t !== 'string' || t.length > 200 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(t)) return null;
  const [body, sig] = t.split('.'); if (!body || !sig) return null;
  const want = sign(body); if (want.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(want), Buffer.from(sig))) return null;
  try { const d = JSON.parse(Buffer.from(body, 'base64url').toString()); return typeof d.s === 'number' && typeof d.n === 'string' ? d : null; } catch { return null; }
}
const KEY = process.env.SUPABASE_KEY || '';
let MAPS = null; // every map with win rules below (the list was kept by hand and missed the Hidden Oasis)
async function rpc(fn, args) {
  const r = await fetch(`${SB}/rest/v1/rpc/${fn}`, { signal: AbortSignal.timeout(10000), method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
  if (!r.ok) throw new Error(`${fn} ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json();
}
const send = (res, code, obj, cache) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', cache || 'no-store'); res.end(JSON.stringify(obj)); };
// a JSON object body (anything else, or more than 20 KB, reads as {})
const body = (req) => new Promise((ok) => {
  let s = '', done = false; const end = (v) => { if (!done) { done = true; ok(v); } };
  req.on('data', (c) => { if (done) return; s += c; if (s.length > 20000) { end({}); req.destroy(); } });
  req.on('end', () => { try { const v = JSON.parse(s || '{}'); end(v && typeof v === 'object' && !Array.isArray(v) ? v : {}); } catch { end({}); } });
  req.on('error', () => end({}));
});
// PostgreSQL rejects lone surrogates, including a pair split by the length cap.
const clean = (s, n) => (typeof s === 'string' ? s : '').replace(/[\u0000-\u001f<>\uD800-\uDFFF]/gu, '').trim().slice(0, n).replace(/[\uD800-\uDBFF]$/u, '');
const int = (v) => Math.min(1e6, Math.max(0, Math.floor(Number(v)) || 0));
// a run is won by surviving the map's length or by killing its final boss (the last one on the schedule), which cannot
// appear before these times (src/content.js: each map's bosses and length; test/api.test.mjs checks they still match)
const WIN = { greentown: [720, 900], apache: [720, 900], duel: [720, 900], graves: [720, 900], swamp: [720, 900], goblins: [780, 900], paya: [720, 900], oasis: [720, 900], tutorial: [480, 600], world: [1560, 1800] };
MAPS = new Set(Object.keys(WIN));
module.exports = async function handler(req, res) {
  if (!SB || !KEY || !TICKET_KEY || !SERVER_KEY) return send(res, 503, { error: 'leaderboard not set up yet' });
  const u = new URL(req.url, 'http://x'), path = u.searchParams.get('route') || u.pathname.replace(/^\/api\/?/, '');
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  // POSTs must be JSON: a page on another site cannot send that without the browser asking first (and we never allow it)
  if (req.method === 'POST' && !/^application\/json/i.test(String(req.headers['content-type'] || ''))) return send(res, 415, { error: 'send JSON' });
  try {
    if (path.startsWith('ranked-')) return await require('./ranked.js').handle(path, req, res, { rpc, send, signed, unsign, recoverSigner, clean, ip, SERVER_KEY, TICKET_KEY });
    if (path.startsWith('save-')) return await require('./cloud.js').handle(path, req, res, { rpc, send, signed, unsign, recoverSigner, SERVER_KEY, ip });
    if (req.method === 'GET' && path === 'scores') {
      const map = u.searchParams.get('map'); if (!MAPS.has(map)) return send(res, 400, { error: 'bad map' });
      const endless = u.searchParams.get('endless') === '1';
      let rows;
      if (endless) { try { rows = await rpc('sqs_top', { p_map: map, p_endless: true }); } catch (e) { if (!/ 404 /.test(String(e.message))) throw e; rows = []; } } // before update3.sql: no endless boards yet
      else rows = await rpc('sqs_top', { p_map: map });
      return send(res, 200, { map, endless, rows }, 'public, s-maxage=10, stale-while-revalidate=30');
    }
    if (req.method === 'GET' && path === 'nonce') {
      const nonce = signed({ k: 'nonce', s: Date.now(), n: crypto.randomBytes(9).toString('base64url') });
      return send(res, 200, { nonce, message: holderMessage(nonce) });
    }
    if (req.method === 'POST' && path === 'holder') {
      const b = await body(req), n = unsign(b.nonce);
      if (!n || n.k !== 'nonce' || Date.now() - n.s > 15 * 60 * 1000) return send(res, 400, { error: 'that sign-in expired, try again' });
      const addr = recoverSigner(holderMessage(b.nonce), b.signature);
      if (!addr || (b.address != null && (typeof b.address !== 'string' || b.address.toLowerCase() !== addr))) return send(res, 400, { error: 'the signature did not match the wallet' });
      const bal = await dmtBalance(addr);
      if (bal === null) return send(res, 502, { error: 'could not read the DMT balance right now, try again in a minute' });
      const out = { address: addr, balance: fmtDmt(bal), holder: bal > 0n };
      if (out.holder) out.pass = signed({ k: 'dmt', a: addr, b: out.balance, exp: Date.now() + 24 * 3600 * 1000 });
      return send(res, 200, out);
    }
    if (req.method === 'GET' && path === 'run') {
      if (!TICKET_KEY) return send(res, 503, { error: 'leaderboard not set up yet' });
      return send(res, 200, { ticket: makeTicket() });
    }
    if (req.method === 'POST' && path === 'score') {
      const b = await body(req);
      const tk = readTicket(b.ticket); if (!tk) return send(res, 400, { error: 'no ticket' });
      const map = typeof b.map === 'string' ? b.map : '';
      if (!MAPS.has(map)) return send(res, 400, { error: 'bad map' });
      if ([b.name, b.adv].some(v => v != null && typeof v !== 'string') || [b.t, b.kills, b.level].some(v => v != null && (!['number', 'string'].includes(typeof v) || !Number.isFinite(Number(v))))) return send(res, 400, { error: 'bad score' });
      const endless = b.endless === true, won = b.won === true && !endless, t = int(b.t);
      if (won && (t < WIN[map][0] || t > WIN[map][1] + 10)) return send(res, 400, { error: 'bad score' });
      const real = (Date.now() - tk.s) / 1000, claimed = Number(b.t) || 0;
      if (real < claimed * 0.97 - 5 || real > 4 * 3600) return send(res, 400, { error: 'bad ticket' });
      const args = { p_ip: ip, p_map: map, p_name: clean(b.name, 16), p_t: t, p_kills: int(b.kills), p_level: int(b.level), p_adv: clean(b.adv, 16), p_won: won, p_hard: b.hard === true, p_ticket: tk.n, p_server_key: SERVER_KEY };
      if (endless) args.p_endless = true;
      let out;
      try { out = await rpc('sqs_submit_score', { ...args, p_holder: !!holderFromPass(b.pass) }); }
      catch (e) { // an older database: no endless boards yet (update3.sql), or no holder badges (update2.sql)
        if (!/ 404 /.test(String(e.message))) throw e;
        const { p_endless, ...older } = args;
        try { out = await rpc('sqs_submit_score', { ...older, p_holder: !!holderFromPass(b.pass) }); }
        catch (e2) { if (!/ 404 /.test(String(e2.message))) throw e2; out = await rpc('sqs_submit_score', older); }
      }
      if (out && out.error) return send(res, out.error === 'slow down' ? 429 : 400, out);
      return send(res, 200, out);
    }
    if (req.method === 'POST' && path === 'report') {
      const b = await body(req);
      const report = { text: clean(b.text, 2000), map: clean(b.map, 20), adv: clean(b.adv, 20), v: clean(b.v, 10), ua: clean(req.headers['user-agent'], 200), settings: b.settings && typeof b.settings === 'object' && !Array.isArray(b.settings) && JSON.stringify(b.settings).length <= 3000 ? b.settings : null, errors: Array.isArray(b.errors) ? b.errors.slice(0, 8).map((e) => clean(e, 300)) : [] };
      if (!report.text) return send(res, 400, { error: 'write what happened first' });
      const out = await rpc('sqs_submit_report', { p_ip: ip, p_report: report, p_server_key: SERVER_KEY });
      if (out && out.error) return send(res, out.error === 'slow down' ? 429 : 400, out);
      console.log('BUG-REPORT', JSON.stringify(report));
      return send(res, 200, out);
    }
    return send(res, 404, { error: 'not found' });
  } catch (e) { console.error(e); return send(res, 500, { error: 'server error' }); }
};
module.exports.WIN = WIN;
