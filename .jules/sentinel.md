## 2026-05-31 - [Overly Permissive CORS Configuration]
**Vulnerability:** The API had an overly permissive CORS configuration, allowing all methods and headers (`allow_methods=["*"]`, `allow_headers=["*"]`).
**Learning:** This could potentially allow attackers to bypass intended security controls by sending requests with unexpected methods or headers.
**Prevention:** Always restrict CORS configuration to explicitly allowed methods and headers, following the principle of least privilege.
