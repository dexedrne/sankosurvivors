import * as THREE from 'three';
import { cloneActor, disposeActor, ownActorResource } from './character.js';
import { BUN_ANIMATIONS } from './bun-catalogue.js';
import { createBunFace } from './bun-face.js';

function bounds(root) {
  root.updateMatrixWorld(true);
  root.traverse(o => { if (o.isSkinnedMesh) o.skeleton.update(); });
  const box = new THREE.Box3().setFromObject(root, true);
  if (![...box.min, ...box.max].every(Number.isFinite) || box.max.y - box.min.y < .00001) throw new Error('BUN geometry bounds are invalid');
  return box;
}

export function prepareBun(gltf, sources) {
  if (!gltf?.scene?.isObject3D) throw new Error('BUN geometry is missing');
  const probe = cloneActor(gltf.scene), mixer = new THREE.AnimationMixer(probe), clips = {};
  try {
    const box = bounds(probe);
    for (const name of ['run', 'curious']) {
      const source = sources?.[name];
      if (!source?.tracks?.length || source.tracks.length > 64 || !Number.isFinite(source.duration) || source.duration <= 0 || source.duration > 5) throw new Error('BUN animation clip is invalid');
      const clip = source.clone();
      for (const track of clip.tracks) {
        const target = THREE.PropertyBinding.parseTrackName(track.name).nodeName;
        if (!THREE.PropertyBinding.findNode(probe, target)) throw new Error('BUN animation target is missing');
        if (track.name.endsWith('.position')) for (let i = 0; i < track.values.length; i++) track.values[i] *= BUN_ANIMATIONS.positionScaleOnLoad;
      }
      clips[name] = clip;
      const action = mixer.clipAction(clip); action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; action.play();
      const samples = Math.ceil(clip.duration * 240), times = new Set();
      for (let i = 0; i <= samples; i++) times.add(clip.duration * i / samples);
      // Include original keys as well as interpolated leg arcs when fitting the feet.
      for (const track of clip.tracks) for (const time of track.times) times.add(time);
      for (const time of [...times].sort((a, b) => a - b)) { mixer.setTime(time); box.union(bounds(probe)); }
      mixer.stopAllAction();
    }
    // Leave 5mm above/below the sampled envelope for interpolation between poses.
    const k = .71 / box.getSize(new THREE.Vector3()).y, center = box.getCenter(new THREE.Vector3());
    return { gltf, clips, k, x: -center.x * k, y: .005 - box.min.y * k, z: -center.z * k };
  } finally { disposeActor(probe, mixer); }
}

export function createBunActor(proto) {
  const root = new THREE.Group(), holder = new THREE.Group(), inner = cloneActor(proto.gltf.scene);
  root.add(holder); holder.add(inner); holder.scale.setScalar(proto.k); holder.position.set(proto.x, proto.y, proto.z);
  inner.traverse(o => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = false; } });
  const mixer = new THREE.AnimationMixer(inner), run = mixer.clipAction(proto.clips.run), curious = mixer.clipAction(proto.clips.curious);
  curious.setLoop(THREE.LoopOnce, 1); curious.clampWhenFinished = true; curious.play(); mixer.update(0);
  let moving = false, face = null, disposed = false;
  root.dispose = () => { disposed = true; face?.dispose(); };
  ownActorResource(root);
  return { root, inner, mixer, update(dt, nextMoving, expression = 'default') {
    if (disposed || !Number.isFinite(dt) || dt <= 0) return;
    // Pet previews isolate their renderer resources before the first update.
    face ||= createBunFace(inner, proto.faces);
    face.setExpression(expression === 'default' && nextMoving ? 'happy' : expression);
    nextMoving = !!nextMoving;
    if (nextMoving !== moving) {
      (moving ? run : curious).fadeOut(.15);
      (nextMoving ? run : curious).reset().fadeIn(.15).play(); moving = nextMoving;
    }
    mixer.update(dt);
  } };
}
