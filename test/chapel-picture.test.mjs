import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
const source=readFileSync(new URL('../src/render.js',import.meta.url),'utf8');
const world=JSON.parse(readFileSync(new URL('../public/assets/world/scenes/world.json',import.meta.url),'utf8'));
function nativePlanes(){
 const planes=[];const walk=(node,parent,ancestors=[])=>{
  const o=new THREE.Object3D(),t=node.transform;parent.add(o);
  if(t?.position)o.position.fromArray(t.position);if(t?.rotation)o.rotation.fromArray(t.rotation);if(t?.scale!=null)Array.isArray(t.scale)?o.scale.fromArray(t.scale):o.scale.setScalar(t.scale);
  for(const c of node.components||[])if(c.type==='imagePlane')planes.push({id:node.id,file:c.filename,o,ancestors});
  for(const child of node.children||[])walk(child,o,[...ancestors,node]);
 };const root=new THREE.Object3D();for(const n of world)walk(n,root);root.updateMatrixWorld(true);return planes;
}
test('native chapel glass is a sibling of the roof and remains visible while the actual roof lifts',()=>{
 const planes=nativePlanes(),glass=planes.find(p=>p.id==='yc0y57i6t');assert(glass);assert.equal(glass.ancestors.at(-1).id,'b5grfwvvg');
 assert.equal(planes.length,8);assert(planes.every(p=>p.ancestors.every(n=>!/roof|dormer|chimney|town_entry/i.test(n.name||''))),'all current native pictures belong outside roof groups');
 const rugs=new THREE.Group();for(const p of planes){const m=new THREE.Object3D();m.matrixAutoUpdate=false;m.matrix.copy(p.o.matrixWorld);rugs.add(m);}
 const roofHidden=new Set(),roofBoxes=new Map([[434,{name:'chapel',x0:260,x1:280,z0:230,z1:250,y0:6.3,pts:[267.5,240.5],geo:new THREE.Box3(new THREE.Vector3(260,6.3,230),new THREE.Vector3(280,12,250))}]]),matrices=[];
 const roofMeshes=[{mats:[new THREE.Matrix4()],bldgs:[434],wall:false,im:{setMatrixAt(i,m){matrices[i]=m.clone();},instanceMatrix:{}}}];
 const start=source.indexOf('  function updateRoofs('),end=source.indexOf('  // Roofs off:',start),pictureStart=source.indexOf('  function pictureBuilding('),pictureEnd=source.indexOf('  // Build (or rebuild)',pictureStart);
 const code=source.slice(start,end)+(pictureStart<0?'':source.slice(pictureStart,pictureEnd));
 const update=Function('THREE','rugs','roofBoxes','roofHidden','roofMeshes',`const terrain=null,ZERO=new THREE.Matrix4().makeScale(0,0,0),isLandmark=()=>true,keepsWalls=()=>true;let roofsOff=false;${code};return(x,z,off=false)=>{roofsOff=off;updateRoofs(x,z);};`)(THREE,rugs,roofBoxes,roofHidden,roofMeshes);
 for(const off of[false,true]){
  update(267.5,240.5,off);assert(roofHidden.has(434),'chapel roof actually lifts');assert.equal(matrices[0].elements[0],0);
  assert(rugs.children.every(p=>p.visible),'glass and floor rugs must stay visible inside');
  update(300,300,off);assert(!roofHidden.has(434));assert.equal(matrices[0].elements[0],1);assert(rugs.children.every(p=>p.visible));
 }
});
