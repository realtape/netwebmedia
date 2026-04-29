"""
Local HTTP server to serve the reel MP4 with CORS headers,
plus a loader.html page that fetches the video same-origin and
postMessages the ArrayBuffer back to the YouTube Studio opener tab.
"""
import http.server, socketserver, os, sys, threading

FILE_PATH = r"C:\Users\Usuario\Desktop\NetWebMedia\hyperframes\nwm-reels\renders\reel-08-340k-pipeline.mp4"
PORT = 19876  # Use an unusual port to avoid conflicts

class CORSHandler(http.server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"  # Must be 1.1 so Chrome keep-alive works correctly
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Content-Length", "0")
        self.send_header("Connection", "keep-alive")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.end_headers()

    def do_HEAD(self):
        if self.path == "/reel.mp4":
            file_size = os.path.getsize(FILE_PATH)
            self.send_response(200)
            self.send_header("Content-Type", "video/mp4")
            self.send_header("Content-Length", str(file_size))
            self.send_header("Connection", "close")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Private-Network", "true")
            self.close_connection = True
            self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

    LOADER_HTML = b"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Video Loader</title></head>
<body>
<div id="status">Starting fetch...</div>
<script>
window.__nwmReady = false;
window.__nwmBuf = null;
window.__nwmError = null;
window.__nwmBytes = 0;
(async function() {
  var status = document.getElementById('status');
  try {
    var resp = await fetch('/reel.mp4');
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    var reader = resp.body.getReader();
    var chunks = [];
    var received = 0;
    while (true) {
      var r = await reader.read();
      if (r.done) break;
      chunks.push(r.value);
      received += r.value.length;
      status.textContent = 'Loaded ' + (received / 1048576).toFixed(1) + ' MB...';
    }
    status.textContent = 'Assembling ' + (received / 1048576).toFixed(1) + ' MB...';
    var total = new Uint8Array(received);
    var offset = 0;
    for (var c of chunks) { total.set(c, offset); offset += c.length; }
    window.__nwmBuf = total.buffer;
    window.__nwmBytes = received;
    window.__nwmReady = true;
    status.textContent = 'READY: ' + received + ' bytes in memory';
    if (window.opener) {
      window.opener.postMessage({ type: 'VIDEO_READY', buffer: window.__nwmBuf }, '*', [window.__nwmBuf]);
      status.textContent = 'READY+SENT: buffer posted to opener';
    }
  } catch(e) {
    window.__nwmError = e.message;
    status.textContent = 'ERROR: ' + e.message;
    if (window.opener) window.opener.postMessage({ type: 'VIDEO_ERROR', error: e.message }, '*');
  }
})();
</script>
</body></html>"""

    def do_GET(self):
        if self.path == "/reel.mp4":
            file_size = os.path.getsize(FILE_PATH)
            self.send_response(200)
            self.send_header("Content-Type", "video/mp4")
            self.send_header("Content-Length", str(file_size))
            self.send_header("Connection", "close")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
            self.send_header("Access-Control-Allow-Private-Network", "true")
            self.close_connection = True
            self.end_headers()
            with open(FILE_PATH, "rb") as f:
                while True:
                    chunk = f.read(64 * 1024)
                    if not chunk:
                        break
                    self.wfile.write(chunk)
            print(f"Served {file_size:,} bytes")
        elif self.path == "/loader.html":
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(self.LOADER_HTML)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.close_connection = True
            self.end_headers()
            self.wfile.write(self.LOADER_HTML)
            print("Served loader.html")
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, fmt, *args):
        print(f"[HTTP] {fmt % args}")

print(f"Starting server on http://localhost:{PORT}/reel.mp4")
print(f"File size: {os.path.getsize(FILE_PATH):,} bytes")
socketserver.TCPServer.allow_reuse_address = True
class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    daemon_threads = True

with ThreadedTCPServer(("", PORT), CORSHandler) as httpd:
    httpd.serve_forever()
