import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8'),start=main.indexOf('function buildMaps('),builder=main.slice(start,main.indexOf('async function pickMap(',start));
const assetSource=fs.readFileSync(new URL('../src/assets.js',import.meta.url),'utf8');let revision=0;
async function fixture(cdn=true){
 const env={BASE_URL:'./',VITE_ASSET_BASE_1:cdn?'https://one/':'',VITE_ASSET_BASE_2:cdn?'https://two/':''},assets=await import('data:text/javascript,'+encodeURIComponent(assetSource.replaceAll('import.meta.env',JSON.stringify(env)))+'#map-'+revision++);
 let error;assets.installAssetFallback({fetch:async()=>({ok:true}),addEventListener:(type,fn)=>error=fn});
 const maps=[{id:'green',name:'Green',cx:10,cz:20,finalBoss:'boss'},{id:'world',name:'World',world:true,finalBoss:'boss'}],nodes=new Map(),picked=[];
 const classes=()=>({remove(){},toggle(){},contains:()=>false});
 const $=id=>{if(!nodes.has(id))nodes.set(id,{classList:classes(),children:[]});return nodes.get(id);};
 Object.defineProperty($('mpick'),'innerHTML',{set(html){this.html=html;this.children=[...html.matchAll(/<div class="mopt[^"\n]*" data-id="([^"]+)"><div class="thumb" style="([^"]*)">([\s\S]*?)<\/div>/g)].map(([,id,css,body])=>{
  const thumb={style:{backgroundImage:css.match(/background-image:([^;]+)/)[1],backgroundSize:css.match(/background-size:([^;]+)/)[1],backgroundPosition:css.match(/background-position:([^;]+)/)[1]}},src=body.match(/<img[^>]*src="([^"]+)"/),image=src?{tagName:'IMG',dataset:{},src:src[1],currentSrc:src[1],hidden:/<img[^>]*\bhidden\b/.test(body),alt:''}:null;
  return{dataset:{id},classList:classes(),thumb,image,querySelector:selector=>selector==='img'?image:selector==='.thumb'?thumb:null};
 });}});
 const build=Function('$','MAPS','MAP_BY_ID','ADVENTURER_BY_ID','asset','clearedMaps','unlockedMap','pickMap','bossName','params','showBest',`let selMap='green',selAdv='adventurer',hardOn=false,endlessOn=false;${builder};return buildMaps;`)($,maps,Object.fromEntries(maps.map(m=>[m.id,m])),{adventurer:{name:'Hero'}},assets.asset,()=>new Set(),()=>true,id=>picked.push(id),()=> 'Boss',new URLSearchParams(),()=>{});
 build();assert.equal($('mpick').children.length,2);return{$,build,error,picked,rows:()=> $('mpick').children};
}
test('map backgrounds recover from a single-file CDN failure through the existing image fallback',async()=>{
 const f=await fixture(),geometry=f.rows().map(r=>[r.thumb.style.backgroundSize,r.thumb.style.backgroundPosition]);
 for(const row of f.rows())if(row.image){const image=row.image;assert(image.hidden&&image.alt==='');f.error({target:image,stopPropagation(){}});image.currentSrc=image.src;image.onload?.();}
 for(const row of f.rows())assert(row.thumb.style.backgroundImage.includes('./assets/world/world-map-full.webp'),row.thumb.style.backgroundImage);
 assert.deepEqual(f.rows().map(r=>[r.thumb.style.backgroundSize,r.thumb.style.backgroundPosition]),geometry);f.rows()[1].onclick();assert.deepEqual(f.picked,['world']);
});
test('healthy CDN thumbnails retain their CDN URL, crop and map selection',async()=>{
 const f=await fixture();for(const row of f.rows()){row.image?.onload?.();assert(row.thumb.style.backgroundImage.includes('https://one/world/world-map-full.webp'));}
 assert.equal(f.rows()[0].thumb.style.backgroundSize,'614.4px');assert.equal(f.rows()[1].thumb.style.backgroundSize,'cover');f.rows()[0].onclick();assert.deepEqual(f.picked,['green']);
});
test('local builds and repeated map-menu rebuilds keep thumbnails local and usable',async()=>{
 const f=await fixture(false);assert.equal(f.error,undefined);for(let i=0;i<2;i++){for(const row of f.rows()){row.image?.onload?.();assert(row.thumb.style.backgroundImage.includes('./assets/world/world-map-full.webp'));}f.build();}
});
