import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const module = fileURLToPath(new URL('../qa-kit/test_postgres.py', import.meta.url));
const load = `import importlib.util,sys,pathlib,tempfile,os,json,hashlib,shutil
spec=importlib.util.spec_from_file_location('sqs_test_postgres',sys.argv[1]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
`;
const python = (code, optimized=false) => execFileSync('python3',[...(optimized?['-O']:[]),'-c',load+code,module],{encoding:'utf8',timeout:60000});

test('PostgreSQL fixture refuses unsafe paths/markers/modes/symlinks even under optimized Python', () => {
  const code = String.raw`
from unittest.mock import patch
from types import SimpleNamespace
with tempfile.TemporaryDirectory(prefix='sqs-pg-',dir=m.WORK) as folder:
 b=pathlib.Path(folder);(b/'socket').mkdir(mode=0o700);(b/'data').mkdir(mode=0o700);(b/'data/PG_VERSION').write_text('16\n');(b/'root').symlink_to(m.CACHE/'root',target_is_directory=True)
 def refuse(path):
  try:m.validate_base(path)
  except ValueError:return
  raise AssertionError('unsafe fixture accepted')
 refuse(b)
 (b/m.MARKER_NAME).write_bytes(m.MARKER);os.chmod(b/m.MARKER_NAME,0o600)
 assert m.validate_base(b)==b
 os.chmod(b/'socket',0o755);refuse(b);os.chmod(b/'socket',0o700)
 os.chmod(b,0o755);refuse(b);os.chmod(b,0o700)
 (b/m.MARKER_NAME).write_bytes(b'other project');refuse(b);(b/m.MARKER_NAME).write_bytes(m.MARKER)
 (b/'data/PG_VERSION').write_text('17\n');refuse(b);(b/'data/PG_VERSION').write_text('16\n')
 alias=b.with_name(b.name+'-alias');alias.symlink_to(b,target_is_directory=True)
 try:refuse(alias)
 finally:alias.unlink()
 (b/m.MARKER_NAME).unlink();(b/m.MARKER_NAME).symlink_to(b/'data/PG_VERSION');refuse(b)
 refuse(b/'outside')
 print('guard cases passed')
`;
  assert.match(python(code),/guard cases passed/);
  // Production-safety checks must not disappear with Python's assertion optimization.
  assert.match(python(code.replace("assert m.validate_base(b)==b", "m.validate_base(b)"),true),/guard cases passed/);
});

test('fixture connection checks server data/socket/listener identity before returning SQL access', () => {
  assert.match(python(String.raw`
from unittest.mock import patch
from types import SimpleNamespace
with tempfile.TemporaryDirectory(prefix='sqs-pg-',dir=m.WORK) as folder:
 b=pathlib.Path(folder);(b/'socket').mkdir(mode=0o700);(b/'data').mkdir(mode=0o700);(b/'data/PG_VERSION').write_text('16\n');(b/'root').symlink_to(m.CACHE/'root',target_is_directory=True);(b/m.MARKER_NAME).write_bytes(m.MARKER);os.chmod(b/m.MARKER_NAME,0o600)
 good={'data':str(b/'data'),'socket':str(b/'socket'),'listen':'','port':'55432'}
 for key,value in [('data','/other/data'),('socket','/other/socket'),('listen','127.0.0.1'),('port','5432')]:
  wrong={**good,key:value}
  with patch.object(m,'verified_cache',return_value=m.CACHE/'root'),patch.object(m.subprocess,'run',return_value=SimpleNamespace(stdout=json.dumps(wrong),returncode=0)) as command:
   try:m.connection(b)
   except ValueError:pass
   else:raise AssertionError('wrong server identity accepted')
   assert command.call_count==1
   query=command.call_args.args[0][-1].lower();assert query.startswith('select ') and 'truncate' not in query
 with patch.object(m,'verified_cache',return_value=m.CACHE/'root'),patch.object(m.subprocess,'run',return_value=SimpleNamespace(stdout=json.dumps(good),returncode=0)):
  args,env=m.connection(b);assert env['PGPASSFILE']=='/dev/null' and env['PGSERVICEFILE']=='/dev/null';assert '-XAtq' in args
 print('server identity cases passed')
`),/server identity cases passed/);
});

