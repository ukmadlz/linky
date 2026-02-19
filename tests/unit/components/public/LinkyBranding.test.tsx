import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LinkyBranding } from "@/components/public/LinkyBranding";

describe("LinkyBranding", () => {
  it("renders 'Made with' text", () => {
    render(<LinkyBranding />);
    expect(screen.getByText("Made with")).toBeInTheDocument();
  });

  it("renders 'Linky' brand name", () => {
    render(<LinkyBranding />);
    expect(screen.getByText("Linky")).toBeInTheDocument();
  });

  it("contains a link to the Linky marketing site", () => {
    render(<LinkyBranding />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://linky.page");
  });
});
