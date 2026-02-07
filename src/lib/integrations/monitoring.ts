/**
 * Integration utilities for connecting PostHog to monitoring tools
 * Supports Grafana, Prometheus, and data export
 */

import { posthog } from "@/lib/posthog-server";

export interface MonitoringIntegration {
	name: string;
	enabled: boolean;
	config: Record<string, unknown>;
}

/**
 * Export PostHog data to Prometheus format
 * Exposes metrics at /api/metrics for Prometheus scraping
 */
export async function exportPrometheusMetrics(): Promise<string> {
	const metrics: string[] = [];

	// Get key metrics from PostHog
	const [dau, wau, mau, errorRate] = await Promise.all([
		getMetricValue("dau"),
		getMetricValue("wau"),
		getMetricValue("mau"),
		getMetricValue("error_rate"),
	]);

	// Format as Prometheus metrics
	metrics.push("# HELP linky_daily_active_users Number of daily active users");
	metrics.push("# TYPE linky_daily_active_users gauge");
	metrics.push(`linky_daily_active_users ${dau}`);
	metrics.push("");

	metrics.push("# HELP linky_weekly_active_users Number of weekly active users");
	metrics.push("# TYPE linky_weekly_active_users gauge");
	metrics.push(`linky_weekly_active_users ${wau}`);
	metrics.push("");

	metrics.push("# HELP linky_monthly_active_users Number of monthly active users");
	metrics.push("# TYPE linky_monthly_active_users gauge");
	metrics.push(`linky_monthly_active_users ${mau}`);
	metrics.push("");

	metrics.push("# HELP linky_error_rate Application error rate");
	metrics.push("# TYPE linky_error_rate gauge");
	metrics.push(`linky_error_rate ${errorRate}`);
	metrics.push("");

	// Add Core Web Vitals metrics
	const webVitals = await getCoreWebVitals();
	metrics.push("# HELP linky_lcp_p75 Largest Contentful Paint 75th percentile (ms)");
	metrics.push("# TYPE linky_lcp_p75 gauge");
	metrics.push(`linky_lcp_p75 ${webVitals.lcp_p75}`);
	metrics.push("");

	metrics.push("# HELP linky_fid_p75 First Input Delay 75th percentile (ms)");
	metrics.push("# TYPE linky_fid_p75 gauge");
	metrics.push(`linky_fid_p75 ${webVitals.fid_p75}`);
	metrics.push("");

	metrics.push("# HELP linky_cls_p75 Cumulative Layout Shift 75th percentile");
	metrics.push("# TYPE linky_cls_p75 gauge");
	metrics.push(`linky_cls_p75 ${webVitals.cls_p75}`);
	metrics.push("");

	// Add business metrics
	const businessMetrics = await getBusinessMetrics();
	metrics.push("# HELP linky_new_signups_24h New user signups in last 24 hours");
	metrics.push("# TYPE linky_new_signups_24h counter");
	metrics.push(`linky_new_signups_24h ${businessMetrics.signups_24h}`);
	metrics.push("");

	metrics.push("# HELP linky_pro_conversions_24h Pro upgrades in last 24 hours");
	metrics.push("# TYPE linky_pro_conversions_24h counter");
	metrics.push(`linky_pro_conversions_24h ${businessMetrics.conversions_24h}`);
	metrics.push("");

	metrics.push("# HELP linky_links_created_24h Links created in last 24 hours");
	metrics.push("# TYPE linky_links_created_24h counter");
	metrics.push(`linky_links_created_24h ${businessMetrics.links_created_24h}`);
	metrics.push("");

	return metrics.join("\n");
}

/**
 * Get a single metric value from PostHog
 */
async function getMetricValue(metricName: string): Promise<number> {
	try {
		const events = await posthog.api.query({
			kind: "EventsQuery",
			select: ["properties.metric_value"],
			event: "metric_calculated",
			where: [`properties.metric_name = '${metricName}'`],
			after: "-1h",
			limit: 1,
			orderBy: ["timestamp DESC"],
		});

		if (events.results.length > 0) {
			return events.results[0].properties.metric_value || 0;
		}

		return 0;
	} catch {
		return 0;
	}
}

/**
 * Get Core Web Vitals from PostHog
 */
async function getCoreWebVitals(): Promise<{
	lcp_p75: number;
	fid_p75: number;
	cls_p75: number;
}> {
	try {
		const vitals = await posthog.api.query({
			kind: "EventsQuery",
			select: ["properties.lcp", "properties.fid", "properties.cls"],
			event: "web_vitals",
			after: "-1h",
			limit: 1000,
		});

		const lcpValues = vitals.results
			.map((e) => e.properties.lcp)
			.filter((v) => v)
			.sort((a, b) => a - b);
		const fidValues = vitals.results
			.map((e) => e.properties.fid)
			.filter((v) => v)
			.sort((a, b) => a - b);
		const clsValues = vitals.results
			.map((e) => e.properties.cls)
			.filter((v) => v)
			.sort((a, b) => a - b);

		return {
			lcp_p75: percentile(lcpValues, 0.75),
			fid_p75: percentile(fidValues, 0.75),
			cls_p75: percentile(clsValues, 0.75),
		};
	} catch {
		return { lcp_p75: 0, fid_p75: 0, cls_p75: 0 };
	}
}

