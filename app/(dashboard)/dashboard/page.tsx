"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, ExternalLink, BarChart2 } from "lucide-react";
import { CreatePageModal } from "@/components/dashboard/CreatePageModal";
import type { Page } from "@/lib/db/schema";

export default function DashboardPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetch("/api/pages")
      .then((r) => r.json())
      .then((data) => {
        setPages(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-[#292d4c]">
          My Pages
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-[#5f4dc5] px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          New page
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : pages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
          <p className="mb-4 text-sm text-slate-400">No pages yet.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-[#5f4dc5] px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
          >
            Create your first page
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pages.map((page) => (
            <div
              key={page.id}
              className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow"
            >
              {/* Page info */}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-[#292d4c]">
                  {page.title ?? page.slug}
                </p>
                <p className="truncate text-sm text-slate-400">
                  biohasl.ink/{page.slug}
                </p>
              </div>

              {/* Status badge */}
              <span
                className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  page.isPublished
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {page.isPublished ? "Published" : "Draft"}
              </span>

              {/* Actions */}
              <div className="flex flex-shrink-0 items-center gap-2">
                <Link
                  href={`/${page.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  title="View public page"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <Link
                  href={`/analytics?pageId=${page.id}`}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  title="Analytics"
                >
                  <BarChart2 className="h-4 w-4" />
                </Link>
                <Link
                  href={`/dashboard/${page.id}`}
                  className="rounded-lg bg-[#5f4dc5]/10 px-3 py-1.5 text-xs font-semibold text-[#5f4dc5] transition-colors hover:bg-[#5f4dc5]/20"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreatePageModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
