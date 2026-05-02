## 2025-05-02 - Secure Admin API Endpoints with Global Dependencies

**Vulnerability:** The backend administrative routes for crawling (`/crawl/jobs`) and LLM parsing (`/extract`) inside `apps/api/app/api/routes/crawl.py` and `apps/api/app/api/routes/parser.py` lacked authentication checks. Anyone with the URL could have invoked them, leading to potentially abusive consumption of crawl and LLM extraction resources.

**Learning:** Administrative endpoints were separated into modular `APIRouter` instances but missed the explicit global dependency array `dependencies=[Depends(auth_service.current_admin_dependency)]` that other admin routers (like `admin.py`) already used.

**Prevention:** Always verify that newly created internal/admin `APIRouter` instances explicitly declare `dependencies=[Depends(auth_service.current_admin_dependency)]` during instantiation to ensure uniform protection of all enclosed endpoints.