/**
 * Get business metrics
 */
async function getBusinessMetrics(): Promise<{
	signups_24h: number;
	conversions_24h: number;
	links_created_24h: number;
}> {
	try {
		const [signups, conversions, links] = await Promise.all([
			posthog.api.query({
				kind: "EventsQuery",
				select: ["distinct_id"],
				event: "user_registered",
				after: "-24h",
				limit: 10000,
			}),
			posthog.api.query({
				kind: "EventsQuery",
				select: ["distinct_id"],
				event: "upgrade_completed",
				after: "-24h",
				limit: 10000,
			}),
			posthog.api.query({
				kind: "EventsQuery",
				select: ["distinct_id"],
				event: "link_created",
				after: "-24h",
				limit: 10000,
			}),
		]);

		return {
			signups_24h: signups.results.length,
			conversions_24h: conversions.results.length,
			links_created_24h: links.results.length,
		};
	} catch {
		return { signups_24h: 0, conversions_24h: 0, links_created_24h: 0 };
	}
}

/**
 * Calculate percentile from sorted array
 */
function percentile(values: number[], p: number): number {
	if (values.length === 0) return 0;
	const index = Math.ceil(values.length * p) - 1;
	return values[Math.max(0, Math.min(index, values.length - 1))];
}

/**
 * Create Grafana dashboard programmatically
 */
export async function createGrafanaDashboard(dashboardConfig: {
	title: string;
	panels: unknown[];
}): Promise<void> {
	const grafanaUrl = process.env.GRAFANA_URL || "http://localhost:3001";
	const grafanaApiKey = process.env.GRAFANA_API_KEY;

	if (!grafanaApiKey) {
		throw new Error("GRAFANA_API_KEY not configured");
	}

	const response = await fetch(`${grafanaUrl}/api/dashboards/db`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${grafanaApiKey}`,
		},
		body: JSON.stringify({
			dashboard: dashboardConfig,
			overwrite: false,
		}),
	});

	if (!response.ok) {
		throw new Error(`Failed to create Grafana dashboard: ${await response.text()}`);
	}
}

/**
 * Export PostHog data to S3 for long-term storage
 */
export async function exportToS3(
	bucketName: string,
	prefix: string
): Promise<{ exported: number; bytes: number }> {
	// This would require AWS SDK and proper configuration
	// Placeholder for implementation

	console.log(`Exporting PostHog data to s3://${bucketName}/${prefix}`);

	// Get events from PostHog
	const events = await posthog.api.query({
		kind: "EventsQuery",
		select: ["*"],
		after: "-7d",
		limit: 100000,
	});

	// In a real implementation:
	// 1. Batch events into files
	// 2. Compress as JSON.gz
	// 3. Upload to S3 with date-based partitioning
	// 4. Track export metadata

	return {
		exported: events.results.length,
		bytes: JSON.stringify(events.results).length,
	};
}

/**
 * Configure webhook for PostHog alerts to Slack
 */
export async function setupSlackWebhook(webhookUrl: string): Promise<void> {
	// Store webhook configuration
	await posthog.api.createWebhook({
		name: "Slack Error Alerts",
		target_url: webhookUrl,
		event_types: ["error_captured"],
		enabled: true,
	});

	console.log("Slack webhook configured for error alerts");
}

/**
 * Create alert rule in PostHog
 */
export async function createAlert(alert: {
	name: string;
	event: string;
	threshold: number;
	window: string;
	channels: string[];
}): Promise<void> {
	// Create alert via PostHog API
	await posthog.api.createAlert({
		name: alert.name,
		insight: {
			kind: "TrendsQuery",
			series: [{ event: alert.event }],
			dateRange: { date_from: `-${alert.window}` },
		},
		threshold: {
			type: "absolute",
			value: alert.threshold,
		},
		subscriptions: alert.channels.map((channel) => ({
			channel,
			frequency: "immediate",
		})),
	});

	console.log(`Alert created: ${alert.name}`);
}

/**
 * Get monitoring integration status
 */
export async function getIntegrationStatus(): Promise<MonitoringIntegration[]> {
	return [
		{
			name: "Grafana",
			enabled: !!process.env.GRAFANA_URL,
			config: {
				url: process.env.GRAFANA_URL,
				hasApiKey: !!process.env.GRAFANA_API_KEY,
			},
		},
		{
			name: "Prometheus",
			enabled: true,
			config: {
				endpoint: "/api/metrics",
				scrapeInterval: "30s",
			},
		},
		{
			name: "S3 Export",
			enabled: !!process.env.AWS_S3_BUCKET,
			config: {
				bucket: process.env.AWS_S3_BUCKET,
				region: process.env.AWS_REGION,
			},
		},
		{
			name: "Slack Alerts",
			enabled: !!process.env.SLACK_WEBHOOK_URL,
			config: {
				webhookConfigured: !!process.env.SLACK_WEBHOOK_URL,
			},
		},
	];
}
