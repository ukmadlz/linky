import type { NextResponse } from "next/server";
import { trackAPIPerformance } from "./performance-monitoring";

/**
 * Middleware to track API route performance
 * Wraps an API route handler and automatically tracks response time
 */
export function withPerformanceTracking<T = unknown>(
	handler: (request: Request, context?: Record<string, unknown>) => Promise<NextResponse<T>>,
	options: {
		route?: string;
		trackSlowRequests?: boolean;
	} = {}
) {
	return async (request: Request, context?: Record<string, unknown>) => {
		const startTime = Date.now();
		const url = new URL(request.url);
		const route = options.route || url.pathname;
		const method = request.method;

		let status = 200;
		let response: NextResponse<T>;

		try {
			response = await handler(request, context);
			status = response.status;
			return response;
		} catch (error) {
			status = 500;
			throw error;
		} finally {
			const duration = Date.now() - startTime;

			// Only track if configured to do so or if request is slow
			const isSlowRequest = duration > 1000;
			if (options.trackSlowRequests === undefined || options.trackSlowRequests || isSlowRequest) {
				await trackAPIPerformance({
					route,
					method,
					duration,
					status,
					timestamp: new Date().toISOString(),
				});
			}
		}
	};
}

/**
 * Extract user ID from request headers (if authenticated)
 */
export async function getUserIdFromRequest(request: Request): Promise<string | undefined> {
	try {
		// This is a simplified version - in production, you'd extract from session
		const authHeader = request.headers.get("authorization");
		if (authHeader) {
			// Extract user ID from auth header or session
			// This is a placeholder - implement based on your auth system
			return undefined;
		}
		return undefined;
	} catch {
		return undefined;
	}
}
