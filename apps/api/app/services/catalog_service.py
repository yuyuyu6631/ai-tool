"""
Catalog services backed by the application database.
"""

from __future__ import annotations

import json
import re
import unicodedata
from collections import Counter
from dataclasses import dataclass
from urllib.parse import urlparse

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.models import Category, Ranking, RankingItem, Scenario, ScenarioTool, Tool, ToolCategory, ToolReview, ToolTag
from app.schemas.catalog import (
    CategorySummary,
    FacetOption,
    HomeCatalogResponse,
    HomeCategorySection,
    HomeSidebarCategory,
    PresetView,
    RankingItem as RankingItemSchema,
    RankingSection,
    ScenarioSummary,
    ToolsDirectoryResponse,
)
from app.schemas.tool import AccessFlags, ReviewPreview, ScenarioRecommendation, ToolDetail, ToolMediaItem, ToolRatingSummary, ToolSummary
from app.services.cache_service import get_redis_client, mark_redis_unavailable
from app.services.catalog_views_seed import (
    get_scenario_target_audience,
    sort_ranking_sections,
    sort_scenario_sections,
)
from app.services.embedding_service import recall_tool_ids_by_embedding
from app.services.logo_assets import normalize_logo_path


PUBLIC_TOOL_STATUS = "published"
VISIBLE_TOOL_STATUSES = ("published", "draft", "archived")
ALL_STATUS_SLUG = "all"
LEGACY_CATEGORY_SLUGS: dict[str, list[str]] = {
    "chatbot": ["ai-chat", "general-assistants"],
}
HOME_SIDEBAR_ORDER = ["chatbot", "office"]

PRESET_DEFINITIONS = {
    "hot": {
        "label": "最热",
        "description": "优先展示热度高、适用面广的工具。",
    },
    "latest": {
        "label": "最新",
        "description": "优先查看最近收录或更新的工具。",
    },
    "free": {
        "label": "免费优先",
        "description": "优先查看免费或免费增值工具。",
    },
    "enterprise": {
        "label": "团队协作",
        "description": "优先查看适合协作和业务场景的工具。",
    },
}

PRICE_TYPE_LABELS = {
    "free": "免费",
    "freemium": "免费增值",
    "subscription": "订阅",
    "one-time": "一次性付费",
    "contact": "联系销售",
}

ACCESS_FLAG_LABELS = {
    "no-vpn": "国内直连",
    "needs-vpn": "需特定网络",
    "cn-lang": "中文界面",
    "cn-payment": "支持国内支付",
}

PRICE_RANGE_LABELS = {
    "free": "完全免费",
    "0-50": "0-50 元",
    "51-200": "51-200 元",
    "201-plus": "201 元以上",
    "contact": "联系销售",
}

TASK_PREFIXES = (
    "帮我",
    "帮忙",
    "请帮我",
    "给我",
    "我想",
    "我需要",
    "想要",
    "需要",
    "用什么",
    "做",
    "写",
    "找",
    "推荐",
)

TASK_TERM_EXPANSIONS = {
    "文案": ("文案", "写作", "copywriting", "content", "marketing", "blog", "邮件", "workspace"),
    "海报": ("海报", "设计", "图像", "图片", "poster", "visual", "banner", "presentation", "slides"),
    "代码": ("代码", "编程", "开发", "coding", "developer", "engineering", "automation"),
    "数据": ("数据", "数据分析", "分析", "商业智能", "bi", "analytics", "dashboard", "报表"),
    "分析": ("分析", "数据分析", "analytics", "insight", "report"),
    "报表": ("报表", "dashboard", "report", "数据分析"),
}


@dataclass(slots=True)
class SearchableTool:
    summary: ToolSummary
    search_text: str


def _repair_text(value: str | None) -> str:
    if not value:
        return ""

    suspicious_markers = ("脙", "脗", "氓", "忙", "莽", "茅", "茂", "陇", "锟")
    if not any(marker in value for marker in suspicious_markers):
        return value

    try:
        return value.encode("latin1").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return value


def _slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", _repair_text(value)).strip().casefold()
    normalized = re.sub(r"[^\w\s-]+", "", normalized, flags=re.UNICODE)
    normalized = re.sub(r"[\s_]+", "-", normalized, flags=re.UNICODE).strip("-")
    return normalized or value.casefold()


def _normalize_access_flags(value: dict[str, bool | None] | None) -> AccessFlags | None:
    if not isinstance(value, dict):
        return None

    flags = AccessFlags(
        needsVpn=value.get("needs_vpn"),
        cnLang=value.get("cn_lang"),
        cnPayment=value.get("cn_payment"),
    )
    if flags.needsVpn is None and flags.cnLang is None and flags.cnPayment is None:
        return None
    return flags


