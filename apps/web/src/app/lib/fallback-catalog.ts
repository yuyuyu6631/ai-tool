import type {
  AdminOverviewResponse,
  AdminToolListItem,
  CategorySummary,
  FacetOption,
  HomeCatalogResponse,
  RankingSection,
  ScenarioSummary,
  ToolDetail,
  ToolReviewsResponse,
  ToolSummary,
  ToolsDirectoryResponse,
} from "./catalog-types";

const DEFAULT_PAGE_SIZE = 24;

const FALLBACK_TOOLS: ToolDetail[] = [
  {
    id: 1,
    slug: "chatgpt",
    name: "ChatGPT",
    category: "通用助手",
    categorySlug: "general-assistants",
    score: 9.6,
    summary: "综合能力最稳的通用 AI 助手，适合写作、分析、搜索和代码协作。",
    tags: ["对话问答", "内容生成", "数据分析"],
    officialUrl: "https://chat.openai.com",
    logoPath: "/logos/chatgpt.png",
    logoStatus: "matched",
    logoSource: "fallback",
    status: "published",
    featured: true,
    createdAt: "2026-03-01",
    price: "订阅制",
    reviewCount: 128,
    accessFlags: { needsVpn: false, cnLang: true, cnPayment: true },
    pricingType: "subscription",
    priceMinCny: 145,
    priceMaxCny: 145,
    freeAllowanceText: "免费版可体验基础问答，进阶能力需订阅。",
    description: "适合作为默认起点，覆盖大多数知识工作与多步骤任务。",
    editorComment: "如果你不确定先试哪个工具，ChatGPT 往往是最稳的起点。",
    developer: "OpenAI",
    country: "美国",
    city: "San Francisco",
    platforms: "Web / iOS / Android / API",
    vpnRequired: "国内可直连",
    targetAudience: ["运营", "产品经理", "研究员", "开发者"],
    abilities: ["问答", "写作", "总结", "代码辅助"],
    pros: ["覆盖面广", "生态成熟", "多场景可用"],
    cons: ["高阶能力依赖订阅", "部分场景仍需人工校验"],
    pitfalls: ["复杂业务结论不要直接照抄，关键数据需复核。"],
    scenarios: ["写邮件", "整理资料", "头脑风暴"],
    scenarioRecommendations: [
      { audience: "产品经理", task: "快速整理方案", summary: "适合先把目标、约束和候选路径梳理成结构化草稿。" },
    ],
    reviewPreview: [
      { sourceType: "editor", title: "默认起点最稳", body: "覆盖面最全，适合作为第一次筛选工具时的基线。", rating: 4.8 },
    ],
    ratingSummary: {
      average: 4.8,
      reviewCount: 128,
      ratingDistribution: { "5": 92, "4": 28, "3": 6, "2": 1, "1": 1 },
    },
    alternatives: ["claude", "deepseek"],
    lastVerifiedAt: "2026-04-20",
  },
  {
    id: 2,
    slug: "claude",
    name: "Claude",
    category: "通用助手",
    categorySlug: "general-assistants",
    score: 9.3,
    summary: "长文本理解和结构化表达很强，适合深度分析、方案整理和专业写作。",
    tags: ["长文分析", "专业写作", "逻辑推理"],
    officialUrl: "https://claude.ai",
    logoPath: "/logos/Claude.png",
    logoStatus: "matched",
    logoSource: "fallback",
    status: "published",
    featured: true,
    createdAt: "2026-03-02",
    price: "订阅制",
    reviewCount: 86,
    accessFlags: { needsVpn: true, cnLang: false, cnPayment: false },
    pricingType: "subscription",
    priceMinCny: 145,
    priceMaxCny: 145,
    freeAllowanceText: "",
    description: "在长文档、报告总结和复杂说明场景中表现很稳。",
    editorComment: "做文档分析、策略说明和专业表达时，Claude 往往更顺手。",
    developer: "Anthropic",
    country: "美国",
    city: "San Francisco",
    platforms: "Web / API",
    vpnRequired: "需要特定网络",
    targetAudience: ["咨询顾问", "研究员", "内容团队"],
    abilities: ["长文分析", "专业写作", "方案整理"],
    pros: ["长上下文稳定", "表达自然", "适合复杂文本"],
    cons: ["访问门槛较高", "部分能力响应稍慢"],
    pitfalls: ["国内团队落地前要先确认访问与采购链路。"],
    scenarios: ["合同初读", "方案评审", "长文总结"],
    scenarioRecommendations: [
      { audience: "内容团队", task: "写长文和提纲", summary: "适合先生成结构，再做多轮润色。"},
    ],
    reviewPreview: [
      { sourceType: "editor", title: "长文表现突出", body: "在长文档阅读和归纳方面更有优势。", rating: 4.7 },
    ],
    ratingSummary: {
      average: 4.7,
      reviewCount: 86,
      ratingDistribution: { "5": 58, "4": 22, "3": 5, "2": 1, "1": 0 },
    },
    alternatives: ["chatgpt", "deepseek"],
    lastVerifiedAt: "2026-04-20",
  },
  {
    id: 3,
    slug: "deepseek",
    name: "DeepSeek",
    category: "通用助手",
    categorySlug: "general-assistants",
    score: 9.1,
    summary: "在中文问答、推理和性价比上很有竞争力，适合作为团队普及型助手。",
    tags: ["中文问答", "推理", "效率工具"],
    officialUrl: "https://www.deepseek.com/",
    logoPath: "/logos/DeepSeek.png",
    logoStatus: "matched",
    logoSource: "fallback",
    status: "published",
    featured: true,
    createdAt: "2026-03-10",
    price: "免费增值",
    reviewCount: 74,
    accessFlags: { needsVpn: false, cnLang: true, cnPayment: true },
    pricingType: "freemium",
    priceMinCny: 0,
    priceMaxCny: 49,
    freeAllowanceText: "基础能力可免费使用，高并发或高级配额需升级。",
    description: "适合中文团队日常问答、内容整理和推理类任务。",
    editorComment: "如果你优先看中文体验和成本，DeepSeek 值得优先试。",
    developer: "DeepSeek",
    country: "中国",
    city: "杭州",
    platforms: "Web / API",
    vpnRequired: "国内可直连",
    targetAudience: ["运营", "学生", "开发者", "分析师"],
    abilities: ["中文问答", "总结整理", "代码辅助"],
    pros: ["中文体验自然", "成本低", "上手门槛低"],
    cons: ["部分深度任务稳定性略波动"],
    pitfalls: ["用于正式发布内容时建议增加人工复核。"],
    scenarios: ["中文写作", "知识整理", "快速问答"],
    scenarioRecommendations: [
      { audience: "运营", task: "生成中文初稿", summary: "适合先快速出稿，再进入团队校对环节。"},
    ],
    reviewPreview: [
      { sourceType: "editor", title: "中文场景友好", body: "中文任务和日常效率场景很适合团队普及。", rating: 4.6 },
    ],
    ratingSummary: {
      average: 4.6,
      reviewCount: 74,
      ratingDistribution: { "5": 45, "4": 21, "3": 7, "2": 1, "1": 0 },
    },
    alternatives: ["chatgpt", "claude"],
    lastVerifiedAt: "2026-04-20",
  },
  {
    id: 4,
    slug: "gamma",
    name: "Gamma",
    category: "写作办公",
    categorySlug: "writing-office",
    score: 9.0,
    summary: "快速生成演示文稿和提案页面，适合先出结果再细调。",
    tags: ["PPT", "演示稿", "提案"],
    officialUrl: "https://gamma.app",
    logoPath: "/logos/gamma.png",
    logoStatus: "matched",
    logoSource: "fallback",
    status: "published",
    featured: true,
    createdAt: "2026-03-03",
    price: "免费增值",
    reviewCount: 63,
    accessFlags: { needsVpn: true, cnLang: false, cnPayment: false },
    pricingType: "freemium",
    priceMinCny: 39,
    priceMaxCny: 79,
    freeAllowanceText: "免费版可生成基础演示，导出和高级主题需升级。",
    description: "适合做汇报、提案和项目展示，能大幅减少从零起稿的时间。",
    editorComment: "如果你经常临时要做 PPT 或方案页，Gamma 很值得优先试。",
    developer: "Gamma",
    country: "美国",
    city: "San Francisco",
    platforms: "Web",
    vpnRequired: "需要特定网络",
    targetAudience: ["销售", "产品经理", "创业者"],
    abilities: ["演示生成", "页面排版", "内容整理"],
    pros: ["成稿速度快", "视觉完成度高", "适合提案"],
    cons: ["深度自定义有限", "中文细节仍需手调"],
    pitfalls: ["正式对外材料建议再做一轮品牌样式统一。"],
    scenarios: ["做汇报", "写提案", "项目展示"],
    scenarioRecommendations: [
      { audience: "销售", task: "快速做提案", summary: "先生成结构和页面，再补充客户定制内容。"},
    ],
    reviewPreview: [
      { sourceType: "editor", title: "PPT 初稿效率高", body: "特别适合赶时间时先把框架和视觉快速搭起来。", rating: 4.5 },
    ],
    ratingSummary: {
      average: 4.5,
      reviewCount: 63,
      ratingDistribution: { "5": 35, "4": 21, "3": 6, "2": 1, "1": 0 },
    },
    alternatives: ["canva"],
    lastVerifiedAt: "2026-04-18",
  },
  {
    id: 5,
    slug: "canva",
    name: "Canva",
    category: "设计创作",
    categorySlug: "design-media",
    score: 8.9,
    summary: "适合快速完成海报、社媒物料和轻量演示设计，团队协作体验成熟。",
    tags: ["设计", "海报", "社媒内容"],
    officialUrl: "https://www.canva.com/",
    logoPath: "/logos/Canva.png",
    logoStatus: "matched",
    logoSource: "fallback",
    status: "published",
    featured: true,
    createdAt: "2026-03-12",
    price: "免费增值",
    reviewCount: 92,
    accessFlags: { needsVpn: false, cnLang: true, cnPayment: true },
    pricingType: "freemium",
    priceMinCny: 0,
    priceMaxCny: 99,
    freeAllowanceText: "免费版已覆盖基础模板和编辑能力。",
    description: "适合品牌物料、社媒图片和轻量页面的快速生产。",
    editorComment: "如果团队需要大量轻设计产出，Canva 是很务实的选择。",
    developer: "Canva",
    country: "澳大利亚",
    city: "Sydney",
    platforms: "Web / iOS / Android",
    vpnRequired: "国内可直连",
    targetAudience: ["市场团队", "运营", "中小团队"],
    abilities: ["海报设计", "社媒图文", "模板协作"],
    pros: ["模板成熟", "协作方便", "上手快"],
    cons: ["深度设计自由度不如专业工具"],
    pitfalls: ["品牌模板较多时要注意统一素材命名和权限。"],
    scenarios: ["做海报", "社媒配图", "活动物料"],
    scenarioRecommendations: [
      { audience: "市场团队", task: "批量做社媒图", summary: "适合用模板统一风格，再快速变体出图。"},
    ],
    reviewPreview: [
      { sourceType: "editor", title: "轻设计很顺手", body: "适合高频、轻量、可复用的视觉产出。", rating: 4.5 },
    ],
    ratingSummary: {
      average: 4.5,
      reviewCount: 92,
      ratingDistribution: { "5": 55, "4": 28, "3": 8, "2": 1, "1": 0 },
    },
    alternatives: ["gamma"],
    lastVerifiedAt: "2026-04-19",
  },
];

