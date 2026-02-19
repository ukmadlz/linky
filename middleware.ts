import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const APP_HOSTNAME = new URL(
  process.env.NEXT_PUBLIC_APP_URL ?? "https://linky.page"
).hostname;

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0] ?? "";

  // Skip: main app hostname, localhost, vercel preview domains
  if (
    !hostname ||
    hostname === APP_HOSTNAME ||
    hostname === "localhost" ||
    hostname.endsWith(".vercel.app") ||
    hostname.endsWith(".local")
  ) {
    return NextResponse.next();
  }

  // Custom domain: look up the page slug
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(
      `${appUrl}/api/domains/lookup?domain=${encodeURIComponent(hostname)}`,
      { next: { revalidate: 60 } }
    );

    if (res.ok) {
      const { slug } = await res.json() as { slug: string | null };
      if (slug) {
        // Rewrite: custom domain / → /{slug} on the main app
        const url = request.nextUrl.clone();
        const originalPath = request.nextUrl.pathname;

        // Rewrite root to the slug, preserve sub-paths
        if (originalPath === "/" || originalPath === "") {
          url.pathname = `/${slug}`;
        } else {
          // For sub-paths (e.g. /some-path), rewrite but keep the custom domain feel
          url.pathname = `/${slug}${originalPath}`;
        }
        return NextResponse.rewrite(url);
      }
    }
  } catch {
    // If lookup fails, fall through to normal routing
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - api routes (they handle themselves)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/).*)",
  ],
};
