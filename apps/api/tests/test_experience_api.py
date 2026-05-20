import os

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

_TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_experience_api.db")
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB_PATH}"
os.environ.setdefault("AUTH_SECRET_KEY", "test-auth-secret")
os.environ.setdefault("SESSION_COOKIE_NAME", "xingdianping_session")
os.environ.setdefault("COOKIE_SECURE", "false")

import app.db.session as session_mod  # noqa: E402
from app.db.session import Base  # noqa: E402
from app.main import create_app  # noqa: E402
from app.models import models  # noqa: F401,E402
from app.models.models import ExperienceComment, ExperiencePost  # noqa: E402

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


def teardown_module():
    session_mod.SessionLocal = _ORIGINAL_SESSION_LOCAL
    Base.metadata.drop_all(bind=_test_engine)
    try:
        if os.path.exists(_TEST_DB_PATH):
            os.remove(_TEST_DB_PATH)
    except PermissionError:
        pass


def _register(client: TestClient, username: str = "community-user", email: str = "community@example.com"):
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


def test_experience_list_detail_and_comments_are_public():
    with TestClient(app) as client:
        response = client.get("/api/experiences")
        assert response.status_code == 200
        payload = response.json()
        assert payload["total"] >= 4
        assert {board["slug"] for board in payload["boards"]} >= {
            "skill-community",
            "mcp-community",
            "openclaw-lobster",
            "hammers-community",
        }
        first = payload["items"][0]
        assert first["coverImageUrl"]
        assert first["commentCount"] >= 0

        filtered = client.get("/api/experiences", params={"channel": "工具组合"})
        assert filtered.status_code == 200
        assert all(item["channel"] == "工具组合" for item in filtered.json()["items"])

        detail = client.get(f"/api/experiences/{first['slug']}")
        assert detail.status_code == 200
        assert detail.json()["slug"] == first["slug"]

        comments = client.get(f"/api/experiences/{first['slug']}/comments")
        assert comments.status_code == 200
        assert isinstance(comments.json(), list)


def test_experience_writes_require_login_and_persist():
    with TestClient(app) as client:
        unauth_post = client.post(
            "/api/experiences",
            json={
                "title": "未登录帖子",
                "summary": "不应该成功",
                "body": "不应该成功",
                "channel": "实战教程",
                "boardSlug": "skill-community",
            },
        )
        assert unauth_post.status_code == 401

        register = _register(client)
        assert register.status_code == 201

        create = client.post(
            "/api/experiences",
            json={
                "title": "MCP 工具链实战复盘",
                "summary": "把 MCP 接入知识库和设计稿后，团队如何做权限分层。",
                "body": "先用只读能力接入资料，再逐步开放写入动作，每一步都保留回滚方案。",
                "channel": "工具组合",
                "boardSlug": "mcp-community",
                "scenario": "团队协作",
                "tools": ["MCP", "Codex"],
                "roles": ["前端", "产品"],
                "coverImageUrl": "/brand/logo.png",
                "imageUrls": ["/logos/阿里云百炼.png"],
            },
        )
        assert create.status_code == 201
        post_payload = create.json()
        assert post_payload["slug"] == "mcp"
        assert post_payload["author"]["username"] == "community-user"
        assert post_payload["coverImageUrl"] == "/brand/logo.png"

        comment = client.post(
            f"/api/experiences/{post_payload['slug']}/comments",
            json={"body": "这个权限分层可以直接放进团队模板。", "imageUrl": "/brand/logo.png"},
        )
        assert comment.status_code == 201
        assert comment.json()["author"]["username"] == "community-user"

        detail = client.get(f"/api/experiences/{post_payload['slug']}")
        assert detail.status_code == 200
        assert detail.json()["commentCount"] == 1

    with _TestSession() as db:
        post = db.scalar(select(ExperiencePost).where(ExperiencePost.slug == "mcp"))
        assert post is not None
        assert post.comment_count == 1
        assert db.scalar(select(ExperienceComment).where(ExperienceComment.post_id == post.id)) is not None


def test_chat_api_is_removed():
    with TestClient(app) as client:
        response = client.post("/api/chat", json={"messages": [{"role": "user", "content": "hello"}]})
        assert response.status_code == 404
