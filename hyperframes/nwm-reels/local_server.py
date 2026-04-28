from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

class CORSHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Access-Control-Allow-Private-Network', 'true')
        super().end_headers()
    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()
    def log_message(self, fmt, *args):
        print(fmt % args, flush=True)

os.chdir(r'C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders')
print('Serving with Private-Network header on http://localhost:8765', flush=True)
HTTPServer(('localhost', 8765), CORSHandler).serve_forever()
