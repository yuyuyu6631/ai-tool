## 2024-06-29 - [SSRF via DNS Resolution Bypass]
**Vulnerability:** url 解析验证中未对非IP格式域名（如 domain.com）进行 DNS 解析验证，导致如果攻击者输入恶意域名并将其 DNS 解析指向内网 IP，将直接绕过 SSRF 防护。同时在使用 socket.getaddrinfo() 时必须遍历所有返回的 IP 防止 DNS 重绑定攻击，且在异常时必须 fail-closed（禁止访问）而非 fail-open。
**Learning:**  基于域名的 URL 在请求前不仅需要验证字面量（如是否是 localhost），还必须实际解析其 A 记录，并校验所有对应的 IP 地址是否为私有/环回地址。验证逻辑中的异常处理如果过于宽泛或 fail-open（如遇到无法解析直接放行），将使防御完全失效。
**Prevention:** 在防御 SSRF 时，凡是涉及到 URL 请求，必须强制将 hostname 解析为具体 IP 进行验证，且必须遍历 getaddrinfo 获得的所有 IP，一旦发现内网 IP 即刻阻断。当 DNS 解析失败或抛出异常时，一律视为无效请求（Fail-Closed）。同时，应注意在测试代码中 mock socket.getaddrinfo 以防止单元测试因无法解析虚假域名而报错。
