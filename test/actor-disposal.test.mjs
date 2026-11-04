import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as character from '../src/character.js';

const renderer = readFileSync(new URL('../src/render.js', import.meta.url), 'utf8');
const instantiateCode = renderer.slice(renderer.indexOf('  function instantiate('), renderer.indexOf('  // Orient a (non-skinned)'));
function prototype() {
  const scene = new THREE.Group(), hip = new THREE.Bone(); hip.name = 'mixamorig_Hips';
  const bones = [hip];
  for (const [name, x, y] of [['HeadTop_End', 0, 1], ['LeftArm', -0.5, 0.7], ['RightArm', 0.5, 0.7]]) {
    const bone = new THREE.Bone(); bone.name = 'mixamorig_' + name; bone.position.set(x, y, 0); hip.add(bone); bones.push(bone);
  }
  scene.add(hip);
  const geometry = new THREE.BoxGeometry(1, 1, 1), count = geometry.attributes.position.count;
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Uint16Array(count * 4), 4));
  const weights = new Float32Array(count * 4); for (let i = 0; i < count; i++) weights[i * 4] = 1;
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
  const map = new THREE.Texture(), material = new THREE.MeshBasicMaterial({ map });
  const mesh = new THREE.SkinnedMesh(geometry, material); scene.add(mesh); scene.updateMatrixWorld(true);
  mesh.bind(new THREE.Skeleton(bones));
  return { gltf: { scene, animations: [new THREE.AnimationClip('idle', 1, [])] }, k: 1, minY: 0, cx: 0, cz: 0, mesh, geometry, material, map };
}
function skeletons(root) { const all = new Set(); root.traverse(o => { if (o.isSkinnedMesh) all.add(o.skeleton); }); return [...all]; }
function watch(resource) { const state = { disposed: 0 }; resource.addEventListener('dispose', () => state.disposed++); return state; }
function textures(root) { return skeletons(root).map(skeleton => { if (!skeleton.boneTexture) skeleton.computeBoneTexture(); return watch(skeleton.boneTexture); }); }
function instantiate(proto) {
  return Function('THREE', 'SkeletonUtils', 'cloneActor', 'ownActorResource', `${instantiateCode}; return instantiate;`)(THREE, SkeletonUtils, character.cloneActor, character.ownActorResource)(proto);
}

test('native actor disposal frees bone textures and owned materials without touching cached or live resources', () => {
  assert.equal(typeof character.disposeActor, 'function');
  const proto = prototype(), cached = [proto.geometry, proto.material, proto.map].map(watch), cachedBones = textures(proto.gltf.scene);
  const first = instantiate(proto), second = instantiate(proto), parent = new THREE.Group(); parent.add(first.root, second.root);
  const firstTextures = textures(first.root), secondTextures = textures(second.root), firstMaterials = [], secondMaterials = [];
  first.root.traverse(o => { if (o.isMesh) for (const material of [].concat(o.material)) firstMaterials.push(watch(material)); });
  second.root.traverse(o => { if (o.isMesh) for (const material of [].concat(o.material)) secondMaterials.push(watch(material)); });
  // A cached held object can share a skeleton/material; owning the actor must not imply owning that attachment.
  first.root.add(proto.gltf.scene.clone(true));
  character.disposeActor(first.root, first.mixer);
  assert.equal(first.root.parent, null); assert.equal(second.root.parent, parent);
  assert.ok(firstTextures.every(x => x.disposed === 1)); assert.ok(firstMaterials.every(x => x.disposed === 1));
  assert.ok([...secondTextures, ...secondMaterials, ...cached, ...cachedBones].every(x => x.disposed === 0));
  assert.equal(first.mixer.stats.actions.total, 0);
  character.disposeActor(first.root, first.mixer);
  assert.ok(firstTextures.every(x => x.disposed === 1)); assert.ok(firstMaterials.every(x => x.disposed === 1));
});

