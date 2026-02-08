/**
 * A/B testing infrastructure using PostHog feature flags
 * Supports experiment setup, variant assignment, and statistical analysis
 */

import { posthog } from "@/lib/posthog-server";
import type {
	PostHogConversionEvent,
	PostHogFeatureFlagEvent,
	PostHogQueryResult,
} from "@/lib/types/posthog";

export interface Experiment {
	key: string;
	name: string;
	description: string;
	variants: Variant[];
	metrics: ExperimentMetric[];
	status: "draft" | "running" | "completed" | "stopped";
	startDate?: Date;
	endDate?: Date;
	targetSampleSize: number;
	confidenceLevel: number;
}

export interface Variant {
	key: string;
	name: string;
	rolloutPercentage: number;
	description?: string;
}

export interface ExperimentMetric {
	name: string;
	event: string;
	type: "conversion" | "numeric" | "duration";
	goal?: "increase" | "decrease";
}

export interface ExperimentResults {
	experimentKey: string;
	variants: VariantResult[];
	winner?: string;
	confidence: number;
	sampleSize: number;
	status: "insufficient_data" | "no_significant_difference" | "significant_difference";
}

export interface VariantResult {
	variantKey: string;
	exposures: number;
	conversions: number;
	conversionRate: number;
	averageValue?: number;
	confidence_interval: [number, number];
}

/**
 * Create a new A/B test experiment
 */
export async function createExperiment(experiment: Experiment): Promise<void> {
	// TODO: Implement PostHog API calls when deployed
	// Create feature flag in PostHog via HTTP API
	// await fetch(`${posthogHost}/api/feature_flags`, {...});

	// Track experiment creation
	posthog.capture({
		distinctId: "system",
		event: "experiment_created",
		properties: {
			experiment_key: experiment.key,
			experiment_name: experiment.name,
			variants: experiment.variants.map((v) => v.key),
			metrics: experiment.metrics.map((m) => m.name),
			target_sample_size: experiment.targetSampleSize,
			timestamp: new Date().toISOString(),
		},
	});
}

/**
 * Get variant assignment for a user
 */
export async function getVariant(experimentKey: string, userId: string): Promise<string> {
	const variant = await posthog.getFeatureFlag(experimentKey, userId);

	// Track exposure
	posthog.capture({
		distinctId: userId,
		event: "$feature_flag_called",
		properties: {
			$feature_flag: experimentKey,
			$feature_flag_response: variant,
			timestamp: new Date().toISOString(),
		},
	});

	return variant as string;
}

/**
 * Track experiment conversion
 */
export function trackConversion(
	experimentKey: string,
	userId: string,
	variant: string,
	metricName: string,
	value?: number
) {
	posthog.capture({
		distinctId: userId,
		event: "experiment_conversion",
		properties: {
			experiment_key: experimentKey,
			variant,
			metric_name: metricName,
			metric_value: value,
			timestamp: new Date().toISOString(),
		},
	});
}

/**
 * Calculate experiment results and statistical significance
 */
export async function calculateExperimentResults(
	experimentKey: string
): Promise<ExperimentResults> {
	// TODO: Implement PostHog API queries when deployed
	// For now, return mock data
	const exposures: PostHogQueryResult = { results: [] };
	const conversions: PostHogQueryResult = { results: [] };

	// Group by variant
	const variantStats = new Map<
		string,
		{ exposures: Set<string>; conversions: number; values: number[] }
	>();

	// Count exposures
	for (const exposure of exposures.results) {
		const variant = (exposure as PostHogFeatureFlagEvent).properties.$feature_flag_response;
		if (!variantStats.has(variant)) {
			variantStats.set(variant, { exposures: new Set(), conversions: 0, values: [] });
		}
		variantStats.get(variant)?.exposures.add(exposure.distinct_id);
	}

	// Count conversions
	for (const conversion of conversions.results) {
		const conversionEvent = conversion as PostHogConversionEvent;
		const variant = conversionEvent.properties.variant;
		const value = conversionEvent.properties.metric_value;

		if (variantStats.has(variant)) {
			const stats = variantStats.get(variant)!;
			stats.conversions++;
			if (value !== undefined) {
				stats.values.push(value);
			}
		}
	}

	// Calculate results for each variant
	const variantResults: VariantResult[] = [];

	for (const [variantKey, stats] of variantStats) {
		const exposureCount = stats.exposures.size;
		const conversionRate = exposureCount > 0 ? stats.conversions / exposureCount : 0;
		const averageValue = stats.values.length > 0 ? average(stats.values) : undefined;

		// Calculate confidence interval (95% by default)
		const ci = calculateConfidenceInterval(stats.conversions, exposureCount, 0.95);

		variantResults.push({
			variantKey,
			exposures: exposureCount,
			conversions: stats.conversions,
			conversionRate,
			averageValue,
			confidence_interval: ci,
		});
	}

	// Determine winner and statistical significance
	const { winner, confidence, status } = determineWinner(variantResults);

	const results: ExperimentResults = {
		experimentKey,
		variants: variantResults,
		winner,
		confidence,
		sampleSize: exposures.results.length,
		status,
	};

	// Track results calculation
	posthog.capture({
		distinctId: "system",
		event: "experiment_results_calculated",
		properties: {
			experiment_key: experimentKey,
			sample_size: results.sampleSize,
			status: results.status,
			winner: results.winner,
			confidence: results.confidence,
			timestamp: new Date().toISOString(),
		},
	});

	return results;
}

/**
 * Calculate confidence interval for conversion rate
 */
