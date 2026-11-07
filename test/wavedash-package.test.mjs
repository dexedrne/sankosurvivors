import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
test('casual packager retains the required BSD notice and rejects unrelated licence files without replacing a good ZIP',async t=>{
  const root=await mkdtemp(join(tmpdir(),'sqs-package-'));t.after(()=>rm(root,{recursive:true,force:true}));const game=join(root,'game'),manifest=join(root,'manifest.json'),zip=join(root,'game.zip');
  await mkdir(join(game,'licenses'),{recursive:true});const files=[['index.html','game'],['licenses/run-escape.txt','required upstream BSD notice']];
  const rows=async()=>{const result=[];for(const [name,data] of files){await writeFile(join(game,name),data);result.push({name,bytes:Buffer.byteLength(data),sha256:createHash('sha256').update(data).digest('hex')});}await writeFile(manifest,JSON.stringify({files:result}));};
  await rows();const run=()=>spawnSync('/usr/bin/python3',[fileURLToPath(new URL('../tools/wavedash/package.py',import.meta.url)),game,manifest,zip],{encoding:'utf8'});
  const first=run();assert.equal(first.status,0,first.stderr);assert.equal(JSON.parse(first.stdout).files,2);const bytes=await readFile(zip);
  files.push(['licenses/unapproved.txt','not on the upload allowlist']);await rows();const denied=run();assert.notEqual(denied.status,0);assert.match(denied.stderr,/Unexpected upload file/);assert.deepEqual(await readFile(zip),bytes);
});
