// The end screen ignores confirm presses for a moment after a run ends. Space and the A button are also the roll, so a
// roll pressed just as the player died must not start the next run before they have seen the results (player report
// 18 Nov: "hit spacebar when you die and it immediately closes the final window"). A held key's repeats never count.
export const END_INPUT_LOCK_MS = 1500;

/** Whether the end screen takes a confirm press `now` (ms, same clock as `endedAt`, when the run ended). */
export function endInputOpen(endedAt, now, lockMs = END_INPUT_LOCK_MS) {
  return Number.isFinite(endedAt) && now - endedAt >= lockMs;
}

/** Whether a key press on the end screen may start the next run: a fresh press (not a held key's repeat) after the lock. */
export function endKeyOpen(endedAt, now, repeat, lockMs = END_INPUT_LOCK_MS) {
  return !repeat && endInputOpen(endedAt, now, lockMs);
}
