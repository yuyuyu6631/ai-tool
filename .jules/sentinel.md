## 2024-05-24 - [CORS Middleware Hardening]
**Vulnerability:** Overly permissive CORS configuration (`allow_methods=["*"]`, `allow_headers=["*"]`) in FastAPI `CORSMiddleware`.
**Learning:** Using wildcards for methods and headers in CORS allows any cross-origin request to use any HTTP method and send any header, increasing the attack surface.
**Prevention:** Always explicitly define the allowed HTTP methods (e.g., `["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]`) and headers (e.g., `["Content-Type", "Accept", "Authorization", "X-Requested-With"]`) based on the application's actual requirements.
