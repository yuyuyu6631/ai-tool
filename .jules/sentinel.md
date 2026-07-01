## 2023-10-25 - [CRITICAL] Fix SSRF vulnerability in tool parser
**Vulnerability:** 代码在验证用户提供的URL时，只检查了URL字符串的主机名部分，而没有将其解析为实际的IP地址。这使得攻击者可以使用自定义的DNS服务器或类似 nip.io 的服务，提供一个看似合法的域名，但实际上解析为内部网络地址（如 127.0.0.1 或 10.0.0.1），从而引发服务器端请求伪造（SSRF）漏洞。
**Learning:** 在执行任何网络请求之前，必须将主机名解析为IP地址，并且验证解析出的所有IP地址是否属于私有、回环或其他保留地址段。仅对字符串形式的主机名进行验证是不够的，因为DNS解析结果可以被攻击者控制。同时，处理DNS解析错误时必须fail-closed，如果解析失败则拒绝请求。
**Prevention:** 使用 `socket.getaddrinfo` 解析主机名，并遍历返回的所有IP地址进行验证。捕获 `socket.gaierror` 异常并拒绝请求，确保安全逻辑不会被异常绕过。在单元测试中，需要 mock `socket.getaddrinfo` 以保证测试的独立性和稳定性，避免因使用如 "example.com" 等真实域名而发起外部网络请求。
