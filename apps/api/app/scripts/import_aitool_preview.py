from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

from sqlalchemy.orm import Session

from app.core.paths import API_ROOT, WORKSPACE_ROOT
from app.db.session import Base, SessionLocal, engine
from app.models.models import Category, Source, Tag, Tool, ToolCategory, ToolTag
from app.services.logo_assets import LOGO_SOURCE_IMPORTED, normalize_logo_path, resolve_logo_status


IMPORT_MARKER = "[import-preview]"
DEFAULT_PAYLOAD_PATH = API_ROOT / "app" / "data" / "db_import_payload.json"
if not DEFAULT_PAYLOAD_PATH.exists():
    DEFAULT_PAYLOAD_PATH = (
        WORKSPACE_ROOT
        / "archive"
        / "drawer"
        / "tooling-assets"
        / "apigetxlsx"
        / "aitool"
        / "manifests"
        / "db_import_payload.json"
    )
VALID_STATUSES = {"published", "draft", "archived"}
SLUG_MAX_LENGTH = 120


def ensure_category(session: Session, payload: dict) -> Category:
    existing = session.query(Category).filter(Category.slug == payload["slug"]).first()
    if existing:
        return existing
    category = Category(
        slug=payload["slug"],
        name=payload["name"],
        description=payload["description"],
    )
    session.add(category)
    session.flush()
    return category


def ensure_tag(session: Session, payload: dict) -> Tag:
    existing = session.query(Tag).filter(Tag.name == payload["name"]).first()
    if existing:
        return existing
    tag = Tag(name=payload["name"])
    session.add(tag)
    session.flush()
    return tag


def parse_date(value: str | date) -> date:
    if isinstance(value, date):
        return value
    return date.fromisoformat(value)


def normalize_editor_comment(value: str) -> str:
    editor_comment = value.strip()
    if IMPORT_MARKER not in editor_comment:
        editor_comment = f"{IMPORT_MARKER} {editor_comment}".strip()
    return editor_comment


def extract_import_meta(item: dict) -> dict[str, str]:
    import_meta = item.get("import_meta") or {}
    return {
        "developer": str(import_meta.get("developer") or ""),
        "country": str(import_meta.get("country") or ""),
        "city": str(import_meta.get("city") or ""),
        "price": str(import_meta.get("price") or ""),
        "platforms": str(import_meta.get("platforms") or ""),
        "vpn_required": str(import_meta.get("vpn_required") or ""),
    }


def slugify_text(value: str) -> str:
    lowered = value.strip().lower()
    lowered = re.sub(r"https?://", "", lowered)
    lowered = re.sub(r"[^a-z0-9\u4e00-\u9fff]+", "-", lowered)
    lowered = lowered.strip("-")
    return lowered or "tool"


def sanitize_url(raw_url: str) -> str:
    if not raw_url:
        return ""
    if raw_url.startswith(("http://", "https://")):
        return raw_url
    if "." in raw_url and " " not in raw_url:
        return f"https://{raw_url}"
    return ""


def slug_from_url(raw_url: str) -> str:
    sanitized = sanitize_url(raw_url)
    if not sanitized:
        return ""
    parsed = urlparse(sanitized)
    host = parsed.netloc.lower().replace("www.", "")
    path = parsed.path.strip("/").lower()
    path = re.sub(r"[^a-z0-9/-]+", "-", path)
    host = re.sub(r"[^a-z0-9.-]+", "-", host)
    pieces = [piece for piece in [host.split(".")[0] if host else "", path.split("/")[0] if path else ""] if piece]
    candidate = "-".join(pieces).strip("-")
    return candidate or ""


def build_normalized_slug(raw_slug: str, name: str, raw_url: str, used_slugs: set[str]) -> tuple[str, bool]:
    candidates = [slugify_text(raw_slug), slug_from_url(raw_url), slugify_text(name)]
    base = next((candidate for candidate in candidates if candidate), "tool")
    truncated = base[:SLUG_MAX_LENGTH].rstrip("-") or "tool"
    changed = truncated != raw_slug
    slug = truncated
    suffix_index = 2
    while slug in used_slugs:
        suffix = f"-{suffix_index}"
        slug = f"{truncated[:SLUG_MAX_LENGTH - len(suffix)].rstrip('-')}{suffix}"
        changed = True
        suffix_index += 1
    used_slugs.add(slug)
    return slug, changed


