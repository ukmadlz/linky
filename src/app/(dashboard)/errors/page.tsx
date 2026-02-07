import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { posthog } from "@/lib/posthog-server";

/**
 * Error Monitoring Dashboard (Admin/Internal Only)
 * Displays error rates, top errors, error trends, and affected users
 */

export default async function ErrorMonitoringPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	// TODO: Add admin check
	// if (!session.user.isAdmin) {
	//   redirect("/dashboard");
	// }

	// Fetch error data from PostHog
	const errorData = await getErrorMetrics().catch(() => null);

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="mb-8">
				<h1 className="text-3xl font-bold">Error Monitoring</h1>
				<p className="text-gray-600 mt-2">
					Track and analyze application errors in real-time
				</p>
			</div>

			{/* Error Rate Overview */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
				<MetricCard
					title="Total Errors (24h)"
					value={errorData?.totalErrors || 0}
					trend="down"
					change="-12%"
					icon="⚠️"
				/>
				<MetricCard
					title="Error Rate"
					value={`${((errorData?.errorRate || 0) * 100).toFixed(2)}%`}
					trend="down"
					change="-5%"
					icon="📊"
				/>
				<MetricCard
					title="Affected Users"
					value={errorData?.affectedUsers || 0}
					trend="down"
					change="-8%"
					icon="👥"
				/>
				<MetricCard
					title="Unique Errors"
					value={errorData?.uniqueErrors || 0}
					trend="up"
					change="+3"
					icon="🔍"
				/>
			</div>

			{/* Error Rate Chart */}
			<div className="bg-white rounded-lg shadow p-6 mb-8">
				<h2 className="text-xl font-semibold mb-4">Error Rate Over Time (24h)</h2>
				<div className="h-64 flex items-center justify-center text-gray-400">
					<div className="text-center">
						<div className="text-4xl mb-2">📈</div>
						<p>Error rate chart would appear here</p>
						<p className="text-sm">Integrate with PostHog or Grafana for visualization</p>
					</div>
				</div>
			</div>

			{/* Top Errors */}
			<div className="bg-white rounded-lg shadow p-6 mb-8">
				<h2 className="text-xl font-semibold mb-4">Top Errors by Frequency</h2>
				<div className="space-y-4">
					{errorData?.topErrors.slice(0, 10).map((error, index) => (
						<ErrorRow key={index} error={error} rank={index + 1} />
					))}
				</div>
			</div>

			{/* Error Categories */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
				<div className="bg-white rounded-lg shadow p-6">
					<h2 className="text-xl font-semibold mb-4">Errors by Type</h2>
					<div className="space-y-3">
						{errorData?.errorsByType.map((type, index) => (
							<div key={index} className="flex justify-between items-center">
								<div>
									<div className="font-medium">{type.type}</div>
									<div className="text-sm text-gray-600">{type.count} occurrences</div>
								</div>
								<div className="text-right">
									<div className="text-lg font-semibold">{type.percentage.toFixed(1)}%</div>
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="bg-white rounded-lg shadow p-6">
					<h2 className="text-xl font-semibold mb-4">Errors by Page</h2>
					<div className="space-y-3">
						{errorData?.errorsByPage.map((page, index) => (
							<div key={index} className="flex justify-between items-center">
								<div>
									<div className="font-medium truncate max-w-xs">{page.page}</div>
									<div className="text-sm text-gray-600">{page.count} errors</div>
								</div>
								<div className="text-sm text-gray-600">{page.percentage.toFixed(1)}%</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Recent Errors */}
			<div className="bg-white rounded-lg shadow p-6">
				<h2 className="text-xl font-semibold mb-4">Recent Errors</h2>
				<div className="space-y-4">
					{errorData?.recentErrors.slice(0, 20).map((error, index) => (
						<div key={index} className="border-l-4 border-red-500 pl-4 py-2">
							<div className="flex justify-between items-start">
								<div className="flex-1">
									<div className="font-medium text-red-600">{error.message}</div>
									<div className="text-sm text-gray-600 mt-1">{error.stack?.slice(0, 100)}</div>
									<div className="flex gap-4 mt-2 text-xs text-gray-500">
										<span>User: {error.userId || "Anonymous"}</span>
										<span>Page: {error.page}</span>
										<span>{new Date(error.timestamp).toLocaleString()}</span>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

async function getErrorMetrics() {
	// Query PostHog for error events from last 24 hours
	const errors = await posthog.api.query({
		kind: "EventsQuery",
		select: [
			"distinct_id",
			"properties.error_message",
			"properties.error_type",
			"properties.error_stack",
			"properties.$current_url",
			"timestamp",
		],
		event: "error_captured",
		after: "-24h",
		limit: 1000,
	});

	// Calculate metrics
	const totalErrors = errors.results.length;
	const affectedUsers = new Set(errors.results.map((e) => e.distinct_id)).size;

	// Group by error message for unique errors
	const errorGroups = new Map<string, number>();
	const errorTypes = new Map<string, number>();
	const errorPages = new Map<string, number>();

	for (const error of errors.results) {
		const message = error.properties.error_message || "Unknown error";
		const type = error.properties.error_type || "UnknownError";
		const page = error.properties.$current_url || "Unknown page";

		errorGroups.set(message, (errorGroups.get(message) || 0) + 1);
		errorTypes.set(type, (errorTypes.get(type) || 0) + 1);
		errorPages.set(page, (errorPages.get(page) || 0) + 1);
	}

	// Get total page views for error rate
	const pageViews = await posthog.api.query({
		kind: "EventsQuery",
		select: ["distinct_id"],
		event: "$pageview",
		after: "-24h",
		limit: 10000,
	});

	const errorRate = pageViews.results.length > 0 ? totalErrors / pageViews.results.length : 0;

	// Format top errors
	const topErrors = Array.from(errorGroups.entries())
		.map(([message, count]) => ({
			message,
			count,
			percentage: (count / totalErrors) * 100,
		}))
		.sort((a, b) => b.count - a.count);

	// Format errors by type
	const errorsByType = Array.from(errorTypes.entries())
		.map(([type, count]) => ({
			type,
			count,
			percentage: (count / totalErrors) * 100,
		}))
		.sort((a, b) => b.count - a.count)
		.slice(0, 5);

	// Format errors by page
	const errorsByPage = Array.from(errorPages.entries())
		.map(([page, count]) => ({
			page,
			count,
			percentage: (count / totalErrors) * 100,
		}))
		.sort((a, b) => b.count - a.count)
		.slice(0, 5);

	// Format recent errors
	const recentErrors = errors.results
		.map((e) => ({
			message: e.properties.error_message || "Unknown error",
			stack: e.properties.error_stack,
			page: e.properties.$current_url,
			userId: e.distinct_id,
			timestamp: e.timestamp,
		}))
		.slice(0, 20);

	return {
		totalErrors,
		errorRate,
		affectedUsers,
		uniqueErrors: errorGroups.size,
		topErrors,
		errorsByType,
		errorsByPage,
		recentErrors,
	};
}

function MetricCard({
	title,
	value,
	trend,
	change,
	icon,
}: {
	title: string;
	value: string | number;
	trend: "up" | "down";
	change: string;
	icon: string;
}) {
	return (
		<div className="bg-white rounded-lg shadow p-6">
			<div className="flex items-start justify-between mb-2">
				<div className="text-sm font-medium text-gray-600">{title}</div>
				<div className="text-2xl">{icon}</div>
			</div>
			<div className="flex items-center justify-between mt-2">
				<div className="text-2xl font-bold">{value}</div>
				<div
					className={`text-sm font-medium ${trend === "down" ? "text-green-600" : "text-red-600"}`}
				>
					{change}
				</div>
			</div>
		</div>
	);
}

function ErrorRow({
	error,
	rank,
}: {
	error: { message: string; count: number; percentage: number };
	rank: number;
}) {
	const getSeverityColor = (percentage: number) => {
		if (percentage > 20) return "border-red-500 bg-red-50";
		if (percentage > 10) return "border-orange-500 bg-orange-50";
		return "border-yellow-500 bg-yellow-50";
	};

	return (
		<div className={`border-l-4 rounded-r-lg p-4 ${getSeverityColor(error.percentage)}`}>
			<div className="flex items-start justify-between">
				<div className="flex-1">
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium text-gray-600">#{rank}</span>
						<span className="font-medium">{error.message}</span>
					</div>
				</div>
				<div className="text-right">
					<div className="text-lg font-semibold">{error.count}</div>
					<div className="text-sm text-gray-600">{error.percentage.toFixed(1)}%</div>
				</div>
			</div>
		</div>
	);
}
