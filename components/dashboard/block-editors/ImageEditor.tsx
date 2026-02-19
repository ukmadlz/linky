"use client";

import { useState } from "react";
import type { Block } from "@/lib/db/schema";
import type { ImageBlockData } from "@/lib/blocks/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ImageEditorProps {
  block: Block;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export function ImageEditor({ block, onSave, onCancel }: ImageEditorProps) {
  const initial = block.data as unknown as ImageBlockData;
  const [url, setUrl] = useState(initial.url ?? "");
  const [alt, setAlt] = useState(initial.alt ?? "");
  const [linkUrl, setLinkUrl] = useState(initial.linkUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!url.trim()) {
      setError("Image URL is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({ url: url.trim(), alt: alt.trim(), linkUrl: linkUrl.trim() });
    } catch {
      setError("Failed to save.");
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="img-url">Image URL</Label>
        <Input
          id="img-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/photo.jpg"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="img-alt">Alt text</Label>
        <Input
          id="img-alt"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="Describe the image (for accessibility)"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="img-link">
          Link URL <span className="text-slate-400">(optional)</span>
        </Label>
        <Input
          id="img-link"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="https://example.com"
        />
      </div>

      {url && (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={alt} className="w-full max-h-48 object-cover" />
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
