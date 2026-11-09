"""Owned loopback fixture: encoded spaces work; paths cannot escape asset roots."""
import pathlib,socket,subprocess,sys,tempfile,time,urllib.error,urllib.request
with tempfile.TemporaryDirectory(prefix='promo-server-check-') as tmp:
 root=pathlib.Path(tmp)
 for name in ['static','promo','vendor']:(root/name).mkdir()
 (root/'static'/'Sanko Font.ttf').write_bytes(b'owned encoded-space fixture')
 (root/'outside.txt').write_text('owned outside fixture')
 (root/'static'/'escape').symlink_to(root/'outside.txt')
 with socket.socket() as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
 process=subprocess.Popen([sys.executable,str(pathlib.Path(__file__).with_name('server.py')),str(root/'static'),str(root/'promo'),str(root/'vendor'),str(port)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 base=f'http://127.0.0.1:{port}'
 try:
  for _ in range(100):
   try:
    with urllib.request.urlopen(base+'/Sanko%20Font.ttf') as response:assert response.read()==b'owned encoded-space fixture'
    break
   except OSError:time.sleep(.02)
  else:raise AssertionError('Fixture server failed to start')
  paths=['/promo/../../outside.txt','/promo/%2e%2e/%2e%2e/outside.txt','/vendor/../outside.txt','/promo//etc/passwd','/vendor/%2fetc/passwd','/promo/%5c..%5coutside.txt','/promo/%00','/escape']
  for method in ['GET','HEAD']:
   for path in paths:
    try:urllib.request.urlopen(urllib.request.Request(base+path,method=method))
    except urllib.error.HTTPError as error:assert error.code==403,(method,path,error.code)
    else:raise AssertionError((method,path,'escape accepted'))
  print('PASS: encoded spaces and16 HTTP traversal/absolute/backslash/NUL/symlink refusals')
 finally:
  process.terminate();process.wait(timeout=5)
