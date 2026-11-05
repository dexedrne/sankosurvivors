// The relay carries approvals back to this PWA; wallet links never open another copy of the game.
export function createWalletConnect(projectId, origin, load = () => import('@walletconnect/universal-provider')) {
  if (!/^[\da-f]{32}$/i.test(projectId || '')) return null;
  const url = new URL(origin).origin, chain = 'eip155:42161', listeners = new Map();
  let ready = null, generation = null, pairing = null, activeTopic = null, selected = [], ui = null;
  const emit = (event, value) => { for (const fn of listeners.get(event) || []) fn(value); };
  const show = value => { ui = value; emit('ui', ui); return value; };
  const hide = owner => { if (ui === owner) { ui = null; emit('ui', null); } };
  const stored = () => { try { return JSON.parse(localStorage.getItem('sq-walletconnect') || 'null'); } catch { return null; } };
  const remember = value => { try { if (value) localStorage.setItem('sq-walletconnect', JSON.stringify(value)); else localStorage.removeItem('sq-walletconnect'); } catch { /* this visit only */ } };
  const addresses = list => Array.isArray(list) ? list.map(a => typeof a === 'string' && a.startsWith(chain + ':') ? a.slice(chain.length + 1) : a).filter(a => typeof a === 'string' && /^0x[\da-f]{40}$/i.test(a)) : [];
  const accounts = sdk => {
    const ns = sdk.session?.namespaces || {}, list = ns.eip155?.accounts || ns[chain]?.accounts;
    return addresses(Array.isArray(list) ? list.filter(a => typeof a === 'string' && a.startsWith(chain + ':')) : []);
  };
  const save = owner => { if (generation === owner) remember(activeTopic ? { prefix: owner.prefix, topic: activeTopic, selected } : null); };
  const close = async owner => {
    try { if (owner.sdk?.session) await owner.sdk.disconnect(); } catch { /* isolated obsolete session */ }
    try { await owner.sdk?.client?.core?.relayer?.transportClose(); } catch { /* already closed */ }
  };
  const retire = owner => {
    if (generation !== owner) return;
    generation = null; ready = null; activeTopic = null; selected = []; remember(null);
    void close(owner);
  };
  const init = () => ready ||= (async () => {
    const saved = stored(), prefix = /^sankosurvivors-[\da-f-]{36}$/.test(saved?.prefix || '') ? saved.prefix : 'sankosurvivors-' + crypto.randomUUID();
    const owner = generation = { prefix, sdk: null };
    const { UniversalProvider } = await load();
    const sdk = owner.sdk = await UniversalProvider.init({ projectId, customStoragePrefix: prefix, telemetryEnabled: false, logger: 'silent',
      metadata: { name: 'SankoSurvivors', description: 'Connect your wallet to SankoSurvivors', url, icons: [url + '/icons/air-shard-512.png'] } });
    const granted = accounts(sdk);
    if (granted.length && (!saved || saved.topic === sdk.session.topic)) {
      activeTopic = sdk.session.topic;
      selected = saved ? addresses(saved.selected).filter(a => granted.some(g => g.toLowerCase() === a.toLowerCase())) : granted;
    }
    sdk.on('display_uri', uri => { if (generation === owner && pairing?.owner === owner && typeof uri === 'string' && uri.startsWith('wc:')) pairing.screen = show({ phase: 'pair', uri }); });
    const owns = topic => generation === owner && activeTopic && topic === activeTopic && sdk.session?.topic === activeTopic;
    sdk.on('session_event', message => {
      if (!owns(message.topic) || message.params?.chainId !== chain) return;
      const event = message.params.event;
      if (event?.name === 'accountsChanged' && Array.isArray(event.data)) {
        selected = addresses(event.data); save(owner); emit('accountsChanged', selected);
      }
    });
    sdk.on('session_update', message => {
      if (!owns(message.topic)) return;
      const granted = accounts(sdk), retained = selected.filter(a => granted.some(g => g.toLowerCase() === a.toLowerCase()));
      selected = retained.length ? retained : granted; save(owner); emit('accountsChanged', selected);
    });
    sdk.on('disconnect', () => { if (generation === owner) { retire(owner); emit('accountsChanged', []); } });
    return sdk;
  })().catch(e => { ready = null; throw e; });
  const denied = () => Object.assign(new Error('Connect your wallet again.'), { code: 4100 });
  const p = {
    get ui() { return ui; },
    on(event, fn) { if (!listeners.has(event)) listeners.set(event, new Set()); listeners.get(event).add(fn); return p; },
    removeListener(event, fn) { listeners.get(event)?.delete(fn); return p; },
    dismiss() { if (ui?.phase === 'request') show(null); },
    cancelConnect() { pairing?.cancel(); },
    async request(args) {
      const sdk = await init();
      if (args.method === 'eth_accounts') return activeTopic && sdk.session?.topic === activeTopic ? selected : [];
      if (args.method === 'wallet_revokePermissions') {
        const owner = generation; pairing?.cancel();
        if (owner) retire(owner);
        emit('accountsChanged', []); return null;
      }
      if (args.method === 'eth_requestAccounts') {
        if (activeTopic && sdk.session?.topic === activeTopic && selected.length) return selected;
        let pending = pairing?.promise;
        if (!pairing) {
          const attempt = { screen: null, owner: generation }, cancelled = new Promise((_, reject) => {
            attempt.cancel = () => { if (pairing !== attempt) return; pairing = null; retire(attempt.owner); hide(attempt.screen); reject(Object.assign(new Error('Wallet connection cancelled.'), { code: 4001 })); };
          });
          pairing = attempt;
          const connecting = (async () => {
            if (sdk.session) await sdk.disconnect();
            await sdk.connect({ namespaces: { eip155: { chains: [chain], methods: ['personal_sign', 'eth_sendTransaction'], events: ['accountsChanged', 'chainChanged'], rpcMap: { 42161: 'https://arb1.arbitrum.io/rpc' } } } });
            if (pairing !== attempt) { await close(attempt.owner); throw Object.assign(new Error('Wallet connection cancelled.'), { code: 4001 }); }
            if (!accounts(sdk).length) throw denied();
            activeTopic = sdk.session.topic; selected = accounts(sdk); save(attempt.owner);
            return selected;
          })();
          pending = attempt.promise = Promise.race([connecting, cancelled]).finally(() => { hide(attempt.screen); if (pairing === attempt) pairing = null; });
        }
        return await pending;
      }
      if (!activeTopic || sdk.session?.topic !== activeTopic || !selected.length) throw denied();
      if (args.method === 'eth_chainId') return '0xa4b1';
      if (args.method === 'wallet_switchEthereumChain' || args.method === 'wallet_addEthereumChain') {
        if (String(args.params?.[0]?.chainId).toLowerCase() !== '0xa4b1') throw Object.assign(new Error('This connection supports Arbitrum One.'), { code: 4902 });
        return null;
      }
      const screen = ['personal_sign', 'eth_sendTransaction'].includes(args.method) ? show({ phase: 'request' }) : null;
      try { return await sdk.request(args, chain); }
      finally { if (screen) hide(screen); }
    },
  };
  return { name: 'WalletConnect', rdns: 'org.walletconnect', p };
}

export function walletConnectLinks(uri = null) {
  const query = uri ? '?uri=' + encodeURIComponent(uri) : '';
  return [['MetaMask', 'https://metamask.app.link/' + (uri ? 'wc' : '') + query],
    ['Rabby', 'rabbygo://go.rabby.io/mobile/' + (uri ? 'walletconnect' : '') + query]];
}
