import { PostHog } from "posthog-node";

// Server-side PostHog client (only use in server components and API routes)
export const posthogServer = new PostHog(
	process.env.POSTHOG_PERSONAL_API_KEY || "phx_placeholder",
	{
		host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "http://localhost:8000",
	}
);
