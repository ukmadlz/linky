import { NextRequest, NextResponse } from "next/server";
import { unsealData } from "iron-session";
import type { SessionData } from "./lib/session";

const SESSION_COOKIE_NAME = "linky_session";

const APP_HOSTNAME = new URL(
  process.env.NEXT_PUBLIC_APP_URL ?? "https://linky.page"
).hostname;

// Protected route prefixes — proxy runs on these
const PROTECTED_PREFIXES = ["/dashboard", "/appearance", "/settings", "/webhooks", "/analytics"];
const PROTECTED_API_PREFIXES = ["/api/pages", "/api/user", "/api/analytics", "/api/webhooks/endpoints", "/api/webhooks/deliveries", "/api/zapier"];

// Routes that are accessible while authenticated but before username is set
const ONBOARDING_PREFIX = "/onboarding";
const ONBOARDING_PASSTHROUGH_PREFIXES = [
  "/api/auth/",
  "/api/user/username/check",
];

async function getSessionData(
  request: NextRequest
): Promise<SessionData | null> {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!cookieValue) return null;

  try {
    return await unsealData<SessionData>(cookieValue, {
      password:
        process.env.SESSION_SECRET ??
        "fallback-dev-secret-change-in-production",
    });
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0] ?? "";
  const { pathname } = request.nextUrl;

  // ── Custom domain routing ──────────────────────────────────────────────────
  // Skip for main app hostname, localhost, vercel preview domains
  const isCustomDomain =
    hostname &&
    hostname !== APP_HOSTNAME &&
    hostname !== "localhost" &&
    !hostname.endsWith(".vercel.app") &&
    !hostname.endsWith(".local");

  if (isCustomDomain) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    try {
      const res = await fetch(
        `${appUrl}/api/domains/lookup?domain=${encodeURIComponent(hostname)}`,
        { next: { revalidate: 60 } }
      );

      if (res.ok) {
        const { slug } = (await res.json()) as { slug: string | null };
        if (slug) {
          const url = request.nextUrl.clone();
          const originalPath = request.nextUrl.pathname;
          url.pathname =
            originalPath === "/" || originalPath === ""
              ? `/${slug}`
              : `/${slug}${originalPath}`;
          return NextResponse.rewrite(url);
        }
      }
    } catch {
      // Fall through to normal routing if lookup fails
    }

    return NextResponse.next();
  }

  // ── Auth protection ────────────────────────────────────────────────────────
  const isProtectedPage = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isProtectedApi = PROTECTED_API_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isOnboardingPage = pathname === ONBOARDING_PREFIX;
  const isOnboardingApi = pathname === "/api/auth/onboarding";

  if (!isProtectedPage && !isProtectedApi && !isOnboardingPage && !isOnboardingApi) {
    return NextResponse.next();
  }

  const sessionData = await getSessionData(request);
  const userId = sessionData?.userId;

  if (!userId) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    if (!isOnboardingPage && !isOnboardingApi) {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // ── Onboarding gate ────────────────────────────────────────────────────────
  // Authenticated users without a username must complete onboarding first
  const hasUsername = !!sessionData?.username;

  if (!hasUsername && !isOnboardingPage && !isOnboardingApi) {
    // Allow through routes that are needed to complete onboarding
    const isPassthrough = ONBOARDING_PASSTHROUGH_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix)
    );
    if (!isPassthrough) {
      return NextResponse.redirect(new URL(ONBOARDING_PREFIX, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
