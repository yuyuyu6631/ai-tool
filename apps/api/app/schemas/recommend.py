from pydantic import BaseModel, Field


class RecommendRequest(BaseModel):
    query: str = Field(min_length=2)
    scenario: str | None = None
    tags: list[str] = Field(default_factory=list)
    candidateSlugs: list[str] = Field(default_factory=list)


class RecommendItem(BaseModel):
    tool_id: int
    name: str
    slug: str
    url: str
    summary: str
    tags: list[str]
    reason: str
    score: float
    logoPath: str | None = None