test('pinned package download rejects both wrong bytes and wrong digest', () => {
  assert.match(python(String.raw`
data=b'controlled package';row={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()};m.check_download(data,row)
for content,entry in [(data+b'x',row),(data,{**row,'sha256':'0'*64})]:
 try:m.check_download(content,entry)
 except ValueError:pass
 else:raise AssertionError('tampered package accepted')
print('download cases passed')
`),/download cases passed/);
});

test('cleanup refuses unsafe partial clusters even without PG_VERSION', () => {
  assert.match(python(String.raw`
from unittest.mock import patch
from types import SimpleNamespace
with tempfile.TemporaryDirectory(prefix='sqs-cleanup-proof-',dir=m.WORK) as folder:
 root=pathlib.Path(folder);work=root/'work';work.mkdir(mode=0o700);cache=root/'cache';cache.mkdir(mode=0o700)
 def command(args,**kwargs):
  if args[0].endswith('/initdb'):
   data=pathlib.Path(args[args.index('-D')+1]);data.mkdir(mode=0o700);(data/'PG_VERSION').write_text('16')
  return SimpleNamespace(returncode=3)
 with patch.object(m,'WORK',work),patch.object(m,'CACHE',cache),patch.object(m,'provision',return_value=cache/'root'),patch.object(m,'connection',return_value=([],{})),patch.object(m.subprocess,'run',side_effect=command):
  for unsafe in ['marker','mode','server']:
   base=None
   try:
    with m.database(root/'postgres.log') as base:
     (base/'data/PG_VERSION').unlink()
     if unsafe=='marker':(base/m.MARKER_NAME).unlink()
     elif unsafe=='mode':base.chmod(0o755)
     else:(base/'data/postmaster.pid').write_text('unknown')
   except ValueError:pass
   else:raise AssertionError('unsafe partial cluster deleted: '+unsafe)
   assert base.exists(),'refused cluster was removed'
  created=[]
  def failed_init(args,**kwargs):
   data=pathlib.Path(args[args.index('-D')+1]);data.mkdir(mode=0o700);created.append(data.parent)
   raise RuntimeError('controlled init failure')
  with patch.object(m.subprocess,'run',side_effect=failed_init):
   try:
    with m.database(root/'failed-init.log'):raise AssertionError('startup unexpectedly succeeded')
   except RuntimeError as error:assert str(error)=='controlled init failure'
  assert len(created)==1 and not created[0].exists(),'safe partial initialization was not cleaned'
 print('partial cluster refusal passed')
`),/partial cluster refusal passed/);
});

test('cache reuse rejects redirected roots and corrupted installation trees', () => {
  assert.match(python(String.raw`
from unittest.mock import patch
with tempfile.TemporaryDirectory(prefix='sqs-cache-proof-',dir=m.WORK) as folder:
 root=pathlib.Path(folder);cache=root/'cache';cache.mkdir(mode=0o700);(cache/m.MARKER_NAME).write_bytes(m.MANIFEST)
 external=root/'unverified';external.mkdir(mode=0o755);(cache/'root').symlink_to(external,target_is_directory=True)
 (cache/'.sqs-package-tree.json').write_text(json.dumps({'.':['directory',0o755]}))
 with patch.object(m,'CACHE',cache):
  def refuse():
   try:m.provision()
   except ValueError:return
   raise AssertionError('unverified cache accepted')
  refuse()
  (cache/'root').unlink();(cache/'root').mkdir(mode=0o755);binary=cache/'root/tool';binary.write_bytes(b'verified bytes');binary.chmod(0o644)
  (cache/m.TREE_NAME).write_text(json.dumps(m.tree_fingerprint(cache/'root')))
  assert m.provision()==cache/'root'
  binary.write_bytes(b'changed bytes');refuse();binary.write_bytes(b'verified bytes')
  binary.unlink();binary.symlink_to(external/'tool');refuse()
 print('cache tree refusal passed')
`),/cache tree refusal passed/);
});

test('real private PostgreSQL cleanup runs after a controlled body failure', {skip:!process.env.SQS_PG_SANDBOX}, () => {
  assert.match(python(String.raw`
with tempfile.TemporaryDirectory(prefix='sqs-pg-proof-',dir=m.WORK) as folder:
 base=None
 try:
  with m.database(pathlib.Path(folder)/'postgres.log') as base:
   args,env=m.connection(base)
   raise RuntimeError('controlled body failure')
 except RuntimeError as error:assert str(error)=='controlled body failure'
 assert base is not None and not base.exists()
 print('real failure cleanup passed')
`),/real failure cleanup passed/);
});
