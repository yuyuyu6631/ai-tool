import os
from datetime import date

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

os.environ["DATABASE_URL"] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'test_demo_ai_search.db')}"

import app.db.session as session_mod  # noqa: E402
from app.db.session import Base, get_db  # noqa: E402
from app.main import create_app  # noqa: E402
from app.models.models import Category, Tag, Tool, ToolTag  # noqa: E402

app = create_app()

_TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_demo_ai_search.db")
_test_engine = create_engine(f"sqlite:///{_TEST_DB_PATH}", connect_args={"check_same_thread": False})
_TestSession = sessionmaker(bind=_test_engine, autoflush=False, autocommit=False, class_=Session)


def _add_tool(
    db: Session,
    *,
    slug: str,
    name: str,
    category_name: str,
    summary: str,
    description: str,
    tags: list[str],
    features_json: list[str],
    limitations_json: list[str],
    best_for_json: list[str],
    deal_summary: str = "",
    pricing_type: str = "freemium",
    access_flags: dict[str, bool | None] | None = None,
) -> None:
    tool = Tool(
        slug=slug,
        name=name,
        category_name=category_name,
        summary=summary,
        description=description,
        editor_comment="",
        official_url=f"https://example.com/{slug}",
        logo_path=None,
        logo_status="missing",
        logo_source="seed",
        score=8.8,
        review_count=8,
        status="published",
        featured=True,
        pricing_type=pricing_type,
        access_flags=access_flags or {"needs_vpn": False, "cn_lang": True, "cn_payment": True},
        free_allowance_text=deal_summary,
        features_json=features_json,
        limitations_json=limitations_json,
        best_for_json=best_for_json,
        deal_summary=deal_summary,
        created_on=date(2026, 4, 1),
        last_verified_at=date(2026, 4, 20),
    )
    db.add(tool)
    db.flush()

    for tag_name in tags:
        tag = db.query(Tag).filter(Tag.name == tag_name).first()
        if tag is None:
            tag = Tag(name=tag_name)
            db.add(tag)
            db.flush()
        db.add(ToolTag(tool_id=tool.id, tag_id=tag.id))


def setup_module():
    session_mod.SessionLocal = _TestSession
    Base.metadata.drop_all(bind=_test_engine)
    Base.metadata.create_all(bind=_test_engine)

    db = _TestSession()
    try:
        db.add_all(
            [
                Category(slug="writing", name="写作学术", description="论文、文档、润色"),
                Category(slug="office", name="办公演示", description="PPT、会议、表格"),
                Category(slug="coding", name="编程开发", description="代码、测试、debug"),
                Category(slug="design", name="图片视频", description="绘图、海报、视频"),
                Category(slug="data", name="数据分析", description="BI、SQL、报表"),
            ]
        )
        db.flush()
        _add_tool(
            db,
            slug="chatgpt",
            name="ChatGPT",
            category_name="写作学术",
            summary="通用 AI 助手，适合论文提纲、润色、总结和代码协作",
            description="覆盖写论文、文档润色、资料总结、代码解释等任务。",
            tags=["写作", "学术", "总结", "代码"],
            features_json=["中文写作和资料总结稳定", "可辅助代码解释和测试思路"],
            limitations_json=["正式论文引用需要人工核验"],
            best_for_json=["学生", "研究人员", "内容团队"],
            deal_summary="免费版可用于基础问答",
        )
        _add_tool(
            db,
            slug="gamma",
            name="Gamma",
            category_name="办公演示",
            summary="AI PPT 和演示文稿生成工具",
            description="适合答辩、汇报、路演、幻灯片初稿和页面设计。",
            tags=["PPT", "演示", "幻灯片", "设计"],
            features_json=["快速生成 PPT 初稿", "自动组织演示结构"],
            limitations_json=["高级导出和品牌模板需要付费"],
            best_for_json=["产品经理", "销售", "学生答辩"],
            deal_summary="免费版可生成基础演示文稿",
        )
        _add_tool(
            db,
            slug="cursor",
            name="Cursor",
            category_name="编程开发",
            summary="AI 原生代码编辑器",
            description="适合写代码、debug、测试、接口开发、前端和后端改造。",
            tags=["编程", "开发", "debug", "测试"],
            features_json=["可理解项目上下文", "适合代码重构和 bug 修复"],
            limitations_json=["复杂仓库仍需要人工 review"],
            best_for_json=["开发者", "技术团队"],
            deal_summary="提供试用额度",
        )
        _add_tool(
            db,
            slug="midjourney",
            name="Midjourney",
            category_name="图片视频",
            summary="高质量图片生成工具",
            description="适合生成图片、绘图、海报、封面和视觉创意探索。",
            tags=["生成图", "绘图", "海报", "图片"],
            features_json=["视觉质量高", "适合创意探索"],
            limitations_json=["中文文字和精确排版需要后期处理"],
            best_for_json=["设计师", "内容创作者"],
            deal_summary="主要为付费订阅",
            pricing_type="subscription",
        )
        _add_tool(
            db,
            slug="data-pilot",
            name="Data Pilot",
            category_name="数据分析",
            summary="BI、SQL、报表和可视化分析工作台",
            description="适合数据分析、SQL 查询、报表生成、仪表盘和可视化。",
            tags=["BI", "SQL", "报表", "可视化", "分析"],
            features_json=["适合生成分析报表", "支持 SQL 和指标拆解"],
            limitations_json=["真实业务口径需要数据团队确认"],
            best_for_json=["数据分析师", "运营团队"],
            deal_summary="企业版需联系销售",
            pricing_type="contact",
        )
        db.commit()
    finally:
        db.close()


def teardown_module():
    Base.metadata.drop_all(bind=_test_engine)
    _test_engine.dispose()
    if os.path.exists(_TEST_DB_PATH):
        os.remove(_TEST_DB_PATH)


def _override_db():
    db = _TestSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_db
client = TestClient(app)


def test_demo_keywords_return_reasonable_ranked_results_with_reasons():
    cases = [
        ("写论文", "chatgpt", "论文"),
        ("做PPT", "gamma", "PPT"),
        ("写代码", "cursor", "代码"),
        ("生成图片", "midjourney", "图片"),
        ("数据分析", "data-pilot", "数据"),
    ]

    for query, expected_slug, reason_keyword in cases:
        response = client.get("/api/ai-search", params={"q": query, "page_size": 5})
        assert response.status_code == 200
        payload = response.json()
        assert payload["directory"]["items"], query
        assert payload["directory"]["items"][0]["slug"] == expected_slug
        assert payload["directory"]["items"][0]["reason"]
        assert reason_keyword.lower() in payload["directory"]["items"][0]["reason"].lower()


def test_demo_search_can_prioritize_free_and_domestic_access():
    free_response = client.get("/api/ai-search", params={"q": "免费AI工具", "page_size": 5})
    assert free_response.status_code == 200
    free_items = free_response.json()["directory"]["items"]
    assert free_items
    assert free_items[0]["pricingType"] in {"free", "freemium"}
    assert "免费" in free_items[0]["reason"]

    domestic_response = client.get("/api/ai-search", params={"q": "国内能用的AI工具", "page_size": 5})
    assert domestic_response.status_code == 200
    domestic_items = domestic_response.json()["directory"]["items"]
    assert domestic_items
    assert domestic_items[0]["accessFlags"]["needsVpn"] is False
    assert "国内" in domestic_items[0]["reason"]
