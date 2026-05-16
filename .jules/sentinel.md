## 2024-05-20 - [Fix SSRF bypass in URL validation]
**Vulnerability:** A Server-Side Request Forgery (SSRF) bypass existed in `validate_public_url` in `tool_parser_service.py` where hostname IP addresses were directly validated via `ipaddress.ip_address()`.
**Learning:** If a valid domain like "localtest.me" was submitted, the string parsing failed with a `ValueError`, which was silently caught and returned the URL untreated, allowing internal addresses to be scanned via SSRF.
**Prevention:** Always perform explicit DNS resolution (e.g., using `socket.gethostbyname()`) on provided hostnames before verifying if the resulting IP matches private, loopback, or invalid address blocks to prevent bypassing internal network filters.