def _normalize_string_list(value) -> list[str]:
    if not isinstance(value, list):
        return []
    return [_repair_text(item).strip() for item in value if isinstance(item, str) and item.strip()]


def _is_safe_display_url(value: str | None, *, allow_relative: bool) -> bool:
    if not isinstance(value, str):
        return False
    stripped = value.strip()
    if not stripped:
        return False
    if allow_relative and stripped.startswith("/") and not stripped.startswith("//") and "\\" not in stripped:
        return True
    parsed = urlparse(stripped)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def _sanitize_media_items(value) -> list[ToolMediaItem]:
    if not isinstance(value, list):
        return []

    items: list[ToolMediaItem] = []
    for raw in value:
        if not isinstance(raw, dict):
            continue
        media_type = str(raw.get("type") or "").strip().lower()
        url = str(raw.get("url") or "").strip()
        if media_type not in {"image", "video"} or not _is_safe_display_url(url, allow_relative=True):
            continue

        thumbnail_url = str(raw.get("thumbnailUrl") or raw.get("thumbnail_url") or "").strip()
        source_url = str(raw.get("sourceUrl") or raw.get("source_url") or "").strip()

        items.append(
            ToolMediaItem(
                type=media_type,
                url=url,
                thumbnailUrl=thumbnail_url if _is_safe_display_url(thumbnail_url, allow_relative=True) else None,
                title=_repair_text(str(raw.get("title") or "")).strip()[:120],
                sourceName=_repair_text(str(raw.get("sourceName") or raw.get("source_name") or "")).strip()[:80],
                sourceUrl=source_url if _is_safe_display_url(source_url, allow_relative=False) else None,
            )
        )

    return items


def _unique_strings(values: list[str]) -> list[str]:
    deduped: list[str] = []
    seen: set[str] = set()
    for value in values:
        normalized = value.strip()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        deduped.append(normalized)
    return deduped


def _is_public_catalog_garbage(tool: ToolSummary) -> bool:
    name = tool.name.strip()
    summary = tool.summary.strip()
    slug = tool.slug.strip().casefold()

    known_bad_slugs = {"cc-123"}
    known_bad_values = {"cc", "cc'123"}
    if slug in known_bad_slugs:
        return True

    normalized_name = name.casefold()
    normalized_summary = summary.casefold()
    if normalized_name in known_bad_values or normalized_summary in known_bad_values:
        return True

    if (
        normalized_name
        and normalized_name == normalized_summary
        and not tool.officialUrl.strip()
        and not tool.logoPath
        and tool.score <= 0
    ):
        return True

    return False


def _published_reviews(tool: Tool) -> list[ToolReview]:
    return sorted(
        [review for review in tool.reviews if review.status == PUBLIC_TOOL_STATUS],
        key=lambda review: (
            review.source_type != "editor",
            -(review.created_at.timestamp() if review.created_at else 0),
        ),
    )


def _build_rating_summary(reviews: list[ToolReview]) -> ToolRatingSummary:
    ratings = [review.rating for review in reviews if review.rating is not None]
    review_count = len(ratings)
    average = round(sum(ratings) / review_count, 2) if review_count else 0.0
    distribution = {str(score): 0 for score in range(5, 0, -1)}
    for rating in ratings:
        distribution[str(int(rating))] = distribution.get(str(int(rating)), 0) + 1
    return ToolRatingSummary(average=average, reviewCount=review_count, ratingDistribution=distribution)


def _tool_row_to_summary(tool: Tool) -> ToolSummary:
    tags = [_repair_text(item.tag.name) for item in tool.tags] if tool.tags else []
    category_name = tool.category_name
    if tool.categories:
        category_name = tool.categories[0].category.name
    media_items = _sanitize_media_items(tool.media_items_json)
    deal_summary = _repair_text(tool.deal_summary).strip() or _repair_text(tool.free_allowance_text).strip()

    return ToolSummary(
        id=tool.id,
        slug=tool.slug,
        name=_repair_text(tool.name),
        category=_repair_text(category_name),
        categorySlug=_slugify(category_name),
        score=tool.score,
        summary=_repair_text(tool.summary),
        tags=tags,
        officialUrl=_repair_text(tool.official_url),
        logoPath=normalize_logo_path(tool.logo_path),
        logoStatus=tool.logo_status,
        logoSource=tool.logo_source,
        status=tool.status,
        featured=tool.featured,
        createdAt=tool.created_on,
        price=_repair_text(tool.price),
        reviewCount=tool.review_count,
        accessFlags=_normalize_access_flags(tool.access_flags),
        pricingType=tool.pricing_type,
        priceMinCny=tool.price_min_cny,
        priceMaxCny=tool.price_max_cny,
        freeAllowanceText=_repair_text(tool.free_allowance_text),
        features=_normalize_string_list(tool.features_json),
        limitations=_normalize_string_list(tool.limitations_json),
        bestFor=_normalize_string_list(tool.best_for_json),
        dealSummary=deal_summary,
        primaryMedia=media_items[0] if media_items else None,
    )


