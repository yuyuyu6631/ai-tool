export interface ToolMediaItem {
  type: "image" | "video" | string;
  url: string;
  thumbnailUrl?: string | null;
  title?: string;
  sourceName?: string;
  sourceUrl?: string | null;
}

export interface ToolSummary {
  id: number;
  slug: string;
  name: string;
  category: string;
  categorySlug?: string;
  score: number;
  summary: string;
  tags: string[];
  officialUrl: string;
  logoPath?: string | null;
  logoStatus?: string | null;
  logoSource?: string | null;
  status: "published" | "draft" | "archived";
  featured: boolean;
  createdAt: string;
  price: string;
  reviewCount?: number;
  accessFlags?: AccessFlags | null;
  pricingType?: string;
  priceMinCny?: number | null;
  priceMaxCny?: number | null;
  freeAllowanceText?: string;
  features?: string[];
  limitations?: string[];
  bestFor?: string[];
  dealSummary?: string;
  primaryMedia?: ToolMediaItem | null;
  reason?: string | null;
}

export interface ToolDetail extends ToolSummary {
  description: string;
  editorComment: string;
  developer: string;
  country: string;
  city: string;
  price: string;
  platforms: string;
  vpnRequired: string;
  targetAudience: string[];
  abilities: string[];
  pros: string[];
  cons: string[];
  pitfalls?: string[];
  scenarios: string[];
  scenarioRecommendations?: ScenarioRecommendation[];
  reviewPreview?: ReviewPreview[];
  ratingSummary?: ToolRatingSummary | null;
  mediaItems?: ToolMediaItem[];
  alternatives: string[];
  lastVerifiedAt: string;
}

export interface AccessFlags {
  needsVpn?: boolean | null;
  cnLang?: boolean | null;
  cnPayment?: boolean | null;
}

export interface ScenarioRecommendation {
  audience: string;
  task: string;
  summary: string;
}

export interface ReviewPreview {
  sourceType: "editor" | "user" | string;
  title: string;
  body: string;
  rating?: number | null;
}

export interface FacetOption {
  slug: string;
  label: string;
  count: number;
}

export interface PresetView {
  id: string;
  label: string;
  description: string;
  count: number;
}

