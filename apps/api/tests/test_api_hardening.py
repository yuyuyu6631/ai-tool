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

def test_parser_extract_rejects_ssrf_domains():
    # Integer format for 127.0.0.1
    response = client.post("/api/parser/extract", json={"url": "http://2130706433"})
    assert response.status_code == 400
    payload = response.json()
    assert payload["code"] == "bad_request"
    assert "不允许抓取本机或局域网地址" in payload["detail"]

    # Octal format for 127.0.0.1
    response = client.post("/api/parser/extract", json={"url": "http://0177.0.0.1"})
    assert response.status_code == 400
    payload = response.json()
    assert payload["code"] == "bad_request"
    assert "不允许抓取本机或局域网地址" in payload["detail"]

    # domain that resolves to 127.0.0.1 (nip.io)
    response = client.post("/api/parser/extract", json={"url": "http://127.0.0.1.nip.io"})
    assert response.status_code == 400
    payload = response.json()
    assert payload["code"] == "bad_request"
    assert "不允许抓取本机或局域网地址" in payload["detail"]
