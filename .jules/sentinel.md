## 2024-07-12 - 发现并修复 SSRF 漏洞
**Vulnerability:** DNS解析缺失导致开放式故障 (Failing Open)
**Learning:** 仅校验 IP 形式的输入，会导致包含域名的 URL 完全不受过滤，甚至在未成功解析时直接返回错误而不拒绝访问。
**Prevention:** 在无法解析域名时，务必实行封闭式故障（Fail Closed），同时对所有解析出的 IP 进行全面校验。
