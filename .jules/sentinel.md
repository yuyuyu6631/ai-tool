## 2024-05-24 - [Fix SSRF vulnerability in URL validation]
**Vulnerability:** The `validate_public_url` function failed open when a hostname could not be directly parsed as an IP address by `ipaddress`, allowing SSRF via alternative IP encodings (e.g., hex `0x7f000001`, integer `2130706433`) or DNS domains resolving to localhost (e.g., `localhost.direct`).
**Learning:** Naive string-based IP validation is insufficient because URL fetching libraries (like `urllib`) will resolve DNS and parse alternative IP encodings. When string parsing fails, it must not fail open.
**Prevention:** Always resolve hostnames via `socket.getaddrinfo` before checking against private IP ranges to ensure all actual target IPs are evaluated, and never return the URL if parsing or resolution fails.
