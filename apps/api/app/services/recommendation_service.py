import json

from app.core.config import settings
from app.schemas.recommend import RecommendItem, RecommendRequest
from app.services.ai_client import rank_with_ai
from app.services.cache_service import build_recommendation_cache_key, get_redis_client, mark_redis_unavailable
from app.services.candidate_selector import select_candidates


def score_tool(lowered_query: str, tool) -> float:
    score = tool.score
    for tag in tool.tags:
        if tag.lower() in lowered_query:
            score += 0.2
    if tool.category.lower() in lowered_query:
        score += 0.3
    return round(score, 1)


def build_reason(tool, ai_reasons: dict[str, str]) -> str:
    if tool.slug in ai_reasons:
        return ai_reasons[tool.slug]
    tag_hint = tool.tags[0] if tool.tags else tool.category
    return f"{tool.name} 更适合当前需求，兼顾 {tag_hint} 和 {tool.category} 场景。"


def _coerce_cached_items(data: object) -> list[RecommendItem] | None:
    if isinstance(data, list):
        return [RecommendItem(**item) for item in data]

    if isinstance(data, dict) and isinstance(data.get("items"), list):
        return [RecommendItem(**item) for item in data["items"]]

    return None


def recommend(*, db, payload: RecommendRequest) -> list[RecommendItem]:
    cache_key = build_recommendation_cache_key(
        payload.query, payload.scenario, payload.tags, payload.candidateSlugs
    )
    redis_client = get_redis_client()

    if redis_client:
        try:
            cached = redis_client.get(cache_key)
            if cached:
                data = json.loads(cached)
                cached_items = _coerce_cached_items(data)
                if cached_items is not None:
                    return cached_items
        except Exception as error:
            mark_redis_unavailable(error)

    candidates = select_candidates(db=db, payload=payload)
    lowered_query = payload.query.lower()
    ranked = sorted(candidates, key=lambda tool: score_tool(lowered_query, tool), reverse=True)
    ai_reasons: dict[str, str] = {}

    if settings.ai_provider != "stub" and settings.ai_api_key:
        ranked, ai_reasons = rank_with_ai(payload, ranked)

    ranked = ranked[:3]

    items = [
        RecommendItem(
            tool_id=tool.id,
            name=tool.name,
            slug=tool.slug,
            url=tool.officialUrl,
            summary=tool.summary,
            tags=tool.tags,
            reason=build_reason(tool, ai_reasons),
            score=score_tool(lowered_query, tool),
            logoPath=tool.logoPath,
        )
        for tool in ranked
    ]

    if redis_client:
        try:
            redis_client.setex(
                cache_key,
                settings.recommendation_ttl_seconds,
                json.dumps([item.model_dump() for item in items], ensure_ascii=False),
            )
        except Exception as error:
            mark_redis_unavailable(error)

    return items