const FALLBACK_CATEGORIES: CategorySummary[] = [
  { slug: "general-assistants", name: "通用助手", canonicalSlug: "general-assistants", legacySlugs: ["chatbot", "ai-chat"] },
  { slug: "writing-office", name: "写作办公", canonicalSlug: "writing-office", legacySlugs: [] },
  { slug: "design-media", name: "设计创作", canonicalSlug: "design-media", legacySlugs: [] },
];

const FALLBACK_SCENARIOS: ScenarioSummary[] = [
  {
    id: 1,
    slug: "make-ppt",
    title: "PPT 制作榜 TOP5",
    description: "优先看能快速产出演示结构和页面雏形的工具，避免从空白页开始。",
    problem: "汇报和提案常常时间很紧，需要快速生成结构完整、可继续编辑的演示稿。",
    toolCount: 3,
    primaryTools: [toSummary("gamma"), toSummary("chatgpt")],
    alternativeTools: [toSummary("canva")],
    targetAudience: ["销售", "产品经理", "创业者"],
  },
  {
    id: 2,
    slug: "write-copy",
    title: "AI 写作工具榜 TOP5",
    description: "适合先出框架和文风方向，再进入人工润色的内容工作流。",
    problem: "内容岗位需要持续稳定地产出邮件、文章和活动文案，难点在于效率和一致性。",
    toolCount: 3,
    primaryTools: [toSummary("chatgpt"), toSummary("claude")],
    alternativeTools: [toSummary("deepseek")],
    targetAudience: ["运营", "内容团队", "咨询顾问"],
  },
];

