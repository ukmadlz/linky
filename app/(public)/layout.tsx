import { PostHogProvider } from "@/components/providers/PostHogProvider";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
	return <PostHogProvider>{children}</PostHogProvider>;
}
