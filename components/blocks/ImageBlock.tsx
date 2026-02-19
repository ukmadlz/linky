import type { Block } from "@/lib/db/schema";
import type { ImageBlockData } from "@/lib/blocks/schemas";

interface ImageBlockProps {
  block: Block;
}

export function ImageBlock({ block }: ImageBlockProps) {
  const data = block.data as unknown as ImageBlockData;

  if (!data.url) return null;

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={data.url}
      alt={data.alt || ""}
      className="w-full rounded-xl object-cover"
    />
  );

  if (data.linkUrl) {
    return (
      <a
        href={data.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full overflow-hidden rounded-xl"
      >
        {img}
      </a>
    );
  }

  return <div className="w-full overflow-hidden rounded-xl">{img}</div>;
}
