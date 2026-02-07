import { test, expect } from "@playwright/test";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

/**
 * Local Lighthouse performance tests
 * Tests Core Web Vitals and performance metrics
 */

const LIGHTHOUSE_CONFIG = {
	extends: "lighthouse:default",
	settings: {
		onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
		formFactor: "desktop" as const,
		throttling: {
			rttMs: 40,
			throughputKbps: 10240,
			cpuSlowdownMultiplier: 1,
		},
		screenEmulation: {
			mobile: false,
			width: 1350,
			height: 940,
			deviceScaleFactor: 1,
			disabled: false,
		},
	},
};

const MOBILE_LIGHTHOUSE_CONFIG = {
	extends: "lighthouse:default",
	settings: {
		onlyCategories: ["performance", "accessibility"],
		formFactor: "mobile" as const,
		throttling: {
			rttMs: 150,
			throughputKbps: 1638.4,
			cpuSlowdownMultiplier: 4,
		},
		screenEmulation: {
			mobile: true,
			width: 412,
			height: 823,
			deviceScaleFactor: 2.625,
			disabled: false,
		},
	},
};

async function runLighthouse(url: string, config = LIGHTHOUSE_CONFIG) {
	const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless"] });
	const options = {
		logLevel: "error" as const,
		output: "json" as const,
		port: chrome.port,
	};

	const runnerResult = await lighthouse(url, options, config);
	await chrome.kill();

	return runnerResult?.lhr;
}

