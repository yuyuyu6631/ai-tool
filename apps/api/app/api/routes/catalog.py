from fastapi import APIRouter, HTTPException, Query

from app.schemas.catalog import CategorySummary, RankingSection, ScenarioSummary, ToolsDirectoryResponse
from app.schemas.tool import ToolDetail, ToolSummary
from app.services import catalog_service

router = APIRouter()


@router.get("/tools", response_model=ToolsDirectoryResponse)
def get_tools(
    q: str | None = Query(default=None),
    category: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    status: str | None = Query(default=None),
    sort: str = Query(default="featured"),
    view: str = Query(default="hot"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=9, ge=1, le=24),
):
    return catalog_service.get_tools_directory(
        q=q,
        category_slug=category,
        tag_slug=tag,
        status_slug=status,
        sort=sort,
        view=view,
        page=page,
        page_size=page_size,
    )


@router.get("/tools/{slug}", response_model=ToolDetail)
def get_tool(slug: str):
    tool = catalog_service.get_tool(slug)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    return tool


@router.get("/categories", response_model=list[CategorySummary])
def get_categories():
    return catalog_service.list_categories()


@router.get("/categories/{slug}/tools", response_model=list[ToolSummary])
def get_category_tools(slug: str):
    return catalog_service.list_tools_by_category(slug)


@router.get("/rankings", response_model=list[RankingSection])
def get_rankings():
    return catalog_service.list_rankings()


@router.get("/rankings/{slug}", response_model=RankingSection)
def get_ranking(slug: str):
    ranking = catalog_service.get_ranking(slug)
    if not ranking:
        raise HTTPException(status_code=404, detail="Ranking not found")
    return ranking


@router.get("/scenarios", response_model=list[ScenarioSummary])
def get_scenarios():
    return catalog_service.list_scenarios()


@router.get("/scenarios/{slug}", response_model=ScenarioSummary)
def get_scenario(slug: str):
    scenario = catalog_service.get_scenario(slug)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario
