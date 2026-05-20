import React from "react";
import { render, screen } from "@testing-library/react";
import HeroParticleScene from "../HeroParticleScene";

describe("HeroParticleScene", () => {
  it("renders the zero-dependency broadcast motion layer", () => {
    render(<HeroParticleScene />);

    const layer = screen.getByTestId("hero-particle-scene");
    expect(layer).toHaveClass("home-motion-layer");
    expect(layer.querySelectorAll(".home-broadcast-beam")).toHaveLength(3);
    expect(layer.querySelector(".home-route-node")).not.toBeInTheDocument();
  });
});
