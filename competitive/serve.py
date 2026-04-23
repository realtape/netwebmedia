import http.server, socketserver, os
os.chdir('/c/Users/Usuario/Desktop/NetWebMedia/competitive')
with socketserver.TCPServer(("", 8765), http.server.SimpleHTTPRequestHandler) as h:
    h.serve_forever()
