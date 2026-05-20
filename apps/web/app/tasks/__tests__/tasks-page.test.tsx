import React from "react";
import { render, screen } from "@testing-library/react";
import TasksPage from "../page";

vi.mock("@/src/app/components/Header", () => ({
  default: () => <div>Header</div>,
}));

vi.mock("@/src/app/components/Footer", () => ({
  default: () => <div>Footer</div>,
}));

vi.mock("@/src/app/components/Breadcrumbs", () => ({
  default: () => <nav>Breadcrumbs</nav>,
}));

describe("TasksPage", () => {
  it("renders task chips as deliberate pill tags instead of inline text", () => {
    render(<TasksPage />);

    expect(screen.getByText("选题策划与大纲生成")).toHaveClass("task-chip");
    expect(screen.getByText("短视频脚本生成")).toHaveClass("task-chip");
  });
});
