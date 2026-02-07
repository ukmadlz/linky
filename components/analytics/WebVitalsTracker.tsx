"use client";

import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";

/**
 * Track Core Web Vitals using the browser's Performance Observer API
 * Supports: FCP, LCP, CLS, FID, TTFB, INP
 */
export function WebVitalsTracker() {
	const posthog = usePostHog();

	useEffect(() => {
		if (typeof window === "undefined" || !posthog) return;

		// Track First Contentful Paint (FCP)
		const trackFCP = () => {
			const observer = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					if (entry.name === "first-contentful-paint") {
						const fcp = entry.startTime;
						posthog.capture("web_vitals", {
							metric_name: "FCP",
							metric_value: fcp,
							metric_rating: fcp <= 1800 ? "good" : fcp <= 3000 ? "needs-improvement" : "poor",
							navigation_type: "navigate",
						});
					}
				}
			});

			try {
				observer.observe({ type: "paint", buffered: true });
			} catch (e) {
				console.warn("FCP observation not supported", e);
			}
		};

		// Track Largest Contentful Paint (LCP)
		const trackLCP = () => {
			let lcpValue = 0;
			const observer = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
					renderTime?: number;
					loadTime?: number;
				};
				lcpValue = lastEntry.renderTime || lastEntry.loadTime || 0;
			});

			try {
				observer.observe({ type: "largest-contentful-paint", buffered: true });

				// Report LCP when page is hidden or unloaded
				const reportLCP = () => {
					if (lcpValue > 0) {
						posthog.capture("web_vitals", {
							metric_name: "LCP",
							metric_value: lcpValue,
							metric_rating:
								lcpValue <= 2500 ? "good" : lcpValue <= 4000 ? "needs-improvement" : "poor",
							navigation_type: "navigate",
						});
					}
					observer.disconnect();
				};

				window.addEventListener("visibilitychange", reportLCP, { once: true });
				window.addEventListener("pagehide", reportLCP, { once: true });
			} catch (e) {
				console.warn("LCP observation not supported", e);
			}
		};

		// Track Cumulative Layout Shift (CLS)
		const trackCLS = () => {
			let clsValue = 0;
			let sessionValue = 0;
			const sessionEntries: PerformanceEntry[] = [];

			const observer = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					const layoutShiftEntry = entry as PerformanceEntry & {
						value?: number;
						hadRecentInput?: boolean;
					};

					// Only count layout shifts without recent user input
					if (!layoutShiftEntry.hadRecentInput && layoutShiftEntry.value !== undefined) {
						sessionValue += layoutShiftEntry.value;
						sessionEntries.push(entry);

						// Update CLS if current session value is larger
						if (sessionValue > clsValue) {
							clsValue = sessionValue;
						}
					}
				}
			});

			try {
				observer.observe({ type: "layout-shift", buffered: true });

				// Report CLS when page is hidden or unloaded
				const reportCLS = () => {
					if (clsValue > 0) {
						posthog.capture("web_vitals", {
							metric_name: "CLS",
							metric_value: clsValue,
							metric_rating:
								clsValue <= 0.1 ? "good" : clsValue <= 0.25 ? "needs-improvement" : "poor",
							navigation_type: "navigate",
						});
					}
					observer.disconnect();
				};

				window.addEventListener("visibilitychange", reportCLS, { once: true });
				window.addEventListener("pagehide", reportCLS, { once: true });
			} catch (e) {
				console.warn("CLS observation not supported", e);
			}
		};

		// Track First Input Delay (FID)
		const trackFID = () => {
			const observer = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					const firstInputEntry = entry as PerformanceEntry & {
						processingStart?: number;
					};
					const fid = firstInputEntry.processingStart
						? firstInputEntry.processingStart - entry.startTime
						: 0;

					if (fid > 0) {
						posthog.capture("web_vitals", {
							metric_name: "FID",
							metric_value: fid,
							metric_rating: fid <= 100 ? "good" : fid <= 300 ? "needs-improvement" : "poor",
							navigation_type: "navigate",
						});
						observer.disconnect();
					}
				}
			});

			try {
				observer.observe({ type: "first-input", buffered: true });
			} catch (e) {
				console.warn("FID observation not supported", e);
			}
		};

		// Track Time to First Byte (TTFB)
		const trackTTFB = () => {
			const navigationEntry = performance.getEntriesByType(
				"navigation"
			)[0] as PerformanceNavigationTiming;

			if (navigationEntry) {
				const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;

				posthog.capture("web_vitals", {
					metric_name: "TTFB",
					metric_value: ttfb,
					metric_rating: ttfb <= 800 ? "good" : ttfb <= 1800 ? "needs-improvement" : "poor",
					navigation_type: navigationEntry.type,
				});
			}
		};

		// Track Interaction to Next Paint (INP)
		const trackINP = () => {
			let inpValue = 0;
			const observer = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					const eventEntry = entry as PerformanceEntry & {
						duration?: number;
						processingStart?: number;
						processingEnd?: number;
					};

					if (eventEntry.duration !== undefined && eventEntry.duration > inpValue) {
						inpValue = eventEntry.duration;
					}
				}
			});

			try {
				observer.observe({ type: "event", buffered: true, durationThreshold: 40 });

				// Report INP when page is hidden or unloaded
				const reportINP = () => {
					if (inpValue > 0) {
						posthog.capture("web_vitals", {
							metric_name: "INP",
							metric_value: inpValue,
							metric_rating:
								inpValue <= 200 ? "good" : inpValue <= 500 ? "needs-improvement" : "poor",
							navigation_type: "navigate",
						});
					}
					observer.disconnect();
				};

				window.addEventListener("visibilitychange", reportINP, { once: true });
				window.addEventListener("pagehide", reportINP, { once: true });
			} catch (e) {
				console.warn("INP observation not supported", e);
			}
		};

		// Initialize all trackers
		trackFCP();
		trackLCP();
		trackCLS();
		trackFID();
		trackTTFB();
		trackINP();
	}, [posthog]);

	// This component doesn't render anything
	return null;
}
