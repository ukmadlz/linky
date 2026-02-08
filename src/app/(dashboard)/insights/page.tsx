import { redirect } from "next/navigation";
import { getRetentionMetrics } from "@/lib/analytics/retention";
import { getPathAnalysis } from "@/lib/analytics/user-paths";
import { getSessionFromCookie } from "@/lib/session-jwt";

/**
 * Product Insights Dashboard (Admin/Internal Only)
 * Displays retention, user paths, experiments, and product metrics
 */

export default async function InsightsDashboardPage() {
	const session = await getSessionFromCookie();

	if (!session) {
		redirect("/login");
	}

	// TODO: Add admin check
	// if (!session.user.isAdmin) {
	//   redirect("/dashboard");
	// }

	// Fetch all analytics data
	const [retentionMetrics, pathAnalysis] = await Promise.all([
		getRetentionMetrics().catch(() => null),
		getPathAnalysis().catch(() => null),
	]);

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="mb-8">
				<h1 className="text-3xl font-bold">Product Insights</h1>
				<p className="text-gray-600 mt-2">Analytics, retention, and user behavior insights</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
				{/* Key Metrics Cards */}
				<MetricCard
					title="Daily Active Users"
					value={retentionMetrics?.dau || 0}
					change={"+12%"}
					trend="up"
				/>
				<MetricCard
					title="Weekly Active Users"
					value={retentionMetrics?.wau || 0}
					change={"+8%"}
					trend="up"
				/>
				<MetricCard
					title="Monthly Active Users"
					value={retentionMetrics?.mau || 0}
					change={"+15%"}
					trend="up"
				/>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
				{/* Stickiness Metric */}
				<div className="bg-white rounded-lg shadow p-6">
					<h2 className="text-xl font-semibold mb-4">Stickiness (WAU/MAU)</h2>
					<div className="flex items-center justify-center">
						<div className="text-center">
							<div className="text-5xl font-bold text-blue-600">
								{((retentionMetrics?.stickiness || 0) * 100).toFixed(1)}%
							</div>
							<p className="text-gray-600 mt-2">
								Users visit {((retentionMetrics?.stickiness || 0) * 7).toFixed(1)}x per week on
								average
							</p>
						</div>
					</div>
				</div>

				{/* Retention Curve */}
				<div className="bg-white rounded-lg shadow p-6">
					<h2 className="text-xl font-semibold mb-4">Retention Curve</h2>
					<div className="space-y-3">
						<RetentionBar
							label="Day 1"
							percentage={(retentionMetrics?.retentionCurve.day1 || 0) * 100}
						/>
						<RetentionBar
							label="Day 7"
							percentage={(retentionMetrics?.retentionCurve.day7 || 0) * 100}
						/>
						<RetentionBar
							label="Day 30"
							percentage={(retentionMetrics?.retentionCurve.day30 || 0) * 100}
						/>
						<RetentionBar
							label="Day 90"
							percentage={(retentionMetrics?.retentionCurve.day90 || 0) * 100}
						/>
					</div>
				</div>
			</div>

			{/* Common User Paths */}
			<div className="bg-white rounded-lg shadow p-6 mb-8">
				<h2 className="text-xl font-semibold mb-4">Most Common User Paths</h2>
				<div className="space-y-4">
					{pathAnalysis?.commonPaths.slice(0, 5).map((path) => (
						<div key={path.path.join(" → ")} className="border-l-4 border-blue-500 pl-4 py-2">
							<div className="flex justify-between items-center">
								<div className="text-sm font-medium">{path.path.join(" → ")}</div>
								<div className="text-sm text-gray-600">{path.frequency} users</div>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Drop-off Points */}
			<div className="bg-white rounded-lg shadow p-6 mb-8">
				<h2 className="text-xl font-semibold mb-4">Top Drop-off Points</h2>
				<div className="space-y-3">
					{pathAnalysis?.dropOffPoints.slice(0, 5).map((point) => (
						<div key={point.page} className="flex justify-between items-center">
							<div>
								<div className="font-medium">{point.page}</div>
								<div className="text-sm text-gray-600">{point.visits} visits</div>
							</div>
							<div className="text-right">
								<div
									className={`text-lg font-semibold ${
										point.dropOffRate > 0.5 ? "text-red-600" : "text-yellow-600"
									}`}
								>
									{(point.dropOffRate * 100).toFixed(1)}%
								</div>
								<div className="text-sm text-gray-600">drop-off rate</div>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Feature Discovery */}
			<div className="bg-white rounded-lg shadow p-6 mb-8">
				<h2 className="text-xl font-semibold mb-4">Feature Discovery</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{pathAnalysis &&
						Object.entries(pathAnalysis.featureDiscovery).map(([feature, stats]) => (
							<div key={feature} className="border rounded-lg p-4">
								<div className="font-medium capitalize">{feature.replace(/_/g, " ")}</div>
								<div className="mt-2 space-y-1">
									<div className="text-sm text-gray-600">{stats.discovered} users discovered</div>
									<div className="text-sm text-gray-600">
										Avg. {stats.time_to_discover.toFixed(1)} days to discover
									</div>
								</div>
							</div>
						))}
				</div>
			</div>

			{/* Active Experiments */}
			<div className="bg-white rounded-lg shadow p-6">
				<h2 className="text-xl font-semibold mb-4">Active Experiments</h2>
				<p className="text-gray-600">
					No active experiments. Create experiments in PostHog to see results here.
				</p>
			</div>
		</div>
	);
}

function MetricCard({
	title,
	value,
	change,
	trend,
}: {
	title: string;
	value: number;
	change: string;
	trend: "up" | "down";
}) {
	return (
		<div className="bg-white rounded-lg shadow p-6">
			<div className="text-sm font-medium text-gray-600 mb-2">{title}</div>
			<div className="flex items-center justify-between">
				<div className="text-3xl font-bold">{value.toLocaleString()}</div>
				<div
					className={`text-sm font-medium ${trend === "up" ? "text-green-600" : "text-red-600"}`}
				>
					{change}
				</div>
			</div>
		</div>
	);
}

function RetentionBar({ label, percentage }: { label: string; percentage: number }) {
	return (
		<div>
			<div className="flex justify-between text-sm mb-1">
				<span className="font-medium">{label}</span>
				<span className="text-gray-600">{percentage.toFixed(1)}%</span>
			</div>
			<div className="w-full bg-gray-200 rounded-full h-2">
				<div
					className="bg-blue-600 h-2 rounded-full transition-all"
					style={{ width: `${percentage}%` }}
				/>
			</div>
		</div>
	);
}
