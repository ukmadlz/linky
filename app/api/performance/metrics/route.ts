import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * API endpoint to get performance metrics
 * Only accessible to authenticated users (or admin users in production)
 */
export async function GET(request: Request) {
	try {
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// In production, you might want to restrict this to admin users only
		// if (!session.user.isAdmin) {
		//   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		// }

		// Get performance metrics from PostHog or database
		// This is a placeholder - in production, query PostHog API
		const metrics = {
			timestamp: new Date().toISOString(),
			web_vitals: {
				fcp: { avg: 1200, p75: 1500, p95: 2000 },
				lcp: { avg: 2000, p75: 2500, p95: 3500 },
				cls: { avg: 0.05, p75: 0.08, p95: 0.15 },
				fid: { avg: 50, p75: 75, p95: 150 },
				ttfb: { avg: 600, p75: 800, p95: 1200 },
				inp: { avg: 100, p75: 150, p95: 250 },
			},
			api_performance: {
				avg_response_time: 150,
				p75_response_time: 200,
				p95_response_time: 500,
				slow_requests_count: 5,
				total_requests: 1000,
			},
			db_performance: {
				avg_query_time: 25,
				p75_query_time: 50,
				p95_query_time: 100,
				slow_queries_count: 3,
				total_queries: 500,
			},
			slowest_routes: [
				{ route: "/api/analytics", avg_duration: 850, count: 50 },
				{ route: "/api/links", avg_duration: 250, count: 200 },
				{ route: "/api/user/profile", avg_duration: 180, count: 100 },
			],
		};

		return NextResponse.json(metrics);
	} catch (error) {
		console.error("Failed to get performance metrics:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
