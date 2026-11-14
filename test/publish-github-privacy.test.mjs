import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,copyFileSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const privateMarker=['/home','alex','private-marker'].join('/');
function publish(leak=false){
 const dir=mkdtempSync(path.join(tmpdir(),'sqs-public-privacy-')),root=path.join(dir,'source'),pub=path.join(dir,'public'),bin=path.join(dir,'bin'),calls=path.join(dir,'calls');
 const file=(rel,text)=>{const p=path.join(root,rel);mkdirSync(path.dirname(p),{recursive:true});writeFileSync(p,text);};
 mkdirSync(bin,{recursive:true});mkdirSync(path.join(pub,'.git'),{recursive:true});
 file('README.md','Public game guide\n');file('src/main.js',leak?privateMarker:'console.log("game");');
 file('docs/handoffs/private-work-history.md',privateMarker);file('docs/coop-release-order.md',privateMarker);file('qa-kit/private.txt',privateMarker);file('AGENTS.md',privateMarker);
 mkdirSync(path.join(root,'tools'));copyFileSync(new URL('../tools/publish-github.sh',import.meta.url),path.join(root,'tools/publish-github.sh'));
 const runGit=args=>{const r=spawnSync('/usr/bin/git',args,{cwd:root,encoding:'utf8'});assert.equal(r.status,0,r.stderr);};
 runGit(['init','-q']);runGit(['add','.']);runGit(['-c','user.name=dexedrne','-c','user.email=331735862+dexedrne@users.noreply.github.com','commit','-qm','Privacy fixture']);
 writeFileSync(path.join(bin,'git'),'#!/bin/bash\nif [ "$1" = archive ]; then exec /usr/bin/git "$@"; fi\nif [ "$1" = add ] || [ "$1" = diff ]; then exit 0; fi\necho unexpected-git >> "$CALL_LOG"; exit 97\n',{mode:0o755});
 writeFileSync(path.join(bin,'gh'),'#!/bin/bash\necho unexpected-auth >> "$CALL_LOG"; exit 98\n',{mode:0o755});
 try{const r=spawnSync('/bin/bash',['tools/publish-github.sh'],{cwd:root,encoding:'utf8',env:{PATH:bin+':/usr/bin:/bin',HOME:dir,SQS_PUBLIC_DIR:pub,CALL_LOG:calls}});return{...r,docs:existsSync(path.join(pub,'docs')),readme:existsSync(path.join(pub,'README.md')),game:existsSync(path.join(pub,'src/main.js')),sourceNotes:readFileSync(path.join(root,'docs/coop-release-order.md'),'utf8'),calls:existsSync(calls)?readFileSync(calls,'utf8'):''};}finally{rmSync(dir,{recursive:true,force:true});}
}
test('public mirror excludes internal nested documentation while keeping game source and README',()=>{const r=publish();assert.equal(r.status,0,r.stdout+r.stderr);assert.equal(r.docs,false);assert(r.readme&&r.game);assert.equal(r.sourceNotes,privateMarker);assert.equal(r.calls,'');});
test('public mirror still refuses private markers in public game source before authentication',()=>{const r=publish(true);assert.equal(r.status,1);assert.match(r.stdout,/refusing to publish.*src\/main.js/);assert.equal(r.game,false);assert.equal(r.calls,'');});
