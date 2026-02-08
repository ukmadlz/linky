"use client";

import Image from "next/image";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";
import type { Link, User } from "@/lib/db/schema";
import LinkButton from "./LinkButton";

interface LinkPageProps {
	user: User;
	links: Link[];
}

export default function LinkPage({ user, links }: LinkPageProps) {
	const posthog = usePostHog();

	useEffect(() => {
		// Track page view
		posthog?.capture("page_viewed", {
			username: user.username,
			linkCount: links.length,
		});
	}, [posthog, user.username, links.length]);
	const theme = user.theme ? JSON.parse(user.theme as string) : {};
	const backgroundColor = theme.backgroundColor || "#ffffff";
	const buttonColor = theme.buttonColor || "#000000";
	const buttonTextColor = theme.buttonTextColor || "#ffffff";
	const fontFamily = theme.fontFamily || "sans-serif";

	return (
		<div
			className="min-h-screen flex flex-col items-center justify-center p-6"
			style={{ backgroundColor, fontFamily }}
		>
			<div className="w-full max-w-2xl mx-auto">
				{/* Avatar */}
				{user.avatarUrl && (
					<div className="flex justify-center mb-4">
						<div className="relative w-24 h-24 rounded-full overflow-hidden">
							<Image
								src={user.avatarUrl}
								alt={user.name || user.username || "User avatar"}
								fill
								className="object-cover"
							/>
						</div>
					</div>
				)}

				{/* Name */}
				<h1 className="text-2xl font-bold text-center mb-2">{user.name || `@${user.username}`}</h1>

				{/* Bio */}
				{user.bio && <p className="text-center text-gray-600 mb-8 max-w-md mx-auto">{user.bio}</p>}

				{/* Links */}
				<div className="space-y-4">
					{links.length === 0 ? (
						<p className="text-center text-gray-500">No links yet</p>
					) : (
						links.map((link) => (
							<LinkButton
								key={link.id}
								link={link}
								buttonColor={buttonColor}
								buttonTextColor={buttonTextColor}
							/>
						))
					)}
				</div>

				{/* Footer */}
				{!user.isPro && (
					<div className="text-center mt-12 text-sm text-gray-500">
						<p>
							Powered by <span className="font-semibold">Linky</span>
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
