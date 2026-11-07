import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { disposeActor } from '../src/character.js';

const module = await import('../src/bun-actor.js').catch(error => {
  if (error.code !== 'ERR_MODULE_NOT_FOUND' || !error.message.includes('/src/bun-actor.js')) throw error;
  return {};
});
const prepare = (...args) => { assert.equal(typeof module.prepareBun, 'function', 'native BUN preparation is implemented'); return module.prepareBun(...args); };
const create = (...args) => { assert.equal(typeof module.createBunActor, 'function', 'native BUN actor is implemented'); return module.createBunActor(...args); };

function fixture() {
  const scene = new THREE.Group(), armature = new THREE.Group(), hips = new THREE.Bone();
  armature.name = 'Armature'; hips.name = 'mixamorigHips'; scene.add(armature); armature.add(hips);
  const geometry = new THREE.BoxGeometry(40, 100, 30); geometry.translate(0, 50, 0);
  const count = geometry.attributes.position.count, weights = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) weights[i * 4] = 1;
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Uint16Array(count * 4), 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
  const material = new THREE.MeshBasicMaterial(), mesh = new THREE.SkinnedMesh(geometry, material);
  armature.add(mesh); scene.updateMatrixWorld(true); mesh.bind(new THREE.Skeleton([hips]));
  const clips = {
    run: new THREE.AnimationClip('run', .6, [new THREE.VectorKeyframeTrack('mixamorigHips.position', [0, .3, .6], [0, .21, 0, 0, .28, 0, 0, .21, 0])]),
    curious: new THREE.AnimationClip('curious', 2.4, [new THREE.VectorKeyframeTrack('mixamorigHips.position', [0, 1.2, 2.4], [0, 0, 0, 0, .1, 0, 0, 0, 0])]),
  };
  return { gltf: { scene }, clips, geometry, material, mesh, hips };
}
function box(root) { root.updateMatrixWorld(true); root.traverse(o => { if (o.isSkinnedMesh) o.skeleton.update(); }); return new THREE.Box3().setFromObject(root, true); }
function meshes(root) { const all = []; root.traverse(o => { if (o.isSkinnedMesh) all.push(o); }); return all; }
function watch(resource) { let count = 0; resource.addEventListener('dispose', () => count++); return () => count; }

