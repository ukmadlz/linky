import { sendErrorSpikeAlert } from "./notifications";
import { posthogServer } from "./posthog";

interface ErrorRateConfig {
	timeWindowMinutes: number;
	threshold: number;
	checkIntervalMinutes: number;
}

const DEFAULT_ERROR_RATE_CONFIG: ErrorRateConfig = {
	timeWindowMinutes: 5,
	threshold: 50,
	checkIntervalMinutes: 5,
};

/**
 * Query error count from PostHog for a given time window
 */
async function getErrorCount(timeWindowMinutes: number): Promise<number> {
	try {
		// Note: This requires PostHog API access with POSTHOG_PERSONAL_API_KEY
		const projectId = process.env.POSTHOG_PROJECT_ID;
		const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
		const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "http://localhost:8000";

		if (!projectId || !apiKey) {
			console.warn("PostHog API credentials not configured for error monitoring");
			return 0;
		}

		const now = new Date();
		const startTime = new Date(now.getTime() - timeWindowMinutes * 60 * 1000);

		// Query PostHog API for exception events
		const response = await fetch(`${host}/api/projects/${projectId}/events`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				event: "$exception",
				after: startTime.toISOString(),
				before: now.toISOString(),
			}),
		});

		if (!response.ok) {
			console.error("Failed to query PostHog API:", response.statusText);
			return 0;
		}

		const data = await response.json();
		return data.results?.length || 0;
	} catch (error) {
		console.error("Error querying PostHog for error count:", error);
		return 0;
	}
}

/**
 * Monitor error rate and send alerts if threshold is exceeded
 */
export async function monitorErrorRate(config: Partial<ErrorRateConfig> = {}): Promise<void> {
	const finalConfig = { ...DEFAULT_ERROR_RATE_CONFIG, ...config };

	try {
		const errorCount = await getErrorCount(finalConfig.timeWindowMinutes);

		if (errorCount >= finalConfig.threshold) {
			await sendErrorSpikeAlert(errorCount, finalConfig.threshold);

			// Track the alert itself
			posthogServer.capture({
				distinctId: "system",
				event: "error_spike_alert_sent",
				properties: {
					error_count: errorCount,
					threshold: finalConfig.threshold,
					time_window_minutes: finalConfig.timeWindowMinutes,
					timestamp: new Date().toISOString(),
				},
			});
		}
	} catch (error) {
		console.error("Error monitoring error rate:", error);
	}
}

/**
 * Track error patterns and trends
 */
export interface ErrorMetrics {
	totalErrors: number;
	errorsByType: Record<string, number>;
	errorsByRoute: Record<string, number>;
	affectedUsers: number;
	timestamp: string;
}

/**
 * Get error metrics for dashboard
 */
export async function getErrorMetrics(_timeWindowMinutes = 60): Promise<ErrorMetrics> {
	try {
		const projectId = process.env.POSTHOG_PROJECT_ID;
		const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
		const _host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "http://localhost:8000";

		if (!projectId || !apiKey) {
			console.warn("PostHog API credentials not configured");
			return {
				totalErrors: 0,
				errorsByType: {},
				errorsByRoute: {},
				affectedUsers: 0,
				timestamp: new Date().toISOString(),
			};
		}

		// This is a placeholder - in production, you'd query the PostHog API
		// to get aggregated error metrics
		return {
			totalErrors: 0,
			errorsByType: {},
			errorsByRoute: {},
			affectedUsers: 0,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Error getting error metrics:", error);
		return {
			totalErrors: 0,
			errorsByType: {},
			errorsByRoute: {},
			affectedUsers: 0,
			timestamp: new Date().toISOString(),
		};
	}
}

/**
 * Check for new error types
 * This should be run periodically (e.g., via a cron job)
 */
export async function detectNewErrorTypes(): Promise<void> {
	// Implementation would involve:
	// 1. Query PostHog for recent errors
	// 2. Compare against known error types (stored in DB or cache)
	// 3. Alert on new error types
	// This is a placeholder for the actual implementation
	console.log("Checking for new error types...");
}
