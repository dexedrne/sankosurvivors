// Completed-run profile changes only. Ranked scores and wallet credentials stay with their existing owners.
import { GEAR, isWeaponItem } from './content.js';
import { MILESTONES, DUPLICATE_GEAR_COINS } from './profile-milestones.js';
import { profileValue, profileBest, finiteNumber } from './progress-values.js';
import { betterRun } from './personal-record.js';
import { RUN_REWARD_KEYS } from './progress-import.js';

export function prepareRunRewards(storage, sim, { earned, ranked = false, coop = false, playerId, result, baseline = null }) {
  if (baseline && (baseline.sim !== sim || ranked || coop || !sim.endless)) throw Error('Wrong continuation rewards');
  const p = coop ? sim.players.find(p => p.id === playerId) : sim.players[0], owned = coop ? p : sim;
  if (coop !== (sim.coop === true) || coop && (!p || ranked || result !== 'complete' || !sim.over || !Number.isFinite(earned) || earned < 0)) throw Error('Co-op rewards require a verified completed run and its local player.');
  // A failed read must not become an empty profile that overwrites existing progress.
  const raw = Object.fromEntries(RUN_REWARD_KEYS.map(key => [key, storage.getItem(key)]));
  const load = (key, fallback) => { try { return profileValue(key, JSON.parse(raw[key]) ?? fallback, fallback); } catch { return fallback; } };
  const data = {}, save = (key, value) => { data[key] = JSON.stringify(value); };
  const won = sim.over === 'win', record = { t: Math.floor(sim.t), level: sim.level, kills: owned.kills, won };
  const previous = load('sq-best', null);
  if (!coop && betterRun(previous, record) === record) save('sq-best', record);
  const cleared = new Set(load('sq-cleared', [])), clearedBefore = cleared.size;
  if (won) { cleared.add(sim.map.id); save('sq-cleared', [...cleared]); }
  let coins = finiteNumber(load('sq-coins', 0)) + earned, bank = load('sq-bank', []), bankChanged = false;
  const bankItem = (name, sell = true) => {
    if (!Object.hasOwn(GEAR, name)) return false;
    if (bank.includes(name)) { if (sell) coins += DUPLICATE_GEAR_COINS; return false; }
    bank.push(name); bankChanged = true; return true;
  };
  const alched = [...(owned.alched || [])], worn = p.gear || {};
  const indexed = !coop && Array.isArray(sim.alchedLootIndices) && sim.alchedLootIndices.length === alched.length && sim.alchedLootIndices.every(i => Number.isSafeInteger(i) && i >= 0 && i < owned.loot.length);
  const alchedIds = indexed ? new Set(sim.alchedLootIndices) : null;
  const loot = owned.loot.map((name, id) => {
    const ai = alched.indexOf(name), wasAlched = indexed ? alchedIds.has(id) : ai >= 0; if (!indexed && wasAlched) alched.splice(ai, 1);
    if (baseline && id < baseline.caskets) return null;
    const before = coins, fresh = !isWeaponItem(name) && bankItem(name, !wasAlched);
    return { name, wasAlched, fresh, soldCoins: coins - before, on: Object.values(worn).includes(name) };
  }).filter(Boolean);
  const stats = load('sq-stats', {}), add = (key, value) => { stats[key] = finiteNumber(stats[key]) + value; };
  add('kills', owned.kills - (baseline?.kills || 0)); add('bosses', owned.bossKills - (baseline?.bossKills || 0)); add('evolves', owned.evolves - (baseline?.evolves || 0)); add('caskets', owned.loot.length - (baseline?.caskets || 0));
  const deltaKills = Object.fromEntries(Object.entries(owned.killsByType).map(([type, count]) => [type, count - (baseline?.killsByType[type] || 0)]));
  for (const [type, count] of Object.entries(deltaKills)) add('kills.' + type, count);
  add('kills.spiders', (deltaKills.spider || 0) + (deltaKills.jspider || 0) + (deltaKills.pspider || 0));
  add('dragons', deltaKills.dragon || 0);
  stats.bestTime = Math.max(finiteNumber(stats.bestTime), Math.floor(sim.t)); stats.cleared = cleared.size;
  save('sq-stats', stats);
  const done = new Set(load('sq-quests', [])), quests = [];
  for (const q of MILESTONES) {
    if (done.has(q.id) || finiteNumber(stats[q.stat]) < q.goal) continue;
    done.add(q.id); coins += q.coins; if (q.item) bankItem(q.item); quests.push(q);
  }
  save('sq-coins', coins); if (bankChanged) save('sq-bank', bank); save('sq-quests', [...done]);
  let personalBest = null, newPersonalBest = false;
  if (!ranked && !coop) {
    const all = load('sq-bests', {}), key = `${sim.map.id}:${sim.hard ? 'h' : 'n'}:${sim.endless ? 'e' : 'r'}`;
    personalBest = profileBest(all[key]); newPersonalBest = betterRun(personalBest, record) === record;
    if (newPersonalBest) { all[key] = record; save('sq-bests', all); }
  }
  return { data, record, cleared: [...cleared], clearedBefore, loot, quests, personalBest, newPersonalBest };
}
