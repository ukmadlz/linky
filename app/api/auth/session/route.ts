import { NextResponse } from "next/server";
import { getUserById } from "@/lib/db/queries";
import { getSession } from "@/lib/session";

export async function GET() {
	const session = await getSession();

	if (!session.userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const user = await getUserById(session.userId);
	if (!user) {
		return NextResponse.json({ error: "User not found" }, { status: 401 });
	}

	return NextResponse.json({
		user: {
			id: user.id,
			email: user.email,
			username: user.username,
			name: user.name,
			bio: user.bio,
			avatarUrl: user.avatarUrl,
			isPro: user.isPro,
		},
	});
}