test('armor replacement releases old per-instance skeletons while keeping the base body and shared armor materials', async t => {
  const proto = prototype();
  t.mock.method(FBXLoader.prototype, 'loadAsync', async () => ({ animations: [new THREE.AnimationClip('fixture', 1, [])], traverse: fn => proto.gltf.scene.traverse(fn) }));
  const kit = await character.createCharacterKit(async () => proto.gltf, x => x, ['Chest/Clothing/Iron Chestplate', 'Chest/Clothing/Steel Chestplate']);
  const actor = kit.build({ armor: { chest: 'Iron Chestplate' } }), oldMeshes = [];
  actor.root.traverse(o => { if (o.isSkinnedMesh) oldMeshes.push(o); });
  const oldArmor = oldMeshes.filter(o => o.material === proto.material);
  assert.ok(oldArmor.length > 0);
  const shared = [proto.material, proto.geometry, proto.map].map(watch), boneTextures = new Map();
  for (const mesh of oldMeshes) { mesh.skeleton.computeBoneTexture(); boneTextures.set(mesh, watch(mesh.skeleton.boneTexture)); }
  actor.setArmor({ chest: 'Steel Chestplate' });
  assert.ok(oldArmor.every(mesh => mesh.parent === null && boneTextures.get(mesh).disposed === 1));
  assert.ok(oldMeshes.filter(mesh => !oldArmor.includes(mesh)).every(mesh => boneTextures.get(mesh).disposed === 0));
  assert.ok(shared.every(x => x.disposed === 0));
  assert.equal(typeof character.disposeActor, 'function');
  const newTextures = textures(actor.root), painted = [];
  actor.root.traverse(o => { if (o.isMesh) for (const material of [].concat(o.material)) if (material !== proto.material) painted.push(watch(material)); });
  character.disposeActor(actor.root, actor.mixer);
  assert.ok(newTextures.every(x => x.disposed === 1)); assert.ok(painted.length > 0 && painted.every(x => x.disposed === 1));
  assert.ok(shared.every(x => x.disposed === 0));
});

test('actor cleanup releases only owned attachment geometry and materials, never shared textures', () => {
  assert.equal(typeof character.ownActorResource, 'function');
  const root = new THREE.Group(), proto = prototype();
  const geometry = character.ownActorResource(new THREE.PlaneGeometry()), material = character.ownActorResource(proto.material.clone());
  const owned = [geometry, material].map(watch), shared = [proto.map, proto.geometry, proto.material].map(watch);
  root.add(new THREE.Mesh(geometry, material), new THREE.Mesh(proto.geometry, proto.material));
  character.disposeActor(root);
  assert.ok(owned.every(x => x.disposed === 1)); assert.ok(shared.every(x => x.disposed === 0));
});

test('renderer reset releases enemy, corpse, player and NPC actors', () => {
  const proto = prototype(), actor = () => instantiate(proto);
  const a = actor(), corpse = actor(), player = actor(), npc = actor(), all = [a, corpse, player, npc];
  const boneTextures = all.flatMap(a => textures(a.root)), dyn = new THREE.Group(), entGroup = new THREE.Group();
  dyn.add(a.root, corpse.root, player.root); entGroup.add(npc.root);
  const resetCode = renderer.slice(renderer.indexOf('  function reset() {'), renderer.indexOf('  return { hop:', renderer.indexOf('  function reset() {')));
  Function('actors', 'corpses', 'playerActors', 'folkActors', 'dyn', 'entGroup', 'disposeActor', `
    const effects=[],pickupSprites=new Map(),numbers=[],parts=[],gemSets=[],partMesh={};
    const projObjs=new Map(),shieldObjs=new Map(),eprojObjs=new Map(),msBursts=[],hazardPool=[],curMap={cx:0,cz:0},cam={};
    let folkT=0,spTick=0; const removePickup=()=>{};
    ${resetCode}; reset();
  `)(new Map([[1, a]]), [{ a: corpse }], new Map([[1, player]]), new Map([[1, npc]]), dyn, entGroup, character.disposeActor);
  assert.ok(boneTextures.every(x => x.disposed === 1));
  assert.equal(dyn.children.length, 0); assert.equal(entGroup.children.length, 0);
});
