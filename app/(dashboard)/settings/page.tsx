import { auth } from "@/lib/auth";
import { getUserById } from "@/lib/db/queries";
import { redirect } from "next/navigation";
import SettingsForm from "@/components/dashboard/SettingsForm";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await import("next/headers").then(m => m.headers()) });

  if (!session) {
    redirect("/login");
  }

  const user = await getUserById(session.user.id);
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Settings</h1>
      <p className="text-gray-600 mb-8">Manage your profile and account settings.</p>

      <SettingsForm user={user} />
    </div>
  );
}
