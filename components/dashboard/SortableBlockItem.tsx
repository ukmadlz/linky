"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Link,
  Type,
  Play,
  Share2,
  Minus,
  Code2,
} from "lucide-react";
import type { Block } from "@/lib/db/schema";
import { BlockEditorForm } from "./BlockEditorForm";

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  link: Link,
  text: Type,
  embed: Play,
  social_icons: Share2,
  divider: Minus,
  custom_code: Code2,
};

const TYPE_LABELS: Record<string, string> = {
  link: "Link",
  text: "Text",
  embed: "Embed",
  social_icons: "Social Icons",
  divider: "Divider",
  custom_code: "Custom Code",
};

function blockPreview(block: Block): string {
  const data = block.data as Record<string, unknown>;
  switch (block.type) {
    case "link":
      return (data.title as string) || "Untitled link";
    case "text":
      return (data.content as string)?.slice(0, 60) || "Empty text";
    case "embed":
      return (data.providerName as string) || (data.originalUrl as string) || "Embed";
    case "social_icons":
      return `${(data.icons as unknown[])?.length ?? 0} icon(s)`;
    case "divider":
      return `Divider — ${data.style}`;
    case "custom_code":
      return "Custom HTML/CSS";
    default:
      return "";
  }
}

interface SortableBlockItemProps {
  block: Block;
  isEditing: boolean;
  pageId: string;
  onEdit: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
}

export function SortableBlockItem({
  block,
  isEditing,
  pageId,
  onEdit,
  onToggleVisibility,
  onDelete,
  onSave,
}: SortableBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = TYPE_ICONS[block.type] ?? Link;
  const label = TYPE_LABELS[block.type] ?? block.type;
  const preview = blockPreview(block);

  return (
    <li ref={setNodeRef} style={style} className="group">
      {/* Block row */}
      <div
        className={`flex items-center gap-3 px-4 py-3 ${
          isEditing ? "bg-slate-50" : "hover:bg-slate-50/50"
        } transition-colors duration-150`}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab touch-none text-slate-300 hover:text-slate-500"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Type icon */}
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
          <Icon className="h-4 w-4 text-slate-600" />
        </div>

        {/* Block info */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <p className="truncate text-sm font-medium text-[#292d4c]">{preview}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-shrink-0 items-center gap-1">
          {/* Visibility toggle */}
          <button
            onClick={onToggleVisibility}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            title={block.isVisible ? "Hide block" : "Show block"}
          >
            {block.isVisible ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </button>

          {/* Edit */}
          <button
            onClick={onEdit}
            className={`rounded-md p-1.5 transition-colors hover:bg-slate-100 ${
              isEditing ? "text-[#5f4dc5]" : "text-slate-400 hover:text-slate-700"
            }`}
            title="Edit block"
          >
            <Pencil className="h-4 w-4" />
          </button>

          {/* Delete */}
          <button
            onClick={() => {
              if (confirm("Delete this block?")) onDelete();
            }}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
            title="Delete block"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Inline editor form */}
      {isEditing && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 pb-4 pt-3">
          <BlockEditorForm block={block} onSave={onSave} onCancel={onEdit} />
        </div>
      )}
    </li>
  );
}
