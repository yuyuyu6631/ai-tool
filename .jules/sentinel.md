## 2025-07-08 - [SSRF 防御：在获取工具元数据前强制解析 DNS 并校验 IP]
**Vulnerability:** `tool_parser_service.py` 中的 `validate_public_url` 仅仅基于 `urllib.parse` 解析的域名进行了是否为本地、局域网的字符串比对，同时试图将其解析为 IP 失败（返回 ValueError）时，并未阻断流程（fail open）。攻击者可利用特殊的域名配置，例如设置 A 记录解析为局域网 IP (`127.0.0.1` 或是内部内网服务 IP)，或通过 DNS 重绑定，从而以服务端的身份发起内部请求，形成服务器端请求伪造 (SSRF) 攻击风险。
**Learning:** 进行网络请求前的安全校验不能仅仅依赖于字符串层面的域名判断或简单的首选 IP 检测。需要真正进行 DNS 查询获取解析后的实际 IP 地址，并要求其不得属于内网/本地等保留地址。同时安全策略必须执行"fail closed"原则，在无法解析地址时直接阻断请求而不能继续放行。
**Prevention:** 在任何触发服务端发起 HTTP(s) 请求的方法中（如获取网页内容的 `urlopen` 之前），使用标准库如 `socket.getaddrinfo` 解析真实 IP 并遍历所有解析结果进行严格的安全校验。对于解析失败的异常也要直接抛出错误。针对需要发起外部请求的单元测试，需要同时 mock 相应的底层函数（如 `@patch("socket.getaddrinfo")`）以确保测试通过。
