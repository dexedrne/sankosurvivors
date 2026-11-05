"""Owned loopback QA only: isolated cross-origin iframe, never part of the upload."""
import http.server
import pathlib
import sys
import urllib.parse

root = pathlib.Path(sys.argv[1]).resolve()
port = int(sys.argv[2])


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Resource-Policy', 'cross-origin')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_GET(self):
        path = urllib.parse.urlsplit(self.path)
        if path.path == '/review.html':
            query = urllib.parse.quote(path.query, safe='=&')
            body = (f'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>html,body,iframe{{margin:0;width:100%;height:100%;border:0;overflow:hidden}}</style>'
                    f'<iframe allow="cross-origin-isolated; autoplay; fullscreen; gamepad" allowfullscreen '
                    f'src="http://127.0.0.1:{port}/games/sqs/index.html?debug&low&{query}"></iframe>').encode()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if not path.path.startswith('/games/sqs/'):
            self.send_error(404)
            return
        super().do_GET()

    def translate_path(self, path):
        relative = urllib.parse.unquote(urllib.parse.urlsplit(path).path).removeprefix('/games/sqs/')
        result = (root / relative).resolve()
        if not result.is_relative_to(root):
            return str(root / '__refused__')
        return str(result)

    def log_message(self, *_args):
        pass


http.server.ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()
