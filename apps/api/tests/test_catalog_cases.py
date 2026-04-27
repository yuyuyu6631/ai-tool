import os
from datetime import date

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

os.environ["DATABASE_URL"] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'test_catalog_cases.db')}"

import app.services.catalog_service as catalog_svc  # noqa: E402
import app.db.session as session_mod  # noqa: E402
from app.db.session import Base, get_db  # noqa: E402
from app.main import create_app  # noqa: E402
from app.models.models import (  # noqa: E402
    Category,
    Ranking,
    RankingItem,
    Scenario,
    ScenarioTool,
    Tag,
    Tool,
    ToolEmbedding,
    ToolReview,
    ToolTag,
)
from app.services.embedding_service import build_tool_embedding_source, compute_content_hash, embed_text, serialize_embedding  # noqa: E402

app = create_app()

_TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_catalog_cases.db")
_test_engine = create_engine(
    f"sqlite:///{_TEST_DB_PATH}",
    connect_args={"check_same_thread": False},
)
_TestSession = sessionmaker(bind=_test_engine, autoflush=False, autocommit=False, class_=Session)
_ORIGINAL_SESSION_LOCAL = session_mod.SessionLocal


def _add_tool(
    db: Session,
    *,
    slug: str,
    name: str,
    category_name: str,
    summary: str,
    score: float,
    created_on: date,
    tags: list[str],
    description: str | None = None,
    status: str = "published",
    featured: bool = False,
    review_count: int = 0,
    access_flags: dict[str, bool | None] | None = None,
    pricing_type: str = "unknown",
    price_min_cny: int | None = None,
    price_max_cny: int | None = None,
    free_allowance_text: str = "",
    features_json: list[str] | None = None,
    limitations_json: list[str] | None = None,
    best_for_json: list[str] | None = None,
    deal_summary: str = "",
    media_items_json: list[dict] | None = None,
) -> Tool:
    tool = Tool(
        slug=slug,
        name=name,
        category_name=category_name,
        summary=summary,
        description=description or f"{name} description",
        editor_comment="",
        official_url=f"https://example.com/{slug}",
        logo_path=None,
        logo_status="missing",
        logo_source="imported",
        score=score,
        review_count=review_count,
        status=status,
        featured=featured,
        access_flags=access_flags,
        pricing_type=pricing_type,
        price_min_cny=price_min_cny,
        price_max_cny=price_max_cny,
        free_allowance_text=free_allowance_text,
        features_json=features_json,
        limitations_json=limitations_json,
        best_for_json=best_for_json,
        deal_summary=deal_summary,
        media_items_json=media_items_json,
        created_on=created_on,
        last_verified_at=created_on,
    )
    db.add(tool)
    db.flush()

    for tag_name in tags:
        tag = db.query(Tag).filter(Tag.name == tag_name).first()
        if not tag:
            tag = Tag(name=tag_name)
            db.add(tag)
            db.flush()
        db.add(ToolTag(tool_id=tool.id, tag_id=tag.id))

    return tool


def _upsert_tool_embedding(db: Session, tool: Tool) -> None:
    source_text = build_tool_embedding_source(tool)
    embedding = embed_text(source_text)
    row = db.query(ToolEmbedding).filter(ToolEmbedding.tool_id == tool.id).first()
    payload = serialize_embedding(embedding.vector)
    content_hash = compute_content_hash(source_text)

    if row is None:
        db.add(
            ToolEmbedding(
                tool_id=tool.id,
                provider=embedding.provider,
                model=embedding.model,
                content_hash=content_hash,
                source_text=source_text,
                embedding_json=payload,
            )
        )
        return

    row.provider = embedding.provider
    row.model = embedding.model
    row.content_hash = content_hash
    row.source_text = source_text
    row.embedding_json = payload


