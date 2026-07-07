from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.catalog import CategorySummary, HomeCatalogResponse, RankingSection, ScenarioSummary, ToolsDirectoryResponse
from app.schemas.tool import ToolDetail, ToolSummary
from app.services import catalog_service
from app.services.import_preview_service import load_import_preview_validation

router = APIRouter()


@router.get("/tools", response_model=ToolsDirectoryResponse)
def get_tools(
    db: Session = Depends(get_db),
    q: str | None = Query(default=None),
    category: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    status: str | None = Query(default=None),
    price: str | None = Query(default=None),
    access: str | None = Query(default=None),
    price_range: str | None = Query(default=None),
    sort: str = Query(default="featured"),
    view: str = Query(default="hot"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=9, ge=1, le=24),
):
    return catalog_service.get_tools_directory(
        db=db,
        q=q,
        category_slug=category,
        tag_slug=tag,
        status_slug=status,
        price_slug=price,
        access_slug=access,
        price_range_slug=price_range,
        sort=sort,
        view=view,
        page=page,
        page_size=page_size,
    )


@router.get("/tools/import-preview/validation")
def get_import_preview_validation():
    return load_import_preview_validation()


@router.get("/tools/search-index", response_model=list[ToolSummary])
def get_search_index(db: Session = Depends(get_db)):
    """返回全量对外发布的精简工具列表，供前端纯本地模糊搜索与过滤"""
    return catalog_service._load_summaries(db, status_filter=catalog_service.PUBLIC_TOOL_STATUS)


@router.get("/tools/{slug}", response_model=ToolDetail)
def get_tool(slug: str, db: Session = Depends(get_db)):
    tool = catalog_service.get_tool(db=db, slug=slug)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    return tool


@router.get("/categories", response_model=list[CategorySummary])
def get_categories(
    include_empty: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    return catalog_service.list_categories(db=db, include_empty=include_empty)


@router.get("/categories/{slug}/tools", response_model=list[ToolSummary])
def get_category_tools(slug: str, db: Session = Depends(get_db)):
    return catalog_service.list_tools_by_category(db=db, category_slug=slug)


@router.get("/home", response_model=HomeCatalogResponse)
def get_home_catalog(
    section_size: int = Query(default=8, ge=4, le=12),
    db: Session = Depends(get_db),
):
    return catalog_service.get_home_catalog(db=db, section_size=section_size)


@router.get("/rankings", response_model=list[RankingSection])
def get_rankings(db: Session = Depends(get_db)):
    return catalog_service.list_rankings(db=db)


@router.get("/rankings/{slug}", response_model=RankingSection)
def get_ranking(slug: str, db: Session = Depends(get_db)):
    ranking = catalog_service.get_ranking(db=db, slug=slug)
    if not ranking:
        raise HTTPException(status_code=404, detail="Ranking not found")
    return ranking


@router.get("/scenarios", response_model=list[ScenarioSummary])
def get_scenarios(db: Session = Depends(get_db)):
    return catalog_service.list_scenarios(db=db)


@router.get("/scenarios/{slug}", response_model=ScenarioSummary)
def get_scenario(slug: str, db: Session = Depends(get_db)):
    scenario = catalog_service.get_scenario(db=db, slug=slug)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario
