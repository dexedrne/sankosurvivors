import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const picker = main.slice(main.indexOf('async function pickWallet('), main.indexOf('\nasync function refreshBalances('));
const observerStart = main.indexOf('onWallet(', main.indexOf("$('wallet').addEventListener"));
const observer = main.slice(observerStart, main.indexOf('function renderWalletConnect(', observerStart));
const disconnectStart = main.indexOf("$('wldisc').onclick");
const disconnect = main.slice(disconnectStart, main.indexOf('\n', disconnectStart));
const initial = main.match(/let walletConnecting = [^;]+;/)[0];
const wrapperStart = main.indexOf('async function walletConnect(');
const connectWrapper = wrapperStart < 0 ? 'const walletConnect=requestWallet;' : main.slice(wrapperStart, main.indexOf('// a button for each wallet', wrapperStart));
const A = '0x' + '12'.repeat(20), B = '0x' + '34'.repeat(20), C = '0x' + '56'.repeat(20);
globalThis.window = { addEventListener() {}, dispatchEvent() {} };
let serial = 0;
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
async function fixture() {
  const store = new Map(), elements = new Map(), calls = [];
  globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) };
  const wallet = await import(`../src/wallet.js?picker=${++serial}`);
  const $ = id => {
    if (!elements.has(id)) elements.set(id, { textContent: '', classList: { contains: () => true } });
    return elements.get(id);
  };
  const msg = text => { $('walletmsg').textContent = text; };
  const ui = Function('requestWallet', 'walletDisconnect', 'walletNow', 'onWallet', '$', 'msg', 'why', `
    ${initial}
    ${connectWrapper}
    let walletBal=null;
    let holderChecking=null;const walletRevision=()=>0;const cancelPendingLoads=()=>{},applyDmt=()=>{},renderWallet=()=>{},renderRanked=()=>{},refreshBalances=()=>{};
    ${picker}
    ${observer}
    ${disconnect}
    return {pick:pickWallet,otherConnect:walletConnect,busy:()=>!!walletConnecting,disconnect:()=>$('wldisc').onclick()};
  `)(wallet.connect, wallet.disconnect, wallet.current, wallet.onWallet, $, msg, e => e.message);
  function provider(name, answer) {
    const handlers = new Map();
    return { name, p: {
      async request({ method }) { calls.push([name, method]); return method === 'wallet_revokePermissions' ? null : await answer(); },
      on: (event, callback) => handlers.set(event, callback),
    }, event: accounts => handlers.get('accountsChanged')?.(accounts) };
  }
  const selected = provider('Selected', () => [B]); await wallet.connect(selected);
  return { wallet, ui, selected, provider, calls, msg, message: () => $('walletmsg').textContent };
}