def _tool_row_to_detail(tool: Tool) -> ToolDetail:
    base = _tool_row_to_summary(tool)
    reviews = _published_reviews(tool)
    pros = _unique_strings([item for review in reviews for item in _normalize_string_list(review.pros_json)])
    cons = _unique_strings([item for review in reviews for item in _normalize_string_list(review.cons_json)])
    pitfalls = _unique_strings([item for review in reviews for item in _normalize_string_list(review.pitfalls_json)])
    scenario_recommendations = [
        ScenarioRecommendation(
            audience=_repair_text(review.audience).strip(),
            task=_repair_text(review.task).strip(),
            summary=_repair_text(review.body).strip(),
        )
        for review in reviews
        if _repair_text(review.audience).strip() and _repair_text(review.task).strip() and _repair_text(review.body).strip()
    ]
    target_audience = _unique_strings([item.audience for item in scenario_recommendations])
    review_preview = [
        ReviewPreview(
            sourceType=review.source_type,
            title=_repair_text(review.title),
            body=_repair_text(review.body),
            rating=review.rating,
        )
        for review in reviews[:3]
        if _repair_text(review.title) or _repair_text(review.body)
    ]
    rating_summary = _build_rating_summary(reviews)
    return ToolDetail(
        **base.model_dump(),
        description=_repair_text(tool.description),
        editorComment=_repair_text(tool.editor_comment),
        developer=_repair_text(tool.developer),
        country=_repair_text(tool.country),
        city=_repair_text(tool.city),
        platforms=_repair_text(tool.platforms),
        vpnRequired=_repair_text(tool.vpn_required),
        targetAudience=target_audience,
        abilities=[],
        pros=pros,
        cons=cons,
        pitfalls=pitfalls,
        scenarios=[item.task for item in scenario_recommendations],
        scenarioRecommendations=scenario_recommendations,
        reviewPreview=review_preview,
        ratingSummary=rating_summary,
        mediaItems=_sanitize_media_items(tool.media_items_json),
        alternatives=[],
        lastVerifiedAt=tool.last_verified_at,
    )


def _build_search_text(tool: Tool) -> str:
    tags = " ".join(_repair_text(item.tag.name) for item in tool.tags) if tool.tags else ""
    category_name = _repair_text(tool.category_name)
    if tool.categories:
        category_name = _repair_text(tool.categories[0].category.name)

    fields = [
        tool.slug,
        _repair_text(tool.name),
        _repair_text(tool.summary),
        _repair_text(tool.description),
        " ".join(_normalize_string_list(tool.features_json)),
        " ".join(_normalize_string_list(tool.limitations_json)),
        " ".join(_normalize_string_list(tool.best_for_json)),
        _repair_text(tool.deal_summary),
        category_name,
        tags,
    ]
    normalized = " ".join(field for field in fields if field)
    return unicodedata.normalize("NFKC", normalized).casefold()


def _normalize_status_filter(status_slug: str | None) -> str:
    if status_slug in {*VISIBLE_TOOL_STATUSES, ALL_STATUS_SLUG}:
        return status_slug
    return PUBLIC_TOOL_STATUS


def _sort_tools(items: list[ToolSummary], sort: str, view: str, include_all_statuses: bool = False) -> list[ToolSummary]:
    def status_priority(item: ToolSummary) -> int:
        if not include_all_statuses:
            return 0
        return {"draft": 2, "archived": 1, "published": 0}.get(item.status, 0)

    if view == "latest" or sort == "latest":
        return sorted(items, key=lambda item: (status_priority(item), item.createdAt, item.id), reverse=True)
    if sort == "name":
        return sorted(items, key=lambda item: (-status_priority(item), item.name.casefold()))
    return sorted(items, key=lambda item: (status_priority(item), item.featured, item.score, item.createdAt, item.id), reverse=True)


def _normalize_query(query: str) -> str:
    normalized = unicodedata.normalize("NFKC", _repair_text(query)).strip().casefold()
    normalized = re.sub(r"[^\w\u4e00-\u9fff\s-]+", " ", normalized, flags=re.UNICODE)
    normalized = re.sub(r"\s+", " ", normalized).strip()

    stripped = normalized
    changed = True
    while changed and stripped:
        changed = False
        for prefix in TASK_PREFIXES:
            if stripped.startswith(prefix):
                stripped = stripped[len(prefix) :].strip()
                changed = True

    return stripped or normalized


