// The world's walk data for the simulation, packed small for the game server (ranked runs replay there on the same
// ground the browser used). Two bitsets, blocked cells (n x n) and water vertices ((n+1) x (n+1)), then each cell's
// wall bits (4 per cell, two cells a byte).
export function packGround({ n, blocked, water, walls, fences }) {
  const W = n + 1, a = n * n, b = W * W, out = new Uint8Array(4 + Math.ceil(a / 8) + Math.ceil(b / 8) + Math.ceil(a / 2) * (fences ? 2 : 1));
  new DataView(out.buffer).setUint32(0, n, true);
  const A = 4, B = 4 + Math.ceil(a / 8);
  for (let k = 0; k < a; k++) if (blocked[k]) out[A + (k >> 3)] |= 1 << (k & 7);
  for (let k = 0; k < b; k++) if (water && water[k] === water[k]) out[B + (k >> 3)] |= 1 << (k & 7); // not NaN
  const C = B + Math.ceil(b / 8);
  if (walls) for (let k = 0; k < a; k++) out[C + (k >> 1)] |= (walls[k] & 15) << ((k & 1) * 4);
  // fences as walls (3 Nov), the same layout after the walls; older readers stop before it
  const D = C + Math.ceil(a / 2);
  if (fences) for (let k = 0; k < a; k++) out[D + (k >> 1)] |= (fences[k] & 15) << ((k & 1) * 4);
  return out;
}

export const WATER_LEVEL = Math.fround(0.8);
export function unpackGround(bytes) {
  const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const n = new DataView(u.buffer, u.byteOffset, u.byteLength).getUint32(0, true), W = n + 1, a = n * n, b = W * W;
  const A = 4, B = 4 + Math.ceil(a / 8);
  const blocked = new Uint8Array(a), water = new Float32Array(b).fill(NaN);
  for (let k = 0; k < a; k++) blocked[k] = (u[A + (k >> 3)] >> (k & 7)) & 1;
  for (let k = 0; k < b; k++) if ((u[B + (k >> 3)] >> (k & 7)) & 1) water[k] = WATER_LEVEL;
  const C = B + Math.ceil(b / 8), walls = new Uint8Array(a);
  if (u.length >= C + Math.ceil(a / 2)) for (let k = 0; k < a; k++) walls[k] = (u[C + (k >> 1)] >> ((k & 1) * 4)) & 15;
  const D = C + Math.ceil(a / 2); let fences = null;
  if (u.length >= D + Math.ceil(a / 2)) { fences = new Uint8Array(a); for (let k = 0; k < a; k++) fences[k] = (u[D + (k >> 1)] >> ((k & 1) * 4)) & 15; }
  return { n, blocked, cell: true, water, walls, fences };
}

// a short fingerprint, to check that the browser and the server walk on the same ground
export function groundHash({ n, blocked, water, walls, fences }) {
  let h = 2166136261 >>> 0;
  const mix = (v) => { h ^= v; h = Math.imul(h, 16777619) >>> 0; };
  mix(n);
  for (let k = 0; k < blocked.length; k++) mix(blocked[k] ? 1 : 0);
  for (let k = 0; k < (water ? water.length : 0); k++) mix(water[k] === water[k] ? 2 : 0);
  for (let k = 0; k < (walls ? walls.length : 0); k++) if (walls[k]) mix(k * 16 + walls[k]);
  for (let k = 0; k < (fences ? fences.length : 0); k++) if (fences[k]) mix(0x40000000 + k * 16 + fences[k]);
  return h.toString(16);
}
