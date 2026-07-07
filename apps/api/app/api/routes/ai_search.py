from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.ai_search import AiSearchResponse
from app.services.ai_search_service import search_with_ai

router = APIRouter()


@router.get("/ai-search", response_model=AiSearchResponse)
def get_ai_search(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    category: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    price: str | None = Query(default=None),
    access: str | None = Query(default=None),
    price_range: str | None = Query(default=None),
    sort: str = Query(default="featured"),
    view: str = Query(default="hot"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=9, ge=1, le=24),
):
    return search_with_ai(
        db=db,
        query=q,
        category=category,
        tag=tag,
        price=price,
        access=access,
        price_range=price_range,
        sort=sort,
        view=view,
        page=page,
        page_size=page_size,
    )
