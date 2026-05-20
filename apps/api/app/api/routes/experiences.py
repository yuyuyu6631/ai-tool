from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.experience import (
    CreateExperienceCommentRequest,
    CreateExperiencePostRequest,
    ExperienceCommentItem,
    ExperienceListResponse,
    ExperiencePostItem,
)
from app.services import auth_service
from app.services.experience_service import (
    create_experience_comment,
    create_experience_post,
    get_experience_post,
    list_experience_comments,
    list_experience_posts,
)


router = APIRouter(prefix="/experiences")


@router.get("", response_model=ExperienceListResponse)
def get_experiences(
    channel: str | None = None,
    board: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    db: Session = Depends(get_db),
):
    return list_experience_posts(db, channel=channel, board=board, page=page, page_size=page_size)


@router.post("", response_model=ExperiencePostItem, status_code=201)
def post_experience(
    payload: CreateExperiencePostRequest,
    db: Session = Depends(get_db),
    user=Depends(auth_service.current_user_dependency),
):
    return create_experience_post(db, user=user, payload=payload)


@router.get("/{slug}", response_model=ExperiencePostItem)
def get_experience(slug: str, db: Session = Depends(get_db)):
    return get_experience_post(db, slug=slug)


@router.get("/{slug}/comments", response_model=list[ExperienceCommentItem])
def get_comments(slug: str, db: Session = Depends(get_db)):
    return list_experience_comments(db, slug=slug)


@router.post("/{slug}/comments", response_model=ExperienceCommentItem, status_code=201)
def post_comment(
    slug: str,
    payload: CreateExperienceCommentRequest,
    db: Session = Depends(get_db),
    user=Depends(auth_service.current_user_dependency),
):
    return create_experience_comment(db, slug=slug, user=user, payload=payload)
