"""
Local HTTP server to serve the reel MP4 with CORS headers.
Run this and keep it running while the upload happens.
"""
import http.server, socketserver, os, sys

FILE_PATH = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-08-340k-pipeline.mp4"
PORT = 19876  # Use an unusual port to avoid conflicts

class CORSHandler(http.server.BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.end_headers()

    def do_GET(self):
        if self.path == "/reel.mp4":
            file_size = os.path.getsize(FILE_PATH)
            self.send_response(200)
            self.send_header("Content-Type", "video/mp4")
            self.send_header("Content-Length", str(file_size))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
            self.send_header("Access-Control-Allow-Private-Network", "true")
            self.end_headers()
            with open(FILE_PATH, "rb") as f:
                while True:
                    chunk = f.read(64 * 1024)
                    if not chunk:
                        break
                    self.wfile.write(chunk)
            print(f"Served {file_size:,} bytes")
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, fmt, *args):
        print(f"[HTTP] {fmt % args}")

print(f"Starting server on http://localhost:{PORT}/reel.mp4")
print(f"File size: {os.path.getsize(FILE_PATH):,} bytes")
with socketserver.TCPServer(("", PORT), CORSHandler) as httpd:
    httpd.serve_forever()
