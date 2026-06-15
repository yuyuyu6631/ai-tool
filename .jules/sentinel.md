## 2024-06-16 - SSRF via Alternate IP Encodings
**Vulnerability:** The URL validation logic used a string-based and direct `ipaddress` check on the hostname, making it vulnerable to SSRF via integer representations (e.g., `2130706433` for `127.0.0.1`) and DNS resolution tricks (e.g., `127.0.0.1.nip.io`).
**Learning:** `ipaddress.ip_address` does not resolve hostnames or alternate integer forms reliably in a security context. Validating the raw string input is insufficient to prevent SSRF.
**Prevention:** Always use `socket.getaddrinfo` to resolve hostnames to actual IP addresses before performing internal/private IP validation checks.