def _query_token_groups(query: str) -> list[tuple[str, ...]]:
    normalized = _normalize_query(query)
    if not normalized:
        return []

    chunks = [chunk for chunk in re.split(r"[\s/_-]+", normalized) if chunk]
    groups: list[tuple[str, ...]] = []
    for chunk in chunks:
        expansions = set(TASK_TERM_EXPANSIONS.get(chunk, ()))
        expansions.add(chunk)
        groups.append(tuple(sorted(expansions, key=len, reverse=True)))
    return groups


def _is_task_style_query(query: str) -> bool:
    raw = unicodedata.normalize("NFKC", _repair_text(query)).strip().casefold()
    if any(raw.startswith(prefix) for prefix in TASK_PREFIXES):
        return True

    return any(chunk in TASK_TERM_EXPANSIONS for chunk in re.split(r"[\s/_-]+", _normalize_query(query)) if chunk)


def _matches_query(search_text: str, query: str) -> bool:
    token_groups = _query_token_groups(query)
    if not token_groups:
        return True

    return all(any(token in search_text for token in group) for group in token_groups)


def _can_use_ai_task_search() -> bool:
    return bool(
        settings.ai_provider != "stub"
        and settings.ai_api_key
        and settings.ai_model
        and settings.ai_openai_base_url
    )


def _expand_with_ai_recommendations(
    *,
    db,
    q: str | None,
    filtered: list[SearchableTool],
    searchable_tools: list[SearchableTool],
) -> list[SearchableTool]:
    if filtered or not q or not searchable_tools or not _is_task_style_query(q) or not _can_use_ai_task_search():
        return filtered

    from app.schemas.recommend import RecommendRequest
    from app.services.recommendation_service import recommend

    searchable_by_slug = {item.summary.slug: item for item in searchable_tools}
    payload = RecommendRequest(query=q, candidateSlugs=list(searchable_by_slug))

    try:
        recommendations = recommend(db=db, payload=payload)
    except Exception:
        return filtered

    expanded: list[SearchableTool] = []
    for item in recommendations:
        matched = searchable_by_slug.get(item.slug)
        if matched is not None:
            expanded.append(matched)

    return expanded or filtered


def _matches_category(tool: ToolSummary, category_slug: str) -> bool:
    category_values = {_slugify(tool.category), _slugify(tool.category.replace(" ", "-"))}
    return _slugify(category_slug) in category_values


def _matches_tag(tool: ToolSummary, tag_slug: str) -> bool:
    normalized = _slugify(tag_slug)
    return any(_slugify(tag) == normalized for tag in tool.tags)


def _detect_price_type(price_text: str | None) -> str:
    if not price_text:
        return "other"

    text = price_text.casefold()
    if any(word in text for word in ("free", "免费")):
        return "free"
    if any(word in text for word in ("freemium", "免费增值")):
        return "freemium"
    if any(word in text for word in ("subscription", "monthly", "yearly", "按月", "按年", "订阅")):
        return "subscription"
    if any(word in text for word in ("one-time", "lifetime", "一次性", "终身")):
        return "one-time"
    return "other"


def _resolve_price_type(tool: ToolSummary) -> str:
    pricing_type = (tool.pricingType or "").strip().replace("_", "-")
    if pricing_type in {"free", "freemium", "subscription", "one-time", "contact"}:
        return pricing_type

    text = f"{tool.price} {tool.name} {tool.summary} {' '.join(tool.tags)}"
    return _detect_price_type(text)


def _matches_price_filter(tool: ToolSummary, price_slug: str) -> bool:
    return _resolve_price_type(tool) == price_slug


def _parse_access_filter(access_slug: str | None) -> list[str]:
    if not access_slug:
        return []
    values = [_slugify(item) for item in access_slug.split(",") if item.strip()]
    return [value for value in values if value in ACCESS_FLAG_LABELS]


def _matches_access_filter(tool: ToolSummary, access_filters: list[str]) -> bool:
    if not access_filters:
        return True

    flags = tool.accessFlags
    if flags is None:
        return False

    checks = {
        "no-vpn": flags.needsVpn is False,
        "needs-vpn": flags.needsVpn is True,
        "cn-lang": flags.cnLang is True,
        "cn-payment": flags.cnPayment is True,
    }
    return all(checks.get(item, False) for item in access_filters)


