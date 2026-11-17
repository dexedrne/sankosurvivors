// Where the game's files (models, world, music, sounds, icons) come from. Live builds load them from jsDelivr, a free
// public CDN serving the game's public GitHub copy pinned to the commit that last changed them (tools/deploy.sh sets
// VITE_ASSET_BASE_1 and _2), so players do not download them from the game's own host. If jsDelivr does not answer, they come
// from the game's own host as before.
const LOCAL = (import.meta.env.BASE_URL || './') + 'assets/';
// jsDelivr caps a repo at 50 MB, so the files live in two (tools/publish-assets.sh): world, icons, sounds and animations
// in the first, models, music and native Sanko pets in the second
const CDN1 = import.meta.env.VITE_ASSET_BASE_1 || '', CDN2 = import.meta.env.VITE_ASSET_BASE_2 || '';
const PART2 = /^(models|music|sanko)\//;
let useCdn = !!(CDN1 && CDN2), probeFetch = null;
export const asset = (p) => (useCdn ? (PART2.test(p) ? CDN2 : CDN1) : LOCAL) + p;
export const assetHost = () => (useCdn ? 'cdn' : 'local');
// call once before loading anything big: a quick look at the CDN, falling back to the local copy
export async function pickAssetHost() {
  if (!useCdn) return 'local';
  try {
    const c = new AbortController(), timer = setTimeout(() => c.abort(), 4000);
    // Local retries must not conceal a whole-CDN outage from the health probes.
    const probe = probeFetch || fetch.bind(globalThis);
    const r = await Promise.all([probe(CDN1 + 'ui/items/item_Gold.png', { signal: c.signal }), probe(CDN2 + 'models/mobs/Skelly.glb', { method: 'HEAD', signal: c.signal })]);
    clearTimeout(timer); if (!r.every((x) => x.ok)) throw new Error('cdn');
  } catch { useCdn = false; }
  installAssetFallback(); // and file by file from here on
  return assetHost();
}
// jsDelivr sometimes fails one file while the rest answer ("Failed to fetch the requested commit", seen 16 Nov on a monster
// model). Install before the first asset request; health probes retain the original fetch. A missing file retries locally once.
// Pending CDN requests can still fail after health probes switch new loads to local.
/** the game's own copy of a configured CDN address ('' for anything else) */
export const localOf = (u) => (!(CDN1 && CDN2) || typeof u !== 'string' ? '' : u.startsWith(CDN1) ? LOCAL + u.slice(CDN1.length) : u.startsWith(CDN2) ? LOCAL + u.slice(CDN2.length) : '');
export function installAssetFallback(w = globalThis) {
  if (!useCdn || w.__sqAssetFallback || typeof w.fetch !== 'function') return false;
  w.__sqAssetFallback = true;
  const local = localOf;
  const plain = w.fetch.bind(w);
  if (w === globalThis) probeFetch = plain;
  w.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : (input && input.url) || String(input), alt = local(url);
    const method = (init && init.method) || (input && input.method) || 'GET', signal = (init && init.signal) || (input && input.signal) || undefined;
    if (!alt || !/^(GET|HEAD)$/i.test(method)) return plain(input, init);
    try { const r = await plain(input, init); if (r.ok) return r; } catch (e) { if (signal && signal.aborted) throw e; }
    return plain(alt, { method, signal });
  };
  // pictures on the page (item icons, portraits). The retry comes before the picture's own error handler, which would
  // swap in a placeholder; that still happens if the game's own copy fails too. Pictures and sounds that are not on the
  // page never reach this: the map tiles, minimap and music retry for themselves (localOf)
  if (typeof w.addEventListener === 'function') w.addEventListener('error', (e) => {
    const t = e.target;
    if (!t || !/^(IMG|AUDIO|VIDEO)$/.test(t.tagName || '') || !t.dataset || t.dataset.localTried) return;
    const alt = local(t.currentSrc || t.src || '');
    if (alt) { t.dataset.localTried = '1'; if (e.stopPropagation) e.stopPropagation(); t.src = alt; }
  }, true);
  return true;
}
