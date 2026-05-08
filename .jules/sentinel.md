## 2024-05-18 - Overly Permissive CORS Configuration
**Vulnerability:** The API had an overly permissive CORS configuration (`allow_methods=["*"]`, `allow_headers=["*"]`) which could allow malicious sites to perform unexpected cross-origin requests.
**Learning:** Defaulting to wildcard configurations in middleware can lead to broad exposure and bypass standard security controls enforced by browsers.
**Prevention:** Always restrict `allow_methods` to specifically required methods (e.g. `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`) and `allow_headers` to only what the application needs (e.g. `Content-Type`, `Accept`, `Authorization`).