export interface ToolsDirectoryResponse {
  items: ToolSummary[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  categories: FacetOption[];
  tags: FacetOption[];
  statuses: FacetOption[];
  priceFacets?: FacetOption[];
  accessFacets?: FacetOption[];
  priceRangeFacets?: FacetOption[];
  presets: PresetView[];
  meta?: SearchMeta | null;
}

export interface SearchMeta {
  provider: "legacy" | "meilisearch" | string;
  degraded: boolean;
  latencyMs: number;
  normalizedQuery?: string | null;
}

export interface ScenarioSummary {
  id: number;
  slug: string;
  title: string;
  description: string;
  problem: string;
  toolCount: number;
  primaryTools: ToolSummary[];
  alternativeTools: ToolSummary[];
  targetAudience: string[];
}

export interface RankingItem {
  rank: number;
  reason: string;
  tool: ToolSummary;
}

export interface RankingSection {
  slug: string;
  title: string;
  description: string;
  items: RankingItem[];
}

export interface AiQuickActionPayload {
  type: string;
  key?: string | null;
  value?: string | null;
}

export interface AiQuickAction {
  label: string;
  action: AiQuickActionPayload;
}

export interface AiPanel {
  title: string;
  user_need: string;
  system_understanding: string;
  active_logic: string[];
  quick_actions: AiQuickAction[];
}

export interface AiSearchMeta {
  latency_ms: number;
  cache_hit: boolean;
  intent_source: string;
  search_provider?: string;
  search_degraded?: boolean;
  normalized_search_query?: string | null;
}

export interface AgentIntent {
  summary: string;
  task: string;
  constraints: string[];
}

export interface AgentTraceStep {
  id: string;
  title: string;
  description: string;
  status: string;
}

export interface AgentToolPlanItem {
  tool_slug: string;
  tool_name: string;
  role: string;
  fit_reason: string;
  free_signal: string;
  limitation_risk: string;
  next_step: string;
}

export interface AgentAlternative {
  tool_slug: string;
  tool_name: string;
  reason: string;
}

export interface AgentRecommendation {
  intent: AgentIntent;
  trace: AgentTraceStep[];
  toolPlan: AgentToolPlanItem[];
  alternatives: AgentAlternative[];
  confidence: "high" | "medium" | "low" | string;
}

export interface AiSearchResponse {
  mode: "ai";
  query: string;
  normalized_query: string;
  ai_panel: AiPanel;
  results: ToolSummary[];
  directory: ToolsDirectoryResponse;
  meta: AiSearchMeta;
  agent_recommendation?: AgentRecommendation | null;
}

export interface ToolRatingSummary {
  average: number;
  reviewCount: number;
  ratingDistribution: Record<string, number>;
}

export interface ToolReviewItem {
  id: number;
  title: string;
  body: string;
  rating: number;
  sourceType: "editor" | "user" | string;
  createdAt?: string | null;
  authorName?: string | null;
  author?: {
    username?: string | null;
  } | null;
}

export interface ToolReviewsResponse {
  summary: ToolRatingSummary;
  items: ToolReviewItem[];
  editorReviews?: ToolReviewItem[];
  userReviews?: ToolReviewItem[];
}

export interface ExperienceBoardItem {
  id: number;
  slug: string;
  title: string;
  description: string;
  accent: string;
  sortOrder: number;
  postCount: number;
}

export interface ExperienceAuthor {
  id?: number | null;
  username: string;
}

export interface ExperiencePostItem {
  id: number;
  slug: string;
  title: string;
  summary: string;
  body: string;
  channel: string;
  boardSlug: string;
  boardTitle: string;
  scenario: string;
  tools: string[];
  roles: string[];
  coverImageUrl: string;
  imageUrls: string[];
  author: ExperienceAuthor;
  status: string;
  viewCount: number;
  likeCount: number;
  favoriteCount: number;
  commentCount: number;
  isOfficial: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExperienceListResponse {
  items: ExperiencePostItem[];
  boards: ExperienceBoardItem[];
  channels: string[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ExperienceCommentItem {
  id: number;
  postId: number;
  parentId?: number | null;
  body: string;
  imageUrl: string;
  status: string;
  likeCount: number;
  author: ExperienceAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface CategorySummary {
  slug: string;
  name: string;
  canonicalSlug?: string | null;
  legacySlugs?: string[];
}

export interface HomeCatalogResponse {
  hotTools: ToolSummary[];
  latestTools: ToolSummary[];
  sidebarCategories: HomeSidebarCategory[];
  categorySections: HomeCategorySection[];
}

export interface HomeQuickEntry {
  label: string;
  href: string;
  description?: string;
  icon?: string;
}

export interface HomeCategorySection {
  homeSlug: string;
  label: string;
  description: string;
  sectionId: string;
  browseCategorySlug: string;
  items: ToolSummary[];
  moreHref: string;
}

export interface HomeSidebarCategory {
  homeSlug: string;
  label: string;
  count: number;
  sectionId: string;
  description: string;
  navigationType: "anchor" | "route";
  href: string;
}

export interface AdminOverviewRecentTool {
  id: number;
  name: string;
  slug: string;
  status: ToolSummary["status"] | string;
  updatedAt: string;
}

export interface AdminOverviewRecentMatchPlan {
  id: number;
  slug: string;
  title: string;
  publishedAt?: string | null;
}

export interface AdminOverviewResponse {
  toolCount: number;
  draftToolCount: number;
  publishedToolCount: number;
  reviewCount: number;
  rankingCount: number;
  recentUpdatedTools: AdminOverviewRecentTool[];
  matchPlanCount?: number;
  publishedMatchPlanCount?: number;
  recentPublishedMatchPlans?: AdminOverviewRecentMatchPlan[];
}

export interface AdminToolListItem {
  id: number;
  name: string;
  slug: string;
  categoryName: string;
  status: ToolSummary["status"] | string;
  score: number;
  reviewCount: number;
  updatedAt?: string;
}

export interface AdminToolAccessFlagsPayload {
  needs_vpn?: boolean | null;
  cn_lang?: boolean | null;
  cn_payment?: boolean | null;
}

export interface AdminToolPayload {
  slug: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  summary: string;
  description: string;
  editorComment: string;
  developer: string;
  country: string;
  city: string;
  price: string;
  platforms: string;
  officialUrl: string;
  logoPath: string;
  featured: boolean;
  status: ToolSummary["status"] | string;
  pricingType: string;
  priceMinCny: number | null;
  priceMaxCny: number | null;
  freeAllowanceText: string;
  features: string[];
  limitations: string[];
  bestFor: string[];
  dealSummary: string;
  mediaItems: ToolMediaItem[];
  accessFlags: AdminToolAccessFlagsPayload;
  tags: string[];
  createdOn: string | null;
  lastVerifiedAt: string | null;
}

export interface AdminReviewListItem {
  id: number;
  toolName: string;
  sourceType: string;
  username?: string | null;
  title: string;
  body: string;
}

export interface AdminRankingListItem {
  id: number;
  slug: string;
  title: string;
  itemCount: number;
}

export interface AdminRankingPayloadItem {
  toolSlug: string;
  rank: number;
  reason: string;
}

export interface AdminRankingPayload {
  slug: string;
  title: string;
  description: string;
  items: AdminRankingPayloadItem[];
}

export interface AdminMatchPlanToolPayload {
  toolSlug: string;
  reason: string;
  sortOrder: number;
  weight: number;
}

export interface AdminMatchPlanPayload {
  slug: string;
  title: string;
  description: string;
  persona: string;
  scenario: string;
  triggerKeywords: string[];
  status: string;
  sortOrder: number;
  tools: AdminMatchPlanToolPayload[];
}

export interface AdminMatchPlanListItem {
  id: number;
  slug: string;
  title: string;
  status: string;
  persona: string;
  scenario: string;
  triggerKeywords: string[];
  toolCount: number;
  sortOrder: number;
  updatedAt: string;
  publishedAt?: string | null;
}

export interface AdminMatchPlanToolPreviewItem {
  toolSlug: string;
  toolName: string;
  reason: string;
  sortOrder: number;
  weight: number;
  status: string;
  available: boolean;
  issue?: string | null;
}

export interface AdminMatchPlanPreviewResponse {
  planId?: number | null;
  matched: boolean;
  matchedKeywords: string[];
  tools: AdminMatchPlanToolPreviewItem[];
  warnings: string[];
}
