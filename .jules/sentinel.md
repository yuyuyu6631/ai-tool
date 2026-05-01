## 2026-05-01 - [HIGH] Fix missing authentication on administrative API endpoints
**Vulnerability:** Admin-level endpoints in `crawl.py` and `parser.py` were missing authentication dependencies (`Depends(auth_service.current_admin_dependency)`). This allowed unauthorized access to sensitive administrative functionality.
**Learning:** When adding new administrative API routers in FastAPI, developers may forget to inject `dependencies` directly into `APIRouter()` instantiation.
**Prevention:** Always verify that internal, administrative routers require `Depends(auth_service.current_admin_dependency)` upon initialization.
