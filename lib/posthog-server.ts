import { posthogServer } from "./posthog";

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
