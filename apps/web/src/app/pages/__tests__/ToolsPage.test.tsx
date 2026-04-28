import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import ToolsPage from "../ToolsPage";
import type { ToolsDirectoryResponse } from "../../lib/catalog-types";

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

describe("ToolsPage", () => {
  it("renders search mode with filters and pagination", () => {
    render(<ToolsPage directory={directory} state={{ mode: "search", view: "hot", page: "2" }} />);

    expect(screen.getByRole("heading", { name: "工具目录" })).toBeInTheDocument();
    expect(screen.getByText("决策筛选")).toBeInTheDocument();
    expect(screen.getByText("ChatGPT")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "分页导航" })).toBeInTheDocument();
    expect(screen.getByText("模式：直接搜索")).toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toHaveAttribute("data-global-search-target", "tools");
  });

  it("renders ai mode panel", () => {
    render(
      <ToolsPage
        directory={directory}
        state={{ mode: "ai", q: "帮我找免费做 PPT 的工具", view: "hot", page: "1" }}
      />,
    );

    expect(screen.getByText("AI 理解面板")).toBeInTheDocument();
    expect(screen.getByText("你的需求")).toBeInTheDocument();
    expect(screen.getByText("系统理解")).toBeInTheDocument();
    expect(screen.getByText("当前优先筛选逻辑")).toBeInTheDocument();
    expect(screen.getByText("可执行快捷动作")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "只看免费" })).toBeInTheDocument();
  });

  it("clears the ai pending state after switching ai focus", () => {
    const { rerender } = render(
      <ToolsPage
        directory={directory}
        state={{ mode: "ai", q: "帮我找免费做 PPT 的工具", view: "hot", page: "1" }}
      />,
    );

    fireEvent.click(screen.getByRole("link", { name: "进入筛选列表" }));

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
