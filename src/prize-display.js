import {allocateRewards} from './reward-policy.js';
const amount = value => typeof value === 'string' && /^(0|[1-9]\d{0,77})$/.test(value) && BigInt(value) < 1n << 256n ? BigInt(value) : null;

export function dmtText(value) {
  const n = amount(value);
  if (n === null) return '—';
  return `${n / 10n ** 18n}.${(n % 10n ** 18n).toString().padStart(18, '0')}`.replace(/\.?0+$/, '');
}

export function poolReadout(race) {
  const complete = race.rolloverReady === true;
  const value = dmtText(complete ? race.poolWei : race.entryPoolWei);
  return value === '—' ? 'Pool details are updating. Refresh shortly.'
    : `${race.entries} entries · ${value} DMT ${complete ? 'pool' : 'from entries'}.`;
}

export function prizeNotes(race, estimate) {
  if (!estimate) return [race.rolloverReady === false ? 'Rollover pending settlement; prizes unavailable.' : 'Pool details are updating. Refresh shortly.'];
  const notes = ['Estimates at current standings, before review.'];
  if (dmtText(race.incomingWei) !== '0') notes.push(`Includes ${dmtText(race.incomingWei)} DMT rollover.`);
  if (race.week>=1 && estimate.rollover!=='0') notes.push(`Unfilled rewards: ${dmtText(estimate.rollover)} DMT rollover.`);
  else if (estimate.prizes.length < 5) notes.push(`Unfilled places: ${dmtText(estimate.rollover)} DMT rollover.`);
  return notes;
}

// A current-standings estimate only; the owner reviews winners before the canonical payout plan is created.
export function prizeEstimate(race, places, payouts) {
  const pool = amount(race?.poolWei);
  if (pool === null || race.rolloverReady !== true || !Array.isArray(payouts) || payouts.length !== 5) return null;
  const weights = payouts.map(p => Math.round(p * 100));
  if (weights.some(p => !Number.isInteger(p) || p < 0) || weights.some((p,i)=>p!==[40,25,15,12,8][i])) return null;
  try { return allocateRewards(pool,Math.min(places.filter(p=>p>=0).length,5),race.week??0,race.activity); }
  catch { return null; }
}

export function walletPrize(estimate, wallet, place) {
  if (!estimate) return null;
  return String(BigInt(estimate.prizes[place] || '0') + BigInt(estimate.participation?.find(r => r.wallet === wallet)?.amount || '0'));
}
