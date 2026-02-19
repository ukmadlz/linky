"use client";

import { useState } from "react";
import type { Block } from "@/lib/db/schema";
import type { GroupBlockData } from "@/lib/blocks/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface GroupEditorProps {
  block: Block;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export function GroupEditor({ block, onSave, onCancel }: GroupEditorProps) {
  const initial = block.data as unknown as GroupBlockData;
  const [title, setTitle] = useState(initial.title ?? "Group");
  const [isCollapsed, setIsCollapsed] = useState(initial.isCollapsed ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await onSave({ title: title.trim() || "Group", isCollapsed });
    } catch {
      setError("Failed to save.");
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="group-title">Section title</Label>
        <Input
          id="group-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Group"
          maxLength={200}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-slate-700">Collapsed by default</p>
          <p className="text-xs text-slate-400">Visitors will need to expand the section</p>
        </div>
        <Switch checked={isCollapsed} onCheckedChange={setIsCollapsed} />
      </div>

      <p className="text-xs text-slate-500">
        Add child blocks by creating new blocks — they will be placed under this group automatically when nested.
      </p>

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
