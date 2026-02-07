import { trackDatabaseError } from "./posthog-server-error-tracking";

/**
 * Wrap a database operation with error tracking
 */
export async function withDatabaseErrorTracking<T>(
	operation: () => Promise<T>,
	context: {
		operation: string;
		table?: string;
		user_id?: string;
		[key: string]: unknown;
	}
): Promise<T> {
	try {
		return await operation();
	} catch (error) {
		// Track the database error
		await trackDatabaseError(error, context);

		// Re-throw the error so it can be handled by the caller
		throw error;
	}
}

/**
 * Parse Postgres error codes to human-readable messages
 */
export function parsePostgresError(error: unknown): {
	message: string;
	code?: string;
	constraint?: string;
} {
	if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
		const pgError = error as {
			code: string;
			message?: string;
			constraint?: string;
			detail?: string;
		};

		// Common Postgres error codes
		switch (pgError.code) {
			case "23505": // unique_violation
				return {
					message: "A record with this value already exists",
					code: pgError.code,
					constraint: pgError.constraint,
				};
			case "23503": // foreign_key_violation
				return {
					message: "Referenced record does not exist",
					code: pgError.code,
					constraint: pgError.constraint,
				};
			case "23502": // not_null_violation
				return {
					message: "Required field is missing",
					code: pgError.code,
					constraint: pgError.constraint,
				};
			case "23514": // check_violation
				return {
					message: "Value does not meet constraints",
					code: pgError.code,
					constraint: pgError.constraint,
				};
			case "42P01": // undefined_table
				return {
					message: "Database table not found",
					code: pgError.code,
				};
			case "42703": // undefined_column
				return {
					message: "Database column not found",
					code: pgError.code,
				};
			case "57014": // query_canceled
				return {
					message: "Database query was canceled",
					code: pgError.code,
				};
			case "53300": // too_many_connections
				return {
					message: "Too many database connections",
					code: pgError.code,
				};
			default:
				return {
					message: pgError.message || "Database operation failed",
					code: pgError.code,
				};
		}
	}

	if (error instanceof Error) {
		return {
			message: error.message,
		};
	}

	return {
		message: "An unexpected database error occurred",
	};
}

/**
 * Check if an error is a database constraint violation
 */
export function isDatabaseConstraintError(error: unknown): boolean {
	if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
		const code = error.code;
		return ["23505", "23503", "23502", "23514"].includes(code);
	}
	return false;
}

/**
 * Check if an error is a connection error
 */
export function isDatabaseConnectionError(error: unknown): boolean {
	if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
		const code = error.code;
		return ["53300", "57P03", "08000", "08003", "08006"].includes(code);
	}
	return false;
}
