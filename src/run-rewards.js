// Completed-run profile changes only. Ranked scores and wallet credentials stay with their existing owners.
import { GEAR, QUESTS, isWeaponItem } from './content.js';
import { profileValue, profileBest, finiteNumber } from './progress-values.js';
import { betterRun } from './personal-record.js';
import { RUN_REWARD_KEYS } from './progress-import.js';

export function prepareRunRewards(storage, sim, { earned, ranked = false }) {
  // A failed read must not become an empty profile that overwrites existing progress.
  const raw = Object.fromEntries(RUN_REWARD_KEYS.map(key => [key, storage.getItem(key)]));
  const load = (key, fallback) => { try { return profileValue(key, JSON.parse(raw[key]) ?? fallback, fallback); } catch { return fallback; } };
  const data = {}, save = (key, value) => { data[key] = JSON.stringify(value); };
  const won = sim.over === 'win', p = sim.players[0], record = { t: Math.floor(sim.t), level: sim.level, kills: sim.kills, won };
  const previous = load('sq-best', null);
  if (betterRun(previous, record) === record) save('sq-best', record);
  const cleared = new Set(load('sq-cleared', [])), clearedBefore = cleared.size;
  if (won) { cleared.add(sim.map.id); save('sq-cleared', [...cleared]); }
  let coins = finiteNumber(load('sq-coins', 0)) + earned, bank = load('sq-bank', []), bankChanged = false;
  const bankItem = (name, sell = true) => {
    if (!Object.hasOwn(GEAR, name)) return false;
    if (bank.includes(name)) { if (sell) coins += 25; return false; }
    bank.push(name); bankChanged = true; return true;
  };
  const alched = [...(sim.alched || [])], worn = p.gear || {};
  const loot = sim.loot.map(name => {
    const ai = alched.indexOf(name), wasAlched = ai >= 0; if (wasAlched) alched.splice(ai, 1);
    const fresh = !isWeaponItem(name) && bankItem(name, !wasAlched);
    return { name, wasAlched, fresh, on: Object.values(worn).includes(name) };
  });
  const stats = load('sq-stats', {}), add = (key, value) => { stats[key] = finiteNumber(stats[key]) + value; };
  add('kills', sim.kills); add('bosses', sim.bossKills); add('evolves', sim.evolves); add('caskets', sim.loot.length);
  for (const [type, count] of Object.entries(sim.killsByType)) add('kills.' + type, count);
  add('kills.spiders', (sim.killsByType.spider || 0) + (sim.killsByType.jspider || 0) + (sim.killsByType.pspider || 0));
  add('dragons', sim.killsByType.dragon || 0);
  stats.bestTime = Math.max(finiteNumber(stats.bestTime), Math.floor(sim.t)); stats.cleared = cleared.size;
  save('sq-stats', stats);
  const done = new Set(load('sq-quests', [])), quests = [];
  for (const q of QUESTS) {
    if (done.has(q.id) || finiteNumber(stats[q.stat]) < q.goal) continue;
    done.add(q.id); coins += q.coins; if (q.item) bankItem(q.item); quests.push(q);
  }
  save('sq-coins', coins); if (bankChanged) save('sq-bank', bank); save('sq-quests', [...done]);
  let personalBest = null, newPersonalBest = false;
  if (!ranked) {
    const all = load('sq-bests', {}), key = `${sim.map.id}:${sim.hard ? 'h' : 'n'}:${sim.endless ? 'e' : 'r'}`;
    personalBest = profileBest(all[key]); newPersonalBest = betterRun(personalBest, record) === record;
    if (newPersonalBest) { all[key] = record; save('sq-bests', all); }
  }
  return { data, record, cleared: [...cleared], clearedBefore, loot, quests, personalBest, newPersonalBest };
}
