"""
Catalog services backed by the application database.
"""

from __future__ import annotations

import re
import unicodedata
from collections import Counter

from app.db.session import SessionLocal
from app.models.models import Category, Ranking, RankingItem, Scenario, ScenarioTool, Tool
from app.services.logo_assets import normalize_logo_path
from app.schemas.catalog import (
    CategorySummary,
    FacetOption,
    PresetView,
    RankingItem as RankingItemSchema,
    RankingSection,
    ScenarioSummary,
    ToolsDirectoryResponse,
)
from app.schemas.tool import ToolDetail, ToolSummary


PRESET_DEFINITIONS = {
    "hot": {
        "label": "热门",
        "description": "默认优先展示重点工具与高关注条目。",
    },
    "latest": {
        "label": "最新",
        "description": "按收录时间查看最新加入目录的工具。",
    },
    "free": {
        "label": "免费优先",
        "description": "优先浏览免费或免费增值的工具。",
    },
    "enterprise": {
        "label": "企业场景",
        "description": "聚焦企业可落地、协作和工作流相关工具。",
    },
}

PUBLIC_TOOL_STATUS = "published"
ALL_STATUS_SLUG = "all"
VISIBLE_TOOL_STATUSES = ("published", "draft", "archived")


def _repair_text(value: str | None) -> str:
    if not value:
        return ""

    suspicious_markers = ("Ã", "Â", "å", "æ", "ç", "é", "ï", "¤", "�")
    if not any(marker in value for marker in suspicious_markers):
        return value

    try:
        repaired = value.encode("latin1").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return value

    return repaired


def _slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", _repair_text(value)).strip().casefold()
    normalized = re.sub(r"[^\w\s-]+", "", normalized, flags=re.UNICODE)
    normalized = re.sub(r"[\s_]+", "-", normalized, flags=re.UNICODE).strip("-")
    return normalized or value.casefold()


def _parse_import_editor_comment(value: str | None) -> dict[str, str]:
    if not value:
        return {}

    normalized = _repair_text(value).replace("[import-preview]", "").strip()
    if ":" not in normalized:
        return {}

    fields: dict[str, str] = {}
    for segment in normalized.split("|"):
        chunk = segment.strip()
        if ":" not in chunk:
            continue
        key, raw_value = chunk.split(":", 1)
        normalized_key = key.strip().casefold().replace(" ", "_")
        parsed_value = raw_value.strip()
        if normalized_key and parsed_value:
            fields[normalized_key] = parsed_value
    return fields


def _tool_row_to_summary(tool: Tool) -> ToolSummary:
    tags = [_repair_text(item.tag.name) for item in tool.tags] if tool.tags else []
    return ToolSummary(
        id=tool.id,
        slug=tool.slug,
        name=_repair_text(tool.name),
        category=_repair_text(tool.category_name),
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
    )


def _tool_row_to_detail(tool: Tool) -> ToolDetail:
    base = _tool_row_to_summary(tool)
    legacy_meta = _parse_import_editor_comment(tool.editor_comment)
    return ToolDetail(
        **base.model_dump(),
        description=_repair_text(tool.description),
        editorComment=_repair_text(tool.editor_comment),
        developer=_repair_text(tool.developer) or legacy_meta.get("developer", ""),
        country=_repair_text(tool.country) or legacy_meta.get("country", ""),
        city=_repair_text(tool.city) or legacy_meta.get("city", ""),
        price=_repair_text(tool.price) or legacy_meta.get("price", ""),
        platforms=_repair_text(tool.platforms) or legacy_meta.get("platforms", ""),
        vpnRequired=_repair_text(tool.vpn_required) or legacy_meta.get("vpn_required", ""),
        targetAudience=[],
        abilities=[],
        pros=[],
        cons=[],
        scenarios=[],
        alternatives=[],
        lastVerifiedAt=tool.last_verified_at,
    )


