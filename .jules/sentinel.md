## 2024-05-18 - [SSRF Bypass via DNS Resolution]
**Vulnerability:** The URL validation logic used `ipaddress.ip_address()` on the raw hostname string, which catches a `ValueError` for domains (like `127.0.0.1.nip.io`) that resolve to private IPs, silently returning the unsafe URL.
**Learning:** `ipaddress.ip_address` does not perform DNS resolution. It only parses IP string literals.
**Prevention:** Always use `socket.getaddrinfo(hostname, None)` to resolve the hostname into actual IPs before validating whether the resulting IPs are private or loopback. Also handle the case where `socket.getaddrinfo` raises an error or returns multiple IPs.
