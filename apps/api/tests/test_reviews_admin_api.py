import os
from datetime import date
from importlib import reload

from fastapi.testclient import TestClient
import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

_TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_reviews_admin_api.db")
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB_PATH}"
os.environ.setdefault("AUTH_SECRET_KEY", "test-auth-secret")
os.environ.setdefault("SESSION_COOKIE_NAME", "xingdianping_session")
os.environ.setdefault("COOKIE_SECURE", "false")

import app.db.session as session_mod  # noqa: E402
from app.db.session import Base  # noqa: E402
from app.main import create_app  # noqa: E402
from app.models import models  # noqa: F401,E402
from app.models.models import Category, Ranking, Tool, ToolCategory, ToolReview, User  # noqa: E402

app = create_app()

_test_engine = create_engine(
    f"sqlite:///{_TEST_DB_PATH}",
    connect_args={"check_same_thread": False},
)
_TestSession = sessionmaker(bind=_test_engine, autoflush=False, autocommit=False, class_=Session)
_ORIGINAL_SESSION_LOCAL = session_mod.SessionLocal


def setup_module():
    session_mod.SessionLocal = _TestSession
    Base.metadata.drop_all(bind=_test_engine)
    Base.metadata.create_all(bind=_test_engine)

    with _TestSession() as db:
        category = Category(slug="chatbot", name="Chatbot", description="Chat tools")
        db.add(category)
        db.flush()
        tool = Tool(
            slug="chatgpt",
            name="ChatGPT",
            category_name="Chatbot",
            summary="assistant",
            description="assistant",
            editor_comment="editor comment",
            official_url="https://example.com/chatgpt",
            logo_path=None,
            logo_status="missing",
            logo_source="imported",
            score=0.0,
            review_count=0,
            status="published",
            created_on=date(2026, 4, 1),
            last_verified_at=date(2026, 4, 1),
        )
        db.add(tool)
        db.flush()
        db.add(ToolCategory(tool_id=tool.id, category_id=category.id))
        db.add(
            ToolReview(
                tool_id=tool.id,
                source_type="editor",
                status="published",
                rating=4.0,
                title="Editor verdict",
                body="Best as a default starting point",
            )
        )
        db.add(Ranking(slug="hot", title="Hot ranking", description="Popular tools"))
        db.commit()


def teardown_module():
    session_mod.SessionLocal = _ORIGINAL_SESSION_LOCAL
    Base.metadata.drop_all(bind=_test_engine)
    try:
        if os.path.exists(_TEST_DB_PATH):
            os.remove(_TEST_DB_PATH)
    except PermissionError:
        pass


def _register(client: TestClient, username: str, email: str):
    return client.post(
        "/api/auth/register",
        json={
            "username": username,
            "email": email,
            "password": "password123",
            "confirmPassword": "password123",
            "agreed": True,
        },
    )


def test_user_review_is_upserted_and_updates_tool_aggregate():
    with TestClient(app) as client:
        response = _register(client, "reviewer", "reviewer@example.com")
        assert response.status_code == 201

        create_response = client.put(
            "/api/tools/chatgpt/reviews/me",
            json={"rating": 5, "title": "Works well", "body": "I would keep using it"},
        )
        assert create_response.status_code == 200
        assert create_response.json()["rating"] == 5

        update_response = client.put(
            "/api/tools/chatgpt/reviews/me",
            json={"rating": 3, "title": "Updated review", "body": "Changing this to a medium score"},
        )
        assert update_response.status_code == 200
        assert update_response.json()["title"] == "Updated review"

        reviews_response = client.get("/api/tools/chatgpt/reviews")
        assert reviews_response.status_code == 200
        payload = reviews_response.json()
        assert payload["summary"]["reviewCount"] == 2
        assert len(payload["editorReviews"]) == 1
        assert len(payload["userReviews"]) == 1
        assert payload["userReviews"][0]["title"] == "Updated review"

        detail_response = client.get("/api/tools/chatgpt")
        assert detail_response.status_code == 200
        assert detail_response.json()["reviewCount"] == 2
        assert detail_response.json()["ratingSummary"]["reviewCount"] == 2

        with _TestSession() as db:
            tool = db.scalar(select(Tool).where(Tool.slug == "chatgpt"))
            assert tool is not None
            assert tool.review_count == 2
            assert tool.score == 3.5

            rows = db.scalars(select(ToolReview).where(ToolReview.tool_id == tool.id, ToolReview.user_id.is_not(None))).all()
            assert len(rows) == 1

    with TestClient(app) as second_client:
        reviews_response = second_client.get("/api/tools/chatgpt/reviews")
        assert reviews_response.status_code == 200
        payload = reviews_response.json()
        assert len(payload["userReviews"]) == 1
        assert payload["userReviews"][0]["title"] == "Updated review"


