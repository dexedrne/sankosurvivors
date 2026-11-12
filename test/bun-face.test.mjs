import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createBunActor } from '../src/bun-actor.js';
import { disposeActor, ownActorResource } from '../src/character.js';
const face = await import('../src/bun-face.js').catch(error => { if (error.code !== 'ERR_MODULE_NOT_FOUND' || !error.message.includes('/src/bun-face.js')) throw error; return {}; });
const create = (...args) => { assert.equal(typeof face.createBunFace, 'function', 'guarded native Bun faces exist'); return face.createBunFace(...args); };
const keys = ['eyesHappy', 'eyesSad', 'mouthHappy', 'mouthSad', 'mouthAngry', 'mouthLove'];
const textures = () => Object.fromEntries(keys.map(key => [key, new THREE.Texture()]));
const watch = resource => { let count = 0; resource.addEventListener('dispose', () => count++); return () => count; };
function part(name, count = /^eyes/i.test(name) ? 26 : 9) {
  const geometry = new THREE.BufferGeometry(), uv = new Float32Array(count * 2), bounds = /^eyes/i.test(name) ? [.55386,.05878,.82432,.94057] : [0,0,.98257,1];
  for (let i=0;i<count;i++) { uv[i*2]=bounds[i%2 ? 2 : 0]; uv[i*2+1]=bounds[i%2 ? 3 : 1]; }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(count*3), 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({name, map:new THREE.Texture(),color:0x73442a}));
}
function setup() { const root=new THREE.Group(),eyes=part('Eyes.001'),mouth=part('Mouth.001'); root.add(eyes,mouth); return {root,eyes,mouth}; }

