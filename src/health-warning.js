// Display only: no flashing, combat changes or persistent settings.
export function lowHealthOpacity(player, active) {
  if (!active || !player?.alive || !Number.isFinite(player.hp) || !Number.isFinite(player.maxHp) || player.maxHp <= 0) return 0;
  return Math.max(0, Math.min(0.55, (0.25 - player.hp / player.maxHp) * 2.2));
}
