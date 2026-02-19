import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import {
	createWebhookEndpoint,
	getWebhookEndpointsByUserId,
} from "@/lib/db/queries";
import type { WebhookEvent } from "@/lib/webhooks/emit";
import { storeSecret } from "@/lib/webhooks/vault";

const VALID_EVENTS: WebhookEvent[] = [
	"page.viewed",
	"link.clicked",
	"page.updated",
	"block.created",
	"block.deleted",
];

const createSchema = z.object({
	url: z.string().url("Must be a valid URL"),
	events: z
		.array(
			z.enum([
				"page.viewed",
				"link.clicked",
				"page.updated",
				"block.created",
				"block.deleted",
			]),
		)
		.min(1, "At least one event is required"),
});

export async function GET() {
	const user = await requireAuth();
	const endpoints = await getWebhookEndpointsByUserId(user.id);
	return NextResponse.json({ endpoints, validEvents: VALID_EVENTS });
}

export async function POST(request: Request) {
	const user = await requireAuth();

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const parsed = createSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: "Validation failed", issues: parsed.error.issues },
			{ status: 422 },
		);
	}

	const { url, events } = parsed.data;

	// Fetch workosUserId for Vault context
	if (!user.workosUserId) {
		return NextResponse.json(
			{ error: "Account not linked to WorkOS" },
			{ status: 400 },
		);
	}

	// Generate a cryptographically random HMAC secret
	const rawSecret = crypto.randomBytes(32).toString("hex");

	// Store in WorkOS Vault — never persist the raw secret
	let secretVaultId: string;
	try {
		secretVaultId = await storeSecret(
			user.workosUserId,
			"webhook_secret",
			rawSecret,
		);
	} catch {
		return NextResponse.json(
			{ error: "Failed to securely store webhook secret. Please try again." },
			{ status: 500 },
		);
	}

	const endpoint = await createWebhookEndpoint({
		userId: user.id,
		url,
		secretVaultId,
		events,
	});

	// Return the endpoint with the secret revealed ONCE — never again
	return NextResponse.json(
		{
			...endpoint,
			secret: rawSecret,
			message: "Save this secret — it won't be shown again.",
		},
		{ status: 201 },
	);
}
