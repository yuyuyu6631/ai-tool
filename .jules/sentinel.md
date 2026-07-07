## 2025-02-27 - [DNS解析导致的SSRF绕过漏洞]
**Vulnerability:** URL解析器 `validate_public_url` 仅对域名使用 `ipaddress.ip_address` 验证，若为字母域名（如 example.com）则由于异常而被直接放行（Fail Open）。同时，这也未能正确处理DNS解析导致的SSRF问题。同一个域名可能会解析到多个IP地址（例如DNS重绑定攻击）。如果任何解析出的IP为内网地址，则必须将其拦截。
**Learning:** 使用简单的域名结构校验防止SSRF是不够的，不能Fail Open。必须使用 `socket.getaddrinfo` 显式请求所有的DNS A/AAAA记录，并遍历检查是否*任何*结果IP为内网或私有地址。
**Prevention:** 永远使用 `socket.getaddrinfo` 迭代所有返回的IP地址。如果DNS解析失败或查出内网地址，则必须默认拒绝（Fail Closed）。
