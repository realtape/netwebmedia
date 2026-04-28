"""Serve renders/ with CORS headers on port 8765."""
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

class CORSHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()
    def log_message(self, fmt, *args):
        print(fmt % args, flush=True)

os.chdir(r'C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders')
print('Serving renders/ on http://localhost:8765', flush=True)
HTTPServer(('localhost', 8765), CORSHandler).serve_forever()
