import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader.js';
import {createCharacterKit,disposeActor} from '../src/character.js';
import {GEAR} from '../src/content.js';
import {nativeAnimationFixture,boneState} from './helpers/native-animation.mjs';

const names=["Magician's Amulet","Warrior's Amulet",'Power Amulet'];
test('renderer resolves actual neck gear as native clothing, excluding rings and shields',async()=>{
 const text=await readFile(new URL('../src/render.js',import.meta.url),'utf8');
 const block=text.slice(text.indexOf('  const GEAR_FOLDER ='),text.indexOf('  const itemProtos ='));
 const paths=[];const helpers=Function('GEAR','kit',block+'return {isClothing,clothPath,preloadGear};')(GEAR,{load:p=>{paths.push(p);}});
 for(const name of names){assert(helpers.isClothing(name));assert.equal(helpers.clothPath(name),'Neck/Clothing/'+name);}
 assert(!helpers.isClothing('Ember Band'));assert(!helpers.isClothing('Ogre Shield'));assert(!helpers.isClothing('not gear'));
 await helpers.preloadGear([...names,'Ember Band']);assert.deepEqual(paths,names.map(n=>'Neck/Clothing/'+n));
});

test('original amulet meshes bind to separate actors and replace/remove without disposing cached sources',async t=>{
 const fixture=await nativeAnimationFixture(),master=fixture.master;
 // A simple body gives the native reference skeleton finite build bounds; pendants use their real geometry.
 const bones=[];master.scene.traverse(o=>{if(o.isBone)bones.push(o);});
 const geometry=new T.BoxGeometry(1,1,1),count=geometry.attributes.position.count;
 geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(new Uint16Array(count*4),4));
 const weights=new Float32Array(count*4);for(let i=0;i<count;i++)weights[i*4]=1;
 geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
 const body=new T.SkinnedMesh(geometry,new T.MeshStandardMaterial());master.scene.add(body);master.scene.updateMatrixWorld(true);body.bind(new T.Skeleton(bones));
 const models=new Map(),sources=[];
 for(const name of names){const bytes=await readFile(new URL('../public/assets/models/playerCharacter/Neck/Clothing/'+name+'.glb',import.meta.url));
  const model=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');models.set('Neck/Clothing/'+name,model);
  const parts=[];model.scene.traverse(o=>{if(o.isSkinnedMesh)parts.push(o);});assert.equal(parts.length,3);sources.push(...parts);
 }
 const before=sources.map(o=>Array.from(o.geometry.attributes.position.array));
 const sourcePoses=new Map([...models].map(([key,model])=>[key,boneState(model.scene)]));
 let disposed=0;for(const o of sources){o.geometry.addEventListener('dispose',()=>disposed++);o.material.addEventListener('dispose',()=>disposed++);}
 t.mock.method(FBXLoader.prototype,'loadAsync',async url=>({animations:[fixture.clips.get(url.split('/').at(-1).split('.')[0]).clone()],traverse:fn=>master.scene.traverse(fn)}));
 const kit=await createCharacterKit(async url=>{const path=decodeURIComponent(url).replace(/^models\/playerCharacter\//,'').replace(/\.glb$/,'');if(path==='Chest/Styles/Shoulders')return master;if(models.has(path))return models.get(path);throw Error('not needed');},p=>p);
 for(const name of names)await kit.load('Neck/Clothing/'+name);
 const a=kit.build(),b=kit.build();const allMeshes=actor=>{const list=[];actor.root.traverse(o=>{if(o.isSkinnedMesh)list.push(o);});return list;};
 const pendant=(actor,name)=>allMeshes(actor).filter(o=>sources.some(s=>s.geometry===o.geometry)&&models.get('Neck/Clothing/'+name).scene.getObjectByProperty('geometry',o.geometry));
 try{
  for(const name of names){a.setArmor({neck:name});assert.equal(pendant(a,name).length,3,'actual pendant geometry attaches');a.mixer.update(.1);}
  b.setArmor({neck:names[1]});a.setArmor({});assert.equal(allMeshes(a).length,1);assert.equal(pendant(b,names[1]).length,3);
  a.setArmor({neck:names[0]});assert.equal(pendant(a,names[0]).length,3);assert.notEqual(pendant(a,names[0])[0].skeleton,pendant(b,names[1])[0].skeleton);
 }finally{disposeActor(a.root,a.mixer);disposeActor(b.root,b.mixer);}
 assert.equal(disposed,0,'cached source geometry/material stays alive');
 sources.forEach((o,i)=>assert.deepEqual(Array.from(o.geometry.attributes.position.array),before[i]));
 for(const[key,model]of models)assert.deepEqual(boneState(model.scene),sourcePoses.get(key));
});
