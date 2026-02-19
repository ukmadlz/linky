import { NextRequest, NextResponse } from "next/server";
import { unsealData } from "iron-session";
import type { SessionData } from "./lib/session";

const SESSION_COOKIE_NAME = "linky_session";

const APP_HOSTNAME = new URL(
  process.env.NEXT_PUBLIC_APP_URL ?? "https://linky.page"
).hostname;

// Protected route prefixes — proxy runs on these
const PROTECTED_PREFIXES = ["/dashboard", "/appearance", "/settings", "/webhooks"];
const PROTECTED_API_PREFIXES = ["/api/pages", "/api/user", "/api/analytics", "/api/webhooks/endpoints", "/api/webhooks/deliveries", "/api/zapier"];

async function getSessionUserId(
  request: NextRequest
): Promise<string | undefined> {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!cookieValue) return undefined;

  try {
    const data = await unsealData<SessionData>(cookieValue, {
      password:
        process.env.SESSION_SECRET ??
        "fallback-dev-secret-change-in-production",
    });
    return data.userId;
  } catch {
    return undefined;
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

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  const userId = await getSessionUserId(request);

  if (!userId) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
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
