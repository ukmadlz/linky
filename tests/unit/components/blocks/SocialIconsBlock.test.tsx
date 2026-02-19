import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SocialIconsBlock } from "@/components/blocks/SocialIconsBlock";
import type { Block } from "@/lib/db/schema";

function makeBlock(data: Record<string, unknown>): Block {
	return {
		id: "block-4",
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

describe("SocialIconsBlock", () => {
	it("renders one anchor per icon", () => {
		const block = makeBlock({
			icons: [
				{ platform: "twitter", url: "https://twitter.com/user" },
				{ platform: "github", url: "https://github.com/user" },
			],
			size: "md",
			style: "filled",
		});
		render(<SocialIconsBlock block={block} />);
		const links = screen.getAllByRole("link");
		expect(links).toHaveLength(2);
	});

	it("each anchor has the correct href", () => {
		const block = makeBlock({
			icons: [
				{ platform: "instagram", url: "https://instagram.com/user" },
				{ platform: "linkedin", url: "https://linkedin.com/in/user" },
			],
			size: "md",
			style: "outline",
		});
		render(<SocialIconsBlock block={block} />);
		const links = screen.getAllByRole("link");
		expect(links[0]).toHaveAttribute("href", "https://instagram.com/user");
		expect(links[1]).toHaveAttribute("href", "https://linkedin.com/in/user");
	});

	it("renders nothing when icons array is empty", () => {
		const block = makeBlock({ icons: [], size: "md", style: "filled" });
		const { container } = render(<SocialIconsBlock block={block} />);
		expect(container.firstChild).toBeNull();
	});
});
