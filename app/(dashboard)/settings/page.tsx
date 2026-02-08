import { redirect } from "next/navigation";
import SettingsForm from "@/components/dashboard/SettingsForm";
import { getUserById } from "@/lib/db/queries";
import { getSessionFromCookie } from "@/lib/session-jwt";

export default async function SettingsPage() {
	const session = await getSessionFromCookie();

	if (!session) {
		redirect("/login");
	}

	const user = await getUserById(session.userId);
	if (!user) {
		redirect("/login");
	}

	return (
		<div className="max-w-4xl">
			<h1 className="text-3xl font-bold mb-2">Settings</h1>
			<p className="text-gray-600 mb-8">Manage your profile and account settings.</p>

			<SettingsForm user={user} />
		</div>
	);
}
