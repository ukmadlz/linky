"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";

export function PageViewTracker() {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const posthog = usePostHog();

	useEffect(() => {
		if (!posthog) return;

		// Track page view with comprehensive metadata
		const url = window.location.href;
		const referrer = document.referrer;
		const title = document.title;

		// Extract UTM parameters
		const utmSource = searchParams.get("utm_source");
		const utmMedium = searchParams.get("utm_medium");
		const utmCampaign = searchParams.get("utm_campaign");
		const utmTerm = searchParams.get("utm_term");
		const utmContent = searchParams.get("utm_content");

		// Track navigation timing if available
		const navigationTiming = performance.getEntriesByType("navigation")[0] as
			| PerformanceNavigationTiming
			| undefined;

		const properties: Record<string, unknown> = {
			$current_url: url,
			$pathname: pathname,
			$title: title,
			$referrer: referrer,
		};

		// Add UTM parameters if present
		if (utmSource) properties.utm_source = utmSource;
		if (utmMedium) properties.utm_medium = utmMedium;
		if (utmCampaign) properties.utm_campaign = utmCampaign;
		if (utmTerm) properties.utm_term = utmTerm;
		if (utmContent) properties.utm_content = utmContent;

		// Add performance timing if available
		if (navigationTiming) {
			properties.page_load_time = Math.round(
				navigationTiming.loadEventEnd - navigationTiming.fetchStart
			);
			properties.dom_interactive_time = Math.round(
				navigationTiming.domInteractive - navigationTiming.fetchStart
			);
			properties.dom_content_loaded_time = Math.round(
				navigationTiming.domContentLoadedEventEnd - navigationTiming.fetchStart
			);
		}

		// Capture pageview event
		posthog.capture("$pageview", properties);
	}, [pathname, searchParams, posthog]);

	return null;
}
