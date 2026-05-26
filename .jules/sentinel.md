## 2024-05-24 - [Fix overly permissive CORS configuration]
**Vulnerability:** The API CORS middleware used wildcards for `allow_methods` and `allow_headers`, exposing the API to broader cross-origin requests than necessary.
**Learning:** In FastAPI/Starlette, using `['*']` for `allow_methods` and `allow_headers` can introduce security risks by accepting unanticipated HTTP methods or custom headers. Also, when explicitly defining `allow_headers`, Starlette inherently merges them with safelisted headers (like `Accept`, `Accept-Language`, `Content-Language`), so tests must check for inclusion rather than exact string match.
**Prevention:** Always restrict CORS `allow_methods` and `allow_headers` to the explicit list required by the frontend application rather than defaulting to wildcards.
