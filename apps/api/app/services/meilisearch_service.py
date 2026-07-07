from __future__ import annotations

import json
import logging
import re
import time
import unicodedata
from dataclasses import dataclass
from datetime import date, datetime
from urllib import error, request
from urllib.parse import quote

from app.core.config import settings
from app.schemas.catalog import SearchMeta
from app.schemas.tool import ToolSummary

logger = logging.getLogger(__name__)

SEARCHABLE_ATTRIBUTES = [
    "name",
    "slug",
    "summary",
    "description",
    "features",
    "bestFor",
    "limitations",
    "category",
    "categorySlug",
    "tags",
    "searchText",
]
FILTERABLE_ATTRIBUTES = [
    "status",
    "categorySlug",
    "tagSlugs",
    "pricingType",
    "priceRange",
    "accessFlags.noVpn",
    "accessFlags.needsVpn",
    "accessFlags.cnLang",
    "accessFlags.cnPayment",
    "featured",
]
SORTABLE_ATTRIBUTES = ["featured", "score", "createdAt", "name"]
RANKING_RULES = [
    "words",
    "typo",
    "proximity",
    "attribute",
    "sort",
    "exactness",
]
CATEGORY_FILTER_ALIASES: dict[str, list[str]] = {
    "ai-image": ["ai-图像"],
    "image": ["ai-图像"],
    "image-video": ["ai-图像"],
}


@dataclass(slots=True)
class MeiliSearchResult:
    ids: list[int]
    total: int
    meta: SearchMeta


def _is_enabled() -> bool:
    return (
        settings.search_provider.strip().lower() == "meilisearch"
        and bool(settings.meilisearch_url.strip())
    )


def _headers() -> dict[str, str]:
    headers = {"Content-Type": "application/json"}
    if settings.meilisearch_api_key:
        headers["Authorization"] = f"Bearer {settings.meilisearch_api_key}"
    return headers


def _url(path: str) -> str:
    return f"{settings.meilisearch_url.rstrip('/')}{path}"


def _request_json(
    method: str,
    path: str,
    payload: object | None = None,
    *,
    timeout: float = 2.5,
) -> dict:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8") if payload is not None else None
    api_request = request.Request(_url(path), data=body, headers=_headers(), method=method)
    with request.urlopen(api_request, timeout=timeout) as response:
        content = response.read().decode("utf-8")
    return json.loads(content) if content else {}


def _index_path() -> str:
    return f"/indexes/{quote(settings.meilisearch_index.strip() or 'tools', safe='')}"


def _normalize_text(value: str | None) -> str:
    normalized = unicodedata.normalize("NFKC", value or "").strip().casefold()
    normalized = re.sub(r"[^\w\u4e00-\u9fff\s-]+", " ", normalized, flags=re.UNICODE)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized


def _slugify(value: str) -> str:
    normalized = _normalize_text(value)
    normalized = re.sub(r"[\s_]+", "-", normalized, flags=re.UNICODE).strip("-")
    return normalized or value.casefold()


def _date_value(value: date | datetime | str | None) -> str:
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    return str(value or "")


def _derive_price_range(tool: ToolSummary) -> str | None:
    if tool.pricingType == "free":
        return "free"
    if tool.pricingType == "contact":
        return "contact"
    if tool.priceMinCny is None:
        return None
    if tool.priceMinCny <= 50:
        return "0-50"
    if tool.priceMinCny <= 200:
        return "51-200"
    return "201-plus"


def build_tool_document(tool: ToolSummary, *, description: str = "") -> dict:
    flags = tool.accessFlags
    tag_slugs = [_slugify(tag) for tag in tool.tags]
    search_text = " ".join(
        [
            tool.name,
            tool.slug,
            tool.summary,
            description,
            tool.category,
            " ".join(tool.tags),
            " ".join(tool.features or []),
            " ".join(tool.bestFor or []),
            " ".join(tool.limitations or []),
            tool.dealSummary or "",
            tool.freeAllowanceText or "",
        ]
    )
    return {
        "id": tool.id,
        "slug": tool.slug,
        "name": tool.name,
        "category": tool.category,
        "categorySlug": tool.categorySlug or _slugify(tool.category),
        "score": tool.score,
        "summary": tool.summary,
        "description": description,
        "tags": tool.tags,
        "tagSlugs": tag_slugs,
        "status": tool.status,
        "featured": tool.featured,
        "createdAt": _date_value(tool.createdAt),
        "pricingType": tool.pricingType or "",
        "priceRange": _derive_price_range(tool),
        "features": tool.features or [],
        "bestFor": tool.bestFor or [],
        "limitations": tool.limitations or [],
        "accessFlags": {
            "noVpn": flags.needsVpn is False if flags else False,
            "needsVpn": flags.needsVpn is True if flags else False,
            "cnLang": flags.cnLang is True if flags else False,
            "cnPayment": flags.cnPayment is True if flags else False,
        },
        "searchText": _normalize_text(search_text),
    }


