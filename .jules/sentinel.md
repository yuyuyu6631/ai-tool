## 2024-06-22 - 修复工具解析器URL验证中的SSRF漏洞
**Vulnerability:** URL 验证时仅检查了主机名本身是否为私有 IP 字符串，未能防护攻击者使用指向本地 IP 的域名（例如 `localtest.me` 或 `127.0.0.1.nip.io`）绕过验证，从而导致服务器端请求伪造 (SSRF)。
**Learning:** 对 URL 验证不能仅依赖字符串 IP 解析。攻击者可以利用 DNS 解析将看似正常的域名映射到内部或私有 IP。
**Prevention:** 在允许发出对外请求之前，始终对主机名执行 DNS 解析（如 `socket.getaddrinfo`），提取出真实的 IP 地址，然后再将其与私有和本地 IP 范围进行验证。
