## 2024-06-24 - 修复提取工具信息功能的 SSRF 漏洞
**Vulnerability:** `validate_public_url` 未解析域名到 IP，允许攻击者传入指向内网 IP 的域名绕过验证。
**Learning:** 验证 URL 的安全性时，必须解析出所有的 IP 并验证。仅验证第一条记录是不够的，因为可能存在 DNS 重绑定漏洞（返回一条公网 IP 和一条内网 IP）。
**Prevention:** 始终使用 `socket.getaddrinfo` 解析主机名并检查所有返回的 IP 是否均为公共 IP。