def ensure_index() -> bool:
    if not _is_enabled():
        return False
    try:
        try:
            _request_json("GET", _index_path(), timeout=1.5)
        except error.HTTPError as exc:
            if exc.code != 404:
                raise
            _request_json(
                "POST",
                "/indexes",
                {"uid": settings.meilisearch_index.strip() or "tools", "primaryKey": "id"},
                timeout=2.5,
            )

        _request_json(
            "PATCH",
            f"{_index_path()}/settings",
            {
                "searchableAttributes": SEARCHABLE_ATTRIBUTES,
                "filterableAttributes": FILTERABLE_ATTRIBUTES,
                "sortableAttributes": SORTABLE_ATTRIBUTES,
                "rankingRules": RANKING_RULES,
                "typoTolerance": {"enabled": True},
            },
            timeout=2.5,
        )
        return True
    except Exception as exc:
        logger.warning("meilisearch_ensure_index_failed error=%s", type(exc).__name__)
        return False


def replace_documents(documents: list[dict]) -> bool:
    if not ensure_index():
        return False
    try:
        _request_json("DELETE", f"{_index_path()}/documents", timeout=5)
        if documents:
            _request_json("POST", f"{_index_path()}/documents", documents, timeout=10)
        return True
    except Exception as exc:
        logger.warning("meilisearch_replace_documents_failed error=%s", type(exc).__name__)
        return False


def upsert_documents(documents: list[dict]) -> bool:
    if not documents or not ensure_index():
        return False
    try:
        _request_json("POST", f"{_index_path()}/documents", documents, timeout=5)
        return True
    except Exception as exc:
        logger.warning("meilisearch_upsert_documents_failed error=%s", type(exc).__name__)
        return False


def delete_documents(ids: list[int]) -> bool:
    if not ids or not ensure_index():
        return False
    try:
        _request_json("POST", f"{_index_path()}/documents/delete-batch", ids, timeout=5)
        return True
    except Exception as exc:
        logger.warning("meilisearch_delete_documents_failed error=%s", type(exc).__name__)
        return False


def _quote_filter_value(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def _build_filters(
    *,
    category_slug: str | None,
    tag_slug: str | None,
    price_slug: str | None,
    access_slug: str | None,
    price_range_slug: str | None,
) -> list[str]:
    filters = ['status = "published"']
    if category_slug:
        normalized_category = _slugify(category_slug)
        category_values = [normalized_category, *CATEGORY_FILTER_ALIASES.get(normalized_category, [])]
        category_filter = " OR ".join(
            f"categorySlug = {_quote_filter_value(_slugify(value))}" for value in dict.fromkeys(category_values)
        )
        filters.append(f"({category_filter})")
    if tag_slug:
        filters.append(f"tagSlugs = {_quote_filter_value(_slugify(tag_slug))}")
    if price_slug:
        filters.append(f"pricingType = {_quote_filter_value(price_slug)}")
    if price_range_slug:
        filters.append(f"priceRange = {_quote_filter_value(price_range_slug)}")
    for access in [item.strip() for item in (access_slug or "").split(",") if item.strip()]:
        if access == "no-vpn":
            filters.append("accessFlags.noVpn = true")
        elif access == "needs-vpn":
            filters.append("accessFlags.needsVpn = true")
        elif access == "cn-lang":
            filters.append("accessFlags.cnLang = true")
        elif access == "cn-payment":
            filters.append("accessFlags.cnPayment = true")
    return filters


def _build_sort(sort: str, view: str) -> list[str]:
    if sort == "name":
        return ["name:asc"]
    if sort == "latest" or view == "latest":
        return ["createdAt:desc", "featured:desc", "score:desc"]
    return ["featured:desc", "score:desc", "createdAt:desc"]


def search_tool_ids(
    *,
    q: str | None,
    category_slug: str | None,
    tag_slug: str | None,
    price_slug: str | None,
    access_slug: str | None,
    price_range_slug: str | None,
    sort: str,
    view: str,
    limit: int,
) -> MeiliSearchResult | None:
    started_at = time.perf_counter()
    normalized_query = _normalize_text(q)
    meta = SearchMeta(provider="meilisearch", degraded=False, normalizedQuery=normalized_query)
    if not _is_enabled():
        return None
    try:
        payload = {
            "q": normalized_query,
            "limit": limit,
            "filter": _build_filters(
                category_slug=category_slug,
                tag_slug=tag_slug,
                price_slug=price_slug,
                access_slug=access_slug,
                price_range_slug=price_range_slug,
            ),
            "sort": _build_sort(sort, view),
            "attributesToRetrieve": ["id"],
            "showRankingScore": False,
        }
        response = _request_json("POST", f"{_index_path()}/search", payload, timeout=2.5)
        hits = response.get("hits") if isinstance(response, dict) else []
        ids = [
            int(item["id"])
            for item in hits
            if isinstance(item, dict) and item.get("id") is not None
        ]
        total = int(response.get("estimatedTotalHits") or response.get("totalHits") or len(ids))
        meta.latencyMs = int((time.perf_counter() - started_at) * 1000)
        return MeiliSearchResult(ids=ids, total=total, meta=meta)
    except Exception as exc:
        logger.warning("meilisearch_search_failed error=%s", type(exc).__name__)
        meta.degraded = True
        meta.latencyMs = int((time.perf_counter() - started_at) * 1000)
        return None
