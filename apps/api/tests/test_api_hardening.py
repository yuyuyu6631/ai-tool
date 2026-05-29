import os

from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

from app.main import create_app
from app.services import auth_service

app = create_app()
app.dependency_overrides[auth_service.current_admin_dependency] = lambda: None
client = TestClient(app)


def test_http_errors_preserve_detail_and_expose_stable_error_fields():
    response = client.get("/api/auth/me")

    assert response.status_code == 401
    payload = response.json()
    assert payload["detail"]
    assert payload["code"] == "unauthorized"
    assert payload["message"] == "登录状态无效或已过期"


def test_parser_extract_rejects_localhost_targets():
    response = client.post("/api/parser/extract", json={"url": "http://127.0.0.1/internal"})

    assert response.status_code == 400
    payload = response.json()
    assert payload["code"] == "bad_request"
    assert payload["detail"] == "不允许抓取本机或局域网地址"


def test_cors_configuration_is_restrictive():
    response = client.options(
        "/api/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )

    assert response.status_code == 200

    allow_methods = response.headers.get("access-control-allow-methods", "")
    assert "*" not in allow_methods
    for method in ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]:
        assert method in allow_methods

    allow_headers = response.headers.get("access-control-allow-headers", "")
    assert "*" not in allow_headers
    # Note: safelisted headers like Accept may be injected by FastAPI/Starlette,
    # so we check for presence instead of exact match
    for header in ["Content-Type", "Accept", "Authorization", "X-Requested-With"]:
        # Fastapi returns headers in lowercase usually but case-insensitive is safer
        assert header.lower() in allow_headers.lower()