def _derive_price_range(tool: ToolSummary) -> str | None:
    pricing_type = tool.pricingType or "unknown"
    if pricing_type == "free":
        return "free"
    if pricing_type == "contact":
        return "contact"

    if tool.priceMinCny is None:
        return None
    if tool.priceMinCny <= 50:
        return "0-50"
    if tool.priceMinCny <= 200:
        return "51-200"
    return "201-plus"


def _matches_price_range_filter(tool: ToolSummary, price_range_slug: str | None) -> bool:
    if not price_range_slug:
        return True
    return _derive_price_range(tool) == price_range_slug


def _build_facets(items: list[ToolSummary], key: str) -> list[FacetOption]:
    counter: Counter[str] = Counter()
    labels: dict[str, str] = {}

    if key == "category":
        for item in items:
            slug = _slugify(item.category)
            counter[slug] += 1
            labels[slug] = item.category
    else:
        for item in items:
            for tag in item.tags:
                slug = _slugify(tag)
                counter[slug] += 1
                labels[slug] = tag

    return [
        FacetOption(slug=slug, label=labels[slug], count=count)
        for slug, count in sorted(counter.items(), key=lambda pair: (-pair[1], labels[pair[0]].casefold()))
    ]


def _build_status_facets(items: list[ToolSummary]) -> list[FacetOption]:
    labels = {
        ALL_STATUS_SLUG: "All",
        "published": "Published",
        "draft": "Draft",
        "archived": "Archived",
    }
    counter: Counter[str] = Counter(item.status for item in items)
    ordered_statuses = [status for status in VISIBLE_TOOL_STATUSES if counter.get(status)]
    facets = [FacetOption(slug=ALL_STATUS_SLUG, label=labels[ALL_STATUS_SLUG], count=sum(counter.values()))]
    facets.extend(FacetOption(slug=status, label=labels.get(status, status), count=counter[status]) for status in ordered_statuses)
    return facets


def _build_price_facets(items: list[ToolSummary]) -> list[FacetOption]:
    counter: Counter[str] = Counter()
    for item in items:
        price_type = _resolve_price_type(item)
        if price_type != "other":
            counter[price_type] += 1

    return [
        FacetOption(slug=slug, label=PRICE_TYPE_LABELS[slug], count=count)
        for slug, count in sorted(counter.items(), key=lambda pair: (-pair[1], pair[0]))
    ]


def _build_access_facets(items: list[ToolSummary]) -> list[FacetOption]:
    counter: Counter[str] = Counter()
    for item in items:
        flags = item.accessFlags
        if not flags:
            continue
        if flags.needsVpn is False:
            counter["no-vpn"] += 1
        if flags.needsVpn is True:
            counter["needs-vpn"] += 1
        if flags.cnLang is True:
            counter["cn-lang"] += 1
        if flags.cnPayment is True:
            counter["cn-payment"] += 1

    return [
        FacetOption(slug=slug, label=ACCESS_FLAG_LABELS[slug], count=count)
        for slug, count in sorted(counter.items(), key=lambda pair: (-pair[1], pair[0]))
    ]


def _build_price_range_facets(items: list[ToolSummary]) -> list[FacetOption]:
    counter: Counter[str] = Counter()
    for item in items:
        price_range = _derive_price_range(item)
        if price_range is not None:
            counter[price_range] += 1

    ordered = [slug for slug in PRICE_RANGE_LABELS if counter.get(slug)]
    return [FacetOption(slug=slug, label=PRICE_RANGE_LABELS[slug], count=counter[slug]) for slug in ordered]


def _matches_preset(tool: ToolSummary, preset: str) -> bool:
    if preset == "hot":
        return tool.featured or tool.score > 0
    if preset == "latest":
        return True
    if preset == "free":
        keywords = ("free", "免费", "freemium", "免费增值")
        return any(keyword in tool.summary.casefold() for keyword in keywords) or any(
            keyword in tag.casefold() for tag in tool.tags for keyword in keywords
        )
    if preset == "enterprise":
        keywords = ("enterprise", "collaboration", "workflow", "business")
        return any(keyword in tool.summary.casefold() for keyword in keywords) or any(
            keyword in tag.casefold() for tag in tool.tags for keyword in keywords
        )
    return True


def _build_presets(items: list[ToolSummary]) -> list[PresetView]:
    return [
        PresetView(
            id=preset_id,
            label=definition["label"],
            description=definition["description"],
            count=sum(1 for item in items if _matches_preset(item, preset_id)),
        )
        for preset_id, definition in PRESET_DEFINITIONS.items()
    ]


