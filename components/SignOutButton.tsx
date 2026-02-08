"use client";

import { useRouter } from "next/navigation";

export default function SignOutButton() {
	const router = useRouter();

	const handleSignOut = async () => {
		try {
			const response = await fetch("/api/auth/logout", {
				method: "POST",
			});

			if (response.ok) {
				router.push("/");
				router.refresh();
			}
		} catch (error) {
			console.error("Logout error:", error);
		}
	};

	return (
		<button
			type="button"
			onClick={handleSignOut}
			className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
		>
			Sign Out
		</button>
	);
}
