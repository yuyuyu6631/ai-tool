export interface Benefit {
  id: string;
  name: string;
  toolName: string;
  toolSlug: string;
  scenario: string[];
  type: "免费额度" | "限时试用" | "活动券" | "开发者额度" | "学生权益";
  expireLabel: string;
  status: "可领取" | "即将过期" | "已结束";
  isVerified: boolean;
  summary: string;
}

export const BENEFITS = [
  { id: "chatgpt-free-quota", name: "新用户免费体验额度", toolName: "ChatGPT", toolSlug: "chatgpt", scenario: ["对话写作", "代码辅助", "翻译"], type: "免费额度", expireLabel: "注册后30天", status: "可领取", isVerified: true, summary: "新注册用户可获得GPT-4o对话额度，覆盖日常写作与编程需求。" },
  { id: "kimi-long-doc", name: "长文档阅读免费额度", toolName: "Kimi", toolSlug: "kimi", scenario: ["文档阅读", "论文总结", "资料整理"], type: "免费额度", expireLabel: "长期有效", status: "可领取", isVerified: true, summary: "支持超长文档上传与智能问答，每日免费额度满足日常使用。" },
  { id: "cursor-student", name: "学生开发者免费Pro", toolName: "Cursor", toolSlug: "cursor", scenario: ["代码编写", "项目开发", "学习编程"], type: "学生权益", expireLabel: "在校期间有效", status: "可领取", isVerified: true, summary: "通过教育邮箱验证后可免费使用Cursor Pro全部功能。" },
  { id: "canva-premium-trial", name: "高级素材7天试用", toolName: "Canva", toolSlug: "canva", scenario: ["海报设计", "PPT制作", "社交媒体"], type: "限时试用", expireLabel: "7天后", status: "可领取", isVerified: false, summary: "解锁全部高级模板、素材库和品牌工具，适合短期设计项目。" },
  { id: "xingqi-shuxuan-trial", name: "数璇官方体验入口", toolName: "星启·数璇", toolSlug: "xingqi-shuxuan", scenario: ["数据分析", "可视化", "报表生成"], type: "免费额度", expireLabel: "长期有效", status: "可领取", isVerified: true, summary: "官方提供免费体验额度，支持数据导入、分析与可视化全流程。" },
  { id: "xingqi-wenshu-trial", name: "文枢文档智能体试用", toolName: "星启·文枢", toolSlug: "xingqi-wenshu", scenario: ["文档写作", "报告生成", "内容改写"], type: "限时试用", expireLabel: "本月有效", status: "可领取", isVerified: true, summary: "文档智能体免费试用，支持长文写作、格式排版和内容优化。" },
  { id: "xingqi-maiqing-dev", name: "脉擎开发者额度", toolName: "星启脉擎", toolSlug: "xingqi-maiqing", scenario: ["API调用", "应用开发", "模型集成"], type: "开发者额度", expireLabel: "申请后90天", status: "可领取", isVerified: true, summary: "面向开发者的免费API调用额度，适合集成测试和原型验证。" },
  { id: "mita-search-free", name: "免费AI搜索额度", toolName: "秘塔AI搜索", toolSlug: "mita-ai-search", scenario: ["信息检索", "学术搜索", "知识问答"], type: "免费额度", expireLabel: "每日重置", status: "可领取", isVerified: true, summary: "每日免费搜索额度充足，支持深度问答和多源信息聚合。" },
  { id: "gamma-ppt-trial", name: "PPT生成限时试用", toolName: "Gamma", toolSlug: "gamma", scenario: ["PPT制作", "演示文稿", "方案展示"], type: "限时试用", expireLabel: "3天后", status: "即将过期", isVerified: false, summary: "AI一键生成演示文稿，限时免费体验高级模板和导出功能。" },
] as const satisfies readonly Benefit[];

export function getBenefitById(id: string): Benefit | undefined {
  return BENEFITS.find((b) => b.id === id);
}

export function getBenefitsByTool(toolSlug: string): Benefit[] {
  return BENEFITS.filter((b) => b.toolSlug === toolSlug);
}

export function getBenefitsByScenario(scenario: string): Benefit[] {
  return BENEFITS.filter((b) => (b.scenario as readonly string[]).includes(scenario));
}
