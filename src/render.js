// Three.js renderer. Reads snapshots from sim.js, owns every GPU object.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ADVENTURER_BY_ID, MAPS, ENEMIES, WEAPONS, weaponModelPath, ARMOR_TIERS, gemItem, GEM_COLORS, GEAR } from './content.js';
import { createCharacterKit, armorSet } from './character.js';
import { terrainFromTiles, WATER_Y } from './terrain.js';

const BASE = import.meta.env.BASE_URL || './';
import { asset } from './assets.js';
const A = asset; // jsDelivr on live builds, the game's own host otherwise (src/assets.js)
export const GROUND_Y = 7.0;
const MAP_SIZE = 512; // minimap covers world x,z in [0,512] (4 px per unit)
// underground areas (their own scene file, placed where tools/build-world-tiles.py put their ground): the Hidden Oasis
const AREA_SCENES = [{ file: 'desertAdventure.json', dx: 0, dz: -192 }];
const TILE = { cx: 352, cz: 288 };
const SLOT_COLORS = [0xffd34d, 0x4dd2ff, 0xff6b6b, 0x8dff6b];

export async function createRenderer(canvas, onProgress = () => {}) {
  const QS = new URLSearchParams(location.search);
  // phones and tablets get the light settings (no shadows, lower resolution) unless ?high
  const touchDevice = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
  const low = QS.has('low') || (touchDevice && !QS.has('high'));
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'default' });
  renderer.setPixelRatio(low ? 0.75 : Math.min(window.devicePixelRatio || 1, 1.25));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // a filmic curve that keeps SankoQuest's bright colours, plus real sun shadows (off with ?low)
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 0.93; // a little under neutral: 1.05 felt too bright
  renderer.shadowMap.enabled = !low; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9ac7e8);
  scene.fog = new THREE.Fog(0x9ac7e8, 38, 78);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 140);
  // sprites, glows, particles and flashes live on their own layer: the camera draws it, but the passes that redraw the
  // scene for depth (ambient occlusion, depth of field) leave it out. They draw every object as a solid shape there,
  // so each floating item came out as a dark box around it (owner 3 Nov: "dropped items still doing that black box")
  const FX_LAYER = 1; camera.layers.enable(FX_LAYER);
  const fxOnly = (o) => { o.traverse((c) => c.layers.set(FX_LAYER)); return o; };
  const hemi = new THREE.HemisphereLight(0xfff6e6, 0x5d6f4a, 1.55); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe9c4, 2.6); sun.position.set(-30, 60, 20); scene.add(sun); scene.add(sun.target);
  const SUN_OFF = new THREE.Vector3(-22, 40, 14);
  if (!low) {
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 34, bottom: -34, near: 1, far: 120 });
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.05;
  }
  let curMap = MAPS[0];
  let settingsReady = false; // set once the settings below are first applied
  let skyMap = null; // on the whole-world map, the region you are in sets the sky and light

  const draco = new DRACOLoader().setDecoderPath(`${BASE}draco/`);
  // models ship meshopt-compressed with lossless WebP textures (tools/compress-models.sh): about a third of the download
  const gltfLoader = new GLTFLoader().setDRACOLoader(draco).setMeshoptDecoder(MeshoptDecoder);
  const cache = new Map();
  const loadGLB = (url) => {
    if (!cache.has(url)) cache.set(url, new Promise((res, rej) => gltfLoader.load(url, res, undefined, rej)));
    return cache.get(url);
  };

  // ---- helpers ----------------------------------------------------------
  const field = { x0: 0, z0: 0, n: MAP_SIZE + 1, data: null }; // the whole world's ground, one vertex per unit
  function groundAt(x, z) {
    const F = field;
    if (F.data) {
      const u = Math.max(0, Math.min(F.n - 1.001, x - F.x0)), v = Math.max(0, Math.min(F.n - 1.001, z - F.z0));
      {
        const i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, n = F.n, d = F.data;
        return (d[j * n + i] * (1 - fu) + d[j * n + i + 1] * fu) * (1 - fv) + (d[(j + 1) * n + i] * (1 - fu) + d[(j + 1) * n + i + 1] * fu) * fv;
      }
    }
    return GROUND_Y;
  }

  const boxOf = (obj) => new THREE.Box3().setFromObject(obj, true);
  // Instances are split into 32-unit cells, each its own InstancedMesh with a bounding sphere, so the camera and the
  // sun's shadow only draw the cells they can see (everything else is skipped by frustum culling).
  const CELL = 32, smallMeshes = []; let SMALL_DIST = 34; // follows the Draw distance setting
  const smallBatched = []; // { bm, ids, xz (flat), r }
  function updateSmallProps(px, pz) {
    for (const m of smallMeshes) { const dx = m.c.x - px, dz = m.c.z - pz, d = SMALL_DIST + m.r; m.im.visible = dx * dx + dz * dz < d * d; }
    for (const b of smallBatched) {
      const d = SMALL_DIST + b.r, d2 = d * d;
      for (let i = 0; i < b.ids.length; i++) { const dx = b.xz[2 * i] - px, dz = b.xz[2 * i + 1] - pz, vis = dx * dx + dz * dz < d2; if (vis !== b.vis[i]) { b.vis[i] = vis; b.bm.setVisibleAt(b.ids[i], vis); } }
    }
  }
  // Static props that share a material are drawn together: one BatchedMesh per material (and shadow/size class), each
  // model's shape stored once, every placement culled on its own. Far fewer draw calls than one per model per cell.
  const attrSig = (g) => (g.index ? 'i' : 'n') + Object.keys(g.attributes).sort().map((k) => { const a = g.attributes[k]; return k + a.itemSize + (a.normalized ? 'n' : '') + (a.isInterleavedBufferAttribute ? 'X' : a.array.constructor.name); }).join(',');
  // Many prop models carry their own copy of the same material (same texture, or the same plain colour). Identical ones
  // are shared, and plain-colour ones differing only in colour share one material with the colour given per placement.
  const imgHash = new Map(), hashCv = document.createElement('canvas'); hashCv.width = hashCv.height = 8;
  const hashCx = hashCv.getContext('2d', { willReadFrequently: true });
  function texKey(t) {
    if (!t) return '-';
    const im = t.image; let h = imgHash.get(im);
    if (h === undefined) { try { hashCx.clearRect(0, 0, 8, 8); hashCx.drawImage(im, 0, 0, 8, 8); const d = hashCx.getImageData(0, 0, 8, 8).data; let x = 0; for (let i = 0; i < d.length; i++) x = (x * 31 + (d[i] >> 2)) >>> 0; h = (im.width || 0) + 'x' + (im.height || 0) + ':' + x; } catch (e) { h = t.uuid; } imgHash.set(im, h); }
    return [h, t.offset.x, t.offset.y, t.repeat.x, t.repeat.y, t.rotation, t.flipY, t.wrapS, t.wrapT, t.colorSpace, t.channel].join(':');
  }
  const PLAIN_PHYS = (m) => m.isMeshPhysicalMaterial && !m.clearcoat && !m.transmission && !m.sheen && !m.iridescence && !m.dispersion && !m.anisotropy && m.specularIntensity === 1 && m.specularColor.equals(new THREE.Color(1, 1, 1)) && Math.abs(m.ior - 1.5) < 0.01 && !m.specularIntensityMap && !m.specularColorMap;
  const sharedMats = new Map();
  function canonMaterial(m) { // -> { key, mat, color }  (color: per-placement tint, or null)
    if (!(m.isMeshStandardMaterial) || (m.isMeshPhysicalMaterial && !PLAIN_PHYS(m))) return { key: m.uuid, mat: m, color: null };
    const maps = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap', 'alphaMap', 'lightMap', 'bumpMap', 'displacementMap'].map((k) => texKey(m[k])).join(',');
    const plain = maps.replace(/[-,]/g, '') === '';
    const q = (v) => Math.round(v * 20) / 20;
    const common = [q(m.roughness), q(m.metalness), m.side, m.transparent ? 't' + q(m.opacity) : '', m.alphaTest, m.depthWrite, m.blending, m.flatShading, m.vertexColors, m.emissive.getHexString(), q(m.emissiveIntensity), m.normalScale ? m.normalScale.x + ',' + m.normalScale.y : '', q(m.aoMapIntensity), m.envMapIntensity].join('|');
    const key = (plain ? 'C|' : 'M|' + maps + '|' + m.color.getHexString() + '|') + common;
    let mat = sharedMats.get(key);
    if (!mat) {
      mat = new THREE.MeshStandardMaterial(); THREE.MeshStandardMaterial.prototype.copy.call(mat, m); // a physical one that looks standard is drawn as standard
      if (plain) mat.color.set(0xffffff);
      sharedMats.set(key, mat);
    }
    return { key, mat, color: plain ? m.color : null };
  }
  function batchedProps(entries, parent) { // entries: [{ geometry, material, matrices }]
    const groups = new Map(), sc = new THREE.Vector3(), pos = new THREE.Vector3();
    for (const e of entries) {
      if (!e.geometry.boundingSphere) e.geometry.computeBoundingSphere();
      sc.setFromMatrixScale(e.matrices[0]); const size = e.geometry.boundingSphere.radius * Math.max(sc.x, sc.y, sc.z);
      const cm = canonMaterial(e.material); e.color = cm.color;
      const key = cm.key + '|' + attrSig(e.geometry) + '|' + (size > 1.1 ? 'c' : '') + (size < 0.9 ? 's' : '');
      if (!groups.has(key)) groups.set(key, { material: cm.mat, cast: size > 1.1, small: size < 0.9, list: [], r: 0 });
      const g = groups.get(key); g.list.push(e); g.r = Math.max(g.r, size);
    }
    for (const g of groups.values()) {
      const geos = [...new Set(g.list.map((e) => e.geometry))];
      const nv = geos.reduce((a, x) => a + x.attributes.position.count, 0), ni = geos.reduce((a, x) => a + (x.index ? x.index.count : 0), 0);
      const nInst = g.list.reduce((a, e) => a + e.matrices.length, 0);
      const bm = new THREE.BatchedMesh(nInst, nv, Math.max(ni, 1), g.material);
      bm.sortObjects = false; bm.castShadow = g.cast; bm.receiveShadow = true;
      const gid = new Map(geos.map((x) => [x, bm.addGeometry(x)]));
      const ids = [], xz = [];
      for (const e of g.list) for (const m of e.matrices) { const id = bm.addInstance(gid.get(e.geometry)); bm.setMatrixAt(id, m); if (e.color) bm.setColorAt(id, e.color); if (g.small) { pos.setFromMatrixPosition(m); ids.push(id); xz.push(pos.x, pos.z); } }
      bm.computeBoundingSphere(); bm.computeBoundingBox(); parent.add(bm);
      if (g.small) smallBatched.push({ bm, ids, xz, r: g.r, vis: new Array(ids.length).fill(true) });
    }
    return groups.size;
  }
  function chunkedInstances(geometry, material, matrices, parent, { shadow = true } = {}) {
    const cells = new Map(), v = new THREE.Vector3(), sc = new THREE.Vector3();
    if (!geometry.boundingSphere) geometry.computeBoundingSphere();
    matrices.forEach((m, i) => { v.setFromMatrixPosition(m); const k = Math.floor(v.x / CELL) + ',' + Math.floor(v.z / CELL); if (!cells.has(k)) cells.set(k, []); cells.get(k).push(i); });
    // how big one piece is in the world: small clutter casts no shadow and is only drawn near you
    sc.setFromMatrixScale(matrices[0] || new THREE.Matrix4()); const size = geometry.boundingSphere.radius * Math.max(sc.x, sc.y, sc.z);
    const out = [];
    for (const idx of cells.values()) {
      const im = new THREE.InstancedMesh(geometry, material, idx.length);
      idx.forEach((i, j) => im.setMatrixAt(j, matrices[i]));
      im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); im.frustumCulled = true;
      im.castShadow = shadow && size > 1.1; im.receiveShadow = true; parent.add(im);
      if (size < 0.9) smallMeshes.push({ im, c: im.boundingSphere.center.clone(), r: im.boundingSphere.radius });
      out.push({ im, idx });
    }    return out;
  }
  async function prepare(url, targetH) {
    const gltf = await loadGLB(url);
    const box = boxOf(gltf.scene), size = box.getSize(new THREE.Vector3());
    const k = size.y > 0.0001 ? targetH / size.y : 1;
    return { gltf, k, minY: box.min.y * k, cx: (box.min.x + box.max.x) / 2 * k, cz: (box.min.z + box.max.z) / 2 * k };
  }
  function instantiate(proto, pickClip) {
    const root = new THREE.Group();
    const inner = SkeletonUtils.clone(proto.gltf.scene);
    inner.scale.setScalar(proto.k);
    inner.position.set(-proto.cx, -proto.minY, -proto.cz);
    // own materials, so a hit can flash this one monster white
    const mats = [];
    inner.traverse((o) => { o.frustumCulled = false; if (o.isMesh) { o.castShadow = false; o.material = [].concat(o.material).map((m) => { const c = m.clone(); if (c.emissive) mats.push(c); return c; }); if (o.material.length === 1) o.material = o.material[0]; } });
    root.add(inner);
    const clips = proto.gltf.animations || [];
    let mixer = null;
    if (clips.length) {
      mixer = new THREE.AnimationMixer(inner);
      const clip = (pickClip && clips.find((c) => c.name.toLowerCase() === pickClip.toLowerCase())) || clips.find((c) => /walk|run/i.test(c.name)) || clips[0];
      mixer.clipAction(clip).play();
    }
    const deathClip = clips.find((c) => /death|die/i.test(c.name)) || null;
    return { root, inner, mixer, mats, deathClip };
  }
  // Orient a (non-skinned) item model so its longest axis points along +Z.
  function orientedItem(proto, length, upright = false) {
    const root = new THREE.Group();
    const inner = proto.gltf.scene.clone(true);
    const box = boxOf(inner), size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
    inner.position.sub(ctr);
    const holder = new THREE.Group(); holder.add(inner);
    const longest = Math.max(size.x, size.y, size.z) || 1;
    holder.scale.setScalar(length / longest);
    if (!upright) {
      if (size.y >= size.x && size.y >= size.z) holder.rotation.x = Math.PI / 2;
      else if (size.x >= size.z) holder.rotation.y = Math.PI / 2;
    } else {
      // standing disc: thinnest axis points outward (+Z), longest axis up (+Y)
      const ax = [[size.x, new THREE.Vector3(1, 0, 0)], [size.y, new THREE.Vector3(0, 1, 0)], [size.z, new THREE.Vector3(0, 0, 1)]].sort((p, q) => p[0] - q[0]);
      const [thin, mid, long] = [ax[0][1], ax[1][1], ax[2][1]];
      const R = new THREE.Matrix4().makeBasis(mid, long, thin).transpose();
      if (R.determinant() < 0) R.multiply(new THREE.Matrix4().makeScale(1, 1, -1));
      holder.quaternion.setFromRotationMatrix(R);
    }
    root.add(holder);
    return root;
  }

  // ---- ground: SankoQuest's own ground tiles (heights, colours, paths and floors, walkability) ---------------
  onProgress('map', 0.05);
  const texLoader = new THREE.TextureLoader();
  const loadImg = (url) => new Promise((res, rej) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => res(im); im.onerror = rej; im.src = url; });
  const pixels = (im) => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0); return x.getImageData(0, 0, im.width, im.height).data; };
  const [heightBuf, diffImg, ovImg, navImg] = await Promise.all([
    fetch(A('world/tiles/height.bin')).then((r) => r.arrayBuffer()), loadImg(A('world/tiles/diffuse.png')), loadImg(A('world/tiles/overlay.png')), loadImg(A('world/tiles/nav.png'))]);
  // the twelve ground textures, in the game's order (grass, rock, sand, tile, stone path, wood, wood 2, dirt, stone
  // interior, lab tile, cliff, haunted flagstone), packed into one texture array
  const LAYERS = [['grass-subtle-512-v2.jpg', 0, 1, 0], ['rock-512.jpg', 100, 1, 0], ['sand-512-color.jpg', 200, 1, 0], ['tile1-rpg-v3.png', 300, 0, 0], ['stone-path.jpg', 500, 1, 0], ['wood-floor.jpg', 600, 1, 0],
    ['wood-floor2.jpg', 700, 0, 0], ['dirt-512.jpg', 800, 0, 0], ['stone-interior.jpg', 900, 1, 0], ['lab-floor.jpg', 900, 0, 0], ['cliff-rpg-v3.png', 0, 0, 0], ['haunted-flagstone.jpg', 0, 0, 1]];
  const TS = low ? 256 : 512;
  const layerImgs = await Promise.all(LAYERS.map(([f]) => loadImg(A('world/terrain/' + f))));
  const arr = new Uint8Array(TS * TS * 4 * LAYERS.length);
  { const c = document.createElement('canvas'); c.width = c.height = TS; const x = c.getContext('2d', { willReadFrequently: true });
    layerImgs.forEach((im, i) => { x.clearRect(0, 0, TS, TS); x.drawImage(im, 0, 0, TS, TS); arr.set(x.getImageData(0, 0, TS, TS).data, i * TS * TS * 4); }); }
  const groundTex = new THREE.DataArrayTexture(arr, TS, TS, LAYERS.length);
  Object.assign(groundTex, { colorSpace: THREE.SRGBColorSpace, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: true, anisotropy: 4 });
  groundTex.needsUpdate = true;
  const rawTex = (im) => { const t = new THREE.Texture(im); Object.assign(t, { colorSpace: THREE.NoColorSpace, premultiplyAlpha: false, flipY: false, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }); t.needsUpdate = true; return t; };
  const diffTex = rawTex(diffImg), ovTex = rawTex(ovImg);
  // The ground shader follows the game's: a cell whose colour alpha is 1..12 shows that texture; alpha 255 is painted
  // colour textured by the grass or sand pattern; steep greens and greys turn to cliff; paths and floors are painted on
  // top in whole or part cells (the overlay's green channel is the cut, blue the turn), with soft dark edges.
  const groundMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0, envMapIntensity: 0.6 });
  groundMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uDiff: { value: diffTex }, uOver: { value: ovTex }, uTex: { value: groundTex }, uSeed: { value: LAYERS.map((l) => l[1]) }, uRot: { value: LAYERS.map((l) => l[2]) }, uMir: { value: LAYERS.map((l) => l[3]) }, uWet: { value: 0 } });
    groundMat.userData.sh = sh;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D uDiff, uOver; uniform highp sampler2DArray uTex; uniform float uSeed[12], uRot[12], uMir[12], uWet;
        varying vec3 vWP; varying vec3 vWN;
        float gPuddle = 0.0;
        float gPit = 0.0; // 1 deep in the dark pit around an underground area (the overworld never dips below 0)
        float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453), b = fract(sin(dot(i + vec2(1, 0), vec2(127.1, 311.7))) * 43758.5453);
          float c = fract(sin(dot(i + vec2(0, 1), vec2(127.1, 311.7))) * 43758.5453), d = fract(sin(dot(i + vec2(1, 1), vec2(127.1, 311.7))) * 43758.5453);
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }
        vec3 s2l(vec3 c) { return pow(max(c, vec3(0.0)), vec3(2.2)); }
        vec2 layerUV(vec2 uv, int i) {
          if (uRot[i] > 0.5) { vec2 b = floor(vWP.xz / 10.0 + uSeed[i]); float a = fract(sin(b.x * 12.9898 + b.y * 78.233) * 43758.5453) * 6.2831853;
            vec2 n = uv - 0.5; uv = vec2(n.x * cos(a) - n.y * sin(a), n.x * sin(a) + n.y * cos(a)) + 0.5; }
          if (uMir[i] > 0.5) uv = abs(fract(uv * 0.5) * 2.0 - 1.0);
          return uv;
        }
        vec3 layer(int i, vec2 uv) { return texture(uTex, vec3(layerUV(uv, i), float(i))).rgb; }
        float lum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
        int ovLayer(float id) { return id < 1.5 ? 1 : id < 2.5 ? 2 : id < 3.5 ? 0 : int(id) - 1; }
        float ovShape(vec4 ov, vec2 f) { // the game's part-cell cuts
          float a = floor(ov.g * 255.0 + 0.5), o = floor(ov.b * 255.0 + 0.5);
          float n = f.x, l = 1.0 - f.y, u = 1.0 - n, p = 1.0 - l, s = o - step(4.0, o) * 4.0, m = step(3.5, o);
          float c1 = step(0.5, s) * step(s, 1.5), c2 = step(1.5, s) * step(s, 2.5), c3 = step(2.5, s) * step(s, 3.5);
          float N = mix(mix(mix(n, p, c1), u, c2), l, c3), S = mix(mix(mix(l, n, c1), p, c2), u, c3);
          float T = mix(N, 1.0 - N, m), C = T + S;
          float D = 1.0;
          D = mix(D, step(C, 1.0), step(0.5, a) * step(a, 1.5)); D = mix(D, step(C, 0.5), step(1.5, a) * step(a, 2.5));
          D = mix(D, step(T, 0.5), step(2.5, a) * step(a, 3.5)); D = mix(D, step(T * 0.5 + S, 1.0), step(3.5, a) * step(a, 4.5));
          D = mix(D, step(0.5, C), step(4.5, a) * step(a, 5.5)); D = mix(D, step(1.0, T * 0.5 + S), step(5.5, a) * step(a, 6.5));
          return step(0.5, floor(ov.r * 255.0 + 0.5)) * D;
        }
        float ovAt(vec2 xz, float id) { vec4 o = texelFetch(uOver, ivec2(clamp(floor(xz), 0.0, 511.0)), 0); return abs(floor(o.r * 255.0 + 0.5) - id) < 0.5 ? ovShape(o, fract(xz)) : 0.0; }`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        {
          vec2 xz = vWP.xz; ivec2 cell = ivec2(clamp(floor(xz), 0.0, 511.0));
          vec4 dc = texelFetch(uDiff, cell, 0); float a = floor(dc.a * 255.0 + 0.5);
          vec2 duv = xz / 4.0;
          vec3 base = s2l(texture(uDiff, (xz) / 512.0).rgb);
          float isTex = step(0.5, a) * step(a, 12.5), isCol = step(254.5, a);
          float green = isCol * step(dc.r * 1.15 + 0.01, dc.g) * step(dc.b * 1.15 + 0.01, dc.g);
          float grey = isCol * step(abs(dc.r - dc.g), 0.018) * step(abs(dc.g - dc.b), 0.018) * step(0.018, dc.r) * step(dc.r, 0.45);
          float L = mix(lum(layer(2, duv)), lum(layer(0, duv)), green);
          vec3 col = base * L * 1.65;
          // pure white squares are snow (the Payasan snow patch): cool white with the sand's grain, never glaring
          vec3 bsn = texture(uDiff, xz / 512.0).rgb; float snow = isCol * smoothstep(0.78, 0.97, min(bsn.r, min(bsn.g, bsn.b)));
          col = mix(col, vec3(0.56, 0.6, 0.66) * (0.78 + 0.45 * lum(layer(2, duv * 0.5))), snow);
          int ti = int(clamp(a - 1.0, 0.0, 11.0));
          col = mix(col, layer(ti, duv), isTex);
          // steep ground becomes cliff (projected from the side so it does not stretch)
          float steepish = step(abs(vWN.y), 0.6) * clamp(green + grey + step(0.5, a) * step(a, 2.5) + step(10.5, a) * step(a, 11.5), 0.0, 1.0);
          vec3 cliffUV = vWP * 0.125;
          vec3 cl = abs(vWN.x) > abs(vWN.z) ? texture(uTex, vec3(cliffUV.zy, 10.0)).rgb : texture(uTex, vec3(cliffUV.xy, 10.0)).rgb;
          col = mix(col, mix(vec3(0.22, 0.21, 0.19), cl, 0.55) * 1.5, steepish);
          // paths, floors and other painting on top
          vec4 ov = texelFetch(uOver, cell, 0); float oid = floor(ov.r * 255.0 + 0.5);
          if (oid > 0.5) {
            float cov = ovShape(ov, fract(xz));
            float e = 0.48, nb = ovAt(xz + vec2(-e, 0.0), oid) + ovAt(xz + vec2(e, 0.0), oid) + ovAt(xz + vec2(0.0, -e), oid) + ovAt(xz + vec2(0.0, e), oid);
            float edge = 1.0 - (cov * 0.36 + nb * 0.16);
            vec3 oc = layer(ovLayer(oid), duv) * mix(1.0, 0.58, clamp(edge, 0.0, 1.0));
            col = mix(col, oc, cov);
          }
          // rain: the ground darkens; puddles gather on flat open ground and paths, and mirror the sky
          float pn = vnoise(xz * 0.35) * 0.65 + vnoise(xz * 1.3) * 0.35;
          gPuddle = uWet * smoothstep(0.62, 0.7, pn) * smoothstep(0.985, 0.998, vWN.y);
          col *= mix(1.0, 0.68, uWet);
          col = mix(col, col * 0.35 + vec3(0.02, 0.025, 0.03), gPuddle);
          gPit = smoothstep(-0.4, -5.0, vWP.y);
          diffuseColor.rgb = col * (1.0 - gPit);
        }`)
      .replace('#include <fog_fragment>', 'gl_FragColor.rgb *= 1.0 - gPit;\n#include <fog_fragment>')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix(roughnessFactor, 0.55, uWet * 0.6); roughnessFactor = mix(roughnessFactor, 0.04, gPuddle);');
  };
  // the sea: the game keeps one level of water across the world (0.8); the real ground lies under it
  // the ground's heights as a texture, so the water knows how deep it is (shallows turn turquoise, foam at the shore)
  const hData = new Uint16Array(513 * 513);
  const heightTex = new THREE.DataTexture(hData, 513, 513, THREE.RedFormat, THREE.HalfFloatType);
  Object.assign(heightTex, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false, flipY: false });
  const waterMat = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false, shininess: 110, specular: 0xb8e4ff });
  waterMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uTime: { value: 0 }, uRain: { value: 0 }, uHeight: { value: heightTex }, uNight: { value: 0 } }); waterMat.userData.sh = sh;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP2;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP2 = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uTime, uRain, uNight; uniform sampler2D uHeight; varying vec3 vWP2;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec2 huv = (vWP2.xz + 0.5) / 513.0;
        float ground = (huv.x > 0.0 && huv.x < 1.0 && huv.y > 0.0 && huv.y < 1.0) ? texture2D(uHeight, huv).r : -3.0;
        float depth = max(0.0, ${WATER_Y.toFixed(2)} - ground);
        vec3 shallow = vec3(0.30, 0.78, 0.80), deep = vec3(0.07, 0.30, 0.56);
        vec3 wc = mix(shallow, deep, smoothstep(0.03, 0.75, depth));
        float w = sin(vWP2.x * 0.55 + uTime * 1.3) * sin(vWP2.z * 0.47 - uTime * 1.1) + 0.5 * sin((vWP2.x + vWP2.z) * 1.3 + uTime * 2.1);
        wc += vec3(0.06, 0.08, 0.09) * smoothstep(0.7, 1.4, w);
        // foam where the water meets the shore, breathing in and out
        float edge = 1.0 - smoothstep(0.0, 0.09 + 0.04 * sin(uTime * 1.7 + vWP2.x * 0.6 + vWP2.z * 0.4), depth);
        float froth = step(0.42, fract(sin(dot(floor(vWP2.xz * 3.0), vec2(12.99, 78.23))) * 437.5 + uTime * 0.2));
        wc = mix(wc, vec3(0.92, 0.97, 1.0), edge * (0.55 + 0.45 * froth));
        // raindrop rings when it rains
        vec2 rc = floor(vWP2.xz * 1.5); float ph = fract(uTime * 0.9 + fract(sin(dot(rc, vec2(12.99, 78.23))) * 437.5));
        float rr = length(fract(vWP2.xz * 1.5) - 0.5); wc += uRain * 0.25 * smoothstep(0.05, 0.0, abs(rr - ph * 0.45)) * (1.0 - ph);
        diffuseColor.rgb = wc * mix(1.0, 0.7, uNight);
        diffuseColor.a = mix(0.6, 0.92, smoothstep(0.0, 0.6, depth)) + edge * 0.3;`);
  };
  const water = new THREE.Mesh(new THREE.PlaneGeometry(MAP_SIZE * 8, MAP_SIZE * 8).rotateX(-Math.PI / 2), waterMat);
  water.position.set(MAP_SIZE / 2, WATER_Y, MAP_SIZE / 2); water.renderOrder = 2; water.receiveShadow = true; scene.add(water);
  const seabed = new THREE.Mesh(new THREE.PlaneGeometry(MAP_SIZE * 8, MAP_SIZE * 8).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x24527a }));
  seabed.position.set(MAP_SIZE / 2, WATER_Y - 3, MAP_SIZE / 2); scene.add(seabed);

  // a small sky for the ground to reflect (puddles in the rain)
  {
    const skyScene = new THREE.Scene();
    const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, uniforms: {}, vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'varying vec3 vP; void main(){ float h = normalize(vP).y; vec3 c = mix(vec3(0.55,0.62,0.66), vec3(0.32,0.5,0.78), smoothstep(0.0, 0.7, h)); c = mix(vec3(0.25,0.27,0.24), c, smoothstep(-0.2, 0.02, h)); gl_FragColor = vec4(c, 1.0); }' });
    skyScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 24, 12), skyMat));
    const pm = new THREE.PMREMGenerator(renderer); groundMat.envMap = pm.fromScene(skyScene, 0.02).texture; pm.dispose();
  }
  const F = field;
  let terrain = null; const groundPieces = [];
  function buildWorldGround() {
    terrain = terrainFromTiles({ height: new Float32Array(heightBuf), nav: pixels(navImg), S: MAP_SIZE });
    F.data = terrain.h;
    for (let k = 0; k < 513 * 513; k++) hData[k] = THREE.DataUtils.toHalfFloat(terrain.h[k]);
    heightTex.needsUpdate = true;
    // the ground in 8x8 pieces (64 units each), so only the pieces in view are drawn
    const n = F.n, geo = new THREE.PlaneGeometry(n - 1, n - 1, n - 1, n - 1).rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let k = 0; k < pos.count; k++) { const x = pos.getX(k) + MAP_SIZE / 2, z = pos.getZ(k) + MAP_SIZE / 2; pos.setY(k, terrain.h[Math.round(z) * n + Math.round(x)]); }
    geo.computeVertexNormals();
    const P = pos.array, N = geo.attributes.normal.array, C = 64;
    for (let cz = 0; cz < 8; cz++) for (let cx = 0; cx < 8; cx++) {
      const w = C + 1, cp = new Float32Array(w * w * 3), cn = new Float32Array(w * w * 3), idx = [];
      for (let j = 0; j < w; j++) for (let i = 0; i < w; i++) { const src = ((cz * C + j) * n + cx * C + i) * 3, dst = (j * w + i) * 3; cp[dst] = P[src] + MAP_SIZE / 2; cp[dst + 1] = P[src + 1]; cp[dst + 2] = P[src + 2] + MAP_SIZE / 2; cn[dst] = N[src]; cn[dst + 1] = N[src + 1]; cn[dst + 2] = N[src + 2]; }
      for (let j = 0; j < C; j++) for (let i = 0; i < C; i++) { const a = j * w + i, b = a + 1, c = a + w, d = c + 1; idx.push(a, c, b, b, c, d); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(cp, 3)); g.setAttribute('normal', new THREE.BufferAttribute(cn, 3)); g.setIndex(idx); g.computeBoundingSphere();
      const piece = new THREE.Mesh(g, groundMat); piece.name = 'ground'; piece.receiveShadow = true; piece.userData.x0 = cx * C; piece.userData.z0 = cz * C; groundPieces.push(piece); scene.add(piece);
    }
    geo.dispose();
  }
  const diffPx = pixels(diffImg), ovPx = pixels(ovImg); // for the foliage rules (premultiplied canvas reads are fine: colour cells are opaque)

  onProgress('props', 0.15);
  const worldProps = new THREE.Group(); worldProps.name = 'props'; scene.add(worldProps);
  // batching only pays off where the browser can draw many pieces in one call (WEBGL_multi_draw); elsewhere three.js
  // would fall back to one call per piece, so those browsers keep the per-area instancing
  const BATCH = !new URLSearchParams(location.search).has('nobatch') && renderer.extensions.has('WEBGL_multi_draw');
  const rugs = new THREE.Group(); rugs.name = 'rugs'; scene.add(rugs);
  const num = (v, d) => (v == null || Number.isNaN(v) ? d : v);
  let allNodes = null, propsBuilt = false, areaBuilt = false;
  const areaFx = new THREE.Group(); areaFx.name = 'area-fx'; scene.add(areaFx);
  async function parseNodes() {
    if (allNodes) return allNodes;
    const data = await (await fetch(A('world/scenes/world.json'))).json();
    // underground areas live in their own scene files; each sits in an empty corner of our world (tools/build-world-tiles.py)
    for (const a of AREA_SCENES) {
      try { const sc = await (await fetch(A('world/scenes/' + a.file))).json(); for (const r of sc) data.push({ ...r, transform: { position: [a.dx, 0, a.dz] }, area: true }); } catch (e) { console.warn('area scene failed', a.file, e); }
    }
    const rootObj = new THREE.Object3D(); const nodes = []; const planes = []; const pools = [], lamps = [];
    // roofs come off so you can see into the buildings: roof groups in the scene, and roof-like pieces anywhere
    // (dormers, chimneys, the little canopies over doors)
    const ROOFY = /roof|dormer|chimney|town_entry/i;
    let nodeId = 0; const nodeNames = new Map();
    // each roof piece belongs to a building (the node its roof group sits in), so a building's roof can lift off as one
    const walk = (n, parent, underRoof = false, parentId = 0, roofOwner = 0) => {
      const o = new THREE.Object3D(); parent.add(o);
      const myId = ++nodeId; nodeNames.set(myId, n.name || '');
      const startsRoof = !underRoof && ROOFY.test(n.name || '');
      const roofy = underRoof || startsRoof;
      if (startsRoof) roofOwner = parentId;
      const t = n.transform;
      if (t) {
        if (t.position) o.position.set(num(t.position[0], 0), num(t.position[1], 0), num(t.position[2], 0));
        if (t.rotation) o.rotation.set(num(t.rotation[0], 0), num(t.rotation[1], 0), num(t.rotation[2], 0));
        if (t.scale != null) { if (Array.isArray(t.scale)) o.scale.set(num(t.scale[0], 1), num(t.scale[1], 1), num(t.scale[2], 1)); else o.scale.setScalar(num(t.scale, 1)); }
      }
      const m = (n.components || []).find((c) => c.type === 'model' && c.filename);
      if (m) { const roof = !!m.isRoof || roofy || ROOFY.test(m.filename); nodes.push({ o, file: m.filename, roof, bldg: roof ? (roofOwner || parentId) : 0, m }); }
      const ip = (n.components || []).find((c) => c.type === 'imagePlane' && c.filename);
      if (ip) planes.push({ o, file: ip.filename, w: ip.width, l: ip.length });
      // a pool of water (a flat box with the game's water material) and the baked lamps of an underground area (the
      // overworld's own water boxes are the sea and lakes, which the sea plane already draws)
      const wm = (n.components || []).find((c) => c.type === 'waterMaterial'), bx = (n.components || []).find((c) => c.type === 'boxGeometry');
      if (inArea && wm && bx && bx.args) pools.push({ o, w: bx.args[0], d: bx.args[2], color: (wm.props && wm.props.color) || '#3355a3' });
      if (inArea && (n.components || []).some((c) => c.type === 'bakedSpotLight')) lamps.push(o);
      for (const c of n.children || []) walk(c, o, roofy, myId, roofOwner);
    };
    let inArea = false;
    for (const r of data) { inArea = !!r.area; walk(r, rootObj); }
    rootObj.updateMatrixWorld(true);
    const v = new THREE.Vector3();
    // a model can be repeated in a row or grid (fences, wall runs, the castle's curtain walls): copies step along the
    // node's own X/Z axes by the given offsets, rotated but not scaled, exactly as the game lays them out
    allNodes = [];
    const pq = new THREE.Quaternion(), ps = new THREE.Vector3(), pp = new THREE.Vector3(), off = new THREE.Vector3();
    for (const { o, file, roof, bldg, m } of nodes) {
      o.matrixWorld.decompose(pp, pq, ps);
      const rx = m.instanced && m.repeatX && m.repeatCountX > 1, rz = m.instanced && m.repeatZ && m.repeatCountZ > 1;
      const cx = rx ? m.repeatCountX : 1, cz = rz ? m.repeatCountZ : 1, ox = rx ? (m.repeatOffsetX ?? 1) : 0, oz = rz ? (m.repeatOffsetZ ?? 1) : 0;
      for (let a = 0; a < cx; a++) for (let b = 0; b < cz; b++) {
        off.set(a * ox, 0, b * oz).applyQuaternion(pq).add(pp);
        allNodes.push({ file, roof, bldg, mw: new THREE.Matrix4().compose(off, pq, ps), x: off.x, y: off.y, z: off.z });
      }
    }
    allNodes.names = nodeNames;
    allNodes.planes = planes.map(({ o, file, w, l }) => { v.setFromMatrixPosition(o.matrixWorld); return { file, w, l, mw: o.matrixWorld.clone(), x: v.x, y: v.y, z: v.z }; });
    allNodes.pools = pools.map(({ o, w, d, color }) => ({ w, d, color, mw: o.matrixWorld.clone() }));
    allNodes.lamps = lamps.map((o) => new THREE.Vector3().setFromMatrixPosition(o.matrixWorld));
    return allNodes;
  }

  // ---- foliage: the game's own rule. Every 4-unit cell gets a seeded roll; painted greens grow grass (sometimes a
  // daisy or a mushroom), stone paths get the odd pebble, snow gets snow rocks. Only the nearest 384 within 52 units.
  const FOLIAGE = {
    grassGreen: { asset: 'grass1.glb', minScale: 0.01, scaleVariation: 0.005, heightOffset: 0.08 },
    grassYellow: { asset: 'grass1.glb', minScale: 0.01, scaleVariation: 0.005, heightOffset: 0.08, yellowTint: true },
    daisy: { asset: 'daisies.glb', minScale: 0.4, scaleVariation: 0.004, heightOffset: 0.08 },
    mushroom1: { asset: 'mushroom1.glb', minScale: 2.1, scaleVariation: 0.9, heightOffset: 0.08 },
    mushroom2: { asset: 'mushroom2.glb', minScale: 2.1, scaleVariation: 0.9, heightOffset: 0.08 },
    pathRock: { asset: 'stones1.glb', minScale: 0.004, scaleVariation: 0.005, heightOffset: 0.035 },
    snowRock: { asset: 'snow-rock.glb', minScale: 0.003, scaleVariation: 0.005, heightOffset: 0.035 },
  };
  const FOL_MAX = low ? 220 : 384, FOL_R = 52, SNOW = new Set([0xb8d8e8, 0xd4e4ec]), hsl = { h: 0, s: 0, l: 0 }, tmpC = new THREE.Color();
  const folHash = (x, z) => { let n = (x + 1) * 0x165667b1 + (z + 1) * 0x27d4eb2f + 0xf0e5cde746a810; return ((n = Math.imul(n = (n ^ n >>> 13) >>> 0, 0x4bf19f61) >>> 0) ^ n >>> 16) >>> 0; };
  const mulberry = (seed) => { let t = seed >>> 0; return () => { let e = Math.imul((t = t + 0x6d2b79f5 >>> 0) ^ t >>> 15, 1 | t); return (((e ^= e + Math.imul(e ^ e >>> 7, 61 | e)) ^ e >>> 14) >>> 0) / 0x100000000; }; };
  const greenish = (r, g, b) => { tmpC.setRGB(r / 255, g / 255, b / 255); tmpC.getHSL(hsl); return hsl.h >= 0.2 && hsl.h <= 0.45 && hsl.s >= 0.2 && hsl.l >= 0.15 && hsl.l <= 0.7; };
  function folPick(ov, r, g, b, al, t) {
    if (ov === 5) return t() > 0.045 ? null : 'pathRock';
    const grassCell = al === 1;
    if (ov !== 0 || (al !== 255 && !grassCell)) return null;
    if (!grassCell && SNOW.has(r << 16 | g << 8 | b)) return 0.26 > t() ? 'snowRock' : null;
    if ((!grassCell && !greenish(r, g, b)) || t() > 0.62) return null;
    const x = t(); return x < 0.02 ? 'daisy' : x < 0.032 ? (0.5 > t() ? 'mushroom1' : 'mushroom2') : (0.7 > t() ? 'grassGreen' : 'grassYellow');
  }
  const folMeshes = {}; // variant -> [{ im, base }]
  await Promise.all(Object.entries(FOLIAGE).map(async ([v, cfg]) => {
    try {
      const g = await loadGLB(A('world/foliage/' + cfg.asset)); g.scene.updateMatrixWorld(true);
      folMeshes[v] = [];
      g.scene.traverse((m) => {
        if (!m.isMesh) return;
        let mat = m.material; if (cfg.yellowTint) { mat = mat.clone(); mat.color = (mat.color || new THREE.Color(1, 1, 1)).clone().multiply(new THREE.Color(0xe8c86a)); }
        const im = new THREE.InstancedMesh(m.geometry, mat, FOL_MAX); im.count = 0; im.frustumCulled = false; im.receiveShadow = true; scene.add(im);
        folMeshes[v].push({ im, base: new THREE.Matrix4() }); // the game places the bare geometry (no node transform)
      });
    } catch (e) { console.warn('foliage model failed', v, e); }
  }));
  let folCell = '';
  const folM = new THREE.Matrix4(), folQ = new THREE.Quaternion(), folP = new THREE.Vector3(), folS = new THREE.Vector3(), UPV = new THREE.Vector3(0, 1, 0);
  function updateFoliage(px, pz) {
    const key = Math.floor(px / 6) + ',' + Math.floor(pz / 6); if (key === folCell || !terrain) return; folCell = key;
    const cx = (Math.floor(px / 6) + 0.5) * 6, cz = (Math.floor(pz / 6) + 0.5) * 6, R = FOL_R;
    const list = [];
    for (let e = Math.floor((cz - R) / 4); e <= Math.ceil((cz + R) / 4); e++) for (let a = Math.floor((cx - R) / 4); a <= Math.ceil((cx + R) / 4); a++) {
      const o = mulberry(folHash(a, e)), x = (a + o()) * 4, z = (e + o()) * 4, dx = x - cx, dz = z - cz;
      if (dx * dx + dz * dz > R * R || x < 0 || z < 0 || x >= 512 || z >= 512) continue;
      const q = (Math.floor(z) * 512 + Math.floor(x)) * 4, y = groundAt(x, z), rot = o() * Math.PI * 2;
      const v = folPick(ovPx[q], diffPx[q], diffPx[q + 1], diffPx[q + 2], diffPx[q + 3], o); if (!v) continue;
      const c = FOLIAGE[v]; list.push({ v, x, y: y + c.heightOffset, z, rot, s: c.minScale + o() * c.scaleVariation, d: Math.hypot(dx, dz) });
    }
    list.sort((p, q) => p.d - q.d);
    const counts = {};
    for (const it of list.slice(0, FOL_MAX)) {
      const meshes = folMeshes[it.v]; if (!meshes) continue;
      const i = counts[it.v] = (counts[it.v] || 0); counts[it.v]++;
      const s = it.s * Math.min(1, Math.max(0, (R - it.d) / 10));
      folM.compose(folP.set(it.x, it.y, it.z), folQ.setFromAxisAngle(UPV, it.rot), folS.set(s, s, s));
      for (const m of meshes) m.im.setMatrixAt(i, tmpM4.multiplyMatrices(folM, m.base));
    }
    for (const [v, meshes] of Object.entries(folMeshes)) for (const m of meshes) { m.im.count = counts[v] || 0; m.im.instanceMatrix.needsUpdate = true; }
  }
  const tmpM4 = new THREE.Matrix4();
  // ---- the world's living props from the live game: trees, crops, ores, furnaces, anvils, practice dummies -------------
  let entData = null; const entGroup = new THREE.Group(); entGroup.name = 'ents'; scene.add(entGroup);
  // a tree between you and the camera turns see-through (a fine screen-door pattern, so there is nothing to sort) and fades
  // back when you move on, so trees never hide your character and never pop in or out
  // leaves come blended (glTF BLEND); instanced trees cannot be sorted leaf by leaf, so far trees looked see-through.
  // A cut-out writes depth and always draws right; textures keep a soft edge from their own alpha.
  function solidLeaves(m) {
    if (m && m.transparent && m.map && (m.opacity ?? 1) > 0.99) { m.transparent = false; m.alphaTest = 0.4; m.depthWrite = true; m.needsUpdate = true; }
    return m;
  }
  const LEAFY = /leaf|leaves|foliage|pine|bush|fern|ivy|plant|hedge|vine/i;
  const TREES = /tree|oak|pine|cherry|dracaena/i, treeMeshes = [], TREE_NEAR = 3, TREE_FAR = 5, TREE_GHOST = 0.45, TREE_RATE = 2.5;
  const fadeMats = new Map();
  function fadeMaterial(mat) {
    if (Array.isArray(mat)) return mat.map(fadeMaterial);
    if (fadeMats.has(mat)) return fadeMats.get(mat);
    const m = solidLeaves(mat.clone());
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aFade;\nvarying float vFade;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFade = aFade;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vFade;\nconst float TREE_BAYER[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);')
        .replace('void main() {', 'void main() {\n  if (vFade < 0.999) { ivec2 q = ivec2(mod(gl_FragCoord.xy, 4.0)); if ((TREE_BAYER[q.y * 4 + q.x] + 0.5) / 16.0 >= vFade) discard; }');
    };
    m.customProgramCacheKey = () => 'treefade';
    fadeMats.set(mat, m);
    return m;
  }
  function updateTreeFade(px, pz, dt) {
    const cdx = Math.sin(cam.yaw), cdz = Math.cos(cam.yaw), step = Math.min(1, dt * TREE_RATE); // from you toward the camera
    for (const t of treeMeshes) {
      let changed = false;
      for (let i = 0; i < t.xz.length; i++) {
        const dx = t.xz[i][0] - px, dz = t.xz[i][1] - pz, d = Math.hypot(dx, dz);
        // only a tree standing between you and the camera could hide you; closer means more see-through
        const front = dx * cdx + dz * cdz > 0.5 && d < TREE_FAR;
        const want = front ? TREE_GHOST + (1 - TREE_GHOST) * Math.min(1, Math.max(0, (d - TREE_NEAR) / (TREE_FAR - TREE_NEAR))) : 1;
        const cur = t.fade[i];
        if (cur !== want) { t.fade[i] = Math.abs(want - cur) <= step ? want : cur + Math.sign(want - cur) * step; changed = true; }
      }
      if (changed) t.attr.needsUpdate = true;
    }
  }
  async function placeEntities() {
    if (!entData) { try { entData = await (await fetch(A('world/entities.json'))).json(); } catch (e) { entData = { nodes: {}, folk: [] }; } }
    if (entGroup.children.length) return; // placed once for the whole world
    const q = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0), P = new THREE.Vector3(), S = new THREE.Vector3(), M = new THREE.Matrix4();
    await Promise.all(Object.entries(entData.nodes).map(async ([file, list]) => {
      try {
        const g = await loadGLB(A('world/nodes/' + encodeURIComponent(file))); g.scene.updateMatrixWorld(true);
        const mats = list.map(([x, z, yaw, s]) => new THREE.Matrix4().compose(P.set(x, groundAt(x, z), z), q.setFromAxisAngle(UP, yaw * Math.PI / 180), S.set(s, s, s)));
        g.scene.traverse((m) => {
          if (!m.isMesh) return;
          const full = mats.map((mm) => new THREE.Matrix4().multiplyMatrices(mm, m.matrixWorld));
          for (const { im, idx } of chunkedInstances(m.geometry, m.material, full, entGroup)) {
            if (TREES.test(file)) {
              const fade = new Float32Array(idx.length).fill(1), attr = new THREE.InstancedBufferAttribute(fade, 1);
              im.geometry = im.geometry.clone(); im.geometry.setAttribute('aFade', attr); im.material = fadeMaterial(im.material);
              treeMeshes.push({ im, fade, attr, xz: idx.map((i) => [list[i][0], list[i][1]]) });
            }
          }
        });
      } catch (e) { console.warn('entity model failed', file, e); }
    }));
  }
  // townsfolk: the game's NPCs stand at their real spots (the nearest few are shown, with SankoQuest looks)
  const folkActors = new Map(); let folkT = 0;
  const SPECIAL_FOLK = { npc_survival_sankson: 'sankson', npc_star: 'star', npc_boatman: 'boatman' };
  const FOLK_LOOKS = [
    { hair: 'Short', hairColor: 0x3b2a1d, skin: 0xdfaa8b, shirt: 0x6b8f4e, pants: 0x4a3f33, armor: {} },
    { hair: 'Long', hairColor: 0xa75c19, skin: 0xe7c4a9, shirt: 0x8a3b3b, pants: 0x2c2c33, armor: {} },
    { hair: 'Buns', hairColor: 0x2a1c12, skin: 0xc79a73, shirt: 0x3b5b8a, pants: 0x3a3a3a, armor: {} },
    { hair: 'Middle Part', hairColor: 0xdddddd, skin: 0xd0a173, shirt: 0x7a6a4a, pants: 0x4a4f63, armor: { head: 'Bowler Hat' } },
    { hair: 'Shaggy', hairColor: 0x996f5f, skin: 0xbe8e60, armor: { head: 'Iron Helmet', chest: 'Iron Chestplate', legs: 'Iron Leggings', feet: 'Iron Boots' } },
    { hair: 'Pomp', hairColor: 0x4a3426, skin: 0xe2c4af, shirt: 0xb98a45, pants: 0x263040, armor: { head: 'Wizard Hat', chest: 'Wizard Robe', legs: 'Wizard Skirt' } },
  ];
  // each role its own look (owner 3 Nov: "theres wizard npcs out in the wilderness": the graveyard folk out by the swamp
  // and the elder wore the wizard robes); only real wizards wear robes, the Shape Wizards their own set
  const ROLE_LOOKS = [
    [/shapewizard/i, { hair: 'Pomp', hairColor: 0x2a1c12, skin: 0xd8b08c, shirt: 0x5a3f7a, pants: 0x2c2440, armor: { head: 'Shape Wizard Hat', chest: 'Shape Robe', legs: 'Shape Skirt' } }],
    [/wizard/i, FOLK_LOOKS[5]],
    [/priest/i, { hair: 'Short', hairColor: 0xcfcfcf, skin: 0xe2c4af, shirt: 0xe8e0d0, pants: 0x3a3530, armor: {} }], // pale vestments
    [/cemetary|cemetery|grave/i, { hair: 'Shaggy', hairColor: 0x4a3a2a, skin: 0xc9a07a, shirt: 0x4b4238, pants: 0x2e2a26, armor: { head: 'Straw Hat' } }], // gravediggers
    [/elder/i, { hair: 'Long', hairColor: 0xe6e6e6, skin: 0xd9b48f, shirt: 0x6b5a45, pants: 0x4a4033, armor: {} }],
    [/guard/i, FOLK_LOOKS[4]],
  ];
  // Apache Village: Sanko's own Buns stand at the first five spots, in the game's order (live capture 2 Nov:
  // cdn.sankoquest.com/assets/sanko/buns/{remilio,Detec,Kev,Orange,milady}.glb; npc_apache_5 runs Remilio's General
  // Store); owner 3 Nov: "fix npcs in apache village they are the buns". The other spots are desert villagers.
  const BUNS = ['Kev', 'Detec', 'Orange', 'milady', 'remilio'], BUN_H = 1.25, bunOf = new Map(), bunLoading = new Set();
  const bunFor = (i) => {
    if (!bunOf.size && entData) { let k = 0; entData.folk.forEach((f, j) => { if (f[3] === 'npc_apache' && k < BUNS.length) bunOf.set(j, BUNS[k++]); }); bunOf.set(-1, null); }
    return bunOf.get(i) || null;
  };
  // a townsfolk model of the game's own loads the first time you come near (Remilio and Milady are about 1 MB each)
  const folkProto = (key, path, h) => {
    if (protos[key] || bunLoading.has(key)) return protos[key] || null;
    bunLoading.add(key); prepare(A(path), h).then((p) => { protos[key] = p; folkT = 0; }).catch((e) => console.warn('townsfolk model failed', key, e));
    return null;
  };
  // Payasan Village's Payasans: the live game draws npc_paya with its Payasan model, 1.40 tall (live capture 2 Nov);
  // owner 3 Nov: "payasan village doesnt have the payasans in it"
  const PAYA_H = 1.4;
  const ownFolk = (kind, i) => {
    if (kind === 'npc_paya') return { key: 'paya', path: 'models/mobs/payasan/payasan.glb', h: PAYA_H };
    const bun = kind === 'npc_apache' ? bunFor(i) : null;
    return bun ? { key: 'bun:' + bun, path: 'models/buns/' + bun + '.glb', h: BUN_H } : null;
  };
  const APACHE_LOOKS = [
    { hair: 'Long', hairColor: 0x1e140c, skin: 0xb57e55, shirt: 0xc28a4a, pants: 0x6b4a2e, armor: {} },
    { hair: 'Short', hairColor: 0x2a1c12, skin: 0xa87048, shirt: 0xd9b27a, pants: 0x5a3d26, armor: { head: 'Straw Hat' } },
    { hair: 'Middle Part', hairColor: 0x3b2a1d, skin: 0xc48a5c, shirt: 0x9c4a2a, pants: 0x4a3324, armor: {} },
    { hair: 'Sideswept', hairColor: 0x1e140c, skin: 0xb07a50, shirt: 0xe0c08a, pants: 0x7a5a3a, armor: {} },
  ];
  const lookFor = (kind, i = 0) => { if (kind === 'npc_apache') return APACHE_LOOKS[i % APACHE_LOOKS.length]; for (const [re, look] of ROLE_LOOKS) if (re.test(kind)) return look; let h = 0; for (const c of kind) h = (h * 31 + c.charCodeAt(0)) >>> 0; return FOLK_LOOKS[h % 4]; };
  function updateFolk(dt) {
    if (!kit || !entData || !entData.folk) return;
    for (const a of folkActors.values()) a.mixer.update(dt);
    const now = performance.now(); if (now < folkT) return; folkT = now + 700; // by the clock, so slow frames do not delay it
    const want = entData.folk.map((f, i) => ({ i, f, d: (f[0] - cam.x) ** 2 + (f[1] - cam.z) ** 2 })).filter((o) => o.d < 42 * 42).sort((a, b) => a.d - b.d).slice(0, low ? 4 : 8);
    const keep = new Set(want.map((o) => o.i));
    for (const [i, a] of folkActors) if (!keep.has(i)) { entGroup.remove(a.root); folkActors.delete(i); }
    for (const { i, f } of want) {
      if (folkActors.has(i)) continue;
      const own = ownFolk(f[3], i);
      if (own) { // the game's own townsfolk models: Apache's Buns, the Payasans
        const p = folkProto(own.key, own.path, own.h); if (!p) continue; // still loading: placed on a later pass
        try {
          const inst = kit ? kit.animate(p.gltf, own.h, 'idle', { fromRest: 'hips' }) : instantiate(p, 'idle');
          inst.root.position.set(f[0], groundAt(f[0], f[1]), f[1]); inst.root.rotation.y = f[2] * Math.PI / 180 - ((inst.kit && inst.kit.yaw0) || 0);
          inst.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
          if (!inst.mixer) inst.mixer = { update() {} };
          inst.kind = own.key; entGroup.add(inst.root); folkActors.set(i, inst);
        } catch (e) { /* skip */ }
        continue;
      }
      const special = SPECIAL_FOLK[f[3]];
      if (special) { // the game's own characters: Survival Sankson, Star, Boaty
        const p = protos[special] || (special === 'sankson' ? playerProto : null);
        if (!p) continue;
        try {
          const inst = kit ? kit.animate(p.gltf, (ENEMIES[special] && ENEMIES[special].h) || 1.6, 'idle', { fromRest: FROM_REST.get(special) || false }) : instantiate(p, 'idle'); // (Boaty stood in a T-pose)
          if (inst.kit && ENEMIES[special] && ENEMIES[special].yawFix) inst.kit.yaw0 += ENEMIES[special].yawFix;
          inst.root.position.set(f[0], groundAt(f[0], f[1]), f[1]); inst.root.rotation.y = f[2] * Math.PI / 180 - ((inst.kit && inst.kit.yaw0) || 0);
          if (!inst.mixer) inst.mixer = { update() {} };
          inst.kind = special; entGroup.add(inst.root); folkActors.set(i, inst);
        } catch (e) { /* skip */ }
        continue;
      }
      try {
        const inst = kit.build({ ...lookFor(f[3], i), h: 1.85 }); inst.setMoving(false);
        inst.root.position.set(f[0], groundAt(f[0], f[1]), f[1]); inst.root.rotation.y = f[2] * Math.PI / 180 - inst.yaw0;
        inst.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
        entGroup.add(inst.root); folkActors.set(i, inst);
      } catch (e) { /* a missing part just skips this one */ }
    }
  }
  // roofs: every building's roof shows from outside; the roof over you lifts off when you walk in. T hides all roofs.
  const roofMeshes = [], roofBoxes = new Map(), roofHidden = new Set();
  let roofsOff = false; try { roofsOff = localStorage.getItem('sq-roofs') === 'off'; } catch { /* storage blocked */ }
  window.addEventListener('keydown', (e) => { if (e.key.toLowerCase() === 't' && !e.repeat) { roofsOff = !roofsOff; try { localStorage.setItem('sq-roofs', roofsOff ? 'off' : 'auto'); } catch { /* */ } roofHidden.clear(); roofHidden.add(-1); } });
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  function updateRoofs(px, pz) {
    const want = new Set();
    if (roofsOff) want.add('all');
    // indoors (the game's own map marks every interior): lift every roof with a piece close by; outdoors only a roof right
    // overhead (porches, overhangs). With roofs off this still decides when a landmark (the chapel) lifts its roof.
    {
      const ci = Math.floor(px), cj = Math.floor(pz);
      const inside = terrain && terrain.indoor && ci >= 0 && cj >= 0 && ci < 512 && cj < 512 && terrain.indoor[cj * 512 + ci];
      const reach = inside ? 8 : 2.2, r2 = reach * reach;
      for (const [id, b] of roofBoxes) {
        if (roofsOff && !isLandmark(id)) continue; // roofs off: every other roof is already gone
        if (isLandmark(id) && b.geo && px > b.geo.min.x && px < b.geo.max.x && pz > b.geo.min.z && pz < b.geo.max.z) { want.add(id); continue; } // under it
        if (px < b.x0 - reach - 2 || px > b.x1 + reach + 2 || pz < b.z0 - reach - 2 || pz > b.z1 + reach + 2) continue;
        for (let k = 0; k < b.pts.length; k += 2) { const dx = b.pts[k] - px, dz = b.pts[k + 1] - pz; if (dx * dx + dz * dz < r2) { want.add(id); break; } }
      }
    }
    if (want.size === roofHidden.size && [...want].every((k) => roofHidden.has(k))) return;
    roofHidden.clear(); for (const k of want) roofHidden.add(k);
    for (const r of roofMeshes) {
      // roofs off (T): the roof tiles go, the walls under them stay; walking into a building lifts its whole roof group
      for (let i = 0; i < r.mats.length; i++) r.im.setMatrixAt(i, (roofHidden.has('all') && !isLandmark(r.bldgs[i]) && !(r.wall && keepsWalls(r.bldgs[i]))) || roofHidden.has(r.bldgs[i]) ? ZERO : r.mats[i]);
      r.im.instanceMatrix.needsUpdate = true;
    }
    // a picture hung up where the roof's walls are (the chapel's stained glass) lifts with that roof; floor rugs stay
    for (const m of rugs.children) {
      if (m.userData.bldg === undefined) m.userData.bldg = pictureBuilding(m);
      m.visible = !(m.userData.bldg && roofHidden.has(m.userData.bldg));
    }
  }
  // Roofs off: a roof's own walls stay only where they are the building's real walls: the chapel's tall nave, or walls
  // standing on the ground (the wooden hut). Upper walls sitting on a ground floor (the strangehouse's gables, the guild's
  // upper storey) go with the roof, or they stand around nothing like a broken second floor.
  const KEEP_ROOF_WALLS = /^chapel$/i;
  // landmarks keep their roof even with roofs off, and lift it only when you walk in or right up to it like SankoQuest
  // does (the chapel without its roof was a box of very tall walls)
  const LANDMARK_ROOFS = /^chapel$|^starterIslandHouse/i; // the chapel, Tutorial Island's big house (its roof posts stood up in the air)
  const isLandmark = (id) => { const b = roofBoxes.get(id); return !!b && LANDMARK_ROOFS.test(b.name); };
  function keepsWalls(id) {
    const b = roofBoxes.get(id); if (!b) return true;
    if (b.keep === undefined) b.keep = KEEP_ROOF_WALLS.test(b.name) || (b.wy < 1e9 && b.wy - groundAt(b.wx, b.wz) < 0.5);
    return b.keep;
  }
  function pictureBuilding(m) {
    const p = new THREE.Vector3().setFromMatrixPosition(m.matrix);
    for (const [id, b] of roofBoxes) if (p.x > b.x0 - 0.8 && p.x < b.x1 + 0.8 && p.z > b.z0 - 0.8 && p.z < b.z1 + 0.8 && p.y >= b.y0 - 0.4) return id;
    return 0;
  }
  // Build (or rebuild) the ground and every prop around a map's centre.
  async function loadMap(m, progress = () => {}) {
    curMap = m;
    scene.background.set(m.sky); scene.fog.color.set(m.fog); hemi.intensity = 1.9 * m.light; sun.intensity = 2.2 * m.light;
    water.visible = seabed.visible = !m.under; // no sea underground
    if (typeof applyTime === 'function' && settingsReady) applyTime();
    const nodes = await parseNodes();
    if (!terrain) buildWorldGround();
    // underground: only the ground the area sits in is drawn (the overworld's sea floor around it would show otherwise)
    for (const pc of groundPieces) { const u = pc.userData; pc.visible = !m.area || (u.x0 < m.area[2] && u.x0 + 64 > m.area[0] && u.z0 < m.area[3] && u.z0 + 64 > m.area[1]); }
    const near = nodes.filter((n) => Math.hypot(n.x - m.cx, n.z - m.cz) < m.r + 60);
    // pictures in the scene (rugs, stained glass): SankoQuest's image planes stand upright (width across, length up) and
    // the node's own rotation lays a rug flat or turns a window to its wall, so the plane is used as it comes
    if (!rugs.children.length) for (const pl of (nodes.planes || [])) {
      const tex = texLoader.load(A('world/terrain/' + pl.file.split('/').pop())); tex.colorSpace = THREE.SRGBColorSpace;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(pl.w, pl.l), new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
      mesh.matrixAutoUpdate = false; mesh.matrix.copy(pl.mw); mesh.matrix.multiply(new THREE.Matrix4().makeTranslation(0, 0, 0.03)); rugs.add(mesh); // a hair off its floor or wall
    }
    // underground areas: their pools of water and the light thrown on the floor by their lamps, built once
    if (!areaBuilt) {
      areaBuilt = true;
      for (const pl of nodes.pools || []) {
        const c = new THREE.Color(pl.color);
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(pl.w, pl.d).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: c, emissive: c.clone().multiplyScalar(0.35), roughness: 0.1, metalness: 0.15, transparent: true, opacity: 0.85, depthWrite: false }));
        mesh.matrixAutoUpdate = false; mesh.matrix.copy(pl.mw); mesh.renderOrder = 2; areaFx.add(mesh);
      }
      if ((nodes.lamps || []).length) {
        const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(255,214,150,0.55)'); g.addColorStop(0.45, 'rgba(255,190,110,0.22)'); g.addColorStop(1, 'rgba(255,170,90,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
        const glowMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
        const glowGeo = new THREE.PlaneGeometry(9, 9).rotateX(-Math.PI / 2);
        for (const l of nodes.lamps) { const m2 = new THREE.Mesh(glowGeo, glowMat); m2.position.set(l.x, groundAt(l.x, l.z) + 0.05, l.z); areaFx.add(m2); }
      }
    }
    // props by model file, loaded once for the whole world; roofs kept apart (key prefixed) so a building's roof can
    // lift off when you walk in
    if (!propsBuilt) {
      propsBuilt = true;
      const byFile = new Map();
      for (const n of nodes) {
        const key = (n.roof ? 'R|' : '') + n.file;
        if (!byFile.has(key)) byFile.set(key, []); byFile.get(key).push(n);
        if (n.roof) { const b = roofBoxes.get(n.bldg) || { x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9, y0: 1e9, pts: [], name: (nodes.names && nodes.names.get(n.bldg)) || '', wy: 1e9, wx: 0, wz: 0 };
          if (/wall/i.test(n.file) && n.y < b.wy) { b.wy = n.y; b.wx = n.x; b.wz = n.z; } b.y0 = Math.min(b.y0, n.y); b.x0 = Math.min(b.x0, n.x); b.x1 = Math.max(b.x1, n.x); b.z0 = Math.min(b.z0, n.z); b.z1 = Math.max(b.z1, n.z); b.pts.push(n.x, n.z); roofBoxes.set(n.bldg, b); }
      }
      let done = 0; const files = [...byFile.keys()], toBatch = [];
      await Promise.all(files.map(async (key) => {
        const file = key.replace(/^R\|/, ''), isRoof = key.startsWith('R|');
        try {
          const gltf = await loadGLB(A('world/scene-models/' + file.split('/').map(encodeURIComponent).join('/')));
          gltf.scene.updateMatrixWorld(true);
          const list = byFile.get(key);
          gltf.scene.traverse((mesh) => {
            if (!mesh.isMesh || mesh.isSkinnedMesh) return;
            const mats = list.map((n) => new THREE.Matrix4().multiplyMatrices(n.mw, mesh.matrixWorld));
            if (TREES.test(file) || LEAFY.test(file) || LEAFY.test((mesh.material && mesh.material.name) || '')) solidLeaves(mesh.material);
            if (isRoof) { // the roof's real footprint, for landmarks that lift when you stand under them
              if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
              list.forEach((n, i) => { const b = roofBoxes.get(n.bldg); if (!b) return; const bb = mesh.geometry.boundingBox.clone().applyMatrix4(mats[i]); b.geo = b.geo ? b.geo.union(bb) : bb; });
            }
            const batchable = !isRoof && BATCH && !Array.isArray(mesh.material) && !mesh.geometry.morphAttributes.position && !Object.values(mesh.geometry.attributes).some((x) => x.isInterleavedBufferAttribute);
            if (batchable) { toBatch.push({ geometry: mesh.geometry, material: mesh.material, matrices: mats }); return; }
            for (const { im, idx } of chunkedInstances(mesh.geometry, mesh.material, mats, worldProps)) {
              if (isRoof) roofMeshes.push({ im, mats: idx.map((i) => mats[i]), bldgs: idx.map((i) => list[i].bldg), wall: /wall/i.test(file) }); // upper walls filed under a roof
            }
          });
        } catch (e) { /* a missing prop is not fatal */ }
        progress(0.45 * (++done / files.length));
      }));
      if (toBatch.length) { try { batchedProps(toBatch, worldProps); } catch (e) { console.warn('batching failed, drawing props one by one', e); for (const t of toBatch) chunkedInstances(t.geometry, t.material, t.matrices, worldProps); } }
      roofHidden.clear(); roofHidden.add(-1);
    }
    folCell = '';
    await placeEntities();
    return near.length;
  }
  const propCount = await loadMap(MAPS[0], (v) => onProgress('props', 0.15 + v));

  // ---- models --------------------------------------------------------------
  const protos = {};
  const types = Object.keys(ENEMIES).filter((t) => ENEMIES[t].model); let loaded = 0;
  await Promise.all(types.map(async (t) => {
    try { protos[t] = await prepare(A('models/' + ENEMIES[t].model), ENEMIES[t].h); } catch (e) { console.warn('model failed', t, e); }
    onProgress('monsters', 0.6 + 0.3 * (++loaded / types.length));
  }));
  let playerProto = null;
  try { playerProto = await prepare(A('models/mobs/sankson/sankson.glb'), 1.6); } catch (e) { console.warn('player model failed', e); }
  // the real SankoQuest character (modular body + armor) for the player and humanoid enemies
  let kit = null;
  try {
    const names = [];
    for (const t of ARMOR_TIERS) for (const [f, n] of [['Head', 'Helmet'], ['Chest', 'Chestplate'], ['Hands', 'Gauntlets'], ['Legs', 'Leggings'], ['Feet', 'Boots']]) names.push(`${f}/Clothing/${t} ${n}`);
    const F = { head: 'Head', chest: 'Chest', hands: 'Hands', legs: 'Legs', feet: 'Feet' };
    for (const d of Object.values(ENEMIES)) if (d.rig) for (const [k, f] of Object.entries(F)) if (d.rig[k]) names.push(`${f}/Clothing/${d.rig[k]}`);
    for (const a of Object.values(ADVENTURER_BY_ID)) for (const [k, f] of Object.entries(F)) if (a.look.armor[k]) names.push(`${f}/Clothing/${a.look.armor[k]}`);
    kit = await createCharacterKit(loadGLB, A, names);
  } catch (e) { console.warn('character kit failed, using fallback models', e); }
  // how each hand-held item is turned in the hand (radians, in the hand bone's frame); ?hr=x,y,z degrees overrides for testing
  const HS = new URLSearchParams(location.search).get('hs');
  const HELD_SCALE = { axe: 1.7, katana: 0.62 };
  function heldScale(id) { return HS ? Number(HS) : (HELD_SCALE[id] || 1); }
  // how SankoQuest itself attaches each held item to the hand bones (from its client): offset, scale, rotation
  const MAIN = { offset: [10, 8, 2], scale: [200, 200, 200], rotation: [-Math.PI / 2, 0, -Math.PI / 2] };
  const HELD_FIX = {
    katana: MAIN, axe: MAIN, pickaxe: MAIN, greatsword: MAIN, shortsword: MAIN,
    staff: { ...MAIN, offset: [10, 0, 2], rotation: [-Math.PI / 2, 0.5, -Math.PI / 2] },
    bow: { offset: [-4, 7, 1.5], scale: [200, 200, 200], rotation: [-Math.PI / 2, -0.5, Math.PI / 2] },
    shield: { offset: [0, 0, 0], scale: [200, 200, 200], rotation: [Math.PI, 0, Math.PI / 2] },
  };
  const SHADOWFANG = { offset: [35.490916, -15.761, -20.93451], scale: [70, 70, 70], rotation: [-0.028427, 0.553492, -2.374962] };
  const heldFix = (id, evo) => (id === 'katana' && evo ? SHADOWFANG : HELD_FIX[id]);
  // how each item sits in the hand, in the character's terms: tip / thin-axis directions as [forward, up, outward]
  const HELD_AIM = {
    katana:  { tip: [1, 0.6, 0], thin: [0, 0, 1] }, // point forward and up, edge down, like a ready stance
    greatsword: { tip: [0.8, 0.6, 0], thin: [0, 0, 1] },
    shortsword: { tip: [1, 0.2, 0], thin: [0, 0, 1] },
    axe:     { tip: [0.3, 1, 0], thin: [0, 0, 1] },
    pickaxe: { tip: [0.3, 1, 0], thin: [0, 0, 1] },
    staff:   { tip: [0, 1, 0], thin: [0, 0, 1], flip: true },
    bow:     { tip: [0, 1, 0], thin: [0, 0, 1] },
    shield:  { tip: [0, 1, 0], thin: [0, 0, 1] },
  };
  // make sure the models for worn gear are loaded before a character puts them on
  const GEAR_FOLDER = { head: 'Head', chest: 'Chest', hands: 'Hands', legs: 'Legs', feet: 'Feet', back: 'Back' };
  // (a shield is a held item: its model loads with the other hand-held items)
  const isClothing = (n) => Object.hasOwn(GEAR, n) && GEAR_FOLDER[GEAR[n].slot];
  async function preloadGear(names) { if (!kit) return; await Promise.all(names.filter(isClothing).map((n) => kit.load(`${GEAR_FOLDER[GEAR[n].slot]}/Clothing/${n}`))); }
  const itemProtos = {};
  async function item(url) { if (!itemProtos[url]) itemProtos[url] = loadGLB(A('models/' + url)).then((g) => ({ gltf: g })).catch(() => null); return itemProtos[url]; }
  onProgress('ready', 1);

  // ---- dynamic objects -------------------------------------------------------
  const actors = new Map();   // enemy id -> {root, mixer, hitT}
  const corpses = [];         // fallen monsters finishing their death
  const viewFrustum = new THREE.Frustum(), projScreen = new THREE.Matrix4(), cullSphere = new THREE.Sphere();
  const playerActors = new Map();
  let dmtAura = false; // the local player holds DMT
  const projObjs = new Map(); // proj id -> object
  // SankoQuest's own spell projectile (its client's "magic_sphere"): a bright octahedron head with six trailing pieces in
  // the element's colour, a soft diamond glow that always faces the camera, and a burst of seven pieces on impact.
  // Missile tier for the staff, the bigger Blast tier once it evolves. Sizes x MS_K to read at this game's camera.
  // SankoQuest's own eight combat spells, ported from its client (spawnProjectile, 2026-10-26 capture): the element
  // colours, the Missile and Blast tiers. The staff casts them in order as it levels (owner 3 Nov: "the earth air water
  // blast strike projectiles still arent the ones from sankoquest"): Air, Water, Earth, Fire Missile, then Air and Water
  // Blast; the evolved staff casts Fire Blast.
  const SPELL_ELEMENT = { air: 0x9fe8ff, water: 0x3b82f6, earth: 0x6db33f, fire: 0xff5a1f };
  const STAFF_SPELLS = [['air', 'missile'], ['water', 'missile'], ['earth', 'missile'], ['fire', 'missile'], ['air', 'blast'], ['water', 'blast']];
  const staffSpell = (lvl, evo) => { const [el, tier] = evo ? ['fire', 'blast'] : STAFF_SPELLS[Math.min(STAFF_SPELLS.length - 1, Math.max(0, lvl - 1))]; return { col: SPELL_ELEMENT[el], tier }; };
  // the game's tiers: impact 260 / 400 ms, burst spread 0.36 / 0.7, Blast 1.65x. Trail spacing is the game's 50 / 65 ms
  // scaled by flight speed (its spells fly about 4.5 u/s, the staff's bolts 14), so the tail is as long as the game's.
  const SPELL_TIER = { missile: { size: 1, trail: 16, impact: 260, spread: 0.36 }, blast: { size: 1.65, trail: 21, impact: 400, spread: 0.7 } };
  const MS_K = 1, msGeo = new THREE.OctahedronGeometry(1, 0), msGlowGeo = new THREE.PlaneGeometry(1, 1), MS_WHITE = new THREE.Color(0xfff4dc);
  const msMat = new THREE.MeshBasicMaterial({ toneMapped: false });
  // the game's pieces are lit from above: colour x (0.82 + 0.18 * normal.y)
  msMat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vNy;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvNy = normal.y;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vNy;').replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= 0.82 + 0.18 * vNy;');
  };
  const msGlowMats = new Map();
  function msGlowMat(col, tier) {
    const key = col + ':' + tier; if (msGlowMats.has(key)) return msGlowMats.get(key);
    const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
      uniforms: { uCol: { value: new THREE.Color(col) }, uBlast: { value: tier === 'blast' ? 1 : 0 }, uTime: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform vec3 uCol; uniform float uBlast, uTime; varying vec2 vUv;
        void main(){
          if (uBlast < 0.5) { vec2 r = abs(vUv - 0.5) * 2.0; gl_FragColor = vec4(uCol, pow(max(0.0, 1.0 - (r.x + r.y)), 2.0) * 0.45); return; } // Missile: a diamond
          float t = length(vUv - 0.5) * 2.0, a = pow(max(0.0, 1.0 - t), 2.0); // Blast: round, white-hot in the middle, with a ring that pulses
          float ring = max(0.0, 1.0 - abs(t - (sin(uTime * 6.0) * 0.035 + 0.58)) * 16.0);
          gl_FragColor = vec4(mix(uCol, vec3(1.0, 0.957, 0.863), pow(a, 3.0) * 0.55), a * 0.6 + ring * 0.3);
        }` });
    msGlowMats.set(key, m); return m;
  }
  function magicSphere(col, tier) {
    const o = new THREE.Group(), T = SPELL_TIER[tier];
    const parts = new THREE.InstancedMesh(msGeo, msMat, 7); parts.frustumCulled = false; parts.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const c = new THREE.Color(col), tmp = new THREE.Color();
    for (let i = 0; i < 7; i++) parts.setColorAt(i, tmp.copy(c).lerp(MS_WHITE, i === 0 ? 0.7 : 0.12)); // pale head, element-tinted trail (the game's mix)
    const glow = new THREE.Mesh(msGlowGeo, msGlowMat(col, tier)); glow.scale.setScalar(0.54 * T.size * MS_K);
    o.add(parts, glow);
    o.userData.ms = { parts, glow, T, trail: Array.from({ length: 8 }, () => ({ p: new THREE.Vector3(), at: -1 })), born: performance.now(), dir: new THREE.Vector3(0, 0, 1) };
    return o;
  }
  const lin = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace);
  const ARROW = (() => {
    const g = new THREE.Group(), side = THREE.DoubleSide;
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.022, 0.34), new THREE.MeshBasicMaterial({ color: lin(0.31, 0.16, 0.06) }));
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.105, 4).rotateX(Math.PI / 2).translate(0, 0, 0.21), new THREE.MeshBasicMaterial({ color: lin(0.55, 0.6, 0.63) }));
    const finGeo = new THREE.PlaneGeometry(0.048, 0.16).rotateX(Math.PI / 2).translate(0.024, 0, -0.145), finMat = new THREE.MeshBasicMaterial({ color: lin(0.76, 0.62, 0.33), side });
    g.add(shaft, head); for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(finGeo, finMat); f.rotation.z = k * Math.PI / 2; g.add(f); }
    return g;
  })();
  const msQ = new THREE.Quaternion(), msObj = new THREE.Object3D(), msWp = new THREE.Vector3(), msTv = new THREE.Vector3();
  function stepMagicSphere(o, now) {
    const d = o.userData.ms, T = d.T, t = now - d.born;
    o.getWorldPosition(msWp); o.getWorldQuaternion(msQ).invert();
    if (d.trail[0].at < 0) for (const e of d.trail) { e.p.copy(msWp); e.at = 0; } // the game starts every sample at the launch spot
    if (t - d.trail[0].at >= T.trail) { const e = d.trail.pop(); e.p.copy(msWp); e.at = t; d.trail.unshift(e); }
    d.glow.quaternion.copy(camera.quaternion);
    const sec = t / 1000;
    for (let i = 0; i < 7; i++) {
      const a = i / 6;
      msObj.position.set(0, 0, 0);
      if (i > 0) { // trailing pieces sit where the head was a moment ago, with a little wobble
        // where the head was i trail-steps ago, sliding between the two samples around that moment (the game's way)
        const want = Math.max(0, t - i * T.trail); let newer = msWp, newerAt = t;
        for (const e of d.trail) { if (e.at <= want) { msTv.copy(e.p).lerp(newer, newerAt === e.at ? 0 : (want - e.at) / (newerAt - e.at)); break; } newer = e.p; newerAt = e.at; msTv.copy(e.p); }
        msObj.position.copy(msTv).sub(msWp).applyQuaternion(msQ);
        msObj.position.x += Math.sin(13 * sec - 1.7 * i) * a * 0.055 * MS_K; msObj.position.y += Math.cos(11 * sec - 1.7 * i) * a * 0.055 * MS_K;
      }
      const sc = (i === 0 ? 0.1125 : 0.075 * (1 - 0.8 * a)) * T.size * MS_K; // the game's: head 0.1125, trail 0.065 down to 0.015
      msObj.scale.set(sc, sc, sc * (i === 0 ? 1.3 : 1.6));
      msObj.quaternion.identity(); msObj.rotateZ(4 * sec + i); msObj.updateMatrix(); d.parts.setMatrixAt(i, msObj.matrix);
    }
    d.parts.instanceMatrix.needsUpdate = true;
    d.glow.material.uniforms.uTime.value = now / 1000; // the ring's pulse runs on the clock, as the game's does
  }
  // the burst where a spell lands: seven pieces fly apart in a ring and shrink, the glow swells (blast) or fades (missile)
  const msBursts = [];
  function magicBurst(x, y, z, col, tier) {
    const T = SPELL_TIER[tier], o = magicSphere(col, tier); o.position.set(x, y, z); dyn.add(o);
    msBursts.push({ o, T, tier, born: performance.now() });
  }
  function stepMagicBursts(now) {
    for (let i = msBursts.length - 1; i >= 0; i--) {
      const b = msBursts[i], t = (now - b.born) / b.T.impact, d = b.o.userData.ms;
      if (t >= 1) { dyn.remove(b.o); msBursts.splice(i, 1); continue; }
      d.glow.quaternion.copy(camera.quaternion);
      d.glow.scale.setScalar((b.tier === 'blast' ? 1.35 * Math.sin(Math.PI * Math.sqrt(t)) : 0.82 * (1 - t)) * MS_K); d.glow.material.uniforms.uTime.value = now / 1000; // the game's impact
      for (let k = 0; k < 7; k++) {
        const ang = k * Math.PI * 2 / 7, r = b.T.spread * t * MS_K;
        msObj.position.set(Math.cos(ang) * r, Math.sin(2 * ang) * r * 0.65 - t * t * 0.15 * MS_K, Math.sin(ang) * r);
        msObj.scale.setScalar(0.0675 * b.T.size * (1 - t) * MS_K); msObj.quaternion.identity(); msObj.rotateZ(now / 250 + k); msObj.updateMatrix(); d.parts.setMatrixAt(k, msObj.matrix);
      }
      d.parts.instanceMatrix.needsUpdate = true;
    }
  }
  const shieldObjs = new Map(); // `${playerId}:${i}` -> object
  const dyn = new THREE.Group(); dyn.name = 'dyn'; scene.add(dyn);

  const fallbackGeo = new THREE.CapsuleGeometry(0.4, 0.8, 4, 8);
  const fallbackMat = new THREE.MeshLambertMaterial({ color: 0xcc5544 });
  // bare Mixamo rigs that need a fitted clip (see fitClip in character.js); Skelly walked with its arms locked straight
  // out and leaned over
  // Skelly (hips flipped 180), the Spiky Boatman and the Stars (hips turned -90 / -81): the clips' own rig otherwise
  const FROM_REST = new Map([['skeleton', 'hips'], ['boatman', 'hips'], ['star', 'hips'], ['starwiz', 'hips']]);
  // drawing-only turn fixes, kept here (not in content.js) so the ranked game version does not change for a look fix:
  // the Star Wizard's walk points its toes behind it, so it walked backwards (owner 3 Nov)
  const YAW_FIX = new Map([['starwiz', Math.PI]]);
  function makeEnemy(type) {
    const def = ENEMIES[type];
    if (def.rig && kit) {
      try {
        const armor = {}; for (const k of ['head', 'chest', 'hands', 'legs', 'feet']) if (def.rig[k]) armor[k] = def.rig[k];
        const inst = kit.build({ hair: def.rig.hair, armor, shirt: def.rig.shirt, h: def.h });
        inst.setMoving(true);
        return { root: inst.root, inner: inst.master, mixer: inst.mixer, kit: inst };
      } catch (e) { console.warn('rig enemy failed', type, e); }
    }
    const p = protos[type];
    if (p && def.mixamo && kit) { try { const inst = kit.animate(p.gltf, def.h, 'walk', { fromRest: FROM_REST.get(type) || false }); const fix = def.yawFix || YAW_FIX.get(type) || 0; if (fix && inst.kit) inst.kit.yaw0 += fix; return inst; } catch (e) { console.warn('mob anim failed', type, e); } }
    if (!p) { const m = new THREE.Mesh(fallbackGeo, fallbackMat); const g = new THREE.Group(); m.position.y = 0.8; g.add(m); return { root: g, inner: m, mixer: null }; }
    return instantiate(p, ENEMIES[type].walk);
  }

  // soft round shadows under monsters (cheap; the player and bosses get real ones)
  const blobTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const blobMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), 520);
  blobMesh.frustumCulled = false; blobMesh.count = 0; blobMesh.renderOrder = 1; scene.add(blobMesh);
  // experience drops are bones (owner 11/2: "enemies should drop bones when they die"): SankoQuest's own Bones item art,
  // always facing you, in three sizes by value
  const GEM_CAP = 600;
  const gemSets = [1.43, 1.98, 2.75].map((size) => { // owner 11/2: the shards on the ground were too small; 3 Nov: bones 10% bigger
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(GEM_CAP * 3), 3)); geo.setDrawRange(0, 0);
    const mat = new THREE.PointsMaterial({ size, map: null, transparent: true, alphaTest: 0.35, depthWrite: true, sizeAttenuation: true, color: new THREE.Color(1.05, 1.05, 1.05), toneMapped: false });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; fxOnly(pts); scene.add(pts); return pts;
  });
  const shardTex = new THREE.TextureLoader().load(A('ui/items/item_Bones.png'), (t) => { t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; for (const g of gemSets) { g.material.map = t; g.material.needsUpdate = true; } });
  const pickupSprites = new Map(); const iconCache = new Map();
  const PICKUP_ICON = { coin: 'Gold', crawdad: 'Cooked Crawdad', trout: 'Cooked Brown Trout', catfish: 'Cooked Catfish', bass: 'Cooked Bubba Bass', beer: 'Tin of Beer', pumpkin: 'Pumpkin', warp: 'Warp Shard', chest: 'Gold Bar' };
  const PICKUP_SIZE = { chest: 1.5, coin: 0.855, crawdad: 0.8, trout: 0.95, catfish: 1.0, bass: 1.1 };
  function iconTex(name) {
    if (!iconCache.has(name)) { const t = new THREE.TextureLoader().load(A(`ui/items/item_${name.replace(/ /g, '_')}.png`)); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; iconCache.set(name, t); } // no mipmaps: they blended the icons' black see-through pixels into a dark box
    return iconCache.get(name);
  }
  const dummy = new THREE.Object3D(); const gemColor = new THREE.Color();

  // particles: glowing shards for hits, deaths and pickups (additive, so bloom makes them shine)
  const PN = 700;
  const partMesh = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.1), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), PN);
  partMesh.setColorAt(0, new THREE.Color(1, 1, 1));
  partMesh.frustumCulled = false; fxOnly(partMesh); scene.add(partMesh);
  const parts = Array.from({ length: PN }, () => ({ life: 0, max: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, s: 1, g: 9, c: new THREE.Color() }));
  let partCursor = 0;
  function emit(x, y, z, n, speed, { s = 1, life = 0.6, up = 2.5, g = 9, color = 0xffffff, spread = 1 } = {}) {
    if (settings.fx === 'reduced') { n = Math.round(n * 0.4); if (n < 1) return; }
    for (let i = 0; i < n; i++) {
      const p = parts[partCursor = (partCursor + 1) % PN];
      const a = Math.random() * 6.283, v = speed * (0.35 + Math.random() * spread);
      p.max = p.life = life * (0.7 + Math.random() * 0.6); p.x = x; p.y = y; p.z = z;
      p.vx = Math.cos(a) * v; p.vz = Math.sin(a) * v; p.vy = up * (0.5 + Math.random()); p.s = s * (0.7 + Math.random() * 0.6); p.g = g;
      p.c.setHex(color).multiplyScalar(1.6);
    }
  }
  function pop(x, z, n, speed, big) { // a monster falls: a puff of pale shards and a few bright sparks
    const y = groundAt(x, z) + 0.6;
    emit(x, y, z, n, speed, { s: big ? 2.4 : 1.3, life: 0.55, color: 0xd9d2c0 });
    emit(x, y + 0.3, z, Math.ceil(n * 0.6), speed * 1.5, { s: big ? 1.4 : 0.7, life: 0.4, color: 0xffd36a, up: 4 });
  }
  function spark(x, z, crit) { emit(x, groundAt(x, z) + 1.0, z, crit ? 7 : 3, crit ? 6 : 4, { s: crit ? 0.9 : 0.55, life: 0.25, color: crit ? 0xffcf4a : 0xfff4dc, up: 2, g: 4 }); }

  // flat effects (slash arcs, quakes, bursts) glow and fade
  const ringMat = (c, add = true) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(add ? 1.4 : 1), transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending });
  // soft rings and glows (owner 3 Nov: the flat hard-edged rings looked like cut-out discs): a band that fades at both
  // edges, an optional faint fill, and optional arcs (a motion blur that sweeps round). uOp is its opacity.
  const softRing = (color, inner, outer, { fill = 0, opacity = 0.8, arcs = 0 } = {}) => {
    const R = outer * 1.2, mid = (inner + outer) / 2 / R, half = Math.max(0.02, (outer - inner) / 2 / R);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(color).multiplyScalar(1.3) }, uOp: { value: opacity } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform vec3 uColor; uniform float uOp; varying vec2 vUv;
        void main(){ vec2 p = vUv * 2.0 - 1.0; float r = length(p);
          float band = 1.0 - smoothstep(0.0, ${(half * 1.6).toFixed(4)}, abs(r - ${mid.toFixed(4)})); band *= band;
          float a = band + ${fill.toFixed(3)} * (1.0 - smoothstep(${(mid * 0.4).toFixed(4)}, ${mid.toFixed(4)}, r));
          ${arcs ? `a *= pow(fract((atan(p.y, p.x) / 6.2831853 + 0.5) * ${arcs.toFixed(1)}), 1.8);` : ''}
          a *= uOp * (1.0 - smoothstep(0.92, 1.0, r)); gl_FragColor = vec4(uColor * a, a); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    return fxOnly(new THREE.Mesh(new THREE.PlaneGeometry(R * 2, R * 2).rotateX(-Math.PI / 2), mat));
  };
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const glowSprite = (color, size, opacity = 0.6) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(color).multiplyScalar(1.3), transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending })); sp.scale.setScalar(size); return fxOnly(sp); };
  const effects = [];
  function addEffect(mesh, life, grow) { Object.assign(mesh.userData, { life, max: life, grow, base: mesh.scale.x }); fxOnly(mesh); dyn.add(mesh); effects.push(mesh); }
  // a sword swing: a crescent that sweeps across the arc, brightest at its leading edge and the blade's tip
  const slashMat = (color) => new THREE.ShaderMaterial({
    uniforms: { uProg: { value: 0 }, uColor: { value: new THREE.Color(color).multiplyScalar(1.6) }, uArc: { value: 1 }, uIn: { value: 0.25 } },
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uProg, uArc, uIn; uniform vec3 uColor; varying vec2 vP;
      void main(){
        float r = length(vP); float ang = atan(-vP.y, vP.x); // ring angle 0 is +X
        float t = (ang + uArc * 0.5) / uArc;            // 0..1 across the swing
        float lead = uProg * 1.25;                        // the sweep front
        float trail = smoothstep(lead - 0.55, lead, t) * (1.0 - smoothstep(lead, lead + 0.04, t));
        float radial = smoothstep(uIn, 1.0, r) * (1.0 - smoothstep(0.96, 1.0, r));
        float edge = smoothstep(0.86, 0.97, r) * (1.0 - smoothstep(0.97, 1.0, r));
        float a = (trail * radial * 0.75 + edge * trail * 1.2) * (1.0 - uProg * 0.6);
        gl_FragColor = vec4(uColor * (1.0 + edge), a);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  function slashFx(x, z, a, range, arcDeg, lvl) {
    const arc = Math.min(Math.PI * 2, arcDeg * Math.PI / 180);
    const g = new THREE.RingGeometry(0.25, 1, 40, 1, -arc / 2, arc).rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, slashMat(lvl >= 6 ? 0xc89bff : 0xfff0b8));
    m.material.uniforms.uArc.value = arc; m.scale.setScalar(range);
    m.position.set(x, groundAt(x, z) + 0.9, z);
    m.rotation.y = a - Math.PI / 2; // the ring's zero angle points along +X
    m.userData.shader = true; addEffect(m, 0.24, 0.06);
    emit(x + Math.sin(a) * range * 0.8, groundAt(x, z) + 1, z + Math.cos(a) * range * 0.8, 3, 2.5, { s: 0.5, life: 0.25, color: 0xfff4dc, up: 1, g: 2 });
  }
  // the ground cracks under a quake: dark radial cracks that fade, and a ring of dust
  const crackTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.strokeStyle = 'rgba(30,20,10,0.95)'; g.lineCap = 'round';
    for (let i = 0; i < 14; i++) { let x = 128, y = 128, a = (i / 14) * Math.PI * 2 + Math.random() * 0.4; g.lineWidth = 5; g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 9; k++) { a += (Math.random() - 0.5) * 0.7; const step = 9 + Math.random() * 6; x += Math.cos(a) * step; y += Math.sin(a) * step; g.lineWidth = Math.max(1, 5 - k * 0.5); g.lineTo(x, y); } g.stroke(); }
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 40); gr.addColorStop(0, 'rgba(30,20,10,0.6)'); gr.addColorStop(1, 'rgba(30,20,10,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c); })();
  function crackFx(x, z, r) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2.2, r * 2.2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: crackTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }));
    m.position.set(x, groundAt(x, z) + 0.06, z); m.rotation.y = Math.random() * 6.28; addEffect(m, 0.9, 0);
    for (let i = 0; i < 22; i++) { const ang = (i / 22) * 6.283; emit(x + Math.cos(ang) * r * 0.6, groundAt(x, z) + 0.3, z + Math.sin(ang) * r * 0.6, 1, 2.2, { s: 1.6, life: 0.7, color: 0x9c8466, up: 1.5, g: 1.5 }); }
  }
  // a painted splash on the ground instead of a flat ring: a broken wave front that races out and slows, a hot white flash
  // in the middle, a soft fill, sparkling flecks, and for blasts radial streaks (kind 1). Drawn in a shader, so no sprites.
  const splashMat = (color, kind) => new THREE.ShaderMaterial({
    uniforms: { uProg: { value: 0 }, uColor: { value: new THREE.Color(color).multiplyScalar(1.35) }, uKind: { value: kind }, uSeed: { value: Math.random() * 50 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uProg, uKind, uSeed; uniform vec3 uColor; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y); }
      void main(){
        vec2 p = vUv * 2.0 - 1.0; float r = length(p); float a = atan(p.y, p.x); float t = uProg;
        float front = mix(0.2, 0.97, 1.0 - pow(1.0 - t, 2.4));
        float rr = r + (n(vec2(a * 2.6 + 9.0, t * 1.5)) - 0.5) * 0.12;
        float rim = smoothstep(front - 0.18, front - 0.03, rr) * (1.0 - smoothstep(front - 0.03, front + 0.03, rr));
        float fill = (1.0 - smoothstep(0.0, front, rr)) * 0.28 * (1.0 - t);
        float spikes = pow(n(vec2(a * 6.5, 3.0)), 3.0) * 1.6;
        float streak = uKind > 0.5 ? spikes * smoothstep(front * 0.15, front * 0.75, rr) * (1.0 - smoothstep(front * 0.75, front + 0.02, rr)) : 0.0;
        float fleck = step(0.982, h(floor(p * 22.0) + floor(t * 7.0))) * (1.0 - smoothstep(front - 0.15, front, r));
        float core = (1.0 - smoothstep(0.0, 0.32, r)) * (1.0 - smoothstep(0.0, 0.3, t));
        float alpha = (rim * 1.15 + fill + streak * 0.7 + fleck * 0.7 + core * 1.1) * (1.0 - smoothstep(0.5, 1.0, t)) * step(r, 1.0);
        vec3 col = mix(uColor, vec3(1.0), clamp(core * 0.85 + rim * 0.3 * (1.0 - t), 0.0, 1.0));
        gl_FragColor = vec4(col * alpha, alpha);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  function ringFx(x, z, r, color, kind = 0, life = 0.45) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2.1, r * 2.1).rotateX(-Math.PI / 2), splashMat(color, kind));
    m.position.set(x, groundAt(x, z) + 0.14, z); m.userData.shader = true; addEffect(m, life, 0);
  }
  // a dark scorch left on the ground by slams, meteors and blasts, fading slower than the flash
  const scorchTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    for (let i = 0; i < 26; i++) { const a = Math.random() * 6.283, d = Math.random() * 34, x = 64 + Math.cos(a) * d, y = 64 + Math.sin(a) * d, rr = 14 + Math.random() * 22;
      const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(25,18,12,0.32)'); gr.addColorStop(1, 'rgba(25,18,12,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
    return new THREE.CanvasTexture(c); })();
  function scorchFx(x, z, r) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 1.9, r * 1.9).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: scorchTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.position.set(x, groundAt(x, z) + 0.05, z); m.rotation.y = Math.random() * 6.28; addEffect(m, 1.4, 0);
  }
  const SHARD_COLORS = [0xb8e4ff, 0x4aa8ff, 0x7bd04f, 0xff7a30, 0xffe066, 0xb25cff]; // Air, Water, Earth, Fire, Spirit, Void
  // a soft streak that fades toward its tail (for bolts and arrows)
  const streakTex = (() => { const c = document.createElement('canvas'); c.width = 8; c.height = 64; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,1)'); g.fillStyle = gr; g.fillRect(0, 0, 8, 64); return new THREE.CanvasTexture(c); })();
  const streakMat = (c, op = 0.7) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(1.5), map: streakTex, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  // a charge's telegraph: a red lane in front of the boss
  function aimFx(x, z, a, len, t) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.2, len).rotateX(-Math.PI / 2).translate(0, 0, len / 2), ringMat(0xff3b2f, false));
    m.material.opacity = 0.45; m.position.set(x, groundAt(x, z) + 0.1, z); m.rotation.y = a; addEffect(m, t + 0.3, 0);
  }
  // boss attack warnings on the ground: a glowing rim with marching dashes, warning stripes over the ground still to be
  // covered, and a bright wave that sweeps out from the middle as the attack charges, heating to white just before it lands
  const hazardMat = () => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    uniforms: { uProg: { value: 0 }, uTime: { value: 0 }, uCol: { value: new THREE.Color(0xff3b2f) } },
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uProg, uTime; uniform vec3 uCol; varying vec2 vP;
      void main(){
        float r = length(vP); if (r > 1.0) discard;
        float ang = atan(vP.y, vP.x);
        vec3 hot = mix(uCol, vec3(1.0, 0.62, 0.22), smoothstep(0.72, 1.0, uProg) * 0.85); // red, heating to a hot orange just before the hit
        float rim = smoothstep(0.88, 0.97, r) * (1.0 - smoothstep(0.985, 1.0, r));
        float dash = step(0.45, fract(ang * 24.0 / 6.2832 - uTime * 0.8));
        float rimA = rim * (0.55 + 0.45 * dash) * (0.85 + 0.15 * sin(uTime * 14.0));
        float inner = smoothstep(0.62, 0.64, r) * (1.0 - smoothstep(0.645, 0.665, r)) * 0.35;
        float filled = 1.0 - smoothstep(uProg - 0.015, uProg, r);
        float front = exp(-abs(r - uProg) * 34.0) * step(r, 1.0) * (uProg < 0.995 ? 1.0 : 0.0);
        float stripes = step(0.5, fract((vP.x + vP.y) * 3.2 - uTime * 1.6)) * (1.0 - filled) * 0.10;
        float body = filled * (0.14 + 0.16 * uProg);
        float a = clamp(rimA + inner + body + front * 0.75 + stripes, 0.0, 1.0);
        gl_FragColor = vec4(hot * (0.9 + front * 0.45 + rim * 0.25), a);
      }`,
  });
  const hazardPool = Array.from({ length: 16 }, () => {
    const g = new THREE.Group(); g.visible = false;
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 64).rotateX(-Math.PI / 2), hazardMat());
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff6a20).multiplyScalar(1.8), toneMapped: false })); rock.visible = false;
    g.add(disc, rock); g.userData = { disc, rock }; scene.add(g); return g;
  });
  const eprojObjs = new Map();
  // a column of light where you level up
  function levelFx(x, z) {
    const y = groundAt(x, z);
    // a slim beam that fades out toward the top, so it marks the moment without hiding the fight
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.7, 5.5, 20, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff2a8).multiplyScalar(0.95), map: streakTex, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    col.position.set(x, y + 2.75, z); addEffect(col, 0.7, 0.15);
    ringFx(x, z, 3.2, 0xfff2a8);
    emit(x, y + 0.5, z, 26, 3, { s: 0.8, life: 1.1, color: 0xfff2a8, up: 7, g: 2 });
  }

  // damage numbers (DOM)
  const fxLayer = document.getElementById('fx');
  const numbers = [];
  function number(x, z, v, crit, color) {
    if (settings.numbers === false) return;
    if (numbers.length > 60) return;
    const el = document.createElement('div'); el.className = 'dn' + (crit ? ' crit' : ''); el.textContent = v; if (color) el.style.color = color;
    fxLayer.appendChild(el); numbers.push({ el, x, y: groundAt(x, z) + 2, z, life: 0.7 });
  }
  const tmpV = new THREE.Vector3();

  // ---- camera ------------------------------------------------------------------
  const cam = { x: MAPS[0].cx, z: MAPS[0].cz, shake: 0, flash: 0, zoom: 1, zoomT: 1, shift: 0, yaw: 0, pitch: Math.atan2(21, 17), rot: 0 };
  // middle mouse drag turns the camera (and tilts it); Q/E turn it too; Home resets
  let drag = null; const rotKeys = { q: false, e: false };
  window.addEventListener('mousedown', (e) => { if (e.button === 1) { drag = { x: e.clientX, y: e.clientY }; e.preventDefault(); } });
  window.addEventListener('mouseup', (e) => { if (e.button === 1) drag = null; });
  window.addEventListener('mousemove', (e) => { if (!drag) return; cam.yaw -= (e.clientX - drag.x) * 0.006; cam.pitch = Math.max(0.5, Math.min(1.35, cam.pitch + (e.clientY - drag.y) * 0.004)); drag = { x: e.clientX, y: e.clientY }; });
  window.addEventListener('auxclick', (e) => { if (e.button === 1) e.preventDefault(); });
  window.addEventListener('keydown', (e) => { const k = e.key.toLowerCase(); if (k === 'q' || k === 'e') rotKeys[k] = true; if (k === 'home') { cam.yaw = 0; cam.pitch = Math.atan2(21, 17); } });
  window.addEventListener('keyup', (e) => { const k = e.key.toLowerCase(); if (k === 'q' || k === 'e') rotKeys[k] = false; });
  window.addEventListener('wheel', (e) => { if (e.target === canvas || e.target === document.body || e.target.id === 'fx' || e.target.id === 'hud') { cam.zoomT = Math.max(0.5, Math.min(2.2, cam.zoomT * Math.exp(e.deltaY * 0.0012))); e.preventDefault(); } }, { passive: false });
  window.addEventListener('keydown', (e) => { if (e.key === '+' || e.key === '=') cam.zoomT = Math.max(0.5, cam.zoomT / 1.15); if (e.key === '-' || e.key === '_') cam.zoomT = Math.min(2.2, cam.zoomT * 1.15); });
  // two-finger pinch zooms on touch screens
  const pinch = { d: 0 };
  const touchDist = (e) => Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
  // a pinch is two fingers landing together: a thumb already on the move stick plus a tap is NOT a pinch (on phones it
  // made the zoom jump every time the steering thumb moved)
  window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) pinch.t0 = performance.now();
    if (e.touches.length === 2) pinch.d = performance.now() - (pinch.t0 || 0) < 350 ? touchDist(e) : 0;
    if (e.touches.length > 2) pinch.d = 0;
  }, { passive: true });
  window.addEventListener('touchmove', (e) => { if (e.touches.length === 2 && pinch.d) { const d = touchDist(e); cam.zoomT = Math.max(0.5, Math.min(2.2, cam.zoomT * (pinch.d / d))); pinch.d = d; } }, { passive: true });
  window.addEventListener('touchend', (e) => { if (e.touches.length < 2) pinch.d = 0; }, { passive: true });
  let composer = null; // post effects (bloom, depth of field), built once the scene is ready
  let fxaa = null; // the anti-aliasing pass, made with the other effects below
  function resize() {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    if (composer) { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); }
    if (fxaa) { const pr = renderer.getPixelRatio(); fxaa.material.uniforms.resolution.value.set(1 / (w * pr), 1 / (h * pr)); }
  }
  window.addEventListener('resize', resize); resize();

  // ---- settings: effects you can switch on and off ----------------------------------------------------------------
  const settings = { shadows: !low, bloom: !low, dof: false, ao: false, grade: true, rain: false, foliage: true, roofs: 'off', quality: low ? 'low' : 'auto', shake: true, time: 'day',
    res: 'auto', fps: 'max', aa: false, shadowq: 'auto', view: 'normal', water: true, fx: 'full', numbers: true };
  const VIEW = { near: 0.85, normal: 1.25, far: 1.7, max: 2.2 }; // draw distance: fog, camera range and small props
  // time of day: the map's own sky by day; a low orange sun at dusk; moonlight and a torch at night
  const torch = new THREE.PointLight(0xffb060, 0, 16, 1.6); scene.add(torch);
  function applyTime() {
    const m = (curMap.world && skyMap) || curMap, t = settings.time, sky = new THREE.Color(m.sky);
    if (m.under) { // underground: no sun or sky, lamplight and the torch you carry
      sun.color.set(0xffd9a8); sun.intensity = 0.9 * m.light; hemi.color.set(0xffe2b8); hemi.groundColor.set(0x2a2218); hemi.intensity = 1.2 * m.light; SUN_OFF.set(-22, 40, 14); torch.intensity = 30;
    } else if (t === 'dusk') {
      sky.lerp(new THREE.Color(0xe08a6a), 0.65); sun.color.set(0xffa860); sun.intensity = 1.9 * m.light; hemi.color.set(0xffc8a0); hemi.groundColor.set(0x4a3a50); hemi.intensity = 1.1 * m.light; SUN_OFF.set(-38, 22, 10); torch.intensity = 0;
    } else if (t === 'night') {
      sky.set(0x0d1626); sun.color.set(0x9fb8ff); sun.intensity = 0.55; hemi.color.set(0x5068a8); hemi.groundColor.set(0x141420); hemi.intensity = 0.55; SUN_OFF.set(-22, 40, 14); torch.intensity = 26;
    } else {
      sun.color.set(0xffe9c4); sun.intensity = 2.6 * m.light; hemi.color.set(0xfff6e6); hemi.groundColor.set(0x5d6f4a); hemi.intensity = 1.55 * m.light; SUN_OFF.set(-22, 40, 14); torch.intensity = 0;
    }
    scene.background.copy(sky); scene.fog.color.copy(sky);
    if (waterMat.userData.sh) waterMat.userData.sh.uniforms.uNight.value = t === 'night' ? 1 : t === 'dusk' ? 0.35 : 0;
  }
  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera); composer.addPass(renderPass);
  // soft contact shadows where things meet (ambient occlusion)
  const gtao = new GTAOPass(scene, camera, 256, 256); gtao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.6, thickness: 1, scale: 1 }); gtao.blendIntensity = 0.85; gtao.enabled = false; composer.addPass(gtao);
  const bokeh = new BokehPass(scene, camera, { focus: 30, aperture: 0.0005, maxblur: 0.004 }); composer.addPass(bokeh);
  for (const pass of [gtao, bokeh]) { const render = pass.render.bind(pass); pass.render = (...a) => { camera.layers.disable(FX_LAYER); try { render(...a); } finally { camera.layers.enable(FX_LAYER); } }; }
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.32, 0.42, 0.86); composer.addPass(bloom);
  composer.addPass(new OutputPass());
  // colour grade after tone mapping: a touch more contrast and warmth, a soft vignette, and a red pulse when you are hurt
  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uVig: { value: 0.32 }, uHurt: { value: 0 }, uLow: { value: 0 }, uTime: { value: 0 }, uFlash: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uVig, uHurt, uLow, uTime, uFlash; varying vec2 vUv;
      void main(){
        vec3 c = texture2D(tDiffuse, vUv).rgb;
        c = mix(vec3(dot(c, vec3(0.299, 0.587, 0.114))), c, 1.08);         // a little more colour
        c = (c - 0.5) * 1.06 + 0.5;                                          // a little more contrast
        c *= vec3(1.02, 1.0, 0.97);                                          // a little warmer
        float d = distance(vUv, vec2(0.5)); float v = smoothstep(0.85, 0.25, d);
        c *= mix(1.0 - uVig, 1.0, v);
        float edge = smoothstep(0.35, 0.8, d);
        float pulse = uLow * (0.55 + 0.45 * sin(uTime * 6.0));
        c = mix(c, vec3(0.75, 0.05, 0.03), clamp(edge * (uHurt * 0.7 + pulse * 0.7), 0.0, 0.85));
        c = mix(c, vec3(1.0), uFlash);
        gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
      }`,
  });
  composer.addPass(grade);
  fxaa = new ShaderPass(FXAAShader); fxaa.enabled = false; composer.addPass(fxaa); resize();
  const PR = { low: 0.6, medium: 1, high: Math.min(window.devicePixelRatio || 1, 2), auto: Math.min(window.devicePixelRatio || 1, 1.25) };
  // Auto quality: the resolution drops a step when frames run slow and climbs back when there is room
  let autoPR = PR.auto, fpsAcc = 0, fpsN = 0, fpsT = 0;
  function autoQuality(dt) {
    if (settings.quality !== 'auto' || settings.res !== 'auto') return;
    fpsAcc += dt; fpsN++; fpsT += dt;
    if (fpsT < 2) return;
    const fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; fpsT = 0;
    let next = autoPR;
    if (fps < 42) next = Math.max(0.5, autoPR - 0.15); else if (fps > 57) next = Math.min(PR.auto, autoPR + 0.1);
    if (Math.abs(next - autoPR) > 0.01) { autoPR = next; renderer.setPixelRatio(autoPR); resize(); }
  }
  function applySettings(next = {}) {
    Object.assign(settings, next); settingsReady = true;
    renderer.setPixelRatio(settings.res !== 'auto' ? Math.min(window.devicePixelRatio || 1, 2) * Number(settings.res) : settings.quality === 'auto' ? autoPR : PR[settings.quality] || 1);
    sun.castShadow = !!settings.shadows && renderer.shadowMap.enabled !== false;
    if (settings.shadows && !renderer.shadowMap.enabled) { renderer.shadowMap.enabled = true; scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => { m.needsUpdate = true; }); }); }
    const SM = { low: 1024, medium: 2048, high: 4096 }[settings.shadowq] || (settings.quality === 'high' ? 2048 : settings.quality === 'low' ? 1024 : 1536);
    if (sun.castShadow && sun.shadow.mapSize.x !== SM) { if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } sun.shadow.mapSize.set(SM, SM); Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 34, bottom: -34, near: 1, far: 120 }); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.05; }
    bloom.enabled = !!settings.bloom; bokeh.enabled = !!settings.dof; gtao.enabled = !!settings.ao; grade.enabled = settings.grade !== false;
    for (const ms of Object.values(folMeshes)) for (const m of ms) m.im.visible = !!settings.foliage;
    roofsOff = settings.roofs === 'off'; roofHidden.clear(); roofHidden.add(-1);
    rainGroup.visible = rainOn();
    // water reflections: the sun's glints on the water and the sky in the puddles
    waterMat.specular.set(settings.water ? 0xb8e4ff : 0x000000); waterMat.shininess = settings.water ? 110 : 2; groundMat.envMapIntensity = settings.water ? 0.6 : 0;
    fxaa.enabled = !!settings.aa;
    SMALL_DIST = 34 * (VIEW[settings.view] || 1); folCell = '';
    applyTime();
    resize();
  }
  // rain: streaks falling around the view, rings on the water, wet ground and puddles
  const RAIN_N = 1600, rainPos = new Float32Array(RAIN_N * 6), rainVel = new Float32Array(RAIN_N);
  const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rainGroup = new THREE.Group(); rainGroup.visible = false; scene.add(rainGroup);
  const rainLines = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xc8dcf0, transparent: true, opacity: 0.45, depthWrite: false }));
  rainLines.frustumCulled = false; rainGroup.add(rainLines);
  const splashGeo = new THREE.RingGeometry(0.05, 0.12, 10).rotateX(-Math.PI / 2);
  const splashes = new THREE.InstancedMesh(splashGeo, new THREE.MeshBasicMaterial({ color: 0xd8e8f4, transparent: true, opacity: 0.5, depthWrite: false }), 90);
  splashes.frustumCulled = false; rainGroup.add(splashes);
  const splashLife = new Float32Array(90), splashXZ = new Float32Array(180);
  let wet = 0;
  const rainOn = () => !!settings.rain && !(curMap && curMap.under); // never rains underground
  function rainStep(dt) {
    const target = rainOn() ? 1 : 0; wet += (target - wet) * Math.min(1, dt * 0.6);
    if (groundMat.userData.sh) groundMat.userData.sh.uniforms.uWet.value = wet;
    if (waterMat.userData.sh) waterMat.userData.sh.uniforms.uRain.value = wet;
    scene.fog.near = Math.max(18, scene.fog.near * (1 - wet * 0.35));
    if (!rainOn()) return;
    const cx = cam.x, cz = cam.z, gy = groundAt(cx, cz);
    for (let i = 0; i < RAIN_N; i++) {
      const o = i * 6;
      if (rainVel[i] === 0 || rainPos[o + 1] < gy - 2) {
        const x = cx + (Math.random() - 0.5) * 70, z = cz + (Math.random() - 0.5) * 70, y = gy + 8 + Math.random() * 26;
        rainPos[o] = x; rainPos[o + 1] = y; rainPos[o + 2] = z; rainVel[i] = 26 + Math.random() * 8;
      }
      rainPos[o + 1] -= rainVel[i] * dt; rainPos[o] -= 1.5 * dt;
      rainPos[o + 3] = rainPos[o] + 0.18; rainPos[o + 4] = rainPos[o + 1] + 0.9; rainPos[o + 5] = rainPos[o + 2];
    }
    rainGeo.attributes.position.needsUpdate = true;
    for (let i = 0; i < 90; i++) {
      splashLife[i] -= dt * 2.2;
      if (splashLife[i] <= 0) { splashLife[i] = 0.6 + Math.random() * 0.4; splashXZ[i * 2] = cx + (Math.random() - 0.5) * 36; splashXZ[i * 2 + 1] = cz + (Math.random() - 0.5) * 36; }
      const x = splashXZ[i * 2], z = splashXZ[i * 2 + 1], s = 0.4 + (1 - splashLife[i]) * 2.2;
      dummy.position.set(x, Math.max(groundAt(x, z), WATER_Y) + 0.04, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(s, 1, s); dummy.updateMatrix(); splashes.setMatrixAt(i, dummy.matrix);
    }
    splashes.instanceMatrix.needsUpdate = true;
  }

  // ---- ambient life: leaves in Greentown, dust in the desert, snow at Payasan Village, fireflies in the swamp and at night ---
  let weatherNow = null, blizzardK = 0, stormKind = null; const fogBase = new THREE.Color(), SAND_HAZE = new THREE.Color(0xd8b07a), SNOW_HAZE = new THREE.Color(0xe8eef4); // a map event's weather (Payasan's blizzard)
  const AMB_N = 420, ambPos = new Float32Array(AMB_N * 3), ambSeed = new Float32Array(AMB_N);
  for (let i = 0; i < AMB_N; i++) { ambSeed[i] = Math.random() * 100; ambPos[i * 3] = (Math.random() - 0.5) * 64; ambPos[i * 3 + 1] = Math.random() * 14; ambPos[i * 3 + 2] = (Math.random() - 0.5) * 64; }
  const ambGeo = new THREE.BufferGeometry(); ambGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(AMB_N * 3), 3));
  const dotTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'); const gr = g.createRadialGradient(16, 16, 0, 16, 16, 15); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })();
  const ambMat = new THREE.PointsMaterial({ size: 0.35, map: dotTex, transparent: true, depthWrite: false, color: 0xffffff, sizeAttenuation: true });
  const amb = new THREE.Points(ambGeo, ambMat); amb.frustumCulled = false; fxOnly(amb); scene.add(amb);
  const AMB = { leaves: { color: 0xc8b04a, size: 0.32, fall: 0.6, sway: 1.2, glow: false }, dust: { color: 0xf0d8a0, size: 0.18, fall: -0.05, sway: 1.8, glow: false },
    snow: { color: 0xffffff, size: 0.3, fall: 1.4, sway: 0.6, glow: false }, blizzard: { color: 0xffffff, size: 0.42, fall: 4.2, sway: 3.2, glow: false }, sandstorm: { color: 0xe0b878, size: 0.3, fall: 0.6, sway: 4.5, glow: false }, fireflies: { color: 0xd8ff7a, size: 0.42, fall: 0, sway: 0.8, glow: true } };
  const AMB_BY_MAP = { greentown: 'leaves', tutorial: 'leaves', apache: 'dust', duel: 'dust', paya: 'snow', swamp: 'fireflies', graves: 'fireflies', goblins: 'leaves', world: 'leaves' };
  function ambientStep(dt) {
    const kind = weatherNow ? weatherNow : settings.time === 'night' ? 'fireflies' : AMB_BY_MAP[curMap.id] || 'leaves', a = AMB[kind];
    if (amb.userData.kind !== kind) { amb.userData.kind = kind; ambMat.color.set(a.color); if (a.glow) ambMat.color.multiplyScalar(2); ambMat.size = a.size; ambMat.blending = a.glow ? THREE.AdditiveBlending : THREE.NormalBlending; ambMat.toneMapped = !a.glow; ambMat.needsUpdate = true; }
    amb.visible = (settings.foliage !== false && !rainOn()) || !!weatherNow;
    if (!amb.visible) return;
    const out = ambGeo.attributes.position.array, cx = cam.x, cz = cam.z, gy = groundAt(cx, cz);
    for (let i = 0; i < AMB_N; i++) {
      const o = i * 3, sd = ambSeed[i];
      ambPos[o + 1] -= a.fall * dt * (0.6 + (sd % 1));
      if (ambPos[o + 1] < 0) ambPos[o + 1] += 14; if (ambPos[o + 1] > 14) ambPos[o + 1] -= 14;
      let x = ambPos[o] + Math.sin(time * 0.7 + sd) * a.sway, z = ambPos[o + 2] + Math.cos(time * 0.5 + sd * 1.3) * a.sway;
      // wrap the field around the camera so it never runs out
      x = ((x - cx) % 64 + 96) % 64 - 32 + cx; z = ((z - cz) % 64 + 96) % 64 - 32 + cz;
      out[o] = x; out[o + 1] = (a.glow ? groundAt(x, z) + 0.6 + (ambPos[o + 1] % 3) + Math.sin(time * 2 + sd) * 0.3 : gy + ambPos[o + 1]); out[o + 2] = z;
    }
    ambGeo.attributes.position.needsUpdate = true;
    if (a.glow) ambMat.opacity = 0.65 + 0.35 * Math.sin(time * 3);
    else ambMat.opacity = 0.85;
  }

  // ---- per-frame update -----------------------------------------------------------
  let time = 0, frameN = 0;
  function update(view, dt, localId) {
    if (curMap.world && view.region && (!skyMap || skyMap.id !== view.region)) { skyMap = MAPS.find((mm) => mm.id === view.region) || null; if (settingsReady) applyTime(); }
    time += dt; if (waterMat.userData.sh) waterMat.userData.sh.uniforms.uTime.value = time;
    const me = view.players.find((p) => p.id === localId) || view.players[0];
    if (me) { cam.x += (me.x - cam.x) * Math.min(1, dt * 10); cam.z += (me.z - cam.z) * Math.min(1, dt * 10); }

    // effects from sim
    for (const f of view.fx) {
      if (f.k === 'dmg') { number(f.x, f.z, f.v, f.c, f.c ? '#ffd34d' : '#ffffff'); spark(f.x, f.z, f.c); }
      else if (f.k === 'hurt') { number(f.x, f.z, '-' + f.v, 0, '#ff5a4d'); cam.shake = 0.35; cam.flash = 0.3; }
      else if (f.k === 'die' && f.boss) { pop(f.x, f.z, 70, 9, true); ringFx(f.x, f.z, 10, 0xfff2a8, 1, 0.6); ringFx(f.x, f.z, 16, 0xff9a3c, 0, 0.8); scorchFx(f.x, f.z, 9); emit(f.x, groundAt(f.x, f.z) + 2, f.z, 50, 8, { s: 1.6, life: 1.2, color: 0xffd36a, up: 9, g: 5 }); cam.white = 0.55; cam.shake = 0.9; }
      else if (f.k === 'die') { pop(f.x, f.z, f.boss ? 40 : f.elite ? 24 : 6, f.boss ? 7 : f.elite ? 5 : 3.5, f.boss || f.elite); if (f.elite) { ringFx(f.x, f.z, 3, 0xffd34d); emit(f.x, groundAt(f.x, f.z) + 1, f.z, 30, 5, { s: 1, life: 0.9, color: 0xffd34d, up: 6 }); } }
      else if (f.k === 'slash') { slashFx(f.x, f.z, f.a, f.range, f.arc, f.lvl); const pa = playerActors.get(localId); if (pa && !(pa.swingT > 0.25)) { pa.swingA = f.a; pa.swingT = 0.3; } if (pa && pa.kit && pa.kit.play) pa.kit.play('slash'); }
      else if (f.k === 'revive') { ringFx(f.x, f.z, 5, 0x8bffd0); emit(f.x, groundAt(f.x, f.z) + 1, f.z, 45, 5, { s: 1.1, life: 1.2, color: 0x8bffd0, up: 8 }); }
      else if (f.k === 'treasure') { ringFx(f.x, f.z, 5, 0xffd34d); emit(f.x, groundAt(f.x, f.z) + 1, f.z, 60, 7, { s: 1.1, life: 1.1, color: 0xffd34d, up: 8 }); cam.shake = Math.max(cam.shake, 0.3); }
      else if (f.k === 'surface') { ringFx(f.x, f.z, 1.4, 0x9fd8e8); emit(f.x, Math.max(groundAt(f.x, f.z), WATER_Y) + 0.2, f.z, 16, 2.2, { s: 1.1, life: 0.8, color: 0xcfeef8, up: 4 }); }
      else if (f.k === 'bounce') { ringFx(f.x, f.z, 0.9, f.evo ? 0xffd34d : 0xfff6dc); emit(f.x, groundAt(f.x, f.z) + 1, f.z, 5, 2.5, { s: 0.6, life: 0.3, color: 0xfff6dc, up: 1.5 }); }
      else if (f.k === 'rise') { crackFx(f.x, f.z, 1.1); emit(f.x, groundAt(f.x, f.z) + 0.3, f.z, 14, 2, { s: 1.3, life: 0.9, color: 0x8f7a5c, up: 3 }); }
      else if (f.k === 'escape') emit(f.x, groundAt(f.x, f.z) + 1, f.z, 30, 3, { s: 1.2, life: 0.8, color: 0xd9d2c0, up: 3 });
      else if (f.k === 'use') { ringFx(f.x, f.z, f.kind === 'pumpkin' ? 20 : 3, f.kind === 'pumpkin' ? 0xff9a3c : f.kind === 'warp' ? 0xb25cff : 0xffd34d); emit(f.x, groundAt(f.x, f.z) + 1, f.z, 16, 3, { s: 0.8, life: 0.6, color: f.kind === 'warp' ? 0xb25cff : 0xffd34d, up: 4 }); }
      else if (f.k === 'spin') { slashFx(f.x, f.z, 0, f.range, 360, f.evo ? 6 : f.lvl); ringFx(f.x, f.z, f.range, f.evo ? 0xff5a4a : 0xfff0b8); const pa = playerActors.get(localId); if (pa && pa.kit && pa.kit.play) pa.kit.play('slash'); }
      else if (f.k === 'slam') { ringFx(f.x, f.z, f.r, f.meteor ? 0xff9a3c : 0xff6a3a, 1, 0.5); ringFx(f.x, f.z, f.r * 0.6, 0xffc06a, 0, 0.35); scorchFx(f.x, f.z, f.r); emit(f.x, groundAt(f.x, f.z) + 0.3, f.z, 40, 7, { s: 1.4, life: 0.7, color: 0xb8a58a, up: 3 }); cam.shake = Math.max(cam.shake, 0.45); }
      else if (f.k === 'aim') aimFx(f.x, f.z, f.a, f.len, f.t);
      else if (f.k === 'volley') emit(f.x, groundAt(f.x, f.z) + 2, f.z, 14, 4, { s: 1, life: 0.4, color: f.art === 'ice' ? 0x9fe6ff : 0xff8a3a, up: 2 });
      else if (f.k === 'quake') { ringFx(f.x, f.z, f.r, 0xd9b36a); crackFx(f.x, f.z, f.r); cam.shake = Math.max(cam.shake, 0.18); }
      else if (f.k === 'burst') { const c = f.evo ? 0xb25cff : 0x8fd8ff; ringFx(f.x, f.z, f.r, c, 1); emit(f.x, groundAt(f.x, f.z) + 1, f.z, 12, 4, { s: 0.8, life: 0.4, color: c, up: 2.5, g: 3 }); }
      else if (f.k === 'boss') cam.shake = 0.5;
      else if (f.k === 'nuke') { ringFx(f.x, f.z, f.r, 0xff9a3c, 1, 0.7); ringFx(f.x, f.z, f.r * 0.55, 0xfff2a8, 0, 0.45); scorchFx(f.x, f.z, f.r * 0.8); cam.shake = 0.4; }
      else if (f.k === 'evolve') { cam.shake = 0.3; if (me) levelFx(me.x, me.z); }
      else if (f.k === 'level') { if (me) levelFx(me.x, me.z); }
      else if (f.k === 'get') emit(f.x, groundAt(f.x, f.z) + 0.8, f.z, f.kind === 'casket' || f.kind === 'chest' ? 24 : 8, 2.5, { s: 0.6, life: 0.6, color: f.kind === 'coin' ? 0xffd34d : 0xbfe8ff, up: 4, g: 3 });
    }

    // players
    const seenP = new Set();
    for (const p of view.players) {
      seenP.add(p.id);
      let a = playerActors.get(p.id);
      if (a && a.adv !== p.adv) { dyn.remove(a.root); playerActors.delete(p.id); a = null; } // picked someone else on the title screen
      if (!a) {
        let inst = null;
        if (kit) { try { const look = (ADVENTURER_BY_ID[p.adv] || ADVENTURER_BY_ID.adventurer).look; const k = kit.build({ ...look, h: 1.6 }); /* SankoQuest's people stand ~1.6 (skeletons, the same size, measure 1.51 in the live game) */ inst = { root: k.root, inner: k.master, mixer: k.mixer, kit: k, armorLvl: 0, baseArmor: look.armor || {} }; } catch (e) { console.warn('player rig failed', e); } }
        if (!inst) inst = playerProto ? instantiate(playerProto) : makeEnemy('goblin');
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.75, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: SLOT_COLORS[p.slot % 4], side: THREE.DoubleSide }));
        ring.position.y = 0.05; inst.root.add(ring);
        inst.root.traverse((o) => { if (o.isMesh && o !== ring) o.castShadow = true; });
        inst.adv = p.adv; dyn.add(inst.root); a = inst; playerActors.set(p.id, a);
      }
      if (a.px === undefined) { a.px = p.x; a.pz = p.z; }
      if ((p.x - a.px) ** 2 + (p.z - a.pz) ** 2 > 9) { a.px = p.x; a.pz = p.z; } // a teleport (Warp Shard) snaps, never slides
      a.px += (p.x - a.px) * Math.min(1, dt * 24); a.pz += (p.z - a.pz) * Math.min(1, dt * 24);
      a.root.visible = !!p.al;
      a.root.position.set(a.px, groundAt(a.px, a.pz), a.pz);
      // turn smoothly instead of snapping, and hold the swing's direction for a moment so a strike reads as a strike
      // (the run direction and the swing direction alternate every frame otherwise)
      if (a.yaw === undefined) a.yaw = p.f;
      a.swingT = Math.max(0, (a.swingT || 0) - dt);
      const wantYaw = a.swingT > 0 ? a.swingA : p.f;
      let dYaw = wantYaw - a.yaw; dYaw = ((dYaw + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      a.yaw += dYaw * Math.min(1, dt * (a.swingT > 0 ? 30 : 16));
      a.root.rotation.y = a.yaw - (a.kit ? a.kit.yaw0 : 0);
      // DMT holders: a slow gold-and-teal aura under their feet, with the odd sparkle
      if (p.id === localId && dmtAura !== !!a.aura) {
        if (dmtAura) {
          const g = new THREE.Group();
          const outer = softRing(0xffd34d, 0.8, 1.04, { opacity: 0.6, fill: 0.08 });
          const inner = softRing(0x5ff2d8, 0.86, 0.96, { opacity: 0.55, arcs: 3 });
          g.add(outer, inner); g.position.y = 0.07; a.root.add(g); a.aura = g;
        } else { a.root.remove(a.aura); a.aura = null; }
      }
      if (p.fire > 0 && !a.fireRing) {
        const g = new THREE.Group(), glow = softRing(0xff5a1f, 0, 0.9, { opacity: 0.12, fill: 0.6 }), edge = softRing(0xff7a2a, 0.88, 1.02, { opacity: 0.75 });
        g.add(glow, edge); g.position.y = 0.09; a.root.add(g); a.fireRing = g;
      } else if (!(p.fire > 0) && a.fireRing) { a.root.remove(a.fireRing); a.fireRing = null; }
      if (a.fireRing) {
        a.fireRing.scale.setScalar(p.fire); a.fireRing.rotation.y = -a.root.rotation.y;
        a.fireRing.children[1].material.uniforms.uOp.value = 0.6 + 0.25 * Math.sin(time * 9); a.fireRing.children[0].material.uniforms.uOp.value = 0.1 + 0.05 * Math.sin(time * 5);
        if (a.root.visible && Math.random() < dt * 14) { const ang = Math.random() * 6.283; emit(a.px + Math.cos(ang) * p.fire, a.root.position.y + 0.2, a.pz + Math.sin(ang) * p.fire, 1, 0.6, { s: 0.7, life: 0.55, color: Math.random() < 0.5 ? 0xff7a2a : 0xffc04d, up: 2.2, g: 0 }); }
      }
      if (a.aura) { a.aura.rotation.y = -a.root.rotation.y + time * 0.6; a.aura.children[1].rotation.y = -time * 1.4; if (a.root.visible && Math.random() < dt * 2.2) emit(a.px + (Math.random() - 0.5) * 1.6, a.root.position.y + 0.2, a.pz + (Math.random() - 0.5) * 1.6, 1, 0.4, { s: 0.6, life: 0.9, color: Math.random() < 0.5 ? 0xffd34d : 0x5ff2d8, up: 1.6, g: 0 }); }
      if (a.kit) {
        const lvl = p.ps.armor || 0;
        // worn: the adventurer's own look, then the armor passive's tier, then the gear you really wear (from caskets and the
        // bank) on top, so a casket's straw hat shows instead of hiding under the passive's helmet
        const worn = {}; for (const [k, n] of Object.entries(p.gear || {})) if (isClothing(n)) worn[k] = n; // the shield goes in the hand, below
        const want = { ...a.baseArmor, ...armorSet(lvl), ...worn }, gsig = JSON.stringify(want);
        if (gsig !== a.gearSig) {
          const missing = Object.values(worn).filter((n) => !kit.isLoaded(`${GEAR_FOLDER[GEAR[n].slot]}/Clothing/${n}`));
          if (!missing.length) { a.gearSig = gsig; a.kit.setArmor(want); }
          else if (!a.gearLoading) { a.gearLoading = true; preloadGear(missing).finally(() => { a.gearLoading = false; }); }
        }
        // weapon in the right hand; in the left the bow (it needs both hands), else the shield you wear (from a casket or
        // the bank), else the Kiteshield weapon's own shield
        const wk = Object.keys(p.w); const rightId = wk.find((id) => !['bow', 'shield'].includes(id) && WEAPONS[id] && WEAPONS[id].model);
        const wornShield = p.gear && Object.hasOwn(GEAR, p.gear.offhand || '') && GEAR[p.gear.offhand].model ? p.gear.offhand : null;
        const leftId = wk.includes('bow') ? 'bow' : wornShield ? 'worn' : wk.includes('shield') ? 'shield' : null; // (the baseball and lighter have no hand model)
        const sig = `${rightId}${rightId ? p.w[rightId] : ''}${p.evo[rightId] ? 'E' : ''}|${leftId}${leftId === 'worn' ? wornShield : leftId ? p.w[leftId] : ''}`;
        if (sig !== a.heldSig) {
          a.heldSig = sig;
          const urlFor = (id) => (id === 'worn' ? GEAR[wornShield].model : id === 'katana' && p.evo.katana ? 'shadowfang.glb' : weaponModelPath(id, p.w[id]));
          Promise.all([rightId ? item(urlFor(rightId)) : null, leftId ? item(urlFor(leftId)) : null]).then(([r, l]) => { if (a.heldSig === sig) a.kit.setHeld({ right: r && r.gltf, left: l && l.gltf, rightFix: heldFix(rightId, p.evo[rightId]), leftFix: heldFix(leftId === 'worn' ? 'shield' : leftId), rightAim: HELD_AIM[rightId], leftAim: HELD_AIM[leftId === 'worn' ? 'shield' : leftId], rightScale: HS ? Number(HS) : 1, leftScale: HS ? Number(HS) : 1 }); });
        }
        a.kit.setMoving(!!p.mv, 1);
        a.mixer.update(dt);
      } else {
        const bob = p.mv ? Math.sin(time * 14) * 0.08 : 0;
        a.inner.position.y = (playerProto ? -playerProto.minY : 0) + Math.abs(bob);
        if (a.mixer) a.mixer.update(dt * (p.mv ? 1.2 : 0.2));
      }
      if (p.hurt) a.root.scale.setScalar(1.08); else a.root.scale.setScalar(1);
      // kiteshields
      const sl = p.w.shield;
      if (sl) {
        const s = p.shields || WEAPONS.shield.stats(sl);
        for (let i = 0; i < s.count; i++) {
          const key = `${p.id}:${i}`; seenShield.add(key);
          let o = shieldObjs.get(key);
          if (!o) { o = new THREE.Group(); dyn.add(o); shieldObjs.set(key, o); item(weaponModelPath('shield', sl)).then((pr) => { if (pr) o.add(orientedItem(pr, 1.25, true)); }); o.userData.lvl = sl; }
          if (o.userData.lvl !== sl) { o.clear(); o.userData.lvl = sl; item(weaponModelPath('shield', sl)).then((pr) => { if (pr) o.add(orientedItem(pr, 1.25, true)); }); }
          const ang = p.orbit * s.spin + (i / s.count) * Math.PI * 2;
          const sx = p.x + Math.sin(ang) * s.radius, sz = p.z + Math.cos(ang) * s.radius;
          o.position.set(sx, groundAt(sx, sz) + 1.0, sz); o.rotation.y = ang;
        }
      }
    }
    for (const [id, a] of playerActors) if (!seenP.has(id)) { dyn.remove(a.root); playerActors.delete(id); }
    for (const [k, o] of shieldObjs) if (!seenShield.has(k)) { dyn.remove(o); shieldObjs.delete(k); }
    seenShield.clear();

    updateRoofs(me ? me.x : cam.x, me ? me.z : cam.z);
    updateFoliage(cam.x, cam.z);
    updateFolk(dt);
    updateTreeFade(me ? me.x : cam.x, me ? me.z : cam.z, dt);
    if ((frameN = (frameN + 1) % 15) === 0) updateSmallProps(cam.x, cam.z);
    // enemies
    const seenE = new Set(); const camX = cam.x, camZ = cam.z; let blobN = 0;
    camera.updateMatrixWorld(); projScreen.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); viewFrustum.setFromProjectionMatrix(projScreen);
    for (const e of view.enemies) {
      const [id, type, x, z, face, hpPct, hit, elite, winding, , rising] = e;
      seenE.add(id);
      let a = actors.get(id);
      if (!a) {
        a = makeEnemy(type); a.px = x; a.pz = z; a.base = 1; dyn.add(a.root); actors.set(id, a);
        if (elite) { // golden elite: bigger, with a gold halo on the ground
          a.base = 1.35; const halo = softRing(0xffd34d, 0.72, 1.02, { opacity: 0.75, fill: 0.1, arcs: 2 }); halo.position.y = 0.06; a.root.add(halo); a.halo = halo;
        }
      }
      if (a.halo) a.halo.rotation.y += dt * 2;
      // a monster moved back near you (left far behind) snaps there: easing it slid it across the map through walls
      if ((x - a.px) ** 2 + (z - a.pz) ** 2 > 9) { a.px = x; a.pz = z; }
      a.px += (x - a.px) * Math.min(1, dt * 18); a.pz += (z - a.pz) * Math.min(1, dt * 18);
      a.root.position.set(a.px, groundAt(a.px, a.pz), a.pz);
      if (rising > 0) { a.riseMax = Math.max(a.riseMax || 0, rising); a.root.position.y -= (ENEMIES[type].h || 1.8) * 0.95 * (rising / a.riseMax); } // climbing out of the ground
      cullSphere.center.set(a.px, a.root.position.y + 1, a.pz); cullSphere.radius = (ENEMIES[type].h || 2) * 0.8 + 1;
      a.root.visible = viewFrustum.intersectsSphere(cullSphere); // monsters off screen are not drawn at all
      a.root.rotation.y = face - (a.kit ? a.kit.yaw0 : 0);
      a.root.scale.setScalar((a.base || 1) * (hit ? 1.12 : winding ? 1 + Math.sin(time * 40) * 0.04 : 1));
      if (a.mats && a.flashOn !== !!hit) { a.flashOn = !!hit; for (const m of a.mats) m.emissive.setRGB(hit ? 0.85 : 0, hit ? 0.85 : 0, hit ? 0.85 : 0); }
      const near = (a.px - camX) ** 2 + (a.pz - camZ) ** 2 < 26 * 26;
      if (a.mixer && near && a.root.visible) a.mixer.update(dt * 1.0);
      const def = ENEMIES[type];
      if (def.boss && !a.shadowed) { a.shadowed = true; a.root.traverse((o) => { if (o.isMesh) o.castShadow = true; }); }
      else if (blobN < 520) { const r = (def.r || 0.5) * 2.6; dummy.position.set(a.px, a.root.position.y + 0.05, a.pz); dummy.rotation.set(0, 0, 0); dummy.scale.set(r, 1, r); dummy.updateMatrix(); blobMesh.setMatrixAt(blobN++, dummy.matrix); }
    }
    blobMesh.count = blobN; blobMesh.instanceMatrix.needsUpdate = true;
    // the fallen: play the death animation if the model has one, otherwise topple over; then sink into the ground
    for (const [id, a] of actors) if (!seenE.has(id)) {
      actors.delete(id);
      if (corpses.length > 50) { dyn.remove(a.root); continue; }
      if (a.mats) for (const m of a.mats) m.emissive.setRGB(0, 0, 0);
      if (a.mixer && a.deathClip) { a.mixer.stopAllAction(); const act = a.mixer.clipAction(a.deathClip); act.setLoop(THREE.LoopOnce, 1); act.clampWhenFinished = true; act.reset().play(); }
      corpses.push({ a, t: 0, life: a.deathClip ? 1.3 : 0.9, tip: a.deathClip ? 0 : (Math.random() < 0.5 ? 1 : -1), y0: a.root.position.y });
    }
    for (let i = corpses.length - 1; i >= 0; i--) {
      const c = corpses[i]; c.t += dt; const k = c.t / c.life;
      if (c.a.mixer && c.a.deathClip) c.a.mixer.update(dt);
      if (c.tip) c.a.root.rotation.z = c.tip * Math.min(1, c.t * 4) * Math.PI / 2 * 0.95;
      const sink = Math.max(0, (k - 0.55) / 0.45); c.a.root.position.y = c.y0 - sink * 1.6;
      if (k >= 1) { dyn.remove(c.a.root); corpses.splice(i, 1); }
    }

    // boss attack telegraphs: a red circle fills up, then the slam lands
    for (let i = 0; i < hazardPool.length; i++) {
      const h = view.hazards && view.hazards[i], m = hazardPool[i];
      if (!h) { m.visible = false; continue; }
      m.visible = true; m.position.set(h[0], groundAt(h[0], h[1]) + 0.08, h[1]); m.scale.setScalar(h[2]);
      const u = m.userData.disc.material.uniforms; u.uProg.value = Math.max(0.01, h[3]); u.uTime.value = time; u.uCol.value.setHex(h[4] ? 0xff8a2a : 0xff3b2f);
      const rock = m.userData.rock; rock.visible = !!h[4];
      if (h[4]) { rock.position.set(0, (1 - h[3]) * 26 / h[2], 0); rock.scale.setScalar(0.9 / h[2]); if (Math.random() < 0.6) emit(h[0], m.position.y + (1 - h[3]) * 26, h[1], 1, 0.6, { s: 1.4, life: 0.4, color: 0xff7a30, up: 1.5, g: 0 }); }
    }
    // monster projectiles (fire and ice)
    const seenEp = new Set();
    for (const b of view.eproj || []) {
      seenEp.add(b[0]); let o = eprojObjs.get(b[0]);
      if (!o) {
        const col = b[3] === 'ice' ? 0x9fe6ff : 0xff7a30; o = new THREE.Group();
        o.add(new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(2.2), toneMapped: false })));
        o.add(glowSprite(col, 2.2, 0.55));
        o.userData.col = col; dyn.add(o); eprojObjs.set(b[0], o);
      }
      o.position.set(b[1], groundAt(b[1], b[2]) + 1.1, b[2]);
      if (Math.random() < 0.8) emit(b[1], o.position.y, b[2], 1, 0.4, { s: 0.8, life: 0.35, color: o.userData.col, up: 0.4, g: 0 });
    }
    for (const [id, o] of eprojObjs) if (!seenEp.has(id)) { dyn.remove(o); eprojObjs.delete(id); }

    // projectiles
    const seenPr = new Set();
    for (const pr of view.proj) {
      const [id, art, x, z, ang, lvl, spin, evo] = pr;
      seenPr.add(id);
      let o = projObjs.get(id);
      if (!o) {
        o = new THREE.Group(); dyn.add(o); projObjs.set(id, o);
        if (art === 'bolt') { // the staff's spell: SankoQuest's magic sphere in the shard's element colour
          const { col, tier } = staffSpell(lvl, evo);
          o.add(magicSphere(col, tier)); Object.assign(o.userData, { spell: { col, tier } });
        } else if (art === 'arrow') {
          o.add(ARROW.clone()); // SankoQuest's flying arrow, as the live game draws it
          Object.assign(o.userData, evo ? { trail: 0x9fe6ff, every: 0.5 } : { trail: 0xb89a6a, every: 0.7 }); // the glacial bow's frost, or a little dust
        } else if (art === 'sword') { // a thrown short sword, point first, with a bright streak
          item(weaponModelPath('shortsword', lvl)).then((p) => { if (p) o.add(orientedItem(p, 1.1)); });
          o.add(new THREE.Mesh(new THREE.PlaneGeometry(0.14, 2.0).rotateX(-Math.PI / 2).translate(0, 0, -1.2), streakMat(evo ? 0x7fe0ff : 0xfff6dc, 0.55)));
          if (evo) Object.assign(o.userData, { trail: 0x7fe0ff, every: 0.4 });
        } else if (art === 'ball') { // a baseball, stitches and all, spinning as it flies
          // owner 3 Nov: "baseball projectile is pretty huge": 0.64 across was 40% of a person; now 0.3 (its hit size is unchanged)
          const ball = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10), new THREE.MeshStandardMaterial({ color: 0xf4f0e6, roughness: 0.7 }));
          const seam = new THREE.Mesh(new THREE.TorusGeometry(0.152, 0.012, 6, 24), new THREE.MeshBasicMaterial({ color: 0xc8322a })); seam.rotation.x = 0.6; ball.add(seam);
          if (evo) o.add(glowSprite(0xffd34d, 0.8, 0.5));
          o.add(ball); Object.assign(o.userData, { spinner: ball, trail: evo ? 0xffd34d : 0xfff6dc, every: 0.45 });
        } else if (art === 'axe') {
          item(weaponModelPath('axe', lvl)).then((p) => { if (p) { const m = orientedItem(p, 1.5); o.userData.spinner2 = m; o.add(m); } });
          const blur = softRing(evo ? 0x7fe0ff : 0xffe2a0, 0.5, 0.95, { opacity: 0.32, arcs: 2 }); o.add(blur); o.userData.blur = blur; // a soft swoosh that turns with the axe
          Object.assign(o.userData, { trail: evo ? 0x7fe0ff : 0xffd38a, every: 0.35 });
        }
      }
      o.position.set(x, groundAt(x, z) + (art === 'bolt' ? 1.3 : 1.0), z); // spells fly about 1.3 up, as the game's
      if (art === 'axe') { if (o.userData.spinner2) o.userData.spinner2.rotation.y = spin; if (o.userData.blur) o.userData.blur.rotation.y = spin; o.rotation.y = 0; } else o.rotation.y = ang;
      if (o.userData.spinner) o.userData.spinner.rotation.z += dt * 12;
      if (o.userData.spell) { o.updateMatrixWorld(); stepMagicSphere(o.children[0], performance.now()); }
      if (o.userData.trail && Math.random() < o.userData.every) emit(x, o.position.y, z, 1, 0.3, { s: art === 'bolt' ? 0.7 : 0.45, life: 0.35, color: o.userData.trail, up: 0.25, g: 0 });
    }
    for (const [id, o] of projObjs) if (!seenPr.has(id)) {
      if (o.userData.spell) magicBurst(o.position.x, o.position.y, o.position.z, o.userData.spell.col, o.userData.spell.tier);
      dyn.remove(o); projObjs.delete(id);
    }
    stepMagicBursts(performance.now());

    // pickups
    { const cnt = [0, 0, 0];
      for (const g of view.gems) { const k = g[3] > 20 ? 2 : g[3] > 4 ? 1 : 0; if (cnt[k] >= GEM_CAP) continue; const a = gemSets[k].geometry.attributes.position.array, o = cnt[k]++ * 3;
        a[o] = g[1]; a[o + 1] = groundAt(g[1], g[2]) + 0.55 + Math.sin(time * 4 + g[0]) * 0.1; a[o + 2] = g[2]; }
      gemSets.forEach((pts, k) => { pts.geometry.setDrawRange(0, cnt[k]); pts.geometry.attributes.position.needsUpdate = true; }); }
    const seenK = new Set();
    for (const k of view.pickups) {
      seenK.add(k[0]);
      let sp = pickupSprites.get(k[0]);
      if (!sp && k[1] === 'casket') { // reward casket: the world's own treasure chest model, with a light beam over it
        sp = new THREE.Group(); sp.userData.casket = true;
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 7, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
        beam.position.y = 3.2; fxOnly(beam); sp.add(beam);
        loadGLB(A('world/scene-models/chest.glb')).then((g) => { const m = g.scene.clone(true); const b = boxOf(m), z = b.getSize(new THREE.Vector3()), kk = 0.9 / Math.max(z.x, z.y, z.z, 1e-3); m.scale.setScalar(kk); m.position.set(-(b.min.x + b.max.x) / 2 * kk, -b.min.y * kk, -(b.min.z + b.max.z) / 2 * kk); m.traverse((o) => { if (o.isMesh) o.castShadow = true; }); sp.add(m); }).catch(() => {});
        dyn.add(sp); pickupSprites.set(k[0], sp);
      }
      if (!sp) { sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconTex(PICKUP_ICON[k[1]] || 'Gold'), transparent: true, alphaTest: 0.3, depthWrite: false })); sp.scale.setScalar(PICKUP_SIZE[k[1]] || 0.95); fxOnly(sp); dyn.add(sp); pickupSprites.set(k[0], sp); }
      if (sp.userData.casket) { sp.position.set(k[2], groundAt(k[2], k[3]), k[3]); sp.rotation.y = time * 0.8; }
      else sp.position.set(k[2], groundAt(k[2], k[3]) + 0.8 + Math.sin(time * 4 + k[0]) * 0.1, k[3]);
    }
    for (const [id, sp] of pickupSprites) if (!seenK.has(id)) { dyn.remove(sp); if (sp.material) sp.material.dispose(); pickupSprites.delete(id); }

    // particles
    for (let i = 0; i < PN; i++) {
      const p = parts[i];
      if (p.life > 0) { p.life -= dt; p.vy -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; dummy.position.set(p.x, Math.max(p.y, groundAt(p.x, p.z)), p.z); dummy.scale.setScalar(Math.max(0.01, (p.life / p.max) * 1.2) * p.s); partMesh.setColorAt(i, p.c); }
      else { dummy.position.set(0, -50, 0); dummy.scale.setScalar(0.001); }
      dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); partMesh.setMatrixAt(i, dummy.matrix);
    }
    partMesh.instanceMatrix.needsUpdate = true; if (partMesh.instanceColor) partMesh.instanceColor.needsUpdate = true;

    // flat effects
    for (let i = effects.length - 1; i >= 0; i--) {
      const m = effects[i], u = m.userData; u.life -= dt;
      if (u.life <= 0) { dyn.remove(m); m.geometry.dispose(); m.material.dispose(); effects.splice(i, 1); continue; }
      if (m.userData.shader) m.material.uniforms.uProg.value = 1 - u.life / u.max; else m.material.opacity = 0.8 * (u.life / u.max);
      if (u.grow) m.scale.setScalar((u.base || 1) * (1 + u.grow * (1 - u.life / u.max)));
    }

    // camera
    cam.shake = Math.max(0, cam.shake - dt); cam.flash = Math.max(0, cam.flash - dt);
    const shk = settings.shake ? cam.shake : 0, sx = (Math.random() - 0.5) * shk * 0.8, sz = (Math.random() - 0.5) * shk * 0.8;
    const gy = groundAt(cam.x, cam.z);
    cam.zoom += (cam.zoomT - cam.zoom) * Math.min(1, dt * 8 + 0.02);
    weatherNow = view.weather || null; blizzardK += ((weatherNow ? 1 : 0) - blizzardK) * Math.min(1, dt * 1.5);
    if (weatherNow) stormKind = weatherNow;
    if (blizzardK < 0.002) fogBase.copy(scene.fog.color); // remember the map's own haze while the sky is clear
    else scene.fog.color.copy(fogBase).lerp(stormKind === 'sandstorm' ? SAND_HAZE : SNOW_HAZE, blizzardK * 0.85);
    const vd = VIEW[settings.view] || 1;
    // the fog never closes in when you zoom in (the title screen's close camera fogged out 20 units away)
    const fz = Math.max(1, cam.zoom);
    scene.fog.near = 38 * fz * vd * (1 - 0.6 * blizzardK); scene.fog.far = 78 * fz * vd * (1 - 0.5 * blizzardK); camera.far = 170 * fz * vd; camera.updateProjectionMatrix();
    cam.yaw += ((rotKeys.e ? 1 : 0) - (rotKeys.q ? 1 : 0)) * dt * 1.8;
    const L = Math.hypot(21, 17) * cam.zoom, cp = Math.cos(cam.pitch) * L;
    camera.position.set(cam.x + sx + Math.sin(cam.yaw) * cp, gy + Math.sin(cam.pitch) * L, cam.z + sz + Math.cos(cam.yaw) * cp + cam.shift);
    camera.lookAt(cam.x, gy + 0.5 + (cam.lookY || 0), cam.z + cam.shift);
    // the shadow-casting sun follows the view (snapped to shadow texels so edges do not crawl)
    { const snap = 68 / 2048, tx = Math.round(cam.x / snap) * snap, tz = Math.round((cam.z + cam.shift) / snap) * snap; sun.target.position.set(tx, gy, tz); sun.position.set(tx + SUN_OFF.x, gy + SUN_OFF.y, tz + SUN_OFF.z); }

    // damage numbers
    for (let i = numbers.length - 1; i >= 0; i--) {
      const n = numbers[i]; n.life -= dt; n.y += dt * 1.6;
      if (n.life <= 0) { n.el.remove(); numbers.splice(i, 1); continue; }
      tmpV.set(n.x, n.y, n.z).project(camera);
      n.el.style.transform = `translate(${(tmpV.x * 0.5 + 0.5) * canvas.clientWidth}px, ${(-tmpV.y * 0.5 + 0.5) * canvas.clientHeight}px) translate(-50%,-50%)`;
      n.el.style.opacity = Math.min(1, n.life * 2.5);
    }
    rainStep(dt); ambientStep(dt); autoQuality(dt);
    renderer.info.autoReset = false; renderer.info.reset(); // count every pass of the frame (shadows, scene, effects)
    if (torch.intensity > 0) torch.position.set(cam.x, gy + 3.2, cam.z);
    grade.uniforms.uTime.value = time; grade.uniforms.uHurt.value = Math.min(1, cam.flash * 3); grade.uniforms.uFlash.value = Math.max(0, cam.white || 0); cam.white = Math.max(0, (cam.white || 0) - dt * 2.5);
    if (me) grade.uniforms.uLow.value = me.al && me.hp / me.mhp < 0.3 ? 1 : 0;
    if (settings.bloom || settings.dof || settings.ao || settings.grade !== false || settings.aa) {
      if (settings.dof) bokeh.uniforms.focus.value = camera.position.distanceTo(tmpV.set(cam.x, gy + 1, cam.z));
      composer.render(dt);
    } else renderer.render(scene, camera);
    return cam.flash;
  }
  const seenShield = new Set();

  function reset() {
    for (const a of actors.values()) dyn.remove(a.root); actors.clear();
    for (const c of corpses) dyn.remove(c.a.root); corpses.length = 0;
    for (const a of playerActors.values()) dyn.remove(a.root); playerActors.clear();
    for (const o of projObjs.values()) dyn.remove(o); projObjs.clear(); for (const b of msBursts) dyn.remove(b.o); msBursts.length = 0;
    for (const o of shieldObjs.values()) dyn.remove(o); shieldObjs.clear();
    for (const p of parts) p.life = 0;
    for (const a of folkActors.values()) entGroup.remove(a.root); folkActors.clear(); folkT = 0;
    for (const o of eprojObjs.values()) dyn.remove(o); eprojObjs.clear(); for (const h of hazardPool) h.visible = false;
    cam.x = curMap.cx; cam.z = curMap.cz;
  }
  return { update, reset, resize, propCount, groundAt, renderer, loadMap, debugScene: () => ({ scene, camera }), setZoom(z) { cam.zoom = cam.zoomT = z; }, setShift(v) { cam.shift = v; }, getYaw() { return cam.yaw; }, setYaw(v) { cam.yaw = v; }, setPitch(v) { cam.pitch = v; }, setLookY(v) { cam.lookY = v; },
    preloadGear,
    // QA hooks
    setAura(on) { dmtAura = !!on; },
    applySettings, getSettings: () => ({ ...settings }), qaGrade: () => ({ en: grade.enabled, rts: grade.renderToScreen, passes: composer.passes.map((p) => p.constructor.name + (p.enabled ? "" : "(off)")), low: grade.uniforms.uLow.value }),
    qaRoofs: (x, z) => ({ hidden: [...roofHidden], near: [...roofBoxes].filter(([, b]) => Math.abs((b.x0 + b.x1) / 2 - x) < 25 && Math.abs((b.z0 + b.z1) / 2 - z) < 25).map(([id, b]) => [id, Math.round(b.x0), Math.round(b.x1), Math.round(b.z0), Math.round(b.z1)]), meshes: roofMeshes.length }),
    qaGems: () => gemSets.map((g) => [g.geometry.drawRange.count, !!g.material.map, g.material.size, g.visible]),
    qaProps: () => worldProps,
    qaDraw() {
      const fr = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
      const by = {}, mats = new Set(); let shadow = 0;
      const top = (o) => { let n = o; while (n.parent && n.parent !== scene) n = n.parent; return n.name || n.type + ':' + scene.children.indexOf(n); };
      scene.traverseVisible((o) => {
        if (!(o.isMesh || o.isPoints || o.isLine || o.isSprite)) return;
        if (o.frustumCulled !== false) { if (o.isInstancedMesh || o.isBatchedMesh) { if (!o.boundingSphere) o.computeBoundingSphere(); const sp = o.boundingSphere.clone().applyMatrix4(o.matrixWorld); if (!fr.intersectsSphere(sp)) return; } else if (o.geometry) { if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); const sp = o.geometry.boundingSphere.clone().applyMatrix4(o.matrixWorld); if (!fr.intersectsSphere(sp)) return; } }
        const k = top(o), m = [].concat(o.material); by[k] = by[k] || { n: 0, mats: new Set(), cast: 0 }; by[k].n += m.length; m.forEach((x) => { by[k].mats.add(x.uuid); mats.add(x.uuid); }); if (o.castShadow) { by[k].cast++; shadow++; }
      });
      return { total: Object.values(by).reduce((a, b) => a + b.n, 0), mats: mats.size, shadowCasters: shadow, groups: Object.entries(by).sort((a, b) => b[1].n - a[1].n).slice(0, 12).map(([k, v]) => k + ' ' + v.n + ' (' + v.mats.size + ' mats, ' + v.cast + ' cast)') };
    },
    qaInfo: () => ({ props: worldProps.children.length, propsVis: worldProps.children.filter((o) => o.visible).length, small: smallMeshes.length, ents: entGroup.children.length, calls: renderer.info.render.calls, tris: renderer.info.render.triangles, geos: renderer.info.memory.geometries, tex: renderer.info.memory.textures, progs: renderer.info.programs.length, pr: renderer.getPixelRatio() }),
    qaFolkBones(kind) { const out = []; for (const [i, a] of folkActors) { if (!a.kind || a.kind !== kind) continue; a.root.updateMatrixWorld(true); const v = new THREE.Vector3(); a.root.traverse((o) => { if (o.isBone && /Hips$|Head$|HeadTop_End$|LeftFoot$|RightFoot$|LeftHand$|Spine2$|LeftUpLeg$/.test(o.name)) { o.getWorldPosition(v); out.push(o.name.replace('mixamorig', '') + ' ' + v.x.toFixed(2) + ',' + v.y.toFixed(2) + ',' + v.z.toFixed(2)); } }); const b = new THREE.Box3().setFromObject(a.root, true); out.push('box ' + b.min.toArray().map((x) => x.toFixed(2)) + ' / ' + b.max.toArray().map((x) => x.toFixed(2))); } return out; },
    qaFolk: () => [...folkActors.values()].map((a) => [a.root.position.x.toFixed(1), a.root.position.y.toFixed(1), a.root.position.z.toFixed(1), a.root.visible, a.root.parent ? 1 : 0]),
    qaPlayers: () => [...playerActors.values()],
    qaFoliage: () => Object.fromEntries(Object.entries(folMeshes).map(([v, ms]) => [v, ms.map((m) => m.im.count)])),
    qaActors: () => actors, THREE, get terrain() { return terrain; },
    heldTune: { aim: HELD_AIM, scale: HELD_SCALE, refresh() { for (const a of playerActors.values()) a.heldSig = null; } } };
}