const FALLBACK_RANKINGS: RankingSection[] = [
  {
    slug: "hot",
    title: "热门工具榜",
    description: "优先展示适用面广、综合体验稳定的 AI 工具。",
    items: [
      { rank: 1, reason: "默认起点最稳", tool: toSummary("chatgpt") },
      { rank: 2, reason: "长文和分析优势明显", tool: toSummary("claude") },
      { rank: 3, reason: "中文和性价比突出", tool: toSummary("deepseek") },
    ],
  },
  {
    slug: "productivity",
    title: "办公与内容效率榜",
    description: "聚焦提案、写作和轻设计高频场景。",
    items: [
      { rank: 1, reason: "提案和演示成稿效率高", tool: toSummary("gamma") },
      { rank: 2, reason: "轻设计和模板协作成熟", tool: toSummary("canva") },
      { rank: 3, reason: "写作与整理能力均衡", tool: toSummary("chatgpt") },
    ],
  },
];

const EMPTY_REVIEWS: ToolReviewsResponse = {
  summary: {
    average: 0,
    reviewCount: 0,
    ratingDistribution: { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 },
  },
  items: [],
  editorReviews: [],
  userReviews: [],
};

function toSummary(slug: string): ToolSummary {
  const tool = FALLBACK_TOOLS.find((item) => item.slug === slug);
  if (!tool) {
    throw new Error(`Missing fallback tool for slug: ${slug}`);
  }
  const { description, editorComment, developer, country, city, platforms, vpnRequired, targetAudience, abilities, pros, cons, pitfalls, scenarios, scenarioRecommendations, reviewPreview, ratingSummary, alternatives, lastVerifiedAt, ...summary } = tool;
  return summary;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function includesText(target: string, query: string) {
  return normalize(target).includes(normalize(query));
}

function matchesCategory(tool: ToolSummary, category?: string | null) {
  if (!category) return true;
  const candidate = normalize(category);
  return normalize(tool.categorySlug || "") === candidate || normalize(tool.category) === candidate;
}

function matchesTag(tool: ToolSummary, tag?: string | null) {
  if (!tag) return true;
  return tool.tags.some((item) => normalize(item) === normalize(tag));
}

function matchesPrice(tool: ToolSummary, price?: string | null) {
  if (!price) return true;
  const pricingType = normalize(tool.pricingType || "");
  return pricingType === normalize(price);
}

function matchesQuery(tool: ToolSummary, q?: string | null) {
  if (!q) return true;
  const haystack = [tool.name, tool.summary, tool.category, tool.tags.join(" "), tool.officialUrl].join(" ");
  return includesText(haystack, q);
}

function sortTools(items: ToolSummary[], sort?: string | null, view?: string | null) {
  const sorted = [...items];
  if (view === "latest" || sort === "latest") {
    return sorted.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }
  if (sort === "name") {
    return sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
  return sorted.sort((a, b) => {
    if (Number(b.featured) !== Number(a.featured)) return Number(b.featured) - Number(a.featured);
    if ((b.reviewCount ?? 0) !== (a.reviewCount ?? 0)) return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
    return (b.score ?? 0) - (a.score ?? 0);
  });
}

function buildFacetOptions(items: ToolSummary[], mode: "category" | "tag"): FacetOption[] {
  const counts = new Map<string, { label: string; count: number }>();
  for (const tool of items) {
    const values =
      mode === "category"
        ? [{ slug: tool.categorySlug || normalize(tool.category), label: tool.category }]
        : tool.tags.map((tag) => ({ slug: normalize(tag), label: tag }));
    for (const value of values) {
      const current = counts.get(value.slug);
      counts.set(value.slug, { label: value.label, count: (current?.count ?? 0) + 1 });
    }
  }
  return [...counts.entries()]
    .map(([slug, value]) => ({ slug, label: value.label, count: value.count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function getFallbackDirectory(queryString = ""): ToolsDirectoryResponse {
  const params = new URLSearchParams(queryString.startsWith("?") ? queryString.slice(1) : queryString);
  const page = Number.parseInt(params.get("page") || "1", 10);
  const pageSize = Number.parseInt(params.get("page_size") || String(DEFAULT_PAGE_SIZE), 10);
  const q = params.get("q");
  const category = params.get("category");
  const tag = params.get("tag");
  const price = params.get("price");
  const sort = params.get("sort");
  const view = params.get("view");

  const filtered = sortTools(
    FALLBACK_TOOLS.map((tool) => toSummary(tool.slug))
      .filter((tool) => matchesQuery(tool, q))
      .filter((tool) => matchesCategory(tool, category))
      .filter((tool) => matchesTag(tool, tag))
      .filter((tool) => matchesPrice(tool, price)),
    sort,
    view,
  );

  const start = Math.max(0, (page - 1) * pageSize);
  const items = filtered.slice(start, start + pageSize);

  return {
    items,
    total: filtered.length,
    page,
    pageSize,
    hasMore: start + pageSize < filtered.length,
    categories: buildFacetOptions(filtered, "category"),
    tags: buildFacetOptions(filtered, "tag"),
    statuses: [{ slug: "published", label: "Published", count: filtered.length }],
    priceFacets: [
      ...new Map(
        filtered
          .filter((tool) => tool.pricingType)
          .map((tool) => [tool.pricingType as string, { slug: tool.pricingType as string, label: tool.price, count: 0 }]),
      ).values(),
    ].map((item) => ({
      slug: item.slug,
      label:
        item.slug === "subscription"
          ? "订阅"
          : item.slug === "freemium"
            ? "免费增值"
            : item.slug === "free"
              ? "免费"
              : item.slug === "one-time"
                ? "一次性付费"
                : item.label,
      count: filtered.filter((tool) => tool.pricingType === item.slug).length,
    })),
    accessFacets: [
      { slug: "no-vpn", label: "国内直连", count: filtered.filter((tool) => tool.accessFlags?.needsVpn === false).length },
      { slug: "needs-vpn", label: "需要特定网络", count: filtered.filter((tool) => tool.accessFlags?.needsVpn === true).length },
      { slug: "cn-lang", label: "中文界面", count: filtered.filter((tool) => tool.accessFlags?.cnLang).length },
      { slug: "cn-payment", label: "支持国内支付", count: filtered.filter((tool) => tool.accessFlags?.cnPayment).length },
    ].filter((item) => item.count > 0),
    priceRangeFacets: [],
    presets: [
      { id: "hot", label: "热门", description: "综合热度更高的工具", count: filtered.length },
      { id: "latest", label: "最新", description: "最近收录的工具", count: filtered.length },
      { id: "free", label: "免费优先", description: "优先看免费或免费增值工具", count: filtered.filter((tool) => tool.pricingType !== "subscription").length },
    ],
  };
}

export function getFallbackToolDetail(slug: string): ToolDetail | null {
  return FALLBACK_TOOLS.find((tool) => tool.slug === slug) ?? null;
}

export function getFallbackCategories(): CategorySummary[] {
  return FALLBACK_CATEGORIES;
}

export function getFallbackSearchIndex(): ToolSummary[] {
  return FALLBACK_TOOLS.map((tool) => toSummary(tool.slug));
}

export function getFallbackHomeCatalog(): HomeCatalogResponse {
  const tools = FALLBACK_TOOLS.map((tool) => toSummary(tool.slug));
  const hotTools = sortTools(tools, "featured", "hot").slice(0, 4);
  const latestTools = sortTools(tools, "latest", "latest").slice(0, 4);

  const sidebarCategories = FALLBACK_CATEGORIES.map((cat) => ({
    homeSlug: cat.slug,
    label: cat.name,
    count: tools.filter((t) => t.categorySlug === cat.slug).length,
    sectionId: `sec-${cat.slug}`,
    description: cat.description || "",
    navigationType: "anchor" as const,
    href: `#sec-${cat.slug}`,
  }));

  const categorySections = FALLBACK_CATEGORIES.map((cat) => ({
    homeSlug: cat.slug,
    label: cat.name,
    description: cat.description || "",
    sectionId: `sec-${cat.slug}`,
    browseCategorySlug: cat.slug,
    items: tools.filter((t) => t.categorySlug === cat.slug).slice(0, 4),
    moreHref: `/category/${cat.slug}`,
  }));

  return {
    hotTools,
    latestTools,
    sidebarCategories,
    categorySections,
  };
}

export function getFallbackScenarios(): ScenarioSummary[] {
  return FALLBACK_SCENARIOS;
}

export function getFallbackScenario(slug: string): ScenarioSummary | null {
  return FALLBACK_SCENARIOS.find((item) => item.slug === slug) ?? null;
}

export function getFallbackRankings(): RankingSection[] {
  return FALLBACK_RANKINGS;
}

export function getFallbackReviews(_slug: string): ToolReviewsResponse {
  return EMPTY_REVIEWS;
}

export function getFallbackAdminTools(): AdminToolListItem[] {
  return FALLBACK_TOOLS.map((tool) => ({
    id: tool.id,
    name: tool.name,
    slug: tool.slug,
    categoryName: tool.category,
    status: tool.status,
    score: tool.score,
    reviewCount: tool.reviewCount ?? 0,
  }));
}

export function getFallbackAdminOverview(): AdminOverviewResponse {
  return {
    toolCount: FALLBACK_TOOLS.length,
    draftToolCount: 0,
    publishedToolCount: FALLBACK_TOOLS.length,
    reviewCount: FALLBACK_TOOLS.reduce((sum, item) => sum + (item.reviewCount ?? 0), 0),
    rankingCount: FALLBACK_RANKINGS.length,
    recentUpdatedTools: FALLBACK_TOOLS.slice(0, 5).map((tool) => ({
      id: tool.id,
      name: tool.name,
      slug: tool.slug,
      status: tool.status,
      updatedAt: tool.lastVerifiedAt,
    })),
    matchPlanCount: 0,
    publishedMatchPlanCount: 0,
    recentPublishedMatchPlans: [],
  };
}
