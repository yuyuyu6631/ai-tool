## 2025-06-05 - Fix SSRF Vulnerability in Tool Parser
**Vulnerability:** The URL validation logic used a naive string-based hostname check for IP ranges, which allowed SSRF attacks via alternate IP encodings (e.g., 0x7f000001) or DNS rebinding (e.g., localtest.me resolving to 127.0.0.1).
**Learning:** Relying solely on `urlparse().hostname` and string-to-IP conversion for SSRF protection is inadequate because attackers can bypass it using alternative formats or custom domains resolving to internal IPs.
**Prevention:** Always perform actual DNS resolution (e.g., via `socket.getaddrinfo`) on the hostname, and ensure the code "fails closed" by blocking requests if DNS resolution fails (e.g., `socket.gaierror`).
