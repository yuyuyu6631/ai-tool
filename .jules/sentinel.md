## $(date +%Y-%m-%d) - [SSRF Bypass in URL Validator]
**Vulnerability:** URL validation for internal crawling failed to perform DNS resolution before verifying if the target was a private network. It merely checked the raw hostname string, making it trivial to bypass the validation and hit internal servers (e.g., passing http://127.0.0.1.nip.io/).
**Learning:** Checking string values against an IP address parser doesn't actually confirm the IP the HTTP request will connect to.
**Prevention:** Use `socket.getaddrinfo` to enforce DNS resolution and perform private IP address checks on the explicitly resolved IP addresses, effectively preventing local domain SSRF bypasses.
