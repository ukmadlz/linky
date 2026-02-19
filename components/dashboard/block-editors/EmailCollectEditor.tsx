"use client";

import { useState } from "react";
import type { Block } from "@/lib/db/schema";
import type { EmailCollectBlockData } from "@/lib/blocks/schemas";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PROVIDERS = [
  { value: "mailchimp", label: "Mailchimp" },
  { value: "kit", label: "Kit (ConvertKit)" },
  { value: "beehiiv", label: "Beehiiv" },
  { value: "substack", label: "Substack" },
  { value: "custom", label: "Custom / Other" },
] as const;

interface EmailCollectEditorProps {
  block: Block;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export function EmailCollectEditor({ block, onSave, onCancel }: EmailCollectEditorProps) {
  const initial = block.data as unknown as EmailCollectBlockData;
  const [provider, setProvider] = useState<string>(initial.provider ?? "custom");
  const [embedCode, setEmbedCode] = useState(initial.embedCode ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!embedCode.trim()) {
      setError("Embed code is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({ provider, embedCode: embedCode.trim() });
    } catch {
      setError("Failed to save.");
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Provider</Label>
        <Select value={provider} onValueChange={setProvider}>
          <SelectTrigger>
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {PROVIDERS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="embed-code">Embed Code</Label>
        <p className="text-xs text-slate-500">
          Paste the embed code from your email provider. This will be rendered as-is.
        </p>
        <textarea
          id="embed-code"
          value={embedCode}
          onChange={(e) => setEmbedCode(e.target.value)}
          rows={8}
          placeholder="<form>...</form>"
          className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#5f4dc5] resize-y"
        />
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
        Only paste embed code from trusted providers. Arbitrary HTML is rendered directly.
      </div>

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
