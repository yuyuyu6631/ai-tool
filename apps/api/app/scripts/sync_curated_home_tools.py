from __future__ import annotations

import argparse
import json
from collections import Counter
from datetime import date
from pathlib import Path
from typing import Any

from redis import Redis
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.models import Tool, ToolReview


DEFAULT_PAYLOAD_PATH = Path(__file__).resolve().parents[1] / "data" / "homepage_curated_tools.json"
CACHE_PATTERNS = ("catalog:*", "ai-search:*")
EDITOR_REVIEW_TITLE_PREFIX = "运营核验："


def parse_date(value: str | None) -> date | None:
    if not value:
        return None
    return date.fromisoformat(value)


def normalized_string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]


def update_tool_fields(tool: Tool, item: dict[str, Any], verified_at: date | None) -> None:
    string_fields = (
        "summary",
        "description",
        "developer",
        "country",
        "city",
        "price",
        "platforms",
        "vpn_required",
        "pricing_type",
        "free_allowance_text",
        "deal_summary",
    )
    for field in string_fields:
        if field in item:
            setattr(tool, field, str(item.get(field) or ""))

    if "price_min_cny" in item:
        tool.price_min_cny = item.get("price_min_cny")
    if "price_max_cny" in item:
        tool.price_max_cny = item.get("price_max_cny")
    if "access_flags" in item:
        tool.access_flags = item.get("access_flags")

    tool.features_json = normalized_string_list(item.get("features"))
    tool.limitations_json = normalized_string_list(item.get("limitations"))
    tool.best_for_json = normalized_string_list(item.get("best_for"))

    if verified_at is not None:
        tool.last_verified_at = verified_at


def upsert_editor_review(session: Session, tool: Tool, item: dict[str, Any]) -> bool:
    payload = item.get("editor_review")
    if not isinstance(payload, dict):
        return False

    expected_audience = str(payload.get("audience") or "").strip()
    expected_task = str(payload.get("task") or "").strip()
    editor_reviews = list(
        session.scalars(select(ToolReview).where(ToolReview.tool_id == tool.id, ToolReview.source_type == "editor"))
    )
    reviews = [
        review
        for review in editor_reviews
        if review.title.startswith(EDITOR_REVIEW_TITLE_PREFIX)
        or (review.audience == expected_audience and review.task == expected_task)
    ]
    review = reviews[0] if reviews else None
    if review is None:
        review = ToolReview(tool_id=tool.id, source_type="editor", status="published")
        session.add(review)
    for duplicate in reviews[1:]:
        session.delete(duplicate)

    review.status = "published"
    review.rating = None
    review.title = f"{EDITOR_REVIEW_TITLE_PREFIX}{str(payload.get('title') or '摘要').strip()}"
    review.body = str(payload.get("body") or "").strip()
    review.audience = str(payload.get("audience") or "").strip()
    review.task = str(payload.get("task") or "").strip()
    review.pros_json = normalized_string_list(item.get("features"))
    review.cons_json = normalized_string_list(item.get("limitations"))
    review.pitfalls_json = normalized_string_list(item.get("limitations"))
    return True


def clear_catalog_cache() -> int:
    try:
        client = Redis.from_url(settings.redis_url, decode_responses=True, socket_connect_timeout=1, socket_timeout=1)
        keys: list[str] = []
        for pattern in CACHE_PATTERNS:
            keys.extend(client.scan_iter(match=pattern))
        if keys:
            client.delete(*keys)
        return len(keys)
    except Exception:
        return 0


def sync_payload(payload_path: Path, *, dry_run: bool) -> dict[str, int]:
    payload = json.loads(payload_path.read_text(encoding="utf-8"))
    verified_at = parse_date(payload.get("generated_at"))
    stats: Counter[str] = Counter()

    with SessionLocal() as session:
        for item in payload.get("tools", []):
            slug = str(item.get("slug") or "").strip()
            if not slug:
                stats["skipped"] += 1
                continue

            tool = session.scalar(select(Tool).where(Tool.slug == slug))
            if tool is None:
                stats["missing"] += 1
                continue

            update_tool_fields(tool, item, verified_at)
            stats["tools_updated"] += 1
            if upsert_editor_review(session, tool, item):
                stats["editor_reviews_upserted"] += 1

        if dry_run:
            session.rollback()
        else:
            session.commit()

    if not dry_run:
        stats["cache_keys_deleted"] = clear_catalog_cache()

    return dict(stats)


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync curated homepage tool metadata into the database.")
    parser.add_argument("--payload", type=Path, default=DEFAULT_PAYLOAD_PATH)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    result = sync_payload(args.payload.resolve(), dry_run=args.dry_run)
    print(json.dumps(result, ensure_ascii=False, sort_keys=True))


if __name__ == "__main__":
    main()
