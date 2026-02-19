import type { Block } from "@/lib/db/schema";
import type { DividerBlockData } from "@/lib/blocks/schemas";

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
      <hr aria-hidden="true" />
    </div>
  );
}
