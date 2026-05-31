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


def test_cors_restrictions():
    response = client.options(
        "/api/auth/me",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "X-Secret-Header",
        },
    )
    assert response.status_code == 400
    assert response.text == "Disallowed CORS headers"


def test_cors_allowed():
    response = client.options(
        "/api/auth/me",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )
    assert response.status_code == 200
    assert "content-type" in response.headers.get("access-control-allow-headers", "").lower()
