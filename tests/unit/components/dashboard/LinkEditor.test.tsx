import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LinkEditor } from "@/components/dashboard/block-editors/LinkEditor";
import type { Block } from "@/lib/db/schema";

function makeBlock(data: Record<string, unknown> = {}): Block {
  return {
    id: "block-link-1",
    pageId: "page-1",
    parentId: null,
    type: "link",
    position: 0,
    isVisible: true,
    data,
    scheduledStart: null,
    scheduledEnd: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("LinkEditor", () => {
  const noop = vi.fn().mockResolvedValue(undefined);

  it("renders URL and title input fields", () => {
    render(<LinkEditor block={makeBlock()} onSave={noop} onCancel={noop} />);
    expect(screen.getByPlaceholderText("https://example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Button label")).toBeInTheDocument();
  });

  it("verification mode options are hidden by default (section collapsed)", () => {
    render(<LinkEditor block={makeBlock()} onSave={noop} onCancel={noop} />);
    // Radio buttons should not be visible before enabling verification
    expect(screen.queryByRole("radio", { name: /age gate/i })).toBeNull();
  });

  it("shows mode selectors after enabling verification toggle", async () => {
    const user = userEvent.setup();
    render(<LinkEditor block={makeBlock()} onSave={noop} onCancel={noop} />);

    // Open the details element to reveal verification section
    const summary = screen.getByText("Verification settings");
    await user.click(summary);

    // Enable verification
    const toggle = screen.getByRole("checkbox");
    await user.click(toggle);

    // Now the radio buttons should appear
    expect(screen.getByRole("radio", { name: /age gate/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /content warning/i })).toBeInTheDocument();
  });

  it("shows age gate description when age mode selected", async () => {
    const user = userEvent.setup();
    render(<LinkEditor block={makeBlock()} onSave={noop} onCancel={noop} />);

    await user.click(screen.getByText("Verification settings"));
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("radio", { name: /age gate/i }));

    expect(
      screen.getByText(/age verification screen/i)
    ).toBeInTheDocument();
  });

  it("shows content warning description when acknowledge mode selected", async () => {
    const user = userEvent.setup();
    render(<LinkEditor block={makeBlock()} onSave={noop} onCancel={noop} />);

    await user.click(screen.getByText("Verification settings"));
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("radio", { name: /content warning/i }));

    expect(
      screen.getByText(/content warning before being redirected/i)
    ).toBeInTheDocument();
  });
});
