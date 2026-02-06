import { auth } from "@/lib/auth";
import { getUserById } from "@/lib/db/queries";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await import("next/headers").then(m => m.headers()) });

  if (!session) {
    redirect("/login");
  }

  const user = await getUserById(session.user.id);

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
          <p className="text-gray-600 mb-6">Welcome back, {user.name || user.email}!</p>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-2">Your Profile</h2>
              <div className="text-sm text-gray-600">
                <p>Username: @{user.username}</p>
                <p>Email: {user.email}</p>
                <p>Pro: {user.isPro ? "Yes" : "No"}</p>
              </div>
            </div>

            <SignOutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
