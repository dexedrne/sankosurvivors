import { loadBunOwnership } from './bun-ownership.js';
import { BUN_APPEARANCES } from './bun-catalogue.js';

export function bunChoice(value) {
  if (typeof value !== 'string' || !/^bun:(?:0|[1-9][0-9]{0,77})$/.test(value)) return null;
  return BigInt(value.slice(4)) < (1n << 256n) ? value : null;
}

const empty = status => Object.freeze({ status, pets: Object.freeze([]) });
export function createBunCompanions({ walletNow, walletRevision, onChange, load = loadBunOwnership, now = Date.now }) {
  let generation = 0, controller = null, scope = null, result = empty('idle'), checkedAt = 0;
  function current() {
    const address = walletNow()?.address?.toLowerCase();
    return { address: /^0x[0-9a-f]{40}$/.test(address || '') && !/^0x0{40}$/.test(address) ? address : null, identity: walletRevision() };
  }
  const same = (a,b) => a && b && a.address === b.address && a.identity === b.identity;
  const state = () => same(scope, current()) ? result : empty('idle');
  function clear() {
    generation++; controller?.abort(); controller = null; scope = current(); checkedAt = now(); result = empty('idle'); onChange();
  }
  async function refresh() {
    const attempt = ++generation; controller?.abort(); controller = new AbortController();
    scope = current(); const owner = scope, signal = controller.signal;
    const isCurrent = () => generation === attempt && same(owner, current()) && !signal.aborted;
    checkedAt = now(); result = empty(owner.address ? 'loading' : 'idle'); onChange();
    if (!owner.address) return false;
    let read;
    try { read = await load(owner.address, { signal, identity: owner.identity, isCurrent }); } catch { /* public service unavailable */ }
    if (!isCurrent()) return false;
    const ready = read?.status === 'ready' && read.address === owner.address && read.identity === owner.identity &&
      /^0x[0-9a-f]+$/i.test(read.block?.number || '') && /^0x[0-9a-f]{64}$/i.test(read.block?.hash || '') && Array.isArray(read.pets) && read.pets.length <= 32;
    result = ready ? Object.freeze({ status:'ready', pets:Object.freeze(read.pets.map(pet => Object.freeze({
      tokenId: pet.tokenId, variety: pet.variety,
      eligible: !!(bunChoice('bun:' + pet.tokenId) && pet.type === 'Bun' && pet.eligible && Object.hasOwn(BUN_APPEARANCES, pet.variety)),
    }))) }) : empty('unavailable');
    checkedAt = now(); onChange(); return !!ready;
  }
  return { state, clear, refresh,
    resolve(value) {
      if (!bunChoice(value)) return null;
      const pet = state().pets.find(pet => pet.eligible && 'bun:' + pet.tokenId === value);
      return pet ? 'bun:' + pet.variety : null;
    },
    sync(active) {
      if (!same(scope, current()) || active && result.status !== 'loading' && scope.address && now() - checkedAt >= 60000) return refresh();
      return null;
    },
  };
}
