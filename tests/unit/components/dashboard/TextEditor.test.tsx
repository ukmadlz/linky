import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TextEditor } from "@/components/dashboard/block-editors/TextEditor";
import type { Block } from "@/lib/db/schema";

function makeBlock(data: Record<string, unknown> = {}): Block {
	return {
		id: "block-text-1",
		pageId: "page-1",
		parentId: null,
		type: "text",
		position: 0,
		isVisible: true,
		data,
		scheduledStart: null,
		scheduledEnd: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
}

describe("TextEditor", () => {
	const noop = vi.fn().mockResolvedValue(undefined);

	it("renders a textarea for content", () => {
		render(<TextEditor block={makeBlock()} onSave={noop} onCancel={noop} />);
		expect(screen.getByPlaceholderText("Your text here…")).toBeInTheDocument();
	});

	it("renders heading and paragraph variant buttons", () => {
		render(<TextEditor block={makeBlock()} onSave={noop} onCancel={noop} />);
		expect(screen.getByRole("button", { name: "heading" })).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "paragraph" }),
		).toBeInTheDocument();
	});

	it("renders left, center, right alignment buttons", () => {
		render(<TextEditor block={makeBlock()} onSave={noop} onCancel={noop} />);
		expect(screen.getByRole("button", { name: "left" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "center" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "right" })).toBeInTheDocument();
	});

	it("calls onSave with updated variant when variant button clicked then saved", async () => {
		const onSave = vi.fn().mockResolvedValue(undefined);
		const user = userEvent.setup();
		render(
			<TextEditor
				block={makeBlock({
					content: "Hello",
					variant: "paragraph",
					align: "center",
				})}
				onSave={onSave}
				onCancel={noop}
			/>,
		);

		// Click 'heading' variant
		await user.click(screen.getByRole("button", { name: "heading" }));

		// Submit the form
		await user.click(screen.getByRole("button", { name: "Save" }));

		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({ variant: "heading" }),
		);
	});
});
