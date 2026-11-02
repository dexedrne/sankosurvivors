// The SankoQuest world's ground, rebuilt from what we have: the minimap (shaded, 4 px per world unit), the props of the
// real scene (every prop stands on the real ground) and the tiles of real ground heights captured from the live game
// (public/assets/world/terrain-tiles.json). Real tiles win wherever we have them.
//
// The minimap tells the kinds of ground apart: the neutral grey bands are rocky ridges and mountains (Greentown sits on a
// plateau ringed by one), blue is water, the rest is land and roads. Land takes its height from the props on it, spread
// across each area without crossing ridges or water; ridges rise out of the land around them; water sinks below sea level.
// Pure JS, no DOM, so it runs in tests too.

export const WATER_Y = 0.8; // the game's sea level (its water planes sit at 0.8); estimated pools sit a little below their own shores
export const T_LAND = 0, T_ROAD = 1, T_ROCK = 2, T_WATER = 3;

export function classify(r, g, b) {
  if (b > r + 30 && b > g + 4) return T_WATER;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (mx - mn < 22 && mx < 140 && Math.abs(r - g) < 10) return b - r >= 2 ? T_ROCK : T_ROAD;
  return T_LAND;
}

/**
 * @param {object} o
 * @param {Uint8ClampedArray|Uint8Array} o.rgba  minimap pixels, S x S RGBA (S = 512: one pixel per world unit)
 * @param {number} o.S
 * @param {{x:number,y:number,z:number}[]} o.props  world positions of scene props
 * @param {{cx:number,cz:number,heights:number[]}} [o.tile]  one real 64x64 tile (heights in units), legacy form
 * @param {{cx:number,cz:number,h:number[]}[]} [o.tiles]  real 64x64 tiles centred on cx,cz, h = height*10; vertex (a,b) sits at cx-32+a*64/63
 * @param {number} [o.fallback]  height for land with no props anywhere in reach
 * @returns {{ n:number, h:Float32Array, cls:Uint8Array, blocked:Uint8Array, bump:Float32Array, water:Float32Array }}  water: surface height on water cells, NaN elsewhere  n x n vertex grid (n = S+1), x = i, z = j
 */
