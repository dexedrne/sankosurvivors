// Fences as walls (owner 3 Nov: "fences on map dont register as walls"). SankoQuest's walk map (nav.png) only carries
// building walls, so the fence props in world.json are turned into thin walls on cell edges here, the same kind the
// buildings use (bits 1 2 4 8 = north z-1, east x+1, south z+1, west x-1). Written to public/assets/world/tiles/
// fences.json, which the browser and the game server (tools/build-ground.mjs -> ground.bin) both read.
// Run: node tools/build-fences.mjs
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const FENCES = /^(Fence|Iron Fence|Wooden Fence)\.glb$/; // gates and archways (castle/gate_lintel) stay open
const N = 512;

// the model's own size: a GLB without its textures (they do not load in node and do not matter here)
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
async function modelBox(file) {
  const buf = noTextures(readFileSync(path.join(ROOT, 'public/assets/world/scene-models', file)));
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const g = await new Promise((ok, no) => loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', ok, no));
  g.scene.updateMatrixWorld(true); return new THREE.Box3().setFromObject(g.scene, true);
}
const euler = new THREE.Euler(), quat = new THREE.Quaternion();
const matOf = (t = {}) => {
  const p = (t.position || [0, 0, 0]).map((v) => v || 0), r = (t.rotation || [0, 0, 0]).map((v) => v || 0), s0 = t.scale ?? 1, s = Array.isArray(s0) ? s0 : [s0, s0, s0];
  return new THREE.Matrix4().compose(new THREE.Vector3(...p), quat.setFromEuler(euler.set(r[0], r[1], r[2], 'XYZ')), new THREE.Vector3(...s));
};

export async function buildFences() {
  const scene = JSON.parse(readFileSync(path.join(ROOT, 'public/assets/world/scenes/world.json'), 'utf8'));
  const placed = [];
  const walk = (o, M) => {
    const W = M.clone().multiply(matOf(o.transform || {}));
    for (const c of o.components || []) { const m = /"([^"]+\.glb)"/.exec(JSON.stringify(c)); if (m && FENCES.test(m[1])) placed.push({ file: m[1], W, name: o.name || '' }); }
    for (const ch of o.children || []) walk(ch, W);
  };
  for (const r of scene) walk(r, new THREE.Matrix4());
  const boxes = {}; for (const f of new Set(placed.map((p) => p.file))) boxes[f] = await modelBox(f);
  const bits = new Map(), add = (i, j, b) => { if (i < 0 || j < 0 || i >= N || j >= N) return; const k = j * N + i; bits.set(k, (bits.get(k) || 0) | b); };
  const wallZ = (i, zb) => { add(i, zb - 1, 4); add(i, zb, 1); }; // a wall on the line z = zb across column i
  const wallX = (xb, j) => { add(xb - 1, j, 2); add(xb, j, 8); };   // a wall on the line x = xb across row j
  const segs = [];
  for (const p of placed) {
    const b = boxes[p.file], c = [];
    for (const x of [b.min.x, b.max.x]) for (const z of [b.min.z, b.max.z]) c.push(new THREE.Vector3(x, 0, z).applyMatrix4(p.W));
    // the fence's line: through the middle of its footprint, along its longer side
    const ctr = c.reduce((a, v) => a.add(v), new THREE.Vector3()).multiplyScalar(0.25);
    const e1 = c[1].clone().sub(c[0]), e2 = c[2].clone().sub(c[0]), along = e1.length() >= e2.length() ? e1 : e2;
    const A = ctr.clone().addScaledVector(along, -0.5), B = ctr.clone().addScaledVector(along, 0.5);
    segs.push({ name: p.name, file: p.file, a: [+A.x.toFixed(2), +A.z.toFixed(2)], b: [+B.x.toFixed(2), +B.z.toFixed(2)] });
    const dx = B.x - A.x, dz = B.z - A.z;
    if (Math.abs(dx) >= Math.abs(dz)) { // mostly along x: walls on the nearest z boundary, column by column
      const x0 = Math.min(A.x, B.x), x1 = Math.max(A.x, B.x); let prev = null;
      for (let i = Math.floor(x0); i <= Math.floor(x1); i++) {
        const cx = i + 0.5; if (cx < x0 - 0.25 || cx > x1 + 0.25) continue; // the fence covers most of this cell
        const z = A.z + (dz * (cx - A.x)) / (dx || 1e-9), zb = Math.round(z); wallZ(i, zb);
        if (prev && prev.zb !== zb) for (let j = Math.min(prev.zb, zb); j < Math.max(prev.zb, zb); j++) wallX(i, j); // close the step of a slanted fence
        prev = { i, zb };
      }
    } else { // mostly along z: walls on the nearest x boundary, row by row
      const z0 = Math.min(A.z, B.z), z1 = Math.max(A.z, B.z); let prev = null;
      for (let j = Math.floor(z0); j <= Math.floor(z1); j++) {
        const cz = j + 0.5; if (cz < z0 - 0.25 || cz > z1 + 0.25) continue;
        const x = A.x + (dx * (cz - A.z)) / (dz || 1e-9), xb = Math.round(x); wallX(xb, j);
        if (prev && prev.xb !== xb) for (let i = Math.min(prev.xb, xb); i < Math.max(prev.xb, xb); i++) wallZ(i, j);
        prev = { j, xb };
      }
    }
  }
  return { n: N, cells: [...bits.entries()].sort((p, q) => p[0] - q[0]), pieces: placed.length, segs };
}
/** the fence layer as a per-cell array of wall bits (same layout as terrain walls) */
export function fenceArray(f) { const a = new Uint8Array(f.n * f.n); for (const [k, b] of f.cells) a[k] = b; return a; }

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const f = await buildFences();
  writeFileSync(path.join(ROOT, 'public/assets/world/tiles/fences.json'), JSON.stringify({ n: f.n, cells: f.cells }));
  console.log(`fences.json: ${f.pieces} fence pieces -> ${f.cells.length} cells with wall edges`);
  if (process.env.FENCE_DEBUG) console.log(JSON.stringify(f.segs.slice(0, 80)));
}
