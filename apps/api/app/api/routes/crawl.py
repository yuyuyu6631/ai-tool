from fastapi import APIRouter, Query, Depends

from app.services.crawler_service import build_mock_snapshot
from app.services import auth_service

router = APIRouter(dependencies=[Depends(auth_service.current_admin_dependency)])

@router.post("/crawl/jobs")
def create_crawl_job(source_name: str = Query(default="manual", min_length=1, max_length=120)):
    return build_mock_snapshot(source_name)
