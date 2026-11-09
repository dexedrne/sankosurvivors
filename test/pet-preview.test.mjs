import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { cloneActor, ownActorResource } from '../src/character.js';

const preview = await import('../src/pet-preview.js').catch(error => {
  if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
  return {};
});
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
function setup(load = async id => id) {
  assert.equal(typeof preview.createPetPreview, 'function');
  const canvas = { clientWidth: 320, clientHeight: 240 }, actors = [], disposed = [];
  const geometry = new THREE.BoxGeometry(2, 4, 1), texture = new THREE.Texture(), material = new THREE.MeshStandardMaterial({ map: texture });
  geometry.addEventListener('dispose', () => disposed.push('shared geometry'));
  texture.addEventListener('dispose', () => disposed.push('shared texture'));
  material.addEventListener('dispose', () => disposed.push('shared material'));
  const proto = new THREE.Group(), mesh = new THREE.Mesh(geometry, material); mesh.position.set(9, 7, -3); proto.add(mesh);
  const renderer = { frames: 0, clears: 0, disposed: 0, lost: 0,
    setPixelRatio() {}, setSize() {}, clear() { this.clears++; },
    render(scene, camera) { this.scene = scene; this.camera = camera; this.frames++; },
    dispose() { this.disposed++; }, forceContextLoss() { this.lost++; },
  };
  const viewer = preview.createPetPreview({ canvas, renderer, load, choice: id => ['chicken', 'fox', 'bun:Mini'].includes(id) ? id : null,
    spawn(_ready, id) {
      const root = cloneActor(proto); root.name = id;
      root.children[0].material = ownActorResource(material.clone());
      root.children[0].material.addEventListener('dispose', () => disposed.push(id));
      const mixer = new THREE.AnimationMixer(root), clip = new THREE.AnimationClip('idle', 1, [new THREE.NumberKeyframeTrack('.scale[y]', [0, 1], [1, 1.05])]);
      mixer.clipAction(clip).setLoop(THREE.LoopOnce, 1).play();
      const actor = { root, mixer, update(dt) { mixer.update(dt); } }; actors.push(actor); return actor;
    },
  });
  return { viewer, renderer, canvas, actors, disposed, geometry, material, texture };
}

test('out-of-order preview loads cannot replace the latest choice, including A to B to A', async () => {
  const requests = [], s = setup(id => { const pending = deferred(); requests.push(pending); return pending.promise; });
  const first = s.viewer.set('chicken'), middle = s.viewer.set('fox'), current = s.viewer.set('chicken');
  requests[2].resolve('current'); assert.equal(await current, true); s.viewer.draw(.1);
  const actor = s.actors[0]; assert(actor.root.parent); assert.equal(s.viewer.state(), 'ready');
  requests[0].resolve('old'); requests[1].resolve('old');
  assert.equal(await first, false); assert.equal(await middle, false); s.viewer.draw(.1);
  assert.equal(s.actors.length, 1); assert(actor.root.parent); s.viewer.dispose();
});

test('ownership loss rejects pending BUNs and removes loaded actors without disposing cached resources', async () => {
  const pending = deferred(), s = setup(() => pending.promise); let allowed = true;
  const loading = s.viewer.set('bun:Mini', () => allowed); allowed = false; pending.resolve('bun');
  assert.equal(await loading, false); assert.equal(s.actors.length, 0); assert.equal(s.viewer.state(), 'idle');
  allowed = true; assert.equal(await s.viewer.set('bun:Mini', () => allowed), true); s.viewer.draw(.1);
  const actor = s.actors[0]; assert(actor.root.parent);
  allowed = false; s.viewer.draw(.1); assert.equal(actor.root.parent, null); assert.equal(s.viewer.state(), 'idle');
  assert.deepEqual(s.disposed, ['bun:Mini']);
  allowed = true; s.viewer.draw(.1); assert.equal(s.actors.length, 1); assert.equal(actor.root.parent, null);
  assert.equal(await s.viewer.set('bun:Mini', () => { throw Error('account changed'); }), false);
  s.viewer.dispose(); assert.deepEqual(s.disposed, ['bun:Mini']);
});

