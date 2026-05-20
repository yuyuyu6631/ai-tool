import React from "react";
import { render, screen } from "@testing-library/react";
import Header from "../Header";

vi.mock("../HeaderAuthControls", () => ({
  default: () => <div>AuthControls</div>,
}));

vi.mock("../HeaderMobileMenu", () => ({
  default: () => <div>MobileMenu</div>,
}));

vi.mock("../PlatformLogo", () => ({
  default: () => <div>PlatformLogo</div>,
}));

describe("Header", () => {
  it("renders the main route navigation without an inline search trigger", () => {
    render(<Header currentPath="/" currentRoute="/" />);

    expect(screen.getByText("提交工具")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "首页" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "任务场景" })).toHaveAttribute("href", "/scenarios");
    expect(screen.getByRole("link", { name: "工具库" })).toHaveAttribute("href", "/tools?mode=search&page=1&page_size=24");
    expect(screen.getByRole("link", { name: "经验社区" })).toHaveAttribute("href", "/experiences");
    expect(screen.getByRole("link", { name: "免费福利" })).toHaveAttribute("href", "/benefits");
    expect(screen.queryByText("搜索工具")).not.toBeInTheDocument();
    expect(screen.queryByText("Ctrl+G")).not.toBeInTheDocument();
  });

  it("uses the same header treatment away from the homepage", () => {
    const { container } = render(<Header currentPath="/tools" currentRoute="/tools?mode=search&page=1&page_size=24" />);

    expect(container.querySelector("header")).toHaveClass("site-header--home-light");
    expect(container.querySelector("header")).not.toHaveClass("site-header--dark");
    expect(screen.getByRole("link", { name: "工具库" })).toHaveClass("home-nav-active");
  });
});
