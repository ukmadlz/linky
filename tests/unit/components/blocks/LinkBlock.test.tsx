import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LinkBlock } from "@/components/blocks/LinkBlock";
import type { Block } from "@/lib/db/schema";

function makeBlock(data: Record<string, unknown>): Block {
	return {
		id: "block-1",
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

describe("LinkBlock", () => {
	it("renders an anchor pointing to /r/[blockId]", () => {
		const block = makeBlock({ url: "https://example.com", title: "Example" });
		render(<LinkBlock block={block} />);
		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("href", "/r/block-1");
	});

	it("displays the link title", () => {
		const block = makeBlock({ url: "https://example.com", title: "My Link" });
		render(<LinkBlock block={block} />);
		expect(screen.getByText("My Link")).toBeInTheDocument();
	});

	it("renders nothing when url is missing", () => {
		const block = makeBlock({ title: "No URL" });
		const { container } = render(<LinkBlock block={block} />);
		expect(container.firstChild).toBeNull();
	});

	it("renders nothing when title is missing", () => {
		const block = makeBlock({ url: "https://example.com" });
		const { container } = render(<LinkBlock block={block} />);
		expect(container.firstChild).toBeNull();
	});
});
