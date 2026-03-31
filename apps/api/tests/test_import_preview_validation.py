import os

from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", f"sqlite:///{os.path.join(os.path.dirname(__file__), 'test_import_preview.db')}")

from app.main import app  # noqa: E402


client = TestClient(app)


def test_import_preview_validation_endpoint_returns_report():
    response = client.get("/api/tools/import-preview/validation")
    assert response.status_code == 200

    data = response.json()
    assert "stats" in data
    assert "items" in data
    assert isinstance(data["items"], list)
