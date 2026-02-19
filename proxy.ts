import { NextRequest, NextResponse } from "next/server";
import { unsealData } from "iron-session";
import type { SessionData } from "./lib/session";

const SESSION_COOKIE_NAME = "linky_session";

// Protected route prefixes — middleware runs on these
const PROTECTED_PREFIXES = ["/dashboard", "/appearance", "/settings"];
const PROTECTED_API_PREFIXES = ["/api/pages", "/api/user", "/api/analytics"];

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
  const { pathname } = request.nextUrl;

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
    "/dashboard/:path*",
    "/appearance/:path*",
    "/settings/:path*",
    "/api/pages/:path*",
    "/api/user/:path*",
    "/api/analytics/:path*",
  ],
};
