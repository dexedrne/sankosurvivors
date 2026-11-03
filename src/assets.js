// Where the game's files (models, world, music, sounds, icons) come from. Live builds load them from jsDelivr, a free
// public CDN serving the game's public GitHub copy pinned to the commit that last changed them (tools/deploy.sh sets
// VITE_ASSET_BASE_1 and _2), so players do not download them from the game's own host. If jsDelivr does not answer, they come
// from the game's own host as before.
const LOCAL = (import.meta.env.BASE_URL || './') + 'assets/';
// jsDelivr caps a repo at 50 MB, so the files live in two (tools/publish-assets.sh): world, icons, sounds and animations
// in the first, models and music in the second
const CDN1 = import.meta.env.VITE_ASSET_BASE_1 || '', CDN2 = import.meta.env.VITE_ASSET_BASE_2 || '';
const PART2 = /^(models|music)\//;
let useCdn = !!(CDN1 && CDN2);
export const asset = (p) => (useCdn ? (PART2.test(p) ? CDN2 : CDN1) : LOCAL) + p;
export const assetHost = () => (useCdn ? 'cdn' : 'local');
// call once before loading anything big: a quick look at the CDN, falling back to the local copy
export async function pickAssetHost() {
  if (!useCdn) return 'local';
  try {
    const c = new AbortController(), timer = setTimeout(() => c.abort(), 4000);
    const r = await Promise.all([fetch(CDN1 + 'ui/items/item_Gold.png', { signal: c.signal }), fetch(CDN2 + 'models/mobs/Skelly.glb', { method: 'HEAD', signal: c.signal })]);
    clearTimeout(timer); if (!r.every((x) => x.ok)) throw new Error('cdn');
  } catch { useCdn = false; }
  return assetHost();
}