def list_tools() -> list[ToolSummary]:
    with SessionLocal() as db:
        rows = db.query(Tool).all()
        return [_tool_row_to_summary(row) for row in rows]


def list_tools_raw() -> list[ToolDetail]:
    with SessionLocal() as db:
        rows = db.query(Tool).all()
        return [_tool_row_to_detail(row) for row in rows]


def get_tool(slug: str) -> ToolDetail | None:
    with SessionLocal() as db:
        row = db.query(Tool).filter(Tool.slug == slug).first()
        return _tool_row_to_detail(row) if row else None


def _normalize_status_filter(status_slug: str | None) -> str:
    if status_slug in {*VISIBLE_TOOL_STATUSES, ALL_STATUS_SLUG}:
        return status_slug
    return PUBLIC_TOOL_STATUS


def _filter_items_by_status(items: list[ToolSummary], status_slug: str) -> list[ToolSummary]:
    if status_slug == ALL_STATUS_SLUG:
        return items
    return [item for item in items if item.status == status_slug]


def _matches_query(tool: ToolSummary, query: str) -> bool:
    haystack = " ".join([tool.name, tool.summary, tool.category, " ".join(tool.tags), tool.slug]).casefold()
    return query.casefold() in haystack


def _matches_preset(tool: ToolSummary, preset: str) -> bool:
    if preset == "hot":
        return tool.featured or tool.score > 0
    if preset == "latest":
        return True
    if preset == "free":
        keywords = ("免费", "free", "免费增值")
        return any(keyword in tool.summary.casefold() for keyword in keywords) or any(
            keyword in tag.casefold() for tag in tool.tags for keyword in keywords
        )
    if preset == "enterprise":
        keywords = ("企业", "协作", "工作流", "办公", "智能体")
        return any(keyword in tool.summary for keyword in keywords) or any(
            keyword in tag for tag in tool.tags for keyword in keywords
        )
    return True


def _sort_tools(items: list[ToolSummary], sort: str, preset: str) -> list[ToolSummary]:
    if preset == "latest" or sort == "latest":
        return sorted(items, key=lambda item: (item.createdAt, item.id), reverse=True)
    if sort == "name":
        return sorted(items, key=lambda item: item.name.casefold())
    return sorted(items, key=lambda item: (item.featured, item.score, item.createdAt, item.id), reverse=True)


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


def get_tools_directory(
    *,
    q: str | None,
    category_slug: str | None,
    tag_slug: str | None,
    status_slug: str | None,
    sort: str,
    view: str,
    page: int,
    page_size: int,
) -> ToolsDirectoryResponse:
    tools = list_tools()
    normalized_query = q.strip() if q else ""
    preset = view if view in PRESET_DEFINITIONS else "hot"
    active_status = _normalize_status_filter(status_slug)
    apply_preset = status_slug is None

    base_items = [
        item
        for item in tools
        if (not normalized_query or _matches_query(item, normalized_query))
        and (not apply_preset or _matches_preset(item, preset))
    ]

    categories = _build_facets(base_items, "category")
    tags = _build_facets(base_items, "tag")
    statuses = _build_status_facets(base_items)

    filtered_items = _filter_items_by_status(base_items, active_status)
    if category_slug:
        filtered_items = [item for item in filtered_items if _slugify(item.category) == category_slug]
    if tag_slug:
        filtered_items = [item for item in filtered_items if any(_slugify(tag) == tag_slug for tag in item.tags)]

    sorted_items = _sort_tools(filtered_items, sort, preset)
    visible_count = page * page_size
    return ToolsDirectoryResponse(
        items=sorted_items[:visible_count],
        total=len(sorted_items),
        page=page,
        pageSize=page_size,
        hasMore=len(sorted_items) > visible_count,
        categories=categories,
        tags=tags,
        statuses=statuses,
        presets=_build_presets(tools),
    )


