// Offline cache for the installed app. The page, the game's code (scripts, workers, .js and .wasm, including the Draco
// decoder that is fetch()ed) and world data are network-first, so updates show up right away and a cached copy is used
// only offline; other game files are served from cache and refreshed in the background.
// The API (leaderboard, bug reports) is never cached.
const CACHE = 'sqs-v3'; // v3 (security pass 3): drops any poisoned v2 entries
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/manifest.webmanifest', '/icons/air-shard-192.png'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  if (req.mode === 'navigate') {
    const racers = url.pathname === '/fun/racers/' || url.pathname === '/fun/racers/index.html';
    const page = racers ? '/fun/racers/' : '/';
    e.respondWith(fetch(req).then((res) => {
      if (res.ok && (racers || url.pathname === '/' || url.pathname === '/index.html') && /^text\/html/.test(res.headers.get('content-type') || '')) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(page, copy)); }
      return res;
    }).catch(() => caches.match(page)));
    return;
  }
  if (req.headers.has('range')) return; // music streams
  if (['script', 'style', 'worker', 'sharedworker'].includes(req.destination) || /\.(m?js|wasm)$/.test(url.pathname)) { // code, including Draco's fetch()ed decoder: always the network's when online
    e.respondWith(fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; }).catch(() => caches.match(req)));
    return;
  }
  if (/\.(json|webmanifest)$/.test(url.pathname)) { // world data: always the newest when online
    e.respondWith(fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; }).catch(() => caches.match(req)));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = await c.match(req);
    const net = fetch(req).then((res) => { if (res.ok && res.status === 200) c.put(req, res.clone()); return res; }).catch(() => hit);
    if (hit) { e.waitUntil(net); return hit; }
    return net;
  }));
});
