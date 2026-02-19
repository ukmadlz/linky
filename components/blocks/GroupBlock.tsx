"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { GroupBlockData } from "@/lib/blocks/schemas";
import type { Block } from "@/lib/db/schema";
import { BlockRenderer } from "./BlockRenderer";

interface GroupBlockProps {
	block: Block & { children?: Block[] };
	buttonStyle?: "filled" | "outline" | "soft" | "shadow";
}

export function GroupBlock({ block, buttonStyle = "filled" }: GroupBlockProps) {
	const data = block.data as unknown as GroupBlockData;
	const [collapsed, setCollapsed] = useState(data.isCollapsed ?? false);
	const children = block.children ?? [];

	return (
		<div className="w-full rounded-xl border border-[color:var(--text-color,#333)]/10 overflow-hidden">
			<button
				type="button"
				onClick={() => setCollapsed((c) => !c)}
				className="flex w-full items-center justify-between px-4 py-3 text-left font-medium text-[color:var(--text-color,#333)] hover:opacity-80 transition-opacity"
			>
				<span>{data.title || "Group"}</span>
				{collapsed ? (
					<ChevronRight className="h-4 w-4 flex-shrink-0 opacity-60" />
				) : (
					<ChevronDown className="h-4 w-4 flex-shrink-0 opacity-60" />
				)}
			</button>

			{!collapsed && children.length > 0 && (
				<div className="flex flex-col gap-3 px-4 pb-4">
					{children.map((child) => (
						<BlockRenderer
							key={child.id}
							block={child}
							buttonStyle={buttonStyle}
						/>
					))}
				</div>
			)}
		</div>
	);
}
