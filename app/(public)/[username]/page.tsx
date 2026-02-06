import { notFound } from "next/navigation";
import { getUserByUsername, getActiveLinksByUserId } from "@/lib/db/queries";
import LinkPage from "@/components/LinkPage";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const revalidate = 3600; // 1 hour

// Generate static params for all users
export async function generateStaticParams() {
  try {
    const allUsers = await db.select({ username: users.username }).from(users);
    return allUsers.map((user) => ({
      username: user.username,
    }));
  } catch (error) {
    // Database not available during build, return empty array
    console.warn("Database not available for generateStaticParams:", error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    return {
      title: "User not found",
    };
  }

  return {
    title: `${user.name || user.username} | Linky`,
    description: user.bio || `Check out ${user.name || user.username}'s links`,
    openGraph: {
      title: user.name || user.username,
      description: user.bio || undefined,
      images: user.avatarUrl ? [user.avatarUrl] : undefined,
    },
  };
}

export default async function UsernamePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    notFound();
  }

  const links = await getActiveLinksByUserId(user.id);

  return <LinkPage user={user} links={links} />;
}
