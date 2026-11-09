const continuedBaselines = new WeakMap();
export const continuationBaseline = sim => continuedBaselines.get(sim) || null;

// Live-only continuation state: the existing reward journal owns durable profile writes.
export function canContinueCasual(sim) {
  return !!sim && !sim.ranked && !sim.coop && !sim.endless && sim.over === 'win' && sim.players[0]?.alive === true;
}
export function captureRewardBaseline(sim, receipt) {
  if (!canContinueCasual(sim)) throw Error('Not a casual victory');
  return { sim, kills: sim.kills, bossKills: sim.bossKills, evolves: sim.evolves,
    killsByType: { ...sim.killsByType }, caskets: sim.loot.length,
    merchantSpent: sim.merchantSpent || 0, merchantLootCount: sim.merchantLootIndices?.length || 0,
    killCoins: Math.floor(sim.kills / 6), pickupCoins: sim.players[0].coins * 3,
    alch: Math.max(0, Math.floor(sim.players[0].alch || 0)), alchedCount: sim.alched.length,
    sold: receipt.loot.map(item => item.soldCoins || 0) };
}
export function continueCasual(sim, baseline) {
  if (!canContinueCasual(sim) || baseline?.sim !== sim) throw Error('Continuation no longer available');
  sim.endless = true; sim.over = null;
  continuedBaselines.set(sim, baseline);
}
export function phaseCoins(sim, { won = false, multiplier = 1, baseline = null, player = sim.players[0] } = {}) {
  if (baseline && baseline.sim !== sim) throw Error('Wrong reward baseline');
  const kills = sim.coop ? player.kills : sim.kills;
  const bonus = sim.endless ? Math.floor(Math.max(0, sim.t - sim.map.length) / 10) : 0;
  const base = Math.floor(kills / 6) - (baseline?.killCoins || 0) + player.coins * 3 - (baseline?.pickupCoins || 0) + (won && !baseline ? 120 : 0) + bonus;
  const earned = Math.round(base * multiplier) + phaseAlch(sim, baseline, player), spent = (sim.merchantSpent || 0) - (baseline?.merchantSpent || 0);
  // Losing a coin bonus must not make earlier shopping charge the saved profile.
  return earned - Math.min(Math.max(0, earned), spent);
}
export function phaseAlch(sim, baseline = null, player = sim.players[0]) {
  const alreadySold = baseline ? (sim.alchedLootIndices || []).slice(baseline.alchedCount).reduce((sum, id) => sum + (baseline.sold[id] || 0), 0) : 0;
  return Math.max(0, Math.floor(player.alch || 0)) - (baseline?.alch || 0) - alreadySold;
}
const submissions = new WeakMap();
export function submitCasualResult(result, payload, send) {
  let state = submissions.get(result);
  if (state?.accepted || result.sent) return Promise.resolve(state?.accepted || { ok: true });
  if (!state) { state = { payload: { ...payload }, promise: null }; submissions.set(result, state); }
  if (!state.promise) state.promise = Promise.resolve(send(state.payload)).then(out => {
    if (out.ok) { state.accepted = out; result.sent = true; }
    return out;
  }).finally(() => { state.promise = null; });
  return state.promise;
}
