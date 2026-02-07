/**
 * Retention analysis utilities for tracking user engagement over time
 * Tracks WAU, MAU, retention curves, and stickiness metrics
 */

import { posthog } from "@/lib/posthog-server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sql, gte, lte, eq } from "drizzle-orm";

export interface RetentionMetrics {
	wau: number; // Weekly Active Users
	mau: number; // Monthly Active Users
	dau: number; // Daily Active Users
	stickiness: number; // WAU/MAU ratio
	retentionCurve: RetentionCurveData;
}

export interface RetentionCurveData {
	day1: number;
	day7: number;
	day30: number;
	day90: number;
}

export interface CohortRetention {
	cohortDate: string;
	cohortSize: number;
	day0: number;
	day1: number;
	day7: number;
	day14: number;
	day30: number;
	day60: number;
	day90: number;
}

/**
 * Calculate Weekly Active Users (WAU)
 */
export async function calculateWAU(): Promise<number> {
	const sevenDaysAgo = new Date();
	sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

	// Track via PostHog
	const wau = await posthog.api.getActiveUsers({
		date_from: sevenDaysAgo.toISOString(),
		date_to: new Date().toISOString(),
		interval: "week",
	});

	// Track metric in PostHog
	posthog.capture({
		distinctId: "system",
		event: "metric_calculated",
		properties: {
			metric_name: "wau",
			metric_value: wau,
			timestamp: new Date().toISOString(),
		},
	});

	return wau;
}

/**
 * Calculate Monthly Active Users (MAU)
 */
export async function calculateMAU(): Promise<number> {
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

	const mau = await posthog.api.getActiveUsers({
		date_from: thirtyDaysAgo.toISOString(),
		date_to: new Date().toISOString(),
		interval: "month",
	});

	posthog.capture({
		distinctId: "system",
		event: "metric_calculated",
		properties: {
			metric_name: "mau",
			metric_value: mau,
			timestamp: new Date().toISOString(),
		},
	});

	return mau;
}

/**
 * Calculate Daily Active Users (DAU)
 */
export async function calculateDAU(): Promise<number> {
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);

	const dau = await posthog.api.getActiveUsers({
		date_from: yesterday.toISOString(),
		date_to: new Date().toISOString(),
		interval: "day",
	});

	posthog.capture({
		distinctId: "system",
		event: "metric_calculated",
		properties: {
			metric_name: "dau",
			metric_value: dau,
			timestamp: new Date().toISOString(),
		},
	});

	return dau;
}

/**
 * Calculate stickiness ratio (WAU/MAU)
 * Higher ratio indicates users are visiting more frequently
 * Target: > 0.2 (users visit 1-2x per week on average)
 */
export async function calculateStickiness(): Promise<number> {
	const wau = await calculateWAU();
	const mau = await calculateMAU();

	const stickiness = mau > 0 ? wau / mau : 0;

	posthog.capture({
		distinctId: "system",
		event: "metric_calculated",
		properties: {
			metric_name: "stickiness",
			metric_value: stickiness,
			wau,
			mau,
			timestamp: new Date().toISOString(),
		},
	});

	return stickiness;
}

/**
 * Calculate retention curve for all users
 * Shows percentage of users who return after N days
 */
export async function calculateRetentionCurve(): Promise<RetentionCurveData> {
	// Get users who registered in the last 90 days
	const ninetyDaysAgo = new Date();
	ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

	const registeredUsers = await db
		.select({ id: users.id, createdAt: users.createdAt })
		.from(users)
		.where(gte(users.createdAt, ninetyDaysAgo));

	// Calculate retention for each timeframe
	const retentionMetrics = {
		day1: 0,
		day7: 0,
		day30: 0,
		day90: 0,
	};

	const totalUsers = registeredUsers.length;

	for (const user of registeredUsers) {
		const daysSinceRegistration = Math.floor(
			(Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24),
		);

		// Check if user was active on each retention day
		if (daysSinceRegistration >= 1) {
			const day1Active = await checkUserActiveOnDay(user.id, user.createdAt, 1);
			if (day1Active) retentionMetrics.day1++;
		}

		if (daysSinceRegistration >= 7) {
			const day7Active = await checkUserActiveOnDay(user.id, user.createdAt, 7);
			if (day7Active) retentionMetrics.day7++;
		}

		if (daysSinceRegistration >= 30) {
			const day30Active = await checkUserActiveOnDay(user.id, user.createdAt, 30);
			if (day30Active) retentionMetrics.day30++;
		}

		if (daysSinceRegistration >= 90) {
			const day90Active = await checkUserActiveOnDay(user.id, user.createdAt, 90);
			if (day90Active) retentionMetrics.day90++;
		}
	}

	// Convert to percentages
	const retentionCurve = {
		day1: totalUsers > 0 ? retentionMetrics.day1 / totalUsers : 0,
		day7: totalUsers > 0 ? retentionMetrics.day7 / totalUsers : 0,
		day30: totalUsers > 0 ? retentionMetrics.day30 / totalUsers : 0,
		day90: totalUsers > 0 ? retentionMetrics.day90 / totalUsers : 0,
	};

	posthog.capture({
		distinctId: "system",
		event: "retention_curve_calculated",
		properties: {
			...retentionCurve,
			total_users: totalUsers,
			timestamp: new Date().toISOString(),
		},
	});

	return retentionCurve;
}

