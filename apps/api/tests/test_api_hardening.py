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

from unittest.mock import patch

def test_parser_extract_rejects_ssrf_bypass_integer():
    with patch('app.services.tool_parser_service.socket.getaddrinfo') as mock_dns:
        mock_dns.return_value = [(2, 1, 6, '', ('127.0.0.1', 0))]
        response = client.post("/api/parser/extract", json={"url": "http://2130706433/internal"})
        assert response.status_code == 400
        payload = response.json()
        assert payload["code"] == "bad_request"
        assert payload["detail"] == "不允许抓取本机或局域网地址"

def test_parser_extract_rejects_ssrf_bypass_hex():
    with patch('app.services.tool_parser_service.socket.getaddrinfo') as mock_dns:
        mock_dns.return_value = [(2, 1, 6, '', ('127.0.0.1', 0))]
        response = client.post("/api/parser/extract", json={"url": "http://0x7f000001/internal"})
        assert response.status_code == 400
        payload = response.json()
        assert payload["code"] == "bad_request"
        assert payload["detail"] == "不允许抓取本机或局域网地址"

def test_parser_extract_accepts_valid_domain():
    with patch('app.services.tool_parser_service.socket.getaddrinfo') as mock_dns:
        mock_dns.return_value = [(2, 1, 6, '', ('8.8.8.8', 0))]
        with patch('app.services.tool_parser_service.fetch_webpage_text') as mock_fetch:
            mock_fetch.return_value = "Title: Test\nDescription: Desc"
            response = client.post("/api/parser/extract", json={"url": "http://google.com"})
            assert response.status_code == 200
            payload = response.json()
            assert payload["success"] is False # because AI extraction might return {}, but no 400 error