def setup_module():
    session_mod.SessionLocal = _TestSession
    Base.metadata.drop_all(bind=_test_engine)
    Base.metadata.create_all(bind=_test_engine)
    catalog_svc.SessionLocal = _TestSession

    db = _TestSession()
    try:
        db.add_all(
            [
                Category(slug="chatbot", name="Chatbot", description="Conversational AI"),
                Category(slug="office", name="Office", description="Office productivity"),
                Category(slug="empty", name="Empty", description="No published tools"),
            ]
        )
        db.flush()

        tools = [
            _add_tool(
                db,
                slug="chatgpt",
                name="ChatGPT",
                category_name="Chatbot",
                summary="featured chatbot for enterprise teams",
                score=9.8,
                created_on=date(2026, 3, 10),
                tags=["assistant", "workspace"],
                featured=True,
                review_count=8,
                access_flags={"needs_vpn": False, "cn_lang": True, "cn_payment": True},
                pricing_type="subscription",
                price_min_cny=145,
                price_max_cny=145,
                free_allowance_text="基础问答可免费体验，进阶能力需订阅。",
                features_json=["多模态问答稳定", "生态插件丰富"],
                limitations_json=["高级模型额度消耗快", "关键结论仍需人工复核"],
                best_for_json=["内容团队", "产品经理", "开发者"],
                deal_summary="免费版可先试，团队高频使用建议核算 Plus/Team 成本。",
                media_items_json=[
                    {
                        "type": "video",
                        "url": "https://example.com/chatgpt-demo.mp4",
                        "thumbnailUrl": "/media/chatgpt-cover.jpg",
                        "title": "3 分钟上手演示",
                        "sourceName": "星点评编辑部",
                        "sourceUrl": "https://example.com/source",
                    },
                    {"type": "video", "url": "javascript:alert(1)", "title": "invalid"},
                ],
            ),
            _add_tool(
                db,
                slug="claude",
                name="Claude",
                category_name="Chatbot",
                summary="analysis assistant",
                score=9.3,
                created_on=date(2026, 3, 9),
                tags=["assistant"],
                featured=True,
                access_flags={"needs_vpn": True, "cn_lang": False, "cn_payment": False},
                pricing_type="subscription",
                price_min_cny=145,
                price_max_cny=145,
            ),
            _add_tool(
                db,
                slug="gamma",
                name="Gamma",
                category_name="Office",
                summary="presentation builder",
                description="AI presentation builder for slides and storytelling",
                score=8.7,
                created_on=date(2026, 3, 8),
                tags=["slides"],
                review_count=6,
                access_flags={"needs_vpn": False, "cn_lang": True, "cn_payment": True},
                pricing_type="freemium",
                price_min_cny=39,
                price_max_cny=79,
                free_allowance_text="免费版可生成 10 份文稿",
            ),
            _add_tool(
                db,
                slug="data-pilot",
                name="Data Pilot",
                category_name="Office",
                summary="business intelligence workspace",
                description="Built for dashboard building, analytics workflows, and report generation teams.",
                score=8.4,
                created_on=date(2026, 3, 7),
                tags=["analytics", "report"],
                access_flags={"needs_vpn": False, "cn_lang": True, "cn_payment": True},
                pricing_type="subscription",
                price_min_cny=199,
                price_max_cny=199,
            ),
            _add_tool(
                db,
                slug="notion-ai",
                name="Notion AI",
                category_name="Office",
                summary="workspace writing tool",
                score=8.1,
                created_on=date(2026, 3, 7),
                tags=["writing"],
                access_flags={"needs_vpn": False, "cn_lang": True, "cn_payment": False},
                pricing_type="subscription",
                price_min_cny=68,
                price_max_cny=68,
            ),
            _add_tool(
                db,
                slug="free-writer",
                name="Free Writer",
                category_name="Office",
                summary="free writing helper",
                score=7.5,
                created_on=date(2026, 3, 6),
                tags=["free", "writing"],
                access_flags={"needs_vpn": False, "cn_lang": True, "cn_payment": True},
                pricing_type="free",
                free_allowance_text="永久免费",
            ),
            _add_tool(
                db,
                slug="office-bot",
                name="Office Bot",
                category_name="Office",
                summary="office automation assistant",
                score=7.1,
                created_on=date(2026, 3, 5),
                tags=["assistant"],
            ),
            _add_tool(
                db,
                slug="image-magic",
                name="Image Magic",
                category_name="Office",
                summary="image helper",
                score=6.8,
                created_on=date(2026, 3, 4),
                tags=["image"],
            ),
            _add_tool(
                db,
                slug="agent-hub",
                name="Agent Hub",
                category_name="Office",
                summary="agent workspace",
                score=6.1,
                created_on=date(2026, 3, 3),
                tags=["agent"],
            ),
            _add_tool(
                db,
                slug="meeting-note",
                name="Meeting Note",
                category_name="Office",
                summary="meeting notes",
                score=5.9,
                created_on=date(2026, 3, 2),
                tags=["writing"],
            ),
            _add_tool(
                db,
                slug="zeta-flow",
                name="Zeta Flow",
                category_name="Office",
                summary="workflow builder",
                score=5.7,
                created_on=date(2026, 3, 1),
                tags=["workflow"],
            ),
            _add_tool(
                db,
                slug="draft-tool",
                name="Draft Tool",
                category_name="Chatbot",
                summary="draft chatbot",
                score=3.0,
                created_on=date(2026, 2, 28),
                tags=["assistant"],
                status="draft",
            ),
            _add_tool(
                db,
                slug="archived-tool",
                name="Archived Tool",
                category_name="Office",
                summary="archived office tool",
                score=2.0,
                created_on=date(2026, 2, 27),
                tags=["legacy"],
                status="archived",
            ),
        ]

        top100 = Ranking(slug="top100", title="Top 100", description="Main ranking")
        empty_ranking = Ranking(slug="empty-ranking", title="Empty Ranking", description="No published items")
        db.add_all([top100, empty_ranking])
        db.flush()
        db.add_all(
            [
                RankingItem(ranking_id=top100.id, tool_id=tools[0].id, rank_order=1, reason="best"),
                RankingItem(ranking_id=top100.id, tool_id=tools[11].id, rank_order=2, reason="draft"),
                RankingItem(ranking_id=top100.id, tool_id=tools[2].id, rank_order=3, reason="strong"),
                RankingItem(ranking_id=empty_ranking.id, tool_id=tools[11].id, rank_order=1, reason="draft"),
            ]
        )

        writing = Scenario(
            slug="writing",
            title="Writing",
            description="Writing tasks",
            problem="Need drafting help",
            tool_count=0,
        )
        empty_scenario = Scenario(
            slug="empty-scenario",
            title="Empty Scenario",
            description="No published tools",
            problem="No usable tools",
            tool_count=0,
        )
        db.add_all([writing, empty_scenario])
        db.flush()
        db.add_all(
            [
                ScenarioTool(scenario_id=writing.id, tool_id=tools[0].id, is_primary=True),
                ScenarioTool(scenario_id=writing.id, tool_id=tools[2].id, is_primary=False),
                ScenarioTool(scenario_id=writing.id, tool_id=tools[11].id, is_primary=False),
                ScenarioTool(scenario_id=empty_scenario.id, tool_id=tools[11].id, is_primary=True),
            ]
        )

        for tool in tools:
            if tool.slug in {"gamma", "data-pilot", "notion-ai"}:
                _upsert_tool_embedding(db, tool)

        db.add_all(
            [
                ToolReview(
                    tool_id=tools[0].id,
                    source_type="editor",
                    status="published",
                    rating=9.4,
                    title="编辑结论",
                    body="适合先上手，再决定是否长期使用。",
                    pitfalls_json=["高级团队协作仍需自行补充流程"],
                    pros_json=["上手快", "无需翻墙"],
                    cons_json=["深度定制有限"],
                    audience="内容团队",
                    task="快速起草与问答",
                ),
                ToolReview(
                    tool_id=tools[0].id,
                    source_type="user",
                    status="published",
                    rating=8.8,
                    title="资深用户反馈",
                    body="适合高频通用任务，但复杂流程最好配合其他工具。",
                    pitfalls_json=["复杂工作流需要二次编排"],
                    pros_json=["免费可用"],
                    cons_json=["复杂场景需要复核"],
                    audience="独立开发者",
                    task="高频日常生产",
                ),
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


def test_tools_directory_default_response_shape_and_visibility():
    response = client.get("/api/tools")

    assert response.status_code == 200
    payload = response.json()
    assert set(payload) == {
        "items",
        "total",
        "page",
        "pageSize",
        "hasMore",
        "categories",
        "tags",
        "statuses",
        "priceFacets",
        "accessFacets",
        "priceRangeFacets",
        "presets",
    }
    assert payload["page"] == 1
    assert payload["pageSize"] == 9
    assert payload["total"] == 11
    assert len(payload["items"]) == 9
    assert payload["hasMore"] is True
    assert {item["slug"] for item in payload["items"]}.isdisjoint({"draft-tool", "archived-tool"})
    first = payload["items"][0]
    assert "reviewCount" in first
    assert "accessFlags" in first
    assert "pricingType" in first
    assert "features" in first
    assert "limitations" in first
    assert "bestFor" in first
    assert "dealSummary" in first
    assert "primaryMedia" in first


def test_tools_directory_exposes_structured_product_elements_and_sanitized_primary_media():
    response = client.get("/api/tools?q=ChatGPT&page_size=24")

    assert response.status_code == 200
    item = response.json()["items"][0]
    assert item["slug"] == "chatgpt"
    assert item["features"] == ["多模态问答稳定", "生态插件丰富"]
    assert item["limitations"] == ["高级模型额度消耗快", "关键结论仍需人工复核"]
    assert item["bestFor"] == ["内容团队", "产品经理", "开发者"]
    assert item["dealSummary"] == "免费版可先试，团队高频使用建议核算 Plus/Team 成本。"
    assert item["primaryMedia"] == {
        "type": "video",
        "url": "https://example.com/chatgpt-demo.mp4",
        "thumbnailUrl": "/media/chatgpt-cover.jpg",
        "title": "3 分钟上手演示",
        "sourceName": "星点评编辑部",
        "sourceUrl": "https://example.com/source",
    }


def test_tools_directory_page_two_returns_only_second_page_slice():
    response = client.get("/api/tools?page=2&page_size=9")

    assert response.status_code == 200
    payload = response.json()
    assert payload["page"] == 2
    assert payload["total"] == 11
    assert payload["hasMore"] is False
    assert [item["slug"] for item in payload["items"]] == ["meeting-note", "zeta-flow"]


def test_tools_directory_supports_combined_filters_and_facets():
    response = client.get("/api/tools?q=ChatGPT&category=chatbot&tag=assistant&price=subscription")

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert [item["slug"] for item in payload["items"]] == ["chatgpt"]
    assert payload["categories"][0] == {"slug": "chatbot", "label": "Chatbot", "count": 1}
    assert payload["tags"][0] == {"slug": "assistant", "label": "assistant", "count": 1}
    statuses = {item["slug"]: item["count"] for item in payload["statuses"]}
    assert statuses == {"all": 1, "published": 1}
    assert payload["priceFacets"] == [{"slug": "subscription", "label": "订阅", "count": 1}]
    assert payload["accessFacets"] == [
        {"slug": "cn-lang", "label": "中文界面", "count": 1},
        {"slug": "cn-payment", "label": "支持国内支付", "count": 1},
        {"slug": "no-vpn", "label": "国内直连", "count": 1},
    ]


def test_tools_directory_empty_query_matches_default_behavior():
    default_response = client.get("/api/tools?page_size=24")
    empty_response = client.get("/api/tools?q=&page_size=24")

    assert default_response.status_code == 200
    assert empty_response.status_code == 200
    assert default_response.json()["total"] == empty_response.json()["total"]
    assert [item["slug"] for item in default_response.json()["items"]] == [
        item["slug"] for item in empty_response.json()["items"]
    ]


def test_tools_directory_lexical_query_hit_still_works():
    response = client.get("/api/tools?q=ChatGPT")

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] >= 1
    assert payload["items"][0]["slug"] == "chatgpt"


def test_tools_directory_embedding_recall_hits_when_lexical_misses():
    response = client.get("/api/tools?q=幻灯片&page_size=24")

    assert response.status_code == 200
    payload = response.json()
    assert "gamma" in [item["slug"] for item in payload["items"]]


def test_tools_directory_missing_embedding_falls_back_to_legacy_lexical_search():
    db = _TestSession()
    try:
        db.query(ToolEmbedding).delete()
        db.commit()
    finally:
        db.close()

    response = client.get("/api/tools?q=ChatGPT&page_size=24")

    assert response.status_code == 200
    payload = response.json()
    assert "chatgpt" in [item["slug"] for item in payload["items"]]


def test_tools_directory_status_all_includes_non_published_rows():
    response = client.get("/api/tools?status=all&page_size=24")

    assert response.status_code == 200
    payload = response.json()
    slugs = {item["slug"] for item in payload["items"]}
    assert "draft-tool" in slugs
    assert "archived-tool" in slugs
    statuses = {item["slug"]: item["count"] for item in payload["statuses"]}
    assert statuses == {"all": 13, "published": 11, "draft": 1, "archived": 1}


def test_tools_directory_latest_and_name_sorting():
    latest_response = client.get("/api/tools?view=latest&page_size=3")
    name_response = client.get("/api/tools?sort=name&page_size=3")

    assert latest_response.status_code == 200
    assert [item["slug"] for item in latest_response.json()["items"]] == ["chatgpt", "claude", "gamma"]
    assert name_response.status_code == 200
    assert [item["slug"] for item in name_response.json()["items"]] == ["agent-hub", "chatgpt", "claude"]


def test_tools_directory_task_query_matches_data_tools():
    response = client.get("/api/tools?q=做数据")

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] >= 1
    assert "data-pilot" in [item["slug"] for item in payload["items"]]


