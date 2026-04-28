from __future__ import annotations

import logging
from datetime import UTC, date, datetime
from urllib.parse import urlparse

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session, selectinload

from app.models.models import Category, Ranking, RankingItem, Tag, Tool, ToolCategory, ToolReview, ToolTag
from app.schemas.admin import (
    AdminOverviewRecentToolItem,
    AdminOverviewResponse,
    AdminRankingListItem,
    AdminRankingPayload,
    AdminReviewListItem,
    AdminToolListItem,
    AdminToolPayload,
)
from app.schemas.tool import ToolDetail
from app.services import catalog_service


VALID_TOOL_STATUSES = {"published", "draft", "archived"}
logger = logging.getLogger(__name__)


def _now_date() -> date:
    return datetime.now(UTC).date()


def _ensure_category(db: Session, slug: str, name: str) -> Category:
    category = db.scalar(select(Category).where(Category.slug == slug))
    if category is None:
        category = Category(slug=slug, name=name, description="")
        db.add(category)
        db.flush()
        return category

    category.name = name
    return category


def _sync_tool_tags(db: Session, tool: Tool, tag_names: list[str]) -> None:
    normalized_names = []
    seen = set()
    for item in tag_names:
        value = item.strip()
        if not value or value in seen:
            continue
        seen.add(value)
        normalized_names.append(value)

    existing = {row.tag.name: row for row in tool.tags}
    for name, link in list(existing.items()):
        if name not in normalized_names:
            db.delete(link)

    for name in normalized_names:
        if name in existing:
            continue
        tag = db.scalar(select(Tag).where(Tag.name == name))
        if tag is None:
            tag = Tag(name=name)
            db.add(tag)
            db.flush()
        db.add(ToolTag(tool_id=tool.id, tag_id=tag.id))


def _sync_tool_category(db: Session, tool: Tool, category: Category) -> None:
    for link in list(tool.categories):
        if link.category_id != category.id:
            db.delete(link)

    if not any(link.category_id == category.id for link in tool.categories):
        db.add(ToolCategory(tool_id=tool.id, category_id=category.id))


def _validate_public_http_url(value: str, *, field_name: str) -> None:
    parsed = urlparse(value.strip())
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={field_name: "璇疯緭鍏ユ湁鏁堢殑 http(s) 鍦板潃"},
        )


def _validate_tool_payload(payload: AdminToolPayload) -> None:
    if payload.status not in VALID_TOOL_STATUSES:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Invalid tool status")

    _validate_public_http_url(payload.officialUrl, field_name="officialUrl")

    if (
        payload.priceMinCny is not None
        and payload.priceMaxCny is not None
        and payload.priceMinCny > payload.priceMaxCny
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={"priceMinCny": "最低价格不能大于最高价格"},
        )


def _validate_ranking_payload(payload: AdminRankingPayload) -> None:
    seen_tool_slugs: set[str] = set()
    seen_ranks: set[int] = set()

    for item in payload.items:
        if item.toolSlug in seen_tool_slugs:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=f"Duplicate tool slug in ranking items: {item.toolSlug}",
            )
        if item.rank in seen_ranks:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=f"Duplicate rank in ranking items: {item.rank}",
            )
        seen_tool_slugs.add(item.toolSlug)
        seen_ranks.add(item.rank)


def _commit_with_guard(
    db: Session,
    *,
    action: str,
    failure_detail: str,
    conflict_detail: str | None = None,
) -> None:
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        logger.warning("%s_integrity_error error=%s", action, type(error).__name__)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT if conflict_detail else status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=conflict_detail or failure_detail,
        ) from error
    except SQLAlchemyError as error:
        db.rollback()
        logger.exception("%s_database_error", action)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=failure_detail) from error


def list_tools(db: Session) -> list[AdminToolListItem]:
    rows = db.scalars(select(Tool).order_by(Tool.updated_at.desc())).all()
    return [
        AdminToolListItem(
            id=row.id,
            slug=row.slug,
            name=row.name,
            categoryName=row.category_name,
            status=row.status,
            featured=row.featured,
            score=row.score,
            reviewCount=row.review_count,
            updatedAt=row.updated_at,
        )
        for row in rows
    ]


