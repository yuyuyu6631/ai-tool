## 2024-06-06 - SSRF Bypass via IP Encodings and Local DNS
**Vulnerability:** The SSRF protection in `tool_parser_service.py` relied solely on `ipaddress.ip_address` parsing the string directly. This allowed bypassing validation via alternate encodings (e.g., `0x7f000001`, `2130706433`) or DNS mapping to localhost (e.g., `localtest.me`).
**Learning:** Naive string or `ipaddress` parsing without DNS resolution is insufficient. Validation must check the actual resolved IP addresses.
**Prevention:** Always resolve the hostname using `socket.getaddrinfo` and apply validation checks (e.g., `is_private`, `is_loopback`) on the resolved IPs, explicitly failing closed on resolution errors.
