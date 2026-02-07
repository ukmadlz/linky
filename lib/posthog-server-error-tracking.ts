import { headers } from "next/headers";
import { posthogServer } from "./posthog";

interface ErrorContext {
	user_id?: string;
	username?: string;
	route?: string;
	method?: string;
	url?: string;
	status_code?: number;
	request_id?: string;
	user_agent?: string;
	ip_address?: string;
	environment?: string;
	[key: string]: unknown;
}

/**
 * Track a server-side error in PostHog
 */
export async function trackServerError(error: Error | unknown, context: ErrorContext = {}) {
	try {
		const errorMessage = error instanceof Error ? error.message : String(error);
		const errorStack = error instanceof Error ? error.stack : undefined;
		const errorName = error instanceof Error ? error.name : "Unknown";

		// Get environment info
		const environment = process.env.NODE_ENV || "development";
		const timestamp = new Date().toISOString();

		const errorData = {
			error_message: errorMessage,
			error_name: errorName,
			error_stack: errorStack,
			error_type: "server_error",
			environment,
			timestamp,
			...context,
		};

		// Use a fallback distinct_id if user_id is not provided
		const distinctId = context.user_id || "system";

		posthogServer.capture({
			distinctId,
			event: "$exception",
			properties: errorData,
		});

		// Also log to console in development
		if (environment === "development") {
			console.error("[Server Error]", {
				error: errorMessage,
				context,
				stack: errorStack,
			});
		}
	} catch (trackingError) {
		// Don't let tracking errors break the application
		console.error("Failed to track server error:", trackingError);
	}
}

/**
 * Track an API route error with request context
 */
export async function trackAPIError(
	error: Error | unknown,
	request: Request,
	context: Omit<ErrorContext, "route" | "method" | "url" | "user_agent"> = {}
) {
	try {
		const url = new URL(request.url);
		const headersList = await headers();

		const apiContext: ErrorContext = {
			route: url.pathname,
			method: request.method,
			url: request.url,
			user_agent: headersList.get("user-agent") || undefined,
			ip_address: headersList.get("x-forwarded-for") || undefined,
			...context,
		};

		await trackServerError(error, apiContext);
	} catch (trackingError) {
		console.error("Failed to track API error:", trackingError);
	}
}

/**
 * Track a database error with query context
 */
export async function trackDatabaseError(
	error: Error | unknown,
	context: {
		operation?: string;
		table?: string;
		query?: string;
		user_id?: string;
		[key: string]: unknown;
	} = {}
) {
	try {
		const dbContext: ErrorContext = {
			error_type: "database_error",
			...context,
		};

		await trackServerError(error, dbContext);
	} catch (trackingError) {
		console.error("Failed to track database error:", trackingError);
	}
}

/**
 * Track external API failure (Stripe, BetterAuth, etc.)
 */
export async function trackExternalAPIError(
	service: string,
	error: Error | unknown,
	context: {
		endpoint?: string;
		status_code?: number;
		response_body?: string;
		user_id?: string;
		[key: string]: unknown;
	} = {}
) {
	try {
		const apiContext: ErrorContext = {
			error_type: "external_api_error",
			service,
			...context,
		};

		await trackServerError(error, apiContext);
	} catch (trackingError) {
		console.error("Failed to track external API error:", trackingError);
	}
}

/**
 * Wrap an async function with error tracking
 */
export function withErrorTracking<T extends (...args: never[]) => Promise<unknown>>(
	fn: T,
	context: ErrorContext = {}
): T {
	return (async (...args: Parameters<T>) => {
		try {
			return await fn(...args);
		} catch (error) {
			await trackServerError(error, context);
			throw error;
		}
	}) as T;
}

/**
 * Create a request context object from a Next.js request
 */
export async function createRequestContext(
	request: Request,
	additionalContext: Record<string, unknown> = {}
): Promise<ErrorContext> {
	const url = new URL(request.url);
	const headersList = await headers();

	return {
		route: url.pathname,
		method: request.method,
		url: request.url,
		user_agent: headersList.get("user-agent") || undefined,
		ip_address: headersList.get("x-forwarded-for") || undefined,
		environment: process.env.NODE_ENV || "development",
		...additionalContext,
	};
}
