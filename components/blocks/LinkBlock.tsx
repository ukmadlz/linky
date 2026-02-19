import type { LinkBlockData } from "@/lib/blocks/schemas";
import type { Block } from "@/lib/db/schema";

interface LinkBlockProps {
	block: Block;
	buttonStyle?: "filled" | "outline" | "soft" | "shadow";
}

export function LinkBlock({ block, buttonStyle = "filled" }: LinkBlockProps) {
	const data = block.data as unknown as LinkBlockData;

	if (!data.url || !data.title) return null;

	// Route through the redirect handler for click tracking
	const href = `/r/${block.id}`;

	return (
		<a
			href={href}
			className={`block-link btn-${buttonStyle}`}
			rel="noopener noreferrer"
		>
			{data.title}
		</a>
	);
}
