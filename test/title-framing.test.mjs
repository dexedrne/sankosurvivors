import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
let frameTitleCamera;try{({frameTitleCamera}=await import('../src/title-framing.js'));}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
for(const [width,height,yaw] of [[1280,720,0],[1280,720,1.2],[393,852,0],[852,393,-1.5]])test(`title body stays centred in its free preview area ${width}x${height}/${yaw}`,()=>{
 assert.equal(typeof frameTitleCamera,'function');
 const p=new THREE.Vector3(378.5,7.9,270.5),camera=new THREE.PerspectiveCamera(40,width/height,.1,200);
 camera.position.set(p.x+Math.sin(yaw)*12,p.y+13,p.z+Math.cos(yaw)*12);camera.lookAt(p.x,p.y-.4,p.z);camera.updateMatrixWorld();
 const targetY=height*.28;frameTitleCamera(camera,p,width,height,targetY);const projected=p.clone().project(camera);
 assert.ok(Math.abs((projected.x+1)*width/2-width/2)<1e-8);assert.ok(Math.abs((1-projected.y)*height/2-targetY)<1e-8);
 camera.clearViewOffset();assert.ok(Math.abs((1-p.clone().project(camera).y)*height/2-targetY)>10,'ordinary gameplay projection is recoverable');
});
test('hidden or zero-size title viewport clears the camera offset without invalid projection',()=>{
 assert.equal(typeof frameTitleCamera,'function');const camera=new THREE.PerspectiveCamera(40,1,.1,200),p=new THREE.Vector3();camera.position.z=10;camera.lookAt(p);frameTitleCamera(camera,p,400,800,200);assert.equal(camera.view.enabled,true);frameTitleCamera(camera,p,0,0,0);assert.equal(camera.view.enabled,false);assert.ok(camera.projectionMatrix.elements.every(Number.isFinite));
});
