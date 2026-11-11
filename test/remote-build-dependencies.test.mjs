import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,copyFileSync,symlinkSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

function fixture(kind){
 const root=mkdtempSync(path.join(tmpdir(),'sqs-remote-deps-')),bin=path.join(root,'bin'),log=path.join(root,'calls');
 mkdirSync(path.join(root,'tools'));mkdirSync(bin);copyFileSync(new URL('../tools/remote-build.sh',import.meta.url),path.join(root,'tools/remote-build.sh'));
 const stub=(name,body)=>writeFileSync(path.join(bin,name),'#!/bin/bash\n'+body,{mode:0o755});
 stub('git','[ "$1" != rev-parse ] || echo abc1234\nexit 0\n');
 stub('ssh','echo ssh >> "$CALL_LOG"\n[[ "$2" == "mkdir -p "* ]] && exit 0\nexit 72\n');
 stub('rsync','printf "%s\\n" "$@" >> "$CALL_LOG"\n[[ "${@: -1}" == */node_modules/ ]] && exit 73\nexit 0\n');
 if(kind==='broken')symlinkSync(path.join(root,'missing'),path.join(root,'node_modules'));
 if(kind==='root')symlinkSync('/',path.join(root,'node_modules'));
 if(kind==='valid'){
  const deps=path.join(root,'deps');for(const name of ['vite','three','.bin'])mkdirSync(path.join(deps,name),{recursive:true});
  for(const name of ['vite','three'])writeFileSync(path.join(deps,name,'package.json'),'{}');
  writeFileSync(path.join(deps,'.bin/vite'),'#!/bin/sh\nexit 0\n',{mode:0o755});symlinkSync(deps,path.join(root,'node_modules'));
 }
 try{
  const run=spawnSync('/bin/bash',['tools/remote-build.sh','job-box'],{cwd:root,encoding:'utf8',env:{PATH:bin+':/usr/bin:/bin',VERIFY_HOST:'verify-box',CALL_LOG:log}});
  let calls='';try{calls=readFileSync(log,'utf8');}catch{}
  return {...run,calls,root};
 }finally{rmSync(root,{recursive:true,force:true});}
}
for(const kind of ['missing','broken','root'])test('remote build refuses '+kind+' dependencies before any remote operation',()=>{
 const run=fixture(kind);assert.equal(run.status,1,run.stderr);assert.match(run.stdout,/dependency directory/);assert.equal(run.calls,'');
});
test('remote build copies the validated dependency directory for a valid link',()=>{
 const run=fixture('valid');assert.equal(run.status,73,run.stderr);assert(run.calls.includes(run.root+'/deps/\n'));assert(!run.calls.includes('\n/\n'));
 const source=readFileSync(new URL('../tools/remote-build.sh',import.meta.url),'utf8');assert.equal((source.match(/"\$DEPS\/"/g)||[]).length,2,'both build hosts use the same validated source');
});
