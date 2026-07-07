import os
from datetime import date

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

_TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_match_plan_admin_api.db")
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB_PATH}"
os.environ.setdefault("AUTH_SECRET_KEY", "test-auth-secret")
os.environ.setdefault("SESSION_COOKIE_NAME", "xingdianping_session")
os.environ.setdefault("COOKIE_SECURE", "false")
os.environ.setdefault("AI_PROVIDER", "stub")

import app.db.session as session_mod  # noqa: E402
from app.db.session import Base  # noqa: E402
from app.main import create_app  # noqa: E402
from app.models import models  # noqa: F401,E402
from app.models.models import Category, Tool, ToolCategory, User  # noqa: E402

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
        category = Category(slug="writing", name="Writing", description="Writing tools")
        db.add(category)
        db.flush()
        tools = [
            Tool(
                slug="chatgpt",
                name="ChatGPT",
                category_name="Writing",
                summary="general assistant for writing",
                description="assistant",
                editor_comment="editor comment",
                official_url="https://example.com/chatgpt",
                score=9.0,
                review_count=0,
                status="published",
                created_on=date(2026, 4, 1),
                last_verified_at=date(2026, 4, 1),
            ),
            Tool(
                slug="paperflow",
                name="PaperFlow",
                category_name="Writing",
                summary="academic document formatting",
                description="format papers",
                editor_comment="editor comment",
                official_url="https://example.com/paperflow",
                score=1.0,
                review_count=0,
                status="published",
                created_on=date(2026, 4, 1),
                last_verified_at=date(2026, 4, 1),
            ),
            Tool(
                slug="draft-only",
                name="Draft Only",
                category_name="Writing",
                summary="draft tool",
                description="draft",
                editor_comment="editor comment",
                official_url="https://example.com/draft-only",
                score=10.0,
                review_count=0,
                status="draft",
                created_on=date(2026, 4, 1),
                last_verified_at=date(2026, 4, 1),
            ),
        ]
        for tool in tools:
            db.add(tool)
            db.flush()
            db.add(ToolCategory(tool_id=tool.id, category_id=category.id))
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


def _make_admin(username: str):
    with _TestSession() as db:
        user = db.scalar(select(User).where(User.username == username))
        assert user is not None
        user.role = "admin"
        db.commit()


def test_match_plan_admin_routes_require_auth_and_admin():
    with TestClient(app) as client:
        assert client.get("/api/admin/match-plans").status_code == 401
        response = _register(client, "normal-match-user", "normal-match@example.com")
        assert response.status_code == 201
        assert client.get("/api/admin/match-plans").status_code == 403


def test_admin_can_preview_publish_and_drive_recommendations():
    with TestClient(app) as client:
        response = _register(client, "match-admin", "match-admin@example.com")
        assert response.status_code == 201
        _make_admin("match-admin")

        create_response = client.post(
            "/api/admin/match-plans",
            json={
                "slug": "paper-plan",
                "title": "Paper writing plan",
                "description": "Boost academic formatting tools",
                "persona": "student",
                "scenario": "academic-writing",
                "triggerKeywords": ["论文", "academic-writing"],
                "status": "draft",
                "sortOrder": 0,
                "tools": [
                    {"toolSlug": "paperflow", "reason": "后台策略优先推荐论文排版工具", "sortOrder": 0, "weight": 300}
                ],
            },
        )
        assert create_response.status_code == 201

        plan = next(item for item in client.get("/api/admin/match-plans").json() if item["slug"] == "paper-plan")
        preview_response = client.post(
            f"/api/admin/match-plans/{plan['id']}/preview",
            json={"query": "我要写论文", "scenario": "academic-writing", "tags": []},
        )
        assert preview_response.status_code == 200
        assert preview_response.json()["matched"] is True

        before_publish = client.post("/api/recommend", json={"query": "我要写论文", "scenario": "academic-writing", "tags": []})
        assert before_publish.status_code == 200
        assert all(item["reason"] != "后台策略优先推荐论文排版工具" for item in before_publish.json())

        publish_response = client.post(f"/api/admin/match-plans/{plan['id']}/publish")
        assert publish_response.status_code == 200
        assert publish_response.json()["status"] == "published"

        recommend_response = client.post("/api/recommend", json={"query": "我要写论文", "scenario": "academic-writing", "tags": []})
        assert recommend_response.status_code == 200
        recommend_payload = recommend_response.json()
        assert recommend_payload[0]["slug"] == "paperflow"
        assert recommend_payload[0]["reason"] == "后台策略优先推荐论文排版工具"

        ai_search_response = client.get("/api/ai-search?q=%E6%88%91%E8%A6%81%E5%86%99%E8%AE%BA%E6%96%87&page_size=3")
        assert ai_search_response.status_code == 200
        ai_payload = ai_search_response.json()
        assert ai_payload["results"][0]["slug"] == "paperflow"
        assert ai_payload["results"][0]["reason"] == "后台策略优先推荐论文排版工具"

        overview_response = client.get("/api/admin/overview")
        assert overview_response.status_code == 200
        overview = overview_response.json()
        assert overview["matchPlanCount"] >= 1
        assert overview["publishedMatchPlanCount"] >= 1
        assert any(item["slug"] == "paper-plan" for item in overview["recentPublishedMatchPlans"])


def test_publish_rejects_unpublished_tools_and_public_boost_skips_them():
    with TestClient(app) as client:
        response = _register(client, "invalid-plan-admin", "invalid-plan-admin@example.com")
        assert response.status_code == 201
        _make_admin("invalid-plan-admin")

        create_response = client.post(
            "/api/admin/match-plans",
            json={
                "slug": "invalid-tool-plan",
                "title": "Invalid tool plan",
                "description": "",
                "persona": "",
                "scenario": "draft",
                "triggerKeywords": ["draft"],
                "status": "draft",
                "sortOrder": 0,
                "tools": [
                    {"toolSlug": "draft-only", "reason": "Should not publish", "sortOrder": 0, "weight": 100}
                ],
            },
        )
        assert create_response.status_code == 201
        plan = next(item for item in client.get("/api/admin/match-plans").json() if item["slug"] == "invalid-tool-plan")
        publish_response = client.post(f"/api/admin/match-plans/{plan['id']}/publish")
        assert publish_response.status_code == 422
