import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import * as character from '../src/character.js';

const meshes = root => { const out = []; root.traverse(o => { if (o.isSkinnedMesh) out.push(o); }); return out; };
function fixture() {
  const scene = new THREE.Group(), hip = new THREE.Bone(), tip = new THREE.Bone();
  hip.name = 'hip'; tip.name = 'tip'; tip.position.y = 1; hip.add(tip); scene.add(hip);
  for (let part = 0; part < 2; part++) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, part, 1, 0, part, 0, 1, part], 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute([0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0], 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute([.75, .25, 0, 0, .75, .25, 0, 0, .75, .25, 0, 0], 4));
    g.setIndex([0, 1, 2]);
    const m = new THREE.MeshStandardMaterial({ roughness: .63, metalness: .12 });
    m.color.setRGB(part ? .17 : .91, .43, .07); m.name = 'native ' + part;
    const mesh = new THREE.SkinnedMesh(g, m); mesh.name = 'part' + part; scene.add(mesh);
    scene.updateMatrixWorld(true); mesh.bind(new THREE.Skeleton([hip, tip]));
  }
  return scene;
}
function actor(source) {
  const root = character.cloneActor(source);
  for (const mesh of meshes(root)) mesh.material = character.ownActorResource(mesh.material.clone());
  return root;
}
function merge(root, clips = []) { assert.equal(typeof character.mergeActorMeshes, 'function'); return character.mergeActorMeshes(root, clips); }
function watch(resource) { let count = 0; resource.addEventListener('dispose', () => count++); return () => count; }
function triangles(root) {
  root.updateMatrixWorld(true);
  return meshes(root).flatMap(mesh => {
    mesh.skeleton.update(); const g = mesh.geometry, c = g.attributes.color;
    return Array.from(g.index.array, i => ({
      position: mesh.getVertexPosition(i, new THREE.Vector3()).applyMatrix4(mesh.matrixWorld).toArray(),
      normal: [g.attributes.normal.getX(i), g.attributes.normal.getY(i), g.attributes.normal.getZ(i)],
      color: [0, 1, 2].map(j => Math.fround(mesh.material.color[['r', 'g', 'b'][j]] * (mesh.material.vertexColors && c ? c.array[i * 3 + j] : 1)))
    }));
  });
}
// Removing the palette registration, color bake, or indexed concatenation changes these native triangle values.
test('crowd batching preserves posed triangles, normals and linear RGB without changing cached sources', () => {
  const source = fixture(), beforeSource = source.toJSON(), root = actor(source), parts = meshes(root);
  parts[0].skeleton.bones[1].rotation.z = .31;
  const before = triangles(root), palette = parts[0].skeleton;
  palette.computeBoneTexture(); const freed = watch(palette.boneTexture);
  assert.equal(merge(root), 1); assert.equal(meshes(root).length, 1);
  assert.deepEqual(triangles(root), before); assert.equal(meshes(root)[0].skeleton, palette); assert.equal(freed(), 0);
  assert.deepEqual(source.toJSON(), beforeSource); assert.equal(merge(root), 0);
  character.disposeActor(root); assert.equal(freed(), 1); character.disposeActor(root); assert.equal(freed(), 1);
});

test('merged geometry cache survives actor disposal and uses independent owned materials and palettes', () => {
  const source = fixture(), a = actor(source), b = actor(source);
  assert.equal(merge(a), 1); assert.equal(merge(b), 1);
  const am = meshes(a)[0], bm = meshes(b)[0], freedGeometry = watch(am.geometry), freedA = watch(am.material), freedB = watch(bm.material);
  assert.equal(am.geometry, bm.geometry); assert.notEqual(am.material, bm.material); assert.notEqual(am.skeleton, bm.skeleton);
  am.material.emissive.setRGB(.85, .85, .85); assert.equal(bm.material.emissive.r, 0);
  character.disposeActor(a); assert.equal(freedA(), 1); assert.equal(freedB(), 0); assert.equal(freedGeometry(), 0);
  character.disposeActor(b); assert.equal(freedB(), 1); assert.equal(freedGeometry(), 0);
  const c = actor(source); assert.equal(merge(c), 1); assert.equal(meshes(c)[0].geometry, am.geometry); character.disposeActor(c);
});

test('original vertex RGB is multiplied only when its material enables vertex colors', () => {
  for (const enabled of [false, true]) {
    const source = fixture();
    for (const m of meshes(source)) { m.geometry.setAttribute('color', new THREE.Float32BufferAttribute([.2, .4, .6, .8, .3, .7, .5, .9, .1], 3)); m.material.vertexColors = enabled; }
    const root = actor(source), before = triangles(root); assert.equal(merge(root), 1); assert.deepEqual(triangles(root), before); character.disposeActor(root);
  }
});

