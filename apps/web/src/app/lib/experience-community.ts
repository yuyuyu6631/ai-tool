import type { ExperienceCommentItem, ExperienceListResponse, ExperiencePostItem } from "./catalog-types";

const now = "2026-05-14T00:00:00.000Z";

export const EXPERIENCE_CHANNELS = ["实战教程", "避坑反馈", "工具组合", "福利线索"] as const;

export const EXPERIENCE_BOARDS = [
  { id: 1, slug: "skill-community", title: "Skill 社区", description: "围绕工作流技能沉淀可复用做法。", accent: "gold", sortOrder: 10, postCount: 1 },
  { id: 2, slug: "mcp-community", title: "MCP 社区", description: "分享 MCP Server、工具连接和数据源接入。", accent: "blue", sortOrder: 20, postCount: 1 },
  { id: 3, slug: "openclaw-lobster", title: "OpenClaw 养龙虾", description: "OpenClaw 自动化、浏览器控制和本地助手玩法交流。", accent: "orange", sortOrder: 30, postCount: 1 },
  { id: 4, slug: "hammers-community", title: "Hammers 社区", description: "效率工具、智能代理和团队工具链组合讨论。", accent: "ink", sortOrder: 40, postCount: 1 },
];

export const EXPERIENCE_POSTS: ExperiencePostItem[] = [
  {
    id: 1,
    slug: "chatgpt-gamma-prd-report",
    title: "用 ChatGPT 先拆 PRD，再让 Gamma 生成汇报初稿",
    summary: "先把客户访谈拆成目标、限制和验收点，再把结构化内容交给演示工具生成可评审版本。",
    body: "把客户访谈材料拆成目标、受众、限制和验收标准，再交给 Gamma 生成评审稿。最后人工复核客户原话和关键数据，避免把未确认指标包装成结论。",
    channel: "实战教程",
    boardSlug: "skill-community",
    boardTitle: "Skill 社区",
    scenario: "文档写作",
    tools: ["ChatGPT", "Gamma"],
    roles: ["产品", "运营"],
    coverImageUrl: "/brand/logo.png",
    imageUrls: ["/logos/博思AIPPT.png", "/logos/135 AI排版助手.png"],
    author: { username: "星点评编辑部" },
    status: "published",
    viewCount: 128,
    likeCount: 34,
    favoriteCount: 17,
    commentCount: 6,
    isOfficial: true,
    publishedAt: "2026-05-08T00:00:00.000Z",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    slug: "mcp-figma-docs-workflow",
    title: "MCP 社区周报：把 Figma、Docs 和本地脚本串成设计验收流",
    summary: "用 MCP 连接设计稿、文档和本地检查脚本，减少反复截图确认，让评审记录可追溯。",
    body: "团队把 Figma 标注、产品文档和本地 lint/test 结果接进同一条工作流。讨论重点不是炫插件，而是权限、失败兜底和可复现的验收链路。",
    channel: "工具组合",
    boardSlug: "mcp-community",
    boardTitle: "MCP 社区",
    scenario: "设计实现",
    tools: ["MCP", "Figma", "Google Docs"],
    roles: ["前端", "设计"],
    coverImageUrl: "/logos/爱设计.png",
    imageUrls: ["/logos/阿里云百炼.png"],
    author: { username: "MCP 观察员" },
    status: "published",
    viewCount: 214,
    likeCount: 62,
    favoriteCount: 38,
    commentCount: 18,
    isOfficial: false,
    publishedAt: "2026-05-12T00:00:00.000Z",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 3,
    slug: "openclaw-browser-agent-lobster",
    title: "OpenClaw 养龙虾：浏览器代理跑网页验收，先管住权限",
    summary: "把 OpenClaw 用在本地浏览器验收时，先限制可访问页面和写操作，避免自动化越界。",
    body: "社区里最有效的做法是把验收目标写清楚：只检查页面状态、截图和交互，不让代理碰账户、支付和危险操作。",
    channel: "避坑反馈",
    boardSlug: "openclaw-lobster",
    boardTitle: "OpenClaw 养龙虾",
    scenario: "浏览器自动化",
    tools: ["OpenClaw", "Playwright"],
    roles: ["全栈", "测试"],
    coverImageUrl: "/logos/遨虾.png",
    imageUrls: ["/logos/办公小浣熊.png"],
    author: { username: "养虾实践者" },
    status: "published",
    viewCount: 189,
    likeCount: 47,
    favoriteCount: 25,
    commentCount: 12,
    isOfficial: false,
    publishedAt: "2026-05-13T00:00:00.000Z",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 4,
    slug: "hammers-agent-tool-stack",
    title: "Hammers 社区：团队 Agent 工具栈怎么分层才不乱",
    summary: "把搜索、写作、代码、部署和知识库分层管理，避免每个人都在重复试同一批工具。",
    body: "Hammers 社区的讨论集中在工具栈治理：个人效率工具、团队共享知识库、开发自动化和发布监控分层维护。",
    channel: "福利线索",
    boardSlug: "hammers-community",
    boardTitle: "Hammers 社区",
    scenario: "团队工具栈",
    tools: ["Hammers", "Notion AI", "Cursor"],
    roles: ["研发管理", "运营"],
    coverImageUrl: "/logos/Cosine Genie.png",
    imageUrls: ["/logos/Flowin.png"],
    author: { username: "效率工具主理人" },
    status: "published",
    viewCount: 167,
    likeCount: 39,
    favoriteCount: 22,
    commentCount: 9,
    isOfficial: false,
    publishedAt: "2026-05-14T00:00:00.000Z",
    createdAt: now,
    updatedAt: now,
  },
];

export const EXPERIENCE_COMMENTS: Record<string, ExperienceCommentItem[]> = {
  "chatgpt-gamma-prd-report": [
    { id: 1, postId: 1, body: "这个流程适合评审稿，最终版还是要人工补客户证据。", imageUrl: "", status: "published", likeCount: 0, author: { username: "产品经理 Leo" }, createdAt: now, updatedAt: now },
  ],
};

export function getFallbackExperienceList(channel?: string | null, board?: string | null): ExperienceListResponse {
  const items = EXPERIENCE_POSTS.filter((post) => (!channel || post.channel === channel) && (!board || post.boardSlug === board));
  return {
    items,
    boards: EXPERIENCE_BOARDS,
    channels: [...EXPERIENCE_CHANNELS],
    total: items.length,
    page: 1,
    pageSize: 20,
    hasMore: false,
  };
}

export function getFallbackExperiencePost(slug: string): ExperiencePostItem | null {
  return EXPERIENCE_POSTS.find((post) => post.slug === slug) ?? null;
}

export function getFallbackExperienceComments(slug: string): ExperienceCommentItem[] {
  return EXPERIENCE_COMMENTS[slug] ?? [];
}
