"use client";

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useCallback, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Block, Page } from "@/lib/db/schema";
import { BlockPalette } from "./BlockPalette";
import { SortableBlockItem } from "./SortableBlockItem";

interface PageEditorProps {
	page: Page;
	initialBlocks: Block[];
}

export function PageEditor({ page, initialBlocks }: PageEditorProps) {
	const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
	const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
	const [showPalette, setShowPalette] = useState(false);
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const { toast } = useToast();

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	// Debounced reorder save
	const scheduleReorder = useCallback(
		(orderedIds: string[]) => {
			if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
			saveTimeoutRef.current = setTimeout(async () => {
				setSaving(true);
				setSaveError(null);
				try {
					const res = await fetch(`/api/pages/${page.id}/blocks/reorder`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ orderedIds }),
					});
					if (!res.ok) {
						setSaveError("Failed to save order");
						toast({
							title: "Error",
							description: "Failed to save block order.",
							variant: "destructive",
						});
					}
				} catch {
					setSaveError("Failed to save order");
					toast({
						title: "Error",
						description: "Network error saving block order.",
						variant: "destructive",
					});
				} finally {
					setSaving(false);
				}
			}, 500);
		},
		[page.id, toast],
	);

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		setBlocks((prev) => {
			const oldIndex = prev.findIndex((b) => b.id === active.id);
			const newIndex = prev.findIndex((b) => b.id === over.id);
			const reordered = arrayMove(prev, oldIndex, newIndex);
			scheduleReorder(reordered.map((b) => b.id));
			return reordered;
		});
	}

	async function handleToggleVisibility(blockId: string) {
		const block = blocks.find((b) => b.id === blockId);
		if (!block) return;

		const newVisible = !block.isVisible;

		setBlocks((prev) =>
			prev.map((b) => (b.id === blockId ? { ...b, isVisible: newVisible } : b)),
		);

		try {
			await fetch(`/api/pages/${page.id}/blocks/${blockId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isVisible: newVisible }),
			});
		} catch {
			// Revert on failure
			setBlocks((prev) =>
				prev.map((b) =>
					b.id === blockId ? { ...b, isVisible: !newVisible } : b,
				),
			);
		}
	}

	async function handleDeleteBlock(blockId: string) {
		setBlocks((prev) => prev.filter((b) => b.id !== blockId));
		setEditingBlockId(null);

		try {
			await fetch(`/api/pages/${page.id}/blocks/${blockId}`, {
				method: "DELETE",
			});
		} catch {
			// If delete fails, we've already removed it from state — reload to reconcile
			window.location.reload();
		}
	}

	async function handleSaveBlock(
		blockId: string,
		data: Record<string, unknown>,
	) {
		setSaving(true);
		setSaveError(null);

		try {
			const res = await fetch(`/api/pages/${page.id}/blocks/${blockId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ data }),
			});

			if (!res.ok) {
				const body = await res.json();
				setSaveError(body.error || "Save failed");
				return;
			}

			const updated: Block = await res.json();
			setBlocks((prev) => prev.map((b) => (b.id === blockId ? updated : b)));
			setEditingBlockId(null);
			toast({ title: "Saved", description: "Block updated successfully." });
		} catch {
			setSaveError("Network error");
			toast({
				title: "Error",
				description: "Failed to save block.",
				variant: "destructive",
			});
		} finally {
			setSaving(false);
		}
	}

	async function handleAddBlock(
		type: Block["type"],
		defaultData: Record<string, unknown>,
	) {
		setShowPalette(false);

		const res = await fetch(`/api/pages/${page.id}/blocks`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ type, data: defaultData }),
		});

		if (!res.ok) return;

		const newBlock: Block = await res.json();
		setBlocks((prev) => [...prev, newBlock]);
		setEditingBlockId(newBlock.id);
	}

	return (
		<div>
			{/* Save indicator */}
			{(saving || saveError) && (
				<div
					className={`mb-4 rounded-lg px-4 py-2.5 text-sm ${
						saveError ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
					}`}
				>
					{saveError ?? "Saving…"}
				</div>
			)}

			{/* Block list */}
			<div className="rounded-xl border border-slate-200 bg-white shadow-sm">
				{blocks.length === 0 ? (
					<div className="py-16 text-center text-sm text-slate-400">
						No blocks yet. Add your first block below.
					</div>
				) : (
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
					>
						<SortableContext
							items={blocks.map((b) => b.id)}
							strategy={verticalListSortingStrategy}
						>
							<ul className="divide-y divide-slate-100">
								{blocks.map((block) => (
									<SortableBlockItem
										key={block.id}
										block={block}
										isEditing={editingBlockId === block.id}
										pageId={page.id}
										onEdit={() =>
											setEditingBlockId(
												editingBlockId === block.id ? null : block.id,
											)
										}
										onToggleVisibility={() => handleToggleVisibility(block.id)}
										onDelete={() => handleDeleteBlock(block.id)}
										onSave={(data) => handleSaveBlock(block.id, data)}
										onBlockUpdate={(updated) =>
											setBlocks((prev) =>
												prev.map((b) => (b.id === updated.id ? updated : b)),
											)
										}
									/>
								))}
							</ul>
						</SortableContext>
					</DndContext>
				)}

				{/* Add block button */}
				<div className="border-t border-slate-100 p-4">
					<button
						type="button"
						onClick={() => setShowPalette(true)}
						className="w-full rounded-lg border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-400 transition-colors hover:border-[#5f4dc5] hover:text-[#5f4dc5]"
					>
						+ Add block
					</button>
				</div>
			</div>

			{/* Block palette modal */}
			{showPalette && (
				<BlockPalette
					onAdd={handleAddBlock}
					onClose={() => setShowPalette(false)}
				/>
			)}
		</div>
	);
}