test('BUN preparation converts copied native position tracks once and preserves cached rig/clip data', () => {
  const f = fixture(), before = f.gltf.scene.toJSON(), values = [...f.clips.run.tracks[0].values];
  const first = prepare(f.gltf, f.clips), second = prepare(f.gltf, f.clips);
  assert.notEqual(first.clips.run, f.clips.run); assert.notEqual(first.clips.run, second.clips.run);
  assert.ok(Math.abs(first.clips.run.tracks[0].values[1] - 42) < .00001);
  assert.ok(Math.abs(second.clips.run.tracks[0].values[4] - 56) < .00001);
  assert.deepEqual([...f.clips.run.tracks[0].values], values); assert.deepEqual(f.gltf.scene.toJSON(), before);
});
test('BUN native poses are grounded and fit the small companion height', () => {
  const f = fixture(), proto = prepare(f.gltf, f.clips), actor = create(proto);
  try {
    for (const clip of Object.values(proto.clips)) {
      actor.mixer.stopAllAction(); actor.mixer.clipAction(clip).setLoop(THREE.LoopOnce, 1).play();
      for (let i = 0; i <= 8; i++) { actor.mixer.setTime(clip.duration * i / 8); const b = box(actor.root); assert.ok(b.min.y >= -1e-6, b.min.y); assert.ok(b.max.y <= .720001, b.max.y); }
    }
  } finally { disposeActor(actor.root, actor.mixer); }
});
test('missing animation targets, absent clips and empty geometry cannot create a broken cosmetic', () => {
  const f = fixture(); f.clips.run.tracks.push(new THREE.VectorKeyframeTrack('missing.position', [0, 1], [0, 0, 0, 1, 1, 1]));
  assert.throws(() => prepare(f.gltf, f.clips), /target/i);
  const g = fixture(); assert.throws(() => prepare(g.gltf, { run: g.clips.run }), /clip/i);
  assert.throws(() => prepare({ scene: new THREE.Group() }, g.clips), /geometry|bounds/i);
});
test('BUN grounding includes native keyframes between regular sampling times', () => {
  const f = fixture();
  f.clips.run = new THREE.AnimationClip('run', .6, [new THREE.VectorKeyframeTrack('mixamorigHips.position', [0, .075, .15, .6], [0, .21, 0, 0, -.05, 0, 0, .21, 0, 0, .21, 0])]);
  const proto = prepare(f.gltf, f.clips), actor = create(proto);
  try {
    actor.mixer.stopAllAction(); actor.mixer.clipAction(proto.clips.run).play(); actor.mixer.setTime(.075);
    assert.ok(box(actor.root).min.y >= 0, 'feet at the original .075s key stay above the floor');
  } finally { disposeActor(actor.root, actor.mixer); }
});
test('BUN grounding measures the held final curious pose before returning to movement', () => {
  const f = fixture();
  f.clips.curious = new THREE.AnimationClip('curious', 2.4, [new THREE.VectorKeyframeTrack('mixamorigHips.position', [0, 2.399, 2.4], [0, 0, 0, 0, 0, 0, 0, -.1, 0])]);
  const actor = create(prepare(f.gltf, f.clips));
  try { actor.update(3, false); assert.ok(box(actor.root).min.y >= 0, 'the once-only animation holds a grounded endpoint'); }
  finally { disposeActor(actor.root, actor.mixer); }
});
test('two BUNs animate independently and disposal frees only the removed actor palette', () => {
  const f = fixture(), proto = prepare(f.gltf, f.clips), a = create(proto), b = create(proto), parent = new THREE.Group(); parent.add(a.root, b.root);
  const am = meshes(a.root)[0], bm = meshes(b.root)[0];
  assert.notEqual(am.skeleton, bm.skeleton); assert.notEqual(am.skeleton, f.mesh.skeleton);
  assert.equal(am.geometry, f.geometry); assert.equal(am.material, f.material);
  am.skeleton.computeBoneTexture(); bm.skeleton.computeBoneTexture();
  const deleted = watch(am.skeleton.boneTexture), retained = [f.geometry, f.material, bm.skeleton.boneTexture].map(watch);
  a.update(.3, true); b.update(.3, false); assert.notEqual(am.skeleton.bones[0].position.y, bm.skeleton.bones[0].position.y);
  const before = bm.skeleton.bones[0].position.toArray(); disposeActor(a.root, a.mixer);
  assert.equal(deleted(), 1); assert.ok(retained.every(count => count() === 0)); assert.equal(b.root.parent, parent);
  assert.deepEqual(bm.skeleton.bones[0].position.toArray(), before); b.update(.1, true); assert.notDeepEqual(bm.skeleton.bones[0].position.toArray(), before);
  disposeActor(a.root, a.mixer); assert.equal(deleted(), 1); disposeActor(b.root, b.mixer);
});
test('BUN animation freezes on paused or invalid time, rests after curious, and resumes running', () => {
  const f = fixture(), actor = create(prepare(f.gltf, f.clips));
  try {
    actor.update(3, false);
    const hips = meshes(actor.root)[0].skeleton.bones[0]; assert.ok(Math.abs(hips.position.y) < .00001, 'curious returns to rest');
    const before = hips.position.toArray(), clock = actor.mixer.time;
    for (const dt of [0, -1, NaN, Infinity]) actor.update(dt, true);
    assert.equal(actor.mixer.time, clock); assert.deepEqual(hips.position.toArray(), before);
    actor.update(.3, true); assert.ok(hips.position.y > 40, 'moving uses converted native run');
    actor.update(3, false); assert.ok(Math.abs(hips.position.y) < .00001);
  } finally { disposeActor(actor.root, actor.mixer); }
});
