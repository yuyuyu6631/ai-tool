import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import HomePage from "../HomePage";
import type { ScenarioSummary, ToolSummary, ToolsDirectoryResponse } from "../../lib/catalog-types";

const pushMock = vi.fn();

vi.mock("../../components/Header", () => ({
  default: () => <div>Header</div>,
}));

vi.mock("../../components/Footer", () => ({
  default: () => <div>Footer</div>,
}));

vi.mock("../../components/ToolCard", () => ({
  default: ({ name, dealSummary, onDetailClick }: { name: string; dealSummary?: string; onDetailClick?: () => void }) => (
    <div>
      <div>{name}</div>
      {dealSummary ? <div>{dealSummary}</div> : null}
      {onDetailClick ? (
        <button type="button" onClick={onDetailClick}>
          detail
        </button>
      ) : null}
    </div>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("../../lib/analytics", () => ({
  trackEvent: vi.fn(),
}));

const toolA: ToolSummary = {
  id: 1,
  slug: "chatgpt",
  name: "ChatGPT",
  category: "General Assistant",
  categorySlug: "chatbot",
  score: 9.5,
  summary: "Writing, analysis, and coding support.",
  tags: ["chat", "writing"],
  officialUrl: "https://chat.openai.com",
  logoPath: null,
  logoStatus: null,
  logoSource: null,
  status: "published",
  featured: true,
  createdAt: "2026-03-01",
  price: "",
  reviewCount: 6,
  accessFlags: { needsVpn: false, cnLang: true, cnPayment: true },
  pricingType: "free",
  features: ["长文本理解稳定"],
  limitations: ["复杂工作流需要二次编排"],
  bestFor: ["内容团队"],
  dealSummary: "有免费额度",
  primaryMedia: {
    type: "video",
    url: "https://example.com/demo.mp4",
    title: "演示",
  },
};

const toolB: ToolSummary = {
  ...toolA,
  id: 2,
  slug: "gamma",
  name: "Gamma",
  category: "Writing Office",
  categorySlug: "writing",
  summary: "Fast deck generation.",
  featured: false,
  createdAt: "2026-03-10",
  limitations: ["中文模板质量不稳定"],
  dealSummary: "",
};

const directory: ToolsDirectoryResponse = {
  items: [toolA, toolB],
  total: 2,
  page: 1,
  pageSize: 24,
  hasMore: false,
  categories: [
    { slug: "chatbot", label: "General Assistant", count: 12 },
    { slug: "writing", label: "AI Writing", count: 8 },
    { slug: "coding", label: "AI Coding", count: 5 },
    { slug: "image", label: "AI Image", count: 4 },
    { slug: "office", label: "AI Office", count: 6 },
    { slug: "agent", label: "AI Agent", count: 3 },
  ],
  tags: [{ slug: "chat", label: "Chat", count: 1 }],
  statuses: [],
  priceFacets: [{ slug: "free", label: "Free", count: 1 }],
  accessFacets: [
    { slug: "no-vpn", label: "Direct Access", count: 1 },
    { slug: "cn-lang", label: "Chinese UI", count: 1 },
  ],
  priceRangeFacets: [],
  presets: [],
};

const scenarios: ScenarioSummary[] = [
  {
    id: 1,
    slug: "student",
    title: "Student Learning",
    description: "Homework, notes, and research.",
    problem: "Study efficiency",
    toolCount: 1,
    primaryTools: [],
    alternativeTools: [],
    targetAudience: ["Students", "Beginners"],
  },
];

describe("HomePage", () => {
  beforeEach(() => {
    pushMock.mockReset();
    window.sessionStorage.clear();
  });

  it("renders the demo home shell and key entry points", () => {
    render(<HomePage directory={directory} hotTools={[toolA, toolB]} latestTools={[toolB]} scenarios={scenarios} state={{ page: "1" }} />);

    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
    expect(screen.getByText("3 秒找到能用的 AI 工具")).toBeInTheDocument();
    expect(screen.getByTestId("hero-particle-scene")).toBeInTheDocument();
    expect(screen.getByTestId("compact-hero-search")).toHaveClass("sm:max-w-[460px]");
    expect(screen.getByTestId("compact-hero-search").className).not.toContain("max-w-[68%]");
    expect(screen.queryByText(/直接输入你要完成的任务/)).not.toBeInTheDocument();
    expect(screen.getByTestId("search-recommendation-flow")).toBeInTheDocument();
    expect(screen.getByText("搜索后生成使用流程推荐")).toBeInTheDocument();
    expect(screen.getByText("Docx 文档处理使用流程推荐")).toBeInTheDocument();
    expect(screen.queryByText("搜索会如何判断")).not.toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toHaveAttribute("data-global-search-target", "tools");
    expect(screen.getByRole("button", { name: "智能匹配" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /写论文排版/ })[0]).toBeInTheDocument();
    expect(screen.getAllByText("ChatGPT").length).toBeGreaterThan(0);
    expect(screen.getByText("推荐场景")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /做 PPT 用什么 AI/ })).toBeInTheDocument();
    expect(screen.getByText("快速筛选工具卡")).toBeInTheDocument();
    expect(screen.queryByText("先看坑")).not.toBeInTheDocument();
  });

  it("submits search to semantic AI search mode", () => {
    render(<HomePage directory={directory} hotTools={[toolA, toolB]} latestTools={[toolB]} scenarios={scenarios} state={{ page: "1" }} />);

    const searchbox = screen.getByRole("searchbox");
    fireEvent.change(searchbox, { target: { value: "free PPT" } });
    fireEvent.submit(searchbox.closest("form")!);

    const href = pushMock.mock.calls[0][0] as string;
    expect(href).toContain("mode=ai");
    expect(href).toContain("q=free+PPT");
    expect(href).toContain("page=1");
  });

  it("fills and submits a semantic search example", () => {
    render(<HomePage directory={directory} hotTools={[toolA, toolB]} latestTools={[toolB]} scenarios={scenarios} state={{ page: "1" }} />);

    fireEvent.click(screen.getAllByRole("button", { name: /分析 Excel 数据/ })[0]);

    const href = pushMock.mock.calls[0][0] as string;
    expect(href).toContain("mode=ai");
    expect(href).toContain("q=%E5%88%86%E6%9E%90+Excel+%E6%95%B0%E6%8D%AE");
  });

  it("remembers the current homepage route before opening detail", () => {
    render(<HomePage directory={directory} hotTools={[toolA, toolB]} latestTools={[toolB]} scenarios={scenarios} state={{ page: "2", q: "writing" }} />);

    fireEvent.click(screen.getAllByRole("button", { name: "detail" })[0]);

    const rememberedRoute = window.sessionStorage.getItem("catalog:return-route");
    expect(rememberedRoute).toContain("q=writing");
    expect(rememberedRoute).toContain("page=2");
  });

  it("shows active filters and reset entry when filtered", () => {
    render(
      <HomePage
        directory={directory}
        hotTools={[toolA, toolB]}
        latestTools={[toolB]}
        scenarios={scenarios}
        state={{ tab: "latest", view: "latest", page: "1", q: "coding", category: "chatbot", access: "no-vpn,cn-lang" }}
      />,
    );

    expect(screen.getAllByText((content) => content.includes("coding")).length).toBeGreaterThan(0);
    expect(screen.getAllByText((content) => content.includes("General Assistant")).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /重置/ })).toBeInTheDocument();
  });

  it("shows immediate pending feedback when a search example is clicked", () => {
    render(<HomePage directory={directory} hotTools={[toolA, toolB]} latestTools={[toolB]} scenarios={scenarios} state={{ page: "1" }} />);

    fireEvent.click(screen.getByRole("button", { name: /生成测试用例/ }));

    expect(screen.getAllByText((content) => content.includes("正在理解你的需求：生成测试用例")).length).toBeGreaterThan(0);
    expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "true");
  });

  it("opens a local submission dialog instead of linking to an external repo", () => {
    render(<HomePage directory={directory} hotTools={[toolA, toolB]} latestTools={[toolB]} scenarios={scenarios} state={{ page: "1" }} />);

    fireEvent.click(screen.getByRole("button", { name: "去提交" }));

    expect(screen.getByRole("dialog", { name: "提交 AI 工具到待审核队列" })).toBeInTheDocument();
    expect(screen.queryByText("项目仓库")).not.toBeInTheDocument();
  });

  it("falls back to recommended tools instead of showing an empty directory", () => {
    render(
      <HomePage
        directory={{ ...directory, items: [], total: 0 }}
        hotTools={[toolA, toolB]}
        latestTools={[toolB]}
        scenarios={scenarios}
        state={{ tab: "free", price: "free", page: "1" }}
      />,
    );

    expect(screen.getAllByText("ChatGPT").length).toBeGreaterThan(0);
  });
});
