import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteBranding } from "@/components/public/SiteBranding";

describe("SiteBranding", () => {
  it("renders 'Made with' text", () => {
    render(<SiteBranding />);
    expect(screen.getByText("Made with")).toBeInTheDocument();
  });

  it("renders 'biohasl.ink' brand name", () => {
    render(<SiteBranding />);
    expect(screen.getByText("biohasl.ink")).toBeInTheDocument();
  });

  it("contains a link to the biohasl.ink marketing site", () => {
    render(<SiteBranding />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://biohasl.ink");
  });
});
