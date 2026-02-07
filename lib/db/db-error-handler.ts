/**
 * Database error tracking utilities
 * Wraps database operations to track errors in PostHog
 */

import { posthog } from "@/lib/posthog-server";

export interface DatabaseError {
	operation: string;
	table: string;
	error: Error;
	context?: Record<string, unknown>;
}

/**
 * Wrap database operations with error tracking
 */
export async function withDatabaseErrorTracking<T>(
	fn: () => Promise<T>,
	context: Record<string, unknown> & { operation: string; table: string }
): Promise<T> {
	const { operation, table, ...otherContext } = context;

	try {
		const startTime = Date.now();
		const result = await fn();
		const duration = Date.now() - startTime;

		// Track successful operation metrics
		posthog.capture({
			distinctId: "system",
			event: "database_operation",
			properties: {
				operation,
				table,
				duration_ms: duration,
				success: true,
				...otherContext,
			},
		});

		return result;
	} catch (error) {
		// Track database error
		posthog.capture({
			distinctId: "system",
			event: "database_error",
			properties: {
				operation,
				table,
				error_message: error instanceof Error ? error.message : String(error),
				error_stack: error instanceof Error ? error.stack : undefined,
				...otherContext,
			},
		});

		// Re-throw the error
		throw error;
	}
}

/**
 * Track database query performance
 */
export function trackQueryPerformance(query: string, duration: number, table: string) {
	if (duration > 1000) {
		// Log slow queries (> 1 second)
		posthog.capture({
			distinctId: "system",
			event: "slow_database_query",
			properties: {
				query,
				duration_ms: duration,
				table,
				threshold: 1000,
			},
		});
	}
}
