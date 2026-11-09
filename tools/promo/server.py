import http.server,sys,pathlib,urllib.parse

static=own=vendor=pathlib.Path('.')

class Handler(http.server.SimpleHTTPRequestHandler):
 def translate_path(self,path):
  p=urllib.parse.unquote(urllib.parse.urlsplit(path).path,errors='strict')
  if not p.startswith('/') or p.startswith('//') or '\\' in p or '\0' in p or '..' in p.split('/'):
   raise ValueError('Invalid asset path')
  root,relative=static,p[1:]
  for prefix,base in [('/promo/',own),('/vendor/',vendor),('/source/',own/'source')]:
   if p.startswith(prefix):root,relative=base,p[len(prefix):];break
  if pathlib.PurePosixPath(relative).is_absolute():raise ValueError('Absolute asset path')
  root=root.resolve();target=(root/relative).resolve()
  if not target.is_relative_to(root):raise ValueError('Asset outside capture root')
  return str(target)
 def valid(self):
  try:self.translate_path(self.path);return True
  except (ValueError,UnicodeError):self.send_error(403);return False
 def do_GET(self):
  if not self.valid():return
  if self.path.split('?')[0] in ['/','/index.html']:
   b=(static/'index.html').read_text().replace('<head>','<head><script type="importmap">{"imports":{"three":"/vendor/build/three.module.js","three/":"/vendor/"}}</script>')
   self.send_response(200);self.send_header('Content-Type','text/html');self.end_headers();self.wfile.write(b.encode())
  else:super().do_GET()
 def do_HEAD(self):
  if self.valid():super().do_HEAD()
 def log_message(self,*args):pass

if __name__=='__main__':
 static,own,vendor=map(pathlib.Path,sys.argv[1:4])
 http.server.ThreadingHTTPServer(('127.0.0.1',int(sys.argv[4])),Handler).serve_forever()
