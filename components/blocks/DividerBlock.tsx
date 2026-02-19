import type { DividerBlockData } from "@/lib/blocks/schemas";
import type { Block } from "@/lib/db/schema";

interface DividerBlockProps {
	block: Block;
}

export function DividerBlock({ block }: DividerBlockProps) {
	const data = block.data as unknown as DividerBlockData;
	const style = data.style ?? "line";

	if (style === "space") {
		return <div className="block-divider" style={{ height: "1.5rem" }} />;
	}

	if (style === "dots") {
		return (
			<div className="block-divider dots" aria-hidden="true">
				· · ·
			</div>
		);
	}

	// Default: line
	return (
		<div className="block-divider">
			<hr />
		</div>
	);
}
