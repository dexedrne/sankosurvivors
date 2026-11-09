import { GEAR, alchValue, casketWeights } from './content.js';

export const MERCHANT = { first: 180, firstJitter: 60, every: 240, jitter: 120, life: 75, range: 3 };
export const merchantEligible = sim => sim.pace === 2 && !sim.ranked && !sim.coop && sim.players.length === 1;
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
