/**
 * Script to set up PostHog cohorts from configuration
 * Run with: tsx src/scripts/setup-posthog-cohorts.ts
 */

import fs from "node:fs";
import path from "node:path";

const POSTHOG_API_URL = process.env.NEXT_PUBLIC_POSTHOG_HOST || "http://localhost:8000";
const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY;
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID || "1";

interface Cohort {
	name: string;
	description: string;
	filters: {
		properties: {
			type: string;
			values: Array<{
				key: string;
				value?: string | string[] | null;
				operator: string;
				type: string;
				event_type?: string;
				time_value?: string;
				time_interval?: string;
				negation?: boolean;
			}>;
		};
	};
	is_static: boolean;
}

interface CohortsConfig {
	cohorts: Cohort[];
	configuration: {
		auto_refresh: boolean;
		refresh_interval: string;
		cache_results: boolean;
	};
	insights: {
		cohort_trends: {
			enabled: boolean;
			metrics: string[];
		};
		cohort_comparison: {
			enabled: boolean;
			compare_cohorts: string[][];
		};
		alerts: {
			enabled: boolean;
			thresholds: {
				churned_users_percentage: number;
				at_risk_users_count: number;
			};
		};
	};
}

async function setupCohorts() {
	if (!POSTHOG_API_KEY) {
		console.error("POSTHOG_API_KEY environment variable is required");
		process.exit(1);
	}

	// Load cohort configuration
	const configPath = path.join(process.cwd(), "docker/posthog/cohorts/user-cohorts.json");
	const config: CohortsConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

	console.log(`Setting up ${config.cohorts.length} cohorts in PostHog...`);

	for (const cohort of config.cohorts) {
		try {
			await createCohort(cohort);
			console.log(`✓ Created cohort: ${cohort.name}`);
		} catch (error) {
			console.error(`✗ Failed to create cohort: ${cohort.name}`, error);
		}
	}

	console.log("\nCohort setup complete!");
	console.log("\nNext steps:");
	console.log("1. Visit PostHog dashboard to view cohorts");
	console.log("2. Use cohorts to filter insights and funnels");
	console.log("3. Set up alerts for cohort size changes");
	console.log("4. Create cohort comparison dashboards");
}

async function createCohort(cohort: Cohort) {
	// Build PostHog cohort definition
	const cohortDefinition = {
		name: cohort.name,
		description: cohort.description,
		is_static: cohort.is_static,
		filters: {
			properties: cohort.filters.properties,
		},
	};

	// Create cohort via PostHog API
	const response = await fetch(`${POSTHOG_API_URL}/api/projects/${PROJECT_ID}/cohorts/`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${POSTHOG_API_KEY}`,
		},
		body: JSON.stringify(cohortDefinition),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to create cohort: ${error}`);
	}

	return await response.json();
}

async function getCohorts() {
	const response = await fetch(`${POSTHOG_API_URL}/api/projects/${PROJECT_ID}/cohorts/`, {
		headers: {
			Authorization: `Bearer ${POSTHOG_API_KEY}`,
		},
	});

	if (!response.ok) {
		throw new Error("Failed to fetch cohorts");
	}

	return await response.json();
}

async function deleteCohort(cohortId: string) {
	const response = await fetch(
		`${POSTHOG_API_URL}/api/projects/${PROJECT_ID}/cohorts/${cohortId}/`,
		{
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${POSTHOG_API_KEY}`,
			},
		},
	);

	if (!response.ok) {
		throw new Error(`Failed to delete cohort ${cohortId}`);
	}
}

async function cleanupCohorts() {
	console.log("Fetching existing cohorts...");
	const cohorts = await getCohorts();

	console.log(`Found ${cohorts.results.length} existing cohorts`);

	for (const cohort of cohorts.results) {
		try {
			await deleteCohort(cohort.id);
			console.log(`✓ Deleted cohort: ${cohort.name}`);
		} catch (error) {
			console.error(`✗ Failed to delete cohort: ${cohort.name}`, error);
		}
	}
}

// Run the script
if (require.main === module) {
	const args = process.argv.slice(2);

	if (args.includes("--cleanup")) {
		cleanupCohorts().catch((error) => {
			console.error("Failed to cleanup cohorts:", error);
			process.exit(1);
		});
	} else {
		setupCohorts().catch((error) => {
			console.error("Failed to set up cohorts:", error);
			process.exit(1);
		});
	}
}

export { setupCohorts, createCohort, getCohorts, deleteCohort };
