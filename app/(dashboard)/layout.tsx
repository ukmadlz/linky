import { PostHogProvider } from "@/components/providers/PostHogProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Phase 7 — add full sidebar layout, top bar, auth protection
  // PostHogProvider is loaded here so it only runs on dashboard routes,
  // never on public pages.
  return (
    <PostHogProvider>
      <div className="min-h-screen bg-background">{children}</div>
    </PostHogProvider>
  );
}
