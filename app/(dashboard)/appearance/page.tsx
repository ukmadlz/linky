import { redirect } from "next/navigation";
import AppearanceEditor from "@/components/dashboard/AppearanceEditor";
import { getSessionFromCookie } from "@/lib/session-jwt";
import { getUserById } from "@/lib/db/queries";

export default async function AppearancePage() {
	const session = await getSessionFromCookie();

	if (!session) {
		redirect("/login");
	}

	const user = await getUserById(session.userId);
	if (!user) {
		redirect("/login");
	}

	return (
		<div className="max-w-6xl">
			<h1 className="text-3xl font-bold mb-2">Customize Appearance</h1>
			<p className="text-gray-600 mb-8">Personalize your page with colors, fonts, and styles.</p>

			<AppearanceEditor user={user} />
		</div>
	);
}
