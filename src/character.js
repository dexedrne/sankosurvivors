// SankoQuest's modular human: a shared 25-bone Mixamo rig with separate meshes for head, hair, chest, arms,
// legs, hands, feet and armor pieces. Each part is re-bound to one master skeleton and animated with the game's own FBX clips.
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { ARMOR_TIERS } from './content.js';

const BASE = { chest: 'Chest/Styles/Shoulders', arms: 'Arms/Nude', legs: 'Legs/Styles/Pants', forearm: 'Hands/Forearm', feet: 'Feet/Feet', head: 'Head/Bald', neck: 'Head/Neck' };
const CLIP_NAMES = ['idle', 'run', 'walk', 'slash', 'hurt', 'death'];
const FOLDER = { head: 'Head', chest: 'Chest', hands: 'Hands', legs: 'Legs', feet: 'Feet', back: 'Back' };
const SUFFIX = { head: 'Helmet', chest: 'Chestplate', hands: 'Gauntlets', legs: 'Leggings', feet: 'Boots' };
const HAIR = ['Short', 'Long', 'Shaggy', 'Pomp', 'Middle Part', 'Buns', 'Sideswept', 'Liberty Spikes'];

// Cached model geometry, maps and materials remain shared; only actor-created resources belong to cleanup.
const actorResources = new WeakSet();
export function ownActorResource(resource) { actorResources.add(resource); return resource; }
const meshSkeletons = new WeakMap(), skeletonUsers = new WeakMap(), skeletonPools = new WeakMap();
function releaseSkeleton(mesh) {
  const skeleton = meshSkeletons.get(mesh); if (!skeleton) return;
  // Armor may leave while another body part still uses this palette.
  meshSkeletons.delete(mesh); actorResources.delete(skeleton);
  const users = skeletonUsers.get(skeleton) - 1;
  if (users) skeletonUsers.set(skeleton, users);
  else {
    skeletonUsers.delete(skeleton); skeleton.dispose();
    skeletonPools.get(skeleton)?.delete(skeleton); skeletonPools.delete(skeleton);
  }
}
function shareSkeleton(mesh, pool) {
  const current = mesh.skeleton;
  let shared;
  for (const candidate of pool) {
    if (candidate.bones.length === current.bones.length && candidate.bones.every((bone, i) => bone === current.bones[i] && candidate.boneInverses[i].equals(current.boneInverses[i]))) { shared = candidate; break; }
  }
  if (!shared) { shared = current; pool.add(shared); skeletonPools.set(shared, pool); }
  else if (shared !== current) current.dispose();
  mesh.skeleton = shared; meshSkeletons.set(mesh, shared);
  skeletonUsers.set(shared, (skeletonUsers.get(shared) || 0) + 1);
}
export function cloneActor(scene, skeletons = new Set()) {
  const root = SkeletonUtils.clone(scene);
  root.traverse(o => { if (o.isSkinnedMesh) shareSkeleton(o, skeletons); });
  return root;
}
export function disposeActor(root, mixer) {
  mixer?.stopAllAction?.();
  if (mixer?.getRoot) mixer.uncacheRoot(mixer.getRoot());
  root.removeFromParent();
  root.traverse(o => {
    releaseSkeleton(o);
    for (const resource of [o, o.skeleton, o.geometry, ...[].concat(o.material || [])]) {
      if (resource && actorResources.delete(resource)) resource.dispose();
    }
  });
}

export function armorSet(level) {
  if (!level) return {};
  const t = ARMOR_TIERS[Math.min(level, ARMOR_TIERS.length) - 1];
  const o = {}; for (const k of Object.keys(SUFFIX)) o[k] = `${t} ${SUFFIX[k]}`;
  return o;
}

