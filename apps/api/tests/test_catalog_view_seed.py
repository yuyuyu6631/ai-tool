import os
from datetime import date, timedelta

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

os.environ["DATABASE_URL"] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'test_catalog_view_seed.db')}"
os.environ.setdefault("AI_PROVIDER", "stub")
os.environ.setdefault("AI_API_KEY", "")

import app.services.catalog_service as catalog_svc  # noqa: E402
import app.db.session as session_mod  # noqa: E402
from app.db.session import Base, get_db  # noqa: E402
from app.main import create_app  # noqa: E402
from app.models.models import Ranking, RankingItem, Scenario, ScenarioTool, Tool  # noqa: E402
from app.services.catalog_views_seed import seed_catalog_views  # noqa: E402


app = create_app()

_TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_catalog_view_seed.db")
_test_engine = create_engine(
    f"sqlite:///{_TEST_DB_PATH}",
    connect_args={"check_same_thread": False},
)
_TestSession = sessionmaker(bind=_test_engine, autoflush=False, autocommit=False, class_=Session)
_ORIGINAL_SESSION_LOCAL = session_mod.SessionLocal


def _override_get_db():
    db = _TestSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db
client = TestClient(app)


def _add_tool(
    db: Session,
    *,
    slug: str,
    name: str,
    category_name: str,
    summary: str,
    description: str,
    score: float,
    created_on: date,
    featured: bool,
) -> None:
    db.add(
        Tool(
            slug=slug,
            name=name,
            category_name=category_name,
            summary=summary,
            description=description,
            editor_comment="",
            official_url=f"https://example.com/{slug}",
            logo_path=None,
            logo_status="missing",
            logo_source="imported",
            score=score,
            status="published",
            featured=featured,
            created_on=created_on,
            last_verified_at=created_on,
        )
    )


def _seed_category_tools(db: Session) -> None:
    base_date = date(2026, 4, 1)
    category_specs = [
        ("AI聊天助手", "chat", "chat assistant 问答 对话 copilot"),
        ("AI写作", "writing", "文案 写作 copy marketing content"),
        ("AI文档办公", "office", "workspace docs 邮件 文档 协作"),
        ("AI PPT制作", "ppt", "ppt slides presentation 演示 提案"),
        ("AI代码编程", "coding", "coding developer debug refactor code"),
        ("AI 图像", "image", "image poster visual design banner"),
        ("AI 视频", "video", "video clip shorts 剪辑 动画"),
        ("AI 智能体", "agent", "agent workflow automation 智能体 工作流"),
        ("AI 音频·音乐", "audio", "audio voice music 配音"),
        ("AI记录摘要", "meeting", "meeting summary notes transcript 纪要"),
        ("AI数据分析", "data", "data analytics dashboard report bi 报表"),
    ]

    for category_name, prefix, keywords in category_specs:
        for index in range(12):
            slug = f"{prefix}-{index + 1}"
            _add_tool(
                db,
                slug=slug,
                name=f"{category_name}工具{index + 1}",
                category_name=category_name,
                summary=f"{keywords} 工具 {index + 1}",
                description=f"{category_name} 场景下的 {keywords} 工具 {index + 1}",
                score=9.8 - (index * 0.1),
                created_on=base_date - timedelta(days=index),
                featured=index < 3,
            )


def setup_module():
    session_mod.SessionLocal = _TestSession
    Base.metadata.drop_all(bind=_test_engine)
    Base.metadata.create_all(bind=_test_engine)
    catalog_svc.SessionLocal = _TestSession
    app.dependency_overrides[get_db] = _override_get_db

    db = _TestSession()
    try:
        _seed_category_tools(db)
        db.flush()
        seed_catalog_views(db)
        db.commit()
    finally:
        db.close()


def teardown_module():
    app.dependency_overrides.clear()
    session_mod.SessionLocal = _ORIGINAL_SESSION_LOCAL
    Base.metadata.drop_all(bind=_test_engine)
    try:
        if os.path.exists(_TEST_DB_PATH):
            os.remove(_TEST_DB_PATH)
    except PermissionError:
        pass


def test_seed_catalog_views_populates_rankings_and_scenarios():
    db = _TestSession()
    try:
        assert db.query(Ranking).count() == 8
        assert db.query(Scenario).count() == 10
        assert db.query(RankingItem).count() == 8 * 12
        assert db.query(ScenarioTool).count() == 10 * 5

        rankings = catalog_svc.list_rankings(db=db)
        scenarios = catalog_svc.list_scenarios(db=db)

        assert [item.slug for item in rankings] == [
            "top-chat",
            "top-writing",
            "top-ppt",
            "top-coding",
            "top-image",
            "top-video",
            "top-agent",
            "top-data",
        ]
        assert len(rankings) == 8
        assert all(len(section.items) == 12 for section in rankings)
        assert rankings[0].items[0].reason == "适合AI聊天助手场景，综合表现靠前"

        assert [item.slug for item in scenarios] == [
            "make-ppt",
            "write-copy",
            "write-email-doc",
            "code-dev",
            "debug-refactor",
            "make-poster",
            "make-video",
            "meeting-summary",
            "data-analysis",
            "build-agent",
        ]
        assert len(scenarios) == 10
        assert all(1 <= item.toolCount <= 5 for item in scenarios)
        assert all(1 <= len(item.primaryTools) <= 3 for item in scenarios)
        assert all(len(item.alternativeTools) <= 2 for item in scenarios)
        assert all(item.targetAudience for item in scenarios)
    finally:
        db.close()


def test_seed_catalog_views_is_idempotent():
    db = _TestSession()
    try:
        seed_catalog_views(db)
        db.commit()

        assert db.query(Ranking).count() == 8
        assert db.query(Scenario).count() == 10
        assert db.query(RankingItem).count() == 8 * 12
        assert db.query(ScenarioTool).count() == 10 * 5
    finally:
        db.close()


def test_rankings_and_scenarios_endpoints_return_filled_sections():
    rankings_response = client.get("/api/rankings")
    scenarios_response = client.get("/api/scenarios")
    scenario_detail_response = client.get("/api/scenarios/data-analysis")

    assert rankings_response.status_code == 200
    assert scenarios_response.status_code == 200
    assert scenario_detail_response.status_code == 200

    rankings_payload = rankings_response.json()
    scenarios_payload = scenarios_response.json()
    scenario_detail = scenario_detail_response.json()

    assert len(rankings_payload) == 8
    assert all(len(section["items"]) == 12 for section in rankings_payload)
    assert len(scenarios_payload) == 10
    assert scenario_detail["toolCount"] == 5
    assert len(scenario_detail["primaryTools"]) == 3
    assert len(scenario_detail["alternativeTools"]) == 2
    assert scenario_detail["targetAudience"] == ["运营", "分析师", "产品经理", "业务负责人"]
