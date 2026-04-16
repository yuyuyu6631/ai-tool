import React from "react";
import { render, screen } from "@testing-library/react";
import { useNavigation } from "../react-router";

function TestComponent() {
  const navigation = useNavigation();
  return <div data-testid="navigation-state">{navigation.state}</div>;
}

describe("useNavigation", () => {
  it('returns state as "idle"', () => {
    render(<TestComponent />);

    const stateElement = screen.getByTestId("navigation-state");
    expect(stateElement).toHaveTextContent("idle");
  });
});
