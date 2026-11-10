import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {verifiedFile} from '../tools/package-racers.mjs';

const root = new URL('../', import.meta.url);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const read = file => fs.readFileSync(new URL(file, root));
const manifest = () => JSON.parse(read('public/fun/racers/manifest.json'));
const inputs = JSON.parse(read('tools/racers-inputs.json'));

test('packaging refuses changed bytes, traversal and symlinks at its input boundary', () => {
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'racers-input-'));
 try {
  fs.writeFileSync(path.join(dir,'safe'),'hello');
  const entry={path:'safe',bytes:5,sha256:'2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'};
  assert.equal(verifiedFile(dir,entry).toString(),'hello');
  assert.throws(()=>verifiedFile(dir,{...entry,sha256:'0'.repeat(64)}),/hash/i);
  for(const file of ['../safe','/safe','a/../../safe','a\\safe','%2e%2e/safe','./safe'])
   assert.throws(()=>verifiedFile(dir,{...entry,path:file}),/path/i);
  fs.symlinkSync(path.join(dir,'safe'),path.join(dir,'link'));
  assert.throws(()=>verifiedFile(dir,{...entry,path:'link'}),/symlink/i);
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
});

test('every packaged and shared route dependency matches its recorded bytes', () => {
 const m=manifest();
 assert.equal(m.source.commit,inputs.commit);
 assert.equal(m.source.rulesVersion,inputs.rulesVersion);assert.match(inputs.rulesVersion,/^[0-9a-f]{12}$/);
 assert.match(m.source.commit,/^[a-f0-9]{40}$/);
 assert.equal(m.shared.length,271);
 for(const item of [...m.files,...m.shared]) {
  assert.match(item.path,/^\/(?:fun\/racers|assets|draco)\//);
  assert.ok(!item.path.includes('..'));
  const bytes=read(`public${item.path}`);
  assert.equal(bytes.length,item.bytes,item.path);
  assert.equal(hash(bytes),item.sha256,item.path);
 }
 const unique=inputs.files.filter(f=>f.role==='unique').map(f=>'/assets/racers/'+f.path.slice('assets/'.length)).sort();
 assert.deepEqual(m.files.filter(i=>i.path.startsWith('/assets/racers/')).map(i=>i.path).sort(),unique);
 const karts=m.files.filter(f=>f.path.startsWith('/assets/racers/karts/')&&f.path.endsWith('.glb'));assert.equal(karts.length,14);
 for(const notice of ['NOTICES.txt','LICENSE-MIT.txt','LICENSE-DRACO.txt'])assert(m.files.some(f=>f.path==='/assets/racers/karts/'+notice));
});

test('static entry resolves relative code and styles and returns to the Fun menu', () => {
 const html=read('public/fun/racers/index.html').toString();
 for(const [,relative] of html.matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g))
  assert.ok(fs.existsSync(new URL(`public/fun/racers/${relative.slice(2)}`,root)),relative);
 assert.match(html,/href="\/\?menu=fun"[^>]*>Back to SankoSurvivors<\/a>/);
 assert.doesNotMatch(html,/<iframe\b/i);
 assert.match(html, /property="og:title" content="Sanko Racers · Public World Hub"/);
 assert.match(html, /property="og:url" content="https:\/\/sankosurvivors\.quest\/racers\/"/);
 assert.match(html, /name="twitter:card" content="summary_large_image"/);
 const image=html.match(/property="og:image" content="([^"]+)"/)[1];
 assert.equal(image,'https://sankosurvivors.quest/fun/racers/preview-'+inputs.preview.sha256.slice(0,12)+'.png');
 assert.equal(hash(read('public/fun/racers/preview.png')),inputs.preview.sha256,'Preview remains the accepted native capture');
 const m=manifest();
 const js=read(`public${m.files.find(f=>f.path.endsWith('.js')).path}`).toString();
 assert.match(js,/"free":"hub"/);
 assert(html.includes('id="hubmode"'));assert(html.includes('id="updates"'));assert(html.includes('id="settings"'));
 assert(js.includes(inputs.rulesVersion),'Client and recorded authority fingerprint agree');
 assert.match(js,/sanko-racers-world-v2/);assert.match(js,/sanko-racers-world-v1/);assert(html.includes('id="surface-state"'));assert(html.includes('id="previous-best"'));
 assert(m.files.some(f=>/^\/assets\/racers\/world\/tiles\/surfaces-[0-9a-f]{12}\.bin$/.test(f.path)));
 assert(js.includes('minX:0,maxX:512,minZ:0,maxZ:512'));
 for(const phrase of ['FREE DRIVE · SANKOQUEST WORLD','WORLD RACE · GUARD & PRIEST','handbrake'])assert(js.includes(phrase),phrase);
 const css=read(`public${m.files.find(f=>f.path.endsWith('.css')).path}`).toString();
 for(const asset of ['RuneScape-Plain-12.ttf','RuneScape-Quill-8.ttf','frame.png','grey_slot.png','yellow_slot.png'])assert(css.includes(asset),asset);
 assert(html.includes('data-action="handbrake"'));
 assert(html.includes('id="fire"'));assert(html.includes('id="combat-status"'));assert(js.includes('WILDERNESS'));
 assert(html.includes('id="free-start"'));assert(html.includes('id="vehicle-choice"'));assert(html.includes('CRASHOUT KARTS'));assert(js.includes('Same handling for every vehicle.'));
 for(const key of ['sanko-racers-world-v1','racers-graphics','racers-volume','racers-muted'])assert(js.includes(key),key);
 assert.doesNotMatch(js,/["']sq-|localStorage\.clear\(/);
 assert.doesNotMatch(js,/\.\/assets\/|\.\/draco\/|100\.65\.235\.118|127\.0\.0\.1|supabase/i);
 assert(html.includes('id="wallet-connect"'));assert(html.includes('id="owned-use"'));assert(html.includes('https://opensea.io/collection/sanko-crashout-kart'));assert(js.includes('0x70013D4F2c4F81325a6D59f9D3EE11e215e5ea52'));assert(js.includes('Racers only reads wallet accounts.'));assert(js.includes('/assets/racers/crashout/'));
 assert.equal(js.includes('nav.bin'),false);assert.equal(js.includes('world/tiles/fences.json'),false);
 for(const file of ['weapons/hand_pistol.glb','cars/miata.glb','placements.json','world/tiles/fences-9f238cc0bd85.json'])
  assert.ok(js.includes(`racers/${file}`),file);
});

test('adapted client reverses exactly to the accepted source artifact', () => {
 const m=manifest();
 let js=read(`public${m.files.find(f=>f.path.endsWith('.js')).path}`).toString();
 for(const {before,after,count} of [...m.adaptations.client].reverse()) {
  assert.equal(js.split(after).length-1,count,after);
  js=js.split(after).join(before);
 }
 assert.equal(hash(js),inputs.files.find(f=>f.role==='client').sha256);
 const credits=read('public/fun/racers/CREDITS.txt').toString();
 assert.match(credits,/Speedy-Works/);assert.match(credits,/CrashOut Karts/);assert.match(credits,/Sanko retains its artwork rights/);
 assert.match(read('public/assets/racers/karts/NOTICES.txt').toString(),/not a public-domain/);
 assert.match(read('public/assets/racers/karts/LICENSE-MIT.txt').toString(),/Permission is hereby granted/);
 assert.match(read('public/assets/racers/karts/LICENSE-DRACO.txt').toString(),/Apache License/);
 assert.match(credits,/creativecommons.org\/licenses\/by\/4.0/);
 assert.match(read('public/fun/racers/LICENSE.shitbox').toString(),/VIRAL PUBLIC LICENSE[\s\S]*No further restrictions/);
});

test('clean Racers share link serves the real game with absolute dependencies and a fresh sized native card',()=>{
 const m=manifest(),alias=m.aliases?.find(a=>a.path==='/racers/index.html');assert(alias,'clean share alias is recorded');
 const bytes=read('public/racers/index.html'),html=bytes.toString();assert.equal(hash(bytes),alias.sha256);assert.equal(bytes.length,alias.bytes);
 assert.match(html,/<link rel="canonical" href="https:\/\/sankosurvivors\.quest\/racers\/">/);assert.match(html,/property="og:url" content="https:\/\/sankosurvivors\.quest\/racers\/"/);
 for(const dimension of [['width','1200'],['height','630'],['type','image/png']])assert(html.includes('property="og:image:'+dimension[0]+'" content="'+dimension[1]+'"'));
 assert(html.includes('name="twitter:site" content="@dexedrne"'));assert(!/(?:src|href)="\.\//.test(html));
 for(const [,relative]of html.matchAll(/(?:src|href)="(\/fun\/racers\/[^"?#]+)"/g))assert(fs.existsSync(new URL('public'+relative,root)),relative);
 const image=html.match(/property="og:image" content="([^"]+)"/)[1];assert.match(image,/preview-[0-9a-f]{12}\.png$/);assert.equal(hash(read('public'+new URL(image).pathname)),inputs.preview.sha256);
});
