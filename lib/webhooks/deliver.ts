import crypto from "node:crypto";
import { updateWebhookDelivery } from "@/lib/db/queries";
import type { WebhookEndpoint } from "@/lib/db/schema";
import { readSecret } from "./vault";

const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 1000; // 1s, 2s, 4s

/**
 * Deliver a webhook payload to an endpoint URL.
 * Reads the HMAC secret from WorkOS Vault, signs the payload,
 * and attempts delivery with exponential backoff (3 retries max).
 * The secret is held only in memory for the duration of the request.
 */
export async function deliverWebhook(
	deliveryId: string,
	endpoint: WebhookEndpoint,
): Promise<void> {
	// Retrieve the delivery record via DB — we stored the payload there
	const { db } = await import("@/lib/db");
	const { webhookDeliveries } = await import("@/lib/db/schema");
	const { eq } = await import("drizzle-orm");

	const [delivery] = await db
		.select()
		.from(webhookDeliveries)
		.where(eq(webhookDeliveries.id, deliveryId))
		.limit(1);

	if (!delivery) return;

	const payloadJson = JSON.stringify(delivery.payload);

	// Read secret from Vault — held in memory only for duration of function
	let secret: string;
	try {
		secret = await readSecret(endpoint.secretVaultId);
	} catch {
		await updateWebhookDelivery(deliveryId, {
			statusCode: null,
			response: "Failed to retrieve signing secret from Vault.",
			attempts: 1,
		});
		return;
	}

	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
		if (attempt > 1) {
			const backoffMs = BASE_BACKOFF_MS * 2 ** (attempt - 2);
			await new Promise((r) => setTimeout(r, backoffMs));
		}

		const timestamp = Date.now().toString();
		const signature = crypto
			.createHmac("sha256", secret)
			.update(`${timestamp}.${payloadJson}`)
			.digest("hex");

		let statusCode: number | null = null;
		let responseText = "";

		try {
			const res = await fetch(endpoint.url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Bio-Timestamp": timestamp,
					"X-Bio-Signature": `sha256=${signature}`,
					"User-Agent": "biohasl.ink-Webhook/1.0",
				},
				body: payloadJson,
				signal: AbortSignal.timeout(10_000), // 10s timeout per attempt
			});

			statusCode = res.status;
			responseText = await res.text().catch(() => "");

			if (res.ok) {
				// Success — update delivery record
				await updateWebhookDelivery(deliveryId, {
					statusCode,
					response: responseText.slice(0, 1000),
					attempts: attempt,
					deliveredAt: new Date(),
				});
				return;
			}
		} catch (err) {
			responseText = err instanceof Error ? err.message : "Network error";
		}

		if (attempt === MAX_ATTEMPTS) {
			await updateWebhookDelivery(deliveryId, {
				statusCode,
				response: responseText.slice(0, 1000),
				attempts: attempt,
			});
		}
	}

	// Ensure secret is no longer referenced
	(secret as unknown) = null;
}
