import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { requireAuth } from "@/lib/auth";
import { Toaster } from "@/components/ui/toaster";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <PostHogProvider>
      <div className="flex min-h-screen">
        {/* Left sidebar (desktop) + mobile bottom nav */}
        <Sidebar />

        {/* Main content column */}
        <div className="flex flex-1 flex-col">
          {/* Top bar with user avatar + logout */}
          <TopBar user={user} />

          {/* Page content */}
          <main className="flex-1 overflow-auto bg-[#f7f5f4] pb-20 md:pb-0">
            {children}
          </main>
        </div>
      </div>
      <Toaster />
    </PostHogProvider>
  );
}
