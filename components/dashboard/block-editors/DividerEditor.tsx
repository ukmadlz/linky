"use client";

import { useState } from "react";
import type { Block } from "@/lib/db/schema";
import type { DividerBlockData } from "@/lib/blocks/schemas";

interface DividerEditorProps {
  block: Block;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export function DividerEditor({ block, onSave, onCancel }: DividerEditorProps) {
  const initial = block.data as unknown as DividerBlockData;
  const [style, setStyle] = useState<"line" | "space" | "dots">(
    initial.style ?? "line"
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({ style });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-xs font-medium text-slate-600">
          Style
        </label>
        <div className="flex gap-2">
          {([
            { value: "line", label: "Line", preview: "━━━━━━━━" },
            { value: "space", label: "Space", preview: "· · ·" },
            { value: "dots", label: "Dots", preview: "• • •" },
          ] as const).map(({ value, label, preview }) => (
            <button
              key={value}
              type="button"
              onClick={() => setStyle(value)}
              className={`flex-1 rounded-lg border p-3 text-center text-sm transition-colors ${
                style === value
                  ? "border-[#5f4dc5] bg-[#5f4dc5]/10 text-[#5f4dc5]"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              <div className="mb-1 text-xs text-slate-400">{preview}</div>
              <div className="font-medium">{label}</div>
            </button>
          ))}
        </div>
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
