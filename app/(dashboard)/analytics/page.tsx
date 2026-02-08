import { redirect } from "next/navigation";
import { getLinksByUserId, getUserById } from "@/lib/db/queries";
import { getSessionFromCookie } from "@/lib/session-jwt";

export default async function AnalyticsPage() {
	const session = await getSessionFromCookie();

	if (!session) {
		redirect("/login");
	}

	const user = await getUserById(session.userId);
	if (!user) {
		redirect("/login");
	}

	// Pro feature gate
	if (!user.isPro) {
		return (
			<div className="max-w-4xl">
				<h1 className="text-3xl font-bold mb-2">Analytics</h1>
				<p className="text-gray-600 mb-8">Detailed analytics are available on the Pro plan.</p>

				<div className="bg-white rounded-lg shadow-md p-8 text-center">
					<div className="mb-6">
						<svg
							className="w-16 h-16 mx-auto text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							role="img"
							aria-label="Analytics chart icon"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							/>
						</svg>
					</div>
					<h2 className="text-2xl font-bold mb-4">Upgrade to Pro</h2>
					<p className="text-gray-600 mb-6 max-w-md mx-auto">
						Track clicks over time, see top performing links, analyze traffic sources, and view
						geographic distribution.
					</p>
					<button
						type="button"
						className="bg-blue-600 text-white py-3 px-8 rounded-md hover:bg-blue-700 text-lg"
					>
						Upgrade to Pro - $9/month
					</button>
				</div>
			</div>
		);
	}

	const links = await getLinksByUserId(user.id);

	return (
		<div className="max-w-6xl">
			<h1 className="text-3xl font-bold mb-2">Analytics</h1>
			<p className="text-gray-600 mb-8">View detailed statistics about your links.</p>

			{/* Stats Overview */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
				<div className="bg-white rounded-lg shadow-md p-6">
					<h3 className="text-sm font-medium text-gray-500 mb-2">Total Clicks</h3>
					<p className="text-3xl font-bold">{links.reduce((sum, link) => sum + link.clicks, 0)}</p>
				</div>
				<div className="bg-white rounded-lg shadow-md p-6">
					<h3 className="text-sm font-medium text-gray-500 mb-2">Active Links</h3>
					<p className="text-3xl font-bold">{links.filter((l) => l.isActive).length}</p>
				</div>
				<div className="bg-white rounded-lg shadow-md p-6">
					<h3 className="text-sm font-medium text-gray-500 mb-2">Avg. Clicks/Link</h3>
					<p className="text-3xl font-bold">
						{links.length > 0
							? Math.round(links.reduce((sum, link) => sum + link.clicks, 0) / links.length)
							: 0}
					</p>
				</div>
				<div className="bg-white rounded-lg shadow-md p-6">
					<h3 className="text-sm font-medium text-gray-500 mb-2">This Month</h3>
					<p className="text-3xl font-bold">—</p>
					<p className="text-xs text-gray-400 mt-1">Coming with PostHog</p>
				</div>
			</div>

			{/* Top Links */}
			<div className="bg-white rounded-lg shadow-md p-6">
				<h2 className="text-xl font-semibold mb-4">Top Performing Links</h2>
				{links.length === 0 ? (
					<p className="text-gray-500 text-center py-8">No links yet</p>
				) : (
					<div className="space-y-3">
						{[...links]
							.sort((a, b) => b.clicks - a.clicks)
							.slice(0, 5)
							.map((link) => (
								<div
									key={link.id}
									className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
								>
									<div className="flex items-center gap-3">
										{link.icon && <span className="text-xl">{link.icon}</span>}
										<div>
											<h3 className="font-medium">{link.title}</h3>
											<p className="text-sm text-gray-500 truncate max-w-md">{link.url}</p>
										</div>
									</div>
									<div className="text-right">
										<p className="text-2xl font-bold">{link.clicks}</p>
										<p className="text-xs text-gray-500">clicks</p>
									</div>
								</div>
							))}
					</div>
				)}
			</div>

			{/* Coming Soon */}
			<div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
				<h3 className="text-lg font-semibold mb-2">Advanced Analytics Coming Soon</h3>
				<p className="text-gray-600">
					PostHog integration will provide detailed charts, traffic sources, and geographic data.
				</p>
			</div>
		</div>
	);
}
