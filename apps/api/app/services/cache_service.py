import hashlib
import json

from redis import Redis
from redis.connection import ConnectionPool
from redis.exceptions import RedisError

from app.core.config import settings


# Global connection pool - created once at app startup
_redis_pool: ConnectionPool | None = None
_redis_client: Redis | None = None


def get_redis_client() -> Redis | None:
    global _redis_pool, _redis_client
    if not settings.cache_enabled:
        return None
    if _redis_client is None:
        try:
            _redis_pool = ConnectionPool.from_url(settings.redis_url, decode_responses=True)
            _redis_client = Redis(connection_pool=_redis_pool)
        except RedisError:
            _redis_client = None
    return _redis_client


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
