from __future__ import annotations

import logging
import re
import unicodedata
from datetime import UTC, datetime
from typing import Iterable, Sequence, TypeVar

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session, selectinload

from app.models.models import MatchPlan, MatchPlanTool, Tool
from app.schemas.admin import (
    AdminMatchPlanListItem,
    AdminMatchPlanPayload,
    AdminMatchPlanPreviewRequest,
    AdminMatchPlanPreviewResponse,
    AdminMatchPlanToolPreviewItem,
    AdminOverviewRecentMatchPlanItem,
)
from app.services.cache_service import clear_recommendation_caches


VALID_MATCH_PLAN_STATUSES = {"draft", "published", "archived"}
PUBLIC_TOOL_STATUS = "published"
logger = logging.getLogger(__name__)
T = TypeVar("T")


def _normalize_text(value: str | None) -> str:
    normalized = unicodedata.normalize("NFKC", value or "").strip().casefold()
    return re.sub(r"\s+", " ", normalized)


def _normalize_keywords(values: Iterable[str]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for value in values:
        normalized = _normalize_text(value)
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        result.append(normalized[:80])
    return result[:20]


def _plan_keywords(plan: MatchPlan) -> list[str]:
    values = list(plan.trigger_keywords_json or [])
    values.extend([plan.persona, plan.scenario])
    return _normalize_keywords(values)


def _build_match_text(*, query: str, scenario: str | None = None, tags: Sequence[str] | None = None) -> str:
    return _normalize_text(" ".join([query, scenario or "", " ".join(tags or [])]))


def _matched_keywords(plan: MatchPlan, *, query: str, scenario: str | None = None, tags: Sequence[str] | None = None) -> list[str]:
    text = _build_match_text(query=query, scenario=scenario, tags=tags)
    if not text:
        return []
    return [keyword for keyword in _plan_keywords(plan) if keyword and keyword in text]


def _plan_to_list_item(plan: MatchPlan) -> AdminMatchPlanListItem:
    return AdminMatchPlanListItem(
        id=plan.id,
        slug=plan.slug,
        title=plan.title,
        status=plan.status,
        persona=plan.persona,
        scenario=plan.scenario,
        triggerKeywords=list(plan.trigger_keywords_json or []),
        toolCount=len(plan.tools),
        sortOrder=plan.sort_order,
        updatedAt=plan.updated_at,
        publishedAt=plan.published_at,
    )


def _payload_from_plan(plan: MatchPlan) -> AdminMatchPlanPayload:
    ordered_tools = sorted(plan.tools, key=lambda item: (item.sort_order, item.id))
    return AdminMatchPlanPayload(
        slug=plan.slug,
        title=plan.title,
        description=plan.description,
        persona=plan.persona,
        scenario=plan.scenario,
        triggerKeywords=list(plan.trigger_keywords_json or []),
        status=plan.status,
        sortOrder=plan.sort_order,
        tools=[
            {
                "toolSlug": item.tool.slug if item.tool else "",
                "reason": item.reason,
                "sortOrder": item.sort_order,
                "weight": item.weight,
            }
            for item in ordered_tools
            if item.tool is not None
        ],
    )


def _load_plan(db: Session, plan_id: int) -> MatchPlan:
    plan = db.scalar(
        select(MatchPlan)
        .where(MatchPlan.id == plan_id)
        .options(selectinload(MatchPlan.tools).selectinload(MatchPlanTool.tool))
    )
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match plan not found")
    return plan


def list_match_plans(db: Session) -> list[AdminMatchPlanListItem]:
    rows = db.scalars(
        select(MatchPlan)
        .order_by(MatchPlan.sort_order, MatchPlan.updated_at.desc())
        .options(selectinload(MatchPlan.tools))
    ).all()
    return [_plan_to_list_item(row) for row in rows]


def get_match_plan_payload(db: Session, plan_id: int) -> AdminMatchPlanPayload:
    return _payload_from_plan(_load_plan(db, plan_id))


def _validate_payload(db: Session, payload: AdminMatchPlanPayload, *, plan_id: int | None = None) -> None:
    if payload.status not in VALID_MATCH_PLAN_STATUSES:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Invalid match plan status")

    duplicate = db.scalar(select(MatchPlan).where(MatchPlan.slug == payload.slug))
    if duplicate and duplicate.id != plan_id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Match plan slug already exists")

    seen: set[str] = set()
    for item in payload.tools:
        if item.toolSlug in seen:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=f"Duplicate tool slug in match plan: {item.toolSlug}",
            )
        seen.add(item.toolSlug)


def upsert_match_plan(db: Session, payload: AdminMatchPlanPayload, *, plan_id: int | None = None) -> AdminMatchPlanPayload:
    _validate_payload(db, payload, plan_id=plan_id)
    plan = db.get(MatchPlan, plan_id) if plan_id is not None else None
    if plan is None and plan_id is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match plan not found")
    if plan is None:
        plan = MatchPlan(slug=payload.slug, title=payload.title)
        db.add(plan)
        db.flush()

    plan.slug = payload.slug
    plan.title = payload.title
    plan.description = payload.description
    plan.persona = payload.persona
    plan.scenario = payload.scenario
    plan.trigger_keywords_json = _normalize_keywords(payload.triggerKeywords)
    plan.status = payload.status if payload.status != "published" else "draft"
    plan.sort_order = payload.sortOrder
    if plan.status != "published":
        plan.published_at = None

    for existing in db.scalars(select(MatchPlanTool).where(MatchPlanTool.match_plan_id == plan.id)).all():
        db.delete(existing)
    db.flush()

    for index, item in enumerate(payload.tools):
        tool = db.scalar(select(Tool).where(Tool.slug == item.toolSlug))
        if tool is None:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=f"Unknown tool slug: {item.toolSlug}")
        db.add(
            MatchPlanTool(
                match_plan_id=plan.id,
                tool_id=tool.id,
                reason=item.reason,
                sort_order=item.sortOrder if item.sortOrder else index,
                weight=item.weight,
            )
        )

    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Match plan conflicts with existing data") from error
    except SQLAlchemyError as error:
        db.rollback()
        logger.exception("match_plan_upsert_database_error")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Match plan save failed") from error

    return get_match_plan_payload(db, plan.id)


