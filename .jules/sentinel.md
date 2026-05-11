## 2024-05-24 - SSRF Bypass via DNS Hostname Resolution
**Vulnerability:** A logic flaw in `validate_public_url` where `ipaddress.ip_address()` raised a `ValueError` when evaluating domain hostnames. This exception was caught and bypassed, effectively permitting requests to domains resolving to internal network IPs.
**Learning:** The `ipaddress` module is designed strictly for IP literals, not for DNS resolution. Catching exceptions on network parsers without explicit DNS resolution directly undermines SSRF protections.
**Prevention:** To prevent SSRF vulnerabilities when validating URLs, always explicitly resolve hostnames to their IP addresses (e.g., using `socket.gethostbyname()` or `socket.getaddrinfo()`) *before* evaluating those IPs against private range configurations.
