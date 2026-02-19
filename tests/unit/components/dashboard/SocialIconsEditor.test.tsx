import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SocialIconsEditor } from "@/components/dashboard/block-editors/SocialIconsEditor";
import type { Block } from "@/lib/db/schema";

function makeBlock(data: Record<string, unknown> = {}): Block {
  return {
    id: "block-social-1",
    pageId: "page-1",
    parentId: null,
    type: "social_icons",
    position: 0,
    isVisible: true,
    data,
    scheduledStart: null,
    scheduledEnd: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("SocialIconsEditor", () => {
  const noop = vi.fn().mockResolvedValue(undefined);

  it("renders the 'Add another' button", () => {
    render(
      <SocialIconsEditor
        block={makeBlock({
          icons: [{ platform: "twitter", url: "https://twitter.com/u" }],
          size: "md",
          style: "filled",
        })}
        onSave={noop}
        onCancel={noop}
      />
    );
    expect(screen.getByText(/add another/i)).toBeInTheDocument();
  });

  it("clicking 'Add another' appends a new icon row", async () => {
    const user = userEvent.setup();
    render(
      <SocialIconsEditor
        block={makeBlock({
          icons: [{ platform: "twitter", url: "https://twitter.com/u" }],
          size: "md",
          style: "filled",
        })}
        onSave={noop}
        onCancel={noop}
      />
    );

    const urlInputsBefore = screen.getAllByPlaceholderText("https://...");
    expect(urlInputsBefore).toHaveLength(1);

    await user.click(screen.getByText(/add another/i));

    const urlInputsAfter = screen.getAllByPlaceholderText("https://...");
    expect(urlInputsAfter).toHaveLength(2);
  });

  it("calls onSave with remaining icons when an icon is removed and saved", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <SocialIconsEditor
        block={makeBlock({
          icons: [
            { platform: "twitter", url: "https://twitter.com/u" },
            { platform: "github", url: "https://github.com/u" },
          ],
          size: "md",
          style: "filled",
        })}
        onSave={onSave}
        onCancel={noop}
      />
    );

    // Remove the first icon (trash icon buttons are the delete buttons)
    const deleteButtons = screen.getAllByRole("button", { name: "" });
    // The first trash button corresponds to the first icon
    // (Save/Cancel are named, so filter unnamed buttons)
    const trashButtons = deleteButtons.filter(
      (btn) => !["Save", "Cancel"].includes(btn.textContent ?? "")
    );
    await user.click(trashButtons[0]);

    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        icons: expect.arrayContaining([
          expect.objectContaining({ platform: "github" }),
        ]),
      })
    );
    const callArg = onSave.mock.calls[0][0] as { icons: unknown[] };
    expect(callArg.icons).toHaveLength(1);
  });
});
