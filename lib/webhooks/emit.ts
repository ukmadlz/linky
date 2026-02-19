import {
	createWebhookDelivery,
	getActiveEndpointsForUser,
} from "@/lib/db/queries";
import { deliverWebhook } from "./deliver";

export type WebhookEvent =
	| "page.viewed"
	| "link.clicked"
	| "page.updated"
	| "block.created"
	| "block.deleted";

interface EmitOptions {
	userId: string;
	event: WebhookEvent;
	payload: Record<string, unknown>;
}

/**
 * Emit a webhook event for a user.
 * Finds active endpoints subscribed to this event, creates delivery records,
 * and attempts delivery. Fire-and-forget — does not block the request path.
 */
export async function emitWebhook(options: EmitOptions): Promise<void> {
	const { userId, event, payload } = options;

	const endpoints = await getActiveEndpointsForUser(userId, event).catch(
		() => null,
	);
	if (!endpoints) return; // Silently fail — don't break the request

	for (const endpoint of endpoints) {
		const delivery = await createWebhookDelivery({
			endpointId: endpoint.id,
			event,
			payload: {
				event,
				timestamp: new Date().toISOString(),
				data: payload,
			},
		}).catch(() => null);
		if (!delivery) continue;

		// Deliver asynchronously — don't await
		deliverWebhook(delivery.id, endpoint).catch(console.error);
	}
}
