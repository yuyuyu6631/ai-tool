from datetime import date
from typing import Any

from pydantic import BaseModel


class ToolSummary(BaseModel):
    id: int
    slug: str
    name: str
    category: str
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


class ToolDetail(ToolSummary):
    description: str
    editorComment: str
    developer: str = ""
    country: str = ""
    city: str = ""
    price: str = ""
    platforms: str = ""
    vpnRequired: str = ""
    targetAudience: list[str]
    abilities: list[str]
    pros: list[str]
    cons: list[str]
    scenarios: list[str]
    alternatives: list[str]
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
