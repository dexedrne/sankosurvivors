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
