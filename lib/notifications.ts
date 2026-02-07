/**
 * Notification utilities for sending alerts via Slack, email, etc.
 */

interface NotificationPayload {
	title: string;
	message: string;
	severity: "info" | "warning" | "error" | "critical";
	context?: Record<string, unknown>;
}

/**
 * Send a Slack notification
 */
export async function sendSlackNotification(payload: NotificationPayload): Promise<void> {
	const webhookUrl = process.env.SLACK_WEBHOOK_URL;

	if (!webhookUrl) {
		console.warn("SLACK_WEBHOOK_URL not configured, skipping Slack notification");
		return;
	}

	const color =
		payload.severity === "critical"
			? "#FF0000"
			: payload.severity === "error"
				? "#FF6B6B"
				: payload.severity === "warning"
					? "#FFA500"
					: "#36A64F";

	const slackPayload = {
		attachments: [
			{
				color,
				title: payload.title,
				text: payload.message,
				fields: payload.context
					? Object.entries(payload.context).map(([key, value]) => ({
							title: key,
							value: String(value),
							short: true,
						}))
					: [],
				footer: "Linky Error Monitoring",
				ts: Math.floor(Date.now() / 1000),
			},
		],
	};

	try {
		const response = await fetch(webhookUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(slackPayload),
		});

		if (!response.ok) {
			console.error("Failed to send Slack notification:", response.statusText);
		}
	} catch (error) {
		console.error("Error sending Slack notification:", error);
	}
}

/**
 * Send an email notification
 * Note: This is a placeholder. Integrate with your email service (SendGrid, AWS SES, etc.)
 */
export async function sendEmailNotification(payload: NotificationPayload): Promise<void> {
	const emailConfig = {
		from: process.env.ALERT_EMAIL_FROM || "alerts@linky.app",
		to: process.env.ALERT_EMAIL_TO || "admin@linky.app",
		enabled: process.env.EMAIL_ALERTS_ENABLED === "true",
	};

	if (!emailConfig.enabled) {
		console.warn("Email alerts not enabled, skipping email notification");
		return;
	}

	// TODO: Integrate with email service (SendGrid, AWS SES, etc.)
	console.log("Email notification:", {
		from: emailConfig.from,
		to: emailConfig.to,
		subject: `[${payload.severity.toUpperCase()}] ${payload.title}`,
		body: payload.message,
		context: payload.context,
	});
}

/**
 * Send notifications via all configured channels
 */
export async function sendNotification(payload: NotificationPayload): Promise<void> {
	const promises: Promise<void>[] = [];

	// Send to Slack if configured
	if (process.env.SLACK_WEBHOOK_URL) {
		promises.push(sendSlackNotification(payload));
	}

	// Send email if configured
	if (process.env.EMAIL_ALERTS_ENABLED === "true") {
		promises.push(sendEmailNotification(payload));
	}

	await Promise.allSettled(promises);
}

/**
 * Send error spike alert
 */
export async function sendErrorSpikeAlert(errorCount: number, threshold: number): Promise<void> {
	await sendNotification({
		title: "Error Spike Detected",
		message: `Error rate has exceeded threshold. Current: ${errorCount}, Threshold: ${threshold}`,
		severity: "critical",
		context: {
			error_count: errorCount,
			threshold,
			time: new Date().toISOString(),
		},
	});
}

/**
 * Send new error type alert
 */
export async function sendNewErrorAlert(errorType: string, errorMessage: string): Promise<void> {
	await sendNotification({
		title: "New Error Type Detected",
		message: `A new type of error has been detected: ${errorType}`,
		severity: "warning",
		context: {
			error_type: errorType,
			error_message: errorMessage,
			time: new Date().toISOString(),
		},
	});
}

/**
 * Send critical error alert
 */
export async function sendCriticalErrorAlert(
	error: string,
	context: Record<string, unknown>
): Promise<void> {
	await sendNotification({
		title: "Critical Error Occurred",
		message: error,
		severity: "critical",
		context: {
			...context,
			time: new Date().toISOString(),
		},
	});
}