def _load_searchable_tools(db, *, status_filter: str | None = PUBLIC_TOOL_STATUS) -> list[SearchableTool]:
    stmt = select(Tool).options(
        selectinload(Tool.tags).selectinload(ToolTag.tag),
        selectinload(Tool.categories).selectinload(ToolCategory.category),
    )
    if status_filter is not None and status_filter != ALL_STATUS_SLUG:
        stmt = stmt.where(Tool.status == status_filter)

    rows = db.scalars(stmt).all()
    items = [SearchableTool(summary=_tool_row_to_summary(row), search_text=_build_search_text(row)) for row in rows]
    if status_filter == PUBLIC_TOOL_STATUS:
        return [item for item in items if not _is_public_catalog_garbage(item.summary)]
    return items


def _load_summaries(db, *, status_filter: str | None = PUBLIC_TOOL_STATUS) -> list[ToolSummary]:
    return [item.summary for item in _load_searchable_tools(db, status_filter=status_filter)]


def _filter_tools(
    items: list[SearchableTool],
    *,
    q: str | None,
    category_slug: str | None,
    tag_slug: str | None,
    price_slug: str | None,
    access_slug: str | None,
    price_range_slug: str | None,
) -> list[SearchableTool]:
    filtered = items
    access_filters = _parse_access_filter(access_slug)

    if q:
        filtered = [item for item in filtered if _matches_query(item.search_text, q)]
    if category_slug:
        filtered = [item for item in filtered if _matches_category(item.summary, category_slug)]
    if tag_slug:
        filtered = [item for item in filtered if _matches_tag(item.summary, tag_slug)]
    if price_slug and price_slug in PRICE_TYPE_LABELS:
        filtered = [item for item in filtered if _matches_price_filter(item.summary, price_slug)]
    if access_filters:
        filtered = [item for item in filtered if _matches_access_filter(item.summary, access_filters)]
    if price_range_slug and price_range_slug in PRICE_RANGE_LABELS:
        filtered = [item for item in filtered if _matches_price_range_filter(item.summary, price_range_slug)]

    return filtered


def _apply_query_recall(*, db, items: list[SearchableTool], q: str | None) -> list[SearchableTool]:
    if not q:
        return items

    lexical_matches = [item for item in items if _matches_query(item.search_text, q)]
    candidate_tool_ids = [item.summary.id for item in items]

    try:
        semantic_tool_ids = recall_tool_ids_by_embedding(db=db, query=q, candidate_tool_ids=candidate_tool_ids)
    except Exception:
        semantic_tool_ids = []

    if not semantic_tool_ids:
        return lexical_matches

    semantic_rank = {tool_id: index for index, tool_id in enumerate(semantic_tool_ids)}
    semantic_matches = sorted(
        (item for item in items if item.summary.id in semantic_rank),
        key=lambda item: semantic_rank[item.summary.id],
    )

    merged: list[SearchableTool] = []
    seen_slugs: set[str] = set()
    for item in [*lexical_matches, *semantic_matches]:
        if item.summary.slug in seen_slugs:
            continue
        seen_slugs.add(item.summary.slug)
        merged.append(item)

    return merged


def get_tools_directory(
    *,
    db,
    q: str | None,
    category_slug: str | None,
    tag_slug: str | None,
    status_slug: str | None,
    price_slug: str | None,
    access_slug: str | None,
    price_range_slug: str | None,
    sort: str,
    view: str,
    page: int,
    page_size: int,
) -> ToolsDirectoryResponse:
    active_status = _normalize_status_filter(status_slug)
    searchable_tools = _load_searchable_tools(db, status_filter=active_status)
    base_filtered_searchable = _filter_tools(
        searchable_tools,
        q=None,
        category_slug=category_slug,
        tag_slug=tag_slug,
        price_slug=price_slug,
        access_slug=access_slug,
        price_range_slug=price_range_slug,
    )
    filtered_searchable = _apply_query_recall(db=db, items=base_filtered_searchable, q=q)
    filtered_searchable = _expand_with_ai_recommendations(
        db=db,
        q=q,
        filtered=filtered_searchable,
        searchable_tools=searchable_tools,
    )
    all_tools = [item.summary for item in searchable_tools]
    filtered = [item.summary for item in filtered_searchable]

    sorted_items = _sort_tools(filtered, sort=sort, view=view, include_all_statuses=active_status == ALL_STATUS_SLUG)
    total = len(sorted_items)
    start = (page - 1) * page_size
    page_items = sorted_items[start : start + page_size]

    return ToolsDirectoryResponse(
        items=page_items,
        total=total,
        page=page,
        pageSize=page_size,
        hasMore=total > (start + page_size),
        categories=_build_facets(filtered, "category"),
        tags=_build_facets(filtered, "tag"),
        statuses=_build_status_facets(filtered),
        priceFacets=_build_price_facets(filtered),
        accessFacets=_build_access_facets(filtered),
        priceRangeFacets=_build_price_range_facets(filtered),
        presets=_build_presets(all_tools),
    )


