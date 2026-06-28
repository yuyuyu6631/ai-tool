## 2025-02-27 - [CRITICAL] Fix SSRF via DNS in tool parser
**Vulnerability:** 服务器端请求伪造 (SSRF) 可通过 DNS 重绑定绕过。如果只检查输入是否为有效 IP，而不验证外部域名是否解析为内部 IP（如 `127.0.0.1.nip.io`），会导致内部网络资产暴露。
**Learning:** 在执行 URL 获取时，必须检查所有解析返回的 IP 地址以防止由于 DNS 返回的第一个 IP 是公共但第二个是私有的来绕过安全机制。
**Prevention:** 在发出请求前，使用 `socket.getaddrinfo` 提取主机名的所有 IP 并循环验证其不是私有、回环或链接本地地址。
