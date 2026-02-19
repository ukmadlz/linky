import type { EmbedBlockData } from "@/lib/blocks/schemas";
import type { Block } from "@/lib/db/schema";

interface EmbedBlockProps {
	block: Block;
}

const ALLOWED_IFRAME_DOMAINS = [
	"youtube.com",
	"youtube-nocookie.com",
	"player.vimeo.com",
	"open.spotify.com",
	"w.soundcloud.com",
	"platform.twitter.com",
	"google.com",
	"calendly.com",
	"form.typeform.com",
	"gumroad.com",
	"buy.stripe.com",
	"embed.music.apple.com",
	"www.tiktok.com",
	"player.twitch.tv",
	"clips.twitch.tv",
];

function isAllowedDomain(url: string): boolean {
	try {
		const parsed = new URL(url);
		return ALLOWED_IFRAME_DOMAINS.some(
			(domain) =>
				parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`),
		);
	} catch {
		return false;
	}
}

export function EmbedBlock({ block }: EmbedBlockProps) {
	const data = block.data as unknown as EmbedBlockData;

	if (!data.originalUrl) return null;

	const aspectRatio = data.aspectRatio ?? "16/9";
	function aspectToPaddingBottom(ratio: string): string {
		const [w, h] = ratio.split("/").map(Number);
		if (!w || !h) return "56.25%";
		return `${((h / w) * 100).toFixed(4)}%`;
	}
	const paddingBottom = aspectToPaddingBottom(aspectRatio);

	// oEmbed: render sanitized HTML
	if (data.embedType === "oembed" && data.embedHtml) {
		return (
			<div
				className="block-embed"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized oEmbed HTML from trusted providers
				dangerouslySetInnerHTML={{ __html: data.embedHtml }}
			/>
		);
	}

	// iframe: render with allowlist check
	if (data.embedType === "iframe" && data.iframeUrl) {
		if (!isAllowedDomain(data.iframeUrl)) {
			// Fallback to styled link if domain not on allowlist
			return (
				<a
					href={data.originalUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="block w-full p-4 bg-muted rounded-lg text-sm text-center text-muted-foreground hover:bg-muted/80 transition-colors"
				>
					{data.providerName}: {data.originalUrl}
				</a>
			);
		}

		return (
			<div
				className="block-embed"
				style={{ position: "relative", paddingBottom, height: 0 }}
			>
				<iframe
					src={data.iframeUrl}
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
					}}
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowFullScreen
					loading="lazy"
					title={`${data.providerName} embed`}
				/>
			</div>
		);
	}

	// Fallback: styled link
	return (
		<a
			href={data.originalUrl}
			target="_blank"
			rel="noopener noreferrer"
			className="block w-full p-4 bg-muted rounded-lg text-sm text-center text-muted-foreground hover:bg-muted/80 transition-colors"
		>
			{data.providerName}: {data.originalUrl}
		</a>
	);
}
