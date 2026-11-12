import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync}from'node:fs';import * as THREE from 'three';
import {ENEMIES}from'../src/content.js';import {cloneActor,ownActorResource,disposeActor}from'../src/character.js';
const source=readFileSync(new URL('../src/render.js',import.meta.url),'utf8');
const updateCode=source.slice(source.indexOf('    // enemies\n'),source.indexOf('    // boss attack telegraphs:'));
const resetCode=source.slice(source.indexOf('    for (const a of actors.values()) disposeActor'),source.indexOf('    for (const a of playerActors.values()) disposeActor'));
const watch=resource=>{let n=0;resource.addEventListener('dispose',()=>n++);return()=>n;};
function fixture(){
 const scene=new THREE.Scene(),dyn=new THREE.Group();scene.add(dyn);const camera=new THREE.OrthographicCamera(-5,5,5,-5,.1,100);camera.position.set(0,10,10);camera.lookAt(0,0,0);camera.updateMatrixWorld();
 const proto=new THREE.Group(),hip=new THREE.Bone(),tip=new THREE.Bone();tip.name='tip';hip.position.y=1;tip.position.y=.5;hip.add(tip);proto.add(hip);
 const geometry=new THREE.BoxGeometry(1,1,1),n=geometry.attributes.position.count,weights=new Float32Array(n*4);for(let i=0;i<n;i++)weights[i*4]=1;
 geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(new Uint16Array(n*4),4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));const material=new THREE.MeshStandardMaterial({map:new THREE.Texture()}),mesh=new THREE.SkinnedMesh(geometry,material);proto.add(mesh);proto.updateMatrixWorld(true);mesh.bind(new THREE.Skeleton([hip,tip]));
 const cached=[geometry,material,material.map].map(watch),created=[],actors=new Map(),corpses=[];
 function makeEnemy(){const root=cloneActor(proto),mixer=new THREE.AnimationMixer(root);mixer.clipAction(new THREE.AnimationClip('walk',1,[new THREE.VectorKeyframeTrack('tip.position',[0,1],[0,.5,0,1,.5,0])])).play();let matrices=0,palette,privateMaterial;root.traverse(o=>{const update=o.updateMatrixWorld;o.updateMatrixWorld=function(...args){matrices++;return update.apply(this,args);};if(o.isSkinnedMesh){o.material=privateMaterial=ownActorResource(o.material.clone());palette=o.skeleton;palette.computeBoneTexture();}});const actor={root,mixer,mats:[privateMaterial],matrices:()=>matrices,freedMaterial:watch(privateMaterial),freedPalette:watch(palette.boneTexture)};created.push(actor);return actor;}
 const update=Function('actors','corpses','dyn','camera','THREE','ENEMIES','makeEnemy','disposeActor',`const cam={x:0,z:0},projScreen=new THREE.Matrix4(),viewFrustum=new THREE.Frustum(),cullSphere=new THREE.Sphere(),dummy=new THREE.Object3D(),blobMesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial(),520),groundAt=()=>0,batchEnemy=a=>a,softRing=()=>new THREE.Group(),time=0;return function(view,dt){${updateCode}};`)(actors,corpses,dyn,camera,THREE,ENEMIES,makeEnemy,disposeActor);
 const reset=Function('actors','corpses','disposeActor',`return()=>{${resetCode}};`)(actors,corpses,disposeActor);
 const tick=(enemies,dt=.1)=>{update({enemies},dt);scene.updateMatrixWorld(true);};
 return{scene,dyn,actors,corpses,created,cached,tick,reset};
}
const enemy=(x,z,hit=false,elite=false)=>[1,'goblin',x,z,0,1,hit,elite,0,0,0];
test('hidden rigs retain actors without scene matrix traversal and reveal the same posed root',()=>{
 const f=fixture();f.tick([enemy(5000,5000)]);const a=f.actors.get(1);assert.equal(a.root.visible,false);assert.equal(a.matrices(),0,'frustum-hidden rig must not traverse scene matrices');assert.equal(a.root.parent,null);assert.equal(a.mixer.time,0);assert.equal(a.freedMaterial(),0);assert.equal(a.freedPalette(),0);
 f.tick([enemy(0,0,true)]);assert.equal(f.actors.get(1),a);assert.equal(f.created.length,1);assert.equal(a.root.parent,f.dyn);assert.equal(a.root.visible,true);assert(a.matrices()>0);assert.equal(a.mixer.time,.1);assert.equal(a.mats[0].emissive.r,.85);const tip=a.root.getObjectByName('tip').getWorldPosition(new THREE.Vector3());assert(Math.abs(tip.x-.112)<1e-6);assert(Math.abs(tip.y-1.68)<1e-6);
 const before=a.matrices();f.tick([enemy(5000,5000)],.4);assert.equal(a.matrices(),before);assert.equal(a.mixer.time,.1);assert.equal(a.root.parent,null);
 f.tick([enemy(0,0)]);assert.equal(f.actors.get(1),a);assert.equal(a.root.parent,f.dyn);assert.equal(f.dyn.children.filter(o=>o===a.root).length,1);assert.equal(a.mats[0].emissive.r,0);assert.equal(a.mixer.time,.2);assert(Math.abs(a.root.getObjectByName('tip').getWorldPosition(new THREE.Vector3()).x-.2)<1e-6);f.reset();
});
test('hidden death disposes only owned actor resources once',()=>{
 const f=fixture();f.tick([enemy(5000,5000)]);const a=f.actors.get(1);f.tick([],1);assert.equal(f.actors.size,0);assert.equal(f.corpses.length,0);assert.equal(a.root.parent,null);assert.equal(a.freedMaterial(),1);assert.equal(a.freedPalette(),1);assert.deepEqual(f.cached.map(n=>n()),[0,0,0]);f.tick([],1);f.reset();assert.equal(a.freedMaterial(),1);assert.equal(a.freedPalette(),1);
});
test('reset releases detached rigs through actor ownership and a new run creates fresh actors',()=>{
 const f=fixture();f.tick([enemy(5000,5000)]);const first=f.actors.get(1);f.reset();assert.equal(f.actors.size,0);assert.equal(first.freedMaterial(),1);assert.equal(first.freedPalette(),1);f.tick([enemy(0,0)]);const next=f.actors.get(1);assert.notEqual(next,first);assert.equal(next.root.parent,f.dyn);assert.equal(next.freedMaterial(),0);assert.equal(next.freedPalette(),0);assert.deepEqual(f.cached.map(n=>n()),[0,0,0]);f.reset();assert.equal(next.freedPalette(),1);
});
