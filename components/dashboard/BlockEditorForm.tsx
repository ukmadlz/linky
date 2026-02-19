"use client";

import type { Block } from "@/lib/db/schema";
import { LinkEditor } from "./block-editors/LinkEditor";
import { TextEditor } from "./block-editors/TextEditor";
import { EmbedEditor } from "./block-editors/EmbedEditor";
import { SocialIconsEditor } from "./block-editors/SocialIconsEditor";
import { DividerEditor } from "./block-editors/DividerEditor";
import { CustomCodeEditor } from "./block-editors/CustomCodeEditor";

interface BlockEditorFormProps {
  block: Block;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export function BlockEditorForm({ block, onSave, onCancel }: BlockEditorFormProps) {
  switch (block.type) {
    case "link":
      return <LinkEditor block={block} onSave={onSave} onCancel={onCancel} />;
    case "text":
      return <TextEditor block={block} onSave={onSave} onCancel={onCancel} />;
    case "embed":
      return <EmbedEditor block={block} onSave={onSave} onCancel={onCancel} />;
    case "social_icons":
      return <SocialIconsEditor block={block} onSave={onSave} onCancel={onCancel} />;
    case "divider":
      return <DividerEditor block={block} onSave={onSave} onCancel={onCancel} />;
    case "custom_code":
      return <CustomCodeEditor block={block} onSave={onSave} onCancel={onCancel} />;
    default:
      return <p className="text-sm text-slate-500">Unknown block type</p>;
  }
}
