## 2024-05-09 - [Fix overly permissive CORS configuration]
**Vulnerability:** The backend CORS configuration allowed all HTTP methods and headers (`allow_methods=["*"]`, `allow_headers=["*"]`).
**Learning:** Using wildcards in CORS settings violates the principle of least privilege and can increase the attack surface, potentially allowing attackers to exploit cross-origin vulnerabilities via unexpected methods or headers.
**Prevention:** Always explicitly define the allowed HTTP methods (e.g., `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`) and headers (e.g., `Content-Type`, `Accept`, `Authorization`) in the `CORSMiddleware` configuration.