test('closing during load permanently releases the renderer and cannot resurrect an actor', async () => {
  const pending = deferred(), s = setup(() => pending.promise), loading = s.viewer.set('fox');
  s.viewer.dispose(); s.viewer.dispose(); pending.resolve('fox'); assert.equal(await loading, false);
  s.viewer.draw(.1); s.viewer.rotate(1); s.viewer.resetRotation();
  assert.equal(await s.viewer.set('chicken'), false); assert.equal(s.actors.length, 0);
  assert.equal(s.renderer.frames, 0); assert.equal(s.renderer.disposed, 1); assert.equal(s.renderer.lost, 1); assert.equal(s.viewer.state(), 'disposed');
});

test('preview GPU resources are isolated from cached models and all released on close', async () => {
  const s = setup(); await s.viewer.set('fox'); s.viewer.draw(0);
  const mesh = s.actors[0].root.children[0], released = [];
  assert.notEqual(mesh.geometry, s.geometry); assert.notEqual(mesh.material, s.material); assert.notEqual(mesh.material.map, s.texture);
  assert.equal(mesh.material.map.source, s.texture.source, 'image data stays cached without another decode');
  for (const [name, resource] of [['geometry', mesh.geometry], ['material', mesh.material], ['texture', mesh.material.map]]) resource.addEventListener('dispose', () => released.push(name));
  s.viewer.dispose(); assert.deepEqual(released.sort(), ['geometry', 'material', 'texture']);
  assert(!s.disposed.some(name => name.startsWith('shared')));
});

test('rotation shows all sides, reset restores the front and actual offset bounds fit portrait and landscape', async () => {
  const s = setup(); await s.viewer.set('fox'); s.viewer.draw(.1); const actor = s.actors[0];
  const front = actor.root.getWorldQuaternion(new THREE.Quaternion());
  s.viewer.rotate(Math.PI / 2); s.viewer.draw(.1);
  assert(Math.abs(actor.root.getWorldQuaternion(new THREE.Quaternion()).angleTo(front) - Math.PI / 2) < 1e-9);
  for (const [width, height] of [[180, 320], [640, 180]]) {
    s.canvas.clientWidth = width; s.canvas.clientHeight = height;
    for (let side = 0; side < 4; side++) {
      s.viewer.rotate(Math.PI / 2); s.viewer.draw(0);
      actor.root.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(actor.root, true);
      for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
        const point = new THREE.Vector3(x, y, z).project(s.renderer.camera);
        assert(Math.abs(point.x) < 1 && Math.abs(point.y) < 1 && Math.abs(point.z) < 1, `clipped ${point.toArray()}`);
      }
    }
  }
  s.viewer.rotate(NaN); s.viewer.rotate(Infinity); s.viewer.resetRotation(); s.viewer.draw(0);
  assert(actor.root.getWorldQuaternion(new THREE.Quaternion()).angleTo(front) < 1e-9);
  for (let frame = 0; frame < 30; frame++) s.viewer.draw(.1);
  assert(actor.mixer.time > 2); assert(actor.root.scale.y > 1, 'native one-shot idle keeps animating in the viewer');
  s.viewer.dispose(); assert.equal(actor.root.parent, null); assert.deepEqual(s.disposed, ['fox']);
});

test('disable and a failed asset clear the visible actor, then an explicit retry recovers', async () => {
  let fail = false; const s = setup(async id => { if (fail) throw Error('asset unavailable'); return id; });
  await s.viewer.set('chicken'); s.viewer.draw(.1); const actor = s.actors[0];
  fail = true; assert.equal(await s.viewer.set('fox'), false); assert.equal(actor.root.parent, null); assert.equal(s.viewer.state(), 'unavailable');
  fail = false; assert.equal(await s.viewer.set('fox'), true); s.viewer.draw(.1); assert(s.actors[1].root.parent);
  assert.equal(await s.viewer.set(null), true); assert.equal(s.actors[1].root.parent, null); assert.equal(s.viewer.state(), 'idle'); s.viewer.dispose();
});
