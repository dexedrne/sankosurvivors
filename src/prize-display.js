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
  if (estimate.prizes.length < 5) notes.push(`Unfilled places: ${dmtText(estimate.rollover)} DMT rollover.`);
  return notes;
}

// A current-standings estimate only; the owner reviews winners before the canonical payout plan is created.
export function prizeEstimate(race, places, payouts) {
  const pool = amount(race?.poolWei);
  if (pool === null || race.rolloverReady !== true || !Array.isArray(payouts) || payouts.length !== 5) return null;
  const weights = payouts.map(p => Math.round(p * 100));
  if (weights.some(p => !Number.isInteger(p) || p < 0) || weights.reduce((a,b) => a+b,0) !== 100) return null;
  const shares = weights.map(p => pool * BigInt(p) / 100n);
  const count = Math.min(places.filter(p => p >= 0).length, shares.length);
  if (count) shares[count - 1] += pool - shares.reduce((a,b) => a+b,0n);
  const prizes = shares.slice(0, count);
  return { prizes: prizes.map(String), rollover: String(pool - prizes.reduce((a,b) => a+b,0n)) };
}
