"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Block } from "@/lib/db/schema";
import type { SocialIconsBlockData } from "@/lib/blocks/schemas";

const PLATFORMS = [
  "instagram",
  "twitter",
  "tiktok",
  "youtube",
  "github",
  "linkedin",
  "facebook",
  "twitch",
  "spotify",
  "soundcloud",
  "pinterest",
  "snapchat",
  "discord",
  "reddit",
  "website",
];

interface SocialIconsEditorProps {
  block: Block;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export function SocialIconsEditor({ block, onSave, onCancel }: SocialIconsEditorProps) {
  const initial = block.data as unknown as SocialIconsBlockData;
  const [icons, setIcons] = useState(
    initial.icons?.length ? initial.icons : [{ platform: "instagram", url: "" }]
  );
  const [size, setSize] = useState<"sm" | "md" | "lg">(initial.size ?? "md");
  const [style, setStyle] = useState<"filled" | "outline" | "monochrome">(
    initial.style ?? "monochrome"
  );
  const [saving, setSaving] = useState(false);

  function updateIcon(index: number, field: "platform" | "url", value: string) {
    setIcons((prev) =>
      prev.map((icon, i) => (i === index ? { ...icon, [field]: value } : icon))
    );
  }

  function addIcon() {
    setIcons((prev) => [...prev, { platform: "instagram", url: "" }]);
  }

  function removeIcon(index: number) {
    setIcons((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({ icons, size, style });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-xs font-medium text-slate-600">
          Social links
        </label>
        <div className="space-y-2">
          {icons.map((icon, i) => (
            <div key={i} className="flex gap-2">
              <select
                value={icon.platform}
                onChange={(e) => updateIcon(i, "platform", e.target.value)}
                className="w-36 rounded-lg border border-slate-200 px-2 py-2 text-sm capitalize"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <input
                type="url"
                value={icon.url}
                onChange={(e) => updateIcon(i, "url", e.target.value)}
                placeholder="https://..."
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#5f4dc5] focus:outline-none focus:ring-2 focus:ring-[#5f4dc5]/20"
              />
              {icons.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeIcon(i)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addIcon}
          className="mt-2 flex items-center gap-1.5 text-sm text-[#5f4dc5] hover:opacity-70"
        >
          <Plus className="h-4 w-4" />
          Add another
        </button>
      </div>

      <div className="flex gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Size
          </label>
          <div className="flex gap-1">
            {(["sm", "md", "lg"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium uppercase transition-colors ${
                  size === s
                    ? "border-[#5f4dc5] bg-[#5f4dc5]/10 text-[#5f4dc5]"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Style
          </label>
          <div className="flex gap-1">
            {(["filled", "outline", "monochrome"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStyle(s)}
                className={`rounded-lg border px-2 py-1.5 text-xs font-medium capitalize transition-colors ${
                  style === s
                    ? "border-[#5f4dc5] bg-[#5f4dc5]/10 text-[#5f4dc5]"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
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
