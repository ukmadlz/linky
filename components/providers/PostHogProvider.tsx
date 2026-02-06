"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

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
				capture_pageview: false,
				capture_pageleave: true,
				autocapture: false,
			});
		}
	}, []);

	return <PHProvider client={posthog}>{children}</PHProvider>;
}
