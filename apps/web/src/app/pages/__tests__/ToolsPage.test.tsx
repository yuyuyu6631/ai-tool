import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import ToolsPage from "../ToolsPage";
import type { AiSearchResponse, ToolsDirectoryResponse } from "../../lib/catalog-types";

vi.mock("../../components/Header", () => ({
  default: () => <div>Header</div>,
}));

vi.mock("../../components/Footer", () => ({
  default: () => <div>Footer</div>,
}));

vi.mock("../../components/Breadcrumbs", () => ({
  default: () => <div>Breadcrumbs</div>,
}));

vi.mock("../../components/CompareToolsGrid", () => ({
  default: ({ items }: { items: Array<{ name: string }> }) => <div>{items.map((item) => item.name).join(", ")}</div>,
}));

vi.mock("../../lib/analytics", () => ({
  trackEvent: vi.fn(),
}));

const directory: ToolsDirectoryResponse = {
  items: [
    {
      id: 1,
      slug: "chatgpt",
      name: "ChatGPT",
      category: "通用助手",
      score: 9.5,
      summary: "适合写作、分析和代码协作。",
      tags: ["对话", "写作"],
      officialUrl: "https://chat.openai.com",
      logoPath: null,
      logoStatus: null,
      logoSource: null,
      status: "draft",
      featured: true,
      createdAt: "2026-03-01",
      price: "",
      reviewCount: 1,
      accessFlags: { needsVpn: false, cnLang: true },
      pricingType: "free",
    },
  ],
  total: 28,
  page: 2,
  pageSize: 9,
  hasMore: true,
  categories: [{ slug: "general", label: "通用助手", count: 1 }],
  tags: [
    { slug: "chat", label: "对话", count: 1 },
    { slug: "writing", label: "写作", count: 1 },
    { slug: "image", label: "图像", count: 1 },
    { slug: "video", label: "视频", count: 1 },
    { slug: "audio", label: "音频", count: 1 },
    { slug: "code", label: "代码", count: 1 },
    { slug: "agent", label: "智能体", count: 1 },
    { slug: "office", label: "办公", count: 1 },
    { slug: "report", label: "报表", count: 1 },
    { slug: "analytics", label: "分析", count: 1 },
  ],
  statuses: [{ slug: "draft", label: "草稿", count: 1 }],
  priceFacets: [{ slug: "free", label: "免费", count: 1 }],
  accessFacets: [
    { slug: "no-vpn", label: "国内直连", count: 1 },
    { slug: "cn-lang", label: "中文界面", count: 1 },
  ],
  priceRangeFacets: [{ slug: "free", label: "完全免费", count: 1 }],
  presets: [{ id: "hot", label: "最热", description: "高频工具", count: 1 }],
};

const aiSearch: AiSearchResponse = {
  mode: "ai",
  query: "帮我找免费做 PPT 的工具",
  normalized_query: "presentation free",
  ai_panel: {
    title: "AI 帮你理解了这个需求",
    user_need: "帮我找免费做 PPT 的工具",
    system_understanding: "用户希望按任务快速筛选工具",
    active_logic: ["任务: presentation", "免费优先"],
    quick_actions: [{ label: "只看免费", action: { type: "set_filter", key: "pricing", value: "free" } }],
  },
  results: directory.items,
  directory,
  meta: {
    latency_ms: 12,
    cache_hit: false,
    intent_source: "fallback",
    search_provider: "meilisearch",
    search_degraded: false,
  },
  agent_recommendation: {
    intent: {
      task: "做 PPT",
      summary: "用户需要免费 PPT 工具",
      constraints: ["免费优先"],
    },
    trace: [{ id: "intent", title: "识别任务", description: "识别 PPT 生成任务", status: "done" }],
    toolPlan: [
      {
        tool_slug: "chatgpt",
        tool_name: "ChatGPT",
        role: "主推荐",
        fit_reason: "适合生成提纲和页面文案",
        free_signal: "有免费额度",
        limitation_risk: "需要自行导入 PPT 工具排版",
        next_step: "先生成提纲",
      },
    ],
    alternatives: [],
    confidence: "medium",
  },
};

describe("ToolsPage", () => {
  it("renders search mode with filters and pagination", () => {
    render(<ToolsPage directory={directory} state={{ mode: "search", view: "hot", page: "2", pageSize: "24" }} />);

    expect(screen.getByRole("heading", { name: "工具目录" })).toBeInTheDocument();
    expect(screen.getAllByText("快速入口")[0]).toBeInTheDocument();
    expect(screen.getByText("ChatGPT")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "分页导航" })).toBeInTheDocument();
    expect(screen.getByText("模式：全部搜索")).toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toHaveAttribute("data-global-search-target", "tools");
    expect(screen.getByRole("link", { name: "上一页" })).toHaveAttribute(
      "href",
      "/tools?mode=search&view=hot&page=1&page_size=24",
    );
    expect(screen.getByRole("link", { name: "下一页" })).toHaveAttribute(
      "href",
      "/tools?mode=search&view=hot&page=3&page_size=24",
    );
  });

  it("keeps ai mode results without rendering search reasoning panels", () => {
    render(
      <ToolsPage
        directory={directory}
        aiSearch={aiSearch}
        state={{ mode: "ai", q: "帮我找免费做 PPT 的工具", view: "hot", page: "1" }}
      />,
    );

    expect(screen.queryByText("AI 理解")).not.toBeInTheDocument();
    expect(screen.queryByText("用户希望按任务快速筛选工具")).not.toBeInTheDocument();
    expect(screen.queryByText("Meilisearch")).not.toBeInTheDocument();
    expect(screen.queryByText("查看 AI 推荐报告")).not.toBeInTheDocument();
    expect(screen.queryByTestId("tools-agent-recommendation")).not.toBeInTheDocument();
    expect(screen.getByText("模式：AI 搜索")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "开始搜索" })).toBeInTheDocument();
  });

  it("keeps reset links on the tools route", () => {
    render(<ToolsPage directory={directory} state={{ mode: "search", view: "latest", page: "1" }} />);

    expect(screen.getAllByRole("link", { name: "重置筛选" })[0]).toHaveAttribute("href", "/tools?mode=search&page=1&page_size=24");
  });

  it("shows the canonical category label when the route uses a legacy category slug", () => {
    const imageDirectory: ToolsDirectoryResponse = {
      ...directory,
      total: 324,
      categories: [{ slug: "ai-图像", label: "AI 图像", count: 324 }],
    };

    render(<ToolsPage directory={imageDirectory} state={{ mode: "search", category: "ai-image", page: "1" }} />);

    expect(screen.getByText("分类：AI 图像")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "AI 图像 324" })[0]).toHaveClass("bg-[var(--accent-soft)]");
  });

  it("clears the ai pending state after switching ai focus", () => {
    const { rerender } = render(
      <ToolsPage
        directory={directory}
        state={{ mode: "ai", q: "帮我找免费做 PPT 的工具", view: "hot", page: "1" }}
      />,
    );

    fireEvent.submit(screen.getByRole("searchbox").closest("form") as HTMLFormElement);

    expect(screen.getByRole("status")).toHaveTextContent("AI 正在匹配工具，请稍候...");

    rerender(
      <ToolsPage
        directory={directory}
        state={{ mode: "ai", aiFocus: "list", q: "帮我找免费做 PPT 的工具", view: "hot", page: "1" }}
      />,
    );

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
