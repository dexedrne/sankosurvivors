import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, writeFile, rm, readdir, open} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve, join} from 'node:path';
import {spawnSync} from 'node:child_process';

const assetsSource=await readFile(new URL('../src/assets.js',import.meta.url),'utf8');
const publisher=await readFile(new URL('../tools/publish-assets.sh',import.meta.url),'utf8');
const build=await readFile(new URL('../tools/wavedash/build.mjs',import.meta.url),'utf8');
const assets=async()=>import('data:text/javascript,'+encodeURIComponent(assetsSource.replaceAll('import.meta.env','({BASE_URL:"./",VITE_ASSET_BASE_1:"https://one/",VITE_ASSET_BASE_2:"https://two/"})'))+'#'+Math.random());

test('native BUN models, clips and portraits use the same second CDN partition as the publisher',async()=>{
  const m=await assets();
  for(const path of ['sanko/buns/Mini.glb','sanko/buns/anim/bun-run-smooth-v1.glb','sanko/pets/portraits/Orange.png','models/mobs/fox.glb','music/menu.mp3']) assert.equal(m.asset(path),'https://two/'+path);
  assert.equal(m.asset('world/ground.json'),'https://one/world/ground.json');assert.equal(m.asset('ui/items/item_Gold.png'),'https://one/ui/items/item_Gold.png');
});
test('failed CDN admission falls back to local assets including BUN models',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});t.mock.method(globalThis,'fetch',async()=>{throw Error('fixture offline');});
  const m=await assets();assert.equal(await m.pickAssetHost(),'local');assert.equal(m.asset('sanko/buns/Mini.glb'),'./assets/sanko/buns/Mini.glb');
});

async function fixture(t){
  const root=await mkdtemp(join(tmpdir(),'sqs-assets-'));t.after(()=>rm(root,{recursive:true,force:true}));
  for(const name of ['tools','bin','public/assets/world','public/assets/anim','public/assets/ui','public/assets/sound','public/assets/models','public/assets/music','public/assets/sanko/buns'])await mkdir(join(root,name),{recursive:true});
  await writeFile(join(root,'tools/publish-assets.sh'),publisher);
  await writeFile(join(root,'public/assets/sanko/buns/Mini.glb'),'native-bun-fixture');await writeFile(join(root,'public/assets/models/fox.glb'),'native-fox-fixture');
  await writeFile(join(root,'bin/gh'),'#!/bin/bash\necho auth >> "$FIXTURE_LOG"\nprintf fixture-token\n',{mode:0o700});
  await writeFile(join(root,'bin/git'),`#!/usr/bin/python3
import os,sys
if 'push' in sys.argv[1:]:
 with open(os.environ['FIXTURE_LOG'],'a') as f:f.write('push\\n')
else:os.execv('/usr/bin/git',['git',*sys.argv[1:]])
`,{mode:0o700});
  const run=()=>spawnSync('/bin/bash',[join(root,'tools/publish-assets.sh')],{encoding:'utf8',env:{PATH:join(root,'bin')+':/usr/bin:/bin',SQS_ASSETS_DIR:join(root,'mirrors'),FIXTURE_LOG:join(root,'calls'),GIT_CONFIG_GLOBAL:'/dev/null',GIT_CONFIG_SYSTEM:'/dev/null'}});
  return{root,run};
}
test('real publisher stages BUN bytes into partition two before its intercepted pushes',async t=>{
  const f=await fixture(t),r=f.run();assert.equal(r.status,0,r.stderr);
  assert.equal(await readFile(join(f.root,'mirrors/2/sanko/buns/Mini.glb'),'utf8'),'native-bun-fixture');
  assert.equal(await readFile(join(f.root,'mirrors/2/models/fox.glb'),'utf8'),'native-fox-fixture');
  assert.match(r.stdout,/^1 [a-f0-9]{40}\n2 [a-f0-9]{40}\n$/);assert.equal((await readFile(join(f.root,'calls'),'utf8')).split('push').length-1,2);
});
test('a second partition over fifty million bytes refuses all auth and pushes',async t=>{
  const f=await fixture(t),file=await open(join(f.root,'public/assets/music/large.mp3'),'w');await file.truncate(50_000_001);await file.close();
  const r=f.run();assert.notEqual(r.status,0);assert.match(r.stderr,/50|budget|large|limit/i);
  await assert.rejects(readFile(join(f.root,'calls')),error=>error.code==='ENOENT');
});
test('actual wallet-free post-build cleanup removes BUN-only assets while retaining ordinary pets',async t=>{
  const root=await mkdtemp(join(tmpdir(),'sqs-casual-assets-'));t.after(()=>rm(root,{recursive:true,force:true}));
  for(const path of ['assets/models/mobs/chicken.glb','assets/sanko/buns/Mini.glb','assets/sanko/pets/portraits/Mini.png','assets/sanko/NOTICE.txt','index.html','manifest.webmanifest']) {await mkdir(resolve(root,path,'..'),{recursive:true});await writeFile(join(root,path),'fixture');}
  const cleanup=build.slice(build.indexOf('// Vite copies public files.'),build.indexOf('const files = []'));
  await Object.getPrototypeOf(async()=>{}).constructor('out','readdir','rm','resolve',cleanup)(root,readdir,rm,resolve);
  assert.equal(await readFile(join(root,'assets/models/mobs/chicken.glb'),'utf8'),'fixture');
  await assert.rejects(readdir(join(root,'assets/sanko')),error=>error.code==='ENOENT');await assert.rejects(readFile(join(root,'manifest.webmanifest')),error=>error.code==='ENOENT');
});


test('the actual deployment warmer routes native companion paths to their published CDN partition',async t=>{
  const deploy=await readFile(new URL('../tools/deploy.sh',import.meta.url),'utf8'),body=deploy.match(/xargs -0 -P 6 -I\{\} sh -c '([^']+)'/)[1];
  const bin=await mkdtemp(join(tmpdir(),'sqs-warm-'));t.after(()=>rm(bin,{recursive:true,force:true}));await writeFile(join(bin,'curl'),'#!/usr/bin/python3\nimport sys\nprint(sys.argv[-1])\n',{mode:0o700});
  for(const [path,want] of [['sanko/buns/Mini.glb','https://two/sanko/buns/Mini.glb'],['sanko/pets/portraits/Orange.png','https://two/sanko/pets/portraits/Orange.png'],['models/mobs/fox.glb','https://two/models/mobs/fox.glb'],['music/menu.mp3','https://two/music/menu.mp3'],['world/ground.json','https://one/world/ground.json']]){
    const result=spawnSync('/bin/sh',['-c',body,'https://one/','https://two/','./'+path],{encoding:'utf8',env:{PATH:bin+':/usr/bin:/bin'}});assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),want);
  }
});
