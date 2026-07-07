from __future__ import annotations

from collections import Counter
import logging

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, selectinload

from app.models.models import Tool, ToolReview, User
from app.schemas.tool import (
    ToolRatingSummary,
    ToolReviewAuthor,
    ToolReviewItem,
    ToolReviewsResponse,
    UpsertToolReviewRequest,
)


PUBLIC_REVIEW_STATUS = "published"
logger = logging.getLogger(__name__)


def _build_author(user: User | None) -> ToolReviewAuthor | None:
    if user is None:
        return None
    return ToolReviewAuthor(id=user.id, username=user.username)


def serialize_review(review: ToolReview) -> ToolReviewItem:
    return ToolReviewItem(
        id=review.id,
        toolId=review.tool_id,
        userId=review.user_id,
        sourceType=review.source_type,
        title=review.title,
        body=review.body,
        rating=review.rating,
        createdAt=review.created_at,
        updatedAt=review.updated_at,
        author=_build_author(review.user),
    )


def _load_tool(db: Session, *, tool_slug: str) -> Tool:
    tool = db.scalar(select(Tool).where(Tool.slug == tool_slug))
    if tool is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tool not found")
    return tool


def _rating_summary_from_reviews(reviews: list[ToolReview]) -> ToolRatingSummary:
    ratings = [review.rating for review in reviews if review.rating is not None]
    counter = Counter(str(int(rating)) for rating in ratings)
    review_count = len(ratings)
    average = round(sum(ratings) / review_count, 2) if review_count else 0.0
    distribution = {str(score): counter.get(str(score), 0) for score in range(5, 0, -1)}
    return ToolRatingSummary(average=average, reviewCount=review_count, ratingDistribution=distribution)


def published_reviews_for_tool(db: Session, *, tool_slug: str) -> ToolReviewsResponse:
    tool = _load_tool(db, tool_slug=tool_slug)
    rows = db.scalars(
        select(ToolReview)
        .where(ToolReview.tool_id == tool.id, ToolReview.status == PUBLIC_REVIEW_STATUS)
        .order_by(ToolReview.source_type != "editor", ToolReview.updated_at.desc())
        .options(selectinload(ToolReview.user))
    ).all()

    editor_reviews = [serialize_review(row) for row in rows if row.source_type == "editor"]
    user_reviews = [serialize_review(row) for row in rows if row.source_type == "user"]
    summary = _rating_summary_from_reviews(rows)
    return ToolReviewsResponse(summary=summary, editorReviews=editor_reviews, userReviews=user_reviews)


def current_user_review_for_tool(db: Session, *, tool_slug: str, user: User) -> ToolReviewItem | None:
    tool = _load_tool(db, tool_slug=tool_slug)
    review = db.scalar(
        select(ToolReview)
        .where(ToolReview.tool_id == tool.id, ToolReview.user_id == user.id)
        .options(selectinload(ToolReview.user))
    )
    return serialize_review(review) if review else None


def _recalculate_tool_score(db: Session, tool_id: int) -> None:
    ratings = db.execute(
        select(func.avg(ToolReview.rating), func.count(ToolReview.id))
        .where(
            ToolReview.tool_id == tool_id,
            ToolReview.status == PUBLIC_REVIEW_STATUS,
            ToolReview.rating.is_not(None),
        )
    ).one()
    tool = db.get(Tool, tool_id)
    if tool is None:
        return
    average = float(ratings[0] or 0.0)
    count = int(ratings[1] or 0)
    tool.score = round(average, 2) if count else 0.0
    tool.review_count = count


def upsert_user_review(db: Session, *, tool_slug: str, user: User, payload: UpsertToolReviewRequest) -> ToolReviewItem:
    tool = _load_tool(db, tool_slug=tool_slug)
    review = db.scalar(
        select(ToolReview)
        .where(ToolReview.tool_id == tool.id, ToolReview.user_id == user.id)
        .options(selectinload(ToolReview.user))
    )

    if review is None:
        review = ToolReview(
            tool_id=tool.id,
            user_id=user.id,
            source_type="user",
            status=PUBLIC_REVIEW_STATUS,
        )
        db.add(review)

    review.title = payload.title
    review.body = payload.body
    review.rating = payload.rating
    review.source_type = "user"
    review.status = PUBLIC_REVIEW_STATUS

    db.flush()
    _recalculate_tool_score(db, tool.id)
    try:
        db.commit()
    except SQLAlchemyError as error:
        db.rollback()
        logger.exception("review_upsert_failed tool_slug=%s user_id=%s", tool_slug, user.id)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="评论保存失败，请稍后重试。") from error
    db.refresh(review)
    return serialize_review(review)