function calculateConfidenceInterval(
	conversions: number,
	trials: number,
	confidenceLevel: number
): [number, number] {
	if (trials === 0) return [0, 0];

	const p = conversions / trials;
	const z = getZScore(confidenceLevel);
	const standardError = Math.sqrt((p * (1 - p)) / trials);
	const margin = z * standardError;

	return [Math.max(0, p - margin), Math.min(1, p + margin)];
}

/**
 * Get z-score for confidence level
 */
function getZScore(confidenceLevel: number): number {
	const zScores: Record<number, number> = {
		0.9: 1.645,
		0.95: 1.96,
		0.99: 2.576,
	};

	return zScores[confidenceLevel] || 1.96;
}

/**
 * Determine experiment winner using two-sample z-test
 */
function determineWinner(variants: VariantResult[]): {
	winner?: string;
	confidence: number;
	status: "insufficient_data" | "no_significant_difference" | "significant_difference";
} {
	if (variants.length < 2) {
		return { confidence: 0, status: "insufficient_data" };
	}

	// Sort by conversion rate
	const sorted = [...variants].sort((a, b) => b.conversionRate - a.conversionRate);
	const best = sorted[0];
	const second = sorted[1];

	// Check minimum sample size (at least 100 per variant)
	if (best.exposures < 100 || second.exposures < 100) {
		return { confidence: 0, status: "insufficient_data" };
	}

	// Calculate z-score between top two variants
	const p1 = best.conversionRate;
	const n1 = best.exposures;
	const p2 = second.conversionRate;
	const n2 = second.exposures;

	const pooledProportion = (best.conversions + second.conversions) / (n1 + n2);
	const standardError = Math.sqrt(pooledProportion * (1 - pooledProportion) * (1 / n1 + 1 / n2));

	const zScore = (p1 - p2) / standardError;
	const pValue = 2 * (1 - normalCDF(Math.abs(zScore))); // Two-tailed test

	// Convert p-value to confidence
	const confidence = 1 - pValue;

	if (confidence >= 0.95) {
		return {
			winner: best.variantKey,
			confidence,
			status: "significant_difference",
		};
	}

	return { confidence, status: "no_significant_difference" };
}

/**
 * Normal cumulative distribution function
 */
function normalCDF(x: number): number {
	const t = 1 / (1 + 0.2316419 * Math.abs(x));
	const d = 0.3989423 * Math.exp((-x * x) / 2);
	const probability =
		d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

	return x > 0 ? 1 - probability : probability;
}

/**
 * Stop an experiment
 */
export async function stopExperiment(experimentKey: string): Promise<void> {
	// TODO: Implement PostHog API call to deactivate feature flag
	// Deactivate feature flag
	// await fetch(`${posthogHost}/api/feature_flags/${experimentKey}`, {...});

	posthog.capture({
		distinctId: "system",
		event: "experiment_stopped",
		properties: {
			experiment_key: experimentKey,
			timestamp: new Date().toISOString(),
		},
	});
}

/**
 * Roll out winning variant to 100%
 */
export async function rolloutWinner(experimentKey: string, winnerKey: string): Promise<void> {
	// TODO: Implement PostHog API call to update feature flag
	// Update feature flag to return winner for all users
	// await fetch(`${posthogHost}/api/feature_flags/${experimentKey}`, {...});

	posthog.capture({
		distinctId: "system",
		event: "experiment_winner_rolled_out",
		properties: {
			experiment_key: experimentKey,
			winner_variant: winnerKey,
			timestamp: new Date().toISOString(),
		},
	});
}

/**
 * Helper function to calculate average
 */
function average(numbers: number[]): number {
	if (numbers.length === 0) return 0;
	return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

/**
 * Pre-configured experiments
 */
export const experiments: Record<string, Experiment> = {
	pricing_page_cta: {
		key: "pricing_page_cta",
		name: "Pricing Page CTA Test",
		description: "Test different CTA button text on pricing page",
		variants: [
			{ key: "control", name: "Upgrade to Pro", rolloutPercentage: 50 },
			{ key: "variant_a", name: "Start Free Trial", rolloutPercentage: 50 },
		],
		metrics: [
			{
				name: "checkout_started",
				event: "checkout_started",
				type: "conversion",
				goal: "increase",
			},
		],
		status: "draft",
		targetSampleSize: 1000,
		confidenceLevel: 0.95,
	},
	onboarding_flow: {
		key: "onboarding_flow",
		name: "Onboarding Flow Test",
		description: "Test single-step vs multi-step onboarding",
		variants: [
			{ key: "control", name: "Single Step", rolloutPercentage: 50 },
			{ key: "variant_a", name: "Multi Step", rolloutPercentage: 50 },
		],
		metrics: [
			{
				name: "onboarding_completed",
				event: "onboarding_completed",
				type: "conversion",
				goal: "increase",
			},
			{
				name: "first_link_created",
				event: "link_created",
				type: "conversion",
				goal: "increase",
			},
		],
		status: "draft",
		targetSampleSize: 500,
		confidenceLevel: 0.95,
	},
	dashboard_layout: {
		key: "dashboard_layout",
		name: "Dashboard Layout Test",
		description: "Test grid vs list layout for links",
		variants: [
			{ key: "control", name: "List Layout", rolloutPercentage: 50 },
			{ key: "variant_a", name: "Grid Layout", rolloutPercentage: 50 },
		],
		metrics: [
			{
				name: "links_reordered",
				event: "link_reordered",
				type: "conversion",
				goal: "increase",
			},
			{
				name: "session_duration",
				event: "$pageleave",
				type: "duration",
				goal: "increase",
			},
		],
		status: "draft",
		targetSampleSize: 800,
		confidenceLevel: 0.95,
	},
};
