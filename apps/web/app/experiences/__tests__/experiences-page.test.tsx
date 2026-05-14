import React from "react";
import { render, screen } from "@testing-library/react";
import ExperiencesPage from "../page";
import { getFallbackExperienceList } from "@/src/app/lib/experience-community";

vi.mock("@/src/app/components/Header", () => ({
  default: () => <div>Header</div>,
}));

vi.mock("@/src/app/components/Footer", () => ({
  default: () => <div>Footer</div>,
}));

vi.mock("@/src/app/components/Breadcrumbs", () => ({
  default: () => <nav>Breadcrumbs</nav>,
}));

vi.mock("@/src/app/lib/catalog-api", async () => {
  const actual = await vi.importActual<typeof import("@/src/app/lib/catalog-api")>("@/src/app/lib/catalog-api");
  return {
    ...actual,
    fetchExperiences: vi.fn(async (queryString = "") => {
      const params = new URLSearchParams(queryString);
      return getFallbackExperienceList(params.get("channel"), params.get("board"));
    }),
  };
});

describe("experiences page", () => {
  it("renders clickable channel filters and image-rich post cards", async () => {
    render(await ExperiencesPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("link", { name: "全部" })).toHaveAttribute("href", "/experiences");
    expect(screen.getByRole("link", { name: "工具组合" })).toHaveAttribute("href", "/experiences?channel=%E5%B7%A5%E5%85%B7%E7%BB%84%E5%90%88");
    expect(screen.getAllByRole("link", { name: /MCP 社区/ }).some((link) => link.getAttribute("href") === "/experiences?board=mcp-community")).toBe(true);
    expect(screen.getByText(/MCP 社区周报/)).toBeInTheDocument();
    expect(screen.getByText(/图片帖/)).toBeInTheDocument();
  });

  it("keeps the selected channel active through query state", async () => {
    render(await ExperiencesPage({ searchParams: Promise.resolve({ channel: "工具组合" }) }));

    expect(screen.getByRole("link", { name: "工具组合" })).toHaveClass("token-tag--active");
  });
});
