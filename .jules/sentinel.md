## 2024-05-30 - [CRITICAL] Fix SSRF Bypass in URL Validator
**Vulnerability:** The URL validation logic caught `ValueError` from `ipaddress.ip_address()` for unparseable hostnames (like domain names or alternate IP encodings) and allowed them to pass without DNS resolution, bypassing internal IP blocks.
**Learning:** Failing open on `ValueError` for IP parsing creates SSRF risks. Alternate IP encodings (hex/integer) and domains mapping to internal IPs bypass naive string checks.
**Prevention:** Always resolve hostnames to IPs via DNS (`socket.getaddrinfo`) and fail closed on resolution errors before checking against private IP ranges.
