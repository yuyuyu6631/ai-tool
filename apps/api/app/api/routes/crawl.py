from fastapi import APIRouter

from app.services.crawler_service import build_mock_snapshot

router = APIRouter()


@router.post("/crawl/jobs")
def create_crawl_job(source_name: str = "manual"):
    return build_mock_snapshot(source_name)
