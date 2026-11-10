// Reuse the accepted client; fail closed when any source or shared asset changes.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const inputs=JSON.parse(fs.readFileSync(new URL('./racers-inputs.json',import.meta.url)));
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
export function verifiedFile(root,entry) {
 const relative=entry.path;
 assert.equal(typeof relative,'string','Invalid path');
 assert.ok(relative && !path.isAbsolute(relative) && !/[\\%]/.test(relative) &&
  relative.split('/').every(p=>p && p!=='.' && p!=='..'),'Invalid path');
 let file=path.resolve(root);
 for(const part of relative.split('/')) {
  file=path.join(file,part);
  assert.ok(!fs.lstatSync(file).isSymbolicLink(),`Symlink path: ${relative}`);
 }
 const bytes=fs.readFileSync(file);
 assert.equal(bytes.length,entry.bytes,`Size mismatch: ${relative}`);
 assert.equal(sha256(bytes),entry.sha256,`Hash mismatch: ${relative}`);
 return bytes;
}
const clientChanges=[
 {before:'"./assets/"',after:'"/assets/"',count:3},
 {before:'"./assets/music/"',after:'"/assets/music/"',count:1},
 {before:'"./draco/"',after:'"/draco/"',count:1},
 {before:'"cars/miata.glb"',after:'"racers/cars/miata.glb"',count:1},
 {before:'"karts/',after:'"racers/karts/',count:14},
 {before:'"placements.json"',after:'"racers/placements.json"',count:1},
 {before:'"world/tiles/fences-d02577f501f9.json"',after:'"racers/world/tiles/fences-d02577f501f9.json"',count:1},
 {before:'"world/tiles/surfaces-ffe7cf27a1ad.bin"',after:'"racers/world/tiles/surfaces-ffe7cf27a1ad.bin"',count:1}
];
function replaceExact(text,{before,after,count=1}) {
 assert.equal(text.split(before).length-1,count,`Unexpected adaptation anchor: ${before}`);
 return text.split(before).join(after);
}
const extraCss='\n.racers-back{display:flex;align-items:center;justify-content:center;min-height:44px;margin:12px 0;font-weight:700}\n';
const notice=`SANKO RACERS — SANKOSURVIVORS FUN INTEGRATION\n\nAccepted original Racers source: ${inputs.commit} (accepted driving build).\nThe existing fan game's owner requested this packaged Fun route on 9 November 2026. That scope does not establish a new licence grant, endorsement, or authorization for unrelated standalone publication.\n\nThe owner supplied the CrashOut partner Models/Specs handoffs for this Sanko ecosystem integration. Fourteen original complete stock GLBs are used without modifying their bytes; Sanko retains its artwork rights. The partner NOTICES.txt and supplied full MIT/Draco texts are retained under /assets/racers/karts/. These cosmetic choices use the same existing physics; draft ratings, modular equipment, NFT ownership and wallet integration are not applied.\n\nNative SankoQuest assets and adapted terrain/character code retain their separate ownership and notices in CREDITS.txt. The exact accepted roadster is separately attributed to Speedy-Works under CC BY 4.0, with the Shitbox modifications described in CREDITS.txt; only its URL/location changed. No additional Shitbox game code was imported. LICENSE.shitbox is retained in full, separately from the car licence. Three.js and Draco notices are retained in full. Vite is build tooling, not shipped runtime code.\n\nClient adaptations: exact, hash-pinned asset/decoder URLs; private Racers car, placements and immutable collision fences; Public hub default (explicit offline ?mode=free, ?mode=race, ?mode=versus and ?mode=survivors remain); Back to SankoSurvivors link and scrollable short-screen panel. No gameplay/physics/storage logic changed. World Circuit best uses sanko-racers-world-v2 for native surface handling; the previous world-v1 best is displayed in Controls & credits and stays untouched, as does the old Greentown record; SankoSurvivors progress is not read or written.\n\nReproduce: node tools/package-racers.mjs <accepted-dist> <accepted-desktop-survivors.png> [SQS-public-root]. Input hashes are in tools/racers-inputs.json; served hashes and URL adaptations are in manifest.json. Reused shared files must match the accepted inputs byte-for-byte. The accepted inventory, nav.bin and original provenance-only fences.json are omitted from this package: none is referenced by the runtime client. Collision uses the accepted nav.png and content-hashed Racers fence data.\n\nPreview: unedited ${inputs.preview.path} from the accepted native countryside check, SHA256 ${inputs.preview.sha256}. No generated or redesigned models/art.\n`;

