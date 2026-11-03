import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

// public/sw.js run against mock caches, fetch and self (security pass 3: the Draco decoder and any .js/.wasm are
// network-first, so a poisoned cached copy is never served while online, and the v2 cache is dropped)
const ORIGIN = 'https://sankosurvivors.quest';
const source = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
const CACHE = source.match(/const CACHE = '([^']+)'/)[1]; // the worker's own cache name (asserted to be sqs-v3 below)
const href = (k) => (typeof k === 'string' ? new URL(k, ORIGIN).href : k.url);
const flush = () => new Promise((r) => setImmediate(r));

function response(body, { status = 200, type = 'text/javascript' } = {}) {
  return { body, status, ok: status >= 200 && status < 300, headers: { get: (h) => (h.toLowerCase() === 'content-type' ? type : null) }, clone() { return response(body, { status, type }); } };
}
function request(path, { destination = '', mode = 'cors', method = 'GET', headers = {} } = {}) {
  return { url: new URL(path, ORIGIN).href, destination, mode, method, headers: { has: (h) => Object.hasOwn(headers, h.toLowerCase()) } };
}
function worker({ network = {}, offline = false } = {}) {
  const stores = new Map(), handlers = {}, fetched = [], opened = [];
  const store = (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const m = stores.get(name);
    return { match: async (k) => m.get(href(k)), put: async (k, res) => { m.set(href(k), res); }, addAll: async (list) => { for (const k of list) m.set(href(k), response('installed ' + k, { type: 'text/html' })); } };
  };
  const caches = {
    open: async (name) => { opened.push(name); return store(name); },
    keys: async () => [...stores.keys()],
    delete: async (name) => stores.delete(name),
    match: async (k) => { for (const m of stores.values()) if (m.has(href(k))) return m.get(href(k)); return undefined; },
  };
  const fetch = async (req) => {
    fetched.push(href(req));
    if (offline) throw new TypeError('offline');
    const r = network[new URL(href(req)).pathname];
    if (!r) throw new TypeError('no route');
    return r();
  };
  const self = { addEventListener: (type, fn) => { handlers[type] = fn; }, skipWaiting: async () => {}, clients: { claim: async () => {} } };
  runInNewContext(source, { self, caches, fetch, location: { origin: ORIGIN }, URL, Promise });
  const dispatch = async (type, extra = {}) => {
    const waits = [];
    let answer = null;
    handlers[type]({ ...extra, waitUntil: (p) => waits.push(p), respondWith: (p) => { answer = p; } });
    const res = answer ? await answer : undefined;
    await Promise.all(waits); await flush();
    return { res, responded: !!answer };
  };
  const seed = (name, path, res) => stores.has(name) ? stores.get(name).set(href(path), res) : stores.set(name, new Map([[href(path), res]]));
  return { stores, fetched, opened, dispatch, seed, fetchEvent: (req) => dispatch('fetch', { request: req }) };
}

test('the cache is sqs-v3 and activating drops sqs-v2 and anything older', async () => {
  assert.equal(CACHE, 'sqs-v3');
  const w = worker();
  w.seed('sqs-v2', '/draco/draco_wasm_wrapper.js', response('poisoned'));
  w.seed('sqs-v1', '/', response('old page', { type: 'text/html' }));
  await w.dispatch('install');
  assert.deepEqual(w.opened, [CACHE]);
  await w.dispatch('activate');
  assert.deepEqual([...w.stores.keys()], [CACHE]);
});

test('a poisoned Draco decoder in the cache: online, the network copy is served and refreshes the cache', async () => {
  for (const path of ['/draco/draco_wasm_wrapper.js', '/draco/draco_decoder.wasm', '/assets/draco/draco_decoder.js', '/assets/game.mjs']) {
    const w = worker({ network: { [path]: () => response('real ' + path) } });
    w.seed(CACHE, path, response('poisoned'));
    const { res } = await w.fetchEvent(request(path)); // destination '': DRACOLoader fetch()es its decoder
    assert.equal(res.body, 'real ' + path, path);
    assert.deepEqual(w.fetched, [ORIGIN + path]);
    assert.equal(w.stores.get(CACHE).get(ORIGIN + path).body, 'real ' + path, 'the cache now holds the network copy');
  }
});

test('offline, the cached decoder is still served', async () => {
  const w = worker({ offline: true });
  w.seed(CACHE, '/draco/draco_wasm_wrapper.js', response('cached decoder'));
  const { res } = await w.fetchEvent(request('/draco/draco_wasm_wrapper.js'));
  assert.equal(res.body, 'cached decoder');
});

test('scripts, styles and workers stay network-first, shared workers too', async () => {
  for (const destination of ['script', 'style', 'worker', 'sharedworker']) {
    const w = worker({ network: { '/assets/x': () => response('net') } });
    w.seed(CACHE, '/assets/x', response('stale'));
    assert.equal((await w.fetchEvent(request('/assets/x', { destination }))).res.body, 'net', destination);
  }
});

test('other game files are still cache-first, refreshed in the background', async () => {
  const w = worker({ network: { '/assets/models/Skelly.glb': () => response('new model', { type: 'model/gltf-binary' }) } });
  w.seed(CACHE, '/assets/models/Skelly.glb', response('cached model', { type: 'model/gltf-binary' }));
  const { res } = await w.fetchEvent(request('/assets/models/Skelly.glb'));
  assert.equal(res.body, 'cached model');
  assert.equal(w.stores.get(CACHE).get(ORIGIN + '/assets/models/Skelly.glb').body, 'new model');
});

test('navigations: only an ok text/html / is stored', async () => {
  const cases = [
    ['/', 200, 'text/html; charset=utf-8', true],
    ['/index.html', 200, 'text/html', true],
    ['/', 200, 'application/javascript', false],
    ['/', 500, 'text/html', false],
    ['/other', 200, 'text/html', false],
  ];
  for (const [path, status, type, stored] of cases) {
    const w = worker({ network: { [path]: () => response('page ' + path, { status, type }) } });
    const { res } = await w.fetchEvent(request(path, { mode: 'navigate', destination: 'document' }));
    assert.equal(res.body, 'page ' + path);
    const keys = [...(w.stores.get(CACHE)?.keys() ?? [])];
    assert.deepEqual(keys, stored ? [ORIGIN + '/'] : [], `${path} ${status} ${type}`);
  }
});

test('the API, other origins, POSTs and range requests are never handled', async () => {
  const w = worker({ network: {} });
  for (const req of [request('/api/ranked-week'), { ...request('/x.js'), url: 'https://cdn.jsdelivr.net/gh/x/y@1/x.js' }, request('/x.js', { method: 'POST' }), request('/assets/music/a.mp3', { headers: { range: 'bytes=0-' } })]) {
    assert.equal((await w.fetchEvent(req)).responded, false, req.url);
  }
  assert.equal(w.fetched.length, 0);
});
