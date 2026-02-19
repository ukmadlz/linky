import { UAParser } from "ua-parser-js";

export interface TrackingData {
	referrer: string | undefined;
	userAgent: string | undefined;
	browser: string | undefined;
	os: string | undefined;
	device: string | undefined;
	language: string | undefined;
	country: string | undefined;
	region: string | undefined;
	city: string | undefined;
	isBot: boolean;
}

// Common bot user-agent patterns
const BOT_PATTERN =
	/bot|crawler|spider|scraper|facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|Slackbot|TelegramBot|DuckDuckBot|Baiduspider|YandexBot|Googlebot|Bingbot|Sogou|Exabot|ia_archiver/i;

/**
 * Parse a request to extract tracking-relevant data.
 * Geo is resolved from Vercel-injected headers; IP is never stored.
 */
export function parseRequest(request: Request): TrackingData {
	const headers = request.headers;

	// --- User-Agent ---
	const ua = headers.get("user-agent") ?? undefined;
	const isBot = ua ? BOT_PATTERN.test(ua) : false;

	let browser: string | undefined;
	let os: string | undefined;
	let device: string | undefined;

	if (ua) {
		const parser = new UAParser(ua);
		const result = parser.getResult();

		const browserName = result.browser.name;
		const browserVersion = result.browser.major;
		if (browserName) {
			browser = browserVersion
				? `${browserName} ${browserVersion}`
				: browserName;
		}

		const osName = result.os.name;
		const osVersion = result.os.version;
		if (osName) {
			os = osVersion ? `${osName} ${osVersion}` : osName;
		}

		// device.type is undefined for desktop; map to "desktop" in that case
		const deviceType = result.device.type;
		if (deviceType === "mobile") {
			device = "mobile";
		} else if (deviceType === "tablet") {
			device = "tablet";
		} else {
			device = "desktop";
		}
	}

	// --- Referrer ---
	const referrer =
		headers.get("referer") ?? headers.get("referrer") ?? undefined;

	// --- Language ---
	const acceptLanguage = headers.get("accept-language");
	const language = acceptLanguage
		? acceptLanguage.split(",")[0]?.split(";")[0]?.trim()
		: undefined;

	// --- Geo (Vercel injects these headers automatically; undefined in local dev) ---
	const country = headers.get("x-vercel-ip-country") ?? undefined;
	const region = headers.get("x-vercel-ip-country-region") ?? undefined;
	const city = headers.get("x-vercel-ip-city")
		? // biome-ignore lint/style/noNonNullAssertion: guarded by the truthiness check above
			decodeURIComponent(headers.get("x-vercel-ip-city")!)
		: undefined;

	return {
		referrer,
		userAgent: ua,
		browser,
		os,
		device,
		language,
		country,
		region,
		city,
		isBot,
	};
}