export function packageRacers(dist,preview,publicRoot) {
 const source=new Map(inputs.files.map(entry=>[entry.path,verifiedFile(dist,entry)]));
 const previewBytes=verifiedFile(path.dirname(path.resolve(preview)),{
  ...inputs.preview,path:path.basename(preview)
 });
 const shared=inputs.files.filter(e=>e.role==='shared');
 for(const entry of shared)verifiedFile(publicRoot,entry);
 const client=inputs.files.find(e=>e.role==='client').path,stylesheet=inputs.files.find(e=>e.role==='stylesheet').path;
 let js=source.get(client).toString();
 for(const change of clientChanges)js=replaceExact(js,change);
 for(const unused of ['nav.bin','inventory.json','world/tiles/fences.json'])assert.ok(!js.includes(unused),`Referenced omitted file: ${unused}`);
 const css=source.get(stylesheet).toString()+extraCss;
 const jsName=`racers-${sha256(js).slice(0,16)}.js`,cssName=`racers-${sha256(css).slice(0,16)}.css`;
 let html=source.get('index.html').toString();
 const htmlChanges=[
  {before:'/'+client,after:`./${jsName}`},
  {before:'/'+stylesheet,after:`./${cssName}`},
  {before:'<div id="return-slot"></div>',after:'<div id="return-slot"><a class="racers-back" href="/?menu=fun">Back to SankoSurvivors</a></div>'}
 ];
 for(const change of htmlChanges)html=replaceExact(html,change);
 const output=new Map([
  ['/fun/racers/index.html',Buffer.from(html)],['/fun/racers/'+jsName,Buffer.from(js)],
  ['/fun/racers/'+cssName,Buffer.from(css)],['/fun/racers/preview.png',previewBytes],
  ['/fun/racers/INTEGRATION.txt',Buffer.from(notice)]
 ]);
 for(const entry of inputs.files) {
  if(entry.role==='notice')output.set('/fun/racers/'+entry.path,source.get(entry.path));
  if(entry.role==='unique')output.set('/assets/racers/'+entry.path.slice('assets/'.length),source.get(entry.path));
 }
 const record=(relative,bytes)=>({path:relative,bytes:bytes.length,sha256:sha256(bytes)});
 const manifest={
  source:{commit:inputs.commit,implementation:inputs.implementation,clientSha256:inputs.files.find(e=>e.path===client).sha256},
  adaptations:{client:clientChanges,html:htmlChanges,cssAppend:extraCss},
  files:[...output].map(([relative,bytes])=>record(relative,bytes)),
  shared:shared.map(e=>({path:'/'+e.path,bytes:e.bytes,sha256:e.sha256})),
  omitted:inputs.files.filter(e=>e.role==='omit-unused').map(e=>({path:e.path,reason:'No runtime reference (asserted before packaging)',sha256:e.sha256}))
 };
 output.set('/fun/racers/manifest.json',Buffer.from(JSON.stringify(manifest,null,2)+'\n'));
 for(const [relative,bytes]of output) {
  const file=path.join(publicRoot,relative.slice(1));
  fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);
 }
 return {files:output.size,bytes:[...output.values()].reduce((sum,b)=>sum+b.length,0),shared:shared.length,sharedBytes:shared.reduce((sum,e)=>sum+e.bytes,0),client:jsName,stylesheet:cssName};
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 const [dist,preview,publicRoot=fileURLToPath(new URL('../public/',import.meta.url))]=process.argv.slice(2);
 assert.ok(dist && preview,'Usage: node tools/package-racers.mjs <accepted-dist> <accepted-preview.png> [SQS-public-root]');
 console.log(JSON.stringify(packageRacers(dist,preview,publicRoot),null,2));
}
