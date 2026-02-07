import { http, HttpResponse } from "msw";

/**
 * Mock PostHog API handlers for testing
 */

// Store captured events in memory for testing assertions
const capturedEvents: Array<{
	event: string;
	properties: Record<string, unknown>;
	distinct_id: string;
	timestamp: string;
}> = [];

export const posthogHandlers = [
	// Capture event endpoint
	http.post("*/capture/", async ({ request }) => {
		const body = (await request.json()) as {
			event: string;
			properties: Record<string, unknown>;
			distinct_id: string;
		};

		capturedEvents.push({
			event: body.event,
			properties: body.properties || {},
			distinct_id: body.distinct_id,
			timestamp: new Date().toISOString(),
		});

		return HttpResponse.json({
			status: 1,
		});
	}),

	// Batch capture endpoint
	http.post("*/batch/", async ({ request }) => {
		const body = (await request.json()) as {
			batch: Array<{
				event: string;
				properties: Record<string, unknown>;
				distinct_id: string;
			}>;
		};

		for (const item of body.batch) {
			capturedEvents.push({
				event: item.event,
				properties: item.properties || {},
				distinct_id: item.distinct_id,
				timestamp: new Date().toISOString(),
			});
		}

		return HttpResponse.json({
			status: 1,
		});
	}),

	// Decide endpoint (feature flags)
	http.post("*/decide/", async () => {
		return HttpResponse.json({
			featureFlags: {
				"test-feature": true,
				"beta-features": false,
			},
			sessionRecording: false,
			autocapture_opt_out: false,
		});
	}),

	// Get feature flag
	http.get("*/api/feature_flag/", () => {
		return HttpResponse.json({
			flags: [
				{
					id: 1,
					key: "test-feature",
					name: "Test Feature",
					active: true,
					rollout_percentage: 100,
				},
			],
		});
	}),
];

/**
 * Helper function to get captured events for assertions
 */
export function getCapturedEvents(eventName?: string) {
	if (eventName) {
		return capturedEvents.filter((e) => e.event === eventName);
	}
	return [...capturedEvents];
}

/**
 * Helper function to clear captured events
 */
export function clearCapturedEvents() {
	capturedEvents.length = 0;
}

/**
 * Helper function to wait for a specific event to be captured
 */
export async function waitForEvent(
	eventName: string,
	timeout = 5000
): Promise<(typeof capturedEvents)[0] | null> {
	const startTime = Date.now();

	while (Date.now() - startTime < timeout) {
		const event = capturedEvents.find((e) => e.event === eventName);
		if (event) {
			return event;
		}
		await new Promise((resolve) => setTimeout(resolve, 100));
	}

	return null;
}
