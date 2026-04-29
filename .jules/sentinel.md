## 2024-04-29 - [CRITICAL] Missing authentication on administrative API endpoints
**Vulnerability:** Unauthenticated access to administrative /crawl and /parser endpoints.
**Learning:** Always explicitly protect administrative API routers using dependencies like `current_admin_dependency`.
**Prevention:** Use `APIRouter(dependencies=[Depends(...)])` for routes that must be restricted.
