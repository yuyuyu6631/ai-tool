## 2024-06-03 - [Fix SSRF vulnerability in tool parser]
**Vulnerability:** Naive SSRF validation bypassed using integer IPs and dynamic DNS (like nip.io) because it only checked the hostname string and did not resolve it to an IP address if it wasn't obviously an IP format.
**Learning:** Always resolve domain names using `socket.getaddrinfo` to get the actual IP addresses before validating them against private/internal IP blocks, as attackers can bypass string-based checks using alternative IP encodings or domains that resolve to internal IPs.
**Prevention:** Use `socket.getaddrinfo` to resolve all hosts to their underlying IPs and validate each IP. Fail closed if resolution fails.
