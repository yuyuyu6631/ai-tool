from contextlib import asynccontextmanager
import logging
import time

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select, text

import app.db.session as session_module
from app.api.router import api_router
from app.core.config import settings
from app.core.errors import register_exception_handlers
from app.core.logging import setup_logging
from app.models.models import Tool, UserSession
from app.services.crawler_service import build_mock_snapshot

scheduler = BackgroundScheduler()
setup_logging()
logger = logging.getLogger(__name__)
request_logger = logging.getLogger("app.request")


def ensure_persistent_database_config() -> tuple[bool, str | None]:
    if settings.is_production_like and not settings.uses_persistent_database:
        return False, "persistent_database_required"
    return True, None


def check_backend_readiness() -> tuple[bool, dict[str, object]]:
    payload: dict[str, object] = {
        "status": "ok",
        "reason": None,
        "detail": "API and database are ready.",
        "checks": {
            "database_config": "pending",
            "database": "pending",
            "catalog": "pending",
            "auth": "pending",
        },
    }

    config_ready, config_reason = ensure_persistent_database_config()
    if not config_ready:
        payload["status"] = "not_ready"
        payload["reason"] = config_reason
        payload["detail"] = "Persistent database configuration is required for this environment."
        payload["checks"]["database_config"] = "error"
        for name, value in list(payload["checks"].items()):
            if value == "pending":
                payload["checks"][name] = "skipped"
        return False, payload

    db = session_module.SessionLocal()
    try:
        payload["checks"]["database_config"] = "ok"
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
            "database_config": "persistent_database_required",
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
        config_ready, config_reason = ensure_persistent_database_config()
        if not config_ready:
            raise RuntimeError(f"Refusing to start without a persistent database: {config_reason}")
        local_scheduler.add_job(build_mock_snapshot, "interval", minutes=60, kwargs={"source_name": "scheduled"})
        local_scheduler.start()
        try:
            yield
        finally:
            local_scheduler.shutdown(wait=False)

    application = FastAPI(title=settings.app_name, lifespan=lifespan)
    register_exception_handlers(application)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allowed_origins,
        allow_origin_regex=settings.cors_allowed_origin_regex,
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.middleware("http")
    async def log_requests(request: Request, call_next):
        started_at = time.perf_counter()
        response = await call_next(request)
        duration_ms = int((time.perf_counter() - started_at) * 1000)
        request_logger.info(
            "request_completed method=%s path=%s status=%s duration_ms=%s",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )
        return response

    application.include_router(api_router, prefix=settings.api_prefix)

    @application.get("/health")
    def health_check():
        return {"status": "ok"}

    @application.get(f"{settings.api_prefix}/health")
    def prefixed_health_check():
        return {"status": "ok"}

    @application.get("/health/ready")
    def readiness_check():
        ready, payload = check_backend_readiness()
        if ready:
            return payload
        return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content=payload)

    logger.info("application_created cors_origins=%s", settings.cors_allowed_origins)
    return application


app = create_app()
