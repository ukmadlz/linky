import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "@/components/public/PageHeader";

// next/image can't run in jsdom — mock it with a plain <img>
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={props.src as string} alt={props.alt as string} />;
  },
}));

describe("PageHeader", () => {
  it("renders the display name", () => {
    render(
      <PageHeader name="Alice Smith" bio={null} avatarUrl={null} username="alice" />
    );
    expect(screen.getByRole("heading", { name: "Alice Smith" })).toBeInTheDocument();
  });

  it("renders the bio when provided", () => {
    render(
      <PageHeader name="Alice" bio="Web developer & designer" avatarUrl={null} username="alice" />
    );
    expect(screen.getByText("Web developer & designer")).toBeInTheDocument();
  });

  it("falls back to initials when avatarUrl is absent", () => {
    render(
      <PageHeader name="Alice Smith" bio={null} avatarUrl={null} username="alice" />
    );
    // Initials = "AS"
    expect(screen.getByText("AS")).toBeInTheDocument();
  });

  it("renders an <img> when avatarUrl is provided", () => {
    render(
      <PageHeader
        name="Alice"
        bio={null}
        avatarUrl="https://example.com/avatar.jpg"
        username="alice"
      />
    );
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/avatar.jpg");
  });

  it("falls back to username when name is null", () => {
    render(
      <PageHeader name={null} bio={null} avatarUrl={null} username="alicedev" />
    );
    expect(screen.getByRole("heading", { name: "alicedev" })).toBeInTheDocument();
  });
});
