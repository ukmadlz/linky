"use client";

import { Link, Type, Play, Share2, Minus, Code2, X, Image, Mail, FolderOpen } from "lucide-react";
import { blockRegistry, blockTypes } from "@/lib/blocks/registry";
import type { Block } from "@/lib/db/schema";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Link,
  Type,
  Play,
  Share2,
  Minus,
  Code2,
  Image,
  Mail,
  FolderOpen,
};

interface BlockPaletteProps {
  onAdd: (type: Block["type"], defaultData: Record<string, unknown>) => void;
  onClose: () => void;
}

export function BlockPalette({ onAdd, onClose }: BlockPaletteProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#292d4c]">
            Add a block
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {blockTypes.map((type) => {
            const def = blockRegistry[type];
            const Icon = ICONS[def.icon] ?? Link;

            return (
              <button
                key={type}
                onClick={() => onAdd(type, def.defaultData)}
                className="flex flex-col items-center gap-2.5 rounded-xl border border-slate-200 p-4 text-center transition-all hover:border-[#5f4dc5] hover:bg-[#5f4dc5]/5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                  <Icon className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#292d4c]">
                    {def.label}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">
                    {def.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
