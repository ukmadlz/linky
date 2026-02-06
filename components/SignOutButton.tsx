"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export default function SignOutButton() {
	const router = useRouter();

	const handleSignOut = async () => {
		await signOut();
		router.push("/");
	};

	return (
		<button
			onClick={handleSignOut}
			className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
		>
			Sign Out
		</button>
	);
}
