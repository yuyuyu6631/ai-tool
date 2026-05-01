from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import AnyHttpUrl, BaseModel

from app.services.tool_parser_service import generate_tool_metadata
from app.services import auth_service

router = APIRouter(dependencies=[Depends(auth_service.current_admin_dependency)])


class ParseToolRequest(BaseModel):
    url: AnyHttpUrl


class ParseToolResponse(BaseModel):
    success: bool
    data: dict[str, Any]


@router.post("/extract", response_model=ParseToolResponse)
def extract_tool_metadata(payload: ParseToolRequest):
    """
    接收目标工具URL，使用爬虫并调用LLM自动抽取相关特征（分类、标签、描述）。
    供管理后台等前端系统直接调研。
    """
    try:
        data = generate_tool_metadata(str(payload.url))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return {"success": bool(data), "data": data}
