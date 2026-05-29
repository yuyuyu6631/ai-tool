## 2026-05-29 - [CORS Policy Hardening]
**Vulnerability:** Overly permissive CORS configuration allowing all methods (`allow_methods=["*"]`) and headers (`allow_headers=["*"]`).
**Learning:** In a Starlette/FastAPI application, wildcard CORS can lead to cross-origin security issues, increasing the attack surface. We need explicit lists of allowed methods and headers.
**Prevention:** explicitly define `allow_methods` and `allow_headers` in `CORSMiddleware` instead of using wildcards, and maintain robust tests verifying this configuration.
