// Props as walls (owner 3 Nov: "fences on map dont register as walls"; "add collision to walls in sankswap zone and other
// zones"; "fences corners let u walk through"). SankoQuest's walk map (nav.png) carries most building walls but not the
// fences, the SankSwap exchange's arcades and counter, pillars and some newer walls. Here every solid prop's real shape is
// turned into thin walls on cell edges, the kind the buildings use (bits 1 2 4 8 = north z-1, east x+1, south z+1, west
// x-1): each triangle of the model that reaches body height (0.3-1.8 above the ground) has its outline snapped onto the
// nearest cell edges, so door openings (no geometry at body height) stay open, posts and counters close their cells, and
// fence pieces meet at their corners. A prop whose walls the walk map already has is left out (no doubled walls in
// buildings). Written to public/assets/world/tiles/fences.json, which the browser and the game server (tools/build-
// ground.mjs -> ground.bin) both read. Run: node tools/build-fences.mjs
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng } from './build-ground.mjs';
import { terrainFromTiles } from '../src/terrain.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
// solid props: fences, walls the walk map may lack, the exchange's built pieces, pillars (gates, lintels, lanterns and
// benches stay walkable; whole buildings come with their walls in the walk map)
const SOLID = /^(Fence|Iron Fence|Wooden Fence)\.glb$|^exchange\/(arcades|side-post|central-post|bank-counter|deposit-box)-v1\.glb$|^kit_Wall(?!.*Doorway)|^castle\/wall_(interior|curtain)\.glb$|^court_Low_wall|^woodenhut_wall|^PSX Style Wall|^arenawall\.glb$|^(Pillar|wood_pillar|woodenpillar)\.glb$/;
const ALWAYS = /^(Fence|Iron Fence|Wooden Fence)\.glb$|^exchange\//; // never in the walk map: always added
const N = 512, BAND = [0.3, 1.8];

