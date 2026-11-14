import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
test('both build-host syncs retain receiver evidence while refreshing source helpers and deleting stale runtime files',()=>{
 const script=readFileSync(new URL('../tools/remote-build.sh',import.meta.url),'utf8');
 const pushes=script.split('\n').map(line=>line.trim()).filter(line=>line.startsWith('rsync -a --checksum --delete')&&line.includes('./ '));assert.equal(pushes.length,2);
 for(const push of pushes){
  const filters=[...push.matchAll(/--filter='([^']+)'/g)].map(m=>'--filter='+m[1]);
  const root=mkdtempSync(path.join(tmpdir(),'sqs-sync-proof-')),source=path.join(root,'source'),target=path.join(root,'target');
  try{
   for(const base of [source,target]){mkdirSync(path.join(base,'qa-kit'),{recursive:true});mkdirSync(path.join(base,'.test-results'),{recursive:true});}
   writeFileSync(path.join(source,'qa-kit/helper.mjs'),'current helper');writeFileSync(path.join(target,'qa-kit/helper.mjs'),'stale helper');
   writeFileSync(path.join(target,'qa-kit/native.log'),'browser proof');writeFileSync(path.join(target,'.test-results/full.log'),'full proof');writeFileSync(path.join(target,'stale-runtime.js'),'obsolete');
   const run=spawnSync('rsync',['-a','--checksum','--delete',...filters,source+'/',target+'/'],{encoding:'utf8'});assert.equal(run.status,0,run.stderr);
   assert(existsSync(path.join(target,'qa-kit/native.log')),'native evidence must survive');assert(existsSync(path.join(target,'.test-results/full.log')),'full evidence must survive');
   assert.equal(readFileSync(path.join(target,'qa-kit/helper.mjs'),'utf8'),'current helper');assert(!existsSync(path.join(target,'stale-runtime.js')));
  }finally{rmSync(root,{recursive:true,force:true});}
 }
});