def list_tools(*, db) -> list[ToolSummary]:
    return _load_summaries(db, status_filter=None)


def list_tools_raw(*, db) -> list[ToolDetail]:
    stmt = select(Tool).options(
        selectinload(Tool.tags).selectinload(ToolTag.tag),
        selectinload(Tool.categories).selectinload(ToolCategory.category),
        selectinload(Tool.reviews),
    )
    rows = db.scalars(stmt).all()
    return [_tool_row_to_detail(row) for row in rows]


def get_tool(*, db, slug: str) -> ToolDetail | None:
    stmt = select(Tool).where(Tool.slug == slug).options(
        selectinload(Tool.tags).selectinload(ToolTag.tag),
        selectinload(Tool.categories).selectinload(ToolCategory.category),
        selectinload(Tool.reviews),
    )
    row = db.scalar(stmt)
    return _tool_row_to_detail(row) if row else None


def list_categories(*, db, include_empty: bool = False) -> list[CategorySummary]:
    redis_client = get_redis_client()
    cache_key = f"catalog:categories:{'all' if include_empty else 'non-empty'}"
    cache_ttl = 300  # 5 minutes

    if redis_client:
        try:
            cached = redis_client.get(cache_key)
            if cached:
                data = json.loads(cached)
                return [CategorySummary(**item) for item in data]
        except Exception as error:
            mark_redis_unavailable(error)

    rows = db.scalars(select(Category)).all()
    published_tools = _load_summaries(db)
    category_counts = Counter(tool.categorySlug or _slugify(tool.category) for tool in published_tools)
    visible_categories = set(category_counts) if not include_empty else set()
    result = [
        CategorySummary(
            slug=row.slug,
            name=_repair_text(row.name),
            description=_repair_text(row.description),
            toolCount=category_counts.get(row.slug, 0),
            canonicalSlug=row.slug,
            legacySlugs=LEGACY_CATEGORY_SLUGS.get(row.slug, []),
        )
        for row in rows
        if include_empty or row.slug in visible_categories or _slugify(row.name) in visible_categories
    ]
    result.sort(key=lambda item: (-item.toolCount, item.slug))

    if redis_client:
        try:
            # Serialize for caching
            serialized = json.dumps([item.model_dump() for item in result], ensure_ascii=False)
            redis_client.setex(cache_key, cache_ttl, serialized)
        except Exception as error:
            mark_redis_unavailable(error)

    return result


def list_tools_by_category(*, db, category_slug: str) -> list[ToolSummary]:
    normalized = _slugify(category_slug)
    canonical_slug = next(
        (slug for slug, aliases in LEGACY_CATEGORY_SLUGS.items() if normalized == slug or normalized in aliases),
        normalized,
    )
    # status already filtered by _load_summaries default to PUBLIC_TOOL_STATUS
    tools = [tool for tool in _load_summaries(db) if (tool.categorySlug or _slugify(tool.category)) == canonical_slug]
    return _sort_tools(tools, sort="featured", view="hot")


def get_home_catalog(*, db, section_size: int = 8) -> HomeCatalogResponse:
    all_tools = _load_summaries(db)
    hot_tools = _sort_tools(all_tools, sort="featured", view="hot")[:section_size]
    latest_tools = _sort_tools(all_tools, sort="featured", view="latest")[:section_size]
    categories = list_categories(db=db, include_empty=False)

    sidebar_categories = [
        HomeSidebarCategory(
            homeSlug=item.slug,
            label=item.name,
            count=item.toolCount,
            sectionId=f"category-{item.slug}",
            description=item.description,
            navigationType="route",
            href=f"/tools?mode=search&category={item.slug}&page=1",
        )
        for slug in HOME_SIDEBAR_ORDER
        for item in categories
        if item.slug == slug
    ]

    category_sections = [
        HomeCategorySection(
            homeSlug=item.slug,
            label=item.name,
            description=item.description,
            sectionId=f"category-{item.slug}",
            browseCategorySlug=item.slug,
            items=list_tools_by_category(db=db, category_slug=item.slug)[:section_size],
            moreHref=f"/tools?mode=search&category={item.slug}&page=1",
        )
        for item in categories
    ]

    return HomeCatalogResponse(
        hotTools=hot_tools,
        latestTools=latest_tools,
        sidebarCategories=sidebar_categories,
        categorySections=category_sections,
    )


