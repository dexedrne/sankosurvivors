import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
import{drawStormMinimap}from'../src/storm-effects.js';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8'),a=main.indexOf('const mmImg = '),b=main.indexOf('// ---- main loop',a);assert.ok(a>=0&&b>a);
function fixture(){let host='cdn/',image,images=0,dots=0;const requests=[];class Image{constructor(){image=this;this.complete=true;this.naturalWidth=0;this.url='';}set src(v){requests.push(v);this.url=v;}get src(){return this.url;}}
const ctx=new Proxy({drawImage(img){if(!img.naturalWidth)throw Error('broken image');images++;},arc(){dots++;}},{get:(o,k)=>o[k]??(()=>{})});const mm={width:168,getContext:()=>ctx};
const draw=Function('Image','asset','$','renderer','sim','ENEMIES','drawStormMinimap','const PLAYER="p1";'+main.slice(a,main.indexOf('function setMapPeek(',a))+main.slice(main.indexOf('function drawMinimap(',a),b)+';return drawMinimap;')(Image,p=>host+p,()=>mm,{getYaw:()=>0},{map:{r:501}},{goblin:{boss:false}},drawStormMinimap);
const view={players:[{id:'p1',x:1,z:1,f:0}],pickups:[],enemies:[[1,'goblin',2,2,0,100,0,0]]};return{draw,view,requests,image,local:()=>host='local/',counts:()=>({images,dots})};}
test('minimap chooses the resolved asset host when first drawn, never during module initialization',()=>{
 const h=fixture();assert.deepEqual(h.requests,[]);h.local();h.image.naturalWidth=100;h.draw(h.view);assert.deepEqual(h.requests,['local/world/world-map-full.webp']);h.draw(h.view);assert.equal(h.requests.length,1);assert.equal(h.counts().images,2);
});
test('broken or pending map art cannot throw or hide the minimap enemy and player markers',()=>{
 const h=fixture();for(const complete of [false,true]){h.image.complete=complete;assert.doesNotThrow(()=>h.draw(h.view));}assert.equal(h.counts().images,0);assert.ok(h.counts().dots>=4);assert.equal(h.requests.length,1);
});
