import { NextRequest, NextResponse } from "next/server";
import { getWorkOS } from "@/lib/workos";
import { getUserByWorkosId, createUser } from "@/lib/db/queries";
import { saveSession } from "@/lib/session";
import { captureServerEvent } from "@/lib/posthog/server";
import { sendWelcomeEmail } from "@/lib/email/send-welcome";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=no_code`
    );
  }

  try {
    const workos = getWorkOS();

    // Exchange code for authenticated user
    const { user: workosUser } =
      await workos.userManagement.authenticateWithCode({
        code,
        clientId: process.env.WORKOS_CLIENT_ID!,
      });

    // Find or create the user in our DB
    let dbUser = await getUserByWorkosId(workosUser.id);
    let isNewUser = false;

    if (!dbUser) {
      isNewUser = true;
      dbUser = await createUser({
        email: workosUser.email,
        workosUserId: workosUser.id,
        name:
          workosUser.firstName && workosUser.lastName
            ? `${workosUser.firstName} ${workosUser.lastName}`
            : workosUser.firstName ?? undefined,
        avatarUrl: workosUser.profilePictureUrl ?? undefined,
      });
    }

    // Set session
    await saveSession({ userId: dbUser.id });

    // PostHog server-side events (non-blocking)
    const emailDomain = workosUser.email.split("@")[1];
    captureServerEvent(
      dbUser.id,
      isNewUser ? "user_signed_up" : "user_logged_in",
      isNewUser
        ? { provider: "google", email_domain: emailDomain }
        : { provider: "google" }
    ).catch(console.error);

    // Welcome email for new users (fire-and-forget)
    if (isNewUser) {
      sendWelcomeEmail({
        to: dbUser.email,
        name: dbUser.name ?? undefined,
      }).catch(console.error);
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    );
  } catch (error) {
    console.error("[Auth callback]", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=auth_failed`
    );
  }
}
