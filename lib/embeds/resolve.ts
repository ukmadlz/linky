import type { EmbedBlockData } from "@/lib/blocks/schemas";
import { resolveOEmbed } from "./oembed";
import { resolveIframe } from "./providers";

export async function resolveEmbed(url: string): Promise<EmbedBlockData> {
	// 1. Try iframe patterns first (fastest, best quality)
	const iframeResult = resolveIframe(url);
	if (iframeResult) {
		return {
			originalUrl: url,
			providerName: iframeResult.providerName,
			embedType: "iframe",
			iframeUrl: iframeResult.iframeUrl,
			aspectRatio: iframeResult.aspectRatio,
		};
	}

	// 2. Try oEmbed discovery
	const oembedResult = await resolveOEmbed(url);
	if (oembedResult) {
		return {
			originalUrl: url,
			providerName: oembedResult.providerName,
			embedType: "oembed",
			oembedData: oembedResult.oembedData,
			embedHtml: oembedResult.embedHtml,
		};
	}

	// 3. Fallback — styled link
	return {
		originalUrl: url,
		providerName: extractDomain(url),
		embedType: "custom",
	};
}

function extractDomain(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, "");
	} catch {
		return "Unknown";
	}
}
