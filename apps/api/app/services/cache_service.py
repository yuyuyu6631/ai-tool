import hashlib
import json
import logging
import time

from redis import Redis
from redis.connection import ConnectionPool
from redis.exceptions import RedisError

from app.core.config import settings


# Global connection pool - created once at app startup
_redis_pool: ConnectionPool | None = None
_redis_client: Redis | None = None
_redis_retry_after = 0.0
_REDIS_RETRY_COOLDOWN_SECONDS = 30.0
logger = logging.getLogger(__name__)


def mark_redis_unavailable(error: Exception | None = None) -> None:
    global _redis_pool, _redis_client, _redis_retry_after
    if error is not None:
        logger.warning("redis_unavailable error=%s", type(error).__name__)

    if _redis_pool is not None:
        try:
            _redis_pool.disconnect()
        except Exception:
            pass

    _redis_pool = None
    _redis_client = None
    _redis_retry_after = time.monotonic() + _REDIS_RETRY_COOLDOWN_SECONDS


def get_redis_client() -> Redis | None:
    global _redis_pool, _redis_client, _redis_retry_after
    now = time.monotonic()
    if _redis_client is not None:
        return _redis_client

    if now < _redis_retry_after:
        return None

    if _redis_client is None:
        try:
            _redis_pool = ConnectionPool.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_connect_timeout=0.5,
                socket_timeout=0.5,
                health_check_interval=30,
                retry_on_timeout=False,
            )
            client = Redis(connection_pool=_redis_pool)
            client.ping()
            _redis_client = client
        except (RedisError, OSError, ValueError) as error:
            mark_redis_unavailable(error)
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


def clear_recommendation_caches() -> None:
    redis_client = get_redis_client()
    if not redis_client:
        return
    try:
        for pattern in ("recommend:*", "ai-search:intent:*"):
            for key in redis_client.scan_iter(match=pattern, count=100):
                redis_client.delete(key)
    except Exception as error:
        mark_redis_unavailable(error)