def test_tools_directory_task_query_matches_writing_tools():
    response = client.get("/api/tools?q=写文案")

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] >= 1
    assert {"notion-ai", "free-writer", "meeting-note"}.intersection({item["slug"] for item in payload["items"]})


def test_tools_directory_supports_access_and_price_range_filters():
    response = client.get("/api/tools?access=no-vpn,cn-lang&price_range=free&page_size=24")

    assert response.status_code == 200
    payload = response.json()
    slugs = {item["slug"] for item in payload["items"]}
    assert {"free-writer"}.issubset(slugs)
    assert "chatgpt" not in slugs
    assert "claude" not in slugs


def test_categories_hide_empty_by_default_and_can_include_empty():
    hidden_response = client.get("/api/categories")
    full_response = client.get("/api/categories?include_empty=true")

    assert hidden_response.status_code == 200
    assert full_response.status_code == 200
    assert [item["slug"] for item in hidden_response.json()] == ["office", "chatbot"]
    assert [item["slug"] for item in full_response.json()] == ["office", "chatbot", "empty"]
    assert hidden_response.json()[0]["toolCount"] == 9
    assert hidden_response.json()[1]["toolCount"] == 2
    assert hidden_response.json()[1]["legacySlugs"] == ["ai-chat", "general-assistants"]


