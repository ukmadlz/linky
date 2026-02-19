import { and, eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateUser } from "@/lib/db/queries";
import { users } from "@/lib/db/schema";
import { captureServerEvent } from "@/lib/posthog/server";

const updateProfileSchema = z.object({
	name: z.string().max(100).optional(),
	bio: z.string().max(500).optional(),
	username: z
		.string()
		.min(2)
		.max(50)
		.regex(
			/^[a-z0-9_-]+$/,
			"Only lowercase letters, numbers, hyphens, and underscores",
		)
		.optional(),
	avatarUrl: z.string().url().max(500).optional().or(z.literal("")),
});

export async function GET() {
	const user = await requireAuth();
	return NextResponse.json(user);
}

export async function PATCH(request: Request) {
	const user = await requireAuth();

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const result = updateProfileSchema.safeParse(body);
	if (!result.success) {
		return NextResponse.json(
			{ error: "Validation failed", issues: result.error.issues },
			{ status: 422 },
		);
	}

	const data = result.data;

	// Check username uniqueness if being changed
	if (data.username && data.username !== user.username) {
		const [existing] = await db
			.select({ id: users.id })
			.from(users)
			.where(and(eq(users.username, data.username), ne(users.id, user.id)))
			.limit(1);

		if (existing) {
			return NextResponse.json(
				{ error: "Username is already taken" },
				{ status: 409 },
			);
		}
	}

	const changedFields = Object.keys(data).filter((key) => {
		const k = key as keyof typeof data;
		return (
			data[k] !== undefined && data[k] !== (user as Record<string, unknown>)[k]
		);
	});

	const updated = await updateUser(user.id, {
		name: data.name,
		bio: data.bio,
		username: data.username,
		avatarUrl: data.avatarUrl || null,
	});

	if (!updated) {
		return NextResponse.json({ error: "User not found" }, { status: 404 });
	}

	// Capture settings_updated event (non-blocking)
	captureServerEvent(user.id, "settings_updated", {
		changed_fields: changedFields,
	}).catch(console.error);

	return NextResponse.json(updated);
}
