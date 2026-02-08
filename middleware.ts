import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname;

	// Check if user has session cookie
	const sessionCookie = request.cookies.get("session");
	const hasSession = !!sessionCookie;

	// Protected routes - require authentication
	if (
		pathname.startsWith("/dashboard") ||
		pathname.startsWith("/settings") ||
		pathname.startsWith("/analytics")
	) {
		if (!hasSession) {
			return NextResponse.redirect(new URL("/login", request.url));
		}
	}

	// Auth routes - redirect if already authenticated
	if (pathname === "/login" || pathname === "/register") {
		if (hasSession) {
			return NextResponse.redirect(new URL("/dashboard", request.url));
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*", "/settings/:path*", "/analytics/:path*", "/login", "/register"],
};
