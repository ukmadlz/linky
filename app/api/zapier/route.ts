/**
 * Zapier polling endpoint — returns recent webhook events for the authenticated user.
 * Zapier uses this to discover new triggers via polling (REST hooks pattern).
 *
 * Authentication: Bearer token = user's session token.
 * Zapier polls this URL every few minutes to check for new events.
 */

import { desc, eq, gte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { webhookDeliveries, webhookEndpoints } from "@/lib/db/schema";

export async function GET(request: Request) {
	const user = await requireAuth();

	const { searchParams } = new URL(request.url);
	const event = searchParams.get("event"); // optional filter by event type
	const since = searchParams.get("since"); // ISO timestamp

	// Get all endpoints for user
	const userEndpoints = await db
		.select({ id: webhookEndpoints.id })
		.from(webhookEndpoints)
		.where(eq(webhookEndpoints.userId, user.id));

	if (userEndpoints.length === 0) {
		return NextResponse.json([]);
	}

	const endpointIds = userEndpoints.map((e) => e.id);

	// Build query for recent deliveries
	const sinceDate = since
		? new Date(since)
		: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

	let deliveries = await db
		.select()
		.from(webhookDeliveries)
		.where(gte(webhookDeliveries.createdAt, sinceDate))
		.orderBy(desc(webhookDeliveries.createdAt))
		.limit(100);

	// Filter to user's endpoints
	deliveries = deliveries.filter((d) => endpointIds.includes(d.endpointId));

	// Filter by event type if specified
	if (event) {
		deliveries = deliveries.filter((d) => d.event === event);
	}

	// Format for Zapier: id field required, plus event data
	const results = deliveries.map((d) => ({
		id: d.id,
		event: d.event,
		payload: d.payload,
		status: d.statusCode,
		created_at: d.createdAt,
		delivered_at: d.deliveredAt,
	}));

	return NextResponse.json(results);
}
