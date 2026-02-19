import type { EmailCollectBlockData } from "@/lib/blocks/schemas";
import type { Block } from "@/lib/db/schema";

interface EmailCollectBlockProps {
	block: Block;
}

export function EmailCollectBlock({ block }: EmailCollectBlockProps) {
	const data = block.data as unknown as EmailCollectBlockData;

	if (!data.embedCode) return null;

	return (
		<div
			className="email-collect-block w-full overflow-hidden rounded-xl"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: third-party email embed code
			dangerouslySetInnerHTML={{ __html: data.embedCode }}
		/>
	);
}
