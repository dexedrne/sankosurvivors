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
 assert.equal(m.source.commit,'e527ab4e11cc31da797d2f5fbc88a07ac4c67213');
 assert.equal(m.shared.length,197);
 for(const item of [...m.files,...m.shared]) {
  assert.match(item.path,/^\/(?:fun\/racers|assets|draco)\//);
  assert.ok(!item.path.includes('..'));
  const bytes=read(`public${item.path}`);
  assert.equal(bytes.length,item.bytes,item.path);
  assert.equal(hash(bytes),item.sha256,item.path);
 }
 assert.deepEqual(m.files.filter(i=>i.path.startsWith('/assets/racers/')).map(i=>i.path).sort(),[
  '/assets/racers/cars/miata.glb','/assets/racers/placements.json','/assets/racers/world/tiles/fences.json'
 ]);
});

test('static entry resolves relative code and styles and returns to the Fun menu', () => {
 const html=read('public/fun/racers/index.html').toString();
 for(const [,relative] of html.matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g))
  assert.ok(fs.existsSync(new URL(`public/fun/racers/${relative.slice(2)}`,root)),relative);
 assert.match(html,/href="\/\?menu=fun"[^>]*>Back to SankoSurvivors<\/a>/);
 assert.doesNotMatch(html,/<iframe\b/i);
 const m=manifest();
 const js=read(`public${m.files.find(f=>f.path.endsWith('.js')).path}`).toString();
 assert.match(js,/==="race"\?"race":"survivors"/);
 assert.match(js,/sanko-racers-greentown-v1/);
 assert.equal((js.match(/localStorage/g)||[]).length,2);
 assert.doesNotMatch(js,/\.\/assets\/|\.\/draco\/|100\.65\.235\.118|127\.0\.0\.1|localhost|walletconnect|supabase|ethereum|\/api\//i);
 assert.equal(js.includes('nav.bin'),false);
 for(const file of ['cars/miata.glb','placements.json','world/tiles/fences.json'])
  assert.ok(js.includes(`racers/${file}`),file);
});

test('adapted client reverses exactly to the accepted source artifact', () => {
 const m=manifest();
 let js=read(`public${m.files.find(f=>f.path.endsWith('.js')).path}`).toString();
 for(const {before,after,count} of [...m.adaptations.client].reverse()) {
  assert.equal(js.split(after).length-1,count,after);
  js=js.split(after).join(before);
 }
 assert.equal(hash(js),'6e8680bdee4ec04a9a1460ad3b333da0c51b568cff127318b258cb4f41b01cf3');
 const credits=read('public/fun/racers/CREDITS.txt').toString();
 assert.match(credits,/Speedy-Works/);
 assert.match(credits,/creativecommons.org\/licenses\/by\/4.0/);
 assert.match(read('public/fun/racers/LICENSE.shitbox').toString(),/VIRAL PUBLIC LICENSE[\s\S]*No further restrictions/);
});
