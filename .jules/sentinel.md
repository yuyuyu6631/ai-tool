## 2025-05-02 - Secure Admin API Endpoints with Global Dependencies

**Vulnerability:** The backend administrative routes for crawling (`/crawl/jobs`) and LLM parsing (`/extract`) inside `apps/api/app/api/routes/crawl.py` and `apps/api/app/api/routes/parser.py` lacked authentication checks. Anyone with the URL could have invoked them, leading to potentially abusive consumption of crawl and LLM extraction resources.

**Learning:** Administrative endpoints were separated into modular `APIRouter` instances but missed the explicit global dependency array `dependencies=[Depends(auth_service.current_admin_dependency)]` that other admin routers (like `admin.py`) already used.

**Prevention:** Always verify that newly created internal/admin `APIRouter` instances explicitly declare `dependencies=[Depends(auth_service.current_admin_dependency)]` during instantiation to ensure uniform protection of all enclosed endpoints.

## 2024-05-31 - [修复后端 CORS 配置过宽漏洞]
**Vulnerability:** 后端 API (`apps/api/app/main.py`) 使用了通配符 `allow_methods=["*"]` 和 `allow_headers=["*"]`。
**Learning:** 在生产或即便有 `allow_origins` 限制的环境中，允许所有 HTTP 方法和头信息不仅打破了最小权限原则，还有可能扩大客户端代码潜在利用面（例如通过自定义恶意 HTTP Header 或者利用非预期的方法发包）。
**Prevention:** 始终显式地指定 `allow_methods`（例如 `["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]`）和 `allow_headers`（例如 `["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"]`）。
