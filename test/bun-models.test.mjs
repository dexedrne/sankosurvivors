import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { disposeActor } from '../src/character.js';
const buns=await import('../src/bun-models.js').catch(error=>{if(error.code!=='ERR_MODULE_NOT_FOUND')throw error;return {};});
test('native Bun loading uses only catalogue paths, retries failed preparations and reuses successful prototypes', async()=>{
  assert.equal(typeof buns.createBunModels,'function');
  const scene=new THREE.Group(),hips=new THREE.Bone();hips.name='hips';scene.add(hips);hips.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial()));
  const clip=name=>new THREE.AnimationClip(name,.6,[new THREE.VectorKeyframeTrack('hips.position',[0,.6],[0,0,0,0,.01,0])]);
  let fail=true;const paths=[];
  const models=buns.createBunModels(async path=>{paths.push(path);if(fail)throw Error('missing');return path.includes('/anim/')?{animations:[clip('native')]}:{scene};},p=>'fixture/'+p);
  for(const value of [null,{},'bun:3351','bun:../../bad','bun:__proto__','fox','https://bad.glb'])assert.equal(models.choice(value),null);
  assert.equal(models.choice('bun:Mini'),'bun:Mini');assert.equal(models.choice('bun:Orange'),'bun:Orange');
  await assert.rejects(models.load('bun:Mini'),/missing/);fail=false;
  const a=await models.load('bun:Mini'),b=await models.load('bun:Mini');assert.equal(a,b);
  assert.deepEqual([...new Set(paths)].sort(),['fixture/sanko/buns/Mini.glb','fixture/sanko/buns/anim/bun-curious-smooth-v1.glb','fixture/sanko/buns/anim/bun-run-smooth-v1.glb']);
  assert.equal(paths.length,6);await assert.rejects(models.load('bun:../../bad'));assert.equal(paths.length,6);
  const actor=models.spawn(a);try{actor.update(.1,true);assert.equal(actor.root.name,'companion');assert(actor.root.children.length);}finally{disposeActor(actor.root,actor.mixer);}
});
test('optional native face texture failures preserve the Bun and retry without refetching its model',async()=>{
  const scene=new THREE.Group(),bone=new THREE.Bone();bone.name='hips';scene.add(bone);bone.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial()));
  const clip=new THREE.AnimationClip('idle',.6,[new THREE.VectorKeyframeTrack('hips.position',[0,.6],[0,0,0,0,.01,0])]);
  let fail=true,modelsFetched=0;const texturePaths=[],textureDisposals=[];
  const models=buns.createBunModels(async path=>{modelsFetched++;return path.includes('/anim/')?{animations:[clip]}:{scene};},p=>'fixture/'+p,async path=>{texturePaths.push(path);if(fail&&path.endsWith('/eye-s-1.png'))throw Error('texture offline');const texture=new THREE.Texture();let count=0;texture.addEventListener('dispose',()=>count++);textureDisposals.push(()=>count);return texture;});
  const first=await models.load('bun:Mini');assert.equal(modelsFetched,3);assert.equal(texturePaths.length,6);assert.equal(first.faces,null);
  assert.equal(textureDisposals.length,5);assert(textureDisposals.every(n=>n()===1),'a partially loaded optional face releases its successful textures');
  fail=false;const ready=await models.load('bun:Mini');assert.equal(ready,first);assert.equal(modelsFetched,3);assert.equal(texturePaths.length,12);assert.equal(Object.keys(ready.faces).length,6);
  await models.load('bun:Mini');assert.equal(texturePaths.length,12);assert(texturePaths.every(path=>path.startsWith('fixture/sanko/pets/expressions/v1/')));
  assert(textureDisposals.slice(5).every(n=>n()===0),'successful cached textures remain available');
});
