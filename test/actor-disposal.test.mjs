import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as character from '../src/character.js';
import { createPetRenderer } from '../src/pet-renderer.js';

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
  const proto = prototype(), armor = prototype();
  armor.mesh.skeleton.bones.reverse(); armor.mesh.skeleton.boneInverses.reverse();
  t.mock.method(FBXLoader.prototype, 'loadAsync', async () => ({ animations: [new THREE.AnimationClip('fixture', 1, [])], traverse: fn => proto.gltf.scene.traverse(fn) }));
  const kit = await character.createCharacterKit(async url => url.includes('Iron') ? armor.gltf : proto.gltf, x => x, ['Chest/Clothing/Iron Chestplate', 'Chest/Clothing/Steel Chestplate']);
  const actor = kit.build({ armor: { chest: 'Iron Chestplate' } }), oldMeshes = [];
  actor.root.traverse(o => { if (o.isSkinnedMesh) oldMeshes.push(o); });
  const oldArmor = oldMeshes.filter(o => o.material === armor.material);
  assert.ok(oldArmor.length > 0);
  const shared = [proto.material, proto.geometry, proto.map, armor.material, armor.geometry, armor.map].map(watch), boneTextures = new Map();
  for (const mesh of oldMeshes) { if (!mesh.skeleton.boneTexture) mesh.skeleton.computeBoneTexture(); boneTextures.set(mesh, watch(mesh.skeleton.boneTexture)); }
  actor.setArmor({ chest: 'Steel Chestplate' });
  assert.ok(oldArmor.every(mesh => mesh.parent === null && boneTextures.get(mesh).disposed === 1));
  assert.ok(oldMeshes.filter(mesh => !oldArmor.includes(mesh)).every(mesh => boneTextures.get(mesh).disposed === 0));
  assert.ok(shared.every(x => x.disposed === 0));
  actor.setArmor({ chest: 'Iron Chestplate' });
  const replacement = meshList(actor.root).find(mesh => mesh.material === armor.material);
  assert.notEqual(replacement.skeleton, oldArmor[0].skeleton, 'unused palettes leave the actor pool');
  replacement.skeleton.computeBoneTexture(); const replacementTexture = watch(replacement.skeleton.boneTexture);
  actor.setArmor({ chest: 'Steel Chestplate' }); assert.equal(replacementTexture.disposed, 1);
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

test('renderer reset releases enemy, corpse, player, NPC and companion actors', async () => {
  const proto = prototype(), actor = () => instantiate(proto);
  const a = actor(), corpse = actor(), player = actor(), npc = actor(), pet = actor(), all = [a, corpse, player, npc, pet];
  const boneTextures = all.flatMap(a => textures(a.root)), dyn = new THREE.Group(), entGroup = new THREE.Group();
  dyn.add(a.root, corpse.root, player.root); entGroup.add(npc.root);
  const petRenderer = createPetRenderer({ group: dyn, load: async () => proto, spawn: () => pet, groundAt: () => 0 });
  await petRenderer.set('chicken'); petRenderer.update({ players: [{ id: 'p1', x: 0, z: 0, al: true }], petActive: false }, 0, 'p1');
  const resetCode = renderer.slice(renderer.indexOf('  function reset() {'), renderer.indexOf('  return { hop:', renderer.indexOf('  function reset() {')));
  Function('actors', 'corpses', 'playerActors', 'folkActors', 'dyn', 'entGroup', 'disposeActor', 'petRenderer', `
    const slimeFlecks=[],effects=[],pickupSprites=new Map(),numbers=[],parts=[],gemSets=[],partMesh={};
    const projObjs=new Map(),shieldObjs=new Map(),eprojObjs=new Map(),shrineObjs=new Map(),msBursts=[],hazardPool=[],curMap={cx:0,cz:0},cam={};
    let folkT=0,spTick=0; const removePickup=()=>{};
    ${resetCode}; reset();
  `)(new Map([[1, a]]), [{ a: corpse }], new Map([[1, player]]), new Map([[1, npc]]), dyn, entGroup, character.disposeActor, petRenderer);
  assert.ok(boneTextures.every(x => x.disposed === 1));
  assert.equal(dyn.children.length, 0); assert.equal(entGroup.children.length, 0);
});

