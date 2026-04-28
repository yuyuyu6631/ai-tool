from __future__ import annotations

import argparse
import json
from collections import Counter
from datetime import date
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.models import Category, Source, Tag, Tool, ToolCategory, ToolTag


def parse_date(value: str | None) -> date | None:
    if not value:
        return None
    return date.fromisoformat(value)


def ensure_category(session: Session, payload: dict) -> Category:
    row = session.scalar(select(Category).where(Category.slug == payload["slug"]))
    if row is None:
        row = session.scalar(select(Category).where(Category.name == payload["name"]))
    if row is None:
        row = Category(slug=payload["slug"], name=payload["name"], description=payload.get("description") or "")
        session.add(row)
        session.flush()
        return row

    row.slug = payload["slug"]
    row.name = payload["name"]
    row.description = payload.get("description") or ""
    session.flush()
    return row


def ensure_tag(session: Session, payload: dict) -> Tag:
    row = session.scalar(select(Tag).where(Tag.name == payload["name"]))
    if row is None:
        row = Tag(name=payload["name"])
        session.add(row)
        session.flush()
    return row


def sync_payload(payload_path: Path) -> dict[str, int]:
    payload = json.loads(payload_path.read_text(encoding="utf-8"))
    stats: Counter[str] = Counter()

    with SessionLocal() as session:
        categories_by_name: dict[str, Category] = {}
        tags_by_name: dict[str, Tag] = {}

        for item in payload.get("categories", []):
            category = ensure_category(session, item)
            categories_by_name[category.name] = category
            stats["categories_upserted"] += 1

        for item in payload.get("tags", []):
            tag = ensure_tag(session, item)
            tags_by_name[tag.name] = tag
            stats["tags_upserted"] += 1

        tool_tags_by_slug: dict[str, list[str]] = {}
        for item in payload.get("tool_tags", []):
            tool_tags_by_slug.setdefault(item["tool_slug"], []).append(item["tag_name"])

        sources_by_slug: dict[str, list[dict]] = {}
        for item in payload.get("sources", []):
            sources_by_slug.setdefault(item["tool_slug"], []).append(item)

        for item in payload.get("tools", []):
            tool = session.scalar(select(Tool).where(Tool.slug == item["slug"]))
            if tool is None:
                tool = session.scalar(select(Tool).where(Tool.name == item["name"]))

            is_new = tool is None
            if tool is None:
                tool = Tool(
                    slug=item["slug"],
                    name=item["name"],
                    category_name=item["category_name"],
                    summary=item["summary"],
                    description=item["description"],
                    editor_comment=item["editor_comment"],
                    developer=item.get("developer") or "",
                    country=item.get("country") or "",
                    city=item.get("city") or "",
                    price=item.get("price") or "",
                    platforms=item.get("platforms") or "",
                    vpn_required=item.get("vpn_required") or "",
                    access_flags=item.get("access_flags"),
                    official_url=item.get("official_url") or "",
                    logo_path=item.get("logo_path"),
                    logo_status=item.get("logo_status") or "missing",
                    logo_source=item.get("logo_source") or "imported",
                    score=float(item.get("score") or 0),
                    review_count=int(item.get("review_count") or 0),
                    status=item.get("status") or "published",
                    featured=bool(item.get("featured")),
                    pricing_type=item.get("pricing_type") or "unknown",
                    price_min_cny=item.get("price_min_cny"),
                    price_max_cny=item.get("price_max_cny"),
                    free_allowance_text=item.get("free_allowance_text") or "",
                    features_json=item.get("features_json"),
                    limitations_json=item.get("limitations_json"),
                    best_for_json=item.get("best_for_json"),
                    deal_summary=item.get("deal_summary") or "",
                    media_items_json=item.get("media_items_json"),
                    created_on=parse_date(item.get("created_on")) or date.today(),
                    last_verified_at=parse_date(item.get("last_verified_at")) or date.today(),
                )
                session.add(tool)
                session.flush()
            else:
                tool.slug = item["slug"]
                tool.name = item["name"]
                tool.category_name = item["category_name"]
                tool.summary = item["summary"]
                tool.description = item["description"]
                tool.editor_comment = item["editor_comment"]
                tool.developer = item.get("developer") or ""
                tool.country = item.get("country") or ""
                tool.city = item.get("city") or ""
                tool.price = item.get("price") or ""
                tool.platforms = item.get("platforms") or ""
                tool.vpn_required = item.get("vpn_required") or ""
                tool.access_flags = item.get("access_flags")
                tool.official_url = item.get("official_url") or ""
                tool.logo_path = item.get("logo_path")
                tool.logo_status = item.get("logo_status") or "missing"
                tool.logo_source = item.get("logo_source") or "imported"
                tool.score = float(item.get("score") or 0)
                tool.review_count = int(item.get("review_count") or 0)
                tool.status = item.get("status") or "published"
                tool.featured = bool(item.get("featured"))
                tool.pricing_type = item.get("pricing_type") or "unknown"
                tool.price_min_cny = item.get("price_min_cny")
                tool.price_max_cny = item.get("price_max_cny")
                tool.free_allowance_text = item.get("free_allowance_text") or ""
                tool.features_json = item.get("features_json")
                tool.limitations_json = item.get("limitations_json")
                tool.best_for_json = item.get("best_for_json")
                tool.deal_summary = item.get("deal_summary") or ""
                tool.media_items_json = item.get("media_items_json")
                tool.created_on = parse_date(item.get("created_on")) or tool.created_on or date.today()
                tool.last_verified_at = parse_date(item.get("last_verified_at")) or date.today()

            session.flush()
            session.query(ToolCategory).filter(ToolCategory.tool_id == tool.id).delete(synchronize_session=False)
            session.query(ToolTag).filter(ToolTag.tool_id == tool.id).delete(synchronize_session=False)
            session.query(Source).filter(Source.tool_id == tool.id).delete(synchronize_session=False)

            category = categories_by_name.get(item["category_name"])
            if category is None:
                category = ensure_category(
                    session,
                    {
                        "slug": item["category_name"].strip().lower(),
                        "name": item["category_name"],
                        "description": item["category_name"],
                    },
                )
                categories_by_name[category.name] = category
            session.add(ToolCategory(tool_id=tool.id, category_id=category.id))

            for tag_name in tool_tags_by_slug.get(item["slug"], []):
                tag = tags_by_name.get(tag_name)
                if tag is None:
                    tag = ensure_tag(session, {"name": tag_name})
                    tags_by_name[tag.name] = tag
                session.add(ToolTag(tool_id=tool.id, tag_id=tag.id))

            for source in sources_by_slug.get(item["slug"], []):
                session.add(
                    Source(
                        tool_id=tool.id,
                        source_type=source["source_type"],
                        source_url=source["source_url"],
                    )
                )

            stats["tools_created" if is_new else "tools_updated"] += 1

        session.commit()

    return dict(stats)


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync local snapshot payload into the current database.")
    parser.add_argument("--payload", type=Path, required=True)
    args = parser.parse_args()
    result = sync_payload(args.payload.resolve())
    print(json.dumps(result, ensure_ascii=False, sort_keys=True))


if __name__ == "__main__":
    main()
