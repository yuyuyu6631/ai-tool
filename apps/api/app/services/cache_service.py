import hashlib
import json

from redis import Redis
from redis.exceptions import RedisError

from app.core.config import settings


def get_redis_client() -> Redis | None:
    try:
        return Redis.from_url(settings.redis_url, decode_responses=True)
    except RedisError:
        return None


def build_recommendation_cache_key(query: str, scenario: str | None, tags: list[str], candidates: list[str]) -> str:
    payload = json.dumps(
        {
            "query": query,
            "scenario": scenario,
            "tags": sorted(tags),
            "candidate_slugs": sorted(candidates),
        },
        ensure_ascii=False,
        sort_keys=True,
    )
    digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()
    return f"recommend:{digest}"
