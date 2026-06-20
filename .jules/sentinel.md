## 2025-02-24 - SSRF 漏洞修复
**Vulnerability:** 提取工具信息的 URL 解析存在 SSRF 漏洞，未解析域名的真实 IP，允许通过 `127.1` 或 `localtest.me` 绕过保护访问内部网络。
**Learning:** 仅基于字符串比较或直接解析纯数字 IP 无法抵御采用备用编码或自定义 DNS 映射的 SSRF 攻击，导致保护失效。
**Prevention:** 在验证任意 URL 输入时，必须使用 `socket.getaddrinfo` 解析真实 IP 并使用 `ipaddress` 验证，同时需要在单元测试中针对真实域名做 Mock 避免测试崩溃。
