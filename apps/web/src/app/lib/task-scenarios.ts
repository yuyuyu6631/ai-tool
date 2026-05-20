export const TASK_SCENARIOS = [
  {
    slug: "content-production",
    name: "内容生产",
    icon: "文",
    description: "从选题、初稿到多平台分发，用 AI 加速内容产出节奏。",
    subtasks: ["选题策划与大纲生成", "图文初稿撰写", "短视频脚本生成", "多平台适配改写", "内容数据复盘分析"],
    relatedToolSlugs: ["chatgpt", "canva", "kimi"],
    count: 156,
  },
  {
    slug: "data-analysis",
    name: "数据分析",
    icon: "数",
    description: "导入数据、提问、出图、出结论，让分析门槛降到零。",
    subtasks: ["数据清洗与格式化", "趋势洞察与异常检测", "可视化图表生成", "分析报告自动撰写", "预测模型搭建"],
    relatedToolSlugs: ["xingqi-shuxuan", "chatgpt"],
    count: 98,
  },
  {
    slug: "document-writing",
    name: "文档写作",
    icon: "档",
    description: "报告、方案、会议纪要，从素材到成稿一站完成。",
    subtasks: ["会议纪要自动整理", "周报月报快速生成", "技术文档结构化撰写", "合同协议初稿生成", "文档格式统一排版"],
    relatedToolSlugs: ["chatgpt", "kimi", "xingqi-wenshu"],
    count: 134,
  },
  {
    slug: "code-development",
    name: "代码开发",
    icon: "码",
    description: "写代码、查 Bug、做 Code Review，开发效率翻倍。",
    subtasks: ["代码补全与生成", "Bug 定位与修复建议", "代码重构与优化", "单元测试自动生成", "代码审查与规范检查"],
    relatedToolSlugs: ["cursor", "chatgpt"],
    count: 187,
  },
  {
    slug: "customer-proposal",
    name: "客户方案",
    icon: "案",
    description: "客户需求拆解、方案撰写、PPT 生成，半天交付初稿。",
    subtasks: ["客户需求拆解与分析", "方案框架自动生成", "案例库智能匹配", "PPT 演示文稿生成", "方案版本迭代管理"],
    relatedToolSlugs: ["xingqi-wenshu", "chatgpt", "gamma"],
    count: 72,
  },
  {
    slug: "competitive-research",
    name: "竞品调研",
    icon: "竞",
    description: "搜集竞品信息、对比功能差异、输出调研报告。",
    subtasks: ["竞品信息自动采集", "功能对比表生成", "用户评价情感分析", "市场趋势洞察报告", "差异化策略建议"],
    relatedToolSlugs: ["kimi", "mita-ai-search", "chatgpt"],
    count: 63,
  },
  {
    slug: "automation-efficiency",
    name: "自动化效率",
    icon: "流",
    description: "把重复劳动交给 AI，让流程自动跑起来。",
    subtasks: ["工作流自动化搭建", "邮件与消息自动回复", "数据定时采集与汇总", "审批流程智能化", "跨系统数据同步"],
    relatedToolSlugs: ["xingqi-maiqing", "chatgpt"],
    count: 89,
  },
  {
    slug: "image-video-generation",
    name: "图片/视频生成",
    icon: "图",
    description: "从文字描述到视觉成品，设计不再依赖专业技能。",
    subtasks: ["营销海报智能设计", "产品图生成与优化", "短视频素材批量生成", "品牌视觉一致性检查", "图片修复与风格迁移"],
    relatedToolSlugs: ["canva", "chatgpt"],
    count: 112,
  },
  {
    slug: "agent-building",
    name: "智能体搭建",
    icon: "智",
    description: "无需代码搭建专属 AI 助手，覆盖客服、运营、知识问答。",
    subtasks: ["对话流程设计与测试", "知识库导入与管理", "多轮对话逻辑编排", "外部 API 集成对接", "智能体发布与运维"],
    relatedToolSlugs: ["xingqi-maiqing", "chatgpt"],
    count: 45,
  },
] as const;

type Scenario = (typeof TASK_SCENARIOS)[number];

export function getScenarioBySlug(slug: string): Scenario | undefined {
  return TASK_SCENARIOS.find((scenario) => scenario.slug === slug);
}

export function getScenarioSlugs(): string[] {
  return TASK_SCENARIOS.map((scenario) => scenario.slug);
}
