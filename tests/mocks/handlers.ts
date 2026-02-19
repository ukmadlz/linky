import { HttpResponse, http } from "msw";

// MSW request handlers for internal API routes used by client components.
// Add handlers here as needed for component tests.
export const handlers = [
	// Example: mock the embeds resolve endpoint
	http.post("/api/embeds/resolve", async ({ request }) => {
		const body = (await request.json()) as { url?: string };
		const url = body?.url ?? "";

		if (!url) {
			return HttpResponse.json({ error: "url is required" }, { status: 400 });
		}

		if (url.includes("youtube.com") || url.includes("youtu.be")) {
			return HttpResponse.json({
				originalUrl: url,
				providerName: "YouTube",
				embedType: "iframe",
				iframeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
				aspectRatio: "16:9",
			});
		}

		return HttpResponse.json({
			originalUrl: url,
			providerName: "Unknown",
			embedType: "custom",
		});
	}),
];
