#!/usr/bin/python3
import http.server
import ssl

server_address = ('localhost', 4443)
httpd = http.server.HTTPServer(server_address, http.server.SimpleHTTPRequestHandler)
httpd.socket = ssl.wrap_socket(httpd.socket,
                               server_side=True,
                               certfile="/usr/local/home/.ssh/server.pem",
                               keyfile="/usr/local/home/.ssh/key.pem",
                               ssl_version=ssl.PROTOCOL_TLS)
print("Serving on port: 4443");
httpd.serve_forever()

