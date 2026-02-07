import { NextResponse } from "next/server";
import { trackAPIError } from "@/lib/posthog-server-error-tracking";
import {
	sendCriticalErrorAlert,
	sendErrorSpikeAlert,
	sendNewErrorAlert,
} from "@/lib/notifications";

/**
 * PostHog webhook endpoint for receiving alerts
 * Configure this endpoint in PostHog dashboard under Project Settings > Webhooks
 */
export async function POST(request: Request) {
	try {
		// Verify webhook signature if configured
		const signature = request.headers.get("x-posthog-signature");
		const webhookSecret = process.env.POSTHOG_WEBHOOK_SECRET;

		if (webhookSecret && signature !== webhookSecret) {
			return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
		}

		const payload = await request.json();

		// Handle different PostHog event types
		const eventType = payload.event_type || payload.hook?.event;

		switch (eventType) {
			case "action_performed":
			case "event_captured":
				// Handle custom event-based alerts
				await handleEventAlert(payload);
				break;

			case "error_spike":
				// Handle error spike alerts
				await handleErrorSpikeAlert(payload);
				break;

			case "new_error":
				// Handle new error type alerts
				await handleNewErrorAlert(payload);
				break;

			default:
				console.log(`Unhandled PostHog webhook event type: ${eventType}`);
		}

		return NextResponse.json({ received: true });
	} catch (error) {
		await trackAPIError(error, request, {
			webhook_source: "posthog",
		});
		console.error("PostHog webhook handler error:", error);
		return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
	}
}

/**
 * Handle event-based alerts from PostHog
 */
async function handleEventAlert(payload: {
	event?: { event: string; properties?: Record<string, unknown> };
	[key: string]: unknown;
}) {
	const event = payload.event;
	if (!event) return;

	// Check if this is an exception event
	if (event.event === "$exception") {
		const errorMessage = event.properties?.error_message as string;
		const errorType = event.properties?.error_type as string;
		const severity = event.properties?.severity as string;

		// Send alert for critical errors
		if (severity === "critical" || errorType === "server_error") {
			await sendCriticalErrorAlert(errorMessage || "Unknown error", {
				error_type: errorType,
				...(event.properties || {}),
			});
		}
	}
}

/**
 * Handle error spike alerts
 */
async function handleErrorSpikeAlert(payload: {
	error_count?: number;
	threshold?: number;
	[key: string]: unknown;
}) {
	const errorCount = payload.error_count || 0;
	const threshold = payload.threshold || 100;

	await sendErrorSpikeAlert(errorCount, threshold);
}

/**
 * Handle new error type alerts
 */
async function handleNewErrorAlert(payload: {
	error_type?: string;
	error_message?: string;
	[key: string]: unknown;
}) {
	const errorType = payload.error_type || "Unknown";
	const errorMessage = payload.error_message || "";

	await sendNewErrorAlert(errorType, errorMessage);
}