def test_category_tools_only_return_published_tools():
    response = client.get("/api/categories/chatbot/tools")

    assert response.status_code == 200
    assert [item["slug"] for item in response.json()] == ["chatgpt", "claude"]
    assert response.json()[0]["categorySlug"] == "chatbot"


def test_category_tools_accept_legacy_slug_aliases():
    response = client.get("/api/categories/general-assistants/tools")

    assert response.status_code == 200
    assert [item["slug"] for item in response.json()] == ["chatgpt", "claude"]


def test_home_catalog_only_returns_governed_sections():
    response = client.get("/api/home")

    assert response.status_code == 200
    payload = response.json()
    assert payload["hotTools"]
    assert payload["latestTools"]
    assert [item["label"] for item in payload["sidebarCategories"]] == ["Chatbot", "Office"]
    assert payload["sidebarCategories"][0]["navigationType"] == "route"
    assert payload["sidebarCategories"][0]["href"] == "/tools?mode=search&category=chatbot&page=1"
    assert payload["categorySections"][0]["browseCategorySlug"] == "office"


def test_rankings_hide_empty_rankings_and_unpublished_items():
    list_response = client.get("/api/rankings")
    detail_response = client.get("/api/rankings/top100")
    empty_response = client.get("/api/rankings/empty-ranking")

    assert list_response.status_code == 200
    assert [item["slug"] for item in list_response.json()] == ["top100"]
    assert detail_response.status_code == 200
    assert [item["tool"]["slug"] for item in detail_response.json()["items"]] == ["chatgpt", "gamma"]
    assert empty_response.status_code == 404