/**
 * Check if user was active on a specific day after registration
 */
async function checkUserActiveOnDay(
	userId: string,
	registrationDate: Date,
	dayOffset: number,
): Promise<boolean> {
	const targetDate = new Date(registrationDate);
	targetDate.setDate(targetDate.getDate() + dayOffset);

	const startOfDay = new Date(targetDate);
	startOfDay.setHours(0, 0, 0, 0);

	const endOfDay = new Date(targetDate);
	endOfDay.setHours(23, 59, 59, 999);

	// Check PostHog for any activity on that day
	const events = await posthog.api.getEvents({
		distinct_id: userId,
		after: startOfDay.toISOString(),
		before: endOfDay.toISOString(),
	});

	return events.length > 0;
}

/**
 * Calculate cohort retention analysis
 * Groups users by registration week/month and tracks retention
 */
export async function calculateCohortRetention(
	cohortType: "weekly" | "monthly" = "weekly",
): Promise<CohortRetention[]> {
	const cohorts: CohortRetention[] = [];

	// Get cohort periods for the last 12 weeks/months
	const periodsToAnalyze = cohortType === "weekly" ? 12 : 6;
	const periodDays = cohortType === "weekly" ? 7 : 30;

	for (let i = 0; i < periodsToAnalyze; i++) {
		const cohortStart = new Date();
		cohortStart.setDate(cohortStart.getDate() - (i + 1) * periodDays);

		const cohortEnd = new Date(cohortStart);
		cohortEnd.setDate(cohortEnd.getDate() + periodDays);

		// Get users in this cohort
		const cohortUsers = await db
			.select({ id: users.id, createdAt: users.createdAt })
			.from(users)
			.where(sql`${users.createdAt} >= ${cohortStart} AND ${users.createdAt} < ${cohortEnd}`);

		const cohortSize = cohortUsers.length;

		if (cohortSize === 0) continue;

		// Calculate retention for each period
		const retention: CohortRetention = {
			cohortDate: cohortStart.toISOString().split("T")[0],
			cohortSize,
			day0: cohortSize, // 100% on day 0
			day1: 0,
			day7: 0,
			day14: 0,
			day30: 0,
			day60: 0,
			day90: 0,
		};

		// Check retention for each user
		for (const user of cohortUsers) {
			const checks = await Promise.all([
				checkUserActiveOnDay(user.id, user.createdAt, 1),
				checkUserActiveOnDay(user.id, user.createdAt, 7),
				checkUserActiveOnDay(user.id, user.createdAt, 14),
				checkUserActiveOnDay(user.id, user.createdAt, 30),
				checkUserActiveOnDay(user.id, user.createdAt, 60),
				checkUserActiveOnDay(user.id, user.createdAt, 90),
			]);

			if (checks[0]) retention.day1++;
			if (checks[1]) retention.day7++;
			if (checks[2]) retention.day14++;
			if (checks[3]) retention.day30++;
			if (checks[4]) retention.day60++;
			if (checks[5]) retention.day90++;
		}

		cohorts.push(retention);
	}

	posthog.capture({
		distinctId: "system",
		event: "cohort_retention_calculated",
		properties: {
			cohort_type: cohortType,
			cohorts_analyzed: cohorts.length,
			timestamp: new Date().toISOString(),
		},
	});

	return cohorts;
}

/**
 * Get all retention metrics at once
 */
export async function getRetentionMetrics(): Promise<RetentionMetrics> {
	const [wau, mau, dau, stickiness, retentionCurve] = await Promise.all([
		calculateWAU(),
		calculateMAU(),
		calculateDAU(),
		calculateStickiness(),
		calculateRetentionCurve(),
	]);

	return {
		wau,
		mau,
		dau,
		stickiness,
		retentionCurve,
	};
}

/**
 * Track retention metrics on a schedule (run via cron)
 */
export async function trackRetentionMetrics() {
	try {
		const metrics = await getRetentionMetrics();

		posthog.capture({
			distinctId: "system",
			event: "daily_retention_metrics",
			properties: {
				...metrics,
				timestamp: new Date().toISOString(),
			},
		});

		console.log("Retention metrics tracked:", metrics);

		return metrics;
	} catch (error) {
		console.error("Failed to track retention metrics:", error);
		throw error;
	}
}
