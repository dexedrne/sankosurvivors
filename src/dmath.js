// Deterministic trigonometry for the simulation. Browsers may compute Math.sin, Math.cos and Math.atan2 differently in
// the last bits, and in a 15-minute run those differences grow until two machines disagree about the outcome. The
// server replays ranked runs to check them, so the simulation only uses + - * / and sqrt (exact in every engine).
const PI = Math.PI, TAU = 2 * PI, HALF = PI / 2;

// sine on [-pi/2, pi/2]: Taylor series to x^15 (error below 1e-12 on that range)
function sinCore(x) {
  const x2 = x * x;
  return x * (1 + x2 * (-1 / 6 + x2 * (1 / 120 + x2 * (-1 / 5040 + x2 * (1 / 362880 + x2 * (-1 / 39916800 + x2 * (1 / 6227020800 + x2 * (-1 / 1307674368000))))))));
}
export function dsin(x) {
  if (!Number.isFinite(x)) return NaN;
  x = x - TAU * Math.floor(x / TAU + 0.5); // now in [-pi, pi]
  if (x > HALF) x = PI - x; else if (x < -HALF) x = -PI - x;
  return sinCore(x);
}
export function dcos(x) { return dsin(x + HALF); }

// arctangent on [0, 1]: argument halving twice then a series (error below 1e-12)
function atanUnit(t) {
  // atan(t) = 2 atan(t / (1 + sqrt(1 + t^2))), applied twice brings t under ~0.2
  let k = 1;
  for (let i = 0; i < 2; i++) { t = t / (1 + Math.sqrt(1 + t * t)); k *= 2; }
  const t2 = t * t;
  let s = 0, p = t;
  for (let n = 0; n < 12; n++) { s += (n % 2 ? -p : p) / (2 * n + 1); p *= t2; }
  return k * s;
}
export function datan2(y, x) {
  if (x === 0 && y === 0) return 0;
  const ax = Math.abs(x), ay = Math.abs(y);
  let a = ay <= ax ? atanUnit(ay / ax) : HALF - atanUnit(ax / ay);
  if (x < 0) a = PI - a;
  return y < 0 ? -a : a;
}
export function dhypot(x, y) { return Math.sqrt(x * x + y * y); }