def test_admin_routes_require_admin_role():
    with TestClient(app) as client:
        response = _register(client, "normal-user", "normal@example.com")
        assert response.status_code == 201

        forbidden = client.get("/api/admin/tools")
        assert forbidden.status_code == 403
        forbidden_overview = client.get("/api/admin/overview")
        assert forbidden_overview.status_code == 403


def test_admin_routes_require_login():
    with TestClient(app) as client:
        overview = client.get("/api/admin/overview")
        assert overview.status_code == 401

        tools = client.get("/api/admin/tools")
        assert tools.status_code == 401


def test_admin_can_manage_tools_and_rankings():
    with TestClient(app) as client:
        response = _register(client, "admin-user", "admin@example.com")
        assert response.status_code == 201

        with _TestSession() as db:
            user = db.scalar(select(User).where(User.username == "admin-user"))
            assert user is not None
            user.role = "admin"
            db.commit()

        tools_response = client.get("/api/admin/tools")
        assert tools_response.status_code == 200

        overview_response = client.get("/api/admin/overview")
        assert overview_response.status_code == 200
        overview_payload = overview_response.json()
        assert overview_payload["toolCount"] >= 1
        assert overview_payload["publishedToolCount"] >= 1
        assert overview_payload["reviewCount"] >= 1
        assert overview_payload["rankingCount"] >= 1
        assert len(overview_payload["recentUpdatedTools"]) >= 1

        create_tool = client.post(
            "/api/admin/tools",
            json={
                "slug": "new-tool",
                "name": "New Tool",
                "categorySlug": "chatbot",
                "categoryName": "Chatbot",
                "summary": "new tool summary",
                "description": "new tool description",
                "editorComment": "editor note",
                "developer": "team",
                "country": "CN",
                "city": "Shanghai",
                "price": "Free",
                "platforms": "Web",
                "officialUrl": "https://example.com/new-tool",
                "logoPath": "",
                "featured": True,
                "status": "published",
                "pricingType": "free",
                "priceMinCny": None,
                "priceMaxCny": None,
                "freeAllowanceText": "Free forever",
                "features": ["Fast setup", "Clear onboarding"],
                "limitations": ["Small team feature set"],
                "bestFor": ["Students", "Solo builders"],
                "dealSummary": "Free plan is enough for light usage.",
                "mediaItems": [
                    {
                        "type": "image",
                        "url": "/media/new-tool.png",
                        "thumbnailUrl": "/media/new-tool-thumb.png",
                        "title": "Product screenshot",
                        "sourceName": "Vendor",
                        "sourceUrl": "https://example.com/new-tool-source",
                    },
                    {"type": "video", "url": "ftp://example.com/bad.mp4", "title": "Bad media"},
                ],
                "accessFlags": {"needs_vpn": False, "cn_lang": True, "cn_payment": True},
                "tags": ["assistant", "chat"],
                "createdOn": "2026-04-17",
                "lastVerifiedAt": "2026-04-17",
            },
        )
        assert create_tool.status_code == 201
        created_tool_payload = create_tool.json()
        assert created_tool_payload["slug"] == "new-tool"
        assert created_tool_payload["features"] == ["Fast setup", "Clear onboarding"]
        assert created_tool_payload["limitations"] == ["Small team feature set"]
        assert created_tool_payload["bestFor"] == ["Students", "Solo builders"]
        assert created_tool_payload["dealSummary"] == "Free plan is enough for light usage."
        assert created_tool_payload["primaryMedia"]["url"] == "/media/new-tool.png"
        assert created_tool_payload["mediaItems"] == [created_tool_payload["primaryMedia"]]

        create_ranking = client.post(
            "/api/admin/rankings",
            json={
                "slug": "new-ranking",
                "title": "New ranking",
                "description": "Ranking created in admin",
                "items": [
                    {"toolSlug": "chatgpt", "rank": 1, "reason": "Stable choice"},
                    {"toolSlug": "new-tool", "rank": 2, "reason": "Worth trying"},
                ],
            },
        )
        assert create_ranking.status_code == 201
        assert len(create_ranking.json()["items"]) == 2

        updated_tool = client.put(
            "/api/admin/tools/1",
            json={
                "slug": "chatgpt",
                "name": "ChatGPT Updated",
                "categorySlug": "chatbot",
                "categoryName": "Chatbot",
                "summary": "updated summary",
                "description": "updated description",
                "editorComment": "updated note",
                "developer": "OpenAI",
                "country": "US",
                "city": "San Francisco",
                "price": "Paid",
                "platforms": "Web",
                "officialUrl": "https://example.com/chatgpt-updated",
                "logoPath": "",
                "featured": True,
                "status": "published",
                "pricingType": "subscription",
                "priceMinCny": 99,
                "priceMaxCny": 199,
                "freeAllowanceText": "",
                "features": ["Updated feature"],
                "limitations": ["Updated limitation"],
                "bestFor": ["Updated audience"],
                "dealSummary": "Updated deal note.",
                "mediaItems": [],
                "accessFlags": {"needs_vpn": False, "cn_lang": True, "cn_payment": True},
                "tags": ["assistant", "productivity"],
                "createdOn": "2026-04-01",
                "lastVerifiedAt": "2026-04-18",
            },
        )
        assert updated_tool.status_code == 200
        assert updated_tool.json()["name"] == "ChatGPT Updated"
        assert updated_tool.json()["features"] == ["Updated feature"]
        assert updated_tool.json()["mediaItems"] == []

        tools_after_update = client.get("/api/admin/tools")
        assert tools_after_update.status_code == 200
        assert any(item["name"] == "ChatGPT Updated" for item in tools_after_update.json())

        public_detail = client.get("/api/tools/chatgpt")
        assert public_detail.status_code == 200
        assert public_detail.json()["name"] == "ChatGPT Updated"
        assert public_detail.json()["limitations"] == ["Updated limitation"]


