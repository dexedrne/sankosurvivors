import { BUN_APPEARANCES } from './bun-catalogue.js';

export const BUN_COLLECTION = '0xb85ff44289b768ecff58fead92f815b642e3cbb2';
export const BUN_CHAIN_ID = 42161;
const RPC = 'https://arb1.arbitrum.io/rpc';
const MAX_TOKENS = 32, MAX_BYTES = 16384;
class BunReadError extends Error {}
const fail = (code) => { throw new BunReadError(code); };

async function readJson(response, signal) {
  if (!response.ok || !response.body) fail('unavailable');
  const declared = response.headers.get('content-length');
  if (declared && Number(declared) > MAX_BYTES) fail('response-too-large');
  const reader = response.body.getReader(), chunks = [];
  let bytes = 0;
  const cancel = () => { reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    while (true) {
      if (signal.aborted) fail('aborted');
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BYTES) { cancel(); fail('response-too-large'); }
      chunks.push(value);
    }
    const data = new Uint8Array(bytes); let offset = 0;
    for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.byteLength; }
    try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(data)); }
    catch { fail('invalid-response'); }
  } finally { signal.removeEventListener('abort', cancel); reader.releaseLock(); }
}

function tokenIds(data) {
  if (typeof data !== 'string' || data.length > 2 + (MAX_TOKENS + 2) * 64 || !/^0x[0-9a-f]+$/i.test(data) || data.length < 130) fail('invalid-tokens');
  if (BigInt('0x' + data.slice(2, 66)) !== 32n) fail('invalid-tokens');
  const count = BigInt('0x' + data.slice(66, 130));
  if (count > BigInt(MAX_TOKENS) || data.length !== 130 + Number(count) * 64) fail('invalid-tokens');
  const ids = [];
  for (let i = 0; i < Number(count); i++) ids.push(BigInt('0x' + data.slice(130 + i * 64, 194 + i * 64)).toString());
  if (new Set(ids).size !== ids.length) fail('invalid-tokens');
  return ids;
}

function petFromMetadata(tokenId, data) {
  if (!data || !Array.isArray(data.attributes) || !data.attributes.length || data.attributes.length > 32) fail('invalid-metadata');
  const traits = new Map();
  for (const trait of data.attributes) {
    if (!trait || typeof trait.trait_type !== 'string') fail('invalid-metadata');
    if (!['Type', 'Variety', 'Rarity'].includes(trait.trait_type)) continue;
    if (traits.has(trait.trait_type) || typeof trait.value !== 'string' || !trait.value.length || trait.value.length > 64) fail('invalid-metadata');
    traits.set(trait.trait_type, trait.value);
  }
  const type = traits.get('Type'), variety = traits.get('Variety');
  if (!['Bun', 'Egg'].includes(type) || !variety) fail('invalid-metadata');
  const appearance = type === 'Bun' && Object.hasOwn(BUN_APPEARANCES, variety) ? BUN_APPEARANCES[variety] : null;
  return { tokenId, type, variety, rarity: traits.get('Rarity') ?? null, eligible: !!appearance,
    reason: type === 'Egg' ? 'unhatched' : appearance ? null : 'unsupported-appearance', appearance };
}

/** Public, direct ERC721 ownership only. Pass isCurrent bound to walletRevision and abort on wallet changes. */
export async function loadBunOwnership(address, { fetchImpl = globalThis.fetch, signal, identity, isCurrent = () => true } = {}) {
  const normalized = typeof address === 'string' ? address.toLowerCase() : null;
  const result = { status: 'unavailable', address: normalized, identity, block: null, pets: [] };
  if (!/^0x[0-9a-f]{40}$/.test(normalized ?? '') || /^0x0{40}$/.test(normalized)) return { ...result, error: 'invalid-address' };
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 20000);
  let rejectAbort;
  const stopped = new Promise((_, reject) => { rejectAbort = () => reject(new BunReadError(timedOut ? 'timeout' : 'aborted')); });
  controller.signal.addEventListener('abort', rejectAbort, { once: true });
  const guard = () => { if (controller.signal.aborted) fail(timedOut ? 'timeout' : 'aborted'); if (!isCurrent()) fail('stale'); };
  let id = 0;
  const requestJson = async (url, options) => {
    guard();
    const response = await fetchImpl(url, { ...options, signal: controller.signal, credentials: 'omit', redirect: 'error', cache: 'no-store' });
    guard();
    const data = await readJson(response, controller.signal);
    guard(); return data;
  };
  const rpc = async (method, params = []) => {
    const requestId = ++id;
    const data = await requestJson(RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: requestId, method, params }) });
    if (!data || data.jsonrpc !== '2.0' || data.id !== requestId || data.error || !Object.hasOwn(data, 'result')) fail('invalid-response');
    return data.result;
  };
  const read = async () => {
    guard();
    const chain = await rpc('eth_chainId');
    if (typeof chain !== 'string' || !/^0x[0-9a-f]{1,8}$/i.test(chain) || BigInt(chain) !== BigInt(BUN_CHAIN_ID)) fail('wrong-chain');
    const block = await rpc('eth_getBlockByNumber', ['latest', false]);
    if (!block || !/^0x(?:0|[1-9a-f][0-9a-f]{0,15})$/i.test(block.number) || !/^0x[0-9a-f]{64}$/i.test(block.hash)) fail('invalid-block');
    const call = (data) => rpc('eth_call', [{ to: BUN_COLLECTION, data }, block.number]);
    const ids = tokenIds(await call('0x8462151c' + normalized.slice(2).padStart(64, '0')));
    const pets = [];
    for (const tokenId of ids) {
      const owner = await call('0x6352211e' + BigInt(tokenId).toString(16).padStart(64, '0'));
      if (typeof owner !== 'string' || !/^0x0{24}[0-9a-f]{40}$/i.test(owner) || owner.slice(-40).toLowerCase() !== normalized.slice(2)) fail('owner-changed');
      const metadata = await requestJson(`https://pet-metadata.sanko.xyz/buns/${tokenId}`, { method: 'GET', headers: { Accept: 'application/json' } });
      pets.push(petFromMetadata(tokenId, metadata));
    }
    const confirmed = await rpc('eth_getBlockByNumber', [block.number, false]);
    if (!confirmed || confirmed.number !== block.number || confirmed.hash?.toLowerCase() !== block.hash.toLowerCase()) fail('block-changed');
    guard();
    return { ...result, status: 'ready', block: { number: block.number, hash: block.hash }, pets };
  };
  try { return await Promise.race([read(), stopped]); }
  catch (error) {
    const code = error instanceof BunReadError ? error.message : 'unavailable';
    return { ...result, status: code === 'stale' || code === 'aborted' ? code : 'unavailable', error: code };
  } finally {
    clearTimeout(timeout); signal?.removeEventListener('abort', abort); controller.signal.removeEventListener('abort', rejectAbort);
  }
}
