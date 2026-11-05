import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync, execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

test('npm test entry discovers .test.mjs files on Node22 in a bounded runner', () => {
  const folder=mkdtempSync(path.join(tmpdir(),'sqs-entry-'));
  try {
    mkdirSync(path.join(folder,'test'));
    for(const name of ['one','two'])writeFileSync(path.join(folder,'test',name+'.test.mjs'),`import test from 'node:test';test('${name}',()=>{});`);
    const script=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).scripts.test;
    const result=spawnSync('/bin/sh',['-c',script],{cwd:folder,env:{PATH:'/usr/bin:/bin',LANG:'C.UTF-8'},encoding:'utf8',timeout:20000});
    assert.equal(result.status,0,result.stdout+result.stderr);assert.match(result.stdout,/# tests 2\b/);assert.match(result.stdout,/# pass 2\b/);
  } finally {rmSync(folder,{recursive:true,force:true});}
});

test('full runner stops its child process group after timeout and keeps failure evidence', () => {
  const module=fileURLToPath(new URL('../qa-kit/full-tests.py',import.meta.url));
  const source=String.raw`import importlib.util,sys,pathlib,tempfile,subprocess,os,signal,time
sys.path.insert(0,str(pathlib.Path(sys.argv[1]).parent))
spec=importlib.util.spec_from_file_location('sqs_full_tests',sys.argv[1]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
with tempfile.TemporaryDirectory() as folder:
 root=pathlib.Path(folder);log=root/'child.log';child=root/'child.py'
 child.write_text("import os,time,subprocess,sys\nsubprocess.Popen(['/usr/bin/python3','-c',\"import signal,time,pathlib;signal.signal(signal.SIGTERM,signal.SIG_IGN);pathlib.Path('ready').write_text('1');time.sleep(2);pathlib.Path('leaked').write_text('survived')\"])\nwhile not os.path.exists('ready'):time.sleep(.01)\nprint(os.getpid(),flush=True)\nif len(sys.argv)>1:sys.exit(1)\ntime.sleep(30)\n")
 for failure in ['timeout','exit']:
  for name in ['ready','leaked']:(root/name).unlink(missing_ok=True)
  try:
   try:m.run_logged(['/usr/bin/python3',str(child),*(['exit'] if failure=='exit' else [])],root,m.SAFE_ENV,log,1)
   except (subprocess.TimeoutExpired,ValueError):pass
   else:raise AssertionError('failed command accepted')
   pid=int(log.read_text().strip())
   try:os.kill(pid,0)
   except ProcessLookupError:pass
   else:raise AssertionError('child survived failure')
   time.sleep(2.3)
   assert not (root/'leaked').exists(),'TERM-resistant descendant survived '+failure
  finally:
   try:os.killpg(pid,signal.SIGKILL)
   except ProcessLookupError:pass
 print('timeout cleanup evidence passed')
`;
  assert.match(execFileSync('python3',['-c',source,module],{encoding:'utf8',timeout:20000}),/timeout cleanup evidence passed/);
});

test('full-run acceptance rejects skipped, failed, canceled, todo, absent and inconsistent summaries', () => {
  const module=fileURLToPath(new URL('../qa-kit/full-tests.py',import.meta.url));
  const source=String.raw`import importlib.util,sys,pathlib
sys.path.insert(0,str(pathlib.Path(sys.argv[1]).parent))
spec=importlib.util.spec_from_file_location('sqs_full_tests',sys.argv[1]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
good='# tests 3\n# pass 3\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n'
assert m.parse_summary(good)['pass']==3
bad=[good.replace('# skipped 0','# skipped 1'),good.replace('# fail 0','# fail 1'),good.replace('# cancelled 0','# cancelled 1'),good.replace('# todo 0','# todo 1'),good.replace('# pass 3','# pass 2'),'no summary',good.replace('3','0')]
for text in bad:
 try:m.parse_summary(text)
 except ValueError:pass
 else:raise AssertionError('incomplete full run accepted')
print('summary acceptance passed')
`;
  assert.match(execFileSync('python3',['-c',source,module],{encoding:'utf8',timeout:20000}),/summary acceptance passed/);
});
