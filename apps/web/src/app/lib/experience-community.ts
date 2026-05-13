export const EXPERIENCE_CHANNELS = [
  {
    title: "实战教程",
    description: "从任务背景、工具选择、操作过程到输出结果，沉淀可复用做法。",
    count: 12,
  },
  {
    title: "避坑反馈",
    description: "记录免费额度、导出限制、模型幻觉、协作成本和真实使用边界。",
    count: 8,
  },
  {
    title: "工具组合",
    description: "围绕一个工作任务，把多个工具串成可执行流程。",
    count: 6,
  },
  {
    title: "福利线索",
    description: "补充限时试用、开发者额度、教育优惠和领取路径。",
    count: 5,
  },
] as const;

export const EXPERIENCE_POSTS = [
  {
    title: "用 ChatGPT 先拆 PRD，再让 Gamma 生成汇报初稿",
    channel: "实战教程",
    scenario: "文档写作",
    tools: ["ChatGPT", "Gamma"],
    author: "星点评编辑部",
    summary: "先把客户访谈拆成目标、限制和验收点，再把结构化内容交给演示工具生成可评审版本。",
    stats: "浏览 128 · 收藏 17 · 评论 6",
  },
  {
    title: "Cursor 定位前端报错时，不要让它顺手重构全项目",
    channel: "避坑反馈",
    scenario: "代码开发",
    tools: ["Cursor"],
    author: "全栈研发用户",
    summary: "把报错栈、接口返回和组件边界一次给清楚，要求只找最小修改点，最后用测试固定结果。",
    stats: "浏览 96 · 收藏 12 · 评论 4",
  },
  {
    title: "售前方案半天出稿：客户背景、痛点和案例怎么喂给 AI",
    channel: "工具组合",
    scenario: "客户方案",
    tools: ["Claude", "Gamma", "Canva AI"],
    author: "售前顾问",
    summary: "先用长文本模型归纳客户材料，再用 PPT 工具生成骨架，最后用设计工具统一关键页面。",
    stats: "浏览 142 · 收藏 21 · 评论 9",
  },
] as const;
