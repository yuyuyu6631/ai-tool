import React from "react";
import { render, screen } from "@testing-library/react";
import ToolsPage from "../ToolsPage";
import type { ToolsDirectoryResponse } from "../../lib/catalog-types";

const directory: ToolsDirectoryResponse = {
  items: [
    {
      id: 1,
      slug: "chatgpt",
      name: "ChatGPT",
      category: "通用助手",
      score: 9.5,
      summary: "综合能力稳定，适合写作、分析和代码协作。",
      tags: ["对话", "写作"],
      officialUrl: "https://chat.openai.com",
      logoPath: null,
      logoStatus: null,
      logoSource: null,
      status: "draft",
      featured: true,
      createdAt: "2026-03-01",
    },
  ],
  total: 1,
  page: 1,
  pageSize: 9,
  hasMore: false,
  categories: [{ slug: "general", label: "通用助手", count: 1 }],
  tags: [{ slug: "chat", label: "对话", count: 1 }],
  statuses: [{ slug: "draft", label: "草稿", count: 1 }],
  presets: [
    { id: "hot", label: "热门", description: "优先查看当前目录中的高频工具。", count: 1 },
  ],
};

describe("ToolsPage", () => {
  it("renders directory filters and results", () => {
    render(<ToolsPage directory={directory} state={{ view: "hot" }} />);

    expect(screen.getByRole("heading", { name: "工具分类" })).toBeInTheDocument();
    expect(screen.getByText("筛选条件")).toBeInTheDocument();
    expect(screen.getByText("ChatGPT")).toBeInTheDocument();
    expect(screen.getAllByText("草稿").length).toBeGreaterThan(0);
  });

  it("renders empty state with reset actions", () => {
    render(
      <ToolsPage
        directory={{ ...directory, items: [], total: 0 }}
        state={{ q: "missing", view: "hot" }}
      />,
    );

    expect(screen.getByText("暂无匹配的工具")).toBeInTheDocument();
    expect(screen.getAllByText("重置筛选").length).toBeGreaterThan(0);
  });
});
