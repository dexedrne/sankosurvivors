import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const dmtSource = readFileSync(new URL('../src/dmt.js', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
function browser(href = 'https://sankosurvivors.quest/play/?token=private&autostart=1#carry=private-save', lang = 'tr') {
  const listeners = new Map(), timers = new Map(); let next = 0, now = 0;
  const window = {
    addEventListener(name, fn) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn); },
    removeEventListener(name, fn) { listeners.get(name)?.delete(fn); },
    dispatchEvent(event) { for (const fn of listeners.get(event.type) || []) fn(event); return true; },
  };
  const context = { window, createWalletConnect:()=>null, WALLETCONNECT_PROJECT_ID:'', URL, URLSearchParams, Event, TextEncoder, document: { documentElement: { lang } }, location: new URL(href),
    Date: class extends Date { static now() { return now; } },
    setTimeout(fn, ms) { const id = ++next; timers.set(id, { fn, at: now + ms }); return id; },
    clearTimeout(id) { timers.delete(id); },
  };
  context.history = { state: null, replaceState(state, title, url) { context.location = new URL(url, context.location); } };
  vm.runInNewContext(dmtSource.replace(/^import .*;\n/gm, '').replace(/^export /gm, '') + `\nthis.api = { wallets, walletAppLinks,
    takeWalletHandoff: typeof takeWalletHandoff === 'function' ? takeWalletHandoff : undefined,
    watchWallets: typeof watchWallets === 'function' ? watchWallets : undefined };`, context);
  return { ...context.api, context, window, timers, listeners,
    tick() { const first = [...timers].sort((a, b) => a[1].at - b[1].at)[0]; if (!first) return false; timers.delete(first[0]); now = first[1].at; first[1].fn(); return true; },
  };
}
function destination(name, href) {
  const link = new URL(href);
  if (name === 'MetaMask') return new URL('https://' + href.split('/dapp/')[1]);
  if (name === 'Rabby') { assert.equal(link.origin, 'https://go.rabby.io'); assert.equal(link.pathname, '/mobile/'); assert.equal(link.searchParams.get('_cmd'), 'open-dapp'); return new URL(link.searchParams.get('dapp')); }
  return new URL(link.searchParams.get(name === 'Coinbase Wallet' ? 'cb_url' : 'url'));
}
for (const intent of ['connect', 'holder', 'ranked']) test(`${intent} handoff carries only game path, explicit intent and selected language`, () => {
  const h = browser(), links = h.walletAppLinks(intent, 'es');
  assert.ok(links.some(([name]) => name === 'Rabby'), 'verified Rabby browser route is available');
  for (const [name, link] of links) {
    const url = destination(name, link);
    assert.equal(url.origin, 'https://sankosurvivors.quest'); assert.equal(url.pathname, '/play/'); assert.equal(url.hash, '');
    assert.deepEqual([...url.searchParams], [['wallet', intent], ['lang', 'es']]);
    assert.doesNotMatch(link, /private|carry|autostart|token/);
  }
});
test('invalid outbound actions and languages cannot become payment or signing instructions', () => {
  const h = browser();
  for (const [name, link] of h.walletAppLinks('pay', 'en&token=secret')) {
    const url = destination(name, link); assert.equal(url.searchParams.get('wallet'), 'connect'); assert.equal(url.searchParams.get('lang'), null);
  }
});
test('arrival consumes a valid handoff once and validates language', () => {
  const h = browser('https://sankosurvivors.quest/play/?wallet=holder&lang=fil');
  assert.equal(typeof h.takeWalletHandoff, 'function');
  assert.deepEqual(JSON.parse(JSON.stringify(h.takeWalletHandoff())), { intent: 'holder', language: 'fil' });
  assert.equal(h.context.location.search, ''); assert.equal(h.takeWalletHandoff(), null);
});
test('arrival ignores unknown, duplicate and payment intents', () => {
  for (const query of ['wallet=pay', 'wallet=personal_sign', 'wallet=connect&wallet=ranked', 'lang=tr']) {
    const h = browser('https://sankosurvivors.quest/?' + query);
    assert.equal(typeof h.takeWalletHandoff, 'function'); assert.equal(h.takeWalletHandoff(), null);
  }
  const h = browser('https://sankosurvivors.quest/?wallet=connect&lang=not-a-language');
  assert.deepEqual(JSON.parse(JSON.stringify(h.takeWalletHandoff())), { intent: 'connect', language: null });
});
test('late injected providers refresh choices without requesting accounts or signatures', () => {
  const h = browser(), methods = [], seen = []; assert.equal(typeof h.watchWallets, 'function');
  const stop = h.watchWallets(() => seen.push(h.wallets().length));
  const p = { request: ({ method }) => { methods.push(method); } };
  h.window.ethereum = p; h.window.dispatchEvent(new Event('ethereum#initialized'));
  assert.ok(seen.includes(1)); const count = seen.length;
  h.window.dispatchEvent(new Event('ethereum#initialized')); assert.equal(seen.length, count, 'duplicate readiness does not rerender');
  stop(); const stopped = seen.length; h.window.ethereum = { request() {} }; h.window.dispatchEvent(new Event('ethereum#initialized'));
  assert.equal(seen.length, stopped); assert.deepEqual(methods, []); assert.equal(h.timers.size, 0);
});
test('provider polling ends and later EIP-6963 announcements still refresh once', () => {
  const h = browser(), seen = []; assert.equal(typeof h.watchWallets, 'function');
  const stop = h.watchWallets(() => seen.push(h.wallets().length));
  let ticks = 0; while (ticks < 100 && h.tick()) ticks++;
  assert.ok(ticks > 0 && ticks < 100); assert.equal(h.timers.size, 0);
  const event = { type: 'eip6963:announceProvider', detail: { info: { uuid: 'rabby', name: 'Rabby', rdns: 'io.rabby' }, provider: { request() { throw new Error('unexpected wallet prompt'); } } } };
  h.window.dispatchEvent(event); assert.equal(h.wallets()[0].name, 'Rabby'); assert.equal(seen.at(-1), 1);
  const count = seen.length; h.window.dispatchEvent(event); assert.equal(seen.length, count); stop();
});
function mainFunction(name, end) {
  const start = main.indexOf('function ' + name + '('); assert.ok(start >= 0, `${name} exists`);
  const finish = main.indexOf(end, start); assert.ok(finish > start); return main.slice(start, finish);
}
test('arrival opens the requested panel but never calls connect, sign or payment automatically', () => {
  const code = mainFunction('resumeWalletHandoff', "\n$('walletchip')"), opened = [], els = new Map();
  const $ = id => { if (!els.has(id)) els.set(id, { textContent: '', classList: { remove() { opened.push(id); } } }); return els.get(id); };
  const forbidden = () => { throw new Error('automatic wallet action'); };
  const resume = Function('$', 'openWallet', 'openRanked', 'renderDmt', 'showRankedWalletChoices', 'walletNow', 'walletConnect', 'prove', 'payEntry', code + '; return resumeWalletHandoff;')(
    $, () => opened.push('wallet'), () => opened.push('ranked'), () => {}, () => opened.push('choices'), () => null, forbidden, forbidden, forbidden);
  resume({ intent: 'connect' }); assert.deepEqual(opened.splice(0), ['wallet']);
  resume({ intent: 'holder' }); assert.deepEqual(opened.splice(0), ['dmt']);
  resume({ intent: 'ranked' }); assert.deepEqual(opened.splice(0), ['ranked', 'choices']);
  resume(null); resume({ intent: 'pay' }); assert.deepEqual(opened, []);
  assert.match(main, /resumeWalletHandoff\(walletHandoff\)/, 'arrival is wired at startup');
});
test('wallet choices keep explicit Connect buttons without redirecting a PWA into wallet browsers', () => {
  const code = mainFunction('walletChoices', '\nasync function pickWallet');
  const h = browser(), esc = s => s;
  const choices = Function('wallets', 'walletIcon', 'esc', 'isPhone', 'walletAppLinks', 'document', code + '; return walletChoices;')(
    () => [], () => '', esc, () => true, h.walletAppLinks, h.context.document);
  assert.doesNotMatch(choices(() => {}, 'ranked').html, /open-dapp|metamask.app.link\/dapp/);
  const picked = [], provider = { name: 'MetaMask', p: {} };
  const available = Function('wallets', 'walletIcon', 'esc', 'isPhone', 'walletAppLinks', 'document', code + '; return walletChoices;')(
    () => [provider], () => '', esc, () => true, h.walletAppLinks, h.context.document);
  const result = available(w => picked.push(w)), button = { dataset: { w: '0' } };
  assert.match(result.html, /Connect /); assert.deepEqual(picked, []);
  result.bind({ querySelectorAll: () => [button] }); button.onclick(); assert.deepEqual(picked, [provider]);
});

test('repeated Connect taps share one in-flight wallet prompt and allow retry after rejection', async () => {
  const code = main.slice(main.indexOf('async function pickWallet('), main.indexOf('\nasync function refreshBalances('));
  let calls = 0, reject;
  const pick = Function('walletConnect', 'why', `let walletConnecting = false; ${code}; return pickWallet;`)(
    () => { calls++; return new Promise((resolve, no) => { reject = no; }); }, e => e.message);
  const messages = [], msg = text => messages.push(text);
  const first = pick({}, msg), duplicate = pick({}, msg);
  assert.equal(calls, 1); reject(new Error('Cancelled')); await Promise.all([first, duplicate]);
  const retry = pick({}, msg); assert.equal(calls, 2); reject(new Error('Cancelled again')); await retry;
  assert.equal(messages.at(-1), 'Cancelled again');
});
