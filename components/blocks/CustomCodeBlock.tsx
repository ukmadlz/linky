import type { Block } from "@/lib/db/schema";
import type { CustomCodeBlockData } from "@/lib/blocks/schemas";

interface CustomCodeBlockProps {
  block: Block;
}

export function CustomCodeBlock({ block }: CustomCodeBlockProps) {
  const data = block.data as unknown as CustomCodeBlockData;

  if (!data.html || !data.sanitized) return null;

  const containerId = `custom-block-${block.id}`;

  return (
    <div id={containerId} className="block-custom-code">
      {data.css && (
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: scopeCss(data.css, `#${containerId}`),
          }}
        />
      )}
      {/* eslint-disable-next-line react/no-danger */}
      <div dangerouslySetInnerHTML={{ __html: data.html }} />
    </div>
  );
}

/**
 * Prefix all CSS selectors with the container ID to scope styles.
 * This is a simple implementation; production would use postcss.
 */
function scopeCss(css: string, containerId: string): string {
  // Basic prefix — replace selectors with scoped version
  return css.replace(
    /([^{}]+)\{/g,
    (match, selector) => `${containerId} ${selector.trim()} {`
  );
}