function noTextures(b) {
  const jl = b.readUInt32LE(12), j = JSON.parse(b.subarray(20, 20 + jl).toString());
  delete j.images; delete j.textures; delete j.samplers;
  for (const m of j.materials || []) { for (const k of Object.keys(m)) if (/Texture$/.test(k)) delete m[k]; if (m.pbrMetallicRoughness) for (const k of Object.keys(m.pbrMetallicRoughness)) if (/Texture$/.test(k)) delete m.pbrMetallicRoughness[k]; delete m.extensions; }
  j.extensionsUsed = (j.extensionsUsed || []).filter((e) => !/texture|materials/i.test(e)); j.extensionsRequired = (j.extensionsRequired || []).filter((e) => !/texture|materials/i.test(e));
  let js = Buffer.from(JSON.stringify(j)); js = Buffer.concat([js, Buffer.alloc((4 - (js.length % 4)) % 4, 0x20)]);
  const rest = b.subarray(20 + jl), out = Buffer.alloc(20 + js.length + rest.length);
  b.copy(out, 0, 0, 12); out.writeUInt32LE(js.length, 12); out.writeUInt32LE(0x4e4f534a, 16); js.copy(out, 20); rest.copy(out, 20 + js.length); out.writeUInt32LE(out.length, 8);
  return out;
}
// the model's triangles in model space (with its own node transforms applied)
async function modelTris(file) {
  const fp = path.join(ROOT, 'public/assets/world/scene-models', file); if (!existsSync(fp)) return null;
  const buf = noTextures(readFileSync(fp)), loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  let g; try { g = await new Promise((ok, no) => loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', ok, no)); } catch { return null; }
  g.scene.updateMatrixWorld(true); const tris = [], v = new THREE.Vector3();
  g.scene.traverse((m) => {
    if (!m.isMesh) return; const pos = m.geometry.attributes.position, idx = m.geometry.index, n = idx ? idx.count : pos.count;
    for (let t = 0; t + 2 < n; t += 3) { const tri = []; for (let k = 0; k < 3; k++) { v.fromBufferAttribute(pos, idx ? idx.getX(t + k) : t + k).applyMatrix4(m.matrixWorld); tri.push(v.x, v.y, v.z); } tris.push(tri); }
  });
  return tris;
}
const euler = new THREE.Euler(), quat = new THREE.Quaternion();
const matOf = (t = {}) => {
  const p = (t.position || [0, 0, 0]).map((v) => v || 0), r = (t.rotation || [0, 0, 0]).map((v) => v || 0), s0 = t.scale ?? 1, s = Array.isArray(s0) ? s0 : [s0, s0, s0];
  return new THREE.Matrix4().compose(new THREE.Vector3(...p), quat.setFromEuler(euler.set(r[0], r[1], r[2], 'XYZ')), new THREE.Vector3(...s));
};

export async function buildFences() {
  const tiles = path.join(ROOT, 'public/assets/world/tiles'), hb = readFileSync(path.join(tiles, 'height.bin'));
  const H = new Float32Array(hb.buffer.slice(hb.byteOffset, hb.byteOffset + hb.byteLength));
  const nav = decodePng(readFileSync(path.join(tiles, 'nav.png'))), T = terrainFromTiles({ height: H, nav: nav.rgba, S: nav.w });
  const ground = (x, z) => { const i = Math.max(0, Math.min(511.999, x)), j = Math.max(0, Math.min(511.999, z)), a = Math.floor(i), b = Math.floor(j), fu = i - a, fv = j - b, n = 513;
    return (H[b * n + a] * (1 - fu) + H[b * n + a + 1] * fu) * (1 - fv) + (H[(b + 1) * n + a] * (1 - fu) + H[(b + 1) * n + a + 1] * fu) * fv; };
  const scene = JSON.parse(readFileSync(path.join(ROOT, 'public/assets/world/scenes/world.json'), 'utf8'));
  const placed = [];
  const walk = (o, M) => {
    const W = M.clone().multiply(matOf(o.transform || {}));
    const m = (o.components || []).find((c) => c.type === 'model' && c.filename);
    if (m && SOLID.test(m.filename)) {
      // a row or grid of copies along the node's own X/Z axes, rotated but not scaled (as parseNodes in render.js)
      const pp = new THREE.Vector3(), pq = new THREE.Quaternion(), ps = new THREE.Vector3(); W.decompose(pp, pq, ps);
      const rx = m.instanced && m.repeatX && m.repeatCountX > 1, rz = m.instanced && m.repeatZ && m.repeatCountZ > 1;
      const cx = rx ? m.repeatCountX : 1, cz = rz ? m.repeatCountZ : 1, ox = rx ? (m.repeatOffsetX ?? 1) : 0, oz = rz ? (m.repeatOffsetZ ?? 1) : 0;
      for (let a = 0; a < cx; a++) for (let b = 0; b < cz; b++) {
        const off = new THREE.Vector3(a * ox, 0, b * oz).applyQuaternion(pq).add(pp);
        placed.push({ file: m.filename, W: new THREE.Matrix4().compose(off, pq, ps), name: o.name || '' });
      }
    }
    for (const ch of o.children || []) walk(ch, W);
  };
  for (const r of scene) walk(r, new THREE.Matrix4());
  const triCache = {}; for (const f of new Set(placed.map((p) => p.file))) triCache[f] = await modelTris(f);
  const bits = new Map(), add = (map, i, j, b) => { if (i < 0 || j < 0 || i >= N || j >= N) return; const k = j * N + i; map.set(k, (map.get(k) || 0) | b); };
  // one projected edge -> thin walls on the nearest cell boundaries, every cell it touches (so pieces meet at corners)
  const line = (map, ax, az, bx, bz) => {
    const dx = bx - ax, dz = bz - az; if (Math.hypot(dx, dz) < 0.05) return;
    if (Math.abs(dx) >= Math.abs(dz)) {
      const x0 = Math.min(ax, bx), x1 = Math.max(ax, bx); let prev = null;
      for (let i = Math.floor(x0); i <= Math.floor(x1 - 1e-6); i++) {
        const cx = Math.min(x1, Math.max(x0, i + 0.5)), z = az + (dz * (cx - ax)) / (dx || 1e-9), zb = Math.round(z);
        add(map, i, zb - 1, 4); add(map, i, zb, 1);
        if (prev !== null && prev !== zb) for (let j = Math.min(prev, zb); j < Math.max(prev, zb); j++) { add(map, i - 1, j, 2); add(map, i, j, 8); }
        prev = zb;
      }
    } else {
      const z0 = Math.min(az, bz), z1 = Math.max(az, bz); let prev = null;
      for (let j = Math.floor(z0); j <= Math.floor(z1 - 1e-6); j++) {
        const cz = Math.min(z1, Math.max(z0, j + 0.5)), x = ax + (dx * (cz - az)) / (dz || 1e-9), xb = Math.round(x);
        add(map, xb - 1, j, 2); add(map, xb, j, 8);
        if (prev !== null && prev !== xb) for (let i = Math.min(prev, xb); i < Math.max(prev, xb); i++) { add(map, i, j - 1, 4); add(map, i, j, 1); }
        prev = xb;
      }
    }
  };
  const v = new THREE.Vector3(); let used = 0, skipped = 0; const byFile = {};
  for (const p of placed) {
    const tris = triCache[p.file]; if (!tris) continue;
    const mine = new Map();
    for (const t of tris) {
      const w = []; for (let k = 0; k < 9; k += 3) { v.set(t[k], t[k + 1], t[k + 2]).applyMatrix4(p.W); w.push(v.x, v.y, v.z); }
      const cxz = [(w[0] + w[3] + w[6]) / 3, (w[2] + w[5] + w[8]) / 3]; if (cxz[0] < 0 || cxz[1] < 0 || cxz[0] > N || cxz[1] > N) continue;
      const g = ground(cxz[0], cxz[1]), ylo = Math.min(w[1], w[4], w[7]) - g, yhi = Math.max(w[1], w[4], w[7]) - g;
      if (yhi < BAND[0] || ylo > BAND[1]) continue; // under foot or overhead (lintels, roofs, rugs)
      line(mine, w[0], w[2], w[3], w[5]); line(mine, w[3], w[5], w[6], w[8]); line(mine, w[6], w[8], w[0], w[2]);
    }
    if (!mine.size) continue;
    // already walled in the walk map? (most of its edges have a wall, or the cells are blocked anyway)
    // compare whole cell edges, from either side (the walk map keeps each wall on one side only); an edge next to a
    // blocked cell counts as walled too
    const W = T.walls, B = T.blocked, at = (i, j) => (i < 0 || j < 0 || i >= N || j >= N ? 0 : j * N + i);
    const zEdge = (i, j) => (W[at(i, j)] & 1) || (W[at(i, j - 1)] & 4) || B[at(i, j)] || B[at(i, j - 1)]; // between rows j-1 and j
    const xEdge = (i, j) => (W[at(i, j)] & 8) || (W[at(i - 1, j)] & 2) || B[at(i, j)] || B[at(i - 1, j)]; // between columns i-1 and i
    const edges = new Set(); for (const [k, b] of mine) { const i = k % N, j = (k - i) / N; if (b & 1) edges.add(`z${i},${j}`); if (b & 4) edges.add(`z${i},${j + 1}`); if (b & 8) edges.add(`x${i},${j}`); if (b & 2) edges.add(`x${i + 1},${j}`); }
    let have = 0; for (const e of edges) { const [i, j] = e.slice(1).split(',').map(Number); if (e[0] === 'z' ? zEdge(i, j) : xEdge(i, j)) have++; }
    if (!ALWAYS.test(p.file) && edges.size && have / edges.size > 0.4) { skipped++; continue; }
    used++; byFile[p.file] = (byFile[p.file] || 0) + 1;
    for (const [k, b] of mine) { const i = k % N, j = (k - i) / N; add(bits, i, j, b); }
  }
  return { n: N, cells: [...bits.entries()].sort((a, b) => a[0] - b[0]), pieces: placed.length, used, skipped, byFile };
}
/** the prop wall layer as a per-cell array of wall bits (same layout as terrain walls) */
export function fenceArray(f) { const a = new Uint8Array(f.n * f.n); for (const [k, b] of f.cells) a[k] = b; return a; }

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const f = await buildFences();
  writeFileSync(path.join(ROOT, 'public/assets/world/tiles/fences.json'), JSON.stringify({ n: f.n, cells: f.cells }));
  console.log(`fences.json: ${f.pieces} solid props, ${f.used} walled (${f.skipped} already in the walk map) -> ${f.cells.length} cells`);
  console.log(JSON.stringify(f.byFile));
}
