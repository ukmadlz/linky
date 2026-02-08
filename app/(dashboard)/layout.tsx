import Link from "next/link";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";
import { getUserById } from "@/lib/db/queries";
import { getSessionFromCookie } from "@/lib/session-jwt";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
	const session = await getSessionFromCookie();

	if (!session) {
		redirect("/login");
	}

	const user = await getUserById(session.userId);

	if (!user) {
		redirect("/login");
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Sidebar */}
			<aside className="fixed top-0 left-0 h-full w-64 bg-white shadow-md hidden lg:block">
				<div className="p-6">
					<h1 className="text-2xl font-bold mb-8">Linky</h1>

					<nav className="space-y-2">
						<Link href="/dashboard" className="block px-4 py-2 rounded-md hover:bg-gray-100">
							Dashboard
						</Link>
						<Link href="/dashboard/links" className="block px-4 py-2 rounded-md hover:bg-gray-100">
							Links
						</Link>
						<Link
							href="/dashboard/appearance"
							className="block px-4 py-2 rounded-md hover:bg-gray-100"
						>
							Appearance
						</Link>
						<Link
							href="/dashboard/analytics"
							className="block px-4 py-2 rounded-md hover:bg-gray-100"
						>
							Analytics {!user.isPro && <span className="text-xs text-blue-600">(Pro)</span>}
						</Link>
						<Link
							href="/dashboard/settings"
							className="block px-4 py-2 rounded-md hover:bg-gray-100"
						>
							Settings
						</Link>
					</nav>

					<div className="mt-8 p-4 bg-gray-50 rounded-md">
						<p className="text-sm font-medium mb-1">@{user.username || user.email.split("@")[0]}</p>
						<p className="text-xs text-gray-500 mb-3">{user.email}</p>
						<SignOutButton />
					</div>
				</div>
			</aside>

			{/* Mobile header */}
			<header className="lg:hidden bg-white shadow-md p-4">
				<div className="flex items-center justify-between">
					<h1 className="text-xl font-bold">Linky</h1>
					<div className="flex items-center gap-3">
						<div className="text-sm">@{user.username || user.email.split("@")[0]}</div>
						<SignOutButton />
					</div>
				</div>
			</header>

			{/* Main content */}
			<main className="lg:ml-64 p-6">{children}</main>
		</div>
	);
}
