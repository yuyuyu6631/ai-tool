## 2024-05-18 - [Fix SSRF Bypass with Alternate IP Encodings]

**Vulnerability:** Alternate IP encodings (e.g., integer `2130706433` or hex `0x7f000001`) bypass naive string-based SSRF validators that use `ipaddress.ip_address` directly, as it fails with a ValueError and the code falls back to returning the URL, causing a fail-open scenario.
**Learning:** Always resolve hostnames via `socket.getaddrinfo` before checking against private IP ranges, and ensure you do not fail open on unparseable inputs.
**Prevention:** Explicitly use `socket.getaddrinfo` to resolve all hostnames and block if ANY resolved IP is private/loopback, and fail closed (raise exception) if resolution fails.
