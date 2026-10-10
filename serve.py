#!/usr/bin/env python3
import http.server
import socketserver
import socket
import webbrowser
import os
import sys

PORT = 8000

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.5)
        # Connect to a public DNS address to discover external routing interface
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '127.0.0.1'

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS and caching headers for fast local asset retrieval
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

def main():
    # Change directory to the web_reader folder
    web_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(web_dir)

    local_ip = get_local_ip()

    print("=" * 65)
    print("  LET ME GAME IN PEACE - WEB NOVEL READER")
    print("=" * 65)
    print(f"  Laptop / Local URL : http://localhost:{PORT}")
    print(f"  Phone / Tablet URL : http://{local_ip}:{PORT}")
    print("  (Make sure your phone is connected to the same Wi-Fi)")
    print("=" * 65)
    print("  Press Ctrl + C in this terminal window to stop the server.")
    print("=" * 65)

    # Open in browser automatically
    webbrowser.open(f"http://localhost:{PORT}")

    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nReader server stopped.")
            sys.exit(0)

if __name__ == '__main__':
    main()