def resolve_import_status(item: dict, status_mode: str) -> str:
    if status_mode == "published":
        return "published"
    if status_mode == "draft":
        return "draft"
    raw_status = str(item.get("status") or "").strip().lower()
    return raw_status if raw_status in VALID_STATUSES else "draft"


def resolve_featured_flag(item: dict, featured_mode: str, resolved_status: str) -> bool:
    if featured_mode == "published":
        return resolved_status == "published"
    if featured_mode == "none":
        return False
    return bool(item.get("featured")) and resolved_status == "published"


def apply_tool_payload(
    session: Session,
    *,
    tool: Tool,
    item: dict,
    normalized_slug: str,
    category_by_name: dict[str, Category],
    tag_by_name: dict[str, Tag],
    tool_tags_by_slug: dict[str, list[str]],
    sources_by_slug: dict[str, list[dict]],
    status_mode: str,
    featured_mode: str,
) -> str:
    resolved_status = resolve_import_status(item, status_mode)
    resolved_featured = resolve_featured_flag(item, featured_mode, resolved_status)
    import_meta = extract_import_meta(item)

    tool.slug = normalized_slug
    tool.name = item["name"]
    tool.category_name = item["category_name"]
    tool.summary = item["summary"]
    tool.description = item["description"]
    tool.editor_comment = normalize_editor_comment(item["editor_comment"])
    tool.developer = import_meta["developer"]
    tool.country = import_meta["country"]
    tool.city = import_meta["city"]
    tool.price = import_meta["price"]
    tool.platforms = import_meta["platforms"]
    tool.vpn_required = import_meta["vpn_required"]
    tool.official_url = sanitize_url(item["official_url"])
    tool.logo_path = normalize_logo_path(item["logo_path"])
    tool.logo_status = resolve_logo_status(item["logo_path"])
    tool.logo_source = LOGO_SOURCE_IMPORTED
    tool.score = item["score"]
    tool.status = resolved_status
    tool.featured = resolved_featured
    tool.created_on = parse_date(item["created_on"])
    tool.last_verified_at = parse_date(item["last_verified_at"])

    session.flush()
    session.query(ToolCategory).filter(ToolCategory.tool_id == tool.id).delete()
    session.query(ToolTag).filter(ToolTag.tool_id == tool.id).delete()
    session.query(Source).filter(Source.tool_id == tool.id).delete()

    category = category_by_name.get(item["category_name"])
    if category:
        session.add(ToolCategory(tool_id=tool.id, category_id=category.id))

    for tag_name in tool_tags_by_slug.get(item["slug"], []):
        tag = tag_by_name.get(tag_name)
        if tag:
            session.add(ToolTag(tool_id=tool.id, tag_id=tag.id))

    for source in sources_by_slug.get(item["slug"], []):
        session.add(
            Source(
                tool_id=tool.id,
                source_type=source["source_type"],
                source_url=source["source_url"],
            )
        )

    return resolved_status


