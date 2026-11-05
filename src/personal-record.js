// Same personal-record order as casual boards: victory, whole seconds, then kills. Keep the old record on a full tie.
export function betterRun(a, b) {
  const valid = r => r && typeof r === 'object' && !Array.isArray(r) && typeof r.t === 'number' && Number.isFinite(r.t) && r.t >= 0;
  if (!valid(a)) return valid(b) ? b : null;
  if (!valid(b)) return a;
  const key = r => [r.won === true ? 1 : 0, Math.floor(r.t), Number.isFinite(r.kills) ? Math.min(999999, Math.max(0, Math.floor(r.kills))) : 0];
  const x = key(a), y = key(b);
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return y[i] > x[i] ? b : a;
  return a;
}

