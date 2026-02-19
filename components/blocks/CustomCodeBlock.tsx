import type { CustomCodeBlockData } from "@/lib/blocks/schemas";
import type { Block } from "@/lib/db/schema";

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
					// biome-ignore lint/security/noDangerouslySetInnerHtml: scoped CSS from sanitized user content
					dangerouslySetInnerHTML={{
						__html: scopeCss(data.css, `#${containerId}`),
					}}
				/>
			)}
			{/* biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized HTML (data.sanitized check above) */}
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
		(_match, selector) => `${containerId} ${selector.trim()} {`,
	);
}
