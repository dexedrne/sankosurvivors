import { GEAR, GEAR_SETS, gearOn, gearBonus } from './content.js';

export function canAutoEquip(player, item, pace = 2) {
  if (!player || !gearOn(item, pace)) return false;
  const gear = player.gear || {}, old = gear[GEAR[item].slot];
  if (old && (!gearOn(old, pace) || GEAR_SETS[GEAR[old].set] && GEAR[item].set !== GEAR[old].set)) return false;
  const before = gearBonus(gear, player.gearLv || {}, pace), after = gearBonus({ ...gear, [GEAR[item].slot]: item }, player.gearLv || {}, pace);
  let improved = false;
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (key === 'sets') continue;
    const a = before[key] || 0, b = after[key] || 0;
    if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return false;
    if (b > a) improved = true;
  }
  return improved;
}
