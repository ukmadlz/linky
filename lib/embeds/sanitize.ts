// Allowlisted domains for iframe embeds
export const ALLOWED_IFRAME_DOMAINS = [
	"youtube.com",
	"youtube-nocookie.com",
	"player.vimeo.com",
	"open.spotify.com",
	"w.soundcloud.com",
	"platform.twitter.com",
	"google.com",
	"calendly.com",
];

function isAllowedIframeSrc(src: string): boolean {
	try {
		const url = new URL(src);
		return ALLOWED_IFRAME_DOMAINS.some(
			(domain) =>
				url.hostname === domain || url.hostname.endsWith(`.${domain}`),
		);
	} catch {
		return false;
	}
}

/**
 * Sanitize oEmbed HTML — strips all tags except allowlisted <iframe> srcs.
 * Preserves <iframe> tags where src is on the allowlist.
 */
export function sanitizeEmbedHtml(html: string): string {
	// Extract iframe tags and filter by allowlist
	return html.replace(/<iframe[^>]*>/gi, (tag) => {
		const srcMatch = tag.match(/src=["']([^"']+)["']/i);
		if (!srcMatch) return "";
		if (!isAllowedIframeSrc(srcMatch[1])) return "";
		// Remove potentially dangerous attributes
		return tag
			.replace(/\s*on\w+="[^"]*"/gi, "")
			.replace(/\s*javascript:[^"']*/gi, "");
	});
}

/**
 * Sanitize custom HTML for custom_code blocks.
 * Allows safe tags, strips <script>, event handlers, javascript: URLs.
 */
export function sanitizeCustomHtml(html: string): string {
	const ALLOWED_TAGS = [
		"div",
		"span",
		"p",
		"a",
		"img",
		"ul",
		"ol",
		"li",
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6",
		"strong",
		"em",
		"br",
		"hr",
		"blockquote",
		"pre",
		"code",
		"table",
		"thead",
		"tbody",
		"tr",
		"th",
		"td",
		"figure",
		"figcaption",
		"iframe", // allowed only with src on allowlist
	];

	// Remove <script> tags entirely (including content)
	let sanitized = html.replace(
		/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
		"",
	);

	// Remove event handlers (on* attributes)
	sanitized = sanitized.replace(/\s+on\w+="[^"]*"/gi, "");
	sanitized = sanitized.replace(/\s+on\w+='[^']*'/gi, "");

	// Remove javascript: protocol links
	sanitized = sanitized.replace(
		/href\s*=\s*["']javascript:[^"']*["']/gi,
		'href="#"',
	);

	// Remove unknown/dangerous tags (allow only ALLOWED_TAGS)
	sanitized = sanitized.replace(
		/<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g,
		(match, tagName) => {
			if (ALLOWED_TAGS.includes(tagName.toLowerCase())) {
				// For iframes, check src allowlist
				if (tagName.toLowerCase() === "iframe") {
					const srcMatch = match.match(/src=["']([^"']+)["']/i);
					if (!srcMatch || !isAllowedIframeSrc(srcMatch[1])) return "";
				}
				return match;
			}
			return "";
		},
	);

	return sanitized;
}

/**
 * Scope CSS to a container by prefixing all selectors.
 * Prevents styles from leaking to the rest of the page.
 */
export function scopeCustomCss(css: string, containerId: string): string {
	// Remove @import statements (potential security issue)
	let scoped = css.replace(/@import[^;]+;/gi, "");

	// Remove url() with external resources
	scoped = scoped.replace(/url\(['"]?(?!data:)[^)'"]+['"]?\)/gi, "url(none)");

	// Prefix all CSS selectors with the container ID
	scoped = scoped.replace(/([^{}@]+)\{/g, (match, selector) => {
		const trimmed = selector.trim();
		if (!trimmed || trimmed.startsWith("@")) return match;
		// Handle comma-separated selectors
		const prefixed = trimmed
			.split(",")
			.map((s: string) => `#${containerId} ${s.trim()}`)
			.join(",\n");
		return `${prefixed} {`;
	});

	return scoped;
}
