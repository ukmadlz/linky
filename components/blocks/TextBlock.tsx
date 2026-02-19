import type { Block } from "@/lib/db/schema";
import type { TextBlockData } from "@/lib/blocks/schemas";

interface TextBlockProps {
  block: Block;
}

const alignClasses = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function TextBlock({ block }: TextBlockProps) {
  const data = block.data as unknown as TextBlockData;

  if (!data.content) return null;

  const alignClass = alignClasses[data.align ?? "center"];

  if (data.variant === "heading") {
    return (
      <div className={`block-text ${alignClass}`}>
        <h2>{data.content}</h2>
      </div>
    );
  }

  return (
    <div className={`block-text ${alignClass}`}>
      <p>{data.content}</p>
    </div>
  );
}
