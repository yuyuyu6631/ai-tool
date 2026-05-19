## 2026-05-19 - Secure CORS Configuration
**Vulnerability:** Overly permissive CORS configuration using wildcards (`"*"`) for both `allow_methods` and `allow_headers` in FastAPI's `CORSMiddleware`.
**Learning:** Using wildcards for CORS methods and headers exposes the API to unnecessary risks by allowing any HTTP method and any custom headers from allowed origins, which could facilitate more complex attacks or bypass expected protections. It violates the principle of least privilege.
**Prevention:** Always restrict CORS configuration to only the specific methods (e.g., `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`) and headers (e.g., `Content-Type`, `Accept`, `Authorization`) that are explicitly required by the frontend application.