def get_overview(db: Session) -> AdminOverviewResponse:
    tool_count = int(db.scalar(select(func.count()).select_from(Tool)) or 0)
    draft_tool_count = int(db.scalar(select(func.count()).select_from(Tool).where(Tool.status == "draft")) or 0)
    published_tool_count = int(db.scalar(select(func.count()).select_from(Tool).where(Tool.status == "published")) or 0)
    review_count = int(db.scalar(select(func.count()).select_from(ToolReview)) or 0)
    ranking_count = int(db.scalar(select(func.count()).select_from(Ranking)) or 0)
    recent_tools = db.scalars(select(Tool).order_by(Tool.updated_at.desc()).limit(5)).all()

    return AdminOverviewResponse(
        toolCount=tool_count,
        draftToolCount=draft_tool_count,
        publishedToolCount=published_tool_count,
        reviewCount=review_count,
        rankingCount=ranking_count,
        recentUpdatedTools=[
            AdminOverviewRecentToolItem(
                id=row.id,
                slug=row.slug,
                name=row.name,
                status=row.status,
                updatedAt=row.updated_at,
            )
            for row in recent_tools
        ],
    )


def get_tool_detail(db: Session, tool_id: int) -> ToolDetail:
    tool = db.scalar(
        select(Tool)
        .where(Tool.id == tool_id)
        .options(
            selectinload(Tool.tags).selectinload(ToolTag.tag),
            selectinload(Tool.categories).selectinload(ToolCategory.category),
            selectinload(Tool.reviews).selectinload(ToolReview.user),
        )
    )
    if tool is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tool not found")
    return catalog_service._tool_row_to_detail(tool)


def upsert_tool(db: Session, payload: AdminToolPayload, *, tool_id: int | None = None) -> ToolDetail:
    _validate_tool_payload(payload)

    tool = db.get(Tool, tool_id) if tool_id is not None else None
    if tool is None and tool_id is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tool not found")

    duplicate = db.scalar(select(Tool).where(Tool.slug == payload.slug))
    if duplicate and duplicate.id != tool_id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Tool slug already exists")

    duplicate_name = db.scalar(select(Tool).where(Tool.name == payload.name))
    if duplicate_name and duplicate_name.id != tool_id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Tool name already exists")

    category = _ensure_category(db, payload.categorySlug, payload.categoryName)
    if tool is None:
        tool = Tool(
            slug=payload.slug,
            name=payload.name,
            category_name=payload.categoryName,
            summary=payload.summary,
            description=payload.description,
            editor_comment=payload.editorComment,
            official_url=payload.officialUrl,
            logo_path=payload.logoPath,
            score=0.0,
            review_count=0,
            created_on=payload.createdOn or _now_date(),
            last_verified_at=payload.lastVerifiedAt or _now_date(),
        )
        db.add(tool)
        db.flush()

    tool.slug = payload.slug
    tool.name = payload.name
    tool.category_name = payload.categoryName
    tool.summary = payload.summary
    tool.description = payload.description
    tool.editor_comment = payload.editorComment
    tool.developer = payload.developer
    tool.country = payload.country
    tool.city = payload.city
    tool.price = payload.price
    tool.platforms = payload.platforms
    tool.official_url = payload.officialUrl
    tool.logo_path = payload.logoPath
    tool.featured = payload.featured
    tool.status = payload.status
    tool.pricing_type = payload.pricingType
    tool.price_min_cny = payload.priceMinCny
    tool.price_max_cny = payload.priceMaxCny
    tool.free_allowance_text = payload.freeAllowanceText
    tool.features_json = payload.features
    tool.limitations_json = payload.limitations
    tool.best_for_json = payload.bestFor
    tool.deal_summary = payload.dealSummary
    tool.media_items_json = [item.model_dump() for item in payload.mediaItems]
    tool.access_flags = payload.accessFlags
    tool.created_on = payload.createdOn or tool.created_on or _now_date()
    tool.last_verified_at = payload.lastVerifiedAt or _now_date()

    _sync_tool_category(db, tool, category)
    _sync_tool_tags(db, tool, payload.tags)
    _commit_with_guard(
        db,
        action="admin_upsert_tool",
        failure_detail="宸ュ叿淇濆瓨澶辫触锛岃绋嶅悗閲嶈瘯銆?",
        conflict_detail="宸ュ叿淇℃伅鍐茬獊锛岃妫€鏌?slug 鎴栧悕绉版槸鍚﹂噸澶嶃€?",
    )
    return get_tool_detail(db, tool.id)


