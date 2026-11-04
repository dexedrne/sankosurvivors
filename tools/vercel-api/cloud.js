// Cloud saves: progress kept on the player's wallet, so it follows them to any device (owner 2 Nov: "progress synced to
// wallet ... laptop to desktop and ... phone"). The player signs a free message once per device (save-login) and gets a
// signed save key for that wallet (90 days). A save is a whole snapshot of the progress keys with a revision number: a
// save made from an older revision is refused and handed the newer one, so two devices never overwrite each other
// silently. Device settings (graphics, sound, roofs) stay on each device. Database: tools/supabase/update4.sql.
//   GET  /api/save-nonce                         a sign-in message to sign
//   POST /api/save-login {nonce,signature}       -> {address, key, rev, data?, at?}
//   POST /api/save-get   {key}                   -> {rev, data?, at?}   (rev 0: nothing saved yet)
//   POST /api/save-put   {key, rev, data}        -> {ok, rev} | 409 {conflict, rev, data, at}
const crypto = require('node:crypto');

const SAVE_KEYS = ['sq-coins', 'sq-name', 'sq-gear', 'sq-gearlv', 'sq-bank', 'sq-best', 'sq-bests', 'sq-stats', 'sq-skills', 'sq-quests', 'sq-cleared', 'sq-map', 'sq-adv', 'sq-autoalch'];
// the biggest honest save (every gear piece at +5, every map and mode best) is about 8 KB: these leave room and stop one
// client from filling the database with made-up wallets at 100 KB each (security pass, 3 Nov)
const MAX_VALUE = 12000, MAX_SAVE = 24000, MAX_BODY = 32000, KEY_DAYS = 90;
const saveMessage = (nonce) => `SankoQuest Survivors\n\nSign to keep your progress on this wallet, so it follows you to any device. This is free: no transaction, no gas, nothing leaves your wallet.\n\nNonce: ${nonce}`;

// only the progress keys, each a JSON value the game saves, within size
function cleanSave(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
  const out = {}; let n = 0;
  for (const k of SAVE_KEYS) {
    const v = d[k]; if (typeof v !== 'string' || v.length > MAX_VALUE) continue;
    try { JSON.parse(v); } catch { continue; }
    out[k] = v; n += v.length;
  }
  return n > MAX_SAVE || !Object.keys(out).length ? null : out;
}
// what the database returns, passed on as is but only with the progress keys
function shape(row) {
  if (!row || typeof row !== 'object') return { rev: 0 };
  const rev = Number.isInteger(row.rev) && row.rev >= 0 ? row.rev : 0;
  const data = rev && row.data ? cleanSave(row.data) : null;
  return data ? { rev, data, at: Number(row.at) || 0 } : { rev };
}
function readBody(req) {
  return new Promise((ok) => {
    const parts = []; let n = 0, over = false;
    req.on('data', (c) => { if (over) return; n += c.length; if (n > MAX_BODY) { over = true; ok({ tooBig: true }); req.destroy(); } else parts.push(Buffer.isBuffer(c) ? c : Buffer.from(c)); });
    req.on('end', () => { if (over) return; try { const v = JSON.parse(Buffer.concat(parts).toString() || '{}'); ok(v && typeof v === 'object' && !Array.isArray(v) ? v : {}); } catch { ok({}); } });
    req.on('error', () => { if (!over) ok({}); });
  });
}

async function handle(path, req, res, { rpc, send, signed, unsign, recoverSigner, SERVER_KEY, ip = '' }) {
  if (path === 'save-nonce' && req.method === 'GET') {
    const nonce = signed({ k: 'snonce', s: Date.now(), n: crypto.randomBytes(9).toString('base64url') });
    return send(res, 200, { nonce, message: saveMessage(nonce) });
  }
  if (req.method !== 'POST' || !['save-login', 'save-get', 'save-put'].includes(path)) return send(res, 404, { error: 'not found' });
  const b = await readBody(req); if (b.tooBig) return send(res, 413, { error: 'that save is too big' });

  if (path === 'save-login') {
    const n = unsign(b.nonce);
    if (!n || n.k !== 'snonce' || !(Date.now() - n.s < 15 * 60 * 1000)) return send(res, 400, { error: 'that sign-in expired, try again' });
    const addr = recoverSigner(saveMessage(b.nonce), b.signature);
    if (!addr || (b.address != null && (typeof b.address !== 'string' || b.address.toLowerCase() !== addr))) return send(res, 400, { error: 'the signature did not match the wallet' });
    const key = signed({ k: 'save', a: addr, exp: Date.now() + KEY_DAYS * 86400000 });
    const cur = await rpc('sqs_save_get', { p_server_key: SERVER_KEY, p_wallet: addr });
    if (cur && cur.error) return send(res, 500, { error: 'cloud saves are not set up yet' });
    return send(res, 200, { address: addr, key, ...shape(cur) });
  }

  const s = unsign(b.key);
  if (!s || s.k !== 'save' || !(s.exp > Date.now()) || typeof s.a !== 'string' || !/^0x[0-9a-f]{40}$/.test(s.a)) return send(res, 401, { error: 'sign in to your cloud save again' });
  if (path === 'save-get') {
    const cur = await rpc('sqs_save_get', { p_server_key: SERVER_KEY, p_wallet: s.a });
    if (cur && cur.error) return send(res, 500, { error: 'cloud saves are not set up yet' });
    return send(res, 200, shape(cur));
  }
  // save-put
  const data = cleanSave(b.data); if (!data) return send(res, 400, { error: 'nothing to save' });
  if (!Number.isInteger(b.rev) || b.rev < 0) return send(res, 400, { error: 'bad revision' });
  // the database also limits how many NEW wallets one IP can save (update6.sql); before that is pasted, the old call
  const p_ip = crypto.createHash('sha256').update('save-ip:' + String(ip || 'unknown')).digest('hex').slice(0, 32);
  let out;
  try { out = await rpc('sqs_save_put', { p_server_key: SERVER_KEY, p_wallet: s.a, p_data: data, p_rev: b.rev, p_ip }); }
  catch (e) { if (!/ 404 /.test(String(e.message))) throw e; out = await rpc('sqs_save_put', { p_server_key: SERVER_KEY, p_wallet: s.a, p_data: data, p_rev: b.rev }); }
  if (!out || out.error) return send(res, out && out.error === 'slow down' ? 429 : 400, out || { error: 'could not save' });
  if (out.conflict) return send(res, 409, { conflict: true, ...shape(out) });
  return send(res, 200, { ok: true, rev: out.rev });
}

module.exports = { handle, cleanSave, saveMessage, SAVE_KEYS };