def _build_scenario_summary(scenario: Scenario, db) -> ScenarioSummary:
    # Join with Tool and eager load relationships in one query
    stmt = (
        select(ScenarioTool)
        .where(ScenarioTool.scenario_id == scenario.id)
        .options(selectinload(ScenarioTool.tool).options(
            selectinload(Tool.tags).selectinload(ToolTag.tag),
            selectinload(Tool.categories).selectinload(ToolCategory.category),
        ))
    )
    links = db.scalars(stmt).all()
    primary_tools: list[ToolSummary] = []
    alternative_tools: list[ToolSummary] = []

    for link in links:
        tool_row = link.tool
        if not tool_row or tool_row.status != PUBLIC_TOOL_STATUS:
            continue
        target = primary_tools if link.is_primary else alternative_tools
        target.append(_tool_row_to_summary(tool_row))

    return ScenarioSummary(
        id=scenario.id,
        slug=scenario.slug,
        title=_repair_text(scenario.title),
        description=_repair_text(scenario.description),
        problem=_repair_text(scenario.problem),
        toolCount=len(primary_tools) + len(alternative_tools),
        primaryTools=primary_tools,
        alternativeTools=alternative_tools,
        targetAudience=get_scenario_target_audience(scenario.slug),
    )


def list_scenarios(*, db) -> list[ScenarioSummary]:
    redis_client = get_redis_client()
    cache_key = "catalog:scenarios:all"
    cache_ttl = 300  # 5 minutes

    if redis_client:
        try:
            cached = redis_client.get(cache_key)
            if cached:
                data = json.loads(cached)
                return [ScenarioSummary(**item) for item in data]
        except Exception as error:
            mark_redis_unavailable(error)

    rows = db.scalars(select(Scenario).order_by(Scenario.id)).all()
    scenarios = [_build_scenario_summary(row, db) for row in rows]
    result = sort_scenario_sections([scenario for scenario in scenarios if scenario.toolCount])

    if redis_client:
        try:
            serialized = json.dumps([item.model_dump() for item in result], ensure_ascii=False)
            redis_client.setex(cache_key, cache_ttl, serialized)
        except Exception as error:
            mark_redis_unavailable(error)

    return result


def get_scenario(*, db, slug: str) -> ScenarioSummary | None:
    row = db.scalar(select(Scenario).where(Scenario.slug == slug))
    if not row:
        return None
    scenario = _build_scenario_summary(row, db)
    return scenario if scenario.toolCount else None


def _build_ranking_section(ranking: Ranking, db) -> RankingSection:
    stmt = (
        select(RankingItem)
        .where(RankingItem.ranking_id == ranking.id)
        .order_by(RankingItem.rank_order)
        .options(selectinload(RankingItem.tool).options(
            selectinload(Tool.tags).selectinload(ToolTag.tag),
            selectinload(Tool.categories).selectinload(ToolCategory.category),
        ))
    )
    rows = db.scalars(stmt).all()
    items = []
    for row in rows:
        tool_row = row.tool
        if not tool_row or tool_row.status != PUBLIC_TOOL_STATUS:
            continue
        items.append(
            RankingItemSchema(
                rank=row.rank_order,
                reason=_normalize_ranking_reason(row.reason, row.rank_order),
                tool=_tool_row_to_summary(tool_row),
            )
        )

    return RankingSection(
        slug=ranking.slug,
        title=_repair_text(ranking.title),
        description=_repair_text(ranking.description),
        items=items,
    )


def _normalize_ranking_reason(reason: str, rank: int) -> str:
    normalized = _repair_text(reason).strip()
    if normalized.casefold().startswith("rank "):
        return f"综合推荐第 {rank} 位。"
    return normalized


def list_rankings(*, db) -> list[RankingSection]:
    redis_client = get_redis_client()
    cache_key = "catalog:rankings:all"
    cache_ttl = 60  # 1 minute

    if redis_client:
        try:
            cached = redis_client.get(cache_key)
            if cached:
                data = json.loads(cached)
                return [RankingSection(**item) for item in data]
        except Exception as error:
            mark_redis_unavailable(error)

    rows = db.scalars(select(Ranking).order_by(Ranking.id)).all()
    sections = [_build_ranking_section(row, db) for row in rows]
    result = sort_ranking_sections([section for section in sections if section.items])

    if redis_client:
        try:
            serialized = json.dumps([item.model_dump() for item in result], ensure_ascii=False)
            redis_client.setex(cache_key, cache_ttl, serialized)
        except Exception as error:
            mark_redis_unavailable(error)

    return result


def get_ranking(*, db, slug: str) -> RankingSection | None:
    row = db.scalar(select(Ranking).where(Ranking.slug == slug))
    if not row:
        return None
    section = _build_ranking_section(row, db)
    return section if section.items else None