def _validate_publishable(plan: MatchPlan) -> None:
    if not plan.tools:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Published match plan requires at least one tool")
    invalid = [
        item.tool.slug if item.tool else str(item.tool_id)
        for item in plan.tools
        if item.tool is None or item.tool.status != PUBLIC_TOOL_STATUS
    ]
    if invalid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Published match plan contains unavailable tools: {', '.join(invalid)}",
        )


def publish_match_plan(db: Session, plan_id: int) -> AdminMatchPlanPayload:
    plan = _load_plan(db, plan_id)
    _validate_publishable(plan)
    plan.status = "published"
    plan.published_at = datetime.now(UTC)
    try:
        db.commit()
    except SQLAlchemyError as error:
        db.rollback()
        logger.exception("match_plan_publish_database_error")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Match plan publish failed") from error
    clear_recommendation_caches()
    return get_match_plan_payload(db, plan.id)


def preview_match_plan(db: Session, plan_id: int, payload: AdminMatchPlanPreviewRequest) -> AdminMatchPlanPreviewResponse:
    plan = _load_plan(db, plan_id)
    matched = _matched_keywords(plan, query=payload.query, scenario=payload.scenario, tags=payload.tags)
    tools = [
        AdminMatchPlanToolPreviewItem(
            toolSlug=item.tool.slug if item.tool else "",
            toolName=item.tool.name if item.tool else "",
            reason=item.reason,
            sortOrder=item.sort_order,
            weight=item.weight,
            status=item.tool.status if item.tool else "missing",
            available=item.tool is not None and item.tool.status == PUBLIC_TOOL_STATUS,
            issue=None if item.tool is not None and item.tool.status == PUBLIC_TOOL_STATUS else "工具不存在或未发布",
        )
        for item in sorted(plan.tools, key=lambda row: (row.sort_order, row.id))
    ]
    warnings = [f"{item.toolSlug}: {item.issue}" for item in tools if item.issue]
    if payload.query and not matched:
        warnings.append("当前预览查询未命中该策略关键词")
    return AdminMatchPlanPreviewResponse(
        planId=plan.id,
        matched=bool(matched),
        matchedKeywords=matched,
        tools=tools,
        warnings=warnings,
    )


def count_match_plans(db: Session) -> tuple[int, int, list[AdminOverviewRecentMatchPlanItem]]:
    total = int(db.scalar(select(func.count()).select_from(MatchPlan)) or 0)
    published = int(db.scalar(select(func.count()).select_from(MatchPlan).where(MatchPlan.status == "published")) or 0)
    recent = db.scalars(
        select(MatchPlan)
        .where(MatchPlan.status == "published")
        .order_by(MatchPlan.published_at.desc(), MatchPlan.updated_at.desc())
        .limit(5)
    ).all()
    return total, published, [
        AdminOverviewRecentMatchPlanItem(
            id=row.id,
            slug=row.slug,
            title=row.title,
            publishedAt=row.published_at,
        )
        for row in recent
    ]


def _matching_published_plans(
    db: Session,
    *,
    query: str,
    scenario: str | None = None,
    tags: Sequence[str] | None = None,
) -> list[tuple[MatchPlan, list[str]]]:
    rows = db.scalars(
        select(MatchPlan)
        .where(MatchPlan.status == "published")
        .order_by(MatchPlan.sort_order, MatchPlan.updated_at.desc())
        .options(selectinload(MatchPlan.tools).selectinload(MatchPlanTool.tool))
    ).all()
    matches: list[tuple[MatchPlan, list[str]]] = []
    for plan in rows:
        keywords = _matched_keywords(plan, query=query, scenario=scenario, tags=tags)
        if keywords:
            matches.append((plan, keywords))
    return matches


def apply_match_plan_boost(
    db: Session,
    *,
    query: str,
    scenario: str | None = None,
    tags: Sequence[str] | None = None,
    items: Sequence[T],
) -> tuple[list[T], dict[str, str]]:
    if not items:
        return [], {}

    matches = _matching_published_plans(db, query=query, scenario=scenario, tags=tags)
    if not matches:
        return list(items), {}

    boost_by_slug: dict[str, tuple[int, str]] = {}
    for plan, _ in matches:
        for link in plan.tools:
            if link.tool is None or link.tool.status != PUBLIC_TOOL_STATUS:
                continue
            boost = 1_000_000 - (plan.sort_order * 10_000) - (link.sort_order * 100) + link.weight
            current = boost_by_slug.get(link.tool.slug)
            if current is None or boost > current[0]:
                boost_by_slug[link.tool.slug] = (boost, link.reason)

    if not boost_by_slug:
        return list(items), {}

    indexed = list(enumerate(items))

    def sort_key(pair: tuple[int, T]) -> tuple[int, int]:
        index, item = pair
        slug = getattr(item, "slug", "")
        boost = boost_by_slug.get(slug)
        if boost is None:
            return (0, -index)
        return (boost[0], -index)

    ordered = [item for _, item in sorted(indexed, key=sort_key, reverse=True)]
    reasons = {slug: reason for slug, (_, reason) in boost_by_slug.items() if reason}
    return ordered, reasons
