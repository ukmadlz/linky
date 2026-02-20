"use client";

import { useVerification } from "@/components/public/VerificationContext";
import type { LinkBlockData } from "@/lib/blocks/schemas";
import type { Block } from "@/lib/db/schema";

interface LinkBlockProps {
	block: Block;
	buttonStyle?: "filled" | "outline" | "soft" | "shadow";
}

export function LinkBlock({ block, buttonStyle = "filled" }: LinkBlockProps) {
	const data = block.data as unknown as LinkBlockData;
	const { openModal } = useVerification();

	if (!data.url || !data.title) return null;

	if (data.verificationEnabled && data.verificationMode) {
		return (
			<button
				type="button"
				className={`block-link btn-${buttonStyle}`}
				onClick={() =>
					openModal(
						block.id,
						data.verificationMode as "age" | "acknowledge",
					)
				}
			>
				{data.title}
			</button>
		);
	}

	return (
		<a
			href={`/r/${block.id}`}
			target="_blank"
			rel="noopener noreferrer"
			className={`block-link btn-${buttonStyle}`}
		>
			{data.title}
		</a>
	);
}
