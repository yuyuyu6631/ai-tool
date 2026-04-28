## 2026-04-28 - Secure Unauthenticated Admin Endpoints
**Vulnerability:** The /api/parser/extract and /api/crawl/jobs endpoints were exposed publicly without authentication despite being intended for admin usage.
**Learning:** API routes separated into individual router modules must explicitly include authentication dependencies at the router level (using the `dependencies` argument in `APIRouter`) if they expose administrative actions.
**Prevention:** Establish a standard to defensively review all new APIRouter declarations to ensure sensitive endpoints are wrapped in `auth_service.current_admin_dependency` or equivalent role-based access checks.
