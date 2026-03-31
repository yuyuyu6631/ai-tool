import React from "react";
import { render, screen } from "@testing-library/react";
import ToolCard from "../ToolCard";

describe("ToolCard", () => {
  it("renders compact card content", () => {
    render(
      <ToolCard
        slug="chatgpt"
        name="ChatGPT"
        summary="综合能力稳定，适合写作、分析和代码协作。"
        tags={["对话", "写作", "搜索"]}
        url="https://chat.openai.com"
        status="published"
      />,
    );

    expect(screen.getByText("ChatGPT")).toBeInTheDocument();
    expect(screen.getByText("综合能力稳定，适合写作、分析和代码协作。")).toBeInTheDocument();
    expect(screen.getByText("对话")).toBeInTheDocument();
    expect(screen.getByText("已发布")).toBeInTheDocument();
    expect(screen.queryByText("搜索")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /查看详情/ })).toHaveAttribute("href", "/tools/chatgpt");
  });
});