def run(
    payload_path: Path,
    *,
    limit: int | None,
    status_mode: str,
    featured_mode: str,
    dry_run: bool,
) -> None:
    payload = json.loads(payload_path.read_text(encoding="utf-8"))
    Base.metadata.create_all(bind=engine)

    categories = payload.get("categories", [])
    tags = payload.get("tags", [])
    tools = payload.get("tools", [])
    if limit is not None:
        tools = tools[:limit]
    tool_tags = payload.get("tool_tags", [])
    sources = payload.get("sources", [])

    tool_tags_by_slug: dict[str, list[str]] = {}
    for item in tool_tags:
        tool_tags_by_slug.setdefault(item["tool_slug"], []).append(item["tag_name"])

    sources_by_slug: dict[str, list[dict]] = {}
    for item in sources:
        sources_by_slug.setdefault(item["tool_slug"], []).append(item)

    status_counter: Counter[str] = Counter()
    normalized_counter: Counter[str] = Counter()
    imported = 0
    updated = 0

    with SessionLocal() as session:
        category_by_name: dict[str, Category] = {
            item["name"]: ensure_category(session, item) for item in categories
        }
        tag_by_name: dict[str, Tag] = {item["name"]: ensure_tag(session, item) for item in tags}
        used_slugs = {slug for slug, in session.query(Tool.slug).all()}

        for item in tools:
            tool = session.query(Tool).filter(Tool.slug == item["slug"]).first()
            if tool is None:
                tool = session.query(Tool).filter(Tool.name == item["name"]).first()
            previous_slug = tool.slug if tool is not None else None
            slug_pool = used_slugs if tool is None else {slug for slug in used_slugs if slug != tool.slug}
            normalized_slug, slug_changed = build_normalized_slug(item["slug"], item["name"], item["official_url"], slug_pool)
            if tool is None:
                tool = session.query(Tool).filter(Tool.slug == normalized_slug).first()
            is_new = tool is None
            if is_new:
                tool = Tool(
                    slug=normalized_slug,
                    name=item["name"],
                    category_name=item["category_name"],
                    summary=item["summary"],
                    description=item["description"],
                    editor_comment="",
                    developer="",
                    country="",
                    city="",
                    price="",
                    platforms="",
                    vpn_required="",
                    official_url=sanitize_url(item["official_url"]),
                    logo_path=None,
                    logo_status="missing",
                    logo_source=LOGO_SOURCE_IMPORTED,
                    score=item["score"],
                    status="draft",
                    featured=False,
                    created_on=parse_date(item["created_on"]),
                    last_verified_at=parse_date(item["last_verified_at"]),
                )
                session.add(tool)
                session.flush()

            resolved_status = apply_tool_payload(
                session,
                tool=tool,
                item=item,
                normalized_slug=normalized_slug,
                category_by_name=category_by_name,
                tag_by_name=tag_by_name,
                tool_tags_by_slug=tool_tags_by_slug,
                sources_by_slug=sources_by_slug,
                status_mode=status_mode,
                featured_mode=featured_mode,
            )
            status_counter[resolved_status] += 1
            if slug_changed:
                normalized_counter["slug_rewritten"] += 1
            if not sanitize_url(item["official_url"]):
                normalized_counter["url_cleared"] += 1
            if previous_slug and previous_slug != normalized_slug:
                used_slugs.discard(previous_slug)
            used_slugs.add(normalized_slug)

            if is_new:
                imported += 1
            else:
                updated += 1

        if dry_run:
            session.rollback()
        else:
            session.commit()

    action = "Dry run complete" if dry_run else "Import complete"
    print(
        f"{action}. imported={imported} updated={updated} total={imported + updated} "
        f"status_mode={status_mode} featured_mode={featured_mode} "
        f"published={status_counter['published']} draft={status_counter['draft']} archived={status_counter['archived']} "
        f"slug_rewritten={normalized_counter['slug_rewritten']} url_cleared={normalized_counter['url_cleared']}"
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Import aitool JSON into the database with controllable status strategy.")
    parser.add_argument("--payload", type=Path, default=DEFAULT_PAYLOAD_PATH)
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Number of tool rows to import. Use 0 for all rows.",
    )
    parser.add_argument(
        "--status-mode",
        choices=("payload", "published", "draft"),
        default="payload",
        help="How imported rows should be assigned public status.",
    )
    parser.add_argument(
        "--featured-mode",
        choices=("payload", "published", "none"),
        default="payload",
        help="How imported rows should be assigned featured flag.",
    )
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    limit = None if args.limit == 0 else args.limit
    run(
        args.payload.resolve(),
        limit=limit,
        status_mode=args.status_mode,
        featured_mode=args.featured_mode,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    main()
