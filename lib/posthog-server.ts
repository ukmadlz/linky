import { posthogServer } from "./posthog";

// Re-export as posthog for convenience
export const posthog = posthogServer;

export async function trackDashboardAction(
	userId: string,
	action: string,
	properties?: Record<string, unknown>
) {
	try {
		posthogServer.capture({
			distinctId: userId,
			event: "dashboard_action",
			properties: {
				action,
				...properties,
			},
		});
	} catch (error) {
		console.error("Failed to track dashboard action:", error);
	}
}

export async function shutdownPostHog() {
	await posthogServer.shutdown();
}
