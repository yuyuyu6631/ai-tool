## 2024-05-24 - URL 验证中的 SSRF 和 DNS 解析绕过
**Vulnerability:** 在 `validate_public_url` 函数中，对 URL 的主机名进行直接检查，如果不是 IP 地址而是域名，则直接放行。攻击者可以通过提供解析为内部 IP（例如 `127.0.0.1.nip.io` 或通过 DNS Rebinding）的域名来绕过检查，导致 SSRF 漏洞。
**Learning:** 仅检查输入字符串是否看起来像私有 IP 是不够的。必须对主机名执行真实的 DNS 解析（`socket.getaddrinfo`），并验证所有返回的 IP 地址是否为私有/本地 IP。如果在验证期间域名无法解析，则应采用“失败即关闭”（fail closed）原则，直接拒绝请求。
**Prevention:** 在处理对外发送的网络请求时，如果涉及到用户提供的 URL，必须首先进行 DNS 解析，然后对解析出的每个真实 IP 地址进行严格的私有地址范围过滤。
