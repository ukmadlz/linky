import { requireAuth } from "@/lib/auth";
import { getPagesByUserId, createPage, getAllBlocksByPageId } from "@/lib/db/queries";
import { PageEditor } from "@/components/dashboard/PageEditor";

export default async function DashboardPage() {
  const user = await requireAuth();

  // Fetch or create the user's page
  let pages = await getPagesByUserId(user.id);

  if (pages.length === 0) {
    const slug = user.username ?? `page-${user.id.slice(0, 8)}`;
    const page = await createPage({ userId: user.id, slug, title: "My Page" });
    pages = [page];
  }

  const page = pages[0];
  const blocks = await getAllBlocksByPageId(page.id);

  return (
    <div className="mx-auto max-w-3xl p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1
          className="font-display text-2xl font-semibold"
          style={{ color: "#292d4c" }}
        >
          Page Editor
        </h1>
        <a
          href={`/${page.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#292d4c] transition-colors hover:bg-slate-50"
        >
          View page ↗
        </a>
      </div>

      <PageEditor page={page} initialBlocks={blocks} />
    </div>
  );
}
