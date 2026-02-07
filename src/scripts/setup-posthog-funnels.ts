/**
 * Script to set up PostHog funnels from configuration
 * Run with: tsx src/scripts/setup-posthog-funnels.ts
 */

import fs from "node:fs";
import path from "node:path";

const POSTHOG_API_URL = process.env.NEXT_PUBLIC_POSTHOG_HOST || "http://localhost:8000";
const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY;
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID || "1";

interface FunnelStep {
	event: string;
	filters?: {
		properties?: Array<{
			key: string;
			value: string | string[];
			type: string;
			operator?: string;
		}>;
	};
	name: string;
}

interface Funnel {
	name: string;
	description: string;
	type: string;
	steps: FunnelStep[];
	window: string;
	exclusions: unknown[];
	breakdown: string[];
}

interface FunnelsConfig {
	funnels: Funnel[];
	configuration: {
		default_window: string;
		conversion_window_type: string;
		exclusion_type: string;
		breakdown_limit: number;
		min_sample_size: number;
		confidence_level: number;
	};
	insights: {
		drop_off_alerts: {
			enabled: boolean;
			threshold: number;
			notification_channels: string[];
		};
		conversion_rate_tracking: {
			enabled: boolean;
			baseline_period: string;
			comparison_period: string;
		};
		cohort_comparison: {
			enabled: boolean;
			cohorts: string[];
		};
	};
}

async function setupFunnels() {
	if (!POSTHOG_API_KEY) {
		console.error("POSTHOG_API_KEY environment variable is required");
		process.exit(1);
	}

	// Load funnel configuration
	const configPath = path.join(process.cwd(), "docker/posthog/funnels/user-journeys.json");
	const config: FunnelsConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

	console.log(`Setting up ${config.funnels.length} funnels in PostHog...`);

	for (const funnel of config.funnels) {
		try {
			await createFunnel(funnel, config.configuration);
			console.log(`✓ Created funnel: ${funnel.name}`);
		} catch (error) {
			console.error(`✗ Failed to create funnel: ${funnel.name}`, error);
		}
	}

	console.log("\nFunnel setup complete!");
	console.log("\nNext steps:");
	console.log("1. Visit PostHog dashboard to view funnels");
	console.log("2. Set up alerts for conversion rate changes");
	console.log("3. Configure cohort breakdowns for deeper analysis");
}

async function createFunnel(funnel: Funnel, configuration: FunnelsConfig["configuration"]) {
	// Convert window string to hours
	const windowHours = parseWindowToHours(funnel.window);

	// Build PostHog funnel query
	const funnelQuery = {
		insight: "FUNNELS",
		name: funnel.name,
		description: funnel.description,
		filters: {
			insight: "FUNNELS",
			events: funnel.steps.map((step, index) => ({
				id: step.event,
				name: step.name,
				type: "events",
				order: index,
				properties: step.filters?.properties || [],
			})),
			funnel_window_interval: windowHours,
			funnel_window_interval_unit: "hour",
			breakdown: funnel.breakdown.length > 0 ? funnel.breakdown[0] : undefined,
			breakdown_type: funnel.breakdown.length > 0 ? "event" : undefined,
			exclusions: funnel.exclusions,
		},
	};

	// Create insight via PostHog API
	const response = await fetch(`${POSTHOG_API_URL}/api/projects/${PROJECT_ID}/insights/`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${POSTHOG_API_KEY}`,
		},
		body: JSON.stringify(funnelQuery),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to create funnel: ${error}`);
	}

	return await response.json();
}

function parseWindowToHours(window: string): number {
	const match = window.match(/^(\d+)\s*(hour|day|week|month)s?$/);
	if (!match) {
		return 24 * 30; // Default to 30 days
	}

	const [, value, unit] = match;
	const hours = {
		hour: 1,
		day: 24,
		week: 24 * 7,
		month: 24 * 30,
	};

	return Number(value) * (hours[unit as keyof typeof hours] || 24);
}

// Run the script
if (require.main === module) {
	setupFunnels().catch((error) => {
		console.error("Failed to set up funnels:", error);
		process.exit(1);
	});
}

export { setupFunnels, createFunnel };
