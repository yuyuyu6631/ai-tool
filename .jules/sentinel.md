## 2025-03-02 - [Fix SSRF vulnerability in validate_public_url]
**Vulnerability:** 代码的 URL 验证仅依赖字符串中主机的 IP 解析，如果传递的 URL 是域名（如 `localtest.me`，其 A 记录指向 `127.0.0.1`），则会绕过局域网地址检测。
**Learning:** 仅分析字符串以过滤私有IP不足以防御 SSRF。必须使用 `socket.getaddrinfo` 解析主机名并检查所有返回的 IP（防止 DNS 重绑定并保证任何解析的IP都不是局域网 IP），如果在验证过程抛出解析错误（fail-closed），应当阻塞而不是继续进行。
**Prevention:** 始终在网络层级或者应用程序验证层级使用 DNS 解析后的实际 IP 验证，并采用 Fail-closed 异常处理策略，且在测试网络拦截时需要将 Mock 服务返回公网IP以保证其他依赖假域名的单元测试可以正常通过。
