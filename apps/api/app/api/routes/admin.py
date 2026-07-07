from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.admin import (
    AdminMatchPlanListItem,
    AdminMatchPlanPayload,
    AdminMatchPlanPreviewRequest,
    AdminMatchPlanPreviewResponse,
    AdminOverviewResponse,
    AdminRankingListItem,
    AdminRankingPayload,
    AdminReviewListItem,
    AdminToolListItem,
    AdminToolPayload,
)
from app.schemas.tool import ToolDetail
from app.services import admin_service, auth_service, match_plan_service


router = APIRouter(prefix="/admin", dependencies=[Depends(auth_service.current_admin_dependency)])


@router.get("/overview", response_model=AdminOverviewResponse)
def get_overview(db: Session = Depends(get_db)):
    return admin_service.get_overview(db)


@router.get("/tools", response_model=list[AdminToolListItem])
def list_tools(db: Session = Depends(get_db)):
    return admin_service.list_tools(db)


@router.post("/tools", response_model=ToolDetail, status_code=201)
def create_tool(payload: AdminToolPayload, db: Session = Depends(get_db)):
    return admin_service.upsert_tool(db, payload)


@router.get("/tools/{tool_id}", response_model=ToolDetail)
def get_tool(tool_id: int, db: Session = Depends(get_db)):
    return admin_service.get_tool_detail(db, tool_id)


@router.put("/tools/{tool_id}", response_model=ToolDetail)
def update_tool(tool_id: int, payload: AdminToolPayload, db: Session = Depends(get_db)):
    return admin_service.upsert_tool(db, payload, tool_id=tool_id)


@router.get("/reviews", response_model=list[AdminReviewListItem])
def list_reviews(tool_slug: str | None = None, db: Session = Depends(get_db)):
    return admin_service.list_reviews(db, tool_slug=tool_slug)


@router.delete("/reviews/{review_id}", status_code=204)
def delete_review(review_id: int, db: Session = Depends(get_db)):
    admin_service.delete_review(db, review_id)
    return Response(status_code=204)


@router.get("/rankings", response_model=list[AdminRankingListItem])
def list_rankings(db: Session = Depends(get_db)):
    return admin_service.list_rankings(db)


@router.post("/rankings", response_model=AdminRankingPayload, status_code=201)
def create_ranking(payload: AdminRankingPayload, db: Session = Depends(get_db)):
    return admin_service.upsert_ranking(db, payload)


@router.get("/rankings/{ranking_id}", response_model=AdminRankingPayload)
def get_ranking(ranking_id: int, db: Session = Depends(get_db)):
    return admin_service.get_ranking_payload(db, ranking_id)


@router.put("/rankings/{ranking_id}", response_model=AdminRankingPayload)
def update_ranking(ranking_id: int, payload: AdminRankingPayload, db: Session = Depends(get_db)):
    return admin_service.upsert_ranking(db, payload, ranking_id=ranking_id)


@router.get("/match-plans", response_model=list[AdminMatchPlanListItem])
def list_match_plans(db: Session = Depends(get_db)):
    return match_plan_service.list_match_plans(db)


@router.post("/match-plans", response_model=AdminMatchPlanPayload, status_code=201)
def create_match_plan(payload: AdminMatchPlanPayload, db: Session = Depends(get_db)):
    return match_plan_service.upsert_match_plan(db, payload)


@router.get("/match-plans/{plan_id}", response_model=AdminMatchPlanPayload)
def get_match_plan(plan_id: int, db: Session = Depends(get_db)):
    return match_plan_service.get_match_plan_payload(db, plan_id)


@router.put("/match-plans/{plan_id}", response_model=AdminMatchPlanPayload)
def update_match_plan(plan_id: int, payload: AdminMatchPlanPayload, db: Session = Depends(get_db)):
    return match_plan_service.upsert_match_plan(db, payload, plan_id=plan_id)


@router.post("/match-plans/{plan_id}/publish", response_model=AdminMatchPlanPayload)
def publish_match_plan(plan_id: int, db: Session = Depends(get_db)):
    return match_plan_service.publish_match_plan(db, plan_id)


@router.post("/match-plans/{plan_id}/preview", response_model=AdminMatchPlanPreviewResponse)
def preview_match_plan(
    plan_id: int,
    payload: AdminMatchPlanPreviewRequest | None = None,
    db: Session = Depends(get_db),
):
    return match_plan_service.preview_match_plan(db, plan_id, payload or AdminMatchPlanPreviewRequest())
