"use client";

import { useState } from "react";
import type { Page } from "@/lib/db/schema";

interface SEOPanelProps {
  page: Page;
}

export function SEOPanel({ page }: SEOPanelProps) {
  const [seoTitle, setSeoTitle] = useState(page.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(page.seoDescription ?? "");
  const [ogImageUrl, setOgImageUrl] = useState(page.ogImageUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/pages/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seoTitle: seoTitle.trim() || null,
          seoDescription: seoDescription.trim() || null,
          ogImageUrl: ogImageUrl.trim() || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: body.error ?? "Failed to save." });
        return;
      }
      setMessage({ type: "success", text: "SEO settings saved." });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ type: "error", text: "Network error." });
    } finally {
      setSaving(false);
    }
  }

  const previewTitle = seoTitle || page.title || "My Page";
  const previewDesc = seoDescription || page.description || "Check out my Linky page.";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-[#292d4c]">SEO &amp; Social Sharing</h2>

      {/* Google-style preview */}
      <div className="mb-5 rounded-lg border border-slate-100 bg-slate-50 p-4">
        <p className="mb-1 text-xs font-medium text-slate-400 uppercase tracking-wide">Preview</p>
        <p className="text-sm font-medium text-[#1a0dab] truncate">{previewTitle}</p>
        <p className="text-xs text-[#006621] truncate">linky.page/{page.slug}</p>
        <p className="mt-1 text-sm text-slate-600 line-clamp-2">{previewDesc}</p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="seo-title" className="text-sm font-medium text-slate-700">
            SEO title
            <span className="ml-2 text-xs font-normal text-slate-400">
              ({seoTitle.length}/60)
            </span>
          </label>
          <input
            id="seo-title"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            placeholder={page.title ?? "My Page"}
            maxLength={200}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#5f4dc5] focus:outline-none focus:ring-2 focus:ring-[#5f4dc5]/20"
          />
          <p className="text-xs text-slate-400">Leave blank to use your page title.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="seo-desc" className="text-sm font-medium text-slate-700">
            SEO description
            <span className="ml-2 text-xs font-normal text-slate-400">
              ({seoDescription.length}/160)
            </span>
          </label>
          <textarea
            id="seo-desc"
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="A short description of your page…"
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#5f4dc5] focus:outline-none focus:ring-2 focus:ring-[#5f4dc5]/20"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="og-image" className="text-sm font-medium text-slate-700">
            OG image URL
          </label>
          <input
            id="og-image"
            type="url"
            value={ogImageUrl}
            onChange={(e) => setOgImageUrl(e.target.value)}
            placeholder="https://example.com/preview.jpg"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#5f4dc5] focus:outline-none focus:ring-2 focus:ring-[#5f4dc5]/20"
          />
          <p className="text-xs text-slate-400">
            Shown when your page is shared on social media. Recommended: 1200×630px.
          </p>
          {ogImageUrl && (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ogImageUrl} alt="OG preview" className="w-full max-h-32 object-cover" />
            </div>
          )}
        </div>

        {message && (
          <p
            className={`text-sm ${
              message.type === "success" ? "text-green-600" : "text-red-500"
            }`}
          >
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-lg bg-[#5f4dc5] px-5 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save SEO settings"}
        </button>
      </form>
    </div>
  );
}
