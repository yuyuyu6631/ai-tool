#!/usr/bin/env python3
import socket

for port in range(8000, 8010):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(0.5)
    result = s.connect_ex(('127.0.0.1', port))
    if result == 0:
        print(f"Port {port} is open")
        # Try to get a banner
        try:
            s.send(b"GET /health HTTP/1.1\r\nHost: localhost\r\n\r\n")
            data = s.recv(1024)
            print(f"  Response: {data[:200]}")
        except:
            pass
    s.close()
