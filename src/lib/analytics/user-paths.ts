/**
 * User path analysis utilities for tracking navigation patterns
 * Identifies common paths, drop-off points, and feature discovery
 */

import { posthog } from "@/lib/posthog-server";

export interface UserPath {
	path: string[];
	frequency: number;
	conversionRate: number;
	avgDuration: number;
}

export interface PathNode {
	page: string;
	visits: number;
	nextPages: Record<string, number>;
	dropOffRate: number;
}

export interface PathAnalysis {
	commonPaths: UserPath[];
	dropOffPoints: Array<{ page: string; dropOffRate: number }>;
	featureDiscovery: Record<string, { discovered: number; time_to_discover: number }>;
	journeyVariations: Array<{ variation: string; count: number }>;
}

/**
 * Track page navigation for path analysis
 */
export function trackPageNavigation(
	userId: string,
	fromPage: string,
	toPage: string,
	duration: number,
) {
	posthog.capture({
		distinctId: userId,
		event: "page_navigation",
		properties: {
			from_page: fromPage,
			to_page: toPage,
			duration_ms: duration,
			timestamp: new Date().toISOString(),
		},
	});
}

/**
 * Get common user paths through the application
 */
export async function getCommonUserPaths(limit = 10): Promise<UserPath[]> {
	// Query PostHog for page navigation sequences
	const pathQuery = {
		kind: "EventsQuery",
		select: ["properties.from_page", "properties.to_page", "properties.duration_ms"],
		event: "page_navigation",
		after: "-30d",
		limit: 10000,
	};

	const events = await posthog.api.query(pathQuery);

	// Build path sequences
	const pathMap = new Map<string, { count: number; durations: number[] }>();

	// Group consecutive navigations into paths
	const userSessions = new Map<string, string[]>();

	for (const event of events.results) {
		const userId = event.distinct_id;
		const fromPage = event.properties.from_page;
		const toPage = event.properties.to_page;

		if (!userSessions.has(userId)) {
			userSessions.set(userId, []);
		}

		const session = userSessions.get(userId)!;
		if (session.length === 0 || session[session.length - 1] !== fromPage) {
			session.push(fromPage);
		}
		session.push(toPage);
	}

	// Analyze paths
	for (const [_userId, path] of userSessions) {
		const pathKey = path.slice(0, 5).join(" → "); // First 5 steps

		if (!pathMap.has(pathKey)) {
			pathMap.set(pathKey, { count: 0, durations: [] });
		}

		const pathData = pathMap.get(pathKey)!;
		pathData.count++;
	}

	// Convert to sorted array
	const commonPaths = Array.from(pathMap.entries())
		.map(([path, data]) => ({
			path: path.split(" → "),
			frequency: data.count,
			conversionRate: 0, // Calculate based on goal completion
			avgDuration: data.durations.length > 0 ? average(data.durations) : 0,
		}))
		.sort((a, b) => b.frequency - a.frequency)
		.slice(0, limit);

	posthog.capture({
		distinctId: "system",
		event: "common_paths_analyzed",
		properties: {
			paths_found: commonPaths.length,
			timestamp: new Date().toISOString(),
		},
	});

	return commonPaths;
}

/**
 * Identify drop-off points in user journeys
 */
export async function identifyDropOffPoints(): Promise<Array<{ page: string; dropOffRate: number }>> {
	// Query page views and track where users exit
	const pageViews = await posthog.api.query({
		kind: "EventsQuery",
		select: ["properties.$current_url", "distinct_id", "timestamp"],
		event: "$pageview",
		after: "-7d",
		limit: 10000,
	});

	// Build page visit and exit map
	const pageStats = new Map<
		string,
		{ visits: number; exits: number; nextPages: Set<string> }
	>();

	// Sort by user and timestamp
	const sortedEvents = pageViews.results.sort((a, b) => {
		if (a.distinct_id !== b.distinct_id) {
			return a.distinct_id.localeCompare(b.distinct_id);
		}
		return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
	});

	let lastUserId = "";
	let lastPage = "";

	for (let i = 0; i < sortedEvents.length; i++) {
		const event = sortedEvents[i];
		const userId = event.distinct_id;
		const page = event.properties.$current_url;

		// Initialize page stats
		if (!pageStats.has(page)) {
			pageStats.set(page, { visits: 0, exits: 0, nextPages: new Set() });
		}

		const stats = pageStats.get(page)!;
		stats.visits++;

		// Check if this is a new user session or continuation
		if (userId === lastUserId && lastPage) {
			// Add transition from last page to this page
			const lastStats = pageStats.get(lastPage)!;
			lastStats.nextPages.add(page);
		}

		// Check if this is the last page in the session
		const nextEvent = sortedEvents[i + 1];
		if (!nextEvent || nextEvent.distinct_id !== userId) {
			// User exited from this page
			stats.exits++;
		}

		lastUserId = userId;
		lastPage = page;
	}

	// Calculate drop-off rates
	const dropOffPoints = Array.from(pageStats.entries())
		.map(([page, stats]) => ({
			page,
			dropOffRate: stats.visits > 0 ? stats.exits / stats.visits : 0,
			visits: stats.visits,
			exits: stats.exits,
		}))
		.filter((point) => point.visits >= 10) // Minimum sample size
		.sort((a, b) => b.dropOffRate - a.dropOffRate)
		.slice(0, 10);

	posthog.capture({
		distinctId: "system",
		event: "drop_off_points_identified",
		properties: {
			critical_drop_offs: dropOffPoints.filter((p) => p.dropOffRate > 0.5).length,
			timestamp: new Date().toISOString(),
		},
	});

	return dropOffPoints;
}

