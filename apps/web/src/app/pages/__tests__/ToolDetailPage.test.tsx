import React from "react";
import { render, screen } from "@testing-library/react";
import ToolDetailPage from "../ToolDetailPage";
import type { ToolDetail } from "../../lib/catalog-types";

vi.mock("../../components/Header", () => ({
  default: () => <div>Header</div>,
}));

vi.mock("../../components/Footer", () => ({
  default: () => <div>Footer</div>,
}));

vi.mock("../../components/Breadcrumbs", () => ({
  default: () => <div>Breadcrumbs</div>,
}));

vi.mock("../../components/ToolLogo", () => ({
  default: () => <div>ToolLogo</div>,
}));

vi.mock("../../components/ToolCard", () => ({
  default: ({ name }: { name: string }) => <div>{name}</div>,
}));

vi.mock("../../components/ToolReviewsPanel", () => ({
  default: () => <div>ToolReviewsPanel</div>,
}));

vi.mock("../../components/BackToResultsLink", () => ({
  default: ({ className = "" }: { className?: string }) => <a className={className}>返回结果列表</a>,
}));

const tool: ToolDetail = {
  id: 1,
  slug: "chatgpt",
  name: "ChatGPT",
  category: "通用助手",
  score: 9.5,
  summary: "通用型 AI 助手",
  tags: ["对话", "写作"],
  officialUrl: "https://chat.openai.com",
  logoPath: null,
  logoStatus: null,
  logoSource: null,
  status: "published",
  featured: true,
  createdAt: "2026-03-01",
  price: "免费增值",
  reviewCount: 2,
  accessFlags: { needsVpn: false, cnLang: true, cnPayment: true },
  pricingType: "free",
  freeAllowanceText: "永久免费额度",
  features: ["长文本理解稳定", "多模态能力完整"],
  limitations: ["复杂工作流需要二次编排"],
  bestFor: ["内容团队", "开发者"],
  dealSummary: "新用户可先用免费额度",
  primaryMedia: null,
  mediaItems: [
    {
      type: "image",
      url: "/media/chatgpt-demo.png",
      title: "产品界面演示",
      sourceName: "编辑部",
    },
  ],
  description: "详细介绍",
  editorComment: "这段内容现在不该显示",
  developer: "OpenAI",
  country: "美国",
  city: "",
  platforms: "Web",
  vpnRequired: "不需要",
  targetAudience: [],
  abilities: [],
  pros: ["上手快"],
  cons: ["复杂场景需要复核"],
  pitfalls: ["旧字段避坑内容"],
  scenarios: [],
  scenarioRecommendations: [{ audience: "内容团队", task: "快速起草", summary: "适合高频日常生产。" }],
  reviewPreview: [{ sourceType: "editor", title: "编辑结论", body: "先试再买", rating: 9.1 }],
  alternatives: [],
  lastVerifiedAt: "2026-03-01",
};

describe("ToolDetailPage", () => {
  it("renders the review-first detail layout and hides legacy editor comment content", () => {
    render(<ToolDetailPage tool={tool} relatedTools={[]} reviews={null} />);

    expect(screen.getByText("评测结论")).toBeInTheDocument();
    expect(screen.getByText("先看缺陷 / 限制")).toBeInTheDocument();
    expect(screen.getByText("复杂工作流需要二次编排")).toBeInTheDocument();
    expect(screen.getByText("核心特点")).toBeInTheDocument();
    expect(screen.getByText("长文本理解稳定")).toBeInTheDocument();
    expect(screen.getByText("适合人群")).toBeInTheDocument();
    expect(screen.getAllByText("内容团队").length).toBeGreaterThan(0);
    expect(screen.getByText("优惠 / 免费额度")).toBeInTheDocument();
    expect(screen.getByText("新用户可先用免费额度")).toBeInTheDocument();
    expect(screen.getByText("媒体演示")).toBeInTheDocument();
    expect(screen.getByText("产品界面演示")).toBeInTheDocument();
    expect(screen.getByText("用户/编辑反馈")).toBeInTheDocument();
    expect(screen.getByText("详细介绍")).toBeInTheDocument();
    expect(screen.queryByText("编辑评论")).not.toBeInTheDocument();
    expect(screen.queryByText("这段内容现在不该显示")).not.toBeInTheDocument();
  });
});
