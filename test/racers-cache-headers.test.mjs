import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../tools/build-vercel.sh',import.meta.url),'utf8');
const config=JSON.parse(source.match(/cat > \.vercel\/output\/config\.json <<'JSON'\n([\s\S]*?)\nJSON/)[1]);
const headers=path=>Object.assign({},...config.routes.filter(r=>r.src&&new RegExp(r.src).test(path)).map(r=>r.headers||{}));

test('content-hashed driving code, previews and map data reuse the browser cache',()=>{
 for(const path of ['/fun/racers/racers-2a48d28a32272ded.js','/fun/racers/racers-2ae499a0e2502ae9.css','/fun/racers/preview-f3f8905a5df8.png','/assets/racers/world/tiles/fences-bdb2335d6b32.json','/assets/racers/world/tiles/surfaces-ffe7cf27a1ad.bin']){
  assert.equal(headers(path)['Cache-Control'],'public, max-age=31536000, immutable',path);
  assert.equal(headers(path)['X-Content-Type-Options'],'nosniff');
 }
});

test('live documents, mutable world files, manifests and player APIs never inherit immutable caching',()=>{
 for(const path of ['/','/racers/','/fun/racers/index.html','/fun/racers/manifest.json','/fun/racers/preview.png','/assets/racers/placements.json','/assets/racers/world/tiles/fences.json','/api/ranked-week','/api/save-get','/version.json','/sw.js'])assert(!/immutable/.test(headers(path)['Cache-Control']||''),path);
 assert.match(headers('/assets/world/tiles/height.bin')['Cache-Control'],/max-age=86400/);
});


test('original kart, roadster, modular and weapon assets reuse the bounded native-art cache',()=>{
 for(const path of ['/assets/racers/cars/miata.glb','/assets/racers/karts/01-Tuner-Stock-White.glb','/assets/racers/crashout/textures/kart.png','/assets/racers/weapons/hand_pistol.glb'])assert.equal(headers(path)['Cache-Control'],'public, max-age=86400, stale-while-revalidate=604800',path);
 for(const path of ['/assets/racers/placements.json','/assets/racers/world/tiles/fences.json','/fun/racers/index.html','/fun/racers/manifest.json','/api/save-get','/version.json'])assert.equal(headers(path)['Cache-Control'],undefined,path);
});
