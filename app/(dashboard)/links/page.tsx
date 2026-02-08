import { redirect } from "next/navigation";
import LinkList from "@/components/dashboard/LinkList";
import { getLinksByUserId, getUserById } from "@/lib/db/queries";
import { getSessionFromCookie } from "@/lib/session-jwt";

export default async function LinksPage() {
	const session = await getSessionFromCookie();

	if (!session) {
		redirect("/login");
	}

	const user = await getUserById(session.userId);
	if (!user) {
		redirect("/login");
	}

	const links = await getLinksByUserId(user.id);

	return (
		<div className="max-w-4xl">
			<h1 className="text-3xl font-bold mb-2">Manage Links</h1>
			<p className="text-gray-600 mb-8">
				Add, edit, and reorder your links. {!user.isPro && `Free users can have up to 5 links.`}
			</p>

			<LinkList initialLinks={links} userId={user.id} isPro={user.isPro} />
		</div>
	);
}
