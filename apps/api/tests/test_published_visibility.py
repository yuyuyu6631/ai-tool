import os

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

os.environ["DATABASE_URL"] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'test_acceptance_visibility.db')}"
os.environ.setdefault("AI_PROVIDER", "stub")
os.environ.setdefault("AI_API_KEY", "")

import app.services.catalog_service as catalog_svc  # noqa: E402
import app.db.session as session_mod  # noqa: E402
from app.db.session import Base, get_db  # noqa: E402
from app.main import create_app  # noqa: E402
from app.models import models  # noqa: E402, F401
from app.models.models import Category, Ranking, RankingItem, Tool  # noqa: E402
from app.services.seed_data import CATEGORIES, TOOLS  # noqa: E402

app = create_app()

_TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_acceptance_visibility.db")
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
    catalog_svc.SessionLocal = _TestSession

    db = _TestSession()
    try:
        for cat in CATEGORIES:
            if not db.query(Category).filter(Category.slug == cat.slug).first():
                db.add(Category(slug=cat.slug, name=cat.name, description=cat.description))

        for tool in TOOLS:
            if not db.query(Tool).filter(Tool.slug == tool.slug).first():
                db.add(
                    Tool(
                        slug=tool.slug,
                        name=tool.name,
                        category_name=tool.category,
                        summary=tool.summary,
                        description=tool.description,
                        editor_comment=tool.editorComment,
                        official_url=tool.officialUrl,
                        logo_path=getattr(tool, "logoPath", None),
                        logo_status=getattr(tool, "logoStatus", "matched" if getattr(tool, "logoPath", None) else "missing"),
                        logo_source=getattr(tool, "logoSource", "fallback"),
                        score=tool.score,
                        status=tool.status,
                        featured=tool.featured,
                        created_on=tool.createdAt,
                        last_verified_at=tool.lastVerifiedAt,
                    )
                )

        if not db.query(Tool).filter(Tool.slug == "draft-only-tool").first():
            db.add(
                Tool(
                    slug="draft-only-tool",
                    name="Draft Only Tool",
                    category_name="閫氱敤鍔╂墜",
                    summary="draft but visible",
                    description="hidden",
                    editor_comment="hidden",
                    official_url="https://example.com/draft",
                    logo_path=None,
                    logo_status="missing",
                    logo_source="imported",
                    score=1,
                    status="draft",
                    featured=False,
                    created_on=TOOLS[0].createdAt,
                    last_verified_at=TOOLS[0].lastVerifiedAt,
                )
            )

        if not db.query(Tool).filter(Tool.slug == "archived-tool").first():
            db.add(
                Tool(
                    slug="archived-tool",
                    name="Archived Tool",
                    category_name="閫氱敤鍔╂墜",
                    summary="archived but visible",
                    description="archived",
                    editor_comment="archived",
                    official_url="https://example.com/archived",
                    logo_path=None,
                    logo_status="missing",
                    logo_source="imported",
                    score=1,
                    status="archived",
                    featured=False,
                    created_on=TOOLS[0].createdAt,
                    last_verified_at=TOOLS[0].lastVerifiedAt,
                )
            )

        ranking = db.query(Ranking).filter(Ranking.slug == "mixed-status").first()
        if not ranking:
            ranking = Ranking(slug="mixed-status", title="Mixed Status", description="status visibility check")
            db.add(ranking)
            db.flush()
            published_tool = db.query(Tool).filter(Tool.slug == TOOLS[0].slug).first()
            db.add_all(
                [
                    RankingItem(ranking_id=ranking.id, tool_id=published_tool.id, rank_order=1, reason="published"),
                    RankingItem(ranking_id=ranking.id, tool_id=db.query(Tool).filter(Tool.slug == "draft-only-tool").first().id, rank_order=1, reason="draft"),
                    RankingItem(ranking_id=ranking.id, tool_id=db.query(Tool).filter(Tool.slug == "archived-tool").first().id, rank_order=2, reason="archived"),
                ]
            )

        db.commit()
    finally:
        db.close()


def teardown_module():
    session_mod.SessionLocal = _ORIGINAL_SESSION_LOCAL
    Base.metadata.drop_all(bind=_test_engine)
    try:
        if os.path.exists(_TEST_DB_PATH):
            os.remove(_TEST_DB_PATH)
    except PermissionError:
        pass


def _override_get_db():
    db = _TestSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db
client = TestClient(app)


def test_tools_directory_defaults_to_published_rows():
    resp = client.get("/api/tools")
    assert resp.status_code == 200
    payload = resp.json()
    slugs = {item["slug"] for item in payload["items"]}
    assert "draft-only-tool" not in slugs
    assert "archived-tool" not in slugs


def test_tools_directory_can_include_all_rows():
    resp = client.get("/api/tools?status=all")
    assert resp.status_code == 200
    payload = resp.json()
    slugs = {item["slug"] for item in payload["items"]}
    assert "draft-only-tool" in slugs
    assert "archived-tool" in slugs


def test_tool_detail_returns_200_for_draft_rows():
    resp = client.get("/api/tools/draft-only-tool")
    assert resp.status_code == 200
    assert resp.json()["status"] == "draft"


def test_tool_detail_returns_200_for_archived_rows():
    resp = client.get("/api/tools/archived-tool")
    assert resp.status_code == 200
    assert resp.json()["status"] == "archived"


def test_status_filter_returns_only_requested_status():
    resp = client.get("/api/tools?status=draft")
    assert resp.status_code == 200
    payload = resp.json()
    assert payload["items"]
    assert all(item["status"] == "draft" for item in payload["items"])


def test_rankings_only_include_published_tools():
    resp = client.get("/api/rankings")
    assert resp.status_code == 200
    rankings = resp.json()
    mixed = next(item for item in rankings if item["slug"] == "mixed-status")
    returned = {item["tool"]["slug"] for item in mixed["items"]}
    assert TOOLS[0].slug in returned
    assert "draft-only-tool" not in returned
    assert "archived-tool" not in returned
