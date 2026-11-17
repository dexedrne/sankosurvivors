import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {wavedashEdition} from '../tools/wavedash/edition.mjs';
const source=fs.readFileSync(new URL('../src/assets.js',import.meta.url),'utf8'),main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');let revision=0;
const assets=()=>import('data:text/javascript,'+encodeURIComponent(source.replaceAll('import.meta.env','({BASE_URL:"./",VITE_ASSET_BASE_1:"https://one/",VITE_ASSET_BASE_2:"https://two/"})'))+'#early-'+revision++);
function isolate(t,fetch){const original=globalThis.fetch,had=Object.hasOwn(globalThis,'__sqAssetFallback'),flag=globalThis.__sqAssetFallback;globalThis.fetch=fetch;delete globalThis.__sqAssetFallback;t.after(()=>{globalThis.fetch=original;if(had)globalThis.__sqAssetFallback=flag;else delete globalThis.__sqAssetFallback;});}
test('actual main startup installs recovery before audio can fetch while CDN admission is pending',async t=>{
 const calls=[],probes=[];isolate(t,async(url,init)=>{calls.push(url);if(url.endsWith('item_Gold.png')||url.endsWith('Skelly.glb'))return new Promise(resolve=>probes.push(()=>resolve({ok:true,url})));return{ok:!url.startsWith('https://one/'),url};});
 const m=await assets(),a=main.indexOf('const keys = new Set();'),b=main.indexOf('const p2 =',a);assert(a>=0&&b>a);
 const audio=Function('installAssetFallback','createAudio',main.slice(a,b)+';return audio;')(m.installAssetFallback,()=>({init:()=>fetch(m.asset('sound/soundEffects/PickUp_item.mp3'))}));
 let settled=false;const admission=m.pickAssetHost().then(host=>{settled=true;return host;});
 try{const response=await audio.init();assert.equal(settled,false);assert.equal(response.ok,true);assert.equal(response.url,'./assets/sound/soundEffects/PickUp_item.mp3');assert.equal(calls.filter(u=>u==='https://one/sound/soundEffects/PickUp_item.mp3').length,1);}finally{for(const finish of probes)finish();await admission;}
 assert.equal(m.assetHost(),'cdn');
});
test('whole-CDN admission still fails closed to local when per-file recovery is installed early',async t=>{
 const calls=[];isolate(t,async(url,init)=>{calls.push({url,method:init?.method||'GET'});return{ok:!url.startsWith('https://'),url};});const m=await assets();m.installAssetFallback();assert.equal(await m.pickAssetHost(),'local');assert.equal(m.asset('world/height.bin'),'./assets/world/height.bin');assert.deepEqual(calls,[{url:'https://one/ui/items/item_Gold.png',method:'GET'},{url:'https://two/models/mobs/Skelly.glb',method:'HEAD'}],'health probes must not be rescued by the local copy');
});
test('the offline edition implements the shared asset recovery interface without external fetching',async()=>{
 const adapted=wavedashEdition().transform(source,'/fixture/src/assets.js');assert(adapted?.code);const m=await import('data:text/javascript,'+encodeURIComponent(adapted.code.replaceAll('import.meta.env','({BASE_URL:"./"})')));assert.equal(m.asset('world/map.webp'),'./assets/world/map.webp');assert.equal(m.assetHost(),'local');assert.equal(await m.pickAssetHost(),'local');assert.equal(typeof m.localOf,'function');assert.equal(m.localOf('https://one/file'),'');assert.equal(typeof m.installAssetFallback,'function');assert.equal(m.installAssetFallback(),false);
});
test('assets already requested from CDN can recover after health probes switch new loads to local',async t=>{
 isolate(t,async()=>({ok:false}));const m=await assets(),listeners=[];
 const w={fetch:globalThis.fetch,addEventListener:(name,fn)=>listeners.push(fn)};m.installAssetFallback(w);
 const music=m.asset('music/Fresh_Beginnings.mp3'),icon={tagName:'IMG',src:m.asset('ui/items/item_Bones.png'),dataset:{}};
 assert.equal(await m.pickAssetHost(),'local');assert.equal(m.asset('music/Fresh_Beginnings.mp3'),'./assets/music/Fresh_Beginnings.mp3');
 assert.equal(m.localOf(music),'./assets/music/Fresh_Beginnings.mp3','late detached music errors still have a local retry');
 listeners[0]({target:icon});assert.equal(icon.src,'./assets/ui/items/item_Bones.png','late DOM image errors still recover');
 assert.equal(m.localOf(icon.src),'');assert.equal(m.localOf('https://elsewhere/file'),'');
});
test('a build without CDN configuration never treats arbitrary URLs as CDN assets',async()=>{
 const m=await import('data:text/javascript,'+encodeURIComponent(source.replaceAll('import.meta.env','({BASE_URL:"./"})')));
 assert.equal(m.assetHost(),'local');for(const url of ['https://elsewhere/file','./assets/file','file'])assert.equal(m.localOf(url),'');
});
