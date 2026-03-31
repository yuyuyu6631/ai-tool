from fastapi import APIRouter

from app.api.routes import catalog, crawl, recommend

api_router = APIRouter()
api_router.include_router(catalog.router, tags=["catalog"])
api_router.include_router(recommend.router, tags=["recommend"])
api_router.include_router(crawl.router, tags=["crawl"])