test('Disconnect permits a new picker request before the old provider responds', async () => {
  const f = await fixture(), old = deferred(), next = deferred();
  const one = f.ui.pick(f.provider('Old', () => old.promise), f.msg);
  f.ui.disconnect();
  const two = f.ui.pick(f.provider('New', () => next.promise), f.msg);
  const newAsked = f.calls.filter(([name, method]) => name === 'New' && method === 'eth_requestAccounts').length;
  old.resolve([A]); await one; next.resolve([C]); await two;
  assert.equal(newAsked, 1); assert.equal(f.wallet.current()?.address, C);
});
for (const outcome of ['resolve', 'reject']) test(`old ${outcome} leaves the Disconnect message intact`, async () => {
  const f = await fixture(), old = deferred();
  const one = f.ui.pick(f.provider('Old', () => old.promise), f.msg);
  f.ui.disconnect(); assert.equal(f.message(), 'Disconnected.');
  if (outcome === 'resolve') old.resolve([A]); else old.reject(new Error('old fixture rejection'));
  await one;
  assert.equal(f.message(), 'Disconnected.'); assert.equal(f.wallet.current(), null); assert.equal(f.ui.busy(), false);
});
test('old completion cannot unlock a new pending picker or allow duplicate prompts', async () => {
  const f = await fixture(), old = deferred(), next = deferred(), w = f.provider('New', () => next.promise);
  const one = f.ui.pick(f.provider('Old', () => old.promise), f.msg);
  f.ui.disconnect(); const two = f.ui.pick(w, f.msg);
  old.resolve([A]); await one;
  const stillBusy = f.ui.busy(), waitingMessage = f.message();
  const duplicate = f.ui.pick(w, f.msg);
  next.resolve([C]); await Promise.all([two, duplicate]);
  assert.equal(stillBusy, true); assert.equal(waitingMessage, 'Approve the connection in your wallet…');
  assert.equal(f.calls.filter(([name, method]) => name === 'New' && method === 'eth_requestAccounts').length, 1);
  assert.equal(f.wallet.current()?.address, C); assert.equal(f.ui.busy(), false); assert.equal(f.message(), '');
});
test('old completion cannot overwrite a completed newer connection', async () => {
  const f = await fixture(), old = deferred();
  const one = f.ui.pick(f.provider('Old', () => old.promise), f.msg);
  f.ui.disconnect(); await f.ui.pick(f.provider('New', () => [C]), f.msg);
  const before = f.message(); old.resolve([A]); await one;
  assert.equal(f.wallet.current()?.address, C); assert.equal(before, ''); assert.equal(f.message(), '');
});
test('an active wallet lock releases the pending picker for a new choice', async () => {
  const f = await fixture(), old = deferred();
  const one = f.ui.pick(f.provider('Old', () => old.promise), f.msg);
  f.selected.event([]); await f.ui.pick(f.provider('New', () => [C]), f.msg);
  old.resolve([A]); await one;
  assert.equal(f.wallet.current()?.address, C); assert.equal(f.message(), '');
});
test('a different provider connected by another panel supersedes picker status', async () => {
  const f = await fixture(), old = deferred();
  const one = f.ui.pick(f.provider('Old', () => old.promise), f.msg);
  await f.wallet.connect(f.provider('Other panel', () => [C]));
  const busy = f.ui.busy(), message = f.message();
  old.resolve([A]); await one;
  assert.equal(busy, false); assert.equal(message, ''); assert.equal(f.message(), ''); assert.equal(f.wallet.current()?.address, C);
});
test('normal success/rejection/retry retains picker feedback and duplicate guard', async () => {
  const f = await fixture(), pending = deferred(), w = f.provider('Retry', () => pending.promise);
  const first = f.ui.pick(w, f.msg), duplicate = f.ui.pick(w, f.msg);
  pending.reject(new Error('fixture rejection')); await Promise.all([first, duplicate]);
  assert.equal(f.calls.filter(([name]) => name === 'Retry').length, 1);
  assert.equal(f.message(), 'fixture rejection'); assert.equal(f.ui.busy(), false);
  await f.ui.pick(f.provider('Success', () => [A]), f.msg);
  assert.equal(f.wallet.current()?.address, A); assert.equal(f.message(), ''); assert.equal(f.ui.busy(), false);
});
test('matching account events during a prompt retain its duplicate-tap guard', async () => {
  const f = await fixture(), pending = deferred(); let requests = 0;
  const w = f.provider('Same', () => ++requests === 1 ? [A] : pending.promise);
  await f.wallet.connect(w);
  const first = f.ui.pick(w, f.msg); w.event([C]);
  const busy = f.ui.busy(), duplicate = f.ui.pick(w, f.msg);
  pending.resolve([C]); await Promise.all([first, duplicate]);
  assert.equal(busy, true); assert.equal(requests, 2);
  assert.equal(f.wallet.current()?.address, C); assert.equal(f.message(), ''); assert.equal(f.ui.busy(), false);
});
for (const result of ['resolve', 'reject']) test(`same-provider connection from another panel releases old picker before its ${result}`, async () => {
  const f = await fixture(), old = deferred(); let requests = 0;
  f.ui.disconnect();
  const same = f.provider('Same', () => ++requests === 1 ? old.promise : [A]);
  const first = f.ui.pick(same, f.msg);
  await f.ui.otherConnect(same);
  const busy = f.ui.busy(), message = f.message();
  await f.ui.pick(f.provider('New', () => [C]), f.msg);
  if (result === 'resolve') old.resolve([A]); else old.reject(new Error('old fixture rejection'));
  await first;
  assert.equal(busy, false); assert.equal(message, '');
  assert.equal(f.wallet.current()?.address, C); assert.equal(f.message(), '');
  assert.equal(f.calls.filter(([name]) => name === 'New').length, 1);
});
test('rejected same-provider request from another panel still supersedes old picker ownership', async () => {
  const f = await fixture(), old = deferred(); let requests = 0;
  f.ui.disconnect();
  const same = f.provider('Same', () => { if (++requests === 1) return old.promise; throw new Error('new fixture rejection'); });
  const first = f.ui.pick(same, f.msg);
  await assert.rejects(f.ui.otherConnect(same), /new fixture rejection/);
  const busy = f.ui.busy(), message = f.message();
  await f.ui.pick(f.provider('New', () => [C]), f.msg);
  old.resolve([A]); await first;
  assert.equal(busy, false); assert.equal(message, '');
  assert.equal(f.wallet.current()?.address, C); assert.equal(f.message(), '');
});