def list_reviews(db: Session, *, tool_slug: str | None = None) -> list[AdminReviewListItem]:
    stmt = (
        select(ToolReview)
        .order_by(ToolReview.updated_at.desc())
        .options(selectinload(ToolReview.tool), selectinload(ToolReview.user))
    )
    if tool_slug:
        stmt = stmt.join(Tool, Tool.id == ToolReview.tool_id).where(Tool.slug == tool_slug)
    rows = db.scalars(stmt).all()
    return [
        AdminReviewListItem(
            id=row.id,
            toolId=row.tool_id,
            toolName=row.tool.name if row.tool else "",
            username=row.user.username if row.user else None,
            sourceType=row.source_type,
            status=row.status,
            rating=row.rating,
            title=row.title,
            body=row.body,
            createdAt=row.created_at,
            updatedAt=row.updated_at,
        )
        for row in rows
    ]


def delete_review(db: Session, review_id: int) -> None:
    row = db.get(ToolReview, review_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    tool_id = row.tool_id
    db.delete(row)
    db.flush()
    ratings = db.execute(
        select(func.avg(ToolReview.rating), func.count(ToolReview.id))
        .where(ToolReview.tool_id == tool_id, ToolReview.status == "published", ToolReview.rating.is_not(None))
    ).one()
    tool = db.get(Tool, tool_id)
    if tool is not None:
        tool.score = round(float(ratings[0] or 0.0), 2) if ratings[1] else 0.0
        tool.review_count = int(ratings[1] or 0)
    _commit_with_guard(
        db,
        action="admin_delete_review",
        failure_detail="鍒犻櫎璇勮澶辫触锛岃绋嶅悗閲嶈瘯銆?",
    )


def list_rankings(db: Session) -> list[AdminRankingListItem]:
    rankings = db.scalars(select(Ranking).order_by(Ranking.id)).all()
    items_by_ranking = {
        ranking_id: count
        for ranking_id, count in db.execute(select(RankingItem.ranking_id, func.count(RankingItem.id)).group_by(RankingItem.ranking_id)).all()
    }
    return [
        AdminRankingListItem(
            id=row.id,
            slug=row.slug,
            title=row.title,
            description=row.description,
            itemCount=int(items_by_ranking.get(row.id, 0)),
        )
        for row in rankings
    ]


def get_ranking_payload(db: Session, ranking_id: int) -> AdminRankingPayload:
    ranking = db.get(Ranking, ranking_id)
    if ranking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ranking not found")
    rows = db.scalars(select(RankingItem).where(RankingItem.ranking_id == ranking_id).order_by(RankingItem.rank_order).options(selectinload(RankingItem.tool))).all()
    return AdminRankingPayload(
        slug=ranking.slug,
        title=ranking.title,
        description=ranking.description,
        items=[
            {"toolSlug": row.tool.slug if row.tool else "", "rank": row.rank_order, "reason": row.reason}
            for row in rows
            if row.tool is not None
        ],
    )


def upsert_ranking(db: Session, payload: AdminRankingPayload, *, ranking_id: int | None = None) -> AdminRankingPayload:
    _validate_ranking_payload(payload)
    ranking = db.get(Ranking, ranking_id) if ranking_id is not None else None
    if ranking is None and ranking_id is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ranking not found")

    duplicate = db.scalar(select(Ranking).where(Ranking.slug == payload.slug))
    if duplicate and duplicate.id != ranking_id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ranking slug already exists")

    if ranking is None:
        ranking = Ranking(slug=payload.slug, title=payload.title, description=payload.description)
        db.add(ranking)
        db.flush()

    ranking.slug = payload.slug
    ranking.title = payload.title
    ranking.description = payload.description

    for existing in db.scalars(select(RankingItem).where(RankingItem.ranking_id == ranking.id)).all():
        db.delete(existing)
    db.flush()

    for item in payload.items:
        tool = db.scalar(select(Tool).where(Tool.slug == item.toolSlug))
        if tool is None:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=f"Unknown tool slug: {item.toolSlug}")
        db.add(RankingItem(ranking_id=ranking.id, tool_id=tool.id, rank_order=item.rank, reason=item.reason))

    _commit_with_guard(
        db,
        action="admin_upsert_ranking",
        failure_detail="姒滃崟淇濆瓨澶辫触锛岃绋嶅悗閲嶈瘯銆?",
        conflict_detail="姒滃崟淇℃伅鍐茬獊锛岃妫€鏌?slug 鎴栨帓搴忛」銆?",
    )
    return get_ranking_payload(db, ranking.id)
