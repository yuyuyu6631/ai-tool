from contextlib import asynccontextmanager

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select, text

import app.db.session as session_module
from app.api.router import api_router
from app.core.config import settings
from app.models.models import Tool, UserSession
from app.services.bootstrap_service import ensure_catalog_bootstrap
from app.services.crawler_service import build_mock_snapshot

scheduler = BackgroundScheduler()


def check_backend_readiness() -> tuple[bool, dict[str, object]]:
    payload: dict[str, object] = {
        "status": "ok",
        "reason": None,
        "detail": "API and database are ready.",
        "checks": {
            "database": "pending",
            "catalog": "pending",
            "auth": "pending",
        },
    }

    db = session_module.SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        payload["checks"]["database"] = "ok"

        db.execute(select(Tool.id).limit(1))
        payload["checks"]["catalog"] = "ok"

        db.execute(select(UserSession.id).limit(1))
        payload["checks"]["auth"] = "ok"

        return True, payload
    except Exception as exc:
        failed_check = next((name for name, value in payload["checks"].items() if value != "ok"), "database")
        reason_map = {
            "database": "database_unavailable",
            "catalog": "catalog_query_failed",
            "auth": "auth_query_failed",
        }
        payload["status"] = "not_ready"
        payload["reason"] = reason_map.get(failed_check, "database_unavailable")
        payload["detail"] = f"{failed_check} readiness check failed: {exc}"
        payload["checks"][failed_check] = "error"
        for name, value in list(payload["checks"].items()):
            if value == "pending":
                payload["checks"][name] = "skipped"
        return False, payload
    finally:
        db.close()


def create_app() -> FastAPI:
    local_scheduler = BackgroundScheduler()

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        ensure_catalog_bootstrap()
        local_scheduler.add_job(build_mock_snapshot, "interval", minutes=60, kwargs={"source_name": "scheduled"})
        local_scheduler.start()
        try:
            yield
        finally:
            local_scheduler.shutdown(wait=False)

    application = FastAPI(title=settings.app_name, lifespan=lifespan)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allowed_origins,
        allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(:\d+)?$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.include_router(api_router, prefix=settings.api_prefix)

    @application.get("/health")
    def health_check():
        return {"status": "ok"}

    @application.get("/health/ready")
    def readiness_check():
        ready, payload = check_backend_readiness()
        if ready:
            return payload
        return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content=payload)

    @application.post("/health/bootstrap")
    def bootstrap_catalog():
        db = session_module.SessionLocal()
        try:
            before = int(db.scalar(select(func.count()).select_from(Tool)) or 0)
            ensure_catalog_bootstrap()
            after = int(db.scalar(select(func.count()).select_from(Tool)) or 0)
            return {
                "status": "ok",
                "catalogBootstrapMode": settings.catalog_bootstrap_mode,
                "cacheEnabled": settings.cache_enabled,
                "before": before,
                "after": after,
            }
        finally:
            db.close()

    return application


app = create_app()
