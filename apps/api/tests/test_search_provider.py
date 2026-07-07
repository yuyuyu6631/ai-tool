from __future__ import annotations

from datetime import date

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.session import Base
from app.models.models import Category, Tool, ToolCategory
from app.schemas.catalog import SearchMeta
from app.services import catalog_service
from app.services import meilisearch_service
from app.services.meilisearch_service import MeiliSearchResult


def _session() -> Session:
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, class_=Session)
    db = SessionLocal()

    category = Category(slug="office", name="办公演示", description="")
    image_category = Category(slug="ai-图像", name="AI 图像", description="")
    db.add_all([category, image_category])
    db.flush()

    chatgpt = Tool(
        slug="chatgpt",
        name="ChatGPT",
        category_name="办公演示",
        summary="通用 AI 助手，适合写作、分析和代码协作",
        description="覆盖写作、分析和代码任务",
        editor_comment="",
        official_url="https://example.com/chatgpt",
        score=9.5,
        status="published",
        featured=True,
        pricing_type="freemium",
        access_flags={"needs_vpn": False, "cn_lang": True, "cn_payment": True},
        created_on=date(2026, 4, 1),
        last_verified_at=date(2026, 4, 20),
    )
    gamma = Tool(
        slug="gamma",
        name="Gamma",
        category_name="办公演示",
        summary="AI PPT 和演示文稿生成工具",
        description="适合答辩、汇报、幻灯片初稿和页面设计",
        editor_comment="",
        official_url="https://example.com/gamma",
        score=8.9,
        status="published",
        featured=False,
        pricing_type="freemium",
        access_flags={"needs_vpn": False, "cn_lang": True, "cn_payment": True},
        created_on=date(2026, 4, 2),
        last_verified_at=date(2026, 4, 20),
    )
    image_tool = Tool(
        slug="image-magic",
        name="Image Magic",
        category_name="AI 图像",
        summary="AI 海报和图片生成工具",
        description="适合做海报、图片生成和视觉素材",
        editor_comment="",
        official_url="https://example.com/image-magic",
        score=8.5,
        status="published",
        featured=False,
        pricing_type="freemium",
        created_on=date(2026, 4, 3),
        last_verified_at=date(2026, 4, 20),
    )
    db.add_all([chatgpt, gamma, image_tool])
    db.flush()
    db.add_all(
        [
            ToolCategory(tool_id=chatgpt.id, category_id=category.id),
            ToolCategory(tool_id=gamma.id, category_id=category.id),
            ToolCategory(tool_id=image_tool.id, category_id=image_category.id),
        ]
    )
    db.commit()
    return db


def test_tools_directory_uses_meilisearch_order(monkeypatch):
    db = _session()
    try:
        monkeypatch.setattr(catalog_service.settings, "search_provider", "meilisearch")
        monkeypatch.setattr(
            catalog_service.meilisearch_service,
            "search_tool_ids",
            lambda **kwargs: MeiliSearchResult(
                ids=[2, 1],
                total=2,
                meta=SearchMeta(
                    provider="meilisearch",
                    degraded=False,
                    latencyMs=7,
                    normalizedQuery="ppt",
                ),
            ),
        )

        payload = catalog_service.get_tools_directory(
            db=db,
            q="ppt",
            category_slug=None,
            tag_slug=None,
            status_slug=None,
            price_slug=None,
            access_slug=None,
            price_range_slug=None,
            sort="featured",
            view="hot",
            page=1,
            page_size=2,
        )

        assert [item.slug for item in payload.items] == ["gamma", "chatgpt"]
        assert payload.meta is not None
        assert payload.meta.provider == "meilisearch"
        assert payload.meta.degraded is False
    finally:
        db.close()


def test_tools_directory_falls_back_when_meilisearch_is_unavailable(monkeypatch):
    db = _session()
    try:
        monkeypatch.setattr(catalog_service.settings, "search_provider", "meilisearch")
        monkeypatch.setattr(
            catalog_service.meilisearch_service,
            "search_tool_ids",
            lambda **kwargs: None,
        )

        payload = catalog_service.get_tools_directory(
            db=db,
            q="ppt",
            category_slug=None,
            tag_slug=None,
            status_slug=None,
            price_slug=None,
            access_slug=None,
            price_range_slug=None,
            sort="featured",
            view="hot",
            page=1,
            page_size=2,
        )

        assert [item.slug for item in payload.items] == ["gamma"]
        assert payload.meta is not None
        assert payload.meta.provider == "legacy"
        assert payload.meta.degraded is True
    finally:
        db.close()


def test_tools_directory_filters_by_canonical_category_slug_when_label_is_localized(monkeypatch):
    db = _session()
    try:
        monkeypatch.setattr(catalog_service.settings, "search_provider", "legacy")

        payload = catalog_service.get_tools_directory(
            db=db,
            q=None,
            category_slug="office",
            tag_slug=None,
            status_slug=None,
            price_slug=None,
            access_slug=None,
            price_range_slug=None,
            sort="featured",
            view="hot",
            page=1,
            page_size=10,
        )

        assert payload.total == 2
        assert [item.slug for item in payload.items] == ["chatgpt", "gamma"]
        assert [item.model_dump() for item in payload.categories] == [
            {
                "slug": "office",
                "label": "办公演示",
                "count": 2,
            }
        ]
        assert {item.categorySlug for item in payload.items} == {"office"}
    finally:
        db.close()


def test_tools_directory_accepts_legacy_image_category_slug(monkeypatch):
    db = _session()
    try:
        monkeypatch.setattr(catalog_service.settings, "search_provider", "legacy")

        payload = catalog_service.get_tools_directory(
            db=db,
            q=None,
            category_slug="ai-image",
            tag_slug=None,
            status_slug=None,
            price_slug=None,
            access_slug=None,
            price_range_slug=None,
            sort="featured",
            view="hot",
            page=1,
            page_size=10,
        )

        assert payload.total == 1
        assert payload.items[0].slug == "image-magic"
        assert payload.items[0].categorySlug == "ai-图像"
        assert [item.model_dump() for item in payload.categories] == [
            {
                "slug": "ai-图像",
                "label": "AI 图像",
                "count": 1,
            }
        ]
    finally:
        db.close()


def test_meilisearch_category_filter_accepts_legacy_image_slug():
    filters = meilisearch_service._build_filters(
        category_slug="ai-image",
        tag_slug=None,
        price_slug=None,
        access_slug=None,
        price_range_slug=None,
    )

    assert filters == ['status = "published"', '(categorySlug = "ai-image" OR categorySlug = "ai-图像")']
