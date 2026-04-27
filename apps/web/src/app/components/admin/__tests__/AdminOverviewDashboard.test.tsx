import { render, screen, waitFor } from "@testing-library/react";
import AdminOverviewDashboard from "../AdminOverviewDashboard";

const mockFetchAdminOverview = vi.fn();

vi.mock("../../../lib/catalog-api", () => ({
  fetchAdminOverview: () => mockFetchAdminOverview(),
}));

describe("AdminOverviewDashboard", () => {
  beforeEach(() => {
    mockFetchAdminOverview.mockReset();
  });

  it("renders overview metrics and recent tools", async () => {
    mockFetchAdminOverview.mockResolvedValue({
      toolCount: 12,
      draftToolCount: 3,
      publishedToolCount: 9,
      reviewCount: 25,
      rankingCount: 4,
      recentUpdatedTools: [
        {
          id: 1,
          slug: "chatgpt",
          name: "ChatGPT",
          status: "published",
          updatedAt: "2026-04-20T00:00:00Z",
        },
      ],
    });

    render(<AdminOverviewDashboard />);

    expect(await screen.findByText("工具总数")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("ChatGPT")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看全部工具" })).toHaveAttribute("href", "/admin/tools");
  });

  it("shows an empty state when there are no recent tools", async () => {
    mockFetchAdminOverview.mockResolvedValue({
      toolCount: 0,
      draftToolCount: 0,
      publishedToolCount: 0,
      reviewCount: 0,
      rankingCount: 0,
      recentUpdatedTools: [],
    });

    render(<AdminOverviewDashboard />);

    expect(await screen.findByText("暂无最近更新的工具记录。")).toBeInTheDocument();
  });

  it("keeps the dashboard usable when loading fails", async () => {
    mockFetchAdminOverview.mockRejectedValue(new Error("boom"));

    render(<AdminOverviewDashboard />);

    await waitFor(() => {
      expect(screen.getByText("暂无最近更新的工具记录。")).toBeInTheDocument();
    });
    expect(screen.queryByText("后台概览加载失败，请稍后重试。")).not.toBeInTheDocument();
  });
});
