"use client";

import { useState } from "react";
import { Link as LinkType } from "@/lib/db/schema";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import LinkEditor from "./LinkEditor";

interface LinkListProps {
  initialLinks: LinkType[];
  userId: string;
  isPro: boolean;
}

function SortableLinkItem({
  link,
  onEdit,
  onDelete,
  onToggle,
}: {
  link: LinkType;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4 border border-gray-200"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>

      {/* Link info */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {link.icon && <span className="text-lg">{link.icon}</span>}
          <h3 className="font-medium">{link.title}</h3>
          {!link.isActive && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Hidden</span>
          )}
        </div>
        <p className="text-sm text-gray-500 truncate">{link.url}</p>
        <p className="text-xs text-gray-400 mt-1">{link.clicks} clicks</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onToggle}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
        >
          {link.isActive ? "Hide" : "Show"}
        </button>
        <button
          onClick={onEdit}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function LinkList({ initialLinks, userId, isPro }: LinkListProps) {
  const [links, setLinks] = useState(initialLinks);
  const [editingLink, setEditingLink] = useState<LinkType | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = links.findIndex((link) => link.id === active.id);
      const newIndex = links.findIndex((link) => link.id === over.id);

      const newLinks = arrayMove(links, oldIndex, newIndex);
      setLinks(newLinks);

      // Update positions in database
      await fetch("/api/links/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          links: newLinks.map((link, index) => ({ id: link.id, position: index })),
        }),
      });
    }
  };

  const handleToggle = async (link: LinkType) => {
    const response = await fetch(`/api/links/${link.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !link.isActive }),
    });

    if (response.ok) {
      const updated = await response.json();
      setLinks(links.map((l) => (l.id === link.id ? updated : l)));
    }
  };

  const handleDelete = async (link: LinkType) => {
    if (!confirm(`Delete "${link.title}"?`)) return;

    const response = await fetch(`/api/links/${link.id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      setLinks(links.filter((l) => l.id !== link.id));
    }
  };

  const handleSave = async (linkData: Partial<LinkType>) => {
    if (editingLink) {
      // Update existing link
      const response = await fetch(`/api/links/${editingLink.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(linkData),
      });

      if (response.ok) {
        const updated = await response.json();
        setLinks(links.map((l) => (l.id === editingLink.id ? updated : l)));
        setEditingLink(null);
      }
    } else {
      // Create new link
      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...linkData,
          userId,
          position: links.length,
        }),
      });

      if (response.ok) {
        const newLink = await response.json();
        setLinks([...links, newLink]);
        setIsCreating(false);
      }
    }
  };

  const canAddLink = isPro || links.length < 5;

  return (
    <div className="space-y-6">
      {/* Add button */}
      {!isCreating && !editingLink && (
        <button
          onClick={() => canAddLink ? setIsCreating(true) : alert("Upgrade to Pro for unlimited links")}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
        >
          + Add Link
        </button>
      )}

      {/* Create/Edit form */}
      {(isCreating || editingLink) && (
        <LinkEditor
          link={editingLink}
          onSave={handleSave}
          onCancel={() => {
            setIsCreating(false);
            setEditingLink(null);
          }}
        />
      )}

      {/* Links list */}
      {links.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No links yet. Click &quot;Add Link&quot; to get started!</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {links.map((link) => (
                <SortableLinkItem
                  key={link.id}
                  link={link}
                  onEdit={() => setEditingLink(link)}
                  onDelete={() => handleDelete(link)}
                  onToggle={() => handleToggle(link)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
