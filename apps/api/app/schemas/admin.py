from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator

from app.schemas.tool import ToolMediaItem


class AdminToolPayload(BaseModel):
    slug: str = Field(min_length=1, max_length=120)
    name: str = Field(min_length=1, max_length=160)
    categorySlug: str = Field(min_length=1, max_length=120)
    categoryName: str = Field(min_length=1, max_length=120)
    summary: str = Field(min_length=1, max_length=512)
    description: str = Field(default="")
    editorComment: str = Field(default="")
    developer: str = Field(default="")
    country: str = Field(default="")
    city: str = Field(default="")
    price: str = Field(default="")
    platforms: str = Field(default="")
    officialUrl: str = Field(min_length=1, max_length=255)
    logoPath: str | None = None
    featured: bool = False
    status: str = Field(default="draft")
    pricingType: str = Field(default="unknown")
    priceMinCny: int | None = None
    priceMaxCny: int | None = None
    freeAllowanceText: str = Field(default="")
    features: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    bestFor: list[str] = Field(default_factory=list)
    dealSummary: str = Field(default="")
    mediaItems: list[ToolMediaItem] = Field(default_factory=list)
    accessFlags: dict[str, bool | None] | None = None
    tags: list[str] = Field(default_factory=list)
    createdOn: date | None = None
    lastVerifiedAt: date | None = None

    @field_validator(
        "slug",
        "name",
        "categorySlug",
        "categoryName",
        "summary",
        "description",
        "editorComment",
        "developer",
        "country",
        "city",
        "price",
        "platforms",
        "officialUrl",
        "freeAllowanceText",
        "dealSummary",
        mode="before",
    )
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value


class AdminToolListItem(BaseModel):
    id: int
    slug: str
    name: str
    categoryName: str
    status: str
    featured: bool
    score: float
    reviewCount: int
    updatedAt: datetime


class AdminOverviewRecentToolItem(BaseModel):
    id: int
    slug: str
    name: str
    status: str
    updatedAt: datetime


class AdminOverviewResponse(BaseModel):
    toolCount: int
    draftToolCount: int
    publishedToolCount: int
    reviewCount: int
    rankingCount: int
    recentUpdatedTools: list[AdminOverviewRecentToolItem]


class AdminReviewListItem(BaseModel):
    id: int
    toolId: int
    toolName: str
    username: str | None = None
    sourceType: str
    status: str
    rating: float | None = None
    title: str
    body: str
    createdAt: datetime
    updatedAt: datetime


class AdminRankingItemPayload(BaseModel):
    toolSlug: str = Field(min_length=1, max_length=120)
    rank: int = Field(ge=1)
    reason: str = Field(min_length=1, max_length=255)

    @field_validator("toolSlug", "reason", mode="before")
    @classmethod
    def strip_item_text(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value


class AdminRankingPayload(BaseModel):
    slug: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=160)
    description: str = Field(default="")
    items: list[AdminRankingItemPayload] = Field(default_factory=list)

    @field_validator("slug", "title", "description", mode="before")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value


class AdminRankingListItem(BaseModel):
    id: int
    slug: str
    title: str
    description: str
    itemCount: int
