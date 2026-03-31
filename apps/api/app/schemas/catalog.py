from pydantic import BaseModel

from app.schemas.tool import ToolSummary


class CategorySummary(BaseModel):
    slug: str
    name: str
    description: str


class FacetOption(BaseModel):
    slug: str
    label: str
    count: int


class PresetView(BaseModel):
    id: str
    label: str
    description: str
    count: int


class ToolsDirectoryResponse(BaseModel):
    items: list[ToolSummary]
    total: int
    page: int
    pageSize: int
    hasMore: bool
    categories: list[FacetOption]
    tags: list[FacetOption]
    statuses: list[FacetOption]
    presets: list[PresetView]


class ScenarioSummary(BaseModel):
    id: int
    slug: str
    title: str
    description: str
    problem: str
    toolCount: int
    primaryTools: list[str]
    alternativeTools: list[str]
    targetAudience: list[str]


class RankingItem(BaseModel):
    rank: int
    reason: str
    tool: ToolSummary


class RankingSection(BaseModel):
    slug: str
    title: str
    description: str
    items: list[RankingItem]
