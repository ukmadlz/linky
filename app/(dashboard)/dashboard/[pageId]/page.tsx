import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { getPageById, getAllBlocksByPageId } from "@/lib/db/queries";
import { PageEditor } from "@/components/dashboard/PageEditor";
import { QRCodeButton } from "@/components/dashboard/QRCodeButton";

interface Props {
  params: Promise<{ pageId: string }>;
}

export default async function PageEditorRoute({ params }: Props) {
  const { pageId } = await params;
  const user = await requireAuth();

  const page = await getPageById(pageId);
  if (!page || page.userId !== user.id) notFound();

  const blocks = await getAllBlocksByPageId(page.id);

  return (
    <div className="mx-auto max-w-3xl p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-[#292d4c]"
        >
          <ChevronLeft className="h-4 w-4" />
          All pages
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-semibold text-[#292d4c]">
            {page.title ?? page.slug}
          </h1>
          <p className="text-sm text-slate-400">linky.page/{page.slug}</p>
        </div>
        <QRCodeButton slug={page.slug} pageTitle={page.title} />
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
