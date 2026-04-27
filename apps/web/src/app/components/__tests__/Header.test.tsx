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
  it("does not render a visible search trigger in the navigation area", () => {
    render(<Header currentPath="/" currentRoute="/" />);

    expect(screen.getByText("提交工具")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "首页" })).not.toBeInTheDocument();
    expect(screen.queryByText("搜索工具")).not.toBeInTheDocument();
    expect(screen.queryByText("Ctrl+G")).not.toBeInTheDocument();
  });
});
