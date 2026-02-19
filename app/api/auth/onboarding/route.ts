import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, saveSession } from "@/lib/session";
import { getUserById, updateUser, createPage } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { captureServerEvent } from "@/lib/posthog/server";
import { sendWelcomeEmail } from "@/lib/email/send-welcome";

const RESERVED_WORDS = new Set([
  "api",
  "r",
  "verify",
  "login",
  "logout",
  "dashboard",
  "appearance",
  "analytics",
  "settings",
  "webhooks",
  "onboarding",
  "admin",
  "support",
  "help",
  "about",
  "privacy",
  "terms",
  "robots",
  "sitemap",
]);

const USERNAME_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

const onboardingSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      USERNAME_REGEX,
      "Username may only contain lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen"
    ),
  name: z.string().max(100).optional(),
});

export async function POST(request: Request) {
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserById(session.userId);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Idempotency guard: if user already has a username, don't allow re-onboarding
  if (user.username) {
    return NextResponse.json(
      { error: "Username already set" },
      { status: 409 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = onboardingSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.issues },
      { status: 422 }
    );
  }

  const { username, name } = result.data;

  // Reserved word check
  if (RESERVED_WORDS.has(username.toLowerCase())) {
    return NextResponse.json(
      { error: "That username is reserved", reason: "reserved" },
      { status: 409 }
    );
  }

  // Uniqueness check
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "Username is already taken", reason: "taken" },
      { status: 409 }
    );
  }

  // Update user: set username and optionally name
  await updateUser(session.userId, {
    username,
    ...(name ? { name } : {}),
  });

  // Create the default page using the username as the slug
  await createPage({
    userId: session.userId,
    slug: username,
    title: name ?? user.name ?? username,
  });

  // Update session so middleware no longer gates subsequent requests
  await saveSession({ userId: session.userId, username });

  // Fire-and-forget side effects
  const emailDomain = user.email.split("@")[1];
  captureServerEvent(session.userId, "user_signed_up", {
    provider: "google",
    username,
    email_domain: emailDomain,
  }).catch(console.error);

  sendWelcomeEmail({
    to: user.email,
    name: name ?? user.name ?? undefined,
  }).catch(console.error);

  return NextResponse.json({ ok: true });
}
