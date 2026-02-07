"use client";

import { usePostHog } from "posthog-js/react";
import { useEffect, useRef } from "react";

export function SessionTracker() {
	const posthog = usePostHog();
	const sessionStartRef = useRef<number | null>(null);
	const lastActivityRef = useRef<number>(Date.now());
	const engagementIntervalRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		if (!posthog) return;

		// Track session start
		if (!sessionStartRef.current) {
			sessionStartRef.current = Date.now();

			// Determine session source
			const referrer = document.referrer;
			const urlParams = new URLSearchParams(window.location.search);
			const utmSource = urlParams.get("utm_source");

			let sessionSource = "direct";
			if (utmSource) {
				sessionSource = utmSource;
			} else if (referrer) {
				try {
					const referrerHost = new URL(referrer).hostname;
					const currentHost = window.location.hostname;

					if (referrerHost !== currentHost) {
						// Determine source type based on referrer
						if (
							referrerHost.includes("google") ||
							referrerHost.includes("bing") ||
							referrerHost.includes("yahoo") ||
							referrerHost.includes("duckduckgo")
						) {
							sessionSource = "organic";
						} else if (
							referrerHost.includes("facebook") ||
							referrerHost.includes("twitter") ||
							referrerHost.includes("linkedin") ||
							referrerHost.includes("instagram")
						) {
							sessionSource = "social";
						} else {
							sessionSource = "referral";
						}
					}
				} catch {
					sessionSource = "referral";
				}
			}

			// Track session started event
			posthog.capture("session_started", {
				session_source: sessionSource,
				referrer: referrer || "none",
				is_returning_user: !!posthog.get_distinct_id(),
			});

			// Set session source as super property
			posthog.register({
				session_source: sessionSource,
			});
		}

		// Track user activity for engagement
		const trackActivity = () => {
			lastActivityRef.current = Date.now();
		};

		const events = ["mousedown", "keydown", "scroll", "touchstart"];
		events.forEach((event) => {
			window.addEventListener(event, trackActivity, { passive: true });
		});

		// Track engagement every 30 seconds
		engagementIntervalRef.current = setInterval(() => {
			const now = Date.now();
			const timeSinceLastActivity = now - lastActivityRef.current;

			// Only track if user was active in last 30 seconds
			if (timeSinceLastActivity < 30000) {
				const sessionDuration = Math.floor((now - (sessionStartRef.current || now)) / 1000);

				posthog.capture("session_engagement", {
					session_duration_seconds: sessionDuration,
					time_since_last_activity: timeSinceLastActivity,
				});
			}
		}, 30000);

		// Track session end on page unload
		const handleUnload = () => {
			if (sessionStartRef.current) {
				const sessionDuration = Math.floor((Date.now() - sessionStartRef.current) / 1000);

				posthog.capture("session_ended", {
					session_duration_seconds: sessionDuration,
				});
			}
		};

		window.addEventListener("beforeunload", handleUnload);

		return () => {
			events.forEach((event) => {
				window.removeEventListener(event, trackActivity);
			});

			if (engagementIntervalRef.current) {
				clearInterval(engagementIntervalRef.current);
			}

			window.removeEventListener("beforeunload", handleUnload);
		};
	}, [posthog]);

	return null;
}