function meshList(root) { const out=[];root.traverse(o=>{if(o.isSkinnedMesh)out.push(o);});return out; }
function sharedPrototype() {
 const p=prototype(),second=p.mesh.clone();second.name='second';second.bindMatrix.makeTranslation(.25,0,0);second.bindMatrixInverse.copy(second.bindMatrix).invert();p.gltf.scene.add(second);return p;
}
test('cloned meshes share an identical bone palette without changing bind matrices or vertex poses',()=>{
 const p=sharedPrototype();p.mesh.name='first';p.gltf.scene.updateMatrixWorld(true);
 const reference=SkeletonUtils.clone(p.gltf.scene),root=character.cloneActor(p.gltf.scene),meshes=meshList(root),before=meshList(reference);
 assert.equal(meshes.length,2);assert.equal(meshes[0].skeleton,meshes[1].skeleton);assert.notEqual(meshes[0].skeleton,p.mesh.skeleton);
 meshes[0].skeleton.bones[0].rotation.y=.3;before[0].skeleton.bones[0].rotation.y=.3;root.updateMatrixWorld(true);reference.updateMatrixWorld(true);
 for(let i=0;i<meshes.length;i++){assert.deepEqual(meshes[i].bindMatrix.elements,before[i].bindMatrix.elements);for(let j=0;j<meshes[i].geometry.attributes.position.count;j++)assert.deepEqual(meshes[i].getVertexPosition(j,new THREE.Vector3()).toArray(),before[i].getVertexPosition(j,new THREE.Vector3()).toArray());}
 character.disposeActor(root);
});
test('cloning never shares different inverse matrices, ordered bones, or independent avatars',()=>{
 const p=sharedPrototype(),different=p.mesh.clone();different.skeleton=p.mesh.skeleton.clone();different.skeleton.boneInverses=p.mesh.skeleton.boneInverses.map(m=>m.clone());different.skeleton.boneInverses[0].elements[12]+=.1;p.gltf.scene.add(different);
 const reversed=p.mesh.clone();reversed.skeleton=new THREE.Skeleton(p.mesh.skeleton.bones.slice().reverse(),p.mesh.skeleton.boneInverses.slice().reverse());p.gltf.scene.add(reversed);
 const a=character.cloneActor(p.gltf.scene),b=character.cloneActor(p.gltf.scene),am=meshList(a),bm=meshList(b);
 assert.equal(am[0].skeleton,am[1].skeleton);for(const j of [2,3])assert.notEqual(am[0].skeleton,am[j].skeleton);assert.notEqual(am[0].skeleton,bm[0].skeleton);
 character.disposeActor(a);character.disposeActor(b);
});
test('partial actor cleanup releases a shared palette only after its last mesh and stays idempotent',()=>{
 const p=sharedPrototype(),root=character.cloneActor(p.gltf.scene),[a,b]=meshList(root);assert.equal(a.skeleton,b.skeleton);a.skeleton.computeBoneTexture();const texture=watch(a.skeleton.boneTexture);
 character.disposeActor(a);assert.equal(texture.disposed,0);character.disposeActor(a);assert.equal(texture.disposed,0);character.disposeActor(root);assert.equal(texture.disposed,1);character.disposeActor(root);assert.equal(texture.disposed,1);
});
test('modular body and replacement armor share exact palettes while live bindings retain their texture',async t=>{
 const p=prototype();t.mock.method(FBXLoader.prototype,'loadAsync',async()=>({animations:[new THREE.AnimationClip('fixture',1,[])],traverse:fn=>p.gltf.scene.traverse(fn)}));
 const kit=await character.createCharacterKit(async()=>p.gltf,x=>x,['Chest/Clothing/Iron Chestplate','Chest/Clothing/Steel Chestplate']);const a=kit.build({armor:{chest:'Iron Chestplate'}}),b=kit.build();
 const before=meshList(a.root);assert.equal(new Set(before.map(m=>m.skeleton)).size,1);assert.notEqual(before[0].skeleton,meshList(b.root)[0].skeleton);
 before[0].skeleton.computeBoneTexture();const texture=watch(before[0].skeleton.boneTexture);a.setArmor({chest:'Steel Chestplate'});assert.equal(texture.disposed,0);assert.equal(new Set(meshList(a.root).map(m=>m.skeleton)).size,1);character.disposeActor(a.root,a.mixer);assert.equal(texture.disposed,1);character.disposeActor(b.root,b.mixer);
});
