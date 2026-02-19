import { describe, expect, it } from "vitest";
import { resolveIframe } from "@/lib/embeds/providers";

describe("resolveIframe", () => {
	it("resolves a YouTube watch URL to a youtube-nocookie embed", () => {
		const result = resolveIframe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
		expect(result).not.toBeNull();
		expect(result?.providerName).toBe("YouTube");
		expect(result?.iframeUrl).toContain(
			"youtube-nocookie.com/embed/dQw4w9WgXcQ",
		);
		expect(result?.embedType).toBe("iframe");
	});

	it("resolves a Spotify track URL to a Spotify embed", () => {
		const result = resolveIframe(
			"https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
		);
		expect(result).not.toBeNull();
		expect(result?.providerName).toBe("Spotify");
		expect(result?.iframeUrl).toContain("open.spotify.com/embed/track/");
	});

	it("resolves a Vimeo URL to a Vimeo player embed", () => {
		const result = resolveIframe("https://vimeo.com/148751763");
		expect(result).not.toBeNull();
		expect(result?.providerName).toBe("Vimeo");
		expect(result?.iframeUrl).toContain("player.vimeo.com/video/148751763");
	});

	it("returns null for an unrecognized URL", () => {
		const result = resolveIframe("https://example.com");
		expect(result).toBeNull();
	});

	it("resolves a YouTube shorts URL", () => {
		const result = resolveIframe("https://www.youtube.com/shorts/dQw4w9WgXcQ");
		expect(result).not.toBeNull();
		expect(result?.providerName).toBe("YouTube");
	});
});