export function buildTerrain({ rgba, S = 512, props = [], tile = null, tiles = [], fallback = 7 }) {
  if (tile && tile.heights) tiles = [...tiles, { cx: tile.cx, cz: tile.cz, h: tile.heights.map((v) => v * 10) }];
  const n = S + 1, N = n * n;
  const at = (i, j) => Math.min(S - 1, j) * S + Math.min(S - 1, i);
  // real heights from captured tiles, sampled onto this grid, and how far inside the captured area each cell is
  const real = new Float32Array(n * n).fill(NaN);
  for (const t of tiles) {
    const x0 = t.cx - 32, z0 = t.cz - 32, H = (a, b) => t.h[Math.min(63, b) * 64 + Math.min(63, a)] / 10;
    for (let j = Math.max(0, Math.ceil(z0)); j <= Math.min(n - 1, Math.floor(z0 + 64)); j++) for (let i = Math.max(0, Math.ceil(x0)); i <= Math.min(n - 1, Math.floor(x0 + 64)); i++) {
      const u = (i - x0) * 63 / 64, v = (j - z0) * 63 / 64, a = Math.floor(u), b = Math.floor(v), fu = u - a, fv = v - b;
      real[j * n + i] = (H(a, b) * (1 - fu) + H(a + 1, b) * fu) * (1 - fv) + (H(a, b + 1) * (1 - fu) + H(a + 1, b + 1) * fu) * fv;
    }
  }
  const realW = new Float32Array(n * n);
  {
    const q = new Int32Array(n * n); let qh = 0, qt = 0; const dd = new Float32Array(n * n).fill(1e9);
    for (let k = 0; k < n * n; k++) if (Number.isNaN(real[k])) { dd[k] = 0; q[qt++] = k; }
    while (qh < qt) { const k = q[qh++], i = k % n; for (const d of [1, -1, n, -n]) { const r = k + d; if (r < 0 || r >= n * n || (d === 1 && i === n - 1) || (d === -1 && i === 0)) continue; if (dd[r] > dd[k] + 1) { dd[r] = dd[k] + 1; q[qt++] = r; } } }
    for (let k = 0; k < n * n; k++) realW[k] = Number.isNaN(real[k]) ? 0 : Math.min(1, dd[k] / 5);
  }
  // 1. kinds of ground
  let cls = new Uint8Array(N);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const p = at(i, j) * 4; cls[j * n + i] = classify(rgba[p], rgba[p + 1], rgba[p + 2]); }
  // tidy single-pixel noise: a cell takes the majority kind of its 3x3 neighbourhood when it is in a clear minority
  {
    const out = cls.slice();
    for (let j = 1; j < n - 1; j++) for (let i = 1; i < n - 1; i++) {
      const c = [0, 0, 0, 0];
      for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) c[cls[(j + b) * n + i + a]]++;
      let best = cls[j * n + i]; for (let k = 0; k < 4; k++) if (c[k] > c[best]) best = k;
      if (c[cls[j * n + i]] <= 2) out[j * n + i] = best;
    }
    cls = out;
  }
  const nearProp = new Uint8Array(N);
  // grey paving inside towns and castles looks like rock on the minimap: grey with props on or beside it is paving
  {
    const near = nearProp, Rp = 3;
    for (const p of props) {
      const pi = Math.round(p.x), pj = Math.round(p.z);
      for (let b = -Rp; b <= Rp; b++) for (let a = -Rp; a <= Rp; a++) { const i = pi + a, j = pj + b; if (i >= 0 && j >= 0 && i < n && j < n) near[j * n + i] = 1; }
    }
    for (let k = 0; k < N; k++) if (cls[k] === T_ROCK && near[k]) cls[k] = T_ROAD;
  }
  // the shaded flanks of a ridge read as road grey on the minimap: road cells touching rock are part of the ridge
  {
    const out = cls.slice();
    for (let j = 1; j < n - 1; j++) for (let i = 1; i < n - 1; i++) {
      const k = j * n + i; if (cls[k] !== T_ROAD) continue;
      if (cls[k - 1] === T_ROCK || cls[k + 1] === T_ROCK || cls[k - n] === T_ROCK || cls[k + n] === T_ROCK) out[k] = T_ROCK;
    }
    cls = out;
  }
  // where the real ground is known, water is simply wherever that ground lies below sea level
  for (let k = 0; k < N; k++) {
    if (realW[k] < 1) continue;
    if (real[k] < WATER_Y - 0.05) cls[k] = T_WATER;
    else if (cls[k] === T_WATER && real[k] > WATER_Y + 0.3) cls[k] = T_LAND;
  }
  const barrier = (k) => cls[k] === T_ROCK || cls[k] === T_WATER;

  // 2. known land heights from the props: the lowest prop within a few units is the ground
  const big = 1e9, cellMin = new Float32Array(N).fill(big);
  for (const p of props) {
    const i = Math.round(p.x), j = Math.round(p.z);
    if (i < 0 || j < 0 || i >= n || j >= n || !Number.isFinite(p.y)) continue;
    const k = j * n + i; if (p.y < cellMin[k]) cellMin[k] = p.y;
  }
  const R = 4, tmp = new Float32Array(N).fill(big), win = new Float32Array(N).fill(big);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { let m = big; for (let k = Math.max(0, i - R); k <= Math.min(n - 1, i + R); k++) m = Math.min(m, cellMin[j * n + k]); tmp[j * n + i] = m; }
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { let m = big; for (let k = Math.max(0, j - R); k <= Math.min(n - 1, j + R); k++) m = Math.min(m, tmp[k * n + i]); win[j * n + i] = m; }

  const h = new Float32Array(N).fill(NaN);
  const queue = new Int32Array(N); let qh = 0, qt = 0;
  for (let k = 0; k < N; k++) if (!barrier(k) && win[k] < big && cellMin[k] < big) { h[k] = win[k]; queue[qt++] = k; }
  // also seed from every land cell within the window of a prop (props sit inside buildings, gardens...)
  for (let k = 0; k < N; k++) if (!barrier(k) && Number.isNaN(h[k]) && win[k] < big) { h[k] = win[k]; queue[qt++] = k; }
  // real heights are ground truth where we have them
  for (let k = 0; k < N; k++) if (!Number.isNaN(real[k]) && !barrier(k)) { if (Number.isNaN(h[k])) queue[qt++] = k; h[k] = real[k]; }
  // 3. spread land heights outward through land and roads only (ridges and water separate areas)
  const nb = [1, -1, n, -n];
  while (qh < qt) {
    const k = queue[qh++], i = k % n;
    for (const d of nb) {
      const q = k + d; if (q < 0 || q >= N) continue;
      if ((d === 1 && i === n - 1) || (d === -1 && i === 0)) continue;
      if (barrier(q) || !Number.isNaN(h[q])) continue;
      h[q] = h[k]; queue[qt++] = q;
    }
  }
  for (let k = 0; k < N; k++) if (!barrier(k) && Number.isNaN(h[k])) h[k] = fallback;
  // smooth the land within each area: cells measured from props stay put, the rest relax toward their neighbours
  // (removes the steps left by spreading), then a light pass over everything
  const fixed = new Uint8Array(N); for (let k = 0; k < N; k++) fixed[k] = !barrier(k) && cellMin[k] < big ? 1 : 0;
  for (let k = 0; k < N; k++) if (!Number.isNaN(real[k]) && !barrier(k)) fixed[k] = 1;
  for (let pass = 0; pass < 70; pass++) {
    const o = pass % 2 ? h : h.slice(); // alternate Jacobi / in-place sweeps: faster to settle
    for (let j = 1; j < n - 1; j++) for (let i = 1; i < n - 1; i++) {
      const k = j * n + i; if (barrier(k) || fixed[k]) continue;
      let s = 0, w = 0;
      for (const d of nb) if (!barrier(k + d)) { s += o[k + d]; w++; }
      if (w) h[k] = s / w;
    }
  }
  for (let pass = 0; pass < 3; pass++) {
    const o = h.slice();
    for (let j = 1; j < n - 1; j++) for (let i = 1; i < n - 1; i++) {
      const k = j * n + i; if (barrier(k)) continue;
      let s = o[k] * 2, w = 2;
      for (const d of nb) if (!barrier(k + d)) { s += o[k + d]; w++; }
      h[k] = s / w;
    }
  }

  // 4. ridges and water take the height of the land around them, then rise or sink with their distance inside
  const base = h.slice(); qh = 0; qt = 0;
  const dist = new Float32Array(N).fill(big);
  for (let k = 0; k < N; k++) if (!barrier(k)) { queue[qt++] = k; dist[k] = 0; }
  while (qh < qt) {
    const k = queue[qh++], i = k % n;
    for (const d of nb) {
      const q = k + d; if (q < 0 || q >= N) continue;
      if ((d === 1 && i === n - 1) || (d === -1 && i === 0)) continue;
      if (dist[q] <= dist[k] + 1) continue;
      dist[q] = dist[k] + 1; base[q] = base[k]; queue[qt++] = q;
    }
  }
  for (let k = 0; k < N; k++) if (dist[k] >= big) { dist[k] = 0; base[k] = fallback; }
  // the base of a ridge is the mean of the land on both sides, so a ridge between a plateau and a valley sits between them
  for (let pass = 0; pass < 4; pass++) {
    const o = base.slice();
    for (let j = 1; j < n - 1; j++) for (let i = 1; i < n - 1; i++) { const k = j * n + i; if (!barrier(k)) continue; base[k] = (o[k] * 4 + o[k - 1] + o[k + 1] + o[k - n] + o[k + n]) / 8; }
  }
  // each body of water (sea, lake, swamp pool) lies a little below the lowest land on its shore
  const water = new Float32Array(N).fill(NaN);
  {
    const comp = new Int32Array(N).fill(-1); const q2 = new Int32Array(N);
    for (let s0 = 0; s0 < N; s0++) {
      if (cls[s0] !== T_WATER || comp[s0] >= 0) continue;
      let a = 0, b = 0, shore = big; q2[b++] = s0; comp[s0] = s0;
      while (a < b) {
        const k = q2[a++], i = k % n;
        for (const d of nb) {
          const q = k + d; if (q < 0 || q >= N) continue;
          if ((d === 1 && i === n - 1) || (d === -1 && i === 0)) continue;
          if (cls[q] === T_WATER) { if (comp[q] < 0) { comp[q] = s0; q2[b++] = q; } }
          else if (cls[q] !== T_ROCK && h[q] < shore) shore = h[q];
        }
      }
      // a small pool among props is a fountain or a well: the model holds the water, the ground stays put
      if (b < 40) { let built = false; for (let t = 0; t < b && !built; t++) built = !!nearProp[q2[t]]; if (built) { for (let t = 0; t < b; t++) { cls[q2[t]] = T_LAND; h[q2[t]] = base[q2[t]]; } continue; } }
      let anyReal = false; for (let t = 0; t < b && !anyReal; t++) anyReal = realW[q2[t]] > 0;
      const level = anyReal ? WATER_Y : Math.min(WATER_Y, shore < big ? shore - 0.3 : WATER_Y);
      for (let t = 0; t < b; t++) water[q2[t]] = level;
    }
  }
  const bump = new Float32Array(N);
  for (let k = 0; k < N; k++) {
    if (cls[k] === T_ROCK) { bump[k] = Math.min(18, 2.5 + 3.2 * dist[k]); h[k] = base[k] + bump[k]; }
    else if (cls[k] === T_WATER) { h[k] = water[k] - 0.5 - Math.min(2.5, 0.6 * dist[k]); }
  }
  // 5. soften every edge a touch (ridges keep steep sides; shores slope into the water)
  for (let pass = 0; pass < 2; pass++) {
    const o = h.slice();
    for (let j = 1; j < n - 1; j++) for (let i = 1; i < n - 1; i++) { const k = j * n + i; h[k] = (o[k] * 4 + o[k - 1] + o[k + 1] + o[k - n] + o[k + n]) / 8; }
  }
  // 6. real heights win wherever they were captured, feathered into the estimate at the edges
  for (let k = 0; k < N; k++) if (realW[k] > 0) h[k] = h[k] * (1 - realW[k]) + real[k] * realW[k];
  // 6b. buildings never stand in the ground: around each built piece the ground drops to its base (natural props,
  // bridges and anything buried on purpose by more than a metre are left alone)
  {
    const NATURAL = /grass|tree|rock|bush|plant|flower|cactus|mushroom|log|stump|reed|lily|boat|dock|pier|bridge|water|bones|skull/i;
    const target = new Float32Array(N).fill(big);
    for (const p of props) {
      if (!p.file || NATURAL.test(p.file) || !Number.isFinite(p.y)) continue;
      const i0 = Math.round(p.x), j0 = Math.round(p.z);
      if (i0 < 2 || j0 < 2 || i0 >= n - 2 || j0 >= n - 2) continue;
      const k0 = j0 * n + i0; if (h[k0] - p.y > 1.2 || cls[k0] === T_WATER) continue;
      for (let b = -2; b <= 2; b++) for (let a = -2; a <= 2; a++) { const k = (j0 + b) * n + i0 + a; target[k] = Math.min(target[k], p.y + 0.04); }
    }
    for (let k = 0; k < N; k++) if (target[k] < h[k]) h[k] = target[k];
  }
  // 7. where you cannot walk: ridge cores, mountains and water
  const blocked = new Uint8Array(N);
  for (let k = 0; k < N; k++) {
    const wet = cls[k] === T_WATER && h[k] < water[k] - 0.15;
    if (realW[k] >= 1) { // real ground: blocked where it is really a cliff (steeper than ~45 degrees) or under water
      const i = k % n, j = (k - i) / n; let steep = 0;
      if (i > 0 && i < n - 1 && j > 0 && j < n - 1) steep = Math.max(Math.abs(h[k + 1] - h[k - 1]), Math.abs(h[k + n] - h[k - n])) / 2;
      blocked[k] = wet || steep > 1.0 ? 1 : 0;
    } else blocked[k] = (cls[k] === T_ROCK && bump[k] > 1.8) || wet ? 1 : 0;
  }
  return { n, h, cls, blocked, bump, water };
}

