from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, Field


class AccessFlags(BaseModel):
    needsVpn: bool | None = None
    cnLang: bool | None = None
    cnPayment: bool | None = None


class ToolMediaItem(BaseModel):
    type: str
    url: str
    thumbnailUrl: str | None = None
    title: str = ""
    sourceName: str = ""
    sourceUrl: str | None = None


class ScenarioRecommendation(BaseModel):
    audience: str
    task: str
    summary: str


class ReviewPreview(BaseModel):
    sourceType: str
    title: str
    body: str
    rating: float | None = None


class ToolReviewAuthor(BaseModel):
    id: int
    username: str


class ToolReviewItem(BaseModel):
    id: int
    toolId: int
    userId: int | None = None
    sourceType: str
    title: str
    body: str
    rating: float | None = None
    createdAt: datetime
    updatedAt: datetime
    author: ToolReviewAuthor | None = None


class ToolRatingSummary(BaseModel):
    average: float = 0.0
    reviewCount: int = 0
    ratingDistribution: dict[str, int] = Field(default_factory=dict)


class ToolReviewsResponse(BaseModel):
    summary: ToolRatingSummary
    editorReviews: list[ToolReviewItem] = Field(default_factory=list)
    userReviews: list[ToolReviewItem] = Field(default_factory=list)


class UpsertToolReviewRequest(BaseModel):
    rating: float | None = Field(default=None, ge=1, le=5)
    title: str = Field(min_length=1, max_length=255)
    body: str = Field(min_length=1)


class ToolSummary(BaseModel):
    id: int
    slug: str
    name: str
    category: str
    categorySlug: str | None = None
    score: float
    summary: str
    tags: list[str]
    officialUrl: str
    logoPath: str | None = None
    logoStatus: str | None = None
    logoSource: str | None = None
    status: str
    featured: bool
    createdAt: date
    price: str = ""
    reviewCount: int = 0
    accessFlags: AccessFlags | None = None
    pricingType: str = "unknown"
    priceMinCny: int | None = None
    priceMaxCny: int | None = None
    freeAllowanceText: str = ""
    features: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    bestFor: list[str] = Field(default_factory=list)
    dealSummary: str = ""
    primaryMedia: ToolMediaItem | None = None
    reason: str | None = None


class ToolDetail(ToolSummary):
    description: str
    editorComment: str
    developer: str = ""
    country: str = ""
    city: str = ""
    price: str = ""
    platforms: str = ""
    vpnRequired: str = ""
    targetAudience: list[str] = Field(default_factory=list)
    abilities: list[str] = Field(default_factory=list)
    pros: list[str] = Field(default_factory=list)
    cons: list[str] = Field(default_factory=list)
    pitfalls: list[str] = Field(default_factory=list)
    scenarios: list[str] = Field(default_factory=list)
    scenarioRecommendations: list[ScenarioRecommendation] = Field(default_factory=list)
    reviewPreview: list[ReviewPreview] = Field(default_factory=list)
    ratingSummary: ToolRatingSummary = Field(default_factory=ToolRatingSummary)
    mediaItems: list[ToolMediaItem] = Field(default_factory=list)
    alternatives: list[str] = Field(default_factory=list)
    lastVerifiedAt: date


class ImportPreviewValidationStats(BaseModel):
    totalRows: int
    sampleRows: int
    importReadyRows: int
    urlReachableRows: int
    urlRestrictedRows: int
    urlErrorRows: int
    highRiskLogoRows: int
    missingRequiredFieldRows: int


class ImportPreviewValidationItem(BaseModel):
    rowNumber: int
    slug: str
    name: str
    category: str
    summary: str
    officialUrl: str
    logoPath: str | None = None
    finalUrl: str | None = None
    urlStatusCode: int | None = None
    urlCheckStatus: str
    urlReachable: bool
    urlError: str | None = None
    logoRef: str
    logoStatus: str
    logoRiskLevel: str
    logoRiskReasons: list[str]
    developer: str
    country: str
    city: str
    price: str
    platforms: str
    vpnRequired: str
    detailPage: str
    parentRecord: str
    homepageScreenshot: str
    requiredFieldIssues: list[str]
    warnings: list[str]
    importReady: bool


class ImportPreviewValidationReport(BaseModel):
    generatedAt: str
    workbookPath: str
    sheetTitle: str
    sheetHeaders: list[str]
    stats: ImportPreviewValidationStats
    sourceSummary: dict[str, Any]
    items: list[ImportPreviewValidationItem]
