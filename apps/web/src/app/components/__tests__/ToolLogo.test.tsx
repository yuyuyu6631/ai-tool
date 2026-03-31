import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import ToolLogo from "../ToolLogo";

describe("ToolLogo", () => {
  it("renders a single normalized logo path from api data", () => {
    render(<ToolLogo slug="chatgpt" name="ChatGPT" logoPath="aitool/source/logos/chatgpt.png" />);

    const image = screen.getByRole("img", { name: "ChatGPT logo" }) as HTMLImageElement;
    expect(image.getAttribute("src")).toBe("/logos/chatgpt.png");
  });

  it("falls back to brand mark when logoPath is missing", () => {
    render(<ToolLogo slug="unknown-tool" name="Unknown Tool" logoPath={null} />);

    expect(screen.getByLabelText("Unknown Tool 标识")).toBeInTheDocument();
  });

  it("falls back to brand mark after one failed request", () => {
    render(<ToolLogo slug="broken-tool" name="Broken Tool" logoPath="/logos/not-exist.png" />);

    const image = screen.getByRole("img", { name: "Broken Tool logo" });
    fireEvent.error(image);

    expect(screen.getByLabelText("Broken Tool 标识")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Broken Tool logo" })).not.toBeInTheDocument();
  });
});
