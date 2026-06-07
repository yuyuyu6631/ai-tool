## 2024-06-07 - SSRF Vulnerability in Alternate IP Encodings
**Vulnerability:** The application was vulnerable to SSRF through alternative IP encodings (integer IP, hex IP, shorthand IP).
**Learning:** `ipaddress.ip_address` does not parse alternate encodings if they are passed as strings, and the existing validation code "failed open" if parsing failed.
**Prevention:** Always resolve hostnames to actual IPs using `socket.getaddrinfo` before validation, and ensure we fail closed on resolution errors.