def test_production_like_environment_rejects_in_memory_database():
    os.environ["DATABASE_URL"] = "sqlite:///:memory:"
    os.environ["RAILWAY_ENVIRONMENT"] = "production"

    import app.core.config as config_module
    import app.main as main_module
    import app.db.session as session_module

    try:
        reload(config_module)
        reload(session_module)
        reload(main_module)

        ready, payload = main_module.check_backend_readiness()
        assert ready is False
        assert payload["reason"] == "persistent_database_required"
        assert payload["checks"]["database_config"] == "error"
        with pytest.raises(RuntimeError, match="persistent database"):
            with TestClient(main_module.create_app()):
                pass
    finally:
        os.environ.pop("RAILWAY_ENVIRONMENT", None)
        os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB_PATH}"
        reload(config_module)
        reload(session_module)
        reload(main_module)


def test_cors_origins_accept_comma_separated_env_values():
    os.environ["CORS_ALLOWED_ORIGINS"] = "https://one.example.com, https://two.example.com"

    import app.core.config as config_module

    try:
        reload(config_module)
        assert config_module.settings.cors_allowed_origins == [
            "https://one.example.com",
            "https://two.example.com",
        ]
    finally:
        os.environ.pop("CORS_ALLOWED_ORIGINS", None)
        reload(config_module)
