"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { SessionTracker } from "@/components/analytics/SessionTracker";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		if (typeof window !== "undefined") {
			posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || "phc_placeholder", {
				api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "http://localhost:8000",
				loaded: () => {
					if (process.env.NODE_ENV === "development") {
						console.log("PostHog loaded");
					}
				},
				capture_pageview: false, // We handle this manually with PageViewTracker
				capture_pageleave: true,
				// Enable autocapture for automatic event tracking
				autocapture: {
					// Capture all clicks on buttons, links, and form submissions
					dom_event_allowlist: ["click", "change", "submit"],
					// Capture element attributes for better context
					capture_copied_text: true,
					// CSS selectors to ignore
					element_allowlist: ["button", "a", "input[type=submit]", "form"],
					// Custom attribute for tracking
					url_allowlist: undefined,
					// Capture form field names (but not values for privacy)
					capture_form_submit_name: true,
				},
				// Set super properties that apply to all events
				persistence: "localStorage",
				session_recording: {
					maskAllInputs: true,
					maskTextSelector: "[data-private]",
				},
			});

			// Set super properties
			posthog.register({
				app_version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
				environment: process.env.NODE_ENV,
			});
		}
	}, []);

	return (
		<PHProvider client={posthog}>
			<PageViewTracker />
			<SessionTracker />
			{children}
		</PHProvider>
	);
}
