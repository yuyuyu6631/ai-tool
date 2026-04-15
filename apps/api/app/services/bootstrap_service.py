from __future__ import annotations

from sqlalchemy import func, select

from app.core.config import settings
from app.db.session import Base, SessionLocal, engine
from app.models.models import Tool
from app.services.cache_service import get_redis_client
from app.services.catalog_views_seed import seed_catalog_views


def clear_catalog_cache() -> None:
    redis_client = get_redis_client()
    if not redis_client:
        return

    try:
        keys = [*redis_client.scan_iter(match="catalog:*"), *redis_client.scan_iter(match="ai-search:*")]
        if keys:
            redis_client.delete(*keys)
    except Exception:
        # Cache invalidation must never block API startup.
        pass


def _tool_count() -> int:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        count = session.scalar(select(func.count()).select_from(Tool))
        return int(count or 0)


def ensure_catalog_bootstrap() -> None:
    if settings.catalog_bootstrap_mode == "off":
        return

    if _tool_count() > 0:
        clear_catalog_cache()
        return

    if settings.catalog_bootstrap_mode == "seed":
        from app.scripts.seed import run as run_seed

        run_seed()
        clear_catalog_cache()
        return

    from app.scripts.import_aitool_preview import DEFAULT_PAYLOAD_PATH, run as run_import

    if not DEFAULT_PAYLOAD_PATH.exists():
        return

    run_import(
        DEFAULT_PAYLOAD_PATH.resolve(),
        limit=None,
        status_mode="published",
        featured_mode="payload",
        dry_run=False,
    )

    with SessionLocal() as session:
        seed_catalog_views(session)
        session.commit()

    clear_catalog_cache()
