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


from unittest.mock import patch

@patch("app.services.tool_parser_service.socket.getaddrinfo")
def test_parser_extract_rejects_localhost_targets(mock_getaddrinfo):
    mock_getaddrinfo.return_value = [(2, 1, 6, '', ('127.0.0.1', 0))]
    response = client.post("/api/parser/extract", json={"url": "http://127.0.0.1/internal"})

    assert response.status_code == 400
    payload = response.json()
    assert payload["code"] == "bad_request"
    assert payload["detail"] == "不允许抓取本机或局域网地址"


@patch("app.services.tool_parser_service.socket.getaddrinfo")
def test_parser_extract_rejects_encoded_localhost_targets(mock_getaddrinfo):
    mock_getaddrinfo.return_value = [(2, 1, 6, '', ('127.0.0.1', 0))]
    response1 = client.post("/api/parser/extract", json={"url": "http://0x7f000001/internal"})
    assert response1.status_code == 400

    response2 = client.post("/api/parser/extract", json={"url": "http://2130706433/internal"})
    assert response2.status_code == 400