/**
 * Analyze feature discovery paths
 * Tracks how users discover and adopt features
 */
export async function analyzeFeatureDiscovery(): Promise<
	Record<string, { discovered: number; time_to_discover: number }>
> {
	const features = [
		"link_created",
		"theme_customized",
		"link_reordered",
		"analytics_viewed",
		"upgrade_clicked",
	];

	const featureStats: Record<string, { discovered: number; time_to_discover: number }> = {};

	for (const feature of features) {
		// Get users who performed this action
		const featureEvents = await posthog.api.query({
			kind: "EventsQuery",
			select: ["distinct_id", "timestamp"],
			event: feature,
			after: "-30d",
			limit: 1000,
		});

		// Get registration times for these users
		const userRegistrations = await posthog.api.query({
			kind: "EventsQuery",
			select: ["distinct_id", "timestamp"],
			event: "user_registered",
			after: "-30d",
			limit: 1000,
		});

		const registrationMap = new Map<string, Date>();
		for (const event of userRegistrations.results) {
			registrationMap.set(event.distinct_id, new Date(event.timestamp));
		}

		// Calculate time to discover
		const discoveryTimes: number[] = [];

		for (const event of featureEvents.results) {
			const userId = event.distinct_id;
			const discoveryTime = new Date(event.timestamp);
			const registrationTime = registrationMap.get(userId);

			if (registrationTime) {
				const timeToDiscover = discoveryTime.getTime() - registrationTime.getTime();
				discoveryTimes.push(timeToDiscover / (1000 * 60 * 60 * 24)); // Convert to days
			}
		}

		featureStats[feature] = {
			discovered: featureEvents.results.length,
			time_to_discover: discoveryTimes.length > 0 ? average(discoveryTimes) : 0,
		};
	}

	posthog.capture({
		distinctId: "system",
		event: "feature_discovery_analyzed",
		properties: {
			features_analyzed: features.length,
			timestamp: new Date().toISOString(),
		},
	});

	return featureStats;
}

/**
 * Analyze journey variations
 * Identifies different paths users take to achieve the same goal
 */
export async function analyzeJourneyVariations(
	goal: string,
): Promise<Array<{ variation: string; count: number }>> {
	// Get all sessions that resulted in the goal
	const goalEvents = await posthog.api.query({
		kind: "EventsQuery",
		select: ["distinct_id", "timestamp"],
		event: goal,
		after: "-30d",
		limit: 1000,
	});

	// For each goal completion, get the path that led to it
	const journeyVariations = new Map<string, number>();

	for (const goalEvent of goalEvents.results) {
		const userId = goalEvent.distinct_id;
		const goalTime = new Date(goalEvent.timestamp);

		// Get page views leading up to the goal
		const leadingEvents = await posthog.api.query({
			kind: "EventsQuery",
			select: ["properties.$current_url", "timestamp"],
			event: "$pageview",
			where: [
				`distinct_id = '${userId}'`,
				`timestamp <= '${goalTime.toISOString()}'`,
				`timestamp >= '${new Date(goalTime.getTime() - 60 * 60 * 1000).toISOString()}'`, // 1 hour window
			],
			orderBy: ["timestamp ASC"],
			limit: 20,
		});

		// Build path string
		const path = leadingEvents.results.map((e) => e.properties.$current_url).join(" → ");

		journeyVariations.set(path, (journeyVariations.get(path) || 0) + 1);
	}

	// Convert to sorted array
	const variations = Array.from(journeyVariations.entries())
		.map(([variation, count]) => ({ variation, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 10);

	posthog.capture({
		distinctId: "system",
		event: "journey_variations_analyzed",
		properties: {
			goal,
			variations_found: variations.length,
			timestamp: new Date().toISOString(),
		},
	});

	return variations;
}

/**
 * Get complete path analysis
 */
export async function getPathAnalysis(): Promise<PathAnalysis> {
	const [commonPaths, dropOffPoints, featureDiscovery, upgradeJourneys] = await Promise.all([
		getCommonUserPaths(10),
		identifyDropOffPoints(),
		analyzeFeatureDiscovery(),
		analyzeJourneyVariations("upgrade_completed"),
	]);

	return {
		commonPaths,
		dropOffPoints,
		featureDiscovery,
		journeyVariations: upgradeJourneys,
	};
}

/**
 * Helper function to calculate average
 */
function average(numbers: number[]): number {
	if (numbers.length === 0) return 0;
	return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

/**
 * Track user path metrics on a schedule
 */
export async function trackUserPathMetrics() {
	try {
		const analysis = await getPathAnalysis();

		posthog.capture({
			distinctId: "system",
			event: "user_path_analysis_complete",
			properties: {
				common_paths_count: analysis.commonPaths.length,
				critical_drop_offs: analysis.dropOffPoints.filter((p) => p.dropOffRate > 0.5).length,
				features_analyzed: Object.keys(analysis.featureDiscovery).length,
				timestamp: new Date().toISOString(),
			},
		});

		console.log("User path metrics tracked:", analysis);

		return analysis;
	} catch (error) {
		console.error("Failed to track user path metrics:", error);
		throw error;
	}
}
