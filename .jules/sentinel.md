## 2025-01-20 - 修复 URL 验证中的 SSRF 漏洞
**Vulnerability:** 服务器端请求伪造（SSRF）绕过，因为缺少适当的 DNS 解析且未遍历所有返回的 IP。
**Learning:** 仅验证主机名或第一个返回的 IP 是不够的，因为 DNS 重绑定或多个 A 记录可以同时返回公网和私网 IP。
**Prevention:** 始终使用 `socket.getaddrinfo` 解析主机名并遍历所有返回的 IP，确保它们都不是私有、环回、链路本地、多播、保留或未指定的 IP。
