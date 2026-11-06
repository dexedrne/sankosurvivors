const KEY = 'sq-screen-layout', MODES = ['auto', 'standard', 'ds'];

export function createScreenLayout(onChange) {
  const available = typeof navigator !== 'undefined' && (navigator.userAgentData?.mobile === true || /iPhone|iPod|Android.*Mobile/i.test(navigator.userAgent || ''));
  let mode = available ? 'auto' : 'standard', active = false;
  if (available) try { const saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (MODES.includes(saved)) mode = saved; } catch { /* this visit only */ }
  const folded = matchMedia('(device-posture: folded)'), stacked = matchMedia('(vertical-viewport-segments: 2)');
  let wasFolded = folded.matches, wasStacked = stacked.matches;
  const apply = () => {
    const next = available && (mode === 'ds' || mode === 'auto' && folded.matches && stacked.matches);
    document.body.classList.toggle('ds-layout', next);
    const changed = next !== active || next && (wasFolded !== folded.matches || wasStacked !== stacked.matches);
    wasFolded = folded.matches; wasStacked = stacked.matches; active = next;
    if (changed) onChange();
  };
  folded.addEventListener('change', apply); stacked.addEventListener('change', apply);
  new ResizeObserver(() => { if (active) onChange(); }).observe(document.getElementById('c')); apply();
  return {
    available,
    get mode() { return mode; }, get active() { return active; },
    setMode(value) {
      if (!available || !MODES.includes(value)) return;
      mode = value;
      try { localStorage.setItem(KEY, JSON.stringify(mode)); } catch { /* this visit only */ }
      apply();
    },
  };
}
