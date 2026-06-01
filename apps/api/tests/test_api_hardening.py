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

from app.core.config import Settings
import pytest
from pydantic import ValidationError

def test_production_rejects_legacy_secret():
    with pytest.raises(ValidationError) as exc:
        Settings(auth_secret_key="dev-auth-secret-key", environment="production")
    assert "legacy 'dev-auth-secret-key' value not allowed" in str(exc.value)

def test_production_requires_long_secret():
    with pytest.raises(ValidationError) as exc:
        Settings(auth_secret_key="short_secret", environment="production")
    assert "AUTH_SECRET_KEY must be at least 32 characters in production" in str(exc.value)
