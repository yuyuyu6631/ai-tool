## 2025-05-15 - [SSRF] 校验 URL 必须检查 DNS 结果，不能仅以字符串无法解析就放行
**Vulnerability:** 在检查是否为内网地址时，如果目标是域名（如 `127.0.0.1.nip.io`），之前仅仅尝试转 `ipaddress` 失败就直接放行，导致 SSRF 漏洞可以访问到内网。
**Learning:** 仅对输入 URL 做基于字符串规则的安全验证是不够的，如果底层调用会进行 DNS 解析并请求该 IP（例如 `urllib.request`），必须先自己调用 `socket.getaddrinfo` 解析出 IP。如果放过看似正常的域名而没有去验证它指向的 IP（或者在多 DNS A 记录时只校验第一个 IP），同样会被 DNS Rebinding 或特制的域名利用。
**Prevention:** 涉及外部 URL 请求时，需要强制在服务端通过 `socket.getaddrinfo` 解析得到 IP 地址；并且要遍历解析出来的所有 IP 进行验证，且 DNS 解析失败需默认阻断 (Fail closed)。
