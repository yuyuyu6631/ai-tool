from pydantic import BaseModel, Field

from app.schemas.catalog import ToolsDirectoryResponse
from app.schemas.tool import ToolSummary


class AiIntentConstraints(BaseModel):
    pricing: str | None = None
    language: str | None = None
    difficulty: str | None = None
    platform: str | None = None


class AiQuickActionPayload(BaseModel):
    type: str
    key: str | None = None
    value: str | None = None


class AiQuickAction(BaseModel):
    label: str
    action: AiQuickActionPayload


class AiPanel(BaseModel):
    title: str
    user_need: str
    system_understanding: str
    active_logic: list[str] = Field(default_factory=list)
    quick_actions: list[AiQuickAction] = Field(default_factory=list)


class AiSearchResult(ToolSummary):
    reason: str | None = None


class AiSearchMeta(BaseModel):
    latency_ms: int
    cache_hit: bool = False
    intent_source: str = "fallback"
    search_provider: str = "legacy"
    search_degraded: bool = False
    normalized_search_query: str | None = None


class AgentIntent(BaseModel):
    summary: str
    task: str
    constraints: list[str] = Field(default_factory=list)


class AgentTraceStep(BaseModel):
    id: str
    title: str
    description: str
    status: str = "done"


class AgentToolPlanItem(BaseModel):
    tool_slug: str
    tool_name: str
    role: str
    fit_reason: str
    free_signal: str
    limitation_risk: str
    next_step: str


class AgentAlternative(BaseModel):
    tool_slug: str
    tool_name: str
    reason: str


class AgentRecommendation(BaseModel):
    intent: AgentIntent
    trace: list[AgentTraceStep] = Field(default_factory=list)
    toolPlan: list[AgentToolPlanItem] = Field(default_factory=list)
    alternatives: list[AgentAlternative] = Field(default_factory=list)
    confidence: str = "medium"


class AiSearchResponse(BaseModel):
    mode: str = "ai"
    query: str
    normalized_query: str
    ai_panel: AiPanel
    results: list[AiSearchResult]
    directory: ToolsDirectoryResponse
    meta: AiSearchMeta
    agent_recommendation: AgentRecommendation | None = None
