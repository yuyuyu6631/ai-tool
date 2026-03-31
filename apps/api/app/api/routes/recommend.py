from fastapi import APIRouter

from app.schemas.recommend import RecommendItem, RecommendRequest
from app.services.recommendation_service import recommend

router = APIRouter()


@router.post("/recommend", response_model=list[RecommendItem])
def recommend_tools(payload: RecommendRequest):
    return recommend(payload)
