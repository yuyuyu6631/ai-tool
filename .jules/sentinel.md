## 2024-06-08 - [Fix SSRF bypass in URL validation]
**Vulnerability:** validate_public_url fails open on ValueError during ipaddress.ip_address(hostname) parsing, allowing SSRF via domains resolving to localhost or alternate IP encodings like integer IPs.
**Learning:** Naive IP string validation is easily bypassed. Fails open on validation errors is dangerous.
**Prevention:** Always use DNS resolution (socket.getaddrinfo) before IP checks and always fail closed on resolution errors.
