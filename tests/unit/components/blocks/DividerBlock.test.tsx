import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DividerBlock } from "@/components/blocks/DividerBlock";
import type { Block } from "@/lib/db/schema";

function makeBlock(data: Record<string, unknown>): Block {
	return {
		id: "block-3",
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

describe("DividerBlock", () => {
	it("renders an <hr> for style: line", () => {
		const block = makeBlock({ style: "line" });
		const { container } = render(<DividerBlock block={block} />);
		expect(container.querySelector("hr")).toBeInTheDocument();
	});

	it("renders a spacer div for style: space", () => {
		const block = makeBlock({ style: "space" });
		const { container } = render(<DividerBlock block={block} />);
		expect(container.querySelector("hr")).toBeNull();
		const divider = container.querySelector(".block-divider") as HTMLElement;
		expect(divider.style.height).toBe("1.5rem");
	});

	it("renders dots text for style: dots", () => {
		const block = makeBlock({ style: "dots" });
		render(<DividerBlock block={block} />);
		expect(screen.getByText(/·/)).toBeInTheDocument();
	});

	it("defaults to line style when style is missing", () => {
		const block = makeBlock({});
		const { container } = render(<DividerBlock block={block} />);
		expect(container.querySelector("hr")).toBeInTheDocument();
	});
});
