import { GEAR, WEAPONS, PASSIVES, MAX_WEAPON_LEVEL, MAX_PASSIVE_LEVEL, alchValue, casketWeights } from './content.js';

export const MERCHANT = { first: 180, firstJitter: 60, every: 240, jitter: 120, life: 75, range: 3 };
export const merchantEligible = sim => !sim.variant && sim.pace === 2 && (!sim.ranked || sim.rankedMerchant) && !sim.coop && sim.players.length === 1;
export function merchantStock(sim) {
  const pool = casketWeights(sim.casketRank, sim.hard, sim.t, { pace: 2 }).filter(([name]) => Object.hasOwn(GEAR, name));
  const offers = [];
  for (let i = 0; i < 3 && pool.length; i++) {
    let roll = sim.rng() * pool.reduce((total, [, weight]) => total + weight, 0), index = 0;
    while (index < pool.length - 1 && (roll -= pool[index][1]) > 0) index++;
    const [[item]] = pool.splice(index, 1);
    offers.push({ item, price: Math.max(60, 2 * alchValue(item) + 20), sold: false });
  }
  return offers;
}

export function merchantServicePrices(runGp, survivedSeconds) {
  const gp = Math.max(0, runGp), minutes = Math.floor(survivedSeconds / 60);
  const quote = (base, perMinute, gpPercent) => Math.ceil(((base + perMinute * minutes) * 100 + gp * gpPercent) / 1000) * 10;
  return { upgrade: quote(70, 4, 20), remove: quote(100, 6, 30) };
}

export function merchantLoadoutOptions(p) {
  return [
    ...Object.entries(p.weapons).flatMap(([id, level]) => Object.hasOwn(WEAPONS, id) ? [{
      id, level, kind: 'weapon', name: WEAPONS[id].name,
      upgrade: level < MAX_WEAPON_LEVEL, remove: Object.keys(p.weapons).length > 1,
    }] : []),
    ...Object.entries(p.passives).flatMap(([id, level]) => Object.hasOwn(PASSIVES, id) ? [{
      id, level, kind: 'passive', name: PASSIVES[id].name,
      upgrade: level < MAX_PASSIVE_LEVEL, remove: true,
    }] : []),
  ];
}
