import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getLinksByUserId, getUserById } from "@/lib/db/queries";

export default async function DashboardPage() {
	const session = await auth.api.getSession({
		headers: await import("next/headers").then((m) => m.headers()),
	});

	if (!session) {
		redirect("/login");
	}

	const user = await getUserById(session.user.id);
	if (!user) {
		redirect("/login");
	}

	const links = await getLinksByUserId(user.id);
	const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);

	return (
		<div className="max-w-4xl">
			<h1 className="text-3xl font-bold mb-2">Dashboard</h1>
			<p className="text-gray-600 mb-8">Welcome back, {user.name || user.email}!</p>

			{/* Stats */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
				<div className="bg-white rounded-lg shadow-md p-6">
					<h3 className="text-sm font-medium text-gray-500 mb-2">Total Links</h3>
					<p className="text-3xl font-bold">{links.length}</p>
					<p className="text-xs text-gray-400 mt-1">
						{!user.isPro && `${5 - links.length} remaining on free plan`}
					</p>
				</div>

				<div className="bg-white rounded-lg shadow-md p-6">
					<h3 className="text-sm font-medium text-gray-500 mb-2">Total Clicks</h3>
					<p className="text-3xl font-bold">{totalClicks}</p>
					{!user.isPro && (
						<p className="text-xs text-blue-600 mt-1">Upgrade to Pro for analytics</p>
					)}
				</div>

				<div className="bg-white rounded-lg shadow-md p-6">
					<h3 className="text-sm font-medium text-gray-500 mb-2">Account Type</h3>
					<p className="text-3xl font-bold">{user.isPro ? "Pro" : "Free"}</p>
					{!user.isPro && (
						<Link
							href="/dashboard/settings"
							className="text-xs text-blue-600 hover:underline mt-1 block"
						>
							Upgrade to Pro
						</Link>
					)}
				</div>
			</div>

			{/* Quick Actions */}
			<div className="bg-white rounded-lg shadow-md p-6">
				<h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<Link
						href="/dashboard/links"
						className="p-4 border border-gray-200 rounded-md hover:border-blue-500 hover:bg-blue-50 transition-colors"
					>
						<h3 className="font-semibold mb-1">Manage Links</h3>
						<p className="text-sm text-gray-600">Add, edit, or reorder your links</p>
					</Link>

					<Link
						href="/dashboard/appearance"
						className="p-4 border border-gray-200 rounded-md hover:border-blue-500 hover:bg-blue-50 transition-colors"
					>
						<h3 className="font-semibold mb-1">Customize Appearance</h3>
						<p className="text-sm text-gray-600">Change colors, fonts, and style</p>
					</Link>

					<a
						href={`/${user.username}`}
						target="_blank"
						rel="noopener noreferrer"
						className="p-4 border border-gray-200 rounded-md hover:border-blue-500 hover:bg-blue-50 transition-colors"
					>
						<h3 className="font-semibold mb-1">View Your Page</h3>
						<p className="text-sm text-gray-600">See what others see</p>
					</a>

					<Link
						href="/dashboard/analytics"
						className="p-4 border border-gray-200 rounded-md hover:border-blue-500 hover:bg-blue-50 transition-colors"
					>
						<h3 className="font-semibold mb-1">Analytics {!user.isPro && "(Pro)"}</h3>
						<p className="text-sm text-gray-600">View detailed click statistics</p>
					</Link>
				</div>
			</div>
		</div>
	);
}
