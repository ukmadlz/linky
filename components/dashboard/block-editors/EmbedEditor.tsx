"use client";

import { useState } from "react";
import type { Block } from "@/lib/db/schema";
import type { EmbedBlockData } from "@/lib/blocks/schemas";

interface EmbedEditorProps {
  block: Block;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export function EmbedEditor({ block, onSave, onCancel }: EmbedEditorProps) {
  const initial = block.data as unknown as EmbedBlockData;
  const [url, setUrl] = useState(initial.originalUrl ?? "");
  const [resolved, setResolved] = useState<EmbedBlockData | null>(
    initial.originalUrl ? initial : null
  );
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleResolve() {
    if (!url) return;
    setResolving(true);
    setError(null);
    try {
      const res = await fetch("/api/embeds/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        setError("Could not resolve embed. Check the URL and try again.");
        return;
      }
      const data: EmbedBlockData = await res.json();
      setResolved(data);
    } catch {
      setError("Network error resolving embed.");
    } finally {
      setResolving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resolved) {
      setError("Please resolve the embed first.");
      return;
    }
    setSaving(true);
    await onSave(resolved as unknown as Record<string, unknown>);
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Embed URL *
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setResolved(null);
            }}
            placeholder="Paste a YouTube, Spotify, Vimeo, or other URL"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#5f4dc5] focus:outline-none focus:ring-2 focus:ring-[#5f4dc5]/20"
          />
          <button
            type="button"
            onClick={handleResolve}
            disabled={!url || resolving}
            className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50"
          >
            {resolving ? "…" : "Resolve"}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {resolved && (
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="mb-1 text-xs text-slate-500">
            Provider: <strong>{resolved.providerName}</strong> ·{" "}
            {resolved.embedType}
          </p>
          {resolved.embedHtml ? (
            <div
              className="prose-sm max-w-full overflow-hidden rounded"
              dangerouslySetInnerHTML={{ __html: resolved.embedHtml }}
            />
          ) : resolved.iframeUrl ? (
            <iframe
              src={resolved.iframeUrl}
              className="w-full rounded"
              style={{
                aspectRatio: resolved.aspectRatio?.replace("/", " / ") || "16/9",
              }}
              loading="lazy"
              allowFullScreen
            />
          ) : (
            <p className="text-sm text-slate-500">{resolved.originalUrl}</p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !resolved}
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
