import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DividerEditor } from "@/components/dashboard/block-editors/DividerEditor";
import type { Block } from "@/lib/db/schema";

function makeBlock(data: Record<string, unknown> = {}): Block {
	return {
		id: "block-div-1",
		pageId: "page-1",
		parentId: null,
		type: "divider",
		position: 0,
		isVisible: true,
		data,
		scheduledStart: null,
		scheduledEnd: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
}

describe("DividerEditor", () => {
	const noop = vi.fn().mockResolvedValue(undefined);

	it("renders all three style options", () => {
		render(<DividerEditor block={makeBlock()} onSave={noop} onCancel={noop} />);
		expect(screen.getByRole("button", { name: /line/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /space/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /dots/i })).toBeInTheDocument();
	});

	it("calls onSave with dots style when Dots is selected and saved", async () => {
		const onSave = vi.fn().mockResolvedValue(undefined);
		const user = userEvent.setup();
		render(
			<DividerEditor
				block={makeBlock({ style: "line" })}
				onSave={onSave}
				onCancel={noop}
			/>,
		);

		await user.click(screen.getByRole("button", { name: /dots/i }));
		await user.click(screen.getByRole("button", { name: /^save$/i }));

		expect(onSave).toHaveBeenCalledWith({ style: "dots" });
	});

	it("calls onSave with space style when Space is selected and saved", async () => {
		const onSave = vi.fn().mockResolvedValue(undefined);
		const user = userEvent.setup();
		render(
			<DividerEditor
				block={makeBlock({ style: "line" })}
				onSave={onSave}
				onCancel={noop}
			/>,
		);

		await user.click(screen.getByRole("button", { name: /space/i }));
		await user.click(screen.getByRole("button", { name: /^save$/i }));

		expect(onSave).toHaveBeenCalledWith({ style: "space" });
	});
});
