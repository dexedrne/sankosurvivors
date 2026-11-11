import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {WebGLRenderLists} from 'three/src/renderers/webgl/WebGLRenderLists.js';
import {spellFixture,near} from './helpers/spell-motion-fixture.mjs';

const shot=(id=1,evo=false)=>[id,'ball',2,0,Math.PI/2,evo?6:1,0,evo,-1];
const view=(t,proj=[shot()],extra={})=>({t,alpha:1,players:[{id:'p1',x:0,z:0,al:true,w:{baseball:1}}],proj,eproj:[],pending:{},over:null,...extra});
const visual=(f,id=1)=>f.projObjs.get(id).userData.spinner;
const spin=o=>o.isSprite?o.material.rotation:o.rotation.z;

for(const evo of [false,true])test((evo?'evolved':'normal')+' baseball uses the original stitched icon at its existing visible diameter',()=>{
 const f=spellFixture();f.frame(view(.1,[shot(1,evo)]));const root=f.projObjs.get(1),ball=visual(f);
 assert.equal(ball.isSprite,true,'The native stitched baseball replaces the red belt sphere');
 assert.equal(ball.material.map.name,'assets/ui/items/item_Baseball.png');
 near(ball.scale.x,.45);near(ball.scale.y*36/54,.3);assert.equal(ball.material.depthTest,true);assert.equal(ball.material.depthWrite,false);assert.equal(ball.material.alphaTest,.3);
 assert.equal(ball.layers.mask,2,'Transparent native icons stay outside solid AO/depth redraws');
 assert.equal(root.children.length,evo?2:1);if(evo)assert.equal(root.children[0].material.blending,f.THREE.AdditiveBlending);
});

test('baseball spin holds through long pause and reward redraws and resumes with presented time',()=>{
 const f=spellFixture();f.frame(view(.1));f.frame(view(.2));const ball=visual(f),before=spin(ball);
 f.wall(60000);for(let i=0;i<10;i++)f.frame(view(.2,undefined,{pending:{p1:'level'}}),1);
 near(spin(ball),before);f.frame(view(.3));near(spin(ball)-before,1.2);
 f.frame(view(.3,undefined,{alpha:0}));near(spin(ball),before+1.2);
});

test('new baseball launches start a fresh spin without resetting an older ball',()=>{
 const f=spellFixture();f.frame(view(.1));f.frame(view(.3,[shot(),shot(2)]));near(spin(visual(f)),2.4);near(spin(visual(f,2)),0);
 f.frame(view(.4,[shot(),shot(2)]));near(spin(visual(f)),3.6);near(spin(visual(f,2)),1.2);
});

test('retiring a baseball disposes its private material and keeps the native icon shared with surviving and future shots',()=>{
 const f=spellFixture();f.frame(view(.1,[shot(),shot(2)]));const a=visual(f),b=visual(f,2),texture=a.material.map;assert(texture);assert.equal(b.material.map,texture);
 let materialDisposals=0,textureDisposals=0;a.material.addEventListener('dispose',()=>materialDisposals++);texture.addEventListener('dispose',()=>textureDisposals++);
 f.frame(view(.2,[shot(2)]));assert.equal(materialDisposals,1);assert.equal(textureDisposals,0);assert.equal(b.material.map,texture);
 f.frame(view(.3,[shot(2),shot(3)]));assert.equal(visual(f,3).material.map,texture);assert.notEqual(b.material,visual(f,3).material);
});

test('baseball source art remains byte-identical to the verified native CDN icon',()=>{
 const bytes=readFileSync(new URL('../public/assets/ui/items/item_Baseball.png',import.meta.url));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'ef117bfa4c59c0df5f9ca2eaff1c22615d56b6cf5e0d02513bc087ac1fc34165');
});

test('evolved glow is drawn behind the stitched ball by the actual transparent sort',()=>{
 const f=spellFixture();f.frame(view(.1,[shot(1,true)]));const root=f.projObjs.get(1),ball=visual(f),glow=root.children.find(c=>c!==ball);
 const lists=new WebGLRenderLists(),list=lists.get(f.dyn,0);list.init();
 for(const o of root.children)list.push(o,o.geometry,o.material,0,.5,null,f.camera);
 list.sort();assert.deepEqual(list.transparent.map(item=>item.object.id),[glow.id,ball.id]);lists.dispose();
});
