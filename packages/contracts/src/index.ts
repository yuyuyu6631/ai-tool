export type ToolStatus = "published" | "draft" | "archived";

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
  logoPath?: string;
  logoStatus?: string | null;
  logoSource?: string | null;
  status: ToolStatus;
  featured: boolean;
  createdAt: string;
  price?: string;
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
  developer?: string;
  country?: string;
  city?: string;
  price?: string;
  platforms?: string;
  vpnRequired?: string;
  targetAudience: string[];
  abilities: string[];
  pros: string[];
  cons: string[];
  pitfalls?: string[];
  scenarios: string[];
  scenarioRecommendations?: ScenarioRecommendation[];
  reviewPreview?: ReviewPreview[];
  mediaItems?: ToolMediaItem[];
  alternatives: string[];
  status: ToolStatus;
  lastVerifiedAt: string;
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
  status: ToolStatus | string;
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

export interface ScenarioSummary {
  id: number;
  slug: string;
  title: string;
  description: string;
  problem: string;
  toolCount: number;
  primaryTools: string[];
  alternativeTools: string[];
  targetAudience: string[];
}

export interface CategorySummary {
  slug: string;
  name: string;
  description: string;
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

export interface RecommendRequest {
  query: string;
  scenario?: string;
  tags?: string[];
  candidateSlugs?: string[];
}

export interface RecommendResult {
  tool_id: number;
  name: string;
  slug: string;
  reason: string;
  score: number;
  logoPath?: string;
}

export interface RecommendResponse {
  items: RecommendResult[];
  source: "cache" | "rules" | "ai";
}

export const categories: CategorySummary[] = [
  {
    slug: "general-assistants",
    name: "通用助手",
    description: "覆盖问答、搜索、总结与多任务处理。"
  },
  {
    slug: "writing-office",
    name: "写作办公",
    description: "适合 PPT、邮件、长文与知识整理。"
  },
  {
    slug: "coding-dev",
    name: "编程开发",
    description: "面向代码生成、调试、重构与提效。"
  },
  {
    slug: "design-media",
    name: "设计创作",
    description: "适合视觉、视频、音频与品牌内容产出。"
  },
  {
    slug: "agent-platform",
    name: "智能体平台",
    description: "支持知识库、工作流与 AI 应用落地。"
  }
];

export const tools: ToolDetail[] = [
  {
    id: 1,
    slug: "chatgpt",
    name: "ChatGPT",
    category: "通用助手",
    score: 9.6,
    summary: "综合能力最稳的通用 AI 助手，适合写作、分析、搜索和代码协作。",
    tags: ["对话问答", "内容生成", "数据分析"],
    officialUrl: "https://chat.openai.com",
    logoPath: "/brand/logo.png",
    featured: true,
    createdAt: "2026-03-01",
    description: "ChatGPT 适合作为默认起点，覆盖大多数知识工作与多步骤任务。",
    editorComment: "如果你不确定先试哪个工具，ChatGPT 往往是容错率最高的起点。",
    targetAudience: ["运营", "产品经理", "研究人员", "开发者"],
    abilities: ["问答", "写作", "总结", "代码辅助"],
    pros: ["覆盖面广", "生态成熟", "多场景可用"],
    cons: ["部分高级能力依赖付费", "需要稳定网络访问"],
    scenarios: ["写邮件", "整理资料", "头脑风暴"],
    alternatives: ["claude", "gemini"],
    status: "published",
    lastVerifiedAt: "2026-03-20"
  },
  {
    id: 2,
    slug: "claude",
    name: "Claude",
    category: "通用助手",
    score: 9.4,
    summary: "长文本理解和结构化表达很强，适合深度分析与专业写作。",
    tags: ["长文分析", "专业写作", "逻辑推理"],
    officialUrl: "https://claude.ai",
    featured: true,
    createdAt: "2026-03-02",
    description: "Claude 在长文本场景的稳定性和阅读体验尤其突出。",
    editorComment: "做文档分析、方案整理、复杂说明时，Claude 很容易打出优势。",
    targetAudience: ["咨询顾问", "研究人员", "内容团队"],
    abilities: ["长文分析", "专业写作", "方案整理"],
    pros: ["长上下文", "表达自然", "适合复杂文本"],
    cons: ["访问门槛较高", "速度有时略慢"],
    scenarios: ["方案评审", "长文摘要", "合同初读"],
    alternatives: ["chatgpt", "gemini"],
    status: "published",
    lastVerifiedAt: "2026-03-20"
  },
  {
    id: 3,
    slug: "gamma",
    name: "Gamma",
    category: "写作办公",
    score: 9.0,
    summary: "快速生成演示文稿和提案页面，适合先出结果再细调。",
    tags: ["PPT", "演示稿", "提案"],
    officialUrl: "https://gamma.app",
    featured: true,
    createdAt: "2026-03-03",
    description: "Gamma 非常适合赶提案、汇报和路演初稿。",
    editorComment: "如果你经常要在短时间内拿出像样的 PPT，Gamma 值得优先试。",
    targetAudience: ["销售", "产品经理", "创业者"],
    abilities: ["演示生成", "页面排版", "文案整理"],
    pros: ["上手快", "成稿速度快", "视觉完成度高"],
    cons: ["深度自定义有限", "中文细节仍需手调"],
    scenarios: ["做汇报", "写提案", "项目展示"],
    alternatives: ["canva-ai"],
    status: "published",
    lastVerifiedAt: "2026-03-18"
  },
  {
    id: 4,
    slug: "notion-ai",
    name: "Notion AI",
    category: "写作办公",
    score: 8.7,
    summary: "和知识库、文档协作天然结合，适合团队知识整理。",
    tags: ["知识库", "文档协作", "总结"],
    officialUrl: "https://www.notion.so/product/ai",
    featured: false,
    createdAt: "2026-03-11",
    description: "对 Notion 重度用户来说，它是最顺手的 AI 增强能力。",
    editorComment: "如果团队已经在 Notion 中工作，Notion AI 的整合价值非常高。",
    targetAudience: ["内容团队", "运营团队", "项目团队"],
    abilities: ["文档生成", "总结", "润色"],
    pros: ["协作顺滑", "知识沉淀自然", "团队适配好"],
    cons: ["依赖 Notion 生态", "独立能力不算最强"],
    scenarios: ["会议纪要", "周报", "文档整理"],
    alternatives: ["chatgpt", "claude"],
    status: "published",
    lastVerifiedAt: "2026-03-16"
  },
  {
    id: 5,
    slug: "cursor",
    name: "Cursor",
    category: "编程开发",
    score: 9.3,
    summary: "AI 原生代码编辑器，适合高频编码、修改和重构。",
    tags: ["代码生成", "重构", "编辑器"],
    officialUrl: "https://cursor.com",
    featured: true,
    createdAt: "2026-03-04",
    description: "Cursor 在真实开发流里能把 AI 放到离代码最近的位置。",
    editorComment: "对需要高频改代码的团队，Cursor 往往比单纯聊天式工具更直接。",
    targetAudience: ["开发者", "技术团队"],
    abilities: ["代码生成", "解释代码", "重构建议"],
    pros: ["集成度高", "上下文连续", "编码效率强"],
    cons: ["依赖订阅", "复杂仓库仍需人工把控"],
    scenarios: ["日常开发", "修 bug", "代码重构"],
    alternatives: ["copilot", "chatgpt"],
    status: "published",
    lastVerifiedAt: "2026-03-20"
  },
  {
    id: 6,
    slug: "github-copilot",
    name: "GitHub Copilot",
    category: "编程开发",
    score: 9.1,
    summary: "适合主流 IDE 的补全与代码建议，学习成本低。",
    tags: ["补全", "IDE 插件", "编码效率"],
    officialUrl: "https://github.com/features/copilot",
    featured: false,
    createdAt: "2026-03-06",
    description: "Copilot 是很多开发团队的默认效率工具。",
    editorComment: "如果你不想换编辑器，Copilot 是最顺滑的上手方式之一。",
    targetAudience: ["开发者", "学生", "技术团队"],
    abilities: ["代码补全", "注释生成", "函数建议"],
    pros: ["集成广", "学习成本低", "补全稳定"],
    cons: ["复杂任务仍需外部上下文", "价格随团队规模增长"],
    scenarios: ["编码补全", "原型开发", "学习新框架"],
    alternatives: ["cursor"],
    status: "published",
    lastVerifiedAt: "2026-03-18"
  },
  {
    id: 7,
    slug: "midjourney",
    name: "Midjourney",
    category: "设计创作",
    score: 9.2,
    summary: "高完成度 AI 绘图工具，适合创意视觉探索与海报草图。",
    tags: ["图像生成", "海报", "视觉创意"],
    officialUrl: "https://www.midjourney.com",
    featured: true,
    createdAt: "2026-03-05",
    description: "Midjourney 仍然是做高质感图像探索时的重要选择。",
    editorComment: "如果你追求氛围感和视觉冲击力，它通常会给你更漂亮的第一稿。",
    targetAudience: ["设计师", "内容创作者", "品牌团队"],
    abilities: ["图像生成", "风格探索", "概念草图"],
    pros: ["画面质量高", "风格明显", "灵感激发强"],
    cons: ["工作流门槛较高", "商业使用需关注版权策略"],
    scenarios: ["海报灵感", "封面图", "品牌视觉"],
    alternatives: ["canva-ai"],
    status: "published",
    lastVerifiedAt: "2026-03-17"
  },
  {
    id: 8,
    slug: "runway",
    name: "Runway",
    category: "设计创作",
    score: 8.9,
    summary: "视频生成和视频编辑能力强，适合内容团队快速出片。",
    tags: ["视频生成", "视频编辑", "创意内容"],
    officialUrl: "https://runwayml.com",
    featured: false,
    createdAt: "2026-03-10",
    description: "Runway 是视频内容团队最值得关注的 AI 工具之一。",
    editorComment: "如果你准备做短视频或产品演示，它能明显缩短首版制作时间。",
    targetAudience: ["视频团队", "营销团队", "创作者"],
    abilities: ["视频生成", "编辑", "镜头重制"],
    pros: ["效果强", "适合内容团队", "创作效率高"],
    cons: ["成本偏高", "渲染等待较长"],
    scenarios: ["宣传片", "社媒视频", "产品演示"],
    alternatives: ["heygen"],
    status: "published",
    lastVerifiedAt: "2026-03-18"
  },
  {
    id: 9,
    slug: "coze",
    name: "扣子 Coze",
    category: "智能体平台",
    score: 8.8,
    summary: "适合快速搭建智能体、知识库和工作流，国内团队易上手。",
    tags: ["智能体", "知识库", "工作流"],
    officialUrl: "https://www.coze.cn",
    featured: true,
    createdAt: "2026-03-07",
    description: "Coze 适合业务团队快速验证智能体场景。",
    editorComment: "如果你希望在国内团队里更快落地 AI 应用，Coze 往往是更现实的起点。",
    targetAudience: ["运营团队", "产品团队", "企业数字化团队"],
    abilities: ["机器人搭建", "知识库问答", "工作流配置"],
    pros: ["国内访问顺畅", "上手快", "适合业务试点"],
    cons: ["复杂定制受限", "部分能力平台化约束较多"],
    scenarios: ["客服问答", "内部助手", "流程自动化"],
    alternatives: ["dify"],
    status: "published",
    lastVerifiedAt: "2026-03-21"
  },
  {
    id: 10,
    slug: "dify",
    name: "Dify",
    category: "智能体平台",
    score: 8.7,
    summary: "开源 LLM 应用平台，适合有研发能力的团队做私有化与编排。",
    tags: ["开源", "LLM 平台", "私有化"],
    officialUrl: "https://dify.ai",
    featured: true,
    createdAt: "2026-03-08",
    description: "Dify 在开源、可控和可扩展之间取得了不错平衡。",
    editorComment: "如果你的团队希望自己掌控模型、流程和部署，Dify 的性价比很高。",
    targetAudience: ["技术团队", "AI 产品团队", "企业研发"],
    abilities: ["应用编排", "知识库", "模型切换"],
    pros: ["开源可控", "支持私有化", "适合持续迭代"],
    cons: ["需要研发支持", "维护成本高于托管平台"],
    scenarios: ["企业应用", "客服机器人", "内部知识库"],
    alternatives: ["coze"],
    status: "published",
    lastVerifiedAt: "2026-03-22"
  },
  {
    id: 11,
    slug: "perplexity",
    name: "Perplexity",
    category: "通用助手",
    score: 8.8,
    summary: "适合联网检索和快速拿到带来源的答案。",
    tags: ["AI 搜索", "带来源", "研究"],
    officialUrl: "https://www.perplexity.ai",
    featured: false,
    createdAt: "2026-03-12",
    description: "Perplexity 在信息检索和快速调研场景特别顺手。",
    editorComment: "当你先需要确定方向而不是立刻深写内容时，Perplexity 很有价值。",
    targetAudience: ["研究人员", "学生", "内容团队"],
    abilities: ["搜索", "来源引用", "快速摘要"],
    pros: ["信息获取快", "来源感更强", "适合调研"],
    cons: ["深加工能力不如通用助手", "复杂结论仍需复核"],
    scenarios: ["市场调研", "查资料", "跟进新闻"],
    alternatives: ["chatgpt"],
    status: "published",
    lastVerifiedAt: "2026-03-19"
  },
  {
    id: 12,
    slug: "canva-ai",
    name: "Canva AI",
    category: "设计创作",
    score: 8.5,
    summary: "适合非设计岗位快速生成海报、封面和轻量视觉素材。",
    tags: ["海报", "模板", "轻设计"],
    officialUrl: "https://www.canva.com",
    featured: false,
    createdAt: "2026-03-14",
    description: "Canva AI 适合没有专业设计资源时快速产出可用素材。",
    editorComment: "如果团队缺设计支持，Canva AI 很适合做第一版社媒和宣传素材。",
    targetAudience: ["运营", "市场团队", "创业团队"],
    abilities: ["模板生成", "文案配图", "版式组合"],
    pros: ["上手快", "模板多", "低门槛"],
    cons: ["创意上限有限", "品牌一致性仍需人工把控"],
    scenarios: ["海报", "封面图", "活动页素材"],
    alternatives: ["midjourney"],
    status: "published",
    lastVerifiedAt: "2026-03-15"
  }
];

export const scenarios: ScenarioSummary[] = [
  {
    id: 1,
    slug: "ppt",
    title: "做 PPT 用什么 AI",
    description: "优先看能快速产出完整演示稿的工具，避免从空白页开始。",
    problem: "汇报和提案常常时间紧，需要在很短时间内拿出结构完整、视觉可用的演示稿。",
    toolCount: 3,
    primaryTools: ["gamma", "canva-ai"],
    alternativeTools: ["chatgpt"],
    targetAudience: ["销售", "产品经理", "创业者"]
  },
  {
    id: 2,
    slug: "writing",
    title: "写文章和邮件用什么 AI",
    description: "适合先出结构、再润色成稿的内容工作流。",
    problem: "很多内容岗位不是没有想法，而是难在稳定、持续、高质量地输出。",
    toolCount: 4,
    primaryTools: ["chatgpt", "claude", "notion-ai"],
    alternativeTools: ["gamma"],
    targetAudience: ["运营", "内容团队", "咨询顾问"]
  },
  {
    id: 3,
    slug: "coding-assistant",
    title: "编程开发用什么 AI",
    description: "优先考虑能融入 IDE 和代码仓库的协作型工具。",
    problem: "开发者真正需要的不是演示级回答，而是能进入上下文、减少重复劳动的助手。",
    toolCount: 3,
    primaryTools: ["cursor", "github-copilot"],
    alternativeTools: ["chatgpt"],
    targetAudience: ["开发者", "技术团队"]
  },
  {
    id: 4,
    slug: "agent-platform",
    title: "搭企业智能体用什么平台",
    description: "适合知识库、客服机器人和工作流自动化场景。",
    problem: "企业落地 AI 应用不缺想法，真正难的是速度、可控性和后续维护。",
    toolCount: 3,
    primaryTools: ["coze", "dify"],
    alternativeTools: ["chatgpt"],
    targetAudience: ["企业团队", "产品团队", "技术团队"]
  }
];

export const rankingDefinitions = [
  {
    slug: "hot",
    title: "热门工具榜",
    description: "优先暴露综合热度和适用面最稳的选择。",
    toolSlugs: ["chatgpt", "claude", "cursor", "gamma", "coze", "midjourney"]
  },
  {
    slug: "writing",
    title: "写作办公榜",
    description: "聚焦演示、文档、邮件和知识整理。",
    toolSlugs: ["gamma", "claude", "chatgpt", "notion-ai"]
  },
  {
    slug: "coding",
    title: "编程开发榜",
    description: "适合代码生成、调试、重构和日常开发提效。",
    toolSlugs: ["cursor", "github-copilot", "chatgpt"]
  },
  {
    slug: "agents",
    title: "智能体平台榜",
    description: "面向知识库问答、机器人与企业工作流场景。",
    toolSlugs: ["coze", "dify", "chatgpt"]
  }
] as const;

export function findToolBySlug(slug: string) {
  return tools.find((tool) => tool.slug === slug);
}
