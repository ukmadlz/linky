/**
 * Performance monitoring utilities for tracking Core Web Vitals and performance metrics
 */

import { posthogServer } from "./posthog";

/**
 * Core Web Vitals metrics
 */
export interface WebVitalsMetric {
	name: "FCP" | "LCP" | "CLS" | "FID" | "TTFB" | "INP";
	value: number;
	rating: "good" | "needs-improvement" | "poor";
	delta: number;
	id: string;
	navigationType: string;
}

/**
 * API performance metrics
 */
export interface APIPerformanceMetric {
	route: string;
	method: string;
	duration: number;
	status: number;
	timestamp: string;
	user_id?: string;
}

/**
 * Database query performance metrics
 */
export interface DBPerformanceMetric {
	operation: string;
	table: string;
	duration: number;
	query?: string;
	timestamp: string;
	user_id?: string;
}

/**
 * Track Web Vitals metric to PostHog (server-side)
 */
export async function trackWebVitalsMetric(
	metric: WebVitalsMetric,
	userId?: string
): Promise<void> {
	try {
		posthogServer.capture({
			distinctId: userId || "anonymous",
			event: "web_vitals",
			properties: {
				metric_name: metric.name,
				metric_value: metric.value,
				metric_rating: metric.rating,
				metric_delta: metric.delta,
				metric_id: metric.id,
				navigation_type: metric.navigationType,
				timestamp: new Date().toISOString(),
			},
		});
	} catch (error) {
		console.error("Failed to track Web Vitals metric:", error);
	}
}

/**
 * Track API response time
 */
export async function trackAPIPerformance(metric: APIPerformanceMetric): Promise<void> {
	try {
		// Determine if this is a slow request
		const isSlowRequest = metric.duration > 1000; // > 1 second
		const isVerySlowRequest = metric.duration > 5000; // > 5 seconds

		posthogServer.capture({
			distinctId: metric.user_id || "system",
			event: "api_performance",
			properties: {
				route: metric.route,
				method: metric.method,
				duration_ms: metric.duration,
				status: metric.status,
				is_slow: isSlowRequest,
				is_very_slow: isVerySlowRequest,
				timestamp: metric.timestamp,
			},
		});

		// Log slow requests
		if (isVerySlowRequest) {
			console.warn(
				`Very slow API request: ${metric.method} ${metric.route} - ${metric.duration}ms`
			);
		}
	} catch (error) {
		console.error("Failed to track API performance:", error);
	}
}

/**
 * Track database query performance
 */
export async function trackDBPerformance(metric: DBPerformanceMetric): Promise<void> {
	try {
		// Determine if this is a slow query
		const isSlowQuery = metric.duration > 100; // > 100ms
		const isVerySlowQuery = metric.duration > 1000; // > 1 second

		posthogServer.capture({
			distinctId: metric.user_id || "system",
			event: "db_performance",
			properties: {
				operation: metric.operation,
				table: metric.table,
				duration_ms: metric.duration,
				is_slow: isSlowQuery,
				is_very_slow: isVerySlowQuery,
				timestamp: metric.timestamp,
			},
		});

		// Log very slow queries
		if (isVerySlowQuery) {
			console.warn(
				`Very slow database query: ${metric.operation} on ${metric.table} - ${metric.duration}ms`
			);
		}
	} catch (error) {
		console.error("Failed to track DB performance:", error);
	}
}

/**
 * Measure and track API route performance
 */
export async function measureAPIPerformance<T>(
	route: string,
	method: string,
	operation: () => Promise<T>,
	userId?: string
): Promise<T> {
	const startTime = Date.now();
	let status = 200;

	try {
		const result = await operation();
		return result;
	} catch (error) {
		status = 500;
		throw error;
	} finally {
		const duration = Date.now() - startTime;
		await trackAPIPerformance({
			route,
			method,
			duration,
			status,
			timestamp: new Date().toISOString(),
			user_id: userId,
		});
	}
}

/**
 * Measure and track database query performance
 */
export async function measureDBPerformance<T>(
	operation: string,
	table: string,
	query: () => Promise<T>,
	userId?: string
): Promise<T> {
	const startTime = Date.now();

	try {
		const result = await query();
		return result;
	} finally {
		const duration = Date.now() - startTime;
		await trackDBPerformance({
			operation,
			table,
			duration,
			timestamp: new Date().toISOString(),
			user_id: userId,
		});
	}
}

/**
 * Get performance thresholds for different metrics
 */
export const PERFORMANCE_THRESHOLDS = {
	// Core Web Vitals (in milliseconds or score)
	FCP: { good: 1800, poor: 3000 },
	LCP: { good: 2500, poor: 4000 },
	CLS: { good: 0.1, poor: 0.25 },
	FID: { good: 100, poor: 300 },
	TTFB: { good: 800, poor: 1800 },
	INP: { good: 200, poor: 500 },

	// API response times (in milliseconds)
	API: { good: 200, slow: 1000, verySlow: 5000 },

	// Database query times (in milliseconds)
	DB: { good: 50, slow: 100, verySlow: 1000 },
} as const;

/**
 * Rate Web Vitals metric based on thresholds
 */
export function rateWebVitalsMetric(
	name: WebVitalsMetric["name"],
	value: number
): "good" | "needs-improvement" | "poor" {
	const threshold = PERFORMANCE_THRESHOLDS[name];
	if (!threshold) return "good";

	if (value <= threshold.good) return "good";
	if (value <= threshold.poor) return "needs-improvement";
	return "poor";
}
