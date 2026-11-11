import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {fitHazardTerrain} from '../src/terrain-warning.js';
const source=fs.readFileSync(new URL('../src/render.js',import.meta.url),'utf8');
const poolSource=source.slice(source.indexOf('  const hazardMat = '),source.indexOf('  const eprojObjs = '));
const updateSource=source.slice(source.indexOf('    // boss attack telegraphs:'),source.indexOf('    // monster projectiles (fire and ice):'));
function fixture(height=(x,z)=>x*.4+z*.2){
 const n=65,field={x0:0,z0:0,n,data:Float32Array.from({length:n*n},(_,i)=>height(i%n,Math.floor(i/n)))},scene=new THREE.Scene();
 const groundAt=(x,z)=>{const i=Math.floor(x),j=Math.floor(z),u=x-i,v=z-j,d=field.data;return(d[j*n+i]*(1-u)+d[j*n+i+1]*u)*(1-v)+(d[(j+1)*n+i]*(1-u)+d[(j+1)*n+i+1]*u)*v;};
 const fxOnly=Function('FX_LAYER','return '+source.match(/const fxOnly = (.*);/)[1])(1);
 const pool=Function('THREE','colorOut','scene','fxOnly',poolSource+';return hazardPool;')(THREE,s=>s,scene,fxOnly);
 const draw=Function('hazardPool','groundAt','field','fitHazardTerrain','view','time','emit',updateSource);
 return{pool,field,groundAt,draw(hazards,time=1){draw(pool,groundAt,field,fitHazardTerrain,{hazards},time,()=>{});scene.updateMatrixWorld(true);}};
}
test('actual boss circle surface stays above a native slope instead of being buried uphill',()=>{
 const f=fixture();f.draw([[20.3,21.7,5.5,.4,0]]);const m=f.pool[0].userData.disc,p=m.geometry.attributes.position,v=new THREE.Vector3();let buried=0;
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld);if(v.y<f.groundAt(v.x,v.z)+.079)buried++;}
 assert.equal(buried,0,`${buried} warning vertices hidden by the uphill terrain`);
});
test('warning vertices share native terrain tile edges and keep the original circular shader',()=>{
 const f=fixture();f.draw([[20.3,21.7,2.47,.7,0]]);const m=f.pool[0].userData.disc,p=m.geometry.attributes.position,v=new THREE.Vector3();
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld);assert(Math.abs(v.x-Math.round(v.x))<1e-5);assert(Math.abs(v.z-Math.round(v.z))<1e-5);}
 assert.match(m.material.vertexShader,/vP = position.xz/);assert.match(m.material.fragmentShader,/if \(r > 1.0\) discard/);assert.equal(m.material.depthTest,true);assert.equal(m.material.depthWrite,false);
});
test('charge progress changes uniforms without rebuilding a stationary warning or resizing its meteor',()=>{
 const f=fixture();f.draw([[20,21,2.47,.2,1]]);const g=f.pool[0],d=g.userData.disc,geo=d.geometry,version=geo.attributes.position.version;f.draw([[20,21,2.47,.8,1]],2);
 assert.equal(d.geometry,geo);assert.equal(geo.attributes.position.version,version);assert.equal(d.material.uniforms.uProg.value,.8);assert.equal(d.material.uniforms.uTime.value,2);assert.equal(g.scale.x,2.47);assert.equal(g.userData.rock.scale.x*2.47,.9);assert(Math.abs(g.userData.rock.position.y*2.47-5.2)<1e-10);assert.equal(f.pool.length,16);f.draw([]);assert(f.pool.every(m=>!m.visible));
});
test('resized warnings dispose replaced geometry and changed terrain refits the same buffer',()=>{
 const f=fixture();f.draw([[20,21,2.47,.2,0]]);const d=f.pool[0].userData.disc,first=d.geometry;let disposed=0;first.addEventListener('dispose',()=>disposed++);f.draw([[21,20,5.5,.3,0]]);assert.equal(disposed,1);assert.notEqual(d.geometry,first);const geometry=d.geometry,version=geometry.attributes.position.version;f.field.data=f.field.data.map(y=>y+3);f.draw([[21,20,5.5,.3,0]]);assert.equal(d.geometry,geometry);assert(geometry.attributes.position.version>version);assert(Number.isFinite(geometry.boundingSphere.radius));
});
test('native saddle triangles remain exactly covered between warning vertices',()=>{
 const f=fixture((x,z)=>(x%2)*(z%2)*3);f.draw([[20.3,21.7,5.5,.4,0]]);const m=f.pool[0].userData.disc,pos=m.geometry.attributes.position,idx=m.geometry.index,v=new THREE.Vector3();
 const height=(x,z)=>{const i=Math.floor(x),j=Math.floor(z),u=x-i,w=z-j,n=f.field.n,h=f.field.data,a=h[j*n+i],b=h[j*n+i+1],c=h[(j+1)*n+i],d=h[(j+1)*n+i+1];return u+w<=1?a+(b-a)*u+(c-a)*w:d+(c-d)*(1-u)+(b-d)*(1-w);};
 for(let i=0;i<idx.count;i+=3){const centre=new THREE.Vector3();for(let k=0;k<3;k++)centre.add(v.fromBufferAttribute(pos,idx.getX(i+k)).applyMatrix4(m.matrixWorld));centre.multiplyScalar(1/3);assert(Math.abs(centre.y-height(centre.x,centre.z)-.08)<1e-5);}
});
test('flat fallback stays flat and malformed or oversized radii cannot allocate geometry',()=>{
 const disc=new THREE.Mesh(new THREE.BufferGeometry()),field={x0:0,z0:0,n:65,data:null};fitHazardTerrain(disc,field,20.3,21.7,2.47,7);assert([...disc.geometry.attributes.position.array].every(Number.isFinite));for(let i=0;i<disc.geometry.attributes.position.count;i++)assert.equal(disc.geometry.attributes.position.getY(i),0);for(const radius of[0,-1,NaN,Infinity,1e9])assert.throws(()=>fitHazardTerrain(disc,field,20,21,radius,7),RangeError);
});
test('masked warning patches stay out of solid AO/depth overrides while the meteor keeps its layer',()=>{
 const f=fixture(),disc=f.pool[0].userData.disc,rock=f.pool[0].userData.rock,depthCamera=new THREE.PerspectiveCamera(),mainCamera=new THREE.PerspectiveCamera();mainCamera.layers.enable(1);assert.equal(disc.layers.test(depthCamera.layers),false);assert.equal(disc.layers.test(mainCamera.layers),true);assert.equal(rock.layers.test(depthCamera.layers),true);
});
