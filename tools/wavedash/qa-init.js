// A local SDK/storage contract fixture, not Wavedash platform verification.
if (location.pathname.startsWith('/games/sqs/')) {
  const read = Storage.prototype.getItem, put = Storage.prototype.setItem, remove = Storage.prototype.removeItem;
  const credentialKeys = ['sq-wallet', 'sq-dmt', 'sq-cloud', 'sq-cloud-base', 'sq-cloud-upload', 'sq-ranked-live', 'sq-ranked-submit', 'sq-ranked-payment', 'wc@2:core:0.3//keychain'];
  const loads = Number(read.call(sessionStorage, 'qa-loads') || 0) + 1;
  put.call(sessionStorage, 'qa-loads', String(loads));
  if (loads === 1) {
    for (const key of credentialKeys) put.call(localStorage, key, 'fixture-not-a-real-credential');
    for (const [key, value] of Object.entries({ 'sq-coins':'100', 'sq-gear-reset1':'1', 'sq-bank':'["Bronze Helmet"]', 'sq-stats':'{"kills":299,"kills.goblin":299}', 'sq-muted':'true', 'sq-settings':'{"v":2,"quality":"low","res":"0.5","fps":"30","shadows":false,"ao":false,"dof":false}' })) put.call(localStorage, key, value);
  }
  const f = window.__wavedashFixture = { loads, reads: [], calls: [], progress: [], ready: [], events: [], providerReads: 0, fault: null };
  for (const event of ['blur', 'focus', 'resize']) addEventListener(event, () => f.events.push({event, t: performance.now(), width:innerWidth,height:innerHeight,focus:document.hasFocus()}));
  document.addEventListener('visibilitychange', () => f.events.push({event:'visibility', state:document.visibilityState}));
  Storage.prototype.getItem = function(key) { if (this === localStorage) f.reads.push(key); return read.call(this,key); };
  Storage.prototype.setItem = function(key,value) { if (this === localStorage && f.fault?.op === 'set' && f.fault.key === key) throw Error('QA storage failure'); return put.call(this,key,value); };
  Storage.prototype.removeItem = function(key) { if (this === localStorage && f.fault?.op === 'remove' && f.fault.key === key) throw Error('QA storage failure'); return remove.call(this,key); };
  Object.defineProperty(window, 'ethereum', { get() { f.providerReads++; throw Error('QA forbidden provider read'); } });
  const fetchOriginal = window.fetch;
  window.fetch = (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input.url, location.href);
    f.calls.push({ url: url.href, method: init?.method || 'GET' });
    if (url.origin !== location.origin || /\/api\//.test(url.pathname)) throw Error('QA forbidden external/API request');
    if (location.search.includes('failboot') && url.pathname.endsWith('/height.bin')) throw Error('QA intentional world-load failure');
    return fetchOriginal(input, init);
  };
  window.Wavedash = {
    updateLoadProgressZeroToOne: value => f.progress.push(value),
    init() { f.ready.push({ startDisabled: document.getElementById('start').disabled, isolated: crossOriginIsolated }); return f.ready.length === 1; },
  };
}