const rejected = {
  invisible: ([, b]) => { b.visible = false; },
  children: ([, b]) => b.add(new THREE.Group()),
  parent: ([, b], root) => { const group = new THREE.Group(); root.add(group); group.add(b); },
  transform: ([, b]) => { b.position.x = .1; },
  bind: ([, b]) => b.bindMatrix.elements[12] += .1,
  inverseBind: ([, b]) => b.bindMatrixInverse.elements[12] += .1,
  bindMode: ([, b]) => { b.bindMode = 'detached'; },
  skeleton: ([, b]) => { b.skeleton = b.skeleton.clone(); },
  renderOrder: ([, b]) => { b.renderOrder = 1; },
  castShadow: ([, b]) => { b.castShadow = true; },
  layers: ([, b]) => b.layers.set(1),
  roughnessPrecision: ([, b]) => { b.material.roughness += 1e-12; },
  emissivePrecision: ([, b]) => b.material.emissive.setRGB(1e-8, 0, 0),
  transparent: ([, b]) => { b.material.transparent = true; },
  opacity: ([, b]) => { b.material.opacity = .99; },
  texture: ([, b]) => { b.material.map = new THREE.Texture(); },
  physical: ([, b]) => { b.material = new THREE.MeshPhysicalMaterial(); },
  customShader: ([, b]) => { b.material.onBeforeCompile = () => {}; },
  customCache: ([, b]) => { b.material.customProgramCacheKey = () => 'special'; },
  customMesh: ([, b]) => { b.onBeforeRender = () => {}; },
  clipping: ([, b]) => { b.material.clippingPlanes = [new THREE.Plane()]; },
  morphs: ([, b]) => { b.geometry = b.geometry.clone(); b.geometry.morphAttributes.position = [b.geometry.attributes.position.clone()]; },
  groups: ([, b]) => { b.geometry = b.geometry.clone(); b.geometry.addGroup(0, 3, 0); },
  drawRange: ([, b]) => { b.geometry = b.geometry.clone(); b.geometry.setDrawRange(0, 2); },
  interleaved: ([, b]) => { b.geometry = b.geometry.clone(); b.geometry.setAttribute('normal', new THREE.InterleavedBufferAttribute(new THREE.InterleavedBuffer(new Float32Array(9), 3), 3, 0)); },
  attributeLayout: ([, b]) => { b.geometry = b.geometry.clone(); b.geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1], 2)); },
  alphaColors: ([, b]) => { b.geometry = b.geometry.clone(); b.geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(12), 4)); },
};
for (const [name, change] of Object.entries(rejected)) test(`crowd batching rejects ${name} without replacing source meshes`, () => {
  const root = actor(fixture()), before = meshes(root); change(before, root);
  assert.equal(merge(root), 0); assert.deepEqual(meshes(root), before); character.disposeActor(root);
});

test('uncached geometry and untracked template meshes never become cache anchors', () => {
  const source = fixture(); assert.equal(merge(source), 0);
  const root = actor(source); for (const m of meshes(root)) m.geometry = character.ownActorResource(m.geometry.clone());
  assert.equal(merge(root), 0); character.disposeActor(root);
});

test('all supplied animation bindings protect parts, including inactive material tracks and uncertain names', () => {
  for (const name of ['part0.visible', 'part0.material.color', 'missing.quaternion', 'part0.bones[tip].quaternion', 'broken']) {
    const root = actor(fixture()), clip = new THREE.AnimationClip('later death', 1, [new THREE.NumberKeyframeTrack(name, [0, 1], [1, 0])]);
    assert.equal(merge(root, [new THREE.AnimationClip('walking', 1, []), clip]), 0, name); assert.equal(meshes(root).length, 2); character.disposeActor(root);
  }
  const root = actor(fixture()), clip = new THREE.AnimationClip('walking', 1, [new THREE.QuaternionKeyframeTrack('tip.quaternion', [0, 1], [0, 0, 0, 1, 0, 0, 0, 1])]);
  assert.equal(merge(root, [clip]), 1); character.disposeActor(root);
});

test('merging retains an owned old material used by an unsupported surviving part until reset', () => {
  const root = actor(fixture()), [a, b] = meshes(root), survivor = a.clone(); survivor.visible = false; root.add(survivor);
  // Clone through the actor boundary so the hidden part also owns a palette reference.
  const extra = character.cloneActor(fixture()), extraMesh = meshes(extra)[0]; extraMesh.material = a.material; extraMesh.visible = false; root.add(extra);
  root.remove(survivor);
  const retained = watch(a.material), removed = watch(b.material), sourceGeometry = watch(a.geometry);
  assert.equal(merge(root), 1); assert.equal(retained(), 0); assert.equal(removed(), 1); assert.equal(sourceGeometry(), 0);
  character.disposeActor(root); assert.equal(retained(), 1); assert.equal(removed(), 1); assert.equal(sourceGeometry(), 0);
});

test('enemy batching rebuilds existing hit-flash lists and preserves actors without flash ownership', () => {
  const renderer = readFileSync(new URL('../src/render.js', import.meta.url), 'utf8');
  const start = renderer.indexOf('  function batchEnemy('), end = renderer.indexOf('\n  // soft round shadows', start);
  assert.ok(start >= 0, 'enemy batching boundary exists');
  const batchEnemy = Function('mergeActorMeshes', `${renderer.slice(start, end)}; return batchEnemy;`)(character.mergeActorMeshes);
  for (const flashes of [false, true]) {
    const root = actor(fixture()), a = { root, crowdClips: [], ...(flashes ? { mats: meshes(root).map(m => m.material) } : {}) };
    batchEnemy(a); assert.equal(meshes(root).length, 1);
    if (flashes) { assert.deepEqual(a.mats, [meshes(root)[0].material]); a.mats[0].emissive.setRGB(.85, .85, .85); assert.equal(meshes(root)[0].material.emissive.r, .85); }
    else assert.equal(a.mats, undefined);
    character.disposeActor(root);
  }
});

test('cloning an already merged actor cannot use its merged geometry as another source cache anchor', () => {
  const source = fixture();
  for (const m of meshes(source)) { const extra = m.clone(); extra.renderOrder = 1; source.add(extra); }
  const first = actor(source); assert.equal(merge(first), 2);
  const next = actor(first); for (const m of meshes(next)) m.renderOrder = 0;
  assert.equal(merge(next), 0); character.disposeActor(next); character.disposeActor(first);
});

test('incomplete triangle streams remain separate instead of creating a new triangle across parts', () => {
  const source = fixture(); for (const m of meshes(source)) m.geometry.setIndex([0, 1]);
  const root = actor(source); assert.equal(merge(root), 0); character.disposeActor(root);
});
