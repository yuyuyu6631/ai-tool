## 2026-06-11 - Prevent SSRF by resolving hostnames
**Vulnerability:** The previous URL validator only checked if the string representation of an IP address was private, allowing alternate IP encodings like 0x7f000001 or 2130706433 to bypass the check.
**Learning:** String-based IP parsing is insufficient for SSRF protection as network stacks automatically normalize hex, octal, and integer IP representations.
**Prevention:** Always resolve the hostname to an IP address using socket.getaddrinfo() before validating against private/local ranges, and fail closed on resolution errors.