/**
 * The real ground, straight from SankoQuest's own tiles (see tools/build-world-tiles.py):
 * heights on a 513x513 vertex grid, and the game's walkability map (512x512 cells, red = blocked, green = indoors,
 * blue = water). Cells, not vertices, carry the walk data: cell (i,j) covers x in [i,i+1), z in [j,j+1).
 * @returns same shape as buildTerrain, plus { cell: true, indoor: Uint8Array, walls: Uint8Array (edge-wall bits per cell) }
 */
export function terrainFromTiles({ height, nav, S = 512 }) {
  const n = S + 1, N = n * n;
  const h = Float32Array.from(height);
  const cls = new Uint8Array(N), water = new Float32Array(N).fill(NaN), bump = new Float32Array(N);
  for (let k = 0; k < N; k++) if (h[k] < WATER_Y - 0.05) { cls[k] = T_WATER; water[k] = WATER_Y; }
  // make sure every vertex next to water carries the water level too (for the water surface mesh)
  // walls: SankoQuest keeps thin walls on the edges of a cell (green 64 marks the cell, red bits 1 2 4 8 = a wall on its
  // north (z-1), east (x+1), south (z+1) and west (x-1) side); red above 127 blocks the whole cell
  const blocked = new Uint8Array(S * S), indoor = new Uint8Array(S * S), walls = new Uint8Array(S * S);
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const o = (j * S + i) * 4, r = nav[o], g = nav[o + 1], b = nav[o + 2];
    if ((g & 64) && g !== 255 && r < 128) walls[j * S + i] = r & 15;
    const wet = h[j * n + i] < WATER_Y - 0.05 && h[(j + 1) * n + i + 1] < WATER_Y - 0.05;
    blocked[j * S + i] = r > 127 || wet ? 1 : 0;
    indoor[j * S + i] = g > 127 ? 1 : 0;
    if (b > 127 && h[j * n + i] < WATER_Y + 0.2) { cls[j * n + i] = T_WATER; water[j * n + i] = WATER_Y; }
  }
  return { n, h, cls, blocked, bump, water, indoor, walls, cell: true, cells: S };
}
