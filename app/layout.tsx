import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
	title: "Linky - Self-Hosted Link in Bio",
	description: "A self-hosted Linktree alternative",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body>
				<ErrorBoundary>
					<PostHogProvider>
						<AuthProvider>{children}</AuthProvider>
					</PostHogProvider>
				</ErrorBoundary>
			</body>
		</html>
	);
}
