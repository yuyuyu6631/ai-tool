import React from "react";
import { render, screen } from "@testing-library/react";
import ToolCard from "../ToolCard";

describe("ToolCard", () => {
  it("renders demo-ready card content without the large pitfall block", () => {
    render(
      <ToolCard
        slug="chatgpt"
        name="ChatGPT"
        summary="综合能力稳定，适合写作、分析和代码协作。"
        tags={["对话", "写作", "搜索"]}
        url="https://chat.openai.com"
        score={9.5}
        reviewCount={6}
        accessFlags={{ needsVpn: false, cnLang: true }}
        features={["长文本理解稳定", "插件生态成熟"]}
        limitations={["复杂工作流需要二次编排"]}
        bestFor={["内容团队", "开发者"]}
        dealSummary="有免费额度"
      />,
    );

    expect(screen.getByText("ChatGPT")).toBeInTheDocument();
    expect(screen.getByText("综合能力稳定，适合写作、分析和代码协作。")).toBeInTheDocument();
    expect(screen.getByText("适合场景")).toBeInTheDocument();
    expect(screen.getByText("核心亮点")).toBeInTheDocument();
    expect(screen.getByText("免费情况")).toBeInTheDocument();
    expect(screen.queryByText("先看坑")).not.toBeInTheDocument();
    expect(screen.getByText("内容团队 / 开发者")).toBeInTheDocument();
    expect(screen.getByText("长文本理解稳定 / 插件生态成熟")).toBeInTheDocument();
    expect(screen.getByText("有免费额度")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看详情" })).toHaveAttribute("href", "/tools/chatgpt");
  });

  it("exposes detail links without making the whole card clickable", () => {
    render(
      <ToolCard
        slug="chatgpt"
        name="ChatGPT"
        summary="综合能力稳定，适合写作、分析和代码协作。"
        tags={["对话"]}
        url="https://chat.openai.com"
        score={9.5}
      />,
    );

    expect(screen.getByRole("link", { name: "ChatGPT" })).toHaveAttribute("href", "/tools/chatgpt");
    expect(screen.getByRole("link", { name: "查看详情" })).toHaveAttribute("href", "/tools/chatgpt");
  });

  it("keeps the official site link pointed at the external url", () => {
    render(
      <ToolCard
        slug="chatgpt"
        name="ChatGPT"
        summary="综合能力稳定，适合写作、分析和代码协作。"
        tags={["对话"]}
        url="https://chat.openai.com"
        score={9.5}
      />,
    );

    expect(screen.getByRole("link", { name: "官网" })).toHaveAttribute("href", "https://chat.openai.com");
  });

  it("omits placeholder badges when access conditions are unknown", () => {
    render(
      <ToolCard
        slug="mystery-tool"
        name="Mystery Tool"
        summary="Unknown access conditions."
        tags={["new"]}
        url="https://example.com"
        score={8.1}
      />,
    );

    expect(screen.queryByText("访问条件待确认")).not.toBeInTheDocument();
  });

  it("does not repeat price or tag chips below the colored info blocks", () => {
    render(
      <ToolCard
        slug="freemium-tool"
        name="Freemium Tool"
        summary="A freemium design assistant."
        tags={["设计", "AI 图像"]}
        url="https://example.com"
        score={8.8}
        priceLabel="freemium"
        dealSummary="免费增值，具体额度待核验"
      />,
    );

    expect(screen.getByText("免费情况")).toBeInTheDocument();
    expect(screen.getByText("免费增值，具体额度待核验")).toBeInTheDocument();
    expect(screen.getByText("设计 / AI 图像")).toBeInTheDocument();
    expect(screen.queryByTestId("price-tag")).not.toBeInTheDocument();
  });
});
