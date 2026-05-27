## 2025-02-18 - [Restrict Overly Permissive CORS Configuration]
**Vulnerability:** CORS Configuration using wildcards for allowed_headers and allowed_methods.
**Learning:** Default explicit method lists and header lists over wildcards avoids cross domain vulnerabilities.
**Prevention:** In FastAPI, specify allow_methods and allow_headers explicitly.
