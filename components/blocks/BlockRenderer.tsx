import type { Block } from "@/lib/db/schema";
import { CustomCodeBlock } from "./CustomCodeBlock";
import { DividerBlock } from "./DividerBlock";
import { EmailCollectBlock } from "./EmailCollectBlock";
import { EmbedBlock } from "./EmbedBlock";
import { GroupBlock } from "./GroupBlock";
import { ImageBlock } from "./ImageBlock";
import { LinkBlock } from "./LinkBlock";
import { SocialIconsBlock } from "./SocialIconsBlock";
import { TextBlock } from "./TextBlock";

interface BlockRendererProps {
	block: Block & { children?: Block[] };
	buttonStyle?: "filled" | "outline" | "soft" | "shadow";
}

export function BlockRenderer({
	block,
	buttonStyle = "filled",
}: BlockRendererProps) {
	if (!block.isVisible) return null;

	switch (block.type) {
		case "link":
			return <LinkBlock block={block} buttonStyle={buttonStyle} />;
		case "text":
			return <TextBlock block={block} />;
		case "embed":
			return <EmbedBlock block={block} />;
		case "social_icons":
			return <SocialIconsBlock block={block} />;
		case "divider":
			return <DividerBlock block={block} />;
		case "custom_code":
			return <CustomCodeBlock block={block} />;
		case "image":
			return <ImageBlock block={block} />;
		case "email_collect":
			return <EmailCollectBlock block={block} />;
		case "group":
			return <GroupBlock block={block} buttonStyle={buttonStyle} />;
		default:
			return null;
	}
}