test.describe("Lighthouse Performance Tests", () => {
	const baseURL = process.env.BASE_URL || "http://localhost:3000";

	test.describe("Desktop Performance", () => {
		test("should meet performance budget on home page", async () => {
			const results = await runLighthouse(`${baseURL}/`);

			expect(results).toBeDefined();
			if (!results) return;

			// Performance score should be at least 85
			const performanceScore = results.categories.performance.score! * 100;
			expect(performanceScore).toBeGreaterThanOrEqual(85);

			// Check Core Web Vitals
			const audits = results.audits;

			// First Contentful Paint (FCP) < 1.5s
			const fcp = audits["first-contentful-paint"].numericValue!;
			expect(fcp).toBeLessThan(1500);

			// Largest Contentful Paint (LCP) < 2.5s
			const lcp = audits["largest-contentful-paint"].numericValue!;
			expect(lcp).toBeLessThan(2500);

			// Cumulative Layout Shift (CLS) < 0.1
			const cls = audits["cumulative-layout-shift"].numericValue!;
			expect(cls).toBeLessThan(0.1);

			// Total Blocking Time (TBT) < 300ms
			const tbt = audits["total-blocking-time"].numericValue!;
			expect(tbt).toBeLessThan(300);

			// Speed Index < 3s
			const speedIndex = audits["speed-index"].numericValue!;
			expect(speedIndex).toBeLessThan(3000);
		});

		test("should meet performance budget on public profile page", async () => {
			const results = await runLighthouse(`${baseURL}/testuser`);

			expect(results).toBeDefined();
			if (!results) return;

			const performanceScore = results.categories.performance.score! * 100;
			expect(performanceScore).toBeGreaterThanOrEqual(85);

			// Check key metrics
			const audits = results.audits;

			const fcp = audits["first-contentful-paint"].numericValue!;
			expect(fcp).toBeLessThan(1500);

			const lcp = audits["largest-contentful-paint"].numericValue!;
			expect(lcp).toBeLessThan(2500);

			const cls = audits["cumulative-layout-shift"].numericValue!;
			expect(cls).toBeLessThan(0.1);
		});

		test("should have good Time to Interactive (TTI)", async () => {
			const results = await runLighthouse(`${baseURL}/`);

			expect(results).toBeDefined();
			if (!results) return;

			const audits = results.audits;

			// Time to Interactive (TTI) < 3.5s
			const tti = audits.interactive.numericValue!;
			expect(tti).toBeLessThan(3500);
		});

		test("should have minimal unused JavaScript", async () => {
			const results = await runLighthouse(`${baseURL}/`);

			expect(results).toBeDefined();
			if (!results) return;

			const audits = results.audits;

			// Unused JavaScript should not be a major issue
			const unusedJS = audits["unused-javascript"];
			if (unusedJS.details?.items) {
				const totalWaste = unusedJS.details.items.reduce(
					(sum: number, item: { wastedBytes: number }) => sum + item.wastedBytes,
					0,
				);

				// Less than 100KB of unused JS
				expect(totalWaste).toBeLessThan(100000);
			}
		});

		test("should use efficient caching", async () => {
			const results = await runLighthouse(`${baseURL}/`);

			expect(results).toBeDefined();
			if (!results) return;

			const audits = results.audits;

			// Check cache policy
			const cachePolicy = audits["uses-long-cache-ttl"];
			if (cachePolicy.score !== null) {
				expect(cachePolicy.score).toBeGreaterThan(0.5);
			}
		});

		test("should have good resource loading", async () => {
			const results = await runLighthouse(`${baseURL}/`);

			expect(results).toBeDefined();
			if (!results) return;

			const audits = results.audits;

			// Should use text compression
			const textCompression = audits["uses-text-compression"];
			if (textCompression.score !== null) {
				expect(textCompression.score).toBeGreaterThan(0.8);
			}

			// Should not have render-blocking resources
			const renderBlocking = audits["render-blocking-resources"];
			if (renderBlocking.details?.items) {
				expect(renderBlocking.details.items.length).toBeLessThan(3);
			}
		});
	});

	test.describe("Mobile Performance", () => {
		test("should meet mobile performance budget", async () => {
			const results = await runLighthouse(`${baseURL}/testuser`, MOBILE_LIGHTHOUSE_CONFIG);

			expect(results).toBeDefined();
			if (!results) return;

			// Mobile performance should be at least 75 (mobile is generally slower)
			const performanceScore = results.categories.performance.score! * 100;
			expect(performanceScore).toBeGreaterThanOrEqual(75);

			// Check mobile Core Web Vitals (slightly relaxed for mobile)
			const audits = results.audits;

			// FCP < 2s on mobile
			const fcp = audits["first-contentful-paint"].numericValue!;
			expect(fcp).toBeLessThan(2000);

			// LCP < 3s on mobile
			const lcp = audits["largest-contentful-paint"].numericValue!;
			expect(lcp).toBeLessThan(3000);

			// CLS < 0.1
			const cls = audits["cumulative-layout-shift"].numericValue!;
			expect(cls).toBeLessThan(0.1);
		});

		test("should use responsive images on mobile", async () => {
			const results = await runLighthouse(`${baseURL}/testuser`, MOBILE_LIGHTHOUSE_CONFIG);

			expect(results).toBeDefined();
			if (!results) return;

			const audits = results.audits;

			// Should use appropriately sized images
			const responsiveImages = audits["uses-responsive-images"];
			if (responsiveImages.score !== null) {
				expect(responsiveImages.score).toBeGreaterThan(0.8);
			}
		});
	});

	test.describe("Accessibility Scores", () => {
		test("should meet accessibility score threshold", async () => {
			const results = await runLighthouse(`${baseURL}/`);

			expect(results).toBeDefined();
			if (!results) return;

			// Accessibility score should be at least 90
			const accessibilityScore = results.categories.accessibility.score! * 100;
			expect(accessibilityScore).toBeGreaterThanOrEqual(90);
		});

		test("should have good accessibility on public pages", async () => {
			const results = await runLighthouse(`${baseURL}/testuser`);

			expect(results).toBeDefined();
			if (!results) return;

			const accessibilityScore = results.categories.accessibility.score! * 100;
			expect(accessibilityScore).toBeGreaterThanOrEqual(90);

			// Check specific accessibility audits
			const audits = results.audits;

			// Should have proper color contrast
			expect(audits["color-contrast"].score).toBe(1);

			// Should have alt text on images
			if (audits["image-alt"].score !== null) {
				expect(audits["image-alt"].score).toBe(1);
			}

			// Should have proper button names
			if (audits["button-name"].score !== null) {
				expect(audits["button-name"].score).toBe(1);
			}
		});
	});

	test.describe("Best Practices", () => {
		test("should meet best practices score", async () => {
			const results = await runLighthouse(`${baseURL}/`);

			expect(results).toBeDefined();
			if (!results) return;

			// Best practices score should be at least 90
			const bestPracticesScore = results.categories["best-practices"].score! * 100;
			expect(bestPracticesScore).toBeGreaterThanOrEqual(90);
		});

		test("should not have console errors", async () => {
			const results = await runLighthouse(`${baseURL}/`);

			expect(results).toBeDefined();
			if (!results) return;

			const audits = results.audits;

			// Should not have errors logged to console
			const consoleErrors = audits["errors-in-console"];
			if (consoleErrors.score !== null) {
				expect(consoleErrors.score).toBe(1);
			}
		});

		test("should use HTTPS", async () => {
			const results = await runLighthouse(`${baseURL}/`);

			expect(results).toBeDefined();
			if (!results) return;

			const audits = results.audits;

			// Should use HTTPS (if not localhost)
			const usesHTTPS = audits["is-on-https"];
			if (!baseURL.includes("localhost")) {
				expect(usesHTTPS.score).toBe(1);
			}
		});
	});

	test.describe("SEO", () => {
		test("should meet SEO score threshold", async () => {
			const results = await runLighthouse(`${baseURL}/testuser`);

			expect(results).toBeDefined();
			if (!results) return;

			// SEO score should be at least 90
			const seoScore = results.categories.seo.score! * 100;
			expect(seoScore).toBeGreaterThanOrEqual(90);
		});

		test("should have proper meta tags", async () => {
			const results = await runLighthouse(`${baseURL}/testuser`);

			expect(results).toBeDefined();
			if (!results) return;

			const audits = results.audits;

			// Should have meta description
			expect(audits["meta-description"].score).toBe(1);

			// Should have document title
			expect(audits["document-title"].score).toBe(1);

			// Should have viewport meta tag
			expect(audits.viewport.score).toBe(1);

			// Should be crawlable
			expect(audits["is-crawlable"].score).toBe(1);
		});
	});

	test.describe("Resource Size", () => {
		test("should have reasonable total page size", async () => {
			const results = await runLighthouse(`${baseURL}/testuser`);

			expect(results).toBeDefined();
			if (!results) return;

			const audits = results.audits;

			// Total page size should be under 2MB
			const totalByteWeight = audits["total-byte-weight"];
			if (totalByteWeight.numericValue) {
				expect(totalByteWeight.numericValue).toBeLessThan(2000000);
			}
		});

		test("should minimize third-party code", async () => {
			const results = await runLighthouse(`${baseURL}/`);

			expect(results).toBeDefined();
			if (!results) return;

			const audits = results.audits;

			// Third-party code should not be excessive
			const thirdParty = audits["third-party-summary"];
			if (thirdParty.details?.items) {
				const totalThirdPartySize = thirdParty.details.items.reduce(
					(sum: number, item: { transferSize: number }) => sum + item.transferSize,
					0,
				);

				// Less than 500KB of third-party code
				expect(totalThirdPartySize).toBeLessThan(500000);
			}
		});
	});
});
