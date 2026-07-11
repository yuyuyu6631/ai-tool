## 2025-03-31 - SSRF 验证绕过与 DNS 重绑定防御
**Vulnerability:** URL 验证机制 `validate_public_url` 仅将未直接解析为私有 IP 的输入视为合法，若传入自定义域名则会在 `ipaddress.ip_address` 抛出 `ValueError` 时静默放行 (fail open)。这允许攻击者通过配置域名解析到内网 IP 绕过 SSRF 防护。
**Learning:** 仅针对显式 IP 字符串进行 SSRF 拦截是不够的，必须进行完整的 DNS 解析。同时，仅仅获取并检查第一个 A 记录是不够的，还需要遍历所有解析结果来防御 DNS 重绑定和多记录配置；此外，在网络和 DNS 解析失败时必须采取 fail closed 策略，抛出异常而不是放行。
**Prevention:** 在处理涉及外部资源请求的 URL 时，使用 `socket.getaddrinfo` 解析主机名，捕获 `socket.gaierror` 等异常并执行拒绝策略。遍历所有返回的 IP 地址并全部验证是否处于安全的公共网络范围内。
