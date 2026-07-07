import time

from app.schemas.ai_search import AiSearchResult
from app.schemas.catalog import ToolsDirectoryResponse
from app.schemas.tool import AccessFlags
from app.services import ai_search_service
from app.services.ai_search_service import _build_agent_recommendation


def _result(slug: str, name: str, *, reason: str | None = None) -> AiSearchResult:
    return AiSearchResult(
        id=1,
        slug=slug,
        name=name,
        category="AI 办公",
        categorySlug="office",
        score=8.8,
        summary="适合把真实任务拆成可执行步骤。",
        tags=["办公", "写作"],
        officialUrl=f"https://example.com/{slug}",
        logoPath=None,
        logoStatus="missing",
        logoSource="seed",
        status="published",
        featured=True,
        createdAt="2026-04-01",
        price="",
        reviewCount=8,
        accessFlags=AccessFlags(needsVpn=False, cnLang=True, cnPayment=True),
        pricingType="freemium",
        freeAllowanceText="免费版可用于基础试用",
        features=["生成任务流程"],
        limitations=["复杂格式仍需人工核验"],
        bestFor=["论文排版"],
        dealSummary="免费版可试用",
        primaryMedia=None,
        reason=reason,
    )


def test_agent_recommendation_has_decision_complete_pipeline():
    results = [
        _result("chatgpt", "ChatGPT", reason="适合先梳理论文格式问题"),
        _result("wps-ai", "WPS AI", reason="适合在文档里执行排版调整"),
    ]

    agent = _build_agent_recommendation(
        query="我要把 Word 文档自动排版成论文格式",
        normalized_query="论文 academic-writing 文档 排版",
        intent_payload={
            "intent_summary": "用户希望处理论文格式",
            "task": "academic-writing",
            "constraints": {"pricing": "free_preferred", "language": "zh_preferred"},
        },
        constraints={"pricing": "free_preferred", "language": "zh_preferred"},
        task="academic-writing",
        results=results,
        ranked_items=results,
    )

    assert agent.confidence in {"high", "medium", "low"}
    assert agent.intent.task == "论文与文档处理"
    assert "免费或低成本优先" in agent.intent.constraints
    assert [step.id for step in agent.trace] == ["intent", "scene", "recall", "verify", "recommend"]
    assert len(agent.toolPlan) == 2
    assert agent.toolPlan[0].role == "主推荐"
    assert agent.toolPlan[0].fit_reason == "适合先梳理论文格式问题"
    assert agent.toolPlan[0].free_signal
    assert agent.toolPlan[0].limitation_risk
    assert agent.toolPlan[0].next_step


def test_ai_search_uses_configured_candidate_limit(monkeypatch):
    calls: list[dict] = []
    tool = _result("gamma", "Gamma", reason="适合快速生成演示初稿")
    directory = ToolsDirectoryResponse(
        items=[tool],
        total=1,
        page=1,
        pageSize=72,
        hasMore=False,
        categories=[],
        tags=[],
        statuses=[],
        priceFacets=[],
        accessFacets=[],
        priceRangeFacets=[],
        presets=[],
        meta=None,
    )

    def fake_directory(**kwargs):
        calls.append(kwargs)
        return directory

    monkeypatch.setattr(ai_search_service.settings, "ai_search_candidate_limit", 72)
    monkeypatch.setattr(ai_search_service.catalog_service, "get_tools_directory", fake_directory)
    monkeypatch.setattr(
        ai_search_service,
        "parse_ai_search_intent",
        lambda query, normalized_query: (
            {"intent_summary": "PPT 搜索", "task": "presentation", "constraints": {}, "quick_actions": []},
            "fallback",
            False,
        ),
    )
    monkeypatch.setattr(ai_search_service, "apply_match_plan_boost", lambda db, query, scenario, tags, items: (items, {}))

    response = ai_search_service.search_with_ai(
        db=object(),
        query="做PPT",
        category=None,
        tag=None,
        price=None,
        access=None,
        price_range=None,
        sort="featured",
        view="hot",
        page=1,
        page_size=24,
    )

    assert response.directory.items[0].slug == "gamma"
    assert calls[0]["page"] == 1
    assert calls[0]["page_size"] == 72


def test_stub_provider_skips_llm_intent_parser(monkeypatch):
    monkeypatch.setattr(ai_search_service, "get_redis_client", lambda: None)
    monkeypatch.setattr(ai_search_service, "_intent_llm_retry_after", 0.0)
    monkeypatch.setattr(ai_search_service.settings, "ai_provider", "stub")
    monkeypatch.setattr(ai_search_service.settings, "ai_api_key", "test-key")
    monkeypatch.setattr(ai_search_service.settings, "ai_model", "test-model")
    monkeypatch.setattr(ai_search_service.settings, "ai_openai_base_url", "https://example.invalid/v1")
    monkeypatch.setattr(
        ai_search_service,
        "_call_intent_llm",
        lambda query, normalized_query: (_ for _ in ()).throw(AssertionError("LLM should not be called")),
    )

    payload, source, cache_hit = ai_search_service.parse_ai_search_intent("做PPT", "presentation ppt")

    assert payload["task"] == "presentation"
    assert source == "fallback"
    assert cache_hit is False


def test_ai_search_timeout_does_not_wait_for_slow_intent_thread(monkeypatch):
    tool = _result("gamma", "Gamma", reason="适合快速生成演示初稿")
    directory = ToolsDirectoryResponse(
        items=[tool],
        total=1,
        page=1,
        pageSize=24,
        hasMore=False,
        categories=[],
        tags=[],
        statuses=[],
        priceFacets=[],
        accessFacets=[],
        priceRangeFacets=[],
        presets=[],
        meta=None,
    )

    def slow_intent(query: str, normalized_query: str):
        time.sleep(0.4)
        return {"intent_summary": "慢解析", "task": "presentation", "constraints": {}, "quick_actions": []}, "llm", False

    monkeypatch.setattr(ai_search_service.settings, "ai_search_intent_timeout_seconds", 0.05)
    monkeypatch.setattr(ai_search_service.settings, "ai_search_intent_failure_cooldown_seconds", 1.0)
    monkeypatch.setattr(ai_search_service.catalog_service, "get_tools_directory", lambda **kwargs: directory)
    monkeypatch.setattr(ai_search_service, "parse_ai_search_intent", slow_intent)
    monkeypatch.setattr(ai_search_service, "apply_match_plan_boost", lambda db, query, scenario, tags, items: (items, {}))

    started_at = time.perf_counter()
    response = ai_search_service.search_with_ai(
        db=object(),
        query="做PPT",
        category=None,
        tag=None,
        price=None,
        access=None,
        price_range=None,
        sort="featured",
        view="hot",
        page=1,
        page_size=24,
    )
    elapsed = time.perf_counter() - started_at

    assert response.meta.intent_source == "fallback"
    assert response.directory.items[0].slug == "gamma"
    assert elapsed < 0.3
