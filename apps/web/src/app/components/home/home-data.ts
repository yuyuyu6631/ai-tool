export const HOME_ENTRY_CARDS = [
  {
    href: "/scenarios",
    title: "看任务场景",
    lightBody: "按 PPT、写作、开发、数据分析这些真实任务看推荐",
    darkBody: "按真实任务看榜单，不用在同类工具里反复试错",
  },
  {
    href: "/experiences",
    title: "看经验社区",
    lightBody: "真实用户分享的使用心得、避坑指南和工具组合方案",
    darkBody: "看看别人怎么用、踩过什么坑、哪些组合更顺手",
  },
  {
    href: "/benefits",
    title: "看免费福利",
    lightBody: "每天更新，哪些现在免费可用、哪些有坑，我们帮你盯着",
    darkBody: "哪些今天免费、哪些有额度、哪些国内能用，每天盯着给你更新",
  },
] as const;

export const QUICK_TASKS = [
  {
    id: "paper",
    label: "写作润色",
    query: "帮我润色一篇公众号文章",
    href: "/tools?mode=ai&q=%E5%B8%AE%E6%88%91%E6%B6%A6%E8%89%B2%E4%B8%80%E7%AF%87%E5%85%AC%E4%BC%97%E5%8F%B7%E6%96%87%E7%AB%A0&page=1&page_size=24",
  },
  {
    id: "ppt",
    label: "PPT 初稿",
    darkLabel: "PPT 初稿",
    query: "帮我做一份销售汇报 PPT 初稿",
    href: "/tools?mode=ai&q=%E5%B8%AE%E6%88%91%E5%81%9A%E4%B8%80%E4%BB%BD%E9%94%80%E5%94%AE%E6%B1%87%E6%8A%A5%20PPT%20%E5%88%9D%E7%A8%BF&page=1&page_size=24",
  },
  {
    id: "data",
    label: "表格分析",
    query: "帮我分析运营数据表格",
    href: "/tools?mode=ai&q=%E5%B8%AE%E6%88%91%E5%88%86%E6%9E%90%E8%BF%90%E8%90%A5%E6%95%B0%E6%8D%AE%E8%A1%A8%E6%A0%BC&page=1&page_size=24",
  },
  {
    id: "code",
    label: "代码修复",
    darkLabel: "代码修复",
    query: "帮我修复前端代码报错",
    href: "/tools?mode=ai&q=%E5%B8%AE%E6%88%91%E4%BF%AE%E5%A4%8D%E5%89%8D%E7%AB%AF%E4%BB%A3%E7%A0%81%E6%8A%A5%E9%94%99&page=1&page_size=24",
  },
  {
    id: "report",
    label: "客户开发",
    query: "帮我生成客户开发邮件和跟进话术",
    href: "/tools?mode=ai&q=%E5%B8%AE%E6%88%91%E7%94%9F%E6%88%90%E5%AE%A2%E6%88%B7%E5%BC%80%E5%8F%91%E9%82%AE%E4%BB%B6%E5%92%8C%E8%B7%9F%E8%BF%9B%E8%AF%9D%E6%9C%AF&page=1&page_size=24",
  },
] as const;

export type QuickTask = (typeof QUICK_TASKS)[number];
