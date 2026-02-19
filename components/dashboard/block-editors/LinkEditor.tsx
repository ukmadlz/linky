"use client";

import { useState } from "react";
import type { Block } from "@/lib/db/schema";
import type { LinkBlockData } from "@/lib/blocks/schemas";

interface LinkEditorProps {
  block: Block;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export function LinkEditor({ block, onSave, onCancel }: LinkEditorProps) {
  const initial = block.data as unknown as LinkBlockData;
  const [url, setUrl] = useState(initial.url ?? "");
  const [title, setTitle] = useState(initial.title ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(initial.thumbnailUrl ?? "");
  const [verificationEnabled, setVerificationEnabled] = useState(
    initial.verificationEnabled ?? false
  );
  const [verificationMode, setVerificationMode] = useState<
    "age" | "acknowledge"
  >(initial.verificationMode ?? "acknowledge");
  const [saving, setSaving] = useState(false);
  const [fetchingMeta, setFetchingMeta] = useState(false);

  async function handleUrlBlur() {
    if (!url || !url.startsWith("http") || title) return;
    setFetchingMeta(true);
    try {
      // Try to fetch page title from OG/meta via embed resolve endpoint
      const res = await fetch("/api/embeds/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        const data = await res.json();
        if (!title && data.providerName) setTitle(data.providerName);
      }
    } catch {
      // silently ignore
    } finally {
      setFetchingMeta(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      url,
      title,
      thumbnailUrl: thumbnailUrl || undefined,
      verificationEnabled,
      verificationMode: verificationEnabled ? verificationMode : undefined,
    });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          URL *
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={handleUrlBlur}
          placeholder="https://example.com"
          required
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#5f4dc5] focus:outline-none focus:ring-2 focus:ring-[#5f4dc5]/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={fetchingMeta ? "Fetching title…" : "Button label"}
          required
          maxLength={200}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#5f4dc5] focus:outline-none focus:ring-2 focus:ring-[#5f4dc5]/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Thumbnail URL (optional)
        </label>
        <input
          type="url"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#5f4dc5] focus:outline-none focus:ring-2 focus:ring-[#5f4dc5]/20"
        />
      </div>

      {/* Verification section */}
      <details className="rounded-lg border border-slate-200 p-3">
        <summary className="cursor-pointer text-xs font-medium text-slate-600">
          Verification settings
        </summary>
        <div className="mt-3 space-y-3">
          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={verificationEnabled}
              onChange={(e) => setVerificationEnabled(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            <span className="text-sm text-slate-700">
              Require verification before this link opens
            </span>
          </label>

          {verificationEnabled && (
            <div className="space-y-2 pl-6">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="verificationMode"
                  value="age"
                  checked={verificationMode === "age"}
                  onChange={() => setVerificationMode("age")}
                />
                <span className="text-sm text-slate-700">
                  Age gate (18+) — visitor must enter date of birth
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="verificationMode"
                  value="acknowledge"
                  checked={verificationMode === "acknowledge"}
                  onChange={() => setVerificationMode("acknowledge")}
                />
                <span className="text-sm text-slate-700">
                  Content warning — visitor must click to confirm
                </span>
              </label>
              <p className="text-xs text-slate-400">
                {verificationMode === "age"
                  ? "Visitors will see an age verification screen before being redirected."
                  : "Visitors will see a content warning before being redirected."}
              </p>
            </div>
          )}
        </div>
      </details>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#5f4dc5] px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
