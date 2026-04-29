"""
Local HTTP server that serves the reel-08 MP4 with:
- CORS headers for studio.youtube.com
- Private Network Access (PNA) header so Chrome allows fetch from HTTPS page
Run this, then use browser JS to fetch the file and pass it to uploadManager.
"""
import os
from http.server import HTTPServer, BaseHTTPRequestHandler

FILE_PATH = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-08-340k-pipeline.mp4"
PORT = 9080

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"[server] {fmt % args}")

    def send_pna_cors(self, status=200):
        self.send_response(status)
        self.send_header("Access-Control-Allow-Origin", "https://studio.youtube.com")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Max-Age", "86400")

    def do_OPTIONS(self):
        self.send_pna_cors(200)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        if not os.path.exists(FILE_PATH):
            self.send_pna_cors(404)
            self.end_headers()
            return
        size = os.path.getsize(FILE_PATH)
        self.send_pna_cors(200)
        self.send_header("Content-Type", "video/mp4")
        self.send_header("Content-Length", str(size))
        self.send_header("Accept-Ranges", "bytes")
        self.end_headers()
        with open(FILE_PATH, "rb") as f:
            while True:
                chunk = f.read(65536)
                if not chunk:
                    break
                try:
                    self.wfile.write(chunk)
                except BrokenPipeError:
                    break
        print(f"[server] Served {size:,} bytes of {os.path.basename(FILE_PATH)}")

print(f"Starting file server on http://localhost:{PORT}")
print(f"Serving: {os.path.basename(FILE_PATH)}")
print(f"Press Ctrl+C to stop.")
server = HTTPServer(("localhost", PORT), Handler)
server.serve_forever()
