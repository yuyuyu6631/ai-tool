## 2024-07-09 - [CRITICAL] 修复网页抓取中的 SSRF 漏洞
**Vulnerability:** URL 验证函数只验证了字面 IP，没有进行 DNS 解析，这使得攻击者可以通过提供解析为内网 IP 的域名（例如 127.0.0.1.nip.io）来进行 SSRF (服务端请求伪造) 攻击。
**Learning:** 防止 SSRF 必须在发起请求前对域名进行真正的 DNS 解析（使用 `socket.getaddrinfo`），并验证返回的所有 IP 地址，且如果解析失败必须 fail closed（抛出异常）。
**Prevention:** 在处理用户提供的 URL 发起服务器端请求时，始终将主机名解析为 IP 地址，并验证这些地址是否为公网 IP。
