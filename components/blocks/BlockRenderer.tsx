import type { Block } from "@/lib/db/schema";
import { LinkBlock } from "./LinkBlock";
import { TextBlock } from "./TextBlock";
import { EmbedBlock } from "./EmbedBlock";
import { SocialIconsBlock } from "./SocialIconsBlock";
import { DividerBlock } from "./DividerBlock";
import { CustomCodeBlock } from "./CustomCodeBlock";

interface BlockRendererProps {
  block: Block;
  buttonStyle?: "filled" | "outline" | "soft" | "shadow";
}

export function BlockRenderer({ block, buttonStyle = "filled" }: BlockRendererProps) {
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
    default:
      return null;
  }
}