test('native supported faces use separate calibrated maps and restore their original maps and tint', () => {
  const s=setup(), sources=textures(), eye=s.eyes.material, mouth=s.mouth.material, original=eye.color.clone();
  const controller=create(s.root,sources);controller.setExpression('happy');
  assert.notEqual(s.eyes.material,eye);assert.notEqual(s.mouth.material,mouth);
  assert.equal(s.eyes.material.map.source,sources.eyesHappy.source);assert.notEqual(s.eyes.material.map,sources.eyesHappy);
  assert.equal(s.eyes.material.color.getHex(),0xffffff);assert.equal(s.mouth.material.map.rotation,Math.PI);
  for(const mesh of [s.eyes,s.mouth]) { assert.equal(mesh.material.map.colorSpace,THREE.SRGBColorSpace);assert.equal(mesh.material.map.flipY,true);assert.deepEqual(mesh.material.map.center.toArray(),[.5,.5]); }
  controller.setExpression('default');assert.equal(s.eyes.material.map,eye.map);assert(s.eyes.material.color.equals(original));assert.equal(s.mouth.material.map,mouth.map);
  controller.setExpression('unrecognised');assert.equal(s.eyes.material.map,eye.map);
  controller.dispose();assert.equal(s.eyes.material,eye);assert.equal(s.mouth.material,mouth);
});
test('the original sad/angry/love/sing/sleepy combinations remain distinct', () => {
  const s=setup(),sources=textures(),originalMouth=s.mouth.material.map,c=create(s.root,sources);
  for(const [expression,eyes,mouth]of [['sad','eyesSad','mouthSad'],['angry','eyesHappy','mouthAngry'],['love','eyesHappy','mouthLove'],['sing','eyesSad','mouthLove'],['sleepy','eyesHappy',null]]) {
    c.setExpression(expression);assert.equal(s.eyes.material.map.source,sources[eyes].source);if(mouth)assert.equal(s.mouth.material.map.source,sources[mouth].source);else assert.equal(s.mouth.material.map,originalMouth);
  }
  c.dispose();
});
test('lookalike materials with different topology, UVs, missing attributes or names keep their original face', () => {
  for(const change of [s=>s.eyes.geometry.deleteAttribute('uv'),s=>s.eyes.geometry.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(27*3),3)),s=>s.eyes.geometry.attributes.uv.setX(0,.1),s=>s.eyes.geometry.attributes.uv.setX(0,NaN),s=>s.eyes.material.name='Eyeshadow']) {
    const s=setup();change(s);const original=s.eyes.material,c=create(s.root,textures());c.setExpression('happy');assert.equal(s.eyes.material,original);c.dispose();
  }
});
test('a supported mouth on a head with custom eyes changes without overwriting the eyes', () => {
  const s=setup();s.eyes.geometry=part('Eyes',84).geometry;const eyes=s.eyes.material,sources=textures(),c=create(s.root,sources);c.setExpression('love');assert.equal(s.eyes.material,eyes);assert.equal(s.mouth.material.map.source,sources.mouthLove.source);c.dispose();
});
test('two actors own independent face materials/textures and disposal never frees shared originals or the other face', () => {
  const a=setup(),b=setup(),sources=textures();b.eyes.material=a.eyes.material;b.mouth.material=a.mouth.material;
  const originals=[a.eyes.material,a.eyes.material.map,a.mouth.material,...Object.values(sources)].map(watch);
  const ca=create(a.root,sources),cb=create(b.root,sources);ca.setExpression('happy');cb.setExpression('sad');
  assert.notEqual(a.eyes.material,b.eyes.material);const removed=[a.eyes.material,a.eyes.material.map].map(watch),retained=[b.eyes.material,b.eyes.material.map].map(watch);
  ca.dispose();ca.dispose();ca.setExpression('love');assert(removed.every(n=>n()===1));assert(retained.every(n=>n()===0));assert(originals.every(n=>n()===0));
  cb.setExpression('love');assert.equal(b.mouth.material.map.source,sources.mouthLove.source);cb.dispose();assert(originals.every(n=>n()===0));
});
test('closing a face never overwrites a newer material replacement', () => {
  const s=setup(),c=create(s.root,textures()),replacement=new THREE.MeshBasicMaterial();s.eyes.material=replacement;c.dispose();assert.equal(s.eyes.material,replacement);
});
test('Bun binds face resources after preview isolation, freezes paused expressions, and releases only actor resources', () => {
  const s=setup(),sources=textures(),clip=new THREE.AnimationClip('idle',1,[new THREE.NumberKeyframeTrack('.rotation[y]',[0,1],[0,.1])]);
  const actor=createBunActor({gltf:{scene:s.root},clips:{run:clip,curious:clip.clone()},k:1,x:0,y:0,z:0,faces:sources});
  const cloned=[];actor.inner.traverse(o=>{if(o.isMesh){o.material=ownActorResource(o.material.clone());cloned.push(o.material);}});
  const mesh=actor.inner.children[0],clonedDisposals=cloned.map(watch),originalDisposals=[s.eyes.material,s.mouth.material,...Object.values(sources)].map(watch);
  actor.update(.1,false,'love');assert.equal(mesh.material.map.source,sources.eyesHappy.source);
  const applied=mesh.material.map,textureDisposed=watch(applied),materialDisposed=watch(mesh.material);
  actor.update(0,true,'sad');assert.equal(mesh.material.map,applied);
  actor.update(.1,true,'default');assert.equal(mesh.material.map.source,sources.eyesHappy.source,'catching up uses happy');
  actor.update(.1,false,'sad');assert.equal(mesh.material.map.source,sources.eyesSad.source);
  disposeActor(actor.root,actor.mixer);disposeActor(actor.root,actor.mixer);
  assert.equal(textureDisposed(),1);assert.equal(materialDisposed(),1);assert(clonedDisposals.every(n=>n()===1));assert(originalDisposals.every(n=>n()===0));
  const restored=mesh.material;actor.update(.1,false,'love');assert.equal(mesh.material,restored,'removed actor cannot allocate a new face');
});