def _build_status_facets(items: list[ToolSummary]) -> list[FacetOption]:
    labels = {
        ALL_STATUS_SLUG: "全部",
        "published": "已发布",
        "draft": "草稿",
        "archived": "已归档",
    }
    counter: Counter[str] = Counter(item.status for item in items)
    ordered_statuses = [status for status in VISIBLE_TOOL_STATUSES if counter.get(status)]
    facets = [FacetOption(slug=ALL_STATUS_SLUG, label=labels[ALL_STATUS_SLUG], count=sum(counter.values()))]
    facets.extend(FacetOption(slug=status, label=labels.get(status, status), count=counter[status]) for status in ordered_statuses)
    return facets


def list_categories() -> list[CategorySummary]:
    with SessionLocal() as db:
        rows = db.query(Category).all()
        return [
            CategorySummary(
                slug=row.slug,
                name=_repair_text(row.name),
                description=_repair_text(row.description),
            )
            for row in rows
        ]


def list_tools_by_category(category_slug: str) -> list[ToolSummary]:
    with SessionLocal() as db:
        category = db.query(Category).filter(Category.slug == category_slug).first()
        if not category:
            return []
        rows = db.query(Tool).filter(Tool.category_name == category.name).all()
        return [_tool_row_to_summary(row) for row in rows if row.status == PUBLIC_TOOL_STATUS]


def list_scenarios() -> list[ScenarioSummary]:
    with SessionLocal() as db:
        rows = db.query(Scenario).all()
        scenarios = [_build_scenario_summary(row, db) for row in rows]
        return [scenario for scenario in scenarios if scenario.toolCount]


def get_scenario(slug: str) -> ScenarioSummary | None:
    with SessionLocal() as db:
        row = db.query(Scenario).filter(Scenario.slug == slug).first()
        if not row:
            return None
        scenario = _build_scenario_summary(row, db)
        return scenario if scenario.toolCount else None


def _build_scenario_summary(scenario: Scenario, db) -> ScenarioSummary:
    links = db.query(ScenarioTool).filter(ScenarioTool.scenario_id == scenario.id).all()
    primary_tools: list[str] = []
    alternative_tools: list[str] = []

    for link in links:
        tool_row = db.query(Tool).filter(Tool.id == link.tool_id).first()
        if not tool_row or tool_row.status != PUBLIC_TOOL_STATUS:
            continue
        target = primary_tools if link.is_primary else alternative_tools
        target.append(tool_row.slug)

    return ScenarioSummary(
        id=scenario.id,
        slug=scenario.slug,
        title=_repair_text(scenario.title),
        description=_repair_text(scenario.description),
        problem=_repair_text(scenario.problem),
        toolCount=len(primary_tools) + len(alternative_tools),
        primaryTools=primary_tools,
        alternativeTools=alternative_tools,
        targetAudience=[],
    )


def _build_ranking_section(ranking: Ranking, db) -> RankingSection:
    rows = (
        db.query(RankingItem)
        .filter(RankingItem.ranking_id == ranking.id)
        .order_by(RankingItem.rank_order)
        .all()
    )
    items = []
    for row in rows:
        tool_row = db.query(Tool).filter(Tool.id == row.tool_id).first()
        if not tool_row or tool_row.status != PUBLIC_TOOL_STATUS:
            continue
        items.append(
            RankingItemSchema(
                rank=row.rank_order,
                reason=_repair_text(row.reason),
                tool=_tool_row_to_summary(tool_row),
            )
        )
    return RankingSection(
        slug=ranking.slug,
        title=_repair_text(ranking.title),
        description=_repair_text(ranking.description),
        items=items,
    )


def list_rankings() -> list[RankingSection]:
    with SessionLocal() as db:
        rows = db.query(Ranking).all()
        sections = [_build_ranking_section(row, db) for row in rows]
        return [section for section in sections if section.items]


def get_ranking(slug: str) -> RankingSection | None:
    with SessionLocal() as db:
        row = db.query(Ranking).filter(Ranking.slug == slug).first()
        if not row:
            return None
        section = _build_ranking_section(row, db)
        return section if section.items else None
