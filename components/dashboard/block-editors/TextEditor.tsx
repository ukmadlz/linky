"use client";

import { useState } from "react";
import type { Block } from "@/lib/db/schema";
import type { TextBlockData } from "@/lib/blocks/schemas";

interface TextEditorProps {
  block: Block;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export function TextEditor({ block, onSave, onCancel }: TextEditorProps) {
  const initial = block.data as unknown as TextBlockData;
  const [content, setContent] = useState(initial.content ?? "");
  const [variant, setVariant] = useState<"heading" | "paragraph">(
    initial.variant ?? "paragraph"
  );
  const [align, setAlign] = useState<"left" | "center" | "right">(
    initial.align ?? "center"
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({ content, variant, align });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Variant
        </label>
        <div className="flex gap-2">
          {(["heading", "paragraph"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVariant(v)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                variant === v
                  ? "border-[#5f4dc5] bg-[#5f4dc5]/10 text-[#5f4dc5]"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Alignment
        </label>
        <div className="flex gap-2">
          {(["left", "center", "right"] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAlign(a)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                align === a
                  ? "border-[#5f4dc5] bg-[#5f4dc5]/10 text-[#5f4dc5]"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Content *
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Your text here…"
          required
          maxLength={5000}
          rows={4}
          className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#5f4dc5] focus:outline-none focus:ring-2 focus:ring-[#5f4dc5]/20"
        />
        <p className="mt-1 text-right text-xs text-slate-400">
          {content.length}/5000
        </p>
      </div>

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
