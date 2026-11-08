import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
let createMeleeVfx;
try { ({createMeleeVfx}=await import('../src/melee-vfx.js')); } catch(e) { if(e.code!=='ERR_MODULE_NOT_FOUND'||!e.message.includes('/src/melee-vfx.js'))throw e; }
function fixture(groundAt=()=>2) {
 assert.equal(typeof createMeleeVfx,'function','instanced melee VFX missing');
 const group=new THREE.Group(),camera=new THREE.PerspectiveCamera();camera.position.set(0,10,10);camera.lookAt(0,0,0);camera.updateMatrixWorld();
 const fx=createMeleeVfx({group,camera,groundAt,colorOut:s=>s+'\n// existing output wrapper',fxOnly:o=>{o.layers.set(1);return o;}});fx.begin(0,false);
 return {fx,group,camera};
}
const kinds=fx=>Array.from(fx.mesh.geometry.getAttribute('aFx').array).filter((_,i)=>i%4===0).slice(0,fx.mesh.count);
test('all melee styles share one reusable instanced geometry/material on the FX layer',()=>{
 const {fx,group}=fixture();assert.equal(group.children.length,1);assert(fx.mesh.isInstancedMesh);assert.equal(fx.mesh.instanceMatrix.count,64);assert.equal(fx.mesh.count,0);assert.equal(fx.mesh.layers.mask,2);assert.equal(fx.mesh.material.depthWrite,false);assert.equal(fx.mesh.material.blending,THREE.NormalBlending);assert(fx.mesh.renderOrder<0);assert.match(fx.mesh.material.fragmentShader,/existing output wrapper/);
});
test('real supplied sword range, world position and angular span reach the instance buffers',()=>{
 const {fx}=fixture();fx.sweep(12,20,0,4,90,0xe0e8ef);fx.flush();assert.equal(fx.mesh.count,1);
 const m=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();fx.mesh.getMatrixAt(0,m);m.decompose(p,q,s);
 assert.equal(p.x,12);assert.equal(p.z,20);assert(Math.abs(p.y-2.9)<1e-5);assert(Math.abs(s.x-4)<1e-5&&Math.abs(s.y-4)<1e-5);
 const a=fx.mesh.geometry.getAttribute('aFx').array;assert.equal(a[0],0);assert.equal(a[1],0);assert(Math.abs(a[2]-Math.PI/2)<1e-6);
 const forward=new THREE.Vector3(1,0,0).applyQuaternion(q);assert(Math.abs(forward.x)<1e-5&&Math.abs(forward.z-1)<1e-5,'angle0 aims along world+Z');
});
test('simulation-time aging freezes exactly while paused and expires naturally',()=>{
 const {fx}=fixture();fx.sweep(0,0,0,3,100,0xffffff);fx.flush();fx.begin(.12,false);fx.flush();assert.equal(fx.mesh.count,1);assert(Math.abs(fx.mesh.geometry.getAttribute('aFx').array[1]-.5)<1e-6);
 const params=Array.from(fx.mesh.geometry.getAttribute('aFx').array),matrices=Array.from(fx.mesh.instanceMatrix.array);fx.begin(.12,false);fx.flush();assert.deepEqual(Array.from(fx.mesh.geometry.getAttribute('aFx').array),params);assert.deepEqual(Array.from(fx.mesh.instanceMatrix.array),matrices);
 fx.begin(.3,false);fx.flush();assert.equal(fx.mesh.count,0);
});
for(const reduced of [false,true])test(`400 primary attacks remain bounded in ${reduced?'reduced':'full'} mode`,()=>{
 const {fx,group}=fixture();fx.begin(0,reduced);const g=fx.mesh.geometry,m=fx.mesh.material;
 for(let i=0;i<400;i++)fx.sweep(0,0,i/10,3,100,0xffffff);fx.flush();assert.equal(fx.mesh.count,reduced?24:64);assert.equal(group.children.length,1);assert.equal(fx.mesh.geometry,g);assert.equal(fx.mesh.material,m);
});
test('damage and projectile pressure cannot evict the primary blade sweep',()=>{
 const {fx}=fixture();fx.sweep(0,0,0,3,100,0xffffff);for(let i=0;i<500;i++){fx.hit(0,0,true);fx.axe(1,1,i,false);fx.sword(1,1,i,false);}fx.flush();assert(fx.mesh.count<=64);assert(kinds(fx).includes(0));
 fx.begin(.05,true);fx.flush();assert(fx.mesh.count<=24);assert(kinds(fx).includes(0));
});
test('shock dust, fine impacts and both native projectile wakes share the same batch and expire',()=>{
 const {fx}=fixture();fx.quake(3,4,4);fx.hit(2,2,true);fx.axe(4,5,.4,true);fx.sword(5,6,.8,false);fx.flush();assert(fx.mesh.count>4);for(const k of [1,2,3,4,5])assert(kinds(fx).includes(k),String(k));
 fx.begin(2,false);fx.flush();assert.equal(fx.mesh.count,0);
});
test('invalid inputs never introduce nonfinite matrices or attributes',()=>{
 const {fx}=fixture();for(const bad of [NaN,Infinity,-Infinity,1e50]){fx.sweep(bad,0,0,3,90,0xffffff);fx.quake(0,bad,3);fx.hit(bad,0,true);fx.axe(0,bad,0,false);fx.sword(0,0,bad,false);}fx.sweep(0,0,0,-1,90,0xffffff);fx.quake(0,0,-1);fx.sweep(0,0,0,3,Infinity,0xffffff);fx.sweep(0,0,0,3,1e-300,0xffffff);fx.sweep(0,0,0,3,90,NaN);fx.flush();assert.equal(fx.mesh.count,0);
 assert(Array.from(fx.mesh.instanceMatrix.array).every(Number.isFinite));assert(Array.from(fx.mesh.geometry.getAttribute('aFx').array).every(Number.isFinite));
 const invalidGround=fixture(()=>NaN).fx;invalidGround.quake(0,0,3);invalidGround.flush();assert.equal(invalidGround.mesh.count,0);
});
test('clock rewind and reset clear visible state while retaining allocated GPU resources',()=>{
 const {fx}=fixture();const g=fx.mesh.geometry,m=fx.mesh.material;let disposed=0;g.addEventListener('dispose',()=>disposed++);m.addEventListener('dispose',()=>disposed++);
 for(let i=0;i<100;i++){fx.begin(i,false);fx.sweep(0,0,0,3,90,0xffffff);fx.quake(0,0,2);fx.flush();fx.reset();assert.equal(fx.mesh.count,0);assert.equal(fx.mesh.geometry,g);assert.equal(fx.mesh.material,m);}
 assert.equal(disposed,0);fx.begin(30,false);fx.hit(0,0,true);fx.flush();fx.begin(29,false);fx.flush();assert.equal(fx.mesh.count,0);fx.sweep(0,0,0,3,90,0xffffff);fx.flush();assert.equal(fx.mesh.count,1);
});
