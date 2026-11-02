// dev tool: build the terrain in node and dump it for viewing.  node test/terrain-dump.mjs <mm512.rgba> <out.f32>
import { readFileSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { buildTerrain } from '../src/terrain.js';
const [rgbaFile, out] = process.argv.slice(2);
const data = JSON.parse(readFileSync(new URL('../public/assets/world/scenes/world.json', import.meta.url)));
const realTiles = JSON.parse(readFileSync(new URL('../reference/terrain-captures/terrain-tiles.json', import.meta.url))).tiles;
const num = (v, d) => (v == null || Number.isNaN(v) ? d : v);
const root = new THREE.Object3D(), nodes = [];
const walk = (nd, parent) => {
  const o = new THREE.Object3D(); parent.add(o); const t = nd.transform;
  if (t) {
    if (t.position) o.position.set(num(t.position[0], 0), num(t.position[1], 0), num(t.position[2], 0));
    if (t.rotation) o.rotation.set(num(t.rotation[0], 0), num(t.rotation[1], 0), num(t.rotation[2], 0));
    if (t.scale != null) { if (Array.isArray(t.scale)) o.scale.set(num(t.scale[0], 1), num(t.scale[1], 1), num(t.scale[2], 1)); else o.scale.setScalar(num(t.scale, 1)); }
  }
  if ((nd.components || []).some((c) => c.type === 'model' && c.filename)) nodes.push(o);
  for (const c of nd.children || []) walk(c, o);
};
for (const r of data) walk(r, root);
root.updateMatrixWorld(true);
const v = new THREE.Vector3();
const props = nodes.map((o) => { v.setFromMatrixPosition(o.matrixWorld); return { x: v.x, y: v.y, z: v.z }; });
const t0 = Date.now();
const T = buildTerrain({ rgba: readFileSync(rgbaFile), S: 512, props, tiles: process.env.NOTILE ? [] : realTiles });
console.log('built in', Date.now() - t0, 'ms; props', props.length);
const buf = Buffer.alloc(T.n * T.n * 6);
for (let k = 0; k < T.n * T.n; k++) { buf.writeFloatLE(T.h[k], k * 6); buf[k * 6 + 4] = T.cls[k]; buf[k * 6 + 5] = T.blocked[k]; }
writeFileSync(out, buf);
// compare with the real tiles (run with NOTILE=1 to measure the estimate alone)
let err = 0, c = 0; const per = [];
for (const t of realTiles) { let e = 0, m = 0; for (let b = 2; b < 62; b++) for (let a = 2; a < 62; a++) { const x = Math.round(t.cx - 32 + a * 64 / 63), z = Math.round(t.cz - 32 + b * 64 / 63); const d = Math.abs(T.h[z * T.n + x] - t.h[b * 64 + a] / 10); e += d; m++; } per.push(`${t.cx},${t.cz}:${(e / m).toFixed(2)}`); err += e; c += m; }
console.log('MAE vs real tiles', (err / c).toFixed(3), per.join(' '));
