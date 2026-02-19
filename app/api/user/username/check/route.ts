import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { available: false, reason: "invalid" },
      { status: 400 }
    );
  }

  // Format validation
  if (username.length < 3 || username.length > 30) {
    return NextResponse.json({ available: false, reason: "invalid" });
  }

  if (!USERNAME_REGEX.test(username)) {
    return NextResponse.json({ available: false, reason: "invalid" });
  }

  // Reserved word check
  if (RESERVED_WORDS.has(username.toLowerCase())) {
    return NextResponse.json({ available: false, reason: "reserved" });
  }

  // DB uniqueness check
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existing) {
    return NextResponse.json({ available: false, reason: "taken" });
  }

  return NextResponse.json({ available: true });
}
