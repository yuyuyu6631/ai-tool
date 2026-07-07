import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


logger = logging.getLogger(__name__)


def _status_code_to_error_code(status_code: int) -> str:
    return {
        status.HTTP_400_BAD_REQUEST: "bad_request",
        status.HTTP_401_UNAUTHORIZED: "unauthorized",
        status.HTTP_403_FORBIDDEN: "forbidden",
        status.HTTP_404_NOT_FOUND: "not_found",
        status.HTTP_409_CONFLICT: "conflict",
        status.HTTP_422_UNPROCESSABLE_CONTENT: "validation_error",
        status.HTTP_500_INTERNAL_SERVER_ERROR: "internal_server_error",
        status.HTTP_503_SERVICE_UNAVAILABLE: "service_unavailable",
    }.get(status_code, "request_failed")


def _status_code_to_message(status_code: int) -> str:
    return {
        status.HTTP_400_BAD_REQUEST: "请求不合法",
        status.HTTP_401_UNAUTHORIZED: "登录状态无效或已过期",
        status.HTTP_403_FORBIDDEN: "没有权限执行当前操作",
        status.HTTP_404_NOT_FOUND: "请求的资源不存在",
        status.HTTP_409_CONFLICT: "请求与当前数据状态冲突",
        status.HTTP_422_UNPROCESSABLE_CONTENT: "请求参数校验失败",
        status.HTTP_500_INTERNAL_SERVER_ERROR: "服务器开小差了，请稍后重试",
        status.HTTP_503_SERVICE_UNAVAILABLE: "服务暂时不可用，请稍后重试",
    }.get(status_code, "请求处理失败")


def _build_error_payload(status_code: int, detail: object, message: str | None = None) -> dict[str, object]:
    return {
        "detail": detail,
        "code": _status_code_to_error_code(status_code),
        "message": message or _status_code_to_message(status_code),
    }


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            content=_build_error_payload(
                status.HTTP_422_UNPROCESSABLE_CONTENT,
                exc.errors(),
            ),
        )

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_exception(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=_build_error_payload(exc.status_code, exc.detail),
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_exception(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("unhandled_exception path=%s method=%s", request.url.path, request.method)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=_build_error_payload(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                "服务器开小差了，请稍后重试",
            ),
        )