def test_scenarios_hide_empty_scenarios_and_unpublished_items():
    list_response = client.get("/api/scenarios")
    detail_response = client.get("/api/scenarios/writing")
    empty_response = client.get("/api/scenarios/empty-scenario")

    assert list_response.status_code == 200
    assert [item["slug"] for item in list_response.json()] == ["writing"]
    assert detail_response.status_code == 200
    payload = detail_response.json()
    assert payload["toolCount"] == 2
    assert [item["slug"] for item in payload["primaryTools"]] == ["chatgpt"]
    assert [item["slug"] for item in payload["alternativeTools"]] == ["gamma"]
    assert empty_response.status_code == 404


def test_tool_detail_missing_slug_returns_404():
    response = client.get("/api/tools/not-exists")

    assert response.status_code == 404
    assert response.json()["detail"] == "Tool not found"


def test_tool_detail_aggregates_review_content():
    response = client.get("/api/tools/chatgpt")

    assert response.status_code == 200
    payload = response.json()
    assert payload["reviewCount"] == 8
    assert payload["pitfalls"] == ["高级团队协作仍需自行补充流程", "复杂工作流需要二次编排"]
    assert payload["targetAudience"] == ["内容团队", "独立开发者"]
    assert payload["scenarioRecommendations"] == [
        {"audience": "内容团队", "task": "快速起草与问答", "summary": "适合先上手，再决定是否长期使用。"},
        {"audience": "独立开发者", "task": "高频日常生产", "summary": "适合高频通用任务，但复杂流程最好配合其他工具。"},
    ]
    assert payload["features"] == ["多模态问答稳定", "生态插件丰富"]
    assert payload["limitations"] == ["高级模型额度消耗快", "关键结论仍需人工复核"]
    assert payload["bestFor"] == ["内容团队", "产品经理", "开发者"]
    assert payload["dealSummary"] == "免费版可先试，团队高频使用建议核算 Plus/Team 成本。"
    assert payload["mediaItems"] == [
        {
            "type": "video",
            "url": "https://example.com/chatgpt-demo.mp4",
            "thumbnailUrl": "/media/chatgpt-cover.jpg",
            "title": "3 分钟上手演示",
            "sourceName": "星点评编辑部",
            "sourceUrl": "https://example.com/source",
        }
    ]
    assert len(payload["reviewPreview"]) == 2


