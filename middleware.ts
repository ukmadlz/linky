import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Get session
  const session = await auth.api.getSession({ headers: request.headers });

  // Protected routes - require authentication
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/settings") || pathname.startsWith("/analytics")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Auth routes - redirect if already authenticated
  if (pathname === "/login" || pathname === "/register") {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*", "/analytics/:path*", "/login", "/register"],
};
