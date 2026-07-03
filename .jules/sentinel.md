## 2024-07-03 - [CRITICAL] 修复 Tool Parser Service 中的 SSRF 漏洞
**Vulnerability:** 在 URL 验证中存在服务器端请求伪造 (SSRF) 风险。只验证了解析后的主机名而没有进行 DNS 解析，这允许攻击者通过 DNS 重绑定等手段提供解析到内部 IP 的域名，从而扫描内部网络。
**Learning:** 始终使用 `socket.getaddrinfo` 将主机名解析为 IP 地址，并遍历所有返回的 IP 地址以防止 DNS 重绑定攻击。同时，在域名解析失败时应默认拒绝访问（Fail closed）。
**Prevention:** 使用严格的 DNS 验证并在解析错误时默认拒绝。遍历所有返回的 IP 地址以捕获任何重绑定尝试。