def _restore_selected_embeddings(*slugs: str) -> None:
    db = _TestSession()
    try:
        tools = db.query(Tool).filter(Tool.slug.in_(slugs)).all()
        for tool in tools:
            _upsert_tool_embedding(db, tool)
        db.commit()
    finally:
        db.close()


def test_tools_directory_acceptance_writing_assistant_returns_writing_tools():
    _restore_selected_embeddings("notion-ai")
    response = client.get("/api/tools?q=\u5199\u4f5c\u52a9\u624b&page_size=24")

    assert response.status_code == 200
    payload = response.json()
    slugs = {item["slug"] for item in payload["items"]}
    assert "notion-ai" in slugs
    assert slugs.intersection({"notion-ai", "free-writer", "meeting-note"})


def test_tools_directory_acceptance_semantic_query_returns_gamma():
    _restore_selected_embeddings("gamma")
    response = client.get("/api/tools?q=\u5e7b\u706f\u7247&page_size=24")

    assert response.status_code == 200
    payload = response.json()
    assert "gamma" in [item["slug"] for item in payload["items"]]


def test_tools_directory_missing_partial_embeddings_still_falls_back_to_legacy_lexical_search():
    db = _TestSession()
    try:
        db.query(ToolEmbedding).filter(ToolEmbedding.tool_id == 3).delete()
        db.commit()
    finally:
        db.close()

    response = client.get("/api/tools?q=ChatGPT&page_size=24")

    assert response.status_code == 200
    payload = response.json()
    assert "chatgpt" in [item["slug"] for item in payload["items"]]


def test_tools_directory_embedding_recall_exception_still_returns_lexical_results(monkeypatch):
    monkeypatch.setattr(catalog_svc, "recall_tool_ids_by_embedding", lambda **kwargs: (_ for _ in ()).throw(TimeoutError("boom")))

    response = client.get("/api/tools?q=ChatGPT&page_size=24")

    assert response.status_code == 200
    payload = response.json()
    assert "chatgpt" in [item["slug"] for item in payload["items"]]