export async function createCharacterKit(loadGLB, A, armorNames = []) {
  const fbx = new FBXLoader();
  const clips = {}, clipRest = new WeakMap();
  const boneKey = (name) => String(name).replace(/^mixamorig[:_]?/, '');
  await Promise.all(CLIP_NAMES.map(async (n) => {
    try {
      const o = await fbx.loadAsync(A(`anim/${n}.fbx`));
      if (o.animations[0]) {
        o.animations[0].name = n; clips[n] = o.animations[0];
        // Initial posed rotations are used only to align rigs whose hips are turned differently.
        const rest = new Map(); o.traverse((b) => { if (b.isBone) rest.set(boneKey(b.name), b.quaternion.clone()); });
        clipRest.set(clips[n], rest);
      }
    } catch (e) { console.warn('anim failed', n, e); }
  }));
  if (!clips.idle) throw new Error('character animations missing');

  // an item model's own axes: its length (grip toward the far end) and its thinnest direction (blade or shield face normal)
  const axesCache = new WeakMap();
  function itemAxes(scene) {
    if (axesCache.has(scene)) return axesCache.get(scene);
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene, true), size = box.getSize(new THREE.Vector3());
    const order = [0, 1, 2].sort((a, b) => size.getComponent(b) - size.getComponent(a));
    const L = order[0], T = order[2];
    const tip = new THREE.Vector3(); tip.setComponent(L, Math.abs(box.max.getComponent(L)) >= Math.abs(box.min.getComponent(L)) ? 1 : -1);
    const thin = new THREE.Vector3(); thin.setComponent(T, 1);
    const r = { tip, thin }; axesCache.set(scene, r); return r;
  }
  const url = (path) => A('models/playerCharacter/' + path.split('/').map(encodeURIComponent).join('/') + '.glb');
  const ready = new Map(); // path -> gltf | null
  async function load(path) {
    if (ready.has(path)) return ready.get(path);
    let g = null; try { g = await loadGLB(url(path)); } catch { g = null; }
    ready.set(path, g); return g;
  }
  const clothing = (slot, name) => `${FOLDER[slot]}/Clothing/${name}`;
  const want = [...Object.values(BASE), ...HAIR.map((h) => `Head/Styles/${h}`), ...armorNames];
  await Promise.all(want.map(load));
  const masterGltf = ready.get(BASE.chest);
  if (!masterGltf) throw new Error('character base missing');
  const rigRest = new Map(), rigBones = new Map();
  masterGltf.scene.updateMatrixWorld(true);
  masterGltf.scene.traverse(b => { if (b.isBone) { rigRest.set(boneKey(b.name), b.quaternion.clone()); rigBones.set(b.name, b); } });

  // The game plays these FBX clips unscaled on the GLB rig (the rig's Armature node carries the 0.0047 cm->m scale),
  // and the bone names already match, so the clips are used as they are.
  const scaled = clips;

  // The part files name their materials: SKIN_TOP (skin), Eyes.Color, Hair.Color, Color.* (clothing).
  const paint = (m, pal) => {
    const c = ownActorResource(m.clone());
    const n = m.name || '';
    if (n === 'SKIN_TOP') c.color.set(pal.skin);
    else if (n === 'Hair.Color') c.color.set(pal.hair);
    else if (/^Color/.test(n) && pal.cloth != null) c.color.set(pal.cloth);
    return c;
  };
  const paintMesh = (sm, pal) => { sm.material = Array.isArray(sm.material) ? sm.material.map((m) => paint(m, pal)) : paint(sm.material, pal); };
  // Every part file carries its own armature transform (units, axes), so each is mapped onto the master rig by
  // matching a body frame (hips, head, arms), then skinned against the master's rest pose.
  const frameOf = (pos) => {
    const o = pos('Hips'), top = pos('HeadTop_End'), la = pos('LeftArm'), ra = pos('RightArm');
    const up = top.clone().sub(o); const len = up.length() || 1; up.normalize();
    const side = la.clone().sub(ra); side.addScaledVector(up, -side.dot(up)).normalize();
    const fwd = new THREE.Vector3().crossVectors(side, up).normalize();
    return { m: new THREE.Matrix4().makeBasis(side, up, fwd).setPosition(o), len };
  };
  function bindParts(masterRest, masterBones, gltf, pal, skeletons) {
    const clone = cloneActor(gltf.scene); const found = [];
    clone.updateMatrixWorld(true);
    clone.traverse((o) => { if (o.isSkinnedMesh) found.push(o); });
    const armBones = new Map(); clone.traverse((o) => { if (o.isBone) armBones.set(o.name, o); });
    const armPos = (n) => new THREE.Vector3().setFromMatrixPosition(armBones.get(`mixamorig_${n}`).matrixWorld);
    const mastPos = (n) => new THREE.Vector3().setFromMatrixPosition(masterRest.get(`mixamorig_${n}`));
    let T = new THREE.Matrix4();
    try {
      const fa = frameOf(armPos), fm = frameOf(mastPos), sc = fm.len / fa.len;
      T = fm.m.clone().multiply(new THREE.Matrix4().makeScale(sc, sc, sc)).multiply(fa.m.clone().invert());
    } catch { T = new THREE.Matrix4(); }
    for (const sm of found) {
      const names = sm.skeleton.bones.map((b) => b.name);
      const bones = names.map((n) => masterBones.get(n) || sm.skeleton.bones[names.indexOf(n)]);
      const inv = names.map((n) => (masterRest.get(n) ? masterRest.get(n).clone().invert() : new THREE.Matrix4()));
      releaseSkeleton(sm);
      sm.bind(new THREE.Skeleton(bones, inv), T.clone().multiply(sm.bindMatrix));
      shareSkeleton(sm, skeletons);
      sm.frustumCulled = false;
      if (pal) paintMesh(sm, pal);
      sm.position.set(0, 0, 0); sm.quaternion.identity(); sm.scale.set(1, 1, 1); sm.updateMatrix();
      sm.parent && sm.parent.remove(sm);
    }
    return found;
  }

  // spec: { hair, skin, hairColor, shirt, pants, armor: {head,chest,hands,legs,feet,back}, h }
  function build(spec = {}) {
    const skeletons = new Set(), master = cloneActor(masterGltf.scene, skeletons);
    master.updateMatrixWorld(true);
    const bones = new Map(), rest = new Map(); master.traverse((o) => { if (o.isBone) { bones.set(o.name, o); rest.set(o.name, o.matrixWorld.clone()); } });
    const skin = spec.skin ?? 0xdfaa8b, shirt = spec.shirt ?? 0xb98a45, pants = spec.pants ?? 0x4a4f63, hairC = spec.hairColor ?? 0x6b4423;
    const base = {}, extra = { hair: [], armor: [] };
    const chest = []; master.traverse((o) => { if (o.isSkinnedMesh) chest.push(o); });
    for (const sm of chest) { sm.frustumCulled = false; paintMesh(sm, { skin, hair: hairC, cloth: shirt }); }
    base.chest = chest;
    const add = (list) => { for (const sm of list) master.add(sm); return list; };
    const mk = (key, cloth) => { const g = ready.get(BASE[key]); base[key] = g ? add(bindParts(rest, bones, g, { skin, hair: hairC, cloth }, skeletons)) : []; };
    mk('arms', shirt); mk('legs', pants); mk('forearm', shirt); mk('feet', pants); mk('head', shirt); mk('neck', shirt);

    // The FBX clips are authored Z-up, so the animated rig has to be turned -90 degrees about X (the game does the same).
    const root = new THREE.Group(), holder = new THREE.Group();
    holder.rotation.x = -Math.PI / 2; holder.add(master); root.add(holder);
    const mixer = new THREE.AnimationMixer(master);
    const act = {}; for (const n of Object.keys(scaled)) { act[n] = mixer.clipAction(scaled[n]); }
    act.idle.play(); let cur = 'idle';
    // size and ground the figure in its animated idle pose
    mixer.update(0); root.updateMatrixWorld(true);
    {
      const box = new THREE.Box3().setFromObject(root, true), size = box.getSize(new THREE.Vector3());
      const k = size.y > 0.01 ? (spec.h || 1.6) / size.y : 1; // people stand ~1.6, as in SankoQuest
      holder.scale.setScalar(k);
      holder.position.set(-(box.min.x + box.max.x) / 2 * k, -box.min.y * k, -(box.min.z + box.max.z) / 2 * k);
    }
    for (const n of ['slash', 'hurt']) if (act[n]) { act[n].setLoop(THREE.LoopOnce, 1); act[n].clampWhenFinished = false; }
    // a swing is quick and lands with its slash effect: the borrowed clip is slower than a fight, so it plays in ~0.45 s
    if (act.slash) act.slash.timeScale = Math.max(1, act.slash.getClip().duration / 0.45);

    const inst = {
      root, master, mixer, spec, yaw0: 0,
      setMoving(moving, speedScale = 1) {
        const want = moving ? 'run' : 'idle';
        if (want !== cur && act[want]) { act[want].reset().fadeIn(0.15).play(); act[cur] && act[cur].fadeOut(0.15); cur = want; }
        if (act.run) act.run.timeScale = speedScale;
      },
      play(name) { if (act[name]) { act[name].reset().setEffectiveWeight(1).fadeIn(0.05).play(); } },
      setArmor(a = {}) {
        for (const sm of extra.armor) disposeActor(sm);
        extra.armor = [];
        for (const slot of Object.keys(SUFFIX).concat('back')) {
          const name = a[slot]; if (!name) continue;
          const g = ready.get(clothing(slot, name)); if (!g) { console.warn('armor missing', slot, name); continue; }
          const parts = bindParts(rest, bones, g, null, skeletons); if (!parts.length) console.warn('armor has no skinned meshes', slot, name);
          extra.armor.push(...add(parts));
          if (typeof location !== 'undefined' && location.search.includes('dbgarmor')) { root.updateMatrixWorld(true); for (const sm of parts) { const b = new THREE.Box3().setFromObject(sm, true), z = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3()); console.warn('ARMOR', slot, name, sm.name, 'size', z.x.toFixed(2), z.y.toFixed(2), z.z.toFixed(2), 'center', c.x.toFixed(2), c.y.toFixed(2), c.z.toFixed(2), 'vis', sm.visible, 'mat', sm.material && sm.material.type, 'tr', sm.material && sm.material.transparent, 'op', sm.material && sm.material.opacity); } const bb = new THREE.Box3().setFromObject(root, true).getSize(new THREE.Vector3()); console.warn('ROOT size', bb.x.toFixed(2), bb.y.toFixed(2), bb.z.toFixed(2)); }
        }
        const vis = (list, v) => list && list.forEach((m) => { m.visible = v; });
        vis(base.chest, !a.chest); vis(base.arms, !a.chest); vis(base.legs, !a.legs); vis(base.forearm, !a.hands); vis(base.feet, !a.feet);
        vis(extra.hair, !a.head);
        if (extra.hair.length) vis(base.head, !!a.head);
      },
    };
    // hair
    // a hair style file is the whole head (skin, eyes and hair), so it replaces the bald head
    if (spec.hair && ready.get(`Head/Styles/${spec.hair}`)) { extra.hair = add(bindParts(rest, bones, ready.get(`Head/Styles/${spec.hair}`), { skin, hair: hairC, cloth: shirt }, skeletons)); for (const m of base.head) m.visible = false; }
    inst.setArmor(spec.armor || {});
    // Items held in the hands. Each item is aimed in the character's own terms (forward / up / outward) from how the
    // hands sit in the idle pose, so a blade points ahead, a staff stands up and a shield faces out, whatever the bone axes are.
    const heldObjs = [];
    inst.setHeld = (held = {}) => {
      for (const o of heldObjs) disposeActor(o);
      heldObjs.length = 0; root.updateMatrixWorld(true);
      for (const side of ['Right', 'Left']) {
        const key = side.toLowerCase(), g = held[key], bone = bones.get(`mixamorig_${side}Hand`);
        if (!g || !bone) continue;
        const obj = g.scene.clone(true); obj.traverse((o) => { o.frustumCulled = false; if (o.isMesh) o.castShadow = true; });
        const ws = new THREE.Vector3(); bone.getWorldScale(ws);
        const wrap = new THREE.Group(); wrap.scale.setScalar((holder.scale.x / (ws.x || 1)) * (held[key + 'Scale'] || 1)); wrap.add(obj);
        const aim = held[key + 'Aim'], fr = inst.handFrame && inst.handFrame[side], fix = held[key + 'Fix'];
        if (fix) { // the game's own attachment: offset, scale and rotation straight in the hand bone's frame
          wrap.position.set(...fix.offset); wrap.scale.set(...fix.scale.map((v) => v * (held[key + 'Scale'] || 1))); wrap.rotation.set(...fix.rotation);
        } else if (aim && fr) {
          const ax = itemAxes(g.scene);
          const v = (w) => new THREE.Vector3().addScaledVector(fr.F, w[0]).addScaledVector(fr.U, w[1]).addScaledVector(fr.O, w[2]);
          const d = v(aim.tip).normalize(); const n = v(aim.thin); n.addScaledVector(d, -n.dot(d)).normalize();
          const tipS = ax.tip.clone().multiplyScalar(aim.flip ? -1 : 1), thinS = ax.thin.clone().multiplyScalar(aim.thinSign || 1);
          const S = new THREE.Matrix4().makeBasis(tipS, thinS, tipS.clone().cross(thinS));
          const T = new THREE.Matrix4().makeBasis(d, n, d.clone().cross(n));
          wrap.quaternion.setFromRotationMatrix(T.multiply(S.transpose()));
          if (fr.palm) wrap.position.copy(fr.palm); // grip sits in the palm, not at the wrist
        } else if (held[key + 'Rot']) wrap.rotation.set(...held[key + 'Rot']);
        bone.add(wrap); heldObjs.push(wrap);
      }
    };
    // Work out which way the rig really faces in its animated pose (toes point forward), so turning is always right.
    try {
      mixer.update(0); master.updateMatrixWorld(true);
      const a = new THREE.Vector3(), b = new THREE.Vector3(); let fx = 0, fz = 0;
      for (const side of ['Left', 'Right']) {
        const foot = bones.get(`mixamorig_${side}Foot`), toe = bones.get(`mixamorig_${side}ToeBase`);
        if (foot && toe) { foot.getWorldPosition(a); toe.getWorldPosition(b); fx += b.x - a.x; fz += b.z - a.z; }
      }
      inst.yaw0 = Math.hypot(fx, fz) > 1e-5 ? Math.atan2(fx, fz) : 0;
    } catch { inst.yaw0 = 0; }
    // the character's forward / up / outward directions, seen from each hand bone in the idle pose
    try {
      root.updateMatrixWorld(true);
      const F = new THREE.Vector3(Math.sin(inst.yaw0), 0, Math.cos(inst.yaw0)), U = new THREE.Vector3(0, 1, 0), R = F.clone().cross(U);
      inst.handFrame = {};
      for (const side of ['Right', 'Left']) {
        const bone = bones.get(`mixamorig_${side}Hand`); if (!bone) continue;
        const q = bone.getWorldQuaternion(new THREE.Quaternion()).invert();
        // palm: a little way from the wrist toward the fingers (the hand bone's own +Y), in bone units
        const child = bone.children.find((c) => c.isBone);
        const palmLen = child ? child.position.length() * 0.5 : 0;
        inst.handFrame[side] = { F: F.clone().applyQuaternion(q), U: U.clone().applyQuaternion(q), O: (side === 'Right' ? R : R.clone().negate()).applyQuaternion(q), palm: palmLen ? new THREE.Vector3(0, palmLen, 0) : null };
      }
    } catch (e) { inst.handFrame = null; }
    return inst;
  }
  // Animate a mob that ships as a bare Mixamo rig (no clips of its own: Skelly, the Stars) with the game's own walk clip.
  // Each file stores its rig in a different axis convention, so the figure is stood upright from where its head ends up.
  // The shared Mixamo clips set every bone's rotation outright, made for their own rig's rest pose, and move the hips in
  // that rig's space. A rig whose bones rest differently (Survival Sankson: Z-up, legs turned another way) would fold up,
  // so it gets each bone's change from the neutral master rig instead. An FBX scene starts posed, not at bind rest.
  const fitted = new WeakMap();
  // fit 'hips': the same rig with only its hips bone turned (Skelly's is flipped 180 degrees): every other bone plays the
  // clip as it is, the hips get their change from rest, and the hips stay in place
  function fitClip(clip, bones, force = false) {
    const hip = bones.get('mixamorig_Hips'), track = clip && clip.tracks.find((t) => /Hips\.position$/.test(t.name));
    if (!hip || !track) return clip;
    const rest = hip.position.clone(), moved = new THREE.Vector3(track.values[0], track.values[1], track.values[2]);
    if (!(rest.length() > 0 && moved.length() > 0)) return clip;
    const k = rest.length() / moved.length(), cos = rest.normalize().dot(moved.normalize());
    if (!force && k > 0.5 && k < 2 && cos > 0.7) return clip; // the same kind of rig: play the clip as it is
    const hipsOnly = force === 'hips';
    let byRig = fitted.get(clip); if (!byRig) fitted.set(clip, (byRig = new WeakMap()));
    if (byRig.has(hip)) return byRig.get(hip);
    const src = hipsOnly ? (clipRest.get(clip) || new Map()) : rigRest, c = clip.clone(), q = new THREE.Quaternion(), inv = new THREE.Quaternion();
    const frameQuat = rig => new THREE.Quaternion().setFromRotationMatrix(frameOf(n => rig.get('mixamorig_' + n).getWorldPosition(new THREE.Vector3())).m);
    const axes = hipsOnly ? null : frameQuat(rigBones).multiply(frameQuat(bones).invert());
    c.tracks = c.tracks.filter((t) => !/\.position$/.test(t.name));
    for (const t of c.tracks) {
      if (!/\.quaternion$/.test(t.name)) continue;
      const key = boneKey(t.name.replace(/\.quaternion$/, '')), b = bones.get('mixamorig_' + key), s0 = src.get(key);
      if (!b || !s0 || (hipsOnly && key !== 'Hips')) continue;
      inv.copy(s0).invert(); const r = b.quaternion;
      // Express the source motion in this joint's own bind axes.
      const basis = hipsOnly ? null : rigBones.get('mixamorig_' + key).getWorldQuaternion(new THREE.Quaternion()).invert().multiply(axes).multiply(b.getWorldQuaternion(new THREE.Quaternion()));
      const before = basis ? r.clone().multiply(basis.clone().invert()).multiply(inv) : null;
      for (let i = 0; i < t.values.length; i += 4) {
        q.fromArray(t.values, i);
        if (basis) q.premultiply(before).multiply(basis); else q.premultiply(inv).premultiply(r);
        q.toArray(t.values, i);
      }
    }
    byRig.set(hip, c);
    return c;
  }
  function animate(gltf, h = 1.6, clipName = 'walk', { zUp = false, fromRest = false } = {}) {
    const master = cloneActor(gltf.scene);
    const bones = new Map();
    master.traverse((o) => { o.frustumCulled = false; if (o.isBone) { if (/^mixamorig(?!_)/.test(o.name)) o.name = o.name.replace(/^mixamorig:?/, 'mixamorig_'); bones.set(o.name, o); } });
    const root = new THREE.Group(), holder = new THREE.Group(); holder.add(master); root.add(holder);
    root.updateMatrixWorld(true);
    const mixer = new THREE.AnimationMixer(master);
    mixer.clipAction(fitClip(clips[clipName] || clips.run || clips.idle, bones, fromRest)).play();
    mixer.update(0); root.updateMatrixWorld(true);
    const hip = bones.get('mixamorig_Hips'), top = bones.get('mixamorig_HeadTop_End') || bones.get('mixamorig_Head');
    if (zUp) { holder.rotation.x = -Math.PI / 2; root.updateMatrixWorld(true); } // like the player rig: the clips are Z-up
    else if (hip && top) {
      // stand the figure up along feet -> head (straighter than hips -> head in an idle pose)
      const lf = bones.get('mixamorig_LeftFoot'), rf = bones.get('mixamorig_RightFoot');
      const base = lf && rf ? lf.getWorldPosition(new THREE.Vector3()).add(rf.getWorldPosition(new THREE.Vector3())).multiplyScalar(0.5) : hip.getWorldPosition(new THREE.Vector3());
      const up = top.getWorldPosition(new THREE.Vector3()).sub(base).normalize();
      holder.quaternion.setFromUnitVectors(up, new THREE.Vector3(0, 1, 0)); root.updateMatrixWorld(true);
    }
    const box = new THREE.Box3().setFromObject(root, true), size = box.getSize(new THREE.Vector3());
    const k = size.y > 1e-4 ? h / size.y : 1;
    holder.scale.setScalar(k);
    holder.position.set(-(box.min.x + box.max.x) / 2 * k, -box.min.y * k, -(box.min.z + box.max.z) / 2 * k);
    root.updateMatrixWorld(true);
    let yaw0 = 0;
    try {
      const a = new THREE.Vector3(), b = new THREE.Vector3(); let fx = 0, fz = 0;
      for (const side of ['Left', 'Right']) { const foot = bones.get(`mixamorig_${side}Foot`), toe = bones.get(`mixamorig_${side}ToeBase`); if (foot && toe) { foot.getWorldPosition(a); toe.getWorldPosition(b); fx += b.x - a.x; fz += b.z - a.z; } }
      yaw0 = Math.hypot(fx, fz) > 1e-6 ? Math.atan2(fx, fz) : 0;
    } catch { yaw0 = 0; }
    return { root, inner: master, mixer, kit: { yaw0 } };
  }
  return { build, load, animate, isLoaded: (path) => !!ready.get(path), clothingPath: clothing, hasHair: (h) => !!ready.get(`Head/Styles/${h}`) };
}
