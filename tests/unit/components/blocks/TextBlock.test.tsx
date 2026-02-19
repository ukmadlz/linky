import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TextBlock } from "@/components/blocks/TextBlock";
import type { Block } from "@/lib/db/schema";

function makeBlock(data: Record<string, unknown>): Block {
	return {
		id: "block-2",
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

describe("TextBlock", () => {
	it("renders an <h2> for variant: heading", () => {
		const block = makeBlock({
			content: "Hello",
			variant: "heading",
			align: "center",
		});
		render(<TextBlock block={block} />);
		expect(
			screen.getByRole("heading", { level: 2, name: "Hello" }),
		).toBeInTheDocument();
	});

	it("renders a <p> for variant: paragraph", () => {
		const block = makeBlock({
			content: "A paragraph",
			variant: "paragraph",
			align: "left",
		});
		const { container } = render(<TextBlock block={block} />);
		expect(container.querySelector("p")).toBeInTheDocument();
		expect(screen.getByText("A paragraph")).toBeInTheDocument();
	});

	it("applies text-left class for align: left", () => {
		const block = makeBlock({
			content: "Text",
			variant: "paragraph",
			align: "left",
		});
		const { container } = render(<TextBlock block={block} />);
		expect(container.firstChild).toHaveClass("text-left");
	});

	it("applies text-center class for align: center", () => {
		const block = makeBlock({
			content: "Text",
			variant: "paragraph",
			align: "center",
		});
		const { container } = render(<TextBlock block={block} />);
		expect(container.firstChild).toHaveClass("text-center");
	});

	it("applies text-right class for align: right", () => {
		const block = makeBlock({
			content: "Text",
			variant: "paragraph",
			align: "right",
		});
		const { container } = render(<TextBlock block={block} />);
		expect(container.firstChild).toHaveClass("text-right");
	});

	it("renders nothing when content is missing", () => {
		const block = makeBlock({ variant: "paragraph", align: "center" });
		const { container } = render(<TextBlock block={block} />);
		expect(container.firstChild).toBeNull();
	});
});
