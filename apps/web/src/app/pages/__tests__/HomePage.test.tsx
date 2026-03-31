import React from "react";
import { render, screen } from "@testing-library/react";
import HomePage from "../HomePage";
import type { PresetView, ToolSummary } from "../../lib/catalog-types";

const featuredTools: ToolSummary[] = [
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
    status: "published",
    featured: true,
    createdAt: "2026-03-01",
  },
];

const presets: PresetView[] = [
  { id: "hot", label: "热门", description: "优先查看当前目录中的高频工具。", count: 10 },
  { id: "latest", label: "最新", description: "按最新收录顺序浏览新增工具。", count: 5 },
];

describe("HomePage", () => {
  it("renders search-first homepage structure", () => {
    render(
      <HomePage
        featuredTools={featuredTools}
        categories={[{ slug: "general", label: "通用助手", count: 12 }]}
        presets={presets}
      />,
    );

    expect(screen.getByRole("heading", { name: "帮你更快找到合适的 AI 工具" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "开始搜索" })).toBeInTheDocument();
    expect(screen.getByText("常用分类")).toBeInTheDocument();
    expect(screen.getByText("热门")).toBeInTheDocument();
  });
});
