from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.tool import ToolReviewItem, ToolReviewsResponse, UpsertToolReviewRequest
from app.services import auth_service
from app.services.review_service import current_user_review_for_tool, published_reviews_for_tool, upsert_user_review


router = APIRouter(prefix="/tools/{tool_slug}/reviews")


@router.get("", response_model=ToolReviewsResponse)
def get_reviews(tool_slug: str, db: Session = Depends(get_db)):
    return published_reviews_for_tool(db, tool_slug=tool_slug)


@router.get("/me", response_model=ToolReviewItem | None)
def get_my_review(tool_slug: str, db: Session = Depends(get_db), user=Depends(auth_service.current_user_dependency)):
    return current_user_review_for_tool(db, tool_slug=tool_slug, user=user)


@router.put("/me", response_model=ToolReviewItem)
def put_my_review(
    tool_slug: str,
    payload: UpsertToolReviewRequest,
    db: Session = Depends(get_db),
    user=Depends(auth_service.current_user_dependency),
):
    return upsert_user_review(db, tool_slug=tool_slug, user=user, payload=payload)
