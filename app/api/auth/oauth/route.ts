import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuthorizationUrl } from "@/lib/workos";

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const provider = searchParams.get("provider") as "google" | "microsoft" | "apple";

	if (!provider || !["google", "microsoft", "apple"].includes(provider)) {
		return NextResponse.redirect(new URL("/login?error=invalid_provider", request.url));
	}

	try {
		const authorizationUrl = getAuthorizationUrl(provider);
		return NextResponse.redirect(authorizationUrl);
	} catch (error) {
		console.error("OAuth initiation error:", error);
		return NextResponse.redirect(new URL("/login?error=auth_failed", request.url));
	}
}
