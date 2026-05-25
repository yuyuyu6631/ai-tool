## 2026-05-12 - [Fix SSRF vulnerability in tool parser]
**Vulnerability:** Server-Side Request Forgery (SSRF) bypass through DNS resolution.
**Learning:** Using `ipaddress.ip_address()` on a domain name throws a `ValueError`. If caught and ignored without properly resolving the domain to an IP first, an attacker can use a domain that resolves to a local IP (e.g., `localtest.me`) to bypass IP-based restrictions.
**Prevention:** Always resolve hostnames to IP addresses using `socket.getaddrinfo()` or `socket.gethostbyname()` before checking them against private IP address ranges.
